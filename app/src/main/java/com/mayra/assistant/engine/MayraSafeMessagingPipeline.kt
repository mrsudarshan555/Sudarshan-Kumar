package com.mayra.assistant.engine

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo

/**
 * MAYRA Safe & Automated Multi-App Messaging Pipeline
 * 
 * Executes a verified, search-first automation flow:
 * Open Target App -> Locate Search -> Query Name -> Verify Matched Contact -> Click Profile -> Type Message -> Click Send
 * 
 * Supports:
 * 1. WhatsApp (com.whatsapp)
 * 2. Default SMS / Google Messages (com.google.android.apps.messaging, com.samsung.android.messaging)
 * 3. Gmail (com.google.android.gm)
 */
class MayraSafeMessagingPipeline(
    private val service: AccessibilityService,
    private val mainHandler: Handler = Handler(Looper.getMainLooper())
) {

    companion object {
        private const val TAG = "MayraSafeMessaging"
        private const val STEP_TIMEOUT_MS = 6000L

        const val APP_WHATSAPP = "com.whatsapp"
        const val APP_GOOGLE_MESSAGES = "com.google.android.apps.messaging"
        const val APP_SAMSUNG_MESSAGES = "com.samsung.android.messaging"
        const val APP_GMAIL = "com.google.android.gm"
    }

    enum class TargetApp {
        WHATSAPP,
        SMS,
        GMAIL
    }

    enum class PipelineState {
        IDLE,
        APP_LAUNCHING,
        LOCATING_SEARCH,
        SEARCH_TYPED,
        VERIFYING_AND_SELECTING_CONTACT,
        TYPING_MESSAGE,
        CLICKING_SEND,
        COMPLETED,
        FAILED
    }

    data class Session(
        val targetApp: TargetApp,
        val contactName: String,
        val verifiedAddress: String, // Phone number or email
        val messageBody: String,
        val subject: String = "",
        var state: PipelineState = PipelineState.IDLE,
        val onStatusUpdate: (String) -> Unit,
        val onCompleted: (Boolean, String) -> Unit
    )

    @Volatile
    private var currentSession: Session? = null
    private var timeoutRunnable: Runnable? = null

    /**
     * Entry Point: Start Safe Automated Messaging
     */
    fun startPipeline(
        targetApp: TargetApp,
        contactName: String,
        verifiedAddress: String,
        messageBody: String,
        subject: String = "",
        onStatusUpdate: (String) -> Unit,
        onCompleted: (Boolean, String) -> Unit
    ) {
        if (currentSession != null && currentSession?.state != PipelineState.IDLE) {
            onCompleted(false, "Another messaging automation is already running.")
            return
        }

        val session = Session(
            targetApp = targetApp,
            contactName = contactName,
            verifiedAddress = verifiedAddress,
            messageBody = messageBody,
            subject = subject,
            state = PipelineState.APP_LAUNCHING,
            onStatusUpdate = onStatusUpdate,
            onCompleted = onCompleted
        )
        currentSession = session

        scheduleTimeout("App launch timeout")

        // 1. Launch Target App
        val targetPackage = when (targetApp) {
            TargetApp.WHATSAPP -> APP_WHATSAPP
            TargetApp.SMS -> getSmsPackageName(service)
            TargetApp.GMAIL -> APP_GMAIL
        }

        val pm = service.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(targetPackage)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            session.onStatusUpdate("Opening ${targetApp.name.lowercase().replaceFirstChar { it.uppercase() }}...")
            service.startActivity(launchIntent)
            session.state = PipelineState.LOCATING_SEARCH
            scheduleNextStep(800) { processNextStep() }
        } else {
            abortSession("Target app $targetPackage is not installed on this device.")
        }
    }

    /**
     * Core Event Loop triggered by UI content/window state changes
     */
    fun onAccessibilityEventReceived(packageName: String) {
        val session = currentSession ?: return
        if (session.state == PipelineState.IDLE || session.state == PipelineState.COMPLETED) return

        mainHandler.post {
            processNextStep()
        }
    }

    private fun processNextStep() {
        val session = currentSession ?: return
        val rootNode = service.rootInActiveWindow ?: return

        try {
            when (session.state) {
                PipelineState.LOCATING_SEARCH -> {
                    when (session.targetApp) {
                        TargetApp.WHATSAPP -> executeWhatsAppSearchStep(rootNode, session)
                        TargetApp.SMS -> executeSmsSearchStep(rootNode, session)
                        TargetApp.GMAIL -> executeGmailComposeStep(rootNode, session)
                    }
                }
                PipelineState.SEARCH_TYPED -> {
                    // Allow UI to populate search results
                    scheduleNextStep(700) {
                        val updatedRoot = service.rootInActiveWindow ?: return@scheduleNextStep
                        verifyAndSelectContact(updatedRoot, session)
                    }
                }
                PipelineState.TYPING_MESSAGE -> {
                    typeMessageIntoActiveField(rootNode, session)
                }
                PipelineState.CLICKING_SEND -> {
                    clickSendButton(rootNode, session)
                }
                else -> {}
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing pipeline step ${session.state}", e)
        }
    }

    // =========================================================================
    // 1. WHATSAPP AUTOMATION
    // =========================================================================
    private fun executeWhatsAppSearchStep(rootNode: AccessibilityNodeInfo, session: Session) {
        // Find Search Icon / Bar
        val searchView = findNodeByViewIds(rootNode, listOf(
            "com.whatsapp:id/menuitem_search",
            "com.whatsapp:id/search_bar",
            "com.whatsapp:id/search_src_text",
            "com.whatsapp:id/search_input"
        )) ?: findNodeByContentDescriptions(rootNode, listOf("Search", "खोजें", "Search…"))

        if (searchView != null) {
            if (searchView.isClickable) {
                searchView.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }

            scheduleNextStep(400) {
                val inputNode = findNodeByViewIds(service.rootInActiveWindow ?: rootNode, listOf(
                    "com.whatsapp:id/search_src_text",
                    "com.whatsapp:id/search_input"
                )) ?: searchView

                session.onStatusUpdate("Searching for '${session.contactName}' in WhatsApp...")
                setTextOnNode(inputNode, session.contactName)
                session.state = PipelineState.SEARCH_TYPED
                resetTimeout()
            }
        }
    }

    // =========================================================================
    // 2. SMS AUTOMATION (Google Messages / Samsung Messages)
    // =========================================================================
    private fun executeSmsSearchStep(rootNode: AccessibilityNodeInfo, session: Session) {
        // Find "Start chat" FAB or Search bar
        val startChatButton = findNodeByViewIds(rootNode, listOf(
            "com.google.android.apps.messaging:id/start_chat_fab",
            "com.google.android.apps.messaging:id/action_start_chat",
            "com.samsung.android.messaging:id/fab"
        )) ?: findNodeByContentDescriptions(rootNode, listOf("Start chat", "Start conversation", "चैट शुरू करें"))

        if (startChatButton != null) {
            startChatButton.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            session.onStatusUpdate("Opening SMS compose for '${session.contactName}'...")
            scheduleNextStep(600) {
                val activeRoot = service.rootInActiveWindow ?: return@scheduleNextStep
                val recipientInput = findNodeByViewIds(activeRoot, listOf(
                    "com.google.android.apps.messaging:id/recipient_text_view",
                    "com.google.android.apps.messaging:id/search_src_text"
                )) ?: findFirstEditableNode(activeRoot)

                if (recipientInput != null) {
                    val query = session.verifiedAddress.ifBlank { session.contactName }
                    setTextOnNode(recipientInput, query)
                    session.state = PipelineState.SEARCH_TYPED
                    resetTimeout()
                }
            }
        } else {
            // Direct search bar in SMS list
            val searchBar = findNodeByViewIds(rootNode, listOf("com.google.android.apps.messaging:id/search_bar"))
            if (searchBar != null) {
                searchBar.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                session.state = PipelineState.SEARCH_TYPED
            }
        }
    }

    // =========================================================================
    // 3. GMAIL AUTOMATION
    // =========================================================================
    private fun executeGmailComposeStep(rootNode: AccessibilityNodeInfo, session: Session) {
        val composeBtn = findNodeByViewIds(rootNode, listOf(
            "com.google.android.gm:id/compose_button",
            "com.google.android.gm:id/fab"
        )) ?: findNodeByContentDescriptions(rootNode, listOf("Compose", "लिखें", "कंपोज़"))

        if (composeBtn != null) {
            composeBtn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            session.onStatusUpdate("Opening Gmail compose window...")
            scheduleNextStep(800) {
                val activeRoot = service.rootInActiveWindow ?: return@scheduleNextStep
                val toField = findNodeByViewIds(activeRoot, listOf(
                    "com.google.android.gm:id/to",
                    "com.google.android.gm:id/peoplekit_autocomplete"
                )) ?: findFirstEditableNode(activeRoot)

                if (toField != null) {
                    val recipient = session.verifiedAddress.ifBlank { session.contactName }
                    session.onStatusUpdate("Setting recipient to $recipient...")
                    setTextOnNode(toField, recipient)
                    
                    // Proceed to subject and body
                    scheduleNextStep(600) {
                        fillGmailSubjectAndBody(service.rootInActiveWindow ?: activeRoot, session)
                    }
                }
            }
        }
    }

    private fun fillGmailSubjectAndBody(rootNode: AccessibilityNodeInfo, session: Session) {
        if (session.subject.isNotBlank()) {
            val subjectNode = findNodeByViewIds(rootNode, listOf("com.google.android.gm:id/subject"))
            if (subjectNode != null) {
                setTextOnNode(subjectNode, session.subject)
            }
        }

        val bodyNode = findNodeByViewIds(rootNode, listOf(
            "com.google.android.gm:id/body",
            "com.google.android.gm:id/composearea_tap_trap_element"
        )) ?: findLastEditableNode(rootNode)

        if (bodyNode != null) {
            session.onStatusUpdate("Typing email message...")
            setTextOnNode(bodyNode, session.messageBody)
            session.state = PipelineState.CLICKING_SEND
            scheduleNextStep(600) { processNextStep() }
        }
    }

    // =========================================================================
    // CONTACT VERIFICATION & SELECTION
    // =========================================================================
    private fun verifyAndSelectContact(rootNode: AccessibilityNodeInfo, session: Session) {
        session.onStatusUpdate("Verifying contact '${session.contactName}'...")

        // Search within search result items
        val contactNode = findMatchingContactRow(rootNode, session.contactName)
        if (contactNode != null) {
            var clickableNode: AccessibilityNodeInfo? = contactNode
            while (clickableNode != null && !clickableNode.isClickable) {
                clickableNode = clickableNode.parent
            }

            if (clickableNode != null && clickableNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                Log.i(TAG, "Selected verified contact item for ${session.contactName}")
                session.onStatusUpdate("Contact verified. Opening chat...")
                session.state = PipelineState.TYPING_MESSAGE
                resetTimeout()
                scheduleNextStep(1000) { processNextStep() }
                return
            }
        }

        // Retry if results are still loading
        scheduleNextStep(600) {
            val retryRoot = service.rootInActiveWindow ?: return@scheduleNextStep
            val retryNode = findMatchingContactRow(retryRoot, session.contactName)
            if (retryNode != null) {
                var clickParent: AccessibilityNodeInfo? = retryNode
                while (clickParent != null && !clickParent.isClickable) {
                    clickParent = clickParent.parent
                }
                clickParent?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                session.state = PipelineState.TYPING_MESSAGE
                scheduleNextStep(1000) { processNextStep() }
            } else {
                abortSession("Could not verify '${session.contactName}' in app search results.")
            }
        }
    }

    private fun findMatchingContactRow(rootNode: AccessibilityNodeInfo, contactName: String): AccessibilityNodeInfo? {
        val queryLower = contactName.lowercase().trim()
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(rootNode)

        while (queue.isNotEmpty()) {
            val node = queue.removeFirst()
            val text = node.text?.toString()?.lowercase() ?: ""
            val desc = node.contentDescription?.toString()?.lowercase() ?: ""

            if (text.contains(queryLower) || desc.contains(queryLower)) {
                val viewId = node.viewIdResourceName?.lowercase() ?: ""
                // Avoid matching search input itself
                if (!viewId.contains("search_src_text") && !viewId.contains("search_input")) {
                    return node
                }
            }

            for (i in 0 until node.childCount) {
                node.getChild(i)?.let { queue.add(it) }
            }
        }
        return null
    }

    // =========================================================================
    // TYPING & SENDING
    // =========================================================================
    private fun typeMessageIntoActiveField(rootNode: AccessibilityNodeInfo, session: Session) {
        val inputNode = findNodeByViewIds(rootNode, listOf(
            "com.whatsapp:id/entry",
            "com.google.android.apps.messaging:id/compose_message_text",
            "com.google.android.apps.messaging:id/message_text",
            "com.samsung.android.messaging:id/message_edit_text"
        )) ?: findFirstEditableNode(rootNode)

        if (inputNode != null) {
            session.onStatusUpdate("Typing message...")
            setTextOnNode(inputNode, session.messageBody)
            session.state = PipelineState.CLICKING_SEND
            resetTimeout()
            scheduleNextStep(700) { processNextStep() }
        } else {
            // Wait for chat screen to render
            scheduleNextStep(500) {
                val retryRoot = service.rootInActiveWindow ?: return@scheduleNextStep
                val retryInput = findFirstEditableNode(retryRoot)
                if (retryInput != null) {
                    setTextOnNode(retryInput, session.messageBody)
                    session.state = PipelineState.CLICKING_SEND
                    scheduleNextStep(700) { processNextStep() }
                }
            }
        }
    }

    private fun clickSendButton(rootNode: AccessibilityNodeInfo, session: Session) {
        val sendNode = findNodeByViewIds(rootNode, listOf(
            "com.whatsapp:id/send",
            "com.google.android.apps.messaging:id/send_message_button_icon",
            "com.google.android.apps.messaging:id/send_message_button",
            "com.google.android.gm:id/send"
        )) ?: findNodeByContentDescriptions(rootNode, listOf("Send", "भेजें", "Send message"))

        if (sendNode != null) {
            var clickableSend: AccessibilityNodeInfo? = sendNode
            while (clickableSend != null && !clickableSend.isClickable) {
                clickableSend = clickableSend.parent
            }

            if (clickableSend != null && clickableSend.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                Log.i(TAG, "Successfully clicked Send button for ${session.contactName}")
                completeSession(true, "Message successfully sent to ${session.contactName} via ${session.targetApp.name}!")
                return
            }
        }

        abortSession("Could not locate or tap the Send button.")
    }

    // =========================================================================
    // UTILITY HELPERS
    // =========================================================================
    private fun setTextOnNode(node: AccessibilityNodeInfo, text: String): Boolean {
        val arguments = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
    }

    private fun findNodeByViewIds(rootNode: AccessibilityNodeInfo, viewIds: List<String>): AccessibilityNodeInfo? {
        for (id in viewIds) {
            val list = rootNode.findAccessibilityNodeInfosByViewId(id)
            if (!list.isNullOrEmpty()) {
                return list.first()
            }
        }
        return null
    }

    private fun findNodeByContentDescriptions(rootNode: AccessibilityNodeInfo, descriptions: List<String>): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(rootNode)

        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            val desc = current.contentDescription?.toString() ?: ""
            if (descriptions.any { desc.contains(it, ignoreCase = true) }) {
                return current
            }
            for (i in 0 until current.childCount) {
                current.getChild(i)?.let { queue.add(it) }
            }
        }
        return null
    }

    private fun findFirstEditableNode(rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(rootNode)

        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current.isEditable) return current
            for (i in 0 until current.childCount) {
                current.getChild(i)?.let { queue.add(it) }
            }
        }
        return null
    }

    private fun findLastEditableNode(rootNode: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        var last: AccessibilityNodeInfo? = null
        val queue = ArrayDeque<AccessibilityNodeInfo>()
        queue.add(rootNode)

        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current.isEditable) last = current
            for (i in 0 until current.childCount) {
                current.getChild(i)?.let { queue.add(it) }
            }
        }
        return last
    }

    private fun getSmsPackageName(context: Context): String {
        return android.provider.Telephony.Sms.getDefaultSmsPackage(context)
            ?: APP_GOOGLE_MESSAGES
    }

    private fun scheduleNextStep(delayMs: Long, action: () -> Unit) {
        mainHandler.postDelayed(action, delayMs)
    }

    private fun scheduleTimeout(reason: String) {
        timeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        timeoutRunnable = Runnable {
            abortSession("Timeout during automation: $reason")
        }
        mainHandler.postDelayed(timeoutRunnable!!, STEP_TIMEOUT_MS)
    }

    private fun resetTimeout() {
        timeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        scheduleTimeout("Step execution timeout")
    }

    private fun completeSession(success: Boolean, message: String) {
        timeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        val session = currentSession
        currentSession = null
        session?.state = if (success) PipelineState.COMPLETED else PipelineState.FAILED
        session?.onCompleted?.invoke(success, message)
    }

    private fun abortSession(errorMessage: String) {
        Log.w(TAG, "Aborting messaging session: $errorMessage")
        completeSession(false, errorMessage)
    }
}
