package com.mayra.assistant.gestures

import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.math.sqrt

/**
 * 3D Normalized Coordinate Point matching MediaPipe landmark format.
 */
data class LandmarkPoint(
    val x: Float,
    val y: Float,
    val z: Float = 0f
)

/**
 * Emitted event containing the detected hand gesture and palm center coordinates.
 */
data class GestureEvent(
    val gesture: String, // "DOUBLE_PINCH_ZOOM", "FIST_GRAB_LINK", "CLAW_TARGETING", or "NONE"
    val palmCenter: LandmarkPoint?,
    val handDetected: Boolean = palmCenter != null,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Listener callback interface for receiving detected hand gestures.
 */
fun interface GestureListener {
    fun onGestureDetected(event: GestureEvent)
}

/**
 * GestureBridge
 *
 * Android-native Kotlin port of the desktop BareHandsEngine (Phase 8) gesture detection logic.
 * Identifies spatial hand gestures from normalized 3D landmarks:
 *
 * 1. "DOUBLE_PINCH_ZOOM": Thumb tip (4) to Index tip (8) distance < 0.05
 * 2. "FIST_GRAB_LINK": Middle finger tip (12) to Wrist (0) distance < 0.25
 * 3. "CLAW_TARGETING": Default open/targeting hand pose
 *
 * Emits real-time gesture events via Kotlin SharedFlow, StateFlow, and thread-safe listener callbacks.
 */
class GestureBridge {

    companion object {
        const val GESTURE_NONE = "NONE"
        const val GESTURE_DOUBLE_PINCH_ZOOM = "DOUBLE_PINCH_ZOOM"
        const val GESTURE_FIST_GRAB_LINK = "FIST_GRAB_LINK"
        const val GESTURE_CLAW_TARGETING = "CLAW_TARGETING"

        // Euclidean distance thresholds identical to desktop BareHandsEngine
        const val PINCH_DISTANCE_THRESHOLD = 0.05f
        const val FIST_DISTANCE_THRESHOLD = 0.25f

        @Volatile
        private var defaultInstance: GestureBridge? = null

        val instance: GestureBridge
            get() = defaultInstance ?: synchronized(this) {
                defaultInstance ?: GestureBridge().also { defaultInstance = it }
            }
    }

    private val listeners = CopyOnWriteArrayList<GestureListener>()

    private val _gestureFlow = MutableSharedFlow<GestureEvent>(replay = 1, extraBufferCapacity = 64)
    val gestureFlow: SharedFlow<GestureEvent> = _gestureFlow.asSharedFlow()

    private val _currentGesture = MutableStateFlow(GESTURE_NONE)
    val currentGesture: StateFlow<String> = _currentGesture.asStateFlow()

    /**
     * Calculates 3D Euclidean distance between two landmark points.
     * Identical mathematical formula to desktop BareHandsEngine:
     * sqrt((p1.x - p2.x)^2 + (p1.y - p2.y)^2 + (p1.z - p2.z)^2)
     */
    fun calculateDistance(p1: LandmarkPoint, p2: LandmarkPoint): Float {
        val dx = p1.x - p2.x
        val dy = p1.y - p2.y
        val dz = p1.z - p2.z
        return sqrt((dx * dx + dy * dy + dz * dz).toDouble()).toFloat()
    }

    /**
     * Calculates 3D Euclidean distance between two MediaPipe NormalizedLandmark objects.
     */
    fun calculateDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): Float {
        val dx = p1.x() - p2.x()
        val dy = p1.y() - p2.y()
        val dz = p1.z() - p2.z()
        return sqrt((dx * dx + dy * dy + dz * dz).toDouble()).toFloat()
    }

    /**
     * Identifies active user gestures using normalized landmark coordinates:
     * - Thumb tip: Index 4
     * - Index tip: Index 8
     * - Middle tip: Index 12
     * - Wrist: Index 0
     */
    fun detectGesture(landmarks: List<LandmarkPoint>): String {
        if (landmarks.size < 21) {
            return GESTURE_NONE
        }

        val thumbTip = landmarks[4]
        val indexTip = landmarks[8]
        val middleTip = landmarks[12]
        val wrist = landmarks[0]

        // 1. Pinch Detection (Thumb + Index Distance)
        val pinchDist = calculateDistance(thumbTip, indexTip)

        // 2. Fist Detection (Middle tip close to wrist)
        val fistDist = calculateDistance(middleTip, wrist)

        return when {
            pinchDist < PINCH_DISTANCE_THRESHOLD -> GESTURE_DOUBLE_PINCH_ZOOM
            fistDist < FIST_DISTANCE_THRESHOLD -> GESTURE_FIST_GRAB_LINK
            else -> GESTURE_CLAW_TARGETING
        }
    }

    /**
     * Detects gesture directly from MediaPipe Tasks Vision NormalizedLandmark list.
     */
    fun detectGestureFromMediaPipe(landmarks: List<NormalizedLandmark>): String {
        if (landmarks.size < 21) {
            return GESTURE_NONE
        }

        val thumbTip = landmarks[4]
        val indexTip = landmarks[8]
        val middleTip = landmarks[12]
        val wrist = landmarks[0]

        val pinchDist = calculateDistance(thumbTip, indexTip)
        val fistDist = calculateDistance(middleTip, wrist)

        return when {
            pinchDist < PINCH_DISTANCE_THRESHOLD -> GESTURE_DOUBLE_PINCH_ZOOM
            fistDist < FIST_DISTANCE_THRESHOLD -> GESTURE_FIST_GRAB_LINK
            else -> GESTURE_CLAW_TARGETING
        }
    }

    /**
     * Processes landmark points, resolves palm center (landmark 9),
     * updates state, and dispatches GestureEvent.
     */
    fun processLandmarks(landmarks: List<LandmarkPoint>): GestureEvent {
        if (landmarks.size < 21) {
            val emptyEvent = GestureEvent(GESTURE_NONE, null, handDetected = false)
            dispatchGestureEvent(emptyEvent)
            return emptyEvent
        }

        val palmCenter = landmarks[9] // Middle MCP (Palm Center)
        val gesture = detectGesture(landmarks)
        val event = GestureEvent(
            gesture = gesture,
            palmCenter = palmCenter,
            handDetected = true
        )

        dispatchGestureEvent(event)
        return event
    }

    /**
     * Processes MediaPipe NormalizedLandmarks directly from HandLandmarker result.
     */
    fun processMediaPipeLandmarks(landmarks: List<NormalizedLandmark>): GestureEvent {
        if (landmarks.size < 21) {
            val emptyEvent = GestureEvent(GESTURE_NONE, null, handDetected = false)
            dispatchGestureEvent(emptyEvent)
            return emptyEvent
        }

        val mpCenter = landmarks[9]
        val palmCenter = LandmarkPoint(mpCenter.x(), mpCenter.y(), mpCenter.z())
        val gesture = detectGestureFromMediaPipe(landmarks)

        val event = GestureEvent(
            gesture = gesture,
            palmCenter = palmCenter,
            handDetected = true
        )

        dispatchGestureEvent(event)
        return event
    }

    /**
     * Notifies when no hand is present in the frame.
     */
    fun onNoHandDetected() {
        if (_currentGesture.value != GESTURE_NONE) {
            val event = GestureEvent(GESTURE_NONE, null, handDetected = false)
            dispatchGestureEvent(event)
        }
    }

    private fun dispatchGestureEvent(event: GestureEvent) {
        _currentGesture.value = event.gesture
        _gestureFlow.tryEmit(event)

        for (listener in listeners) {
            try {
                listener.onGestureDetected(event)
            } catch (e: Exception) {
                // Prevent individual subscriber exception from crashing the analyzer loop
            }
        }
    }

    fun addListener(listener: GestureListener) {
        listeners.add(listener)
    }

    fun removeListener(listener: GestureListener) {
        listeners.remove(listener)
    }

    fun clearListeners() {
        listeners.clear()
    }
}
