package com.mayra.assistant.services

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.Outline
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.mayra.assistant.MainActivity
import com.mayra.assistant.gestures.CameraAnalyzer
import com.mayra.assistant.gestures.GestureBridge
import com.mayra.assistant.permissions.MayraOverlayPermissionManager
import android.os.Handler
import android.os.Looper
import kotlin.math.hypot

/**
 * OverlayService
 *
 * StonicX (Mayra) Floating Camera Bubble Foreground Service with live CameraX preview.
 * Displays a small floating camera bubble on top of any screen (home screen or other apps)
 * without replacing the launcher or touching the wallpaper.
 *
 * Features:
 * 1. CameraX API (androidx.camera.core) streaming the FRONT CAMERA in real time.
 * 2. Embedded CameraX PreviewView inside the floating overlay box so the user's face/hand
 *    is visible in real time — confirming that the camera is actively recording.
 * 3. Rounded-square floating view (~80dp x 80dp) using WindowManager (TYPE_APPLICATION_OVERLAY, FLAG_NOT_FOCUSABLE).
 * 4. Drag listener for repositioning anywhere across the display.
 * 5. Tap listener to expand the bubble into an enlarged preview card (~240dp x 280dp).
 * 6. Close text & Close (X) icon to stop the service, stop the camera, and remove the overlay completely.
 * 7. Persistent foreground notification: "Mayra Gesture Camera Active".
 */
class OverlayService : Service(), LifecycleOwner {

    companion object {
        private const val TAG = "OverlayService"
        const val CHANNEL_ID = "mayra_gesture_camera_overlay_channel"
        const val NOTIFICATION_ID = 4001

        const val ACTION_START = "com.mayra.assistant.action.START_OVERLAY_SERVICE"
        const val ACTION_STOP = "com.mayra.assistant.action.STOP_OVERLAY_SERVICE"

        @Volatile
        var isRunning: Boolean = false
            private set

        fun start(context: Context) {
            if (!MayraOverlayPermissionManager.hasOverlayPermission(context)) {
                Log.w(TAG, "Cannot start OverlayService: SYSTEM_ALERT_WINDOW permission not granted")
                MayraOverlayPermissionManager.openOverlaySettings(context)
                return
            }

            val intent = Intent(context, OverlayService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, OverlayService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    // LifecycleOwner implementation for CameraX lifecycle binding
    private val lifecycleRegistry: LifecycleRegistry = LifecycleRegistry(this)
    override val lifecycle: Lifecycle get() = lifecycleRegistry

    private var windowManager: WindowManager? = null
    private var overlayRootView: FrameLayout? = null
    private var mainCard: LinearLayout? = null
    private var headerLayout: LinearLayout? = null
    private var footerView: TextView? = null
    private var closeButton: LinearLayout? = null
    private var previewContainer: FrameLayout? = null
    private var previewView: PreviewView? = null
    private var liveBadgeView: LinearLayout? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    // CameraX references
    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var cameraAnalyzer: CameraAnalyzer? = null
    private var liveGestureLabel: TextView? = null
    private var statusDotView: View? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private var isExpanded: Boolean = false

    // Dimensions in Pixels
    private var collapsedSizePx: Int = 0
    private var expandedWidthPx: Int = 0
    private var expandedHeightPx: Int = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "OverlayService onCreate -> initializing lifecycle and views")

        lifecycleRegistry.currentState = Lifecycle.State.CREATED

        val density = resources.displayMetrics.density
        collapsedSizePx = (80 * density).toInt()   // ~80dp x 80dp rounded square
        expandedWidthPx = (240 * density).toInt()  // ~240dp expanded preview
        expandedHeightPx = (280 * density).toInt() // ~280dp expanded preview

        createNotificationChannel()
        startForegroundServiceNotification()

        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        initOverlayBubble()

        lifecycleRegistry.currentState = Lifecycle.State.STARTED
        lifecycleRegistry.currentState = Lifecycle.State.RESUMED

        // Start live CameraX front camera feed
        startCamera()

        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            Log.d(TAG, "Received ACTION_STOP -> stopping OverlayService")
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onDestroy() {
        Log.d(TAG, "OverlayService onDestroy -> releasing camera, views and lifecycle")
        stopCamera()
        lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
        removeOverlayView()
        isRunning = false
        super.onDestroy()
    }

    /**
     * Start live front camera stream using CameraX API (androidx.camera.core)
     */
    private fun startCamera() {
        if (!MayraOverlayPermissionManager.hasCameraPermission(this)) {
            Log.w(TAG, "Camera permission not granted, skipping CameraX binding")
            return
        }

        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val provider = cameraProviderFuture.get()
                cameraProvider = provider

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView?.surfaceProvider)
                }

                // ImageAnalysis for real-time gesture tracking
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                val analyzer = CameraAnalyzer(this, GestureBridge.instance) { event ->
                    mainHandler.post {
                        val gestureText = when (event.gesture) {
                            GestureBridge.GESTURE_DOUBLE_PINCH_ZOOM -> "PINCH"
                            GestureBridge.GESTURE_FIST_GRAB_LINK -> "FIST"
                            GestureBridge.GESTURE_CLAW_TARGETING -> "CLAW"
                            else -> "REC"
                        }
                        liveGestureLabel?.text = " $gestureText"
                    }
                }
                cameraAnalyzer = analyzer
                imageAnalysis.setAnalyzer(ContextCompat.getMainExecutor(this), analyzer)

                // Front camera selector
                val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                provider.unbindAll()
                camera = provider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis)
                Log.d(TAG, "CameraX front camera & Gesture Analyzer successfully bound")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to bind CameraX preview and analyzer in OverlayService", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    /**
     * Stop and release CameraX hardware completely
     */
    private fun stopCamera() {
        try {
            cameraAnalyzer?.close()
            cameraAnalyzer = null
            cameraProvider?.unbindAll()
            cameraProvider = null
            camera = null
            Log.d(TAG, "CameraX front camera stopped and unbound completely")
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping CameraX: ${e.message}")
        }
    }

    /**
     * Set up Android notification channel for foreground service compliance
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Mayra Gesture Camera",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows persistent status while Mayra floating gesture camera is active."
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    /**
     * Start persistent notification indicating "Mayra Gesture Camera Active"
     */
    private fun startForegroundServiceNotification() {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val stopIntent = Intent(this, OverlayService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("StonicX (Mayra)")
            .setContentText("Mayra Gesture Camera Active")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close Overlay", stopPendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    /**
     * Inflates and attaches the floating camera bubble view using WindowManager
     */
    @SuppressLint("ClickableViewAccessibility")
    private fun initOverlayBubble() {
        if (overlayRootView != null) return

        val density = resources.displayMetrics.density

        // 1. Configure WindowManager Layout Params (TYPE_APPLICATION_OVERLAY, FLAG_NOT_FOCUSABLE)
        val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            collapsedSizePx,
            collapsedSizePx,
            windowType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = (resources.displayMetrics.widthPixels - collapsedSizePx - (20 * density).toInt()).coerceAtLeast(40)
            y = (resources.displayMetrics.heightPixels * 0.20f).toInt()
        }

        // 2. Root FrameLayout
        val root = FrameLayout(this).apply {
            clipChildren = false
            clipToPadding = false
        }
        overlayRootView = root

        // 3. Main Card Container (supports collapsed rounded square & expanded card)
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setPadding((5 * density).toInt(), (5 * density).toInt(), (5 * density).toInt(), (5 * density).toInt())
            background = createCardBackground(density, isExpanded = false)
            elevation = 14 * density
        }
        mainCard = card

        // 4. Header (Expanded only: Title + Close (X) icon & text button)
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (6 * density).toInt()
            }
            visibility = View.GONE
        }
        headerLayout = header

        val titleText = TextView(this).apply {
            text = "Mayra Camera"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#38BDF8"))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        // Close Button with Close text & (X) icon
        val closeBtn = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((8 * density).toInt(), (4 * density).toInt(), (8 * density).toInt(), (4 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 10 * density
                setColor(Color.parseColor("#44EF4444")) // Red translucent pill
                setStroke((1 * density).toInt(), Color.parseColor("#EF4444"))
            }
            isClickable = true
            isFocusable = true
            setOnClickListener {
                Log.d(TAG, "Close (X) clicked -> stopping OverlayService")
                stopSelf()
            }
        }
        closeButton = closeBtn

        val closeIcon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(Color.parseColor("#FCA5A5"))
            layoutParams = LinearLayout.LayoutParams((13 * density).toInt(), (13 * density).toInt())
        }

        val closeText = TextView(this).apply {
            text = " Close"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#FEE2E2"))
        }

        closeBtn.addView(closeIcon)
        closeBtn.addView(closeText)
        header.addView(titleText)
        header.addView(closeBtn)

        // 5. Live Camera Preview Container (holds PreviewView & live indicator)
        val previewBox = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
            clipChildren = true
            clipToPadding = true
        }
        previewContainer = previewBox

        // CameraX PreviewView with TextureView (COMPATIBLE mode) for smooth window overlay rendering
        val pView = PreviewView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            scaleType = PreviewView.ScaleType.FILL_CENTER
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val radius = if (isExpanded) 14 * density else 12 * density
                    outline.setRoundRect(0, 0, view.width, view.height, radius)
                }
            }
            clipToOutline = true
        }
        previewView = pView
        previewBox.addView(pView)

        // Live recording indicator badge (overlaid on top of preview)
        val liveBadge = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((5 * density).toInt(), (2 * density).toInt(), (5 * density).toInt(), (2 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 8 * density
                setColor(Color.parseColor("#B3000000")) // Semi-transparent black pill
            }
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                setMargins((4 * density).toInt(), (4 * density).toInt(), 0, 0)
            }
        }
        liveBadgeView = liveBadge

        val dot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams((6 * density).toInt(), (6 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#10B981")) // Active green dot
            }
        }
        val liveLabel = TextView(this).apply {
            text = " REC"
            textSize = 8.5f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#34D399"))
        }
        liveGestureLabel = liveLabel
        statusDotView = dot
        liveBadge.addView(dot)
        liveBadge.addView(liveLabel)
        previewBox.addView(liveBadge)

        // 6. Footer hint (expanded mode only)
        val footer = TextView(this).apply {
            text = "Tap to minimize • Drag anywhere"
            textSize = 10f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#94A3B8"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (6 * density).toInt()
            }
            visibility = View.GONE
        }
        footerView = footer

        // Assemble hierarchy
        card.addView(header)
        card.addView(previewBox)
        card.addView(footer)
        root.addView(card)

        // 7. Attach Drag and Tap Listeners
        setupTouchAndDragListeners(root, density)

        try {
            windowManager?.addView(root, layoutParams)
            Log.d(TAG, "Floating camera bubble attached to WindowManager successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add floating bubble to WindowManager", e)
        }
    }

    /**
     * Creates background drawable for the card (cyan border + dark slate glass)
     */
    private fun createCardBackground(density: Float, isExpanded: Boolean): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = if (isExpanded) 18 * density else 16 * density
            setColor(Color.parseColor("#F20F172A")) // Dark Slate Glass
            setStroke(
                (2 * density).toInt(),
                Color.parseColor(if (isExpanded) "#38BDF8" else "#06B6D4")
            )
        }
    }

    /**
     * Touch and Drag Listener with click-threshold discrimination and close button support
     */
    @SuppressLint("ClickableViewAccessibility")
    private fun setupTouchAndDragListeners(root: View, density: Float) {
        val clickThresholdPx = 10 * density

        root.setOnTouchListener(object : View.OnTouchListener {
            private var initialX: Int = 0
            private var initialY: Int = 0
            private var initialTouchX: Float = 0f
            private var initialTouchY: Float = 0f
            private var isDragging: Boolean = false

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                val params = layoutParams ?: return false

                // If expanded, check if touch falls inside Close Button
                if (isExpanded && closeButton != null) {
                    val loc = IntArray(2)
                    closeButton?.getLocationOnScreen(loc)
                    val inClose = event.rawX >= loc[0] &&
                            event.rawX <= loc[0] + (closeButton?.width ?: 0) &&
                            event.rawY >= loc[1] &&
                            event.rawY <= loc[1] + (closeButton?.height ?: 0)

                    if (inClose) {
                        if (event.action == MotionEvent.ACTION_UP) {
                            Log.d(TAG, "Touch inside Close button -> stopping service")
                            stopSelf()
                        }
                        return true
                    }
                }

                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isDragging = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - initialTouchX
                        val dy = event.rawY - initialTouchY

                        if (!isDragging && hypot(dx, dy) > clickThresholdPx) {
                            isDragging = true
                        }

                        if (isDragging) {
                            params.x = (initialX + dx).toInt()
                            params.y = (initialY + dy).toInt()
                            windowManager?.updateViewLayout(root, params)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        val dx = event.rawX - initialTouchX
                        val dy = event.rawY - initialTouchY

                        // If touch movement was under threshold, register as a TAP!
                        if (!isDragging && hypot(dx, dy) <= clickThresholdPx) {
                            toggleExpandCollapse()
                        }
                        return true
                    }
                }
                return false
            }
        })
    }

    /**
     * Toggles between collapsed (~80dp x 80dp) bubble and expanded preview card (~240dp x 280dp)
     */
    private fun toggleExpandCollapse() {
        val params = layoutParams ?: return
        val density = resources.displayMetrics.density
        isExpanded = !isExpanded

        if (isExpanded) {
            headerLayout?.visibility = View.VISIBLE
            footerView?.visibility = View.VISIBLE
            mainCard?.background = createCardBackground(density, isExpanded = true)

            // Preview box takes remaining height in expanded mode
            previewContainer?.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )

            params.width = expandedWidthPx
            params.height = expandedHeightPx
            Log.d(TAG, "Overlay expanded to $expandedWidthPx x $expandedHeightPx")
        } else {
            headerLayout?.visibility = View.GONE
            footerView?.visibility = View.GONE
            mainCard?.background = createCardBackground(density, isExpanded = false)

            previewContainer?.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )

            params.width = collapsedSizePx
            params.height = collapsedSizePx
            Log.d(TAG, "Overlay collapsed to $collapsedSizePx x $collapsedSizePx")
        }

        previewView?.invalidateOutline()

        try {
            windowManager?.updateViewLayout(overlayRootView, params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update layout during expand/collapse toggle", e)
        }
    }

    /**
     * Safely removes the overlay view from the WindowManager
     */
    private fun removeOverlayView() {
        overlayRootView?.let { view ->
            try {
                windowManager?.removeView(view)
                Log.d(TAG, "Overlay view removed from WindowManager")
            } catch (e: Exception) {
                Log.w(TAG, "Error while removing overlay view: ${e.message}")
            }
        }
        overlayRootView = null
        mainCard = null
        headerLayout = null
        footerView = null
        closeButton = null
        previewContainer = null
        previewView = null
        liveBadgeView = null
        liveGestureLabel = null
        statusDotView = null
        cameraAnalyzer?.close()
        cameraAnalyzer = null
        layoutParams = null
    }
}
