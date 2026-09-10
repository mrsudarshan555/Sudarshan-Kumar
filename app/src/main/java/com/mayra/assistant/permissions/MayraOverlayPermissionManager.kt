package com.mayra.assistant.permissions

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * MayraOverlayPermissionManager
 *
 * Handles runtime permission flow for StonicX (Mayra) Floating Camera Overlay:
 * 1. CAMERA permission (requested normally at runtime via Android M+ dialog).
 * 2. SYSTEM_ALERT_WINDOW ("Display over other apps" permission requested via
 *    Settings.ACTION_MANAGE_OVERLAY_PERMISSION intent for manual user approval).
 * 3. FOREGROUND_SERVICE & FOREGROUND_SERVICE_CAMERA verification for background operation.
 *
 * (Sideloaded / developer deployment — non-Play Store unrestricted permissions).
 */
class MayraOverlayPermissionManager(private val activity: ComponentActivity) {

    companion object {
        private const val TAG = "OverlayPermManager"
        const val RC_CAMERA_PERMISSION = 2001
        const val RC_OVERLAY_PERMISSION = 2002

        /**
         * Checks if CAMERA permission is granted.
         */
        fun hasCameraPermission(context: Context): Boolean {
            return ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        }

        /**
         * Checks if SYSTEM_ALERT_WINDOW (Display over other apps) is granted.
         * On Android 6.0 (API 23)+, requires Settings.canDrawOverlays(context).
         */
        fun hasOverlayPermission(context: Context): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }
        }

        /**
         * Checks if all required permissions for the floating camera overlay are granted.
         */
        fun hasAllOverlayPermissions(context: Context): Boolean {
            return hasCameraPermission(context) && hasOverlayPermission(context)
        }

        /**
         * Launches the System Settings screen for "Display over other apps".
         */
        fun openOverlaySettings(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${context.packageName}")
                    ).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                    Log.d(TAG, "Launched ACTION_MANAGE_OVERLAY_PERMISSION with package URI")
                } catch (e: Exception) {
                    Log.w(TAG, "Failed with package URI, falling back to generic overlay settings", e)
                    try {
                        val genericIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        context.startActivity(genericIntent)
                    } catch (fallbackEx: Exception) {
                        Log.e(TAG, "Failed to launch overlay settings", fallbackEx)
                    }
                }
            }
        }
    }

    private var onCameraResultCallback: ((Boolean) -> Unit)? = null
    private var onOverlayResultCallback: ((Boolean) -> Unit)? = null

    // Modern ActivityResultLauncher for Camera runtime permission
    private val cameraPermissionLauncher: ActivityResultLauncher<String> =
        activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            Log.d(TAG, "Camera permission callback result: $isGranted")
            onCameraResultCallback?.invoke(isGranted)
            onCameraResultCallback = null
        }

    // Modern ActivityResultLauncher for Settings.ACTION_MANAGE_OVERLAY_PERMISSION
    private val overlayPermissionLauncher: ActivityResultLauncher<Intent> =
        activity.registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
            val isGranted = hasOverlayPermission(activity)
            Log.d(TAG, "Overlay permission intent returned. Current status: $isGranted")
            onOverlayResultCallback?.invoke(isGranted)
            onOverlayResultCallback = null
        }

    /**
     * Request Camera permission normally at runtime.
     */
    fun requestCameraPermission(onResult: (Boolean) -> Unit) {
        if (hasCameraPermission(activity)) {
            Log.d(TAG, "Camera permission already granted")
            onResult(true)
            return
        }
        this.onCameraResultCallback = onResult
        Log.d(TAG, "Launching CAMERA runtime permission request")
        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }

    /**
     * Request "Display over other apps" permission via Settings.ACTION_MANAGE_OVERLAY_PERMISSION intent.
     */
    fun requestOverlayPermission(onResult: (Boolean) -> Unit) {
        if (hasOverlayPermission(activity)) {
            Log.d(TAG, "Overlay permission already granted")
            onResult(true)
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            this.onOverlayResultCallback = onResult
            try {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${activity.packageName}")
                )
                Log.d(TAG, "Launching Settings.ACTION_MANAGE_OVERLAY_PERMISSION intent for ${activity.packageName}")
                overlayPermissionLauncher.launch(intent)
            } catch (e: Exception) {
                Log.w(TAG, "Specific package URI failed, attempting generic overlay settings intent", e)
                try {
                    val genericIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                    overlayPermissionLauncher.launch(genericIntent)
                } catch (genericEx: Exception) {
                    Log.e(TAG, "Unable to launch overlay permission screen", genericEx)
                    onResult(false)
                }
            }
        } else {
            onResult(true)
        }
    }

    /**
     * Sequenced Runtime Flow for Floating Camera Overlay:
     * 1. Check and request CAMERA permission first.
     * 2. Then check and request OVERLAY permission via system settings.
     */
    fun startFloatingCameraPermissionFlow(
        onComplete: (cameraGranted: Boolean, overlayGranted: Boolean) -> Unit
    ) {
        requestCameraPermission { cameraGranted ->
            if (!cameraGranted) {
                Log.w(TAG, "Camera permission was denied during flow")
                onComplete(false, hasOverlayPermission(activity))
                return@requestCameraPermission
            }

            if (!hasOverlayPermission(activity)) {
                requestOverlayPermission { overlayGranted ->
                    onComplete(true, overlayGranted)
                }
            } else {
                onComplete(true, true)
            }
        }
    }
}
