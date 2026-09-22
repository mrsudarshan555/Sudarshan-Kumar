package com.mayra.assistant.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.content.Intent
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.mayra.assistant.engine.MayraContactResolver
import com.mayra.assistant.engine.MayraSafeMessagingPipeline

/**
 * MAYRA Task Automation & Accessibility Service
 * 
 * Capabilities:
 * 1. Safe Multi-App Messaging Pipeline (WhatsApp, SMS, Gmail) using Search-First Verification.
 * 2. ContactsContract disambiguation handler to prevent blind-sending to wrong numbers.
 * 3. Fallback gesture dispatch and system-level app navigation.
 */
class MayraAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "MayraAccessibility"
        
        @Volatile
        private var instance: MayraAccessibilityService? = null

        fun getInstance(): MayraAccessibilityService? = instance

        fun isRunning(): Boolean = instance != null
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var messagingPipeline: MayraSafeMessagingPipeline? = null
    private var contactResolver: MayraContactResolver? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        messagingPipeline = MayraSafeMessagingPipeline(this, mainHandler)
        contactResolver = MayraContactResolver(this)
        Log.i(TAG, "Mayra Accessibility Service Connected with Safe Messaging Pipeline.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: return

        // Forward event to active messaging automation pipeline
        messagingPipeline?.onAccessibilityEventReceived(packageName)
    }

    /**
     * Executes safe messaging flow across WhatsApp, SMS, or Gmail with
     * strict Search-First verification and contact disambiguation.
     */
    fun sendVerifiedMessage(
        targetApp: MayraSafeMessagingPipeline.TargetApp,
        recipientName: String,
        messageText: String,
        subject: String = "",
        onVocalClarificationNeeded: (prompt: String, candidates: List<MayraContactResolver.ContactRecord>) -> Unit,
        onProgress: (status: String) -> Unit,
        onDone: (success: Boolean, message: String) -> Unit
    ) {
        val resolver = contactResolver ?: MayraContactResolver(this).also { contactResolver = it }
        val pipeline = messagingPipeline ?: MayraSafeMessagingPipeline(this, mainHandler).also { messagingPipeline = it }

        val forEmail = (targetApp == MayraSafeMessagingPipeline.TargetApp.GMAIL)
        val resolution = resolver.resolveContact(recipientName, forEmail = forEmail)

        when (resolution) {
            is MayraContactResolver.ResolutionResult.NotFound -> {
                onDone(false, resolution.message)
            }
            is MayraContactResolver.ResolutionResult.Ambiguous -> {
                // Pause and request vocal clarification from user
                onVocalClarificationNeeded(resolution.promptMessage, resolution.candidates)
            }
            is MayraContactResolver.ResolutionResult.ExactMatch -> {
                val verifiedContact = resolution.contact
                val targetAddress = if (forEmail) verifiedContact.emailAddress else verifiedContact.phoneNumber
                
                pipeline.startPipeline(
                    targetApp = targetApp,
                    contactName = verifiedContact.displayName,
                    verifiedAddress = targetAddress,
                    messageBody = messageText,
                    subject = subject,
                    onStatusUpdate = onProgress,
                    onCompleted = onDone
                )
            }
        }
    }

    /**
     * Resumes an ambiguous messaging task after the user has vocally picked a candidate.
     */
    fun resumeWithSelectedCandidate(
        targetApp: MayraSafeMessagingPipeline.TargetApp,
        candidate: MayraContactResolver.ContactRecord,
        messageText: String,
        subject: String = "",
        onProgress: (status: String) -> Unit,
        onDone: (success: Boolean, message: String) -> Unit
    ) {
        val pipeline = messagingPipeline ?: MayraSafeMessagingPipeline(this, mainHandler).also { messagingPipeline = it }
        val forEmail = (targetApp == MayraSafeMessagingPipeline.TargetApp.GMAIL)
        val targetAddress = if (forEmail) candidate.emailAddress else candidate.phoneNumber

        pipeline.startPipeline(
            targetApp = targetApp,
            contactName = candidate.displayName,
            verifiedAddress = targetAddress,
            messageBody = messageText,
            subject = subject,
            onStatusUpdate = onProgress,
            onCompleted = onDone
        )
    }

    /**
     * Simulates a tap on specific coordinates
     */
    fun tapCoordinates(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onComplete?.invoke(false)
            return
        }

        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                onComplete?.invoke(false)
            }
        }, null)
    }

    /**
     * Completes a WhatsApp direct-chat intent by pressing Send after the
     * WhatsApp UI has rendered. This is intentionally bounded and only runs
     * while the active window belongs to WhatsApp, so it cannot tap an
     * unrelated app's button.
     */
    fun scheduleWhatsAppAutoSend(initialDelayMs: Long = 1200L) {
        val delays = longArrayOf(initialDelayMs, 900L, 1200L)
        var attempt = 0

        fun trySend() {
            val root = rootInActiveWindow
            val activePackage = root?.packageName?.toString()
            if (root == null || activePackage != "com.whatsapp") {
                if (attempt < delays.lastIndex) {
                    val delay = delays[++attempt]
                    mainHandler.postDelayed({ trySend() }, delay)
                } else {
                    Log.w(TAG, "WhatsApp auto-send aborted: WhatsApp is not the active window.")
                }
                return
            }

            val sendNode = root.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send")
                ?.firstOrNull()
                ?: findNodeByContentDescription(root, "Send")
                ?: findNodeByContentDescription(root, "Send message")
                ?: findNodeByContentDescription(root, "भेजें")

            var clickable: AccessibilityNodeInfo? = sendNode
            while (clickable != null && !clickable.isClickable) {
                clickable = clickable.parent
            }

            if (clickable?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true) {
                Log.i(TAG, "WhatsApp auto-send completed successfully.")
                return
            }

            if (attempt < delays.lastIndex) {
                val delay = delays[++attempt]
                mainHandler.postDelayed({ trySend() }, delay)
            } else {
                Log.w(TAG, "WhatsApp auto-send failed: Send control was not found.")
            }
        }

        mainHandler.postDelayed({ trySend() }, initialDelayMs.coerceAtLeast(300L))
    }

    private fun findNodeByContentDescription(root: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(root)
        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            val description = node.contentDescription?.toString() ?: ""
            if (description.equals(text, ignoreCase = true) || description.contains(text, ignoreCase = true)) {
                return node
            }
            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { queue.add(it) }
            }
        }
        return null
    }

    /**
     * Fallback to launch any installed app by name or package
     */
    fun launchAppByNameOrPackage(context: Context, query: String): Boolean {
        val pm = context.packageManager
        var launchIntent = pm.getLaunchIntentForPackage(query)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            return true
        }

        val installedApps = pm.getInstalledApplications(0)
        for (appInfo in installedApps) {
            val appLabel = pm.getApplicationLabel(appInfo).toString()
            if (appLabel.equals(query, ignoreCase = true) || 
                appLabel.contains(query, ignoreCase = true) ||
                appInfo.packageName.contains(query, ignoreCase = true)) {
                launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                    return true
                }
            }
        }

        performGlobalAction(GLOBAL_ACTION_HOME)
        return false
    }

    override fun onInterrupt() {
        Log.w(TAG, "Mayra Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        messagingPipeline = null
        contactResolver = null
        instance = null
    }
}
