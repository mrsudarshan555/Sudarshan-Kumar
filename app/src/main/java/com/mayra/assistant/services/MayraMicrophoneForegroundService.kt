package com.mayra.assistant.services

import android.app.KeyguardManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.RingtoneManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.core.app.NotificationCompat
import com.mayra.assistant.MainActivity
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * MAYRA 100% Offline Background Wake-Word & Voice Listening Service
 * 
 * Capabilities:
 * 1. Operates completely on-device without Mobile Data or Wi-Fi.
 * 2. Wakes the screen from lock screen (Siri / Hey Google equivalent).
 * 3. Dual-State Response Engine:
 *    - Online: "Ji, kahiye!" + Chime + Cloud LLM ready
 *    - Offline: "Ji, sun rahi hoon. Internet band hai, offline actions ready hain." via local TTS
 * 4. Online Question Offline Guard: "Kripya internet on karein."
 */
class MayraMicrophoneForegroundService : Service(), TextToSpeech.OnInitListener {

    companion object {
        private const val TAG = "MayraOfflineWakeWord"
        const val CHANNEL_ID = "mayra_voice_listening_channel"
        const val NOTIFICATION_ID = 2001

        const val ACTION_START_LISTENING = "com.mayra.assistant.ACTION_START_LISTENING"
        const val ACTION_STOP_LISTENING = "com.mayra.assistant.ACTION_STOP_LISTENING"
        const val ACTION_PAUSE_LISTENING = "com.mayra.assistant.ACTION_PAUSE_LISTENING"
        const val ACTION_RESUME_LISTENING = "com.mayra.assistant.ACTION_RESUME_LISTENING"
        const val EXTRA_IS_CONTINUOUS = "extra_is_continuous"

        @Volatile
        var isServiceRunning = false
            private set

        @Volatile
        var isWakeWordActive = false
            private set

        // Global callback for Native Android -> Overlay / Web Bridge
        var onWakeWordDetectedListener: ((phrase: String, command: String, isOnline: Boolean) -> Unit)? = null

        /**
         * Multi-lingual Wake Patterns for "Hey Mayra" (English, Hindi & Hinglish)
         */
        private val WAKE_PATTERNS = listOf(
            Regex("\\b(?:hey|hi|hello|ok|okay|oy|oye|listen|sun|suno)\\s+(?:mayra|myra|mira|meyra|maira|maera)\\b", RegexOption.IGNORE_CASE),
            Regex("\\b(?:mayra|myra|mira|meyra|maira|maera)\\s+(?:wake\\s*up|utho|jago|sun|suno|help|ji)\\b", RegexOption.IGNORE_CASE),
            Regex("\\b(?:mayra|myra|mira|meyra|maira)\\b", RegexOption.IGNORE_CASE),
            Regex("(?:हे|हाय|हेलो|ओके|सुनो|नमस्ते)\\s*(?:मायरा|माइरा)", RegexOption.IGNORE_CASE),
            Regex("(?:मायरा|माइरा)\\s*(?:सुनो|उठो|जागो|मदद|जी)", RegexOption.IGNORE_CASE),
            Regex("(?:मायरा|माइरा)", RegexOption.IGNORE_CASE)
        )

        /**
         * Keywords that require online cloud search / LLM knowledge
         */
        private val ONLINE_QUERY_PATTERNS = listOf(
            Regex("\\b(?:weather|mausam|news|samachar|google|who is|what is|search|kya hai|kaun hai|meaning|capital of|score)\\b", RegexOption.IGNORE_CASE)
        )

        fun start(context: Context, continuous: Boolean = true) {
            val intent = Intent(context, MayraMicrophoneForegroundService::class.java).apply {
                action = ACTION_START_LISTENING
                putExtra(EXTRA_IS_CONTINUOUS, continuous)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, MayraMicrophoneForegroundService::class.java).apply {
                action = ACTION_STOP_LISTENING
            }
            context.startService(intent)
        }

        fun parseWakeAndCommand(text: String): Pair<String, String>? {
            val clean = text.trim()
            if (clean.isBlank()) return null

            for (pattern in WAKE_PATTERNS) {
                val match = pattern.find(clean)
                if (match != null) {
                    val phrase = match.value
                    val trailing = clean.substring(match.range.last + 1)
                        .trimStart(',', '!', '?', ':', '.', ' ', '-')
                        .trim()
                    return Pair(phrase, trailing)
                }
            }
            return null
        }
    }

    private var partialWakeLock: PowerManager.WakeLock? = null
    private var screenWakeLock: PowerManager.WakeLock? = null
    private var isRecording = false
    private var isPaused = false
    private var lastTriggerTimestamp = 0L

    private val mainHandler = Handler(Looper.getMainLooper())
    private var speechRecognizer: SpeechRecognizer? = null
    private var recognizerIntent: Intent? = null
    private val isRecognizerListening = AtomicBoolean(false)
    private var restartRunnable: Runnable? = null

    private var recordingThread: Thread? = null
    private var audioRecord: AudioRecord? = null

    // Local On-Device Text-To-Speech
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initLocalTts()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_LISTENING -> {
                stopListening()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_PAUSE_LISTENING -> {
                isPaused = true
                pauseOfflineRecognizer()
                return START_STICKY
            }
            ACTION_RESUME_LISTENING -> {
                isPaused = false
                resumeOfflineRecognizer()
                return START_STICKY
            }
            ACTION_START_LISTENING, null -> {
                val isContinuous = intent?.getBooleanExtra(EXTRA_IS_CONTINUOUS, true) ?: true
                startForegroundWithNotification(isContinuous)
                acquirePartialWakeLock()
                startListening()
                initOfflineSpeechRecognizer()
                return START_STICKY
            }
        }
        return START_STICKY
    }

    // =========================================================================
    // 1. PARTIAL WAKELOCK & SCREEN WAKE LOGIC
    // =========================================================================
    private fun acquirePartialWakeLock() {
        try {
            if (partialWakeLock?.isHeld != true) {
                val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
                partialWakeLock = powerManager?.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "MAYRA:BackgroundListeningWakeLock"
                )?.apply {
                    setReferenceCounted(false)
                    acquire(24 * 60 * 60 * 1000L /* 24 hours */)
                }
                Log.i(TAG, "Acquired PARTIAL_WAKE_LOCK for persistent offline wake-word")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire partial wake lock", e)
        }
    }

    /**
     * Wakes up the display if screen is turned off or device is locked
     */
    fun wakeScreenAndBypassLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (powerManager != null && !powerManager.isInteractive) {
                @Suppress("DEPRECATION")
                screenWakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "MAYRA:ScreenWakeOnVoiceLock"
                )?.apply {
                    acquire(5000L) // Keep bright for 5s while assistant shows
                }
            }

            // Launch transparent assistant overlay activity / service
            val overlayIntent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                         Intent.FLAG_ACTIVITY_CLEAR_TOP or
                         Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                putExtra("EXTRA_VOICE_WAKE_TRIGGERED", true)
            }
            startActivity(overlayIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Error waking screen on voice trigger", e)
        }
    }

    // =========================================================================
    // 2. NETWORK CONNECTIVITY CHECK
    // =========================================================================
    private fun isInternetAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
               capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    // =========================================================================
    // 3. DUAL-STATE RESPONSE PIPELINE
    // =========================================================================
    private fun handleWakeWordDetected(phrase: String, command: String) {
        val hasInternet = isInternetAvailable()
        Log.i(TAG, "Wake-word triggered! Internet status: $hasInternet | Phrase: '$phrase' | Command: '$command'")

        // 1. Wake the screen from locked/off state
        wakeScreenAndBypassLock()

        // 2. Play subtle chime sound
        playChimeSound()

        // 3. Notify global listener / UI
        mainHandler.post {
            onWakeWordDetectedListener?.invoke(phrase, command, hasInternet)
        }

        // 4. Check if command is an online query while offline
        if (!hasInternet && isOnlineOnlyQuery(command)) {
            speakLocalTts("Kripya internet on karein.")
            return
        }

        // 5. Dual-state voice response
        if (hasInternet) {
            // Online Mode: Acknowledge and prepare cloud LLM
            speakLocalTts("Ji, kahiye!")
        } else {
            // Offline Mode: Inform user that offline assistant actions are ready
            speakLocalTts("Ji, sun rahi hoon. Internet band hai, offline actions ready hain.")
        }
    }

    private fun isOnlineOnlyQuery(command: String): Boolean {
        if (command.isBlank()) return false
        return ONLINE_QUERY_PATTERNS.any { it.containsMatchIn(command) }
    }

    private fun playChimeSound() {
        try {
            val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val ringtone = RingtoneManager.getRingtone(applicationContext, notificationUri)
            ringtone?.play()
        } catch (e: Exception) {
            Log.w(TAG, "Notice playing notification chime: ${e.message}")
        }
    }

    // =========================================================================
    // 4. ON-DEVICE TEXT TO SPEECH (OFFLINE)
    // =========================================================================
    private fun initLocalTts() {
        try {
            textToSpeech = TextToSpeech(this, this)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize local TTS", e)
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.let { tts ->
                // Try Hindi first, then Indian English, then US English
                val hindiLocale = Locale("hi", "IN")
                val result = tts.setLanguage(hindiLocale)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.language = Locale("en", "IN")
                }
                tts.setSpeechRate(1.05f)
                tts.setPitch(1.0f)
                isTtsReady = true
                Log.i(TAG, "Local On-Device TTS successfully initialized")
            }
        }
    }

    fun speakLocalTts(text: String) {
        mainHandler.post {
            if (isTtsReady && textToSpeech != null) {
                // Temporarily pause recognizer so TTS voice isn't picked up
                pauseOfflineRecognizer()
                
                textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {}
                    override fun onDone(utteranceId: String?) {
                        mainHandler.postDelayed({ resumeOfflineRecognizer() }, 300)
                    }
                    override fun onError(utteranceId: String?) {
                        mainHandler.postDelayed({ resumeOfflineRecognizer() }, 300)
                    }
                })

                val params = Bundle().apply {
                    putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
                }
                textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "mayra_wake_utterance")
            }
        }
    }

    // =========================================================================
    // 5. ON-DEVICE OFFLINE SPEECH RECOGNIZER & ACOUSTIC STREAM
    // =========================================================================
    private fun initOfflineSpeechRecognizer() {
        mainHandler.post {
            try {
                if (speechRecognizer != null) return@post

                if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                    Log.w(TAG, "Android SpeechRecognizer not available on this device")
                    return@post
                }

                speechRecognizer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    SpeechRecognizer.isOnDeviceRecognitionAvailable(this)) {
                    Log.i(TAG, "[Offline WakeWord] Android 13+ On-Device Speech Recognizer enabled")
                    SpeechRecognizer.createOnDeviceSpeechRecognizer(this)
                } else {
                    Log.i(TAG, "[Offline WakeWord] Standard Speech Recognizer with EXTRA_PREFER_OFFLINE enabled")
                    SpeechRecognizer.createSpeechRecognizer(this)
                }

                recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                    putExtra("android.speech.extra.PREFER_OFFLINE", true)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1000L)
                }

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        isRecognizerListening.set(true)
                    }

                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        isRecognizerListening.set(false)
                    }

                    override fun onError(error: Int) {
                        isRecognizerListening.set(false)
                        scheduleRecognizerRestart(250L)
                    }

                    override fun onResults(results: Bundle?) {
                        isRecognizerListening.set(false)
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        checkMatchesForWakeWord(matches)
                        scheduleRecognizerRestart(150L)
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        checkMatchesForWakeWord(matches)
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                startRecognizerLoop()
            } catch (e: Exception) {
                Log.e(TAG, "[Offline WakeWord] Failed to initialize offline recognizer", e)
            }
        }
    }

    private fun startRecognizerLoop() {
        if (isPaused || !isServiceRunning) return
        mainHandler.post {
            try {
                if (speechRecognizer != null && recognizerIntent != null && !isRecognizerListening.get()) {
                    speechRecognizer?.startListening(recognizerIntent)
                    isRecognizerListening.set(true)
                }
            } catch (e: Exception) {
                Log.w(TAG, "[Offline WakeWord] Recognizer start notice: ${e.message}")
                scheduleRecognizerRestart(500L)
            }
        }
    }

    private fun scheduleRecognizerRestart(delayMs: Long) {
        if (!isServiceRunning || isPaused) return
        restartRunnable?.let { mainHandler.removeCallbacks(it) }
        restartRunnable = Runnable {
            startRecognizerLoop()
        }
        mainHandler.postDelayed(restartRunnable!!, delayMs)
    }

    private fun pauseOfflineRecognizer() {
        mainHandler.post {
            try {
                restartRunnable?.let { mainHandler.removeCallbacks(it) }
                speechRecognizer?.stopListening()
                isRecognizerListening.set(false)
            } catch (e: Exception) {
                Log.w(TAG, "Error pausing offline recognizer", e)
            }
        }
    }

    private fun resumeOfflineRecognizer() {
        mainHandler.post {
            startRecognizerLoop()
        }
    }

    private fun checkMatchesForWakeWord(matches: ArrayList<String>?) {
        if (matches.isNullOrEmpty() || isPaused) return
        val now = System.currentTimeMillis()
        if (now - lastTriggerTimestamp < 2500) return

        for (text in matches) {
            val result = parseWakeAndCommand(text)
            if (result != null) {
                lastTriggerTimestamp = now
                val (phrase, command) = result
                handleWakeWordDetected(phrase, command)
                break
            }
        }
    }

    private fun startListening() {
        if (isRecording) return

        try {
            val sampleRate = 16000
            val channelConfig = AudioFormat.CHANNEL_IN_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT
            val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            val bufferSize = (minBufferSize * 2).coerceAtLeast(4096)

            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.w(TAG, "AudioRecord initialization note or microphone shared")
                return
            }

            audioRecord?.startRecording()
            isRecording = true

            recordingThread = Thread({
                val buffer = ShortArray(bufferSize / 2)
                while (isRecording && !Thread.currentThread().isInterrupted) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        var sum = 0.0
                        for (i in 0 until read) {
                            sum += buffer[i] * buffer[i]
                        }
                        val rms = Math.sqrt(sum / read)
                        if (rms > 2500 && !isRecognizerListening.get() && !isPaused) {
                            scheduleRecognizerRestart(50L)
                        }
                    }
                }
            }, "MayraAudioListeningThread").apply {
                priority = Thread.NORM_PRIORITY + 2
                start()
            }

            Log.i(TAG, "MAYRA 100% Offline Foreground Listening Service active")
        } catch (e: SecurityException) {
            Log.e(TAG, "Microphone permission not granted", e)
            stopSelf()
        } catch (e: Exception) {
            Log.e(TAG, "Error starting microphone capture", e)
        }
    }

    private fun stopListening() {
        isRecording = false
        isWakeWordActive = false

        mainHandler.post {
            try {
                restartRunnable?.let { mainHandler.removeCallbacks(it) }
                speechRecognizer?.stopListening()
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (e: Exception) {
                Log.w(TAG, "Error destroying speechRecognizer", e)
            }
        }

        try {
            recordingThread?.interrupt()
            recordingThread = null

            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping audioRecord", e)
        }

        try {
            if (partialWakeLock?.isHeld == true) {
                partialWakeLock?.release()
            }
            partialWakeLock = null

            if (screenWakeLock?.isHeld == true) {
                screenWakeLock?.release()
            }
            screenWakeLock = null
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing wakeLock", e)
        }

        try {
            textToSpeech?.stop()
            textToSpeech?.shutdown()
            textToSpeech = null
        } catch (e: Exception) {
            Log.w(TAG, "Error shutting down TTS", e)
        }

        isServiceRunning = false
    }

    private fun startForegroundWithNotification(isContinuous: Boolean) {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, MayraMicrophoneForegroundService::class.java).apply {
            action = ACTION_STOP_LISTENING
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val contentText = if (isContinuous) {
            "Continuous offline listening active • 'Hey Mayra' ready"
        } else {
            "Offline wake-word active • Say 'Hey Mayra' to wake"
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MAYRA Voice Assistant")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isServiceRunning = true
        isWakeWordActive = true
    }

    override fun onDestroy() {
        stopListening()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MAYRA Voice Listening Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows persistent microphone listening status for MAYRA voice assistant"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
