package com.mayra.assistant.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.memory.*
import com.mayra.assistant.ui.theme.*
import kotlinx.coroutines.launch

/**
 * MAYRA Persistent AI Memory Vault Screen (Jetpack Compose)
 *
 * Grounded in AI Memory Vault reference implementation (Jared Rhodes, CC BY-SA 4.0).
 *
 * Provides real-time interactive inspection & management of:
 * - Root Memory Index (VAULT-INDEX.md & system map)
 * - Living User Profile (Operator facts, key people, AI working preferences)
 * - Daily Notes (Session timeline, what got done, notes touched)
 * - Active Priorities (Interactive project task checklist)
 * - Jobs / Recurring Tasks (Procedures, quality bars, compounding lessons)
 * - Memory-on-Demand Retrieval Tester
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemoriesScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val memoryEngine = remember { MayraMemoryVaultEngine.getInstance(context) }

    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("Index & Map", "Living Profile", "Daily Notes", "Active Priorities", "Jobs", "On-Demand")

    // State holders
    var rootIndexText by remember { mutableStateOf("") }
    var todayDailyText by remember { mutableStateOf("") }
    var profileMap by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var prioritiesList by remember { mutableStateOf<List<ActivePriorityItem>>(emptyList()) }
    var jobsList by remember { mutableStateOf<List<VaultJobItem>>(emptyList()) }
    var notesList by remember { mutableStateOf<List<VaultNoteItem>>(emptyList()) }

    // Search / On-demand test state
    var onDemandQuery by remember { mutableStateOf("Send message to Dad") }
    var onDemandResult by remember { mutableStateOf<MemoryContextResult?>(null) }
    var isRetrieving by remember { mutableStateOf(false) }

    // Dialog state for adding fact/checkpoint
    var showAddDialog by remember { mutableStateOf(false) }
    var newTopicText by remember { mutableStateOf("") }
    var newOutcomeText by remember { mutableStateOf("") }

    // Reload function
    fun reloadData() {
        coroutineScope.launch {
            rootIndexText = memoryEngine.getRootMemoryIndex()
            todayDailyText = memoryEngine.getTodayDailyNote()
            profileMap = memoryEngine.getLivingProfile()
            prioritiesList = memoryEngine.getActivePriorities(includeDone = true)
            jobsList = memoryEngine.getAllJobs()
            notesList = memoryEngine.getAllNotes()
        }
    }

    LaunchedEffect(Unit) {
        reloadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "MAYRA Memory Vault",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White,
                                fontWeight = FontWeight.Bold
                            )
                            Surface(
                                color = CyanAccent.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    "CC BY-SA 4.0",
                                    color = CyanBright,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            "Persistent Android SQLite & Markdown Vault",
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { reloadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Reload", tint = CyanBright)
                    }
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "New Checkpoint", tint = CyanBright)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBackground)
            )
        },
        containerColor = ObsidianBackground
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Horizontal Tab Row
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                containerColor = DeepCardBackground,
                contentColor = CyanBright,
                edgePadding = 12.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                title,
                                color = if (selectedTab == index) CyanBright else Slate400,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 12.sp
                            )
                        }
                    )
                }
            }

            // Tab Content
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(14.dp)
            ) {
                when (selectedTab) {
                    0 -> IndexAndMapTab(rootIndexText, notesList)
                    1 -> LivingProfileTab(profileMap, onUpdateSection = { sec, fact ->
                        coroutineScope.launch {
                            memoryEngine.updateProfileFact(sec, fact)
                            reloadData()
                        }
                    })
                    2 -> DailyNotesTab(todayDailyText)
                    3 -> ActivePrioritiesTab(prioritiesList, onTogglePriority = { id, done ->
                        memoryEngine.togglePriority(id, done)
                        reloadData()
                    })
                    4 -> JobsTab(jobsList, onAddLesson = { jobId, lesson ->
                        coroutineScope.launch {
                            memoryEngine.foldLessonIntoJob(jobId, lesson)
                            reloadData()
                        }
                    })
                    5 -> OnDemandTesterTab(
                        query = onDemandQuery,
                        onQueryChange = { onDemandQuery = it },
                        result = onDemandResult,
                        isRetrieving = isRetrieving,
                        onExecuteRetrieval = {
                            coroutineScope.launch {
                                isRetrieving = true
                                onDemandResult = memoryEngine.retrieveMemoryOnDemand(onDemandQuery)
                                isRetrieving = false
                            }
                        }
                    )
                }
            }
        }
    }

    // Add Checkpoint / Fact Dialog
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Record Memory Checkpoint", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Persists a state checkpoint to today's daily note and vault index automatically.",
                        color = Slate400,
                        fontSize = 12.sp
                    )
                    OutlinedTextField(
                        value = newTopicText,
                        onValueChange = { newTopicText = it },
                        label = { Text("Topic (e.g. Device Preference)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newOutcomeText,
                        onValueChange = { newOutcomeText = it },
                        label = { Text("Outcome / Fact") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTopicText.isNotBlank() && newOutcomeText.isNotBlank()) {
                            coroutineScope.launch {
                                memoryEngine.executeCheckpointPersistence(
                                    topic = newTopicText.trim(),
                                    outcome = newOutcomeText.trim(),
                                    touchedNotePath = null,
                                    noteAddition = null
                                )
                                newTopicText = ""
                                newOutcomeText = ""
                                showAddDialog = false
                                reloadData()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent)
                ) {
                    Text("Save Checkpoint", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel", color = Slate400)
                }
            },
            containerColor = DeepCardBackground
        )
    }
}

@Composable
fun IndexAndMapTab(rootIndexText: String, notesList: List<VaultNoteItem>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Root Memory Index (VAULT-INDEX.md)",
                            fontWeight = FontWeight.Bold,
                            color = CyanBright,
                            fontSize = 13.sp
                        )
                        Surface(
                            color = CyanAccent.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                "Map True",
                                color = CyanBright,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = rootIndexText.ifBlank { "Loading Root Memory Index..." },
                        color = Slate300,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        item {
            Text(
                "Indexed Vault Notes (${notesList.size})",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
        }

        items(notesList) { note ->
            Card(
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = ElevatedSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("[[${note.title}]]", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
                        Text("${note.folder} • ${note.type} • ${note.projectSlug}", color = Slate400, fontSize = 10.sp)
                    }
                    Surface(
                        color = ObsidianBackground,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            note.status,
                            color = CyanBright,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LivingProfileTab(
    profileMap: Map<String, String>,
    onUpdateSection: (String, String) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                "Living User Profile (Self-Maintaining)",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
            Text(
                "Learned facts and preferences stored in the vault, updated as you converse.",
                color = Slate400,
                fontSize = 11.sp
            )
        }

        val defaultSections = listOf("Who I Am", "Key People", "How I Think", "Preferences")
        items(defaultSections) { section ->
            val content = profileMap[section] ?: "No data populated."
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        section,
                        fontWeight = FontWeight.Bold,
                        color = CyanBright,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        content,
                        color = Slate300,
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
fun DailyNotesTab(dailyText: String) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                "Today's Daily Note (Automated Session Timeline)",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
            Text(
                "Created from Daily Note Template.md. Logs sessions, outcomes, and decisions.",
                color = Slate400,
                fontSize = 11.sp
            )
        }
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        dailyText.ifBlank { "No entries in today's daily note yet." },
                        color = Slate300,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
fun ActivePrioritiesTab(
    priorities: List<ActivePriorityItem>,
    onTogglePriority: (String, Boolean) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(
                "Active Priorities (${priorities.count { !it.isDone }} Open)",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
            Text(
                "Unified single source of open work checked at the start of every session.",
                color = Slate400,
                fontSize = 11.sp
            )
        }

        items(priorities) { item ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (item.isDone) ElevatedSurface.copy(alpha = 0.5f) else DeepCardBackground
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Checkbox(
                        checked = item.isDone,
                        onCheckedChange = { onTogglePriority(item.id, it) },
                        colors = CheckboxDefaults.colors(
                            checkedColor = CyanAccent,
                            uncheckedColor = Slate400
                        )
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            item.task,
                            color = if (item.isDone) Slate400 else Color.White,
                            fontSize = 12.sp,
                            fontWeight = if (item.isDone) FontWeight.Normal else FontWeight.SemiBold
                        )
                        Surface(
                            color = ObsidianBackground,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                item.projectSlug,
                                color = CyanBright,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun JobsTab(
    jobs: List<VaultJobItem>,
    onAddLesson: (String, String) -> Unit
) {
    var selectedJobForLesson by remember { mutableStateOf<VaultJobItem?>(null) }
    var lessonText by remember { mutableStateOf("") }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                "Jobs & Recurring Tasks (${jobs.size})",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
            Text(
                "One master note per recurring task: Boot chain, Procedure, Quality bar, and Lessons that compound over time.",
                color = Slate400,
                fontSize = 11.sp
            )
        }

        items(jobs) { job ->
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            job.name,
                            fontWeight = FontWeight.Bold,
                            color = CyanBright,
                            fontSize = 13.sp
                        )
                        Button(
                            onClick = { selectedJobForLesson = job },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ElevatedSurface)
                        ) {
                            Text("+ Lesson", fontSize = 10.sp, color = CyanBright)
                        }
                    }

                    Text("Procedure:", fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 11.sp)
                    Text(job.procedure.ifBlank { "Standard execution" }, color = Slate300, fontSize = 10.sp)

                    Text("Quality Bar:", fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 11.sp)
                    Text(job.qualityBar.ifBlank { "Full validation" }, color = Slate300, fontSize = 10.sp)

                    if (job.lessons.isNotBlank()) {
                        Text("Compounded Lessons:", fontWeight = FontWeight.SemiBold, color = AmberGlow, fontSize = 11.sp)
                        Text(job.lessons, color = Slate300, fontSize = 10.sp)
                    }
                }
            }
        }
    }

    if (selectedJobForLesson != null) {
        AlertDialog(
            onDismissRequest = { selectedJobForLesson = null },
            title = { Text("Fold Lesson into ${selectedJobForLesson?.name}", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Captures a correction so MAYRA never repeats the same mistake.",
                        color = Slate400,
                        fontSize = 12.sp
                    )
                    OutlinedTextField(
                        value = lessonText,
                        onValueChange = { lessonText = it },
                        label = { Text("Lesson / Correction") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (lessonText.isNotBlank()) {
                            onAddLesson(selectedJobForLesson!!.jobId, lessonText.trim())
                            lessonText = ""
                            selectedJobForLesson = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent)
                ) {
                    Text("Fold Lesson", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedJobForLesson = null }) {
                    Text("Cancel", color = Slate400)
                }
            },
            containerColor = DeepCardBackground
        )
    }
}

@Composable
fun OnDemandTesterTab(
    query: String,
    onQueryChange: (String) -> Unit,
    result: MemoryContextResult?,
    isRetrieving: Boolean,
    onExecuteRetrieval: () -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                "Memory-on-Demand Retrieval Tester",
                fontWeight = FontWeight.Bold,
                color = Color.White,
                fontSize = 13.sp
            )
            Text(
                "Demonstrates how MAYRA loads only the relevant context for a user prompt instead of dumping the entire vault into the context window.",
                color = Slate400,
                fontSize = 11.sp
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = onQueryChange,
                    label = { Text("Simulate User Command") },
                    modifier = Modifier.weight(1f)
                )
                Button(
                    onClick = onExecuteRetrieval,
                    enabled = !isRetrieving,
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent)
                ) {
                    Text(if (isRetrieving) "..." else "Query", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (result != null) {
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Matched Job:", fontWeight = FontWeight.Bold, color = CyanBright, fontSize = 11.sp)
                            Text(result.matchedJobName ?: "None (General)", color = Color.White, fontSize = 11.sp)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Context Notes Loaded:", fontWeight = FontWeight.Bold, color = CyanBright, fontSize = 11.sp)
                            Text("${result.matchedNotesCount} note(s)", color = Color.White, fontSize = 11.sp)
                        }

                        Text("Assembled Injection Prompt:", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 11.sp)
                        Surface(
                            color = ObsidianBackground,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                result.promptInjection,
                                color = Slate300,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
