package com.mayra.assistant.engine

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.mayra.assistant.services.MayraMicrophoneForegroundService
import kotlinx.coroutines.*
import org.json.JSONObject

/**
 * Android WebView JavaScript Interface mapping to window.MayraNativeLLM.
 */
class MayraWebInterface(
    private val context: Context,
    private val webView: WebView? = null
) {
    private val bridge = MayraNativeLLMBridge.getInstance(context)
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    init {
        // Wire foreground offline wake-word detection callback to WebView JS layer
        MayraMicrophoneForegroundService.onWakeWordDetectedListener = { phrase, command ->
            dispatchJsWakeWord(phrase, command)
        }
    }

    private fun dispatchJsWakeWord(phrase: String, command: String) {
        webView?.post {
            val escPhrase = JSONObject.quote(phrase)
            val escCommand = JSONObject.quote(command)
            val js = "if (window.__mayra_native_on_wakeword) { window.__mayra_native_on_wakeword($escPhrase, $escCommand); } else { window.dispatchEvent(new CustomEvent('mayra_native_wakeword', { detail: { phrase: $escPhrase, command: $escCommand } })); }"
            webView.evaluateJavascript(js, null)
        }
    }

    @JavascriptInterface
    fun isAvailable(): Boolean {
        return bridge.isAvailable()
    }

    @JavascriptInterface
    fun getDeviceMemory(): String {
        val mem = bridge.getDeviceMemory()
        val json = JSONObject().apply {
            put("totalRamMb", mem.totalRamMb)
            put("availRamMb", mem.availRamMb)
            put("isLowMemory", mem.isLowMemory)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun getAvailableStorage(): String {
        val storage = bridge.getAvailableStorage()
        val json = JSONObject().apply {
            put("totalStorageMb", storage.totalStorageMb)
            put("freeStorageMb", storage.freeStorageMb)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun getModelDirectory(): String {
        return bridge.getModelDirectory()
    }

    @JavascriptInterface
    fun checkModelFile(filename: String): String {
        return bridge.checkModelFile(filename)
    }

    @JavascriptInterface
    fun deleteModelFile(filename: String): Boolean {
        return bridge.deleteModelFile(filename)
    }

    @JavascriptInterface
    fun isModelLoaded(): Boolean {
        return bridge.isModelLoaded()
    }

    @JavascriptInterface
    fun getModelStatus(): String {
        return getStatus()
    }

    @JavascriptInterface
    fun getStatus(): String {
        val status = bridge.getStatus()
        val json = JSONObject().apply {
            put("isSupported", status.isSupported)
            put("isEngineInitialized", status.isEngineInitialized)
            put("isModelLoaded", status.isModelLoaded)
            put("activeModelId", status.activeModelId ?: JSONObject.NULL)
            put("deviceRamMb", status.deviceRamMb ?: JSONObject.NULL)
            put("availableVramMb", status.availableVramMb ?: JSONObject.NULL)
            put("lowMemoryAlert", status.lowMemoryAlert)
            put("engineVersion", status.engineVersion)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun loadLocalModel(modelPath: String, optionsJson: String?): Boolean {
        return loadModel(modelPath, optionsJson)
    }

    @JavascriptInterface
    fun loadModel(modelPath: String, optionsJson: String?): Boolean {
        return runBlocking(Dispatchers.IO) {
            var nThreads = 4
            var nGpuLayers = 0
            var contextSize = 2048

            if (!optionsJson.isNullOrBlank()) {
                try {
                    val opts = JSONObject(optionsJson)
                    nThreads = opts.optInt("nThreads", 4)
                    nGpuLayers = opts.optInt("nGpuLayers", 0)
                    contextSize = opts.optInt("contextSize", 2048)
                } catch (e: Exception) {
                    // fallback to defaults
                }
            }

            bridge.loadModel(modelPath, nThreads, nGpuLayers, contextSize)
        }
    }

    @JavascriptInterface
    fun unloadLocalModel(): Boolean {
        return unloadModel()
    }

    @JavascriptInterface
    fun unloadModel(): Boolean {
        return runBlocking(Dispatchers.IO) {
            bridge.unloadModel()
        }
    }

    @JavascriptInterface
    fun streamPrompt(
        prompt: String,
        optionsJson: String?
    ) {
        scope.launch(Dispatchers.IO) {
            var sysPrompt = "You are MAYRA."
            var temp = 0.7f
            var topP = 0.9f
            var maxTokens = 512

            if (!optionsJson.isNullOrBlank()) {
                try {
                    val opts = JSONObject(optionsJson)
                    sysPrompt = opts.optString("systemPrompt", "You are MAYRA.")
                    temp = opts.optDouble("temperature", 0.7).toFloat()
                    topP = opts.optDouble("topP", 0.9).toFloat()
                    maxTokens = opts.optInt("maxTokens", 512)
                } catch (e: Exception) {
                    // fallback
                }
            }

            bridge.generateStream(
                prompt = prompt,
                systemPrompt = sysPrompt,
                temperature = temp,
                topP = topP,
                maxTokens = maxTokens,
                onToken = { token, accumulated, tps ->
                    dispatchJsToken(token, accumulated, tps)
                    true
                },
                onComplete = { fullText, tps ->
                    dispatchJsComplete(fullText, tps)
                }
            )
        }
    }

    private fun dispatchJsToken(token: String, accumulated: String, tps: Double) {
        webView?.post {
            val escToken = JSONObject.quote(token)
            val escAcc = JSONObject.quote(accumulated)
            val js = "if (window.__mayra_native_on_token) { window.__mayra_native_on_token($escToken, $escAcc, $tps); }"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun dispatchJsComplete(fullText: String, tps: Double) {
        webView?.post {
            val escFull = JSONObject.quote(fullText)
            val js = "if (window.__mayra_native_on_complete) { window.__mayra_native_on_complete($escFull, $tps); }"
            webView.evaluateJavascript(js, null)
        }
    }

    @JavascriptInterface
    fun cancelOfflineGeneration(): Boolean {
        return cancelGeneration()
    }

    @JavascriptInterface
    fun cancelGeneration(): Boolean {
        return bridge.cancelGeneration()
    }

    @JavascriptInterface
    fun isNativeWakeWordSupported(): Boolean {
        return true
    }

    @JavascriptInterface
    fun startOfflineWakeWord(continuous: Boolean): Boolean {
        try {
            MayraMicrophoneForegroundService.start(context, continuous)
            return true
        } catch (e: Exception) {
            return false
        }
    }

    @JavascriptInterface
    fun stopOfflineWakeWord(): Boolean {
        try {
            MayraMicrophoneForegroundService.stop(context)
            return true
        } catch (e: Exception) {
            return false
        }
    }

    @JavascriptInterface
    fun pauseOfflineWakeWord(): Boolean {
        try {
            MayraMicrophoneForegroundService.pause(context)
            return true
        } catch (e: Exception) {
            return false
        }
    }

    @JavascriptInterface
    fun resumeOfflineWakeWord(): Boolean {
        try {
            MayraMicrophoneForegroundService.resume(context)
            return true
        } catch (e: Exception) {
            return false
        }
    }

    @JavascriptInterface
    fun isOfflineWakeWordActive(): Boolean {
        return MayraMicrophoneForegroundService.isWakeWordActive
    }

    // ==========================================
    // Persistent AI Memory Vault Bridge
    // ==========================================
    @JavascriptInterface
    fun getMemoryRootIndex(): String {
        return com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context).getRootMemoryIndex()
    }

    @JavascriptInterface
    fun getTodayDailyNote(): String {
        return com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context).getTodayDailyNote()
    }

    @JavascriptInterface
    fun getLivingProfileJson(): String {
        val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
        val map = engine.getLivingProfile()
        val json = JSONObject()
        for ((k, v) in map) {
            json.put(k, v)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun getActivePrioritiesJson(): String {
        val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
        val list = engine.getActivePriorities(includeDone = true)
        val arr = org.json.JSONArray()
        for (item in list) {
            arr.put(JSONObject().apply {
                put("id", item.id)
                put("task", item.task)
                put("projectSlug", item.projectSlug)
                put("isDone", item.isDone)
                put("createdAt", item.createdAt)
            })
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun getJobsJson(): String {
        val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
        val list = engine.getAllJobs()
        val arr = org.json.JSONArray()
        for (job in list) {
            arr.put(JSONObject().apply {
                put("jobId", job.jobId)
                put("name", job.name)
                put("projectSlug", job.projectSlug)
                put("procedure", job.procedure)
                put("qualityBar", job.qualityBar)
                put("lessons", job.lessons)
                put("status", job.status)
            })
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun retrieveMemoryOnDemand(query: String): String {
        return runBlocking(Dispatchers.IO) {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            val result = engine.retrieveMemoryOnDemand(query)
            JSONObject().apply {
                put("promptInjection", result.promptInjection)
                put("matchedJobName", result.matchedJobName ?: JSONObject.NULL)
                put("matchedNotesCount", result.matchedNotesCount)
                put("activePrioritiesCount", result.activePrioritiesCount)
                put("indexTags", org.json.JSONArray(result.indexTags))
            }.toString()
        }
    }

    @JavascriptInterface
    fun executeMemoryCheckpoint(topic: String, outcome: String, notePath: String?, noteAddition: String?): Boolean {
        return runBlocking(Dispatchers.IO) {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            engine.executeCheckpointPersistence(topic, outcome, notePath, noteAddition)
        }
    }

    @JavascriptInterface
    fun updateLivingProfile(sectionName: String, newFact: String): Boolean {
        return runBlocking(Dispatchers.IO) {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            engine.updateProfileFact(sectionName, newFact)
        }
    }

    @JavascriptInterface
    fun toggleActivePriority(id: String, isDone: Boolean): Boolean {
        return try {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            engine.togglePriority(id, isDone)
            true
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun evaluateAndPersistTurn(userPrompt: String, assistantReply: String, speaker: String): Boolean {
        return runBlocking(Dispatchers.IO) {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            engine.evaluateAndPersistTurn(userPrompt, assistantReply, speaker)
        }
    }

    @JavascriptInterface
    fun saveMemory(category: String, fact: String, source: String, projectSlug: String, tags: String): String {
        val db = com.mayra.assistant.memory.MayraMemoryVaultDatabase.getInstance(context)
        val saved = db.upsertMemoryWithDeduplication(
            category = category,
            fact = fact,
            source = source,
            confidence = 1.0,
            projectSlug = projectSlug,
            tags = tags
        )
        // Also sync to Android filesystem Markdown file (MEMORY.md)
        try {
            val filesystem = com.mayra.assistant.memory.VaultFilesystemManager.getInstance(context)
            filesystem.appendFile("04 - Archive/MEMORY.md", "\n- [${saved.category.uppercase()}] ${saved.fact}")
        } catch (e: Exception) {
            // Non-fatal filesystem sync notice
        }
        return JSONObject().apply {
            put("id", saved.id)
            put("category", saved.category)
            put("fact", saved.fact)
            put("status", saved.status)
            put("supersedesId", saved.supersedesId ?: JSONObject.NULL)
            put("createdAt", saved.createdAt)
            put("updatedAt", saved.updatedAt)
        }.toString()
    }

    @JavascriptInterface
    fun searchMemories(query: String, limit: Int): String {
        val db = com.mayra.assistant.memory.MayraMemoryVaultDatabase.getInstance(context)
        val list = db.searchMemories(query, limit)
        val arr = org.json.JSONArray()
        for (m in list) {
            arr.put(JSONObject().apply {
                put("id", m.id)
                put("category", m.category)
                put("fact", m.fact)
                put("status", m.status)
                put("confidence", m.confidence)
                put("projectSlug", m.projectSlug)
                put("tags", m.tags)
                put("supersedesId", m.supersedesId ?: JSONObject.NULL)
            })
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun getAllActiveMemoriesJson(): String {
        val db = com.mayra.assistant.memory.MayraMemoryVaultDatabase.getInstance(context)
        val list = db.getAllActiveMemories()
        val arr = org.json.JSONArray()
        for (m in list) {
            arr.put(JSONObject().apply {
                put("id", m.id)
                put("category", m.category)
                put("fact", m.fact)
                put("status", m.status)
                put("confidence", m.confidence)
                put("projectSlug", m.projectSlug)
                put("tags", m.tags)
                put("supersedesId", m.supersedesId ?: JSONObject.NULL)
            })
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun rebuildVaultIndex(): Boolean {
        return runBlocking(Dispatchers.IO) {
            val engine = com.mayra.assistant.memory.MayraMemoryVaultEngine.getInstance(context)
            engine.rebuildDatabaseFromFilesystem()
        }
    }
}

