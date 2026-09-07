package com.mayra.assistant.memory

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray

/**
 * Android Native SQLite Database for MAYRA Persistent AI Memory Vault.
 *
 * Provides fast, indexed, relational queries for:
 * - Root Memory Index (Tags, summaries, target document pointers)
 * - Vault Notes metadata & full text search
 * - Jobs (Recurring task skills, procedures, boot chains, lessons)
 * - Daily Notes & Sessions
 * - Living User Profile sections
 * - Active Priorities
 *
 * Reference & Foundation:
 * AI Memory Vault by Jared Rhodes (CC BY-SA 4.0)
 * Adapted for MAYRA Android Native Architecture.
 */
class MayraMemoryVaultDatabase(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {
    companion object {
        const val DATABASE_NAME = "mayra_memory_vault.db"
        const val DATABASE_VERSION = 1

        @Volatile
        private var instance: MayraMemoryVaultDatabase? = null

        fun getInstance(context: Context): MayraMemoryVaultDatabase {
            return instance ?: synchronized(this) {
                instance ?: MayraMemoryVaultDatabase(context.applicationContext).also { instance = it }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        // 1. Vault Index Table (Machine-searchable index of all memory tags and targets)
        db.execSQL(
            """
            CREATE TABLE vault_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag TEXT NOT NULL,
                category TEXT NOT NULL,
                source TEXT NOT NULL,
                summary TEXT NOT NULL,
                target_file TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_vault_index_tag ON vault_index(tag);")
        db.execSQL("CREATE INDEX idx_vault_index_category ON vault_index(category);")

        // 2. Vault Notes Table (Metadata & full text of notes in the vault)
        db.execSQL(
            """
            CREATE TABLE vault_notes (
                file_path TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                folder TEXT NOT NULL,
                content_markdown TEXT NOT NULL,
                type TEXT NOT NULL,
                project_slug TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_notes_folder ON vault_notes(folder);")
        db.execSQL("CREATE INDEX idx_notes_project ON vault_notes(project_slug);")
        db.execSQL("CREATE INDEX idx_notes_type ON vault_notes(type);")

        // 3. Vault Jobs Table (Recurring task skills: boot chain, procedure, quality bar, lessons)
        db.execSQL(
            """
            CREATE TABLE vault_jobs (
                job_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                project_slug TEXT NOT NULL,
                boot_chain_json TEXT NOT NULL,
                procedure TEXT NOT NULL,
                quality_bar TEXT NOT NULL,
                lessons TEXT NOT NULL,
                status TEXT NOT NULL
            );
            """.trimIndent()
        )

        // 4. Daily Sessions Table (Session logs inside daily notes)
        db.execSQL(
            """
            CREATE TABLE daily_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_str TEXT NOT NULL,
                session_number INTEGER NOT NULL,
                topic TEXT NOT NULL,
                what_done TEXT NOT NULL,
                still_in_progress TEXT NOT NULL,
                decisions TEXT NOT NULL,
                notes_touched TEXT NOT NULL,
                profile_updates TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_daily_date ON daily_sessions(date_str);")

        // 5. Living User Profile Table (Key People, Preferences, How I Think, etc.)
        db.execSQL(
            """
            CREATE TABLE user_profile (
                section_name TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                last_updated INTEGER NOT NULL
            );
            """.trimIndent()
        )

        // 6. Active Priorities Table (Open tasks tagged by project)
        db.execSQL(
            """
            CREATE TABLE active_priorities (
                id TEXT PRIMARY KEY,
                task TEXT NOT NULL,
                project_slug TEXT NOT NULL,
                is_done INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            );
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Future database migration handling
    }

    // ==========================================
    // Vault Index CRUD
    // ==========================================
    fun insertIndexEntry(
        tag: String,
        category: String,
        source: String,
        summary: String,
        targetFile: String
    ): Long {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put("tag", tag)
            put("category", category)
            put("source", source)
            put("summary", summary)
            put("target_file", targetFile)
            put("timestamp", System.currentTimeMillis())
        }
        return db.insert("vault_index", null, cv)
    }

    fun searchIndex(query: String): List<VaultIndexItem> {
        val db = readableDatabase
        val pattern = "%$query%"
        val cursor: Cursor = db.rawQuery(
            """
            SELECT tag, category, source, summary, target_file, timestamp
            FROM vault_index
            WHERE tag LIKE ? OR summary LIKE ? OR category LIKE ?
            ORDER BY timestamp DESC
            LIMIT 50
            """.trimIndent(),
            arrayOf(pattern, pattern, pattern)
        )
        val list = mutableListOf<VaultIndexItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    VaultIndexItem(
                        tag = it.getString(0),
                        category = it.getString(1),
                        source = it.getString(2),
                        summary = it.getString(3),
                        targetFile = it.getString(4),
                        timestamp = it.getLong(5)
                    )
                )
            }
        }
        return list
    }

    fun getAllIndexEntries(): List<VaultIndexItem> {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            "SELECT tag, category, source, summary, target_file, timestamp FROM vault_index ORDER BY timestamp DESC",
            null
        )
        val list = mutableListOf<VaultIndexItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    VaultIndexItem(
                        tag = it.getString(0),
                        category = it.getString(1),
                        source = it.getString(2),
                        summary = it.getString(3),
                        targetFile = it.getString(4),
                        timestamp = it.getLong(5)
                    )
                )
            }
        }
        return list
    }

    // ==========================================
    // Vault Notes CRUD
    // ==========================================
    fun upsertNote(
        filePath: String,
        title: String,
        folder: String,
        contentMarkdown: String,
        type: String,
        projectSlug: String,
        status: String
    ) {
        val db = writableDatabase
        val now = System.currentTimeMillis()
        val cv = ContentValues().apply {
            put("file_path", filePath)
            put("title", title)
            put("folder", folder)
            put("content_markdown", contentMarkdown)
            put("type", type)
            put("project_slug", projectSlug)
            put("status", status)
            put("updated_at", now)
        }
        val rows = db.update("vault_notes", cv, "file_path = ?", arrayOf(filePath))
        if (rows == 0) {
            cv.put("created_at", now)
            db.insert("vault_notes", null, cv)
        }
    }

    fun getNote(filePath: String): VaultNoteItem? {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            "SELECT file_path, title, folder, content_markdown, type, project_slug, status, created_at, updated_at FROM vault_notes WHERE file_path = ?",
            arrayOf(filePath)
        )
        cursor.use {
            if (it.moveToFirst()) {
                return VaultNoteItem(
                    filePath = it.getString(0),
                    title = it.getString(1),
                    folder = it.getString(2),
                    contentMarkdown = it.getString(3),
                    type = it.getString(4),
                    projectSlug = it.getString(5),
                    status = it.getString(6),
                    createdAt = it.getLong(7),
                    updatedAt = it.getLong(8)
                )
            }
        }
        return null
    }

    fun getAllNotes(): List<VaultNoteItem> {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            "SELECT file_path, title, folder, content_markdown, type, project_slug, status, created_at, updated_at FROM vault_notes ORDER BY updated_at DESC",
            null
        )
        val list = mutableListOf<VaultNoteItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    VaultNoteItem(
                        filePath = it.getString(0),
                        title = it.getString(1),
                        folder = it.getString(2),
                        contentMarkdown = it.getString(3),
                        type = it.getString(4),
                        projectSlug = it.getString(5),
                        status = it.getString(6),
                        createdAt = it.getLong(7),
                        updatedAt = it.getLong(8)
                    )
                )
            }
        }
        return list
    }

    fun searchNotes(query: String): List<VaultNoteItem> {
        val db = readableDatabase
        val pattern = "%$query%"
        val cursor: Cursor = db.rawQuery(
            """
            SELECT file_path, title, folder, content_markdown, type, project_slug, status, created_at, updated_at
            FROM vault_notes
            WHERE title LIKE ? OR content_markdown LIKE ? OR project_slug LIKE ?
            ORDER BY updated_at DESC
            LIMIT 20
            """.trimIndent(),
            arrayOf(pattern, pattern, pattern)
        )
        val list = mutableListOf<VaultNoteItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    VaultNoteItem(
                        filePath = it.getString(0),
                        title = it.getString(1),
                        folder = it.getString(2),
                        contentMarkdown = it.getString(3),
                        type = it.getString(4),
                        projectSlug = it.getString(5),
                        status = it.getString(6),
                        createdAt = it.getLong(7),
                        updatedAt = it.getLong(8)
                    )
                )
            }
        }
        return list
    }

    // ==========================================
    // Jobs (Recurring Tasks & Procedures)
    // ==========================================
    fun upsertJob(
        jobId: String,
        name: String,
        projectSlug: String,
        bootChain: List<String>,
        procedure: String,
        qualityBar: String,
        lessons: String,
        status: String = "active"
    ) {
        val db = writableDatabase
        val jsonArray = JSONArray(bootChain).toString()
        val cv = ContentValues().apply {
            put("job_id", jobId)
            put("name", name)
            put("project_slug", projectSlug)
            put("boot_chain_json", jsonArray)
            put("procedure", procedure)
            put("quality_bar", qualityBar)
            put("lessons", lessons)
            put("status", status)
        }
        val rows = db.update("vault_jobs", cv, "job_id = ?", arrayOf(jobId))
        if (rows == 0) {
            db.insert("vault_jobs", null, cv)
        }
    }

    fun getAllJobs(): List<VaultJobItem> {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            "SELECT job_id, name, project_slug, boot_chain_json, procedure, quality_bar, lessons, status FROM vault_jobs",
            null
        )
        val list = mutableListOf<VaultJobItem>()
        cursor.use {
            while (it.moveToNext()) {
                val rawJson = it.getString(3)
                val bootChain = mutableListOf<String>()
                try {
                    val arr = JSONArray(rawJson)
                    for (i in 0 until arr.length()) {
                        bootChain.add(arr.getString(i))
                    }
                } catch (e: Exception) {
                    // fallback
                }
                list.add(
                    VaultJobItem(
                        jobId = it.getString(0),
                        name = it.getString(1),
                        projectSlug = it.getString(2),
                        bootChain = bootChain,
                        procedure = it.getString(4),
                        qualityBar = it.getString(5),
                        lessons = it.getString(6),
                        status = it.getString(7)
                    )
                )
            }
        }
        return list
    }

    fun getJob(jobId: String): VaultJobItem? {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            "SELECT job_id, name, project_slug, boot_chain_json, procedure, quality_bar, lessons, status FROM vault_jobs WHERE job_id = ?",
            arrayOf(jobId)
        )
        cursor.use {
            if (it.moveToFirst()) {
                val rawJson = it.getString(3)
                val bootChain = mutableListOf<String>()
                try {
                    val arr = JSONArray(rawJson)
                    for (i in 0 until arr.length()) {
                        bootChain.add(arr.getString(i))
                    }
                } catch (e: Exception) {
                    // fallback
                }
                return VaultJobItem(
                    jobId = it.getString(0),
                    name = it.getString(1),
                    projectSlug = it.getString(2),
                    bootChain = bootChain,
                    procedure = it.getString(4),
                    qualityBar = it.getString(5),
                    lessons = it.getString(6),
                    status = it.getString(7)
                )
            }
        }
        return null
    }

    // ==========================================
    // Living User Profile
    // ==========================================
    fun setProfileSection(sectionName: String, content: String) {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put("section_name", sectionName)
            put("content", content)
            put("last_updated", System.currentTimeMillis())
        }
        val rows = db.update("user_profile", cv, "section_name = ?", arrayOf(sectionName))
        if (rows == 0) {
            db.insert("user_profile", null, cv)
        }
    }

    fun getProfileSections(): Map<String, String> {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery("SELECT section_name, content FROM user_profile", null)
        val map = mutableMapOf<String, String>()
        cursor.use {
            while (it.moveToNext()) {
                map[it.getString(0)] = it.getString(1)
            }
        }
        return map
    }

    // ==========================================
    // Active Priorities
    // ==========================================
    fun addActivePriority(id: String, task: String, projectSlug: String) {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put("id", id)
            put("task", task)
            put("project_slug", projectSlug)
            put("is_done", 0)
            put("created_at", System.currentTimeMillis())
        }
        db.insertWithOnConflict("active_priorities", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
    }

    fun togglePriority(id: String, isDone: Boolean) {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put("is_done", if (isDone) 1 else 0)
        }
        db.update("active_priorities", cv, "id = ?", arrayOf(id))
    }

    fun getActivePriorities(includeDone: Boolean = false): List<ActivePriorityItem> {
        val db = readableDatabase
        val query = if (includeDone) {
            "SELECT id, task, project_slug, is_done, created_at FROM active_priorities ORDER BY is_done ASC, created_at DESC"
        } else {
            "SELECT id, task, project_slug, is_done, created_at FROM active_priorities WHERE is_done = 0 ORDER BY created_at DESC"
        }
        val cursor: Cursor = db.rawQuery(query, null)
        val list = mutableListOf<ActivePriorityItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    ActivePriorityItem(
                        id = it.getString(0),
                        task = it.getString(1),
                        projectSlug = it.getString(2),
                        isDone = it.getInt(3) == 1,
                        createdAt = it.getLong(4)
                    )
                )
            }
        }
        return list
    }

    // ==========================================
    // Daily Sessions Logging
    // ==========================================
    fun logDailySession(
        dateStr: String,
        sessionNumber: Int,
        topic: String,
        whatDone: String,
        stillInProgress: String,
        decisions: String,
        notesTouched: String,
        profileUpdates: String
    ): Long {
        val db = writableDatabase
        val cv = ContentValues().apply {
            put("date_str", dateStr)
            put("session_number", sessionNumber)
            put("topic", topic)
            put("what_done", whatDone)
            put("still_in_progress", stillInProgress)
            put("decisions", decisions)
            put("notes_touched", notesTouched)
            put("profile_updates", profileUpdates)
            put("timestamp", System.currentTimeMillis())
        }
        return db.insert("daily_sessions", null, cv)
    }

    fun getDailySessions(dateStr: String): List<DailySessionItem> {
        val db = readableDatabase
        val cursor: Cursor = db.rawQuery(
            """
            SELECT id, date_str, session_number, topic, what_done, still_in_progress, decisions, notes_touched, profile_updates, timestamp
            FROM daily_sessions
            WHERE date_str = ?
            ORDER BY session_number ASC
            """.trimIndent(),
            arrayOf(dateStr)
        )
        val list = mutableListOf<DailySessionItem>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    DailySessionItem(
                        id = it.getLong(0),
                        dateStr = it.getString(1),
                        sessionNumber = it.getInt(2),
                        topic = it.getString(3),
                        whatDone = it.getString(4),
                        stillInProgress = it.getString(5),
                        decisions = it.getString(6),
                        notesTouched = it.getString(7),
                        profileUpdates = it.getString(8),
                        timestamp = it.getLong(9)
                    )
                )
            }
        }
        return list
    }
}

// Data models
data class VaultIndexItem(
    val tag: String,
    val category: String,
    val source: String,
    val summary: String,
    val targetFile: String,
    val timestamp: Long
)

data class VaultNoteItem(
    val filePath: String,
    val title: String,
    val folder: String,
    val contentMarkdown: String,
    val type: String, // index | reference | guide | plan | log
    val projectSlug: String,
    val status: String, // active | completed | idea | parked | archived
    val createdAt: Long,
    val updatedAt: Long
)

data class VaultJobItem(
    val jobId: String,
    val name: String,
    val projectSlug: String,
    val bootChain: List<String>,
    val procedure: String,
    val qualityBar: String,
    val lessons: String,
    val status: String
)

data class ActivePriorityItem(
    val id: String,
    val task: String,
    val projectSlug: String,
    val isDone: Boolean,
    val createdAt: Long
)

data class DailySessionItem(
    val id: Long,
    val dateStr: String,
    val sessionNumber: Int,
    val topic: String,
    val whatDone: String,
    val stillInProgress: String,
    val decisions: String,
    val notesTouched: String,
    val profileUpdates: String,
    val timestamp: Long
)
