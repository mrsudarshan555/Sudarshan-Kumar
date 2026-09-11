package com.mayra.assistant.gestures

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.util.Log
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult

/**
 * CameraAnalyzer
 *
 * Implements ImageAnalysis.Analyzer for CameraX video frames.
 * Converts camera frames into MediaPipe Tasks Vision format (MPImage),
 * detects 21 3D hand landmarks in real-time, and dispatches them to GestureBridge.
 *
 * This is the Android-native equivalent of the desktop Python BareHandsEngine process_frame() loop.
 */
class CameraAnalyzer(
    context: Context,
    private val gestureBridge: GestureBridge = GestureBridge.instance,
    private val onGestureCallback: ((GestureEvent) -> Unit)? = null
) : ImageAnalysis.Analyzer, AutoCloseable {

    companion object {
        private const val TAG = "CameraAnalyzer"
        private const val MODEL_NAME = "hand_landmarker.task"
    }

    private var handLandmarker: HandLandmarker? = null
    private var isInitialized = false

    init {
        try {
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath(MODEL_NAME)
                .build()

            val options = HandLandmarker.HandLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setMinHandDetectionConfidence(0.7f)
                .setMinTrackingConfidence(0.7f)
                .setMinHandPresenceConfidence(0.7f)
                .setNumHands(1)
                .setRunningMode(RunningMode.IMAGE)
                .build()

            handLandmarker = HandLandmarker.createFromOptions(context, options)
            isInitialized = true
            Log.d(TAG, "MediaPipe HandLandmarker initialized successfully with $MODEL_NAME")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize MediaPipe HandLandmarker: ${e.message}", e)
        }
    }

    @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
        try {
            val landmarker = handLandmarker
            if (!isInitialized || landmarker == null) {
                return
            }

            // Convert CameraX ImageProxy to Bitmap
            val bitmap = imageProxy.toBitmap()

            // Correct orientation according to camera sensor rotation
            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
            val processedBitmap = if (rotationDegrees != 0) {
                val matrix = Matrix().apply {
                    postRotate(rotationDegrees.toFloat())
                }
                Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            } else {
                bitmap
            }

            // Build MediaPipe Image
            val mpImage: MPImage = BitmapImageBuilder(processedBitmap).build()

            // Run inference (synchronous image mode per frame)
            val result: HandLandmarkerResult = landmarker.detect(mpImage)

            val landmarksList = result.landmarks()
            if (landmarksList.isNotEmpty() && landmarksList[0].isNotEmpty()) {
                val handLandmarks = landmarksList[0]
                val event = gestureBridge.processMediaPipeLandmarks(handLandmarks)
                onGestureCallback?.invoke(event)
            } else {
                gestureBridge.onNoHandDetected()
                val noneEvent = GestureEvent(
                    gesture = GestureBridge.GESTURE_NONE,
                    palmCenter = null,
                    handDetected = false
                )
                onGestureCallback?.invoke(noneEvent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing camera frame with HandLandmarker", e)
        } finally {
            // CameraX requires closing the ImageProxy to receive subsequent frames
            imageProxy.close()
        }
    }

    override fun close() {
        try {
            handLandmarker?.close()
            handLandmarker = null
            isInitialized = false
            Log.d(TAG, "MediaPipe HandLandmarker closed")
        } catch (e: Exception) {
            Log.w(TAG, "Error closing HandLandmarker: ${e.message}")
        }
    }
}
