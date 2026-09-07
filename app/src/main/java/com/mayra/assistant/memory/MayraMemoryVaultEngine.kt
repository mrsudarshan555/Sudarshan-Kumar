package com.mayra.assistant.memory

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * The Central Long-Term Persistent Memory Engine for MAYRA on Android.
 *
 * Implements the 7 core memory behaviors ported from AI Memory Vault (Jared Rhodes, CC BY-SA 4.0):
 * 1. Root Memory Index (VAULT-INDEX.md & SQLite index mapping)
 * 2. Daily Notes (Automated daily notes, session logs, index bullets, yesterday backfill)
 * 3. Living User Profile (Operator facts, key people, preferences, auto-updates)
 * 4. Project Memory (Categorized project notes, status tracking, folder indexes)
 * 5. Jobs / Recurring Tasks (Master notes, boot chain, procedure, quality bar, compounding lessons)
 * 6. Memory Search & On-Demand Retrieval (Zero context window flooding; exact just-in-time retrieval)
 * 7. Self-Maintenance (Checkpoint persistence, deduplication, consolidating without accreting)
 */
class MayraMemoryVaultEngine private constructor(private val context: Context) {

    companion object {
        private const val TAG = "MayraMemoryVaultEngine"

        @Volatile
        private var instance: MayraMemoryVaultEngine? = null

        fun getInstance(context: Context): MayraMemoryVaultEngine {
            return instance ?: synchronized(this) {
                instance ?: MayraMemoryVaultEngine(context.applicationContext).also { instance = it }
            }
        }
    }

    private val db = MayraMemoryVaultDatabase.getInstance(context)
    private val filesystem = MayraMemoryVaultFilesystem(context)
    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var isBootstrapped = false

    init {
        engineScope.launch {
            bootstrapVault()
        }
    }

    /**
     * Bootstraps and synchronizes the memory vault upon application start.
     */
    suspend fun bootstrapVault(): Boolean = withContext(Dispatchers.IO) {
        if (isBootstrapped) return@withContext true
        try {
            val startTime = System.currentTimeMillis()

            // 1. Ensure filesystem structure
            filesystem.ensureVaultStructure()

            // 2. Ensure today's daily note exists
            filesystem.ensureTodayDailyNote()

            // 3. Index existing notes into SQLite database
            syncFilesystemToDatabase()

            // 4. Check yesterday's daily note for continuity
            checkYesterdayContinuity()

            isBootstrapped = true
            val elapsed = System.currentTimeMillis() - startTime
            Log.i(TAG, "MAYRA Memory Vault bootstrapped successfully in ${elapsed}ms")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to bootstrap Memory Vault: ${e.message}", e)
            false
        }
    }

    /**
     * Synchronizes Markdown files from disk into the SQLite relational database.
     */
    private fun syncFilesystemToDatabase() {
        val root = filesystem.getVaultRootDir()

        // Sync Root Index
        val vaultIndexContent = filesystem.readFile("VAULT-INDEX.md")
        if (vaultIndexContent != null) {
            db.upsertNote(
                filePath = "VAULT-INDEX.md",
                title = "VAULT INDEX",
                folder = "root",
                contentMarkdown = vaultIndexContent,
                type = "index",
                projectSlug = "meta",
                status = "active"
            )
            // Parse and sync living profile
            syncLivingProfileFromContent(vaultIndexContent)
        }

        // Sync Active Priorities
        val prioritiesContent = filesystem.readFile("Active Priorities.md")
        if (prioritiesContent != null) {
            db.upsertNote(
                filePath = "Active Priorities.md",
                title = "Active Priorities",
                folder = "root",
                contentMarkdown = prioritiesContent,
                type = "plan",
                projectSlug = "meta",
                status = "active"
            )
            syncPrioritiesFromContent(prioritiesContent)
        }

        // Sync Jobs
        val jobsDir = File(root, "06 - Resources/Jobs")
        if (jobsDir.exists() && jobsDir.isDirectory) {
            jobsDir.listFiles()?.forEach { file ->
                if (file.isFile && file.name.endsWith(".md")) {
                    val content = file.readText()
                    val title = file.nameWithoutExtension
                    val jobId = title.lowercase().replace("[^a-z0-9]+".toRegex(), "-")
                    db.upsertJob(
                        jobId = jobId,
                        name = title,
                        projectSlug = "android-system",
                        bootChain = listOf("This note", "[[VAULT-INDEX]]", "[[Active Priorities]]"),
                        procedure = extractSection(content, "## The procedure"),
                        qualityBar = extractSection(content, "## Quality bar"),
                        lessons = extractSection(content, "## Lessons"),
                        status = "active"
                    )
                    db.insertIndexEntry(
                        tag = "#job-$jobId",
                        category = "job",
                        source = "MAYRA",
                        summary = "Recurring task skill: $title",
                        targetFile = "06 - Resources/Jobs/${file.name}"
                    )
                }
            }
        }
    }

    private fun extractSection(markdown: String, sectionHeader: String): String {
        val start = markdown.indexOf(sectionHeader)
        if (start == -1) return ""
        val nextHeader = markdown.indexOf("\n## ", start + sectionHeader.length)
        return if (nextHeader == -1) {
            markdown.substring(start + sectionHeader.length).trim()
        } else {
            markdown.substring(start + sectionHeader.length, nextHeader).trim()
        }
    }

    private fun syncLivingProfileFromContent(content: String) {
        val whoIAm = extractSection(content, "## Who I Am")
        if (whoIAm.isNotBlank()) db.setProfileSection("Who I Am", whoIAm)

        val keyPeople = extractSection(content, "## Key People")
        if (keyPeople.isNotBlank()) db.setProfileSection("Key People", keyPeople)

        val howIThink = extractSection(content, "## How I Think")
        if (howIThink.isNotBlank()) db.setProfileSection("How I Think", howIThink)

        val preferences = extractSection(content, "## My Preferences for Working with AI")
        if (preferences.isNotBlank()) db.setProfileSection("Preferences", preferences)
    }

    private fun syncPrioritiesFromContent(content: String) {
        val lines = content.lines()
        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
                val isDone = trimmed.startsWith("- [x]")
                val taskBody = trimmed.removePrefix("- [ ]").removePrefix("- [x]").trim()
                val id = "priority-" + Math.abs(taskBody.hashCode())
                val projectSlug = if (taskBody.startsWith("[")) {
                    taskBody.substringAfter("[").substringBefore("]")
                } else {
                    "general"
                }
                db.addActivePriority(id, taskBody, projectSlug)
                if (isDone) {
                    db.togglePriority(id, true)
                }
            }
        }
    }

    private fun checkYesterdayContinuity() {
        val yesterdayPath = filesystem.getYesterdayDailyNotePath()
        val yesterdayContent = filesystem.readFile(yesterdayPath)
        if (yesterdayContent == null) {
            Log.d(TAG, "No daily note for yesterday found at $yesterdayPath (or already archived).")
        } else {
            Log.d(TAG, "Found yesterday's daily note; verified session continuity.")
        }
    }

    // =========================================================================
    // BEHAVIOR 1: Root Memory Index
    // =========================================================================

    fun getRootMemoryIndex(): String {
        return filesystem.readFile("VAULT-INDEX.md") ?: ""
    }

    fun getIndexEntries(): List<VaultIndexItem> {
        return db.getAllIndexEntries()
    }

    // =========================================================================
    // BEHAVIOR 2: Daily Notes & Automated Session Logging
    // =========================================================================

    fun getTodayDailyNote(): String {
        val path = filesystem.getTodayDailyNotePath()
        return filesystem.readFile(path) ?: ""
    }

    /**
     * Appends a session entry to today's daily note, strictly adhering to the template format.
     */
    suspend fun logDailySession(
        topic: String,
        whatGotDone: List<String>,
        stillInProgress: List<String>,
        decisionsMade: List<String>,
        notesTouched: List<String>,
        profileUpdates: List<String>
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val path = filesystem.getTodayDailyNotePath()
            var currentContent = filesystem.readFile(path)
            if (currentContent == null) {
                filesystem.ensureTodayDailyNote()
                currentContent = filesystem.readFile(path) ?: ""
            }

            val timeFormat = SimpleDateFormat("h:mm a", Locale.US)
            val currentTime = timeFormat.format(Date())

            // Count existing sessions
            val sessionMatchCount = Regex("## Session (\\d+)").findAll(currentContent).count()
            val newSessionNumber = sessionMatchCount + 1

            // 1. Format Session Body
            val sb = StringBuilder()
            sb.append("\n\n## Session $newSessionNumber — $currentTime: $topic\n")
            sb.append("### What Got Done\n")
            if (whatGotDone.isEmpty()) sb.append("- None noted.\n")
            else whatGotDone.forEach { sb.append("- $it\n") }

            sb.append("\n### What's Still In Progress\n")
            if (stillInProgress.isEmpty()) sb.append("- None.\n")
            else stillInProgress.forEach { sb.append("- $it\n") }

            sb.append("\n### Decisions Made\n")
            if (decisionsMade.isEmpty()) sb.append("- None.\n")
            else decisionsMade.forEach { sb.append("- $it\n") }

            sb.append("\n### Notes Touched\n")
            if (notesTouched.isEmpty()) sb.append("- None.\n")
            else notesTouched.forEach { sb.append("- [[$it]]\n") }

            sb.append("\n### Profile Updates\n")
            if (profileUpdates.isEmpty()) sb.append("- None.\n")
            else profileUpdates.forEach { sb.append("- $it\n") }

            // 2. Update the Index section at the top
            val outcomeBullet = if (whatGotDone.isNotEmpty()) whatGotDone.first() else topic
            val indexBullet = "- **$topic** — $outcomeBullet\n"

            val updatedContent = if (currentContent.contains("## Index")) {
                currentContent.replaceFirst("## Index\n", "## Index\n$indexBullet") + sb.toString()
            } else {
                currentContent + sb.toString()
            }

            filesystem.writeFile(path, updatedContent)

            // 3. Record in SQLite table
            db.logDailySession(
                dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()),
                sessionNumber = newSessionNumber,
                topic = topic,
                whatDone = whatGotDone.joinToString("; "),
                stillInProgress = stillInProgress.joinToString("; "),
                decisions = decisionsMade.joinToString("; "),
                notesTouched = notesTouched.joinToString("; "),
                profileUpdates = profileUpdates.joinToString("; ")
            )

            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to log daily session: ${e.message}", e)
            false
        }
    }

    // =========================================================================
    // BEHAVIOR 3: Living User Profile
    // =========================================================================

    fun getLivingProfile(): Map<String, String> {
        return db.getProfileSections()
    }

    suspend fun updateProfileFact(sectionName: String, newFact: String): Boolean = withContext(Dispatchers.IO) {
        try {
            db.setProfileSection(sectionName, newFact)

            // Update in VAULT-INDEX.md
            val indexContent = filesystem.readFile("VAULT-INDEX.md") ?: ""
            val targetSection = "## $sectionName"
            if (indexContent.contains(targetSection)) {
                val start = indexContent.indexOf(targetSection)
                val next = indexContent.indexOf("\n## ", start + targetSection.length)
                val updatedIndex = if (next == -1) {
                    indexContent.substring(0, start + targetSection.length) + "\n" + newFact
                } else {
                    indexContent.substring(0, start + targetSection.length) + "\n" + newFact + "\n" + indexContent.substring(next)
                }
                filesystem.writeFile("VAULT-INDEX.md", updatedIndex)
            }

            // Auto checkpoint to daily note
            logDailySession(
                topic = "Living Profile Updated: $sectionName",
                whatGotDone = listOf("Updated $sectionName in Living Profile: $newFact"),
                stillInProgress = emptyList(),
                decisionsMade = listOf("Persisted new operator preference without forgetting."),
                notesTouched = listOf("VAULT-INDEX"),
                profileUpdates = listOf("$sectionName updated: $newFact")
            )

            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update profile fact: ${e.message}", e)
            false
        }
    }

    // =========================================================================
    // BEHAVIOR 4: Project Memory
    // =========================================================================

    fun getAllNotes(): List<VaultNoteItem> {
        return db.getAllNotes()
    }

    fun getActivePriorities(includeDone: Boolean = false): List<ActivePriorityItem> {
        return db.getActivePriorities(includeDone)
    }

    fun togglePriority(id: String, isDone: Boolean) {
        db.togglePriority(id, isDone)
    }

    // =========================================================================
    // BEHAVIOR 5: Jobs / Recurring Tasks
    // =========================================================================

    fun getAllJobs(): List<VaultJobItem> {
        return db.getAllJobs()
    }

    fun getJob(jobId: String): VaultJobItem? {
        return db.getJob(jobId)
    }

    suspend fun foldLessonIntoJob(jobId: String, newLesson: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val job = db.getJob(jobId) ?: return@withContext false
            val updatedLessons = if (job.lessons.isBlank()) "- $newLesson" else "${job.lessons}\n- $newLesson"

            db.upsertJob(
                jobId = job.jobId,
                name = job.name,
                projectSlug = job.projectSlug,
                bootChain = job.bootChain,
                procedure = job.procedure,
                qualityBar = job.qualityBar,
                lessons = updatedLessons,
                status = job.status
            )

            // Update Job Markdown file on disk
            val fileName = "${job.name}.md"
            val jobFileContent = filesystem.readFile("06 - Resources/Jobs/$fileName")
            if (jobFileContent != null && jobFileContent.contains("## Lessons")) {
                val updatedContent = jobFileContent + "\n- $newLesson"
                filesystem.writeFile("06 - Resources/Jobs/$fileName", updatedContent)
            }

            Log.i(TAG, "Folded correction lesson into Job '$jobId': $newLesson")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fold lesson into job: ${e.message}", e)
            false
        }
    }

    // =========================================================================
    // BEHAVIOR 6: Memory-on-Demand (Precise, Just-In-Time Context Retrieval)
    // =========================================================================

    /**
     * Resolves context strictly on demand.
     * Rather than flooding the context window with the entire vault,
     * this queries the SQLite index and retrieves only the exact notes,
     * living profile facts, active priorities, and job boot-chains relevant to the user query!
     */
    suspend fun retrieveMemoryOnDemand(query: String): MemoryContextResult = withContext(Dispatchers.IO) {
        val qLower = query.lowercase().trim()

        // 1. Living Profile Snippet
        val profile = db.getProfileSections()
        val whoIAm = profile["Who I Am"] ?: "Alex (Primary Operator)"
        val preferences = profile["Preferences"] ?: "Direct, concise, no flattery."

        // 2. Open Active Priorities
        val openPriorities = db.getActivePriorities(includeDone = false)
            .take(4)
            .map { "[${it.projectSlug}] ${it.task}" }

        // 3. Match Jobs (e.g. "message", "whatsapp", "sms", "briefing", "scanner")
        var matchedJob: VaultJobItem? = null
        if (qLower.contains("message") || qLower.contains("sms") || qLower.contains("whatsapp") || qLower.contains("bhejo")) {
            matchedJob = db.getJob("send-safe-message")
        } else if (qLower.contains("briefing") || qLower.contains("morning") || qLower.contains("update")) {
            matchedJob = db.getJob("daily-briefing")
        }

        // 4. Match Notes from Database Index
        val matchedNotes = db.searchNotes(qLower)
            .filter { it.filePath != "VAULT-INDEX.md" }
            .take(3)
            .map { "Note [[${it.title}]]: ${it.contentMarkdown.take(300)}..." }

        // 5. Matched Index Tags
        val indexTags = db.searchIndex(qLower)
            .take(3)
            .map { "${it.tag} -> ${it.summary}" }

        // 6. Build the lean, high-signal System Prompt Context Block
        val promptBlock = StringBuilder()
        promptBlock.append("=== MAYRA MEMORY-ON-DEMAND (AI MEMORY VAULT) ===\n")
        promptBlock.append("Operator Profile: $whoIAm\n")
        promptBlock.append("Preferences: $preferences\n")

        if (openPriorities.isNotEmpty()) {
            promptBlock.append("Active Priorities:\n")
            openPriorities.forEach { promptBlock.append("  - $it\n") }
        }

        if (matchedJob != null) {
            promptBlock.append("Loaded Job Skill: [[${matchedJob.name}]]\n")
            promptBlock.append("  Procedure: ${matchedJob.procedure.take(200)}\n")
            promptBlock.append("  Quality Bar: ${matchedJob.qualityBar.take(150)}\n")
            if (matchedJob.lessons.isNotBlank()) {
                promptBlock.append("  Compounded Lessons: ${matchedJob.lessons.take(150)}\n")
            }
        }

        if (matchedNotes.isNotEmpty()) {
            promptBlock.append("Relevant Context Notes:\n")
            matchedNotes.forEach { promptBlock.append("  $it\n") }
        }
        promptBlock.append("================================================\n")

        MemoryContextResult(
            promptInjection = promptBlock.toString(),
            matchedJobName = matchedJob?.name,
            matchedNotesCount = matchedNotes.size,
            activePrioritiesCount = openPriorities.size,
            indexTags = indexTags
        )
    }

    // =========================================================================
    // BEHAVIOR 7: Self-Maintenance & Checkpoint Persistence
    // =========================================================================

    /**
     * Checkpoint persistence mandate:
     * When any task or state changes that a future session must know,
     * persist it without being asked:
     * - Writes to the relevant note
     * - Records the session in today's daily note
     * - Keeps the index map true in SQLite
     */
    suspend fun executeCheckpointPersistence(
        topic: String,
        outcome: String,
        touchedNotePath: String?,
        noteAddition: String?
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            // 1. If note addition is provided, update or consolidate note
            if (!touchedNotePath.isNullOrBlank() && !noteAddition.isNullOrBlank()) {
                val existing = filesystem.readFile(touchedNotePath) ?: ""
                val updated = if (existing.isBlank()) {
                    """
                    ---
                    status: active
                    project: general
                    type: reference
                    ---
                    # $touchedNotePath
                    $noteAddition
                    """.trimIndent()
                } else {
                    "$existing\n- $noteAddition"
                }
                filesystem.writeFile(touchedNotePath, updated)
                db.upsertNote(
                    filePath = touchedNotePath,
                    title = touchedNotePath.substringAfterLast("/").removeSuffix(".md"),
                    folder = touchedNotePath.substringBefore("/", "root"),
                    contentMarkdown = updated,
                    type = "reference",
                    projectSlug = "general",
                    status = "active"
                )
            }

            // 2. Log in today's daily note
            val touchedList = if (touchedNotePath != null) listOf(touchedNotePath) else emptyList()
            logDailySession(
                topic = topic,
                whatGotDone = listOf(outcome),
                stillInProgress = emptyList(),
                decisionsMade = listOf("Persisted state checkpoint automatically."),
                notesTouched = touchedList,
                profileUpdates = emptyList()
            )

            // 3. Add to SQLite Vault Index
            val tag = "#" + topic.lowercase().replace("[^a-z0-9]+".toRegex(), "-")
            db.insertIndexEntry(
                tag = tag,
                category = "session",
                source = "MAYRA",
                summary = outcome,
                targetFile = filesystem.getTodayDailyNotePath()
            )

            Log.i(TAG, "Self-maintenance checkpoint completed: $topic -> $outcome")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to execute checkpoint persistence: ${e.message}", e)
            false
        }
    }
}

data class MemoryContextResult(
    val promptInjection: String,
    val matchedJobName: String?,
    val matchedNotesCount: Int,
    val activePrioritiesCount: Int,
    val indexTags: List<String>
)
