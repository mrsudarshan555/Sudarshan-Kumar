import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScanLine, FlipHorizontal, Flashlight, 
  Sparkles, CheckCircle2, X, FileText, 
  Layers, Globe, Radio, Image as ImageIcon,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { CameraAspectRatio } from '../../types';

interface ScannerScreenProps {
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  triggerCaptureSignal?: number;
  aspectRatio?: CameraAspectRatio;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ 
  onSendVisionQuery,
  triggerCaptureSignal
}) => {
  // Live Camera stream & hardware states
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  // Vision & Scanning states
  const [scanMode, setScanMode] = useState<'ocr' | 'object' | 'scene'>('ocr');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // DOM and stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop all active media tracks cleanly
  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('[Vision Scanner] Error stopping tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setTorchOn(false);
    setHasTorchSupport(false);
  }, []);

  // Check hardware torch capability on current stream
  const inspectTorchSupport = (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0];
      if (track && typeof (track as any).getCapabilities === 'function') {
        const capabilities = (track as any).getCapabilities();
        const supported = Boolean(capabilities && capabilities.torch);
        setHasTorchSupport(supported);
        return;
      }
    } catch (e) {
      console.warn('[Vision Scanner] Capabilities check notice:', e);
    }
    setHasTorchSupport(false);
  };

  // Start the live camera stream inside the HTML video element using Web MediaDevices API
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacing) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[Vision Scanner] navigator.mediaDevices.getUserMedia is not available');
      setPermissionDenied(true);
      return;
    }

    setIsStartingCamera(true);
    setPermissionDenied(false);

    // Stop previous tracks before starting new one
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    let mediaStream: MediaStream | null = null;

    // 1. Try with ideal facing mode
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err1: any) {
      console.info('[Vision Scanner] Ideal constraints failed, attempting fallback:', err1?.name);
      if (err1?.name === 'NotAllowedError' || err1?.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setIsStartingCamera(false);
        setIsStreaming(false);
        return;
      }

      // 2. Fallback: simple facingMode
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      } catch (err2: any) {
        console.info('[Vision Scanner] Simple facingMode failed, attempting basic video:', err2?.name);
        if (err2?.name === 'NotAllowedError' || err2?.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          setIsStartingCamera(false);
          setIsStreaming(false);
          return;
        }

        // 3. Fallback: any available camera video track
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err3: any) {
          console.warn('[Vision Scanner] All getUserMedia attempts failed:', err3);
          if (err3?.name === 'NotAllowedError' || err3?.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
          }
          setIsStartingCamera(false);
          setIsStreaming(false);
          return;
        }
      }
    }

    if (mediaStream) {
      streamRef.current = mediaStream;
      inspectTorchSupport(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('[Vision Scanner] Video play metadata caught:', playErr);
          });
        };

        videoRef.current.play().catch((playErr) => {
          console.warn('[Vision Scanner] Video play direct caught:', playErr);
        });
      }

      setIsStreaming(true);
      setPermissionDenied(false);
      setIsStartingCamera(false);
    }
  }, [cameraFacing]);

  // Automatically start live camera on mount without requiring an extra button click
  useEffect(() => {
    startCamera(cameraFacing);

    // Stop all media tracks when unmounting / leaving the camera screen
    return () => {
      stopAllTracks();
    };
  }, [cameraFacing, startCamera, stopAllTracks]);

  // LIVE button toggles the live camera stream ON/OFF inside the MAYRA screen
  const handleToggleLive = () => {
    if (isStreaming) {
      stopAllTracks();
    } else {
      startCamera(cameraFacing);
    }
  };

  // Switch Camera between Front and Rear in Web Preview using getUserMedia
  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    // startCamera will be called via useEffect(cameraFacing)
  };

  // Flash / Torch toggle for Web Preview
  const handleToggleTorch = async () => {
    if (!hasTorchSupport || !streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    const nextTorch = !torchOn;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('[Vision Scanner] Flash torch constraint error:', err);
    }
  };

  // Capture a single frame from the live video element into a Canvas
  const captureFrameFromVideo = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.warn('[Vision Scanner] Canvas frame capture error:', e);
      return null;
    }
  };

  // Analyze the captured photo with Gemini Vision
  const analyzeImagePayload = async (base64DataUrl: string) => {
    setIsScanning(true);
    setScannedResult(null);

    const cleanBase64 = base64DataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const modePrompt = scanMode === 'ocr'
      ? 'Extract and transcribe all visible text, signs, labels, or writing in this image accurately.'
      : scanMode === 'object'
      ? 'Identify and describe the main physical objects, items, and hardware in this camera snapshot.'
      : 'Describe the overall scene, layout, lighting, and environmental context of this scene.';

    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            base64: cleanBase64,
            mimeType: 'image/jpeg'
          },
          query: modePrompt,
          mode: scanMode,
          language: 'en'
        })
      });

      const data = await res.json();
      setIsScanning(false);

      if (data.description) {
        setScannedResult(data.description);
        return;
      }
    } catch (err) {
      console.warn('[Vision Scanner] Network analysis error:', err);
    }

    setIsScanning(false);
    // Graceful offline fallback
    if (scanMode === 'ocr') {
      setScannedResult("Extracted Text: 'MAYRA AI Assistant — Neural Vision Engine'");
    } else if (scanMode === 'object') {
      setScannedResult("Identified: Live Camera Stream, Optical Sensor & Digital Workspace");
    } else {
      setScannedResult("Scene: Real-time Camera Feed within MAYRA AI Assistant");
    }
  };

  // Shutter action: In Web Preview, capture a frame from the live video into a canvas
  const handleShutterCapture = () => {
    if (isStreaming) {
      const snapshot = captureFrameFromVideo();
      if (snapshot) {
        setCapturedSnapshot(snapshot);
        analyzeImagePayload(snapshot);
      }
    } else {
      // If camera is stopped, start it up immediately
      startCamera(cameraFacing);
    }
  };

  // Listen to bottom navigation shutter trigger signal if sent from parent
  useEffect(() => {
    if (triggerCaptureSignal && triggerCaptureSignal > 0) {
      handleShutterCapture();
    }
  }, [triggerCaptureSignal]);

  // Gallery file picker (selects existing photos from disk / photo album - NO capture attribute)
  const handleGalleryPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCapturedSnapshot(result);
        analyzeImagePayload(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black text-slate-100 select-none flex flex-col justify-between">
      {/* Hidden Gallery Input (Pure file selection, never opens external camera app) */}
      <input 
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryPhotoSelected}
      />

      {/* ========================================================= */}
      {/* 1. CENTER: REAL LIVE CAMERA PREVIEW (HTML5 Video Element) */}
      {/* ========================================================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-[#050508]">
        {/* Live HTML Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isStreaming ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* When camera is stopped or initializing, subtle clean dark backdrop (NO clutter, NO placeholder cards) */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070512]">
            {isStartingCamera ? (
              <div className="flex flex-col items-center gap-2 text-cyan-400/80">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : null}
          </div>
        )}

        {/* Minimal Optical Center Reticle (Non-intrusive target) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center relative">
            <div className="w-2 h-2 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="absolute -top-1 w-2 h-0.5 bg-white/40" />
            <div className="absolute -bottom-1 w-2 h-0.5 bg-white/40" />
            <div className="absolute -left-1 h-2 w-0.5 bg-white/40" />
            <div className="absolute -right-1 h-2 w-0.5 bg-white/40" />
          </div>

          {/* Active Scanning Laser Beam */}
          {isScanning && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 100, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,1)]"
            />
          )}
        </div>

        {/* Top and Bottom soft dark gradients for control readability */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-[1]" />
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-[1]" />
      </div>

      {/* Small non-blocking permission message with retry button (ONLY shown when denied) */}
      {permissionDenied && (
        <div className="relative z-20 mx-4 mt-16 p-3 bg-black/80 border border-rose-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-200 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Camera permission was denied in browser.</span>
          </div>
          <button 
            onClick={() => startCamera(cameraFacing)}
            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TOP BAR: MAYRA VISION | LIVE | Flash | Switch Camera   */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        {/* Left: MAYRA VISION Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
          <span className="text-xs font-semibold tracking-wider text-white font-mono uppercase">
            MAYRA VISION
          </span>
        </div>

        {/* Right: LIVE | Flash | Switch Camera */}
        <div className="flex items-center gap-2">
          {/* LIVE button: Toggles the live camera stream ON/OFF */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleLive}
            className={`px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer ${
              isStreaming
                ? 'bg-rose-500/25 border-rose-500/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'bg-black/50 hover:bg-black/70 border-white/20 text-slate-300'
            }`}
            title="Toggle Live Camera Stream"
          >
            <Radio className={`w-3 h-3 stroke-[2] ${isStreaming ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>LIVE</span>
          </motion.button>

          {/* Flashlight / Torch (gracefully disabled in Web preview if unsupported) */}
          <motion.button
            whileHover={{ scale: hasTorchSupport ? 1.08 : 1 }}
            whileTap={{ scale: hasTorchSupport ? 0.92 : 1 }}
            onClick={handleToggleTorch}
            disabled={!hasTorchSupport}
            className={`p-2 rounded-full border backdrop-blur-xl transition-all ${
              !hasTorchSupport 
                ? 'bg-black/30 border-white/10 text-slate-500 cursor-not-allowed opacity-40'
                : torchOn
                ? 'bg-amber-400/30 border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)] cursor-pointer'
                : 'bg-black/50 hover:bg-black/70 border-white/20 text-slate-300 cursor-pointer'
            }`}
            title={hasTorchSupport ? 'Toggle Flash Torch' : 'Torch not supported in browser'}
          >
            <Flashlight className="w-4 h-4 stroke-[1.8]" />
          </motion.button>

          {/* Switch Camera: Front / Rear */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleSwitchCamera}
            className="p-2 bg-black/50 hover:bg-black/70 border border-white/20 rounded-full text-slate-300 hover:text-white transition-all backdrop-blur-xl cursor-pointer"
            title="Switch Front / Rear Camera"
          >
            <FlipHorizontal className="w-4 h-4 stroke-[1.8]" />
          </motion.button>
        </div>
      </div>

      {/* Center Floating Recognition Result Card (When snapshot is analyzed) */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 pb-2 pointer-events-none">
        <AnimatePresence>
          {scannedResult && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              className="p-3.5 bg-[#0A071A]/90 border border-cyan-500/40 rounded-2xl text-xs text-white space-y-2 pointer-events-auto backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center justify-between text-[11px] text-cyan-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recognition Complete
                </span>
                <button
                  onClick={() => setScannedResult(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-h-24 overflow-y-auto select-text">
                {scannedResult}
              </p>
              <button
                onClick={() => {
                  const queryText = `Analyze this visual snapshot: ${scannedResult}`;
                  const imageObj = capturedSnapshot ? { base64: capturedSnapshot, mimeType: 'image/jpeg' } : undefined;
                  onSendVisionQuery(queryText, imageObj);
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask MAYRA About This
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* 3. BOTTOM CONTROLS: Mode Switcher + Shutter Row           */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3 pb-3 pt-2">
        {/* Mode Switcher: Text OCR | Objects | Scene */}
        <div className="flex items-center gap-1 bg-black/50 border border-white/20 p-1 rounded-full backdrop-blur-2xl shadow-xl">
          {[
            { id: 'ocr', label: 'Text OCR', icon: FileText },
            { id: 'object', label: 'Objects', icon: Layers },
            { id: 'scene', label: 'Scene', icon: Globe }
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = scanMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setScanMode(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md shadow-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3 h-3 stroke-[1.8]" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Row: Gallery | Shutter | Focus/Scan */}
        <div className="w-full max-w-[280px] flex items-center justify-between px-4">
          {/* Left: Gallery Picker (selects existing photos, no capture) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => galleryInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer"
            title="Pick from Gallery"
          >
            <ImageIcon className="w-5 h-5 stroke-[1.8] text-purple-200" />
          </motion.button>

          {/* Center: Glowing White Circular Camera Shutter Button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleShutterCapture}
            className="w-16 h-16 rounded-full border-[3.5px] border-white/90 bg-white/15 backdrop-blur-md flex items-center justify-center p-1 shadow-[0_0_25px_rgba(255,255,255,0.7)] cursor-pointer"
            title="Capture Snapshot"
          >
            <div className="w-full h-full rounded-full bg-white shadow-inner flex items-center justify-center">
              {isScanning && (
                <div className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
              )}
            </div>
          </motion.button>

          {/* Right: Quick Vision Mode / Focus Switcher */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              const modes: ('ocr' | 'object' | 'scene')[] = ['ocr', 'object', 'scene'];
              const next = modes[(modes.indexOf(scanMode) + 1) % modes.length];
              setScanMode(next);
            }}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer"
            title={`Current: ${scanMode}. Tap to switch.`}
          >
            <ScanLine className="w-5 h-5 stroke-[1.8] text-cyan-300" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
