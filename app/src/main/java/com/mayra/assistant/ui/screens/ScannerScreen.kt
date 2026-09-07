package com.mayra.assistant.ui.screens

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import android.util.Log
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlipCameraAndroid
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material.icons.filled.Radio
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.ViewInAr
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.CyanAccent
import com.mayra.assistant.ui.theme.CyanBright
import com.mayra.assistant.ui.theme.DeepCardBackground
import com.mayra.assistant.ui.theme.ObsidianBackground
import com.mayra.assistant.ui.theme.RoseAlert
import com.mayra.assistant.ui.theme.Slate300
import com.mayra.assistant.ui.theme.Slate400
import com.mayra.assistant.ui.theme.Slate500
import java.io.File
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

enum class ScannerVisionMode(val title: String) {
    OCR("Text OCR"),
    OBJECTS("Objects"),
    SCENE("Scene")
}

@Composable
fun ScannerScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var selectedMode by remember { mutableStateOf(ScannerVisionMode.OCR) }
    var isLiveVisionActive by remember { mutableStateOf(false) }
    var isTorchOn by remember { mutableStateOf(false) }
    var isFrontCamera by remember { mutableStateOf(false) }
    var hasFlashSupport by remember { mutableStateOf(false) }
    var isScanningActive by remember { mutableStateOf(false) }
    var scanResultText by remember { mutableStateOf<String?>(null) }

    // Camera state
    var boundCamera by remember { mutableStateOf<Camera?>(null) }
    var imageCaptureInstance by remember { mutableStateOf<ImageCapture?>(null) }
    var cameraProviderInstance by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }

    // Runtime Camera Permission state
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }
    var isPermanentlyDenied by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
        if (!granted) {
            val activity = context as? Activity
            if (activity != null && !activity.shouldShowRequestPermissionRationale(Manifest.permission.CAMERA)) {
                isPermanentlyDenied = true
            }
        }
    }

    // Gallery Picker launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            Toast.makeText(context, "Loaded photo from gallery for ${selectedMode.title}", Toast.LENGTH_SHORT).show()
        }
    }

    // Auto-request permission on launch if not already granted
    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // Release camera resources on screen disposal
    DisposableEffect(lifecycleOwner) {
        onDispose {
            try {
                cameraProviderInstance?.unbindAll()
                cameraExecutor.shutdown()
            } catch (e: Exception) {
                Log.e("MayraScanner", "Error cleaning up camera: ${e.message}")
            }
        }
    }

    // Shutter capture handler
    fun capturePhoto() {
        val imageCapture = imageCaptureInstance ?: run {
            Toast.makeText(context, "Camera is initializing...", Toast.LENGTH_SHORT).show()
            return
        }

        val photoFile = File(
            context.cacheDir,
            "MAYRA_${SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(System.currentTimeMillis())}.jpg"
        )
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        isScanningActive = true
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(context),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    isScanningActive = false
                    Toast.makeText(context, "Captured snapshot for ${selectedMode.title}", Toast.LENGTH_SHORT).show()
                }

                override fun onError(exception: ImageCaptureException) {
                    isScanningActive = false
                    Log.e("MayraScanner", "Capture failed: ${exception.message}", exception)
                    Toast.makeText(context, "Capture error: ${exception.localizedMessage}", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        if (hasCameraPermission) {
            // 1. REAL LIVE CAMERAX PREVIEW (Dominates full screen, rear by default)
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        scaleType = PreviewView.ScaleType.FILL_CENTER
                        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                    }

                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        try {
                            val cameraProvider = cameraProviderFuture.get()
                            cameraProviderInstance = cameraProvider

                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }

                            val imageCapture = ImageCapture.Builder()
                                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                                .build()
                            imageCaptureInstance = imageCapture

                            val imageAnalysis = ImageAnalysis.Builder()
                                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                .build()
                            imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                imageProxy.close()
                            }

                            val selector = if (isFrontCamera) {
                                CameraSelector.DEFAULT_FRONT_CAMERA
                            } else {
                                CameraSelector.DEFAULT_BACK_CAMERA
                            }

                            cameraProvider.unbindAll()
                            val camera = cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                selector,
                                preview,
                                imageCapture,
                                imageAnalysis
                            )

                            boundCamera = camera
                            hasFlashSupport = camera.cameraInfo.hasFlashUnit()
                            if (hasFlashSupport) {
                                camera.cameraControl.enableTorch(isTorchOn)
                            }
                        } catch (e: Exception) {
                            Log.e("MayraScanner", "Failed to bind camera use cases", e)
                        }
                    }, ContextCompat.getMainExecutor(ctx))

                    previewView
                },
                update = { previewView ->
                    // Rebind on lens switch or torch change
                    val cameraProvider = cameraProviderInstance
                    if (cameraProvider != null) {
                        try {
                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }

                            val imageCapture = ImageCapture.Builder()
                                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                                .build()
                            imageCaptureInstance = imageCapture

                            val selector = if (isFrontCamera) {
                                CameraSelector.DEFAULT_FRONT_CAMERA
                            } else {
                                CameraSelector.DEFAULT_BACK_CAMERA
                            }

                            cameraProvider.unbindAll()
                            val camera = cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                selector,
                                preview,
                                imageCapture
                            )
                            boundCamera = camera
                            hasFlashSupport = camera.cameraInfo.hasFlashUnit()
                            if (hasFlashSupport) {
                                camera.cameraControl.enableTorch(isTorchOn)
                            }
                        } catch (e: Exception) {
                            Log.e("MayraScanner", "Camera update error", e)
                        }
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Center: CLEAN Optical Viewfinder Reticle (Non-intrusive)
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .border(1.dp, Color.White.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(CyanBright, CircleShape)
                    )
                }
            }
        } else {
            // Permission not granted: Native Android explanation and action
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ObsidianBackground)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = DeepCardBackground,
                    border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(24.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = CyanAccent.copy(alpha = 0.15f),
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.DocumentScanner,
                                    contentDescription = "Camera Permission",
                                    tint = CyanBright,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }

                        Text(
                            text = "Camera Access Required",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        Text(
                            text = if (isPermanentlyDenied) {
                                "Camera permission is permanently denied. Please enable camera access in Android Settings for MAYRA Vision."
                            } else {
                                "MAYRA Vision requires camera access to scan documents, identify objects, and analyze scenes in real time."
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate300,
                            textAlign = TextAlign.Center
                        )

                        if (isPermanentlyDenied) {
                            Button(
                                onClick = {
                                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                        data = Uri.fromParts("package", context.packageName, null)
                                    }
                                    context.startActivity(intent)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Text("Open Android Settings", fontWeight = FontWeight.SemiBold, color = ObsidianBackground)
                                }
                            }
                        } else {
                            Button(
                                onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Grant Camera Permission", fontWeight = FontWeight.SemiBold, color = ObsidianBackground)
                            }
                        }
                    }
                }
            }
        }

        // Subtle gradient overlays for top and bottom readability
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .align(Alignment.TopCenter)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Black.copy(alpha = 0.65f), Color.Transparent)
                    )
                )
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                    )
                )
        )

        // 2. TOP BAR: MAYRA VISION | LIVE | FLASH | SWITCH CAMERA
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: MAYRA VISION Badge
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.5f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                    val pulseAlpha by infiniteTransition.animateFloat(
                        initialValue = 0.4f,
                        targetValue = 1f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(800),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "dotAlpha"
                    )
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .alpha(pulseAlpha)
                            .background(CyanBright, CircleShape)
                    )
                    Text(
                        text = "MAYRA VISION",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                }
            }

            // Right: LIVE | FLASH | SWITCH CAMERA
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // LIVE Toggle
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = if (isLiveVisionActive) RoseAlert.copy(alpha = 0.35f) else Color.Black.copy(alpha = 0.45f),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isLiveVisionActive) RoseAlert else Color.White.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.clickable {
                        isLiveVisionActive = !isLiveVisionActive
                    }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            Icons.Default.Radio,
                            contentDescription = "Live",
                            tint = if (isLiveVisionActive) RoseAlert else Slate300,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "LIVE",
                            color = if (isLiveVisionActive) Color.White else Slate300,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                // Flash Toggle
                Surface(
                    shape = CircleShape,
                    color = if (isTorchOn) CyanBright.copy(alpha = 0.3f) else Color.Black.copy(alpha = 0.45f),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isTorchOn) CyanBright else Color.White.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier.size(36.dp)
                ) {
                    IconButton(
                        onClick = {
                            if (hasFlashSupport) {
                                isTorchOn = !isTorchOn
                                boundCamera?.cameraControl?.enableTorch(isTorchOn)
                            } else {
                                Toast.makeText(context, "Flash not available on this lens", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
                            contentDescription = "Flash",
                            tint = if (isTorchOn) CyanBright else Slate300,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // Camera Switch (Front / Rear)
                Surface(
                    shape = CircleShape,
                    color = Color.Black.copy(alpha = 0.45f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                    modifier = Modifier.size(36.dp)
                ) {
                    IconButton(
                        onClick = {
                            isFrontCamera = !isFrontCamera
                            isTorchOn = false // Reset torch on switch
                        },
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            Icons.Default.FlipCameraAndroid,
                            contentDescription = "Switch Camera",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // 3. BOTTOM CONTROLS: Mode Switcher + Shutter Row
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp, start = 16.dp, end = 16.dp)
                .align(Alignment.BottomCenter),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Mode Switcher: Text OCR | Objects | Scene
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color.Black.copy(alpha = 0.6f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Row(
                    modifier = Modifier.padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    ScannerVisionMode.values().forEach { mode ->
                        val isSelected = mode == selectedMode
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = if (isSelected) CyanAccent else Color.Transparent,
                            modifier = Modifier.clickable { selectedMode = mode }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                val icon = when (mode) {
                                    ScannerVisionMode.OCR -> Icons.Outlined.Description
                                    ScannerVisionMode.OBJECTS -> Icons.Outlined.ViewInAr
                                    ScannerVisionMode.SCENE -> Icons.Outlined.Public
                                }
                                Icon(
                                    icon,
                                    contentDescription = mode.title,
                                    tint = if (isSelected) ObsidianBackground else Slate300,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = mode.title,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) ObsidianBackground else Slate300
                                )
                            }
                        }
                    }
                }
            }

            // Shutter Row: Gallery | Centered Shutter Button | Quick Mode/Focus
            Row(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Gallery Button
                Surface(
                    shape = CircleShape,
                    color = Color.Black.copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                    modifier = Modifier.size(46.dp)
                ) {
                    IconButton(
                        onClick = { galleryLauncher.launch("image/*") },
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            Icons.Default.Photo,
                            contentDescription = "Gallery",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                // Center: White Prominent Shutter Button
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .border(3.5.dp, Color.White, CircleShape)
                        .padding(4.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .clickable { capturePhoto() },
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.White, CircleShape)
                    )
                }

                // Right: Scan/Focus Toggle
                Surface(
                    shape = CircleShape,
                    color = Color.Black.copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                    modifier = Modifier.size(46.dp)
                ) {
                    IconButton(
                        onClick = {
                            val allModes = ScannerVisionMode.values()
                            val nextIndex = (selectedMode.ordinal + 1) % allModes.size
                            selectedMode = allModes[nextIndex]
                        },
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            Icons.Default.DocumentScanner,
                            contentDescription = "Scan / Focus Mode",
                            tint = CyanBright,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }
    }
}
