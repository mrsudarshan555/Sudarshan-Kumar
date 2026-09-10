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
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.mayra.assistant.MainActivity
import com.mayra.assistant.permissions.MayraOverlayPermissionManager
import kotlin.math.hypot

/**
 * OverlayService
 *
 * StonicX (Mayra) Floating Camera Bubble Foreground Service.
 * Displays a small floating camera bubble on top of any screen (home screen or other apps)
 * without replacing the launcher or touching the wallpaper.
 *
 * Features:
 * 1. Rounded-square floating view (~80dp x 80dp) using WindowManager (TYPE_APPLICATION_OVERLAY, FLAG_NOT_FOCUSABLE).
 * 2. Drag listener for repositioning anywhere across the display.
 * 3. Tap listener to expand the bubble into an enlarged preview dialog.
 * 4. Close text & Close (X) icon to stop the service and completely remove the overlay.
 * 5. Persistent foreground notification: "Mayra Gesture Camera Active".
 *
 * (Note: Live camera feed and MediaPipe gesture detection will be attached in the next phase).
 */
class OverlayService : Service() {

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

    private var windowManager: WindowManager? = null
    private var overlayRootView: FrameLayout? = null
    private var bubbleContainer: LinearLayout? = null
    private var expandedContainer: LinearLayout? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    private var isExpanded: Boolean = false

    // Dimensions in Pixels
    private var collapsedSizePx: Int = 0
    private var expandedWidthPx: Int = 0
    private var expandedHeightPx: Int = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "OverlayService onCreate")

        val density = resources.displayMetrics.density
        collapsedSizePx = (80 * density).toInt()   // ~80dp x 80dp rounded square
        expandedWidthPx = (240 * density).toInt()  // ~240dp expanded preview
        expandedHeightPx = (260 * density).toInt() // ~260dp expanded preview

        createNotificationChannel()
        startForegroundServiceNotification()

        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        initOverlayBubble()
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
        Log.d(TAG, "OverlayService onDestroy -> removing views and stopping foreground")
        removeOverlayView()
        isRunning = false
        super.onDestroy()
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

        // Close action intent
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
            x = (resources.displayMetrics.widthPixels - collapsedSizePx - (24 * density).toInt()).coerceAtLeast(40)
            y = (resources.displayMetrics.heightPixels * 0.22f).toInt()
        }

        // 2. Root wrapper
        val root = FrameLayout(this).apply {
            clipChildren = false
            clipToPadding = false
        }
        overlayRootView = root

        // 3. Collapsed Rounded-Square Bubble (~80dp x 80dp)
        bubbleContainer = createCollapsedBubbleView(density)

        // 4. Expanded Preview View (~240dp x 260dp)
        expandedContainer = createExpandedPreviewView(density)
        expandedContainer?.visibility = View.GONE

        root.addView(bubbleContainer)
        root.addView(expandedContainer)

        // 5. Attach Drag and Tap Listeners
        setupTouchAndDragListeners(root, density)

        try {
            windowManager?.addView(root, layoutParams)
            Log.d(TAG, "Floating camera bubble attached to WindowManager successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add floating bubble to WindowManager", e)
        }
    }

    /**
     * Builds the collapsed rounded square (~80dp x 80dp)
     */
    private fun createCollapsedBubbleView(density: Float): LinearLayout {
        val bubble = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(collapsedSizePx, collapsedSizePx)
            setPadding((6 * density).toInt(), (6 * density).toInt(), (6 * density).toInt(), (6 * density).toInt())

            // Rounded square background (Dark Slate Glass + Cyan Neon Border)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16 * density
                setColor(Color.parseColor("#E60B132B")) // Dark glass background
                setStroke((2 * density).toInt(), Color.parseColor("#06B6D4")) // Cyan border
            }
            elevation = 12 * density
        }

        // Camera Icon / Indicator Glyph
        val iconView = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_camera)
            setColorFilter(Color.parseColor("#22D3EE")) // Light Cyan tint
            layoutParams = LinearLayout.LayoutParams((28 * density).toInt(), (28 * density).toInt())
        }

        // Label: "MAYRA"
        val labelView = TextView(this).apply {
            text = "MAYRA"
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#E0F2FE"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (2 * density).toInt()
            }
        }

        // Mini status glowing pill
        val statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams((6 * density).toInt(), (6 * density).toInt()).apply {
                topMargin = (3 * density).toInt()
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#10B981")) // Green active dot
            }
        }

        bubble.addView(iconView)
        bubble.addView(labelView)
        bubble.addView(statusDot)

        return bubble
    }

    /**
     * Builds the expanded preview dialog with Close text & (X) icon
     */
    private fun createExpandedPreviewView(density: Float): LinearLayout {
        val expanded = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(expandedWidthPx, expandedHeightPx)
            setPadding((12 * density).toInt(), (10 * density).toInt(), (12 * density).toInt(), (10 * density).toInt())

            // Expanded Rounded Card (Dark Glass with Cyan Accent)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 20 * density
                setColor(Color.parseColor("#F20F172A")) // Deep Slate Glass
                setStroke((2 * density).toInt(), Color.parseColor("#38BDF8"))
            }
            elevation = 16 * density
        }

        // Header: Title + Close (X) icon & text
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val titleText = TextView(this).apply {
            text = "Gesture Camera"
            textSize = 12.5f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#38BDF8"))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        // Close button: Close text & Close (X) icon
        val closeButton = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding((8 * density).toInt(), (4 * density).toInt(), (8 * density).toInt(), (4 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 12 * density
                setColor(Color.parseColor("#33EF4444")) // Semi-translucent red pill
                setStroke((1 * density).toInt(), Color.parseColor("#EF4444"))
            }
            isClickable = true
            isFocusable = true
            setOnClickListener {
                Log.d(TAG, "Close button clicked -> stopping OverlayService")
                stopSelf()
            }
        }

        val closeIcon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(Color.parseColor("#FCA5A5"))
            layoutParams = LinearLayout.LayoutParams((14 * density).toInt(), (14 * density).toInt())
        }

        val closeText = TextView(this).apply {
            text = " Close"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#FEE2E2"))
        }

        closeButton.addView(closeIcon)
        closeButton.addView(closeText)

        header.addView(titleText)
        header.addView(closeButton)

        // Middle: Camera Preview Placeholder Area (Ready for Phase 2 TextureView / SurfaceView)
        val previewPlaceholder = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            ).apply {
                topMargin = (8 * density).toInt()
                bottomMargin = (8 * density).toInt()
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 12 * density
                setColor(Color.parseColor("#1E293B"))
                setStroke((1 * density).toInt(), Color.parseColor("#334155"))
            }
        }

        val centerHint = TextView(this).apply {
            text = "Bare Hands Spatial\nCamera Preview"
            textSize = 11f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#94A3B8"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        }
        previewPlaceholder.addView(centerHint)

        // Footer: Tap to minimize hint
        val footerText = TextView(this).apply {
            text = "Tap bubble to minimize"
            textSize = 10f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#64748B"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        expanded.addView(header)
        expanded.addView(previewPlaceholder)
        expanded.addView(footerText)

        return expanded
    }

    /**
     * Touch and Drag Listener with click-threshold discrimination
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
     * Toggles between collapsed (~80dp x 80dp) bubble and expanded preview
     */
    private fun toggleExpandCollapse() {
        val params = layoutParams ?: return
        isExpanded = !isExpanded

        if (isExpanded) {
            bubbleContainer?.visibility = View.GONE
            expandedContainer?.visibility = View.VISIBLE
            params.width = expandedWidthPx
            params.height = expandedHeightPx
            Log.d(TAG, "Overlay expanded to $expandedWidthPx x $expandedHeightPx")
        } else {
            expandedContainer?.visibility = View.GONE
            bubbleContainer?.visibility = View.VISIBLE
            params.width = collapsedSizePx
            params.height = collapsedSizePx
            Log.d(TAG, "Overlay collapsed to $collapsedSizePx x $collapsedSizePx")
        }

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
        bubbleContainer = null
        expandedContainer = null
        layoutParams = null
    }
}
