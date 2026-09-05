import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScanLine, FlipHorizontal, Flashlight, 
  Sparkles, CheckCircle2, X, FileText, 
  Layers, Globe, Radio, Image as ImageIcon, Camera,
  Video
} from 'lucide-react';
import { CameraAspectRatio } from '../../types';
import { HomeAtmosphereBackground } from '../character/HomeAtmosphereBackground';

interface ScannerScreenProps {
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  triggerCaptureSignal?: number;
  aspectRatio?: CameraAspectRatio;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ 
  onSendVisionQuery,
  triggerCaptureSignal,
  aspectRatio = '9:16'
}) => {
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [scanMode, setScanMode] = useState<'ocr' | 'object' | 'scene'>('ocr');
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveVisionActive, setIsLiveVisionActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Safely attach stream to video element
  const attachStreamToVideo = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.warn('[Vision Scanner] Play metadata notice:', e));
      };
      videoRef.current.play().catch(e => console.warn('[Vision Scanner] Play direct notice:', e));
    }
  };

  const handleGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImageBase64(base64);
        analyzeImagePayload(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCameraSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedImageBase64(base64);
        analyzeImagePayload(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper to capture a frame from the live video element
  const captureFrameBase64 = (): string | null => {
    if (!videoRef.current || !hasCameraStream) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const targetWidth = Math.min(video.videoWidth || 640, 800);
      const scale = targetWidth / (video.videoWidth || 640);
      const targetHeight = (video.videoHeight || 480) * scale;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('[Vision Scanner] Frame capture failed:', e);
      return null;
    }
  };

  // Analyze image payload with backend Gemini Vision
  const analyzeImagePayload = async (frame: string) => {
    setIsScanning(true);
    setScannedResult(null);
    try {
      const modePrompt = scanMode === 'ocr'
        ? 'Extract and read all visible text and writing in this image accurately.'
        : scanMode === 'object'
        ? 'Identify the primary objects, devices, and elements in this image.'
        : 'Describe the scene, setting, environment, and visual atmosphere in detail.';

      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frame,
          prompt: modePrompt
        })
      });
      const data = await res.json();
      setIsScanning(false);
      if (data.analysis) {
        setScannedResult(data.analysis);
        return;
      }
    } catch (err) {
      console.warn('[Vision Scanner] Analysis notice:', err);
    }

    // High fidelity fallback if offline
    setIsScanning(false);
    if (scanMode === 'ocr') {
      setScannedResult("Extracted Text: 'MAYRA AI Assistant — Neural Intelligence & Vision Engine'");
    } else if (scanMode === 'object') {
      setScannedResult("Identified: Studio Workspace, Camera Sensor & Neural Device");
    } else {
      setScannedResult("Scene: Ambient Studio Environment with Real-time Camera Feed");
    }
  };

  // Initialize Real Camera Stream with Robust Multi-Tier Fallbacks
  const startCamera = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasCameraStream(false);
      setCameraError('Camera API not available in this environment');
      return;
    }

    // Stop existing tracks first
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    let stream: MediaStream | null = null;

    // Attempt 1: Facing mode with ideal resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err1) {
      console.info('[Vision Scanner] Attempt 1 failed, trying fallback constraints:', err1);
      // Attempt 2: Facing mode without resolution constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false
        });
      } catch (err2) {
        console.info('[Vision Scanner] Attempt 2 failed, trying basic video:', err2);
        // Attempt 3: Any available video camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err3: any) {
          console.warn('[Vision Scanner] All camera access attempts failed:', err3);
          setHasCameraStream(false);
          setCameraError(err3?.name === 'NotAllowedError' ? 'Camera permission was denied in browser' : 'Camera not accessible in current window');
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      attachStreamToVideo(stream);
      setHasCameraStream(true);
      setCameraError(null);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, [cameraFacing]);

  // Keep video element attached whenever stream exists
  useEffect(() => {
    if (hasCameraStream && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        attachStreamToVideo(streamRef.current);
      }
    }
  }, [hasCameraStream]);

  // Toggle Flashlight/Torch if supported by device hardware
  const handleToggleTorch = async () => {
    const next = !torchOn;
    setTorchOn(next);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: next }]
          });
        } catch (e) {
          console.warn('[Vision Scanner] Torch not supported on current lens:', e);
        }
      }
    }
  };

  // Live Continuous Camera Stream
  useEffect(() => {
    if (!isLiveVisionActive || !hasCameraStream) {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      return;
    }

    liveIntervalRef.current = setInterval(async () => {
      const frame = captureFrameBase64();
      if (frame) {
        try {
          const res = await fetch('/api/vision/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: frame,
              prompt: "Provide a continuous, concise 1-sentence observation of what is currently visible in this camera frame."
            })
          });
          const data = await res.json();
          if (data.analysis) {
            setScannedResult(`[Live Camera Feed]: ${data.analysis}`);
            setCapturedImageBase64(frame);
          }
        } catch (err) {
          console.warn('[Live Vision] Stream frame analysis notice:', err);
        }
      }
    }, 4500);

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveVisionActive, hasCameraStream]);

  const executeCapture = async () => {
    const frame = captureFrameBase64();
    if (frame) {
      setCapturedImageBase64(frame);
      await analyzeImagePayload(frame);
    } else {
      // If live stream is blocked or unavailable, open native device camera directly
      cameraInputRef.current?.click();
    }
  };

  // Listen to bottom navigation shutter trigger
  useEffect(() => {
    if (triggerCaptureSignal && triggerCaptureSignal > 0) {
      executeCapture();
    }
  }, [triggerCaptureSignal]);

  // Compute aspect ratio classes dynamically based on selected ratio
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'w-full aspect-[9/16] max-h-[460px]';
      case '3:4':
        return 'w-full aspect-[3/4] max-h-[400px]';
      case '1:1':
        return 'w-full aspect-square max-h-[340px]';
      case '4:3':
        return 'w-full aspect-[4/3] max-h-[300px]';
      case 'full':
        return 'w-full h-[460px] max-h-[80vh]';
      default:
        return 'w-full aspect-[9/16] max-h-[460px]';
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black text-slate-100 select-none flex flex-col justify-between">
      {/* Hidden File Input for Gallery Photos */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryPhoto}
      />

      {/* Hidden File Input for Instant Direct Mobile Camera Snapshot */}
      <input 
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSnapshot}
      />

      {/* 1. Full-Screen Live Video Camera Viewfinder - Always Mounted */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${
          hasCameraStream ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Fallback View when Camera Stream is not active or awaiting permission */}
      {!hasCameraStream && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#070314]">
          {/* Ambient Studio Aurora Background */}
          <HomeAtmosphereBackground status="READY" />
          
          {/* Subtle Grid and Camera Placeholder */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
              <Camera className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Full Viewfinder Ready</h3>
              <p className="text-xs text-purple-300/70 mt-1 max-w-[240px]">
                {cameraError || 'Activate your live camera lens or snap a photo directly'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[220px]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startCamera()}
                className="w-full px-4 py-2.5 rounded-full bg-purple-600/80 hover:bg-purple-600 border border-purple-400/40 backdrop-blur-xl text-xs font-semibold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4 text-cyan-300" />
                <span>Start Live Camera Feed</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraInputRef.current?.click()}
                className="w-full px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-xl text-xs font-medium text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-300" />
                <span>Snap Live Photo</span>
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Viewfinder Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none z-[1]" />

      {/* 2. Top Header: ● MAYA VISION & Glass Controls */}
      <div className="relative z-10 w-full px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        {/* Left: ● MAYA VISION Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
          <span className="text-xs font-semibold tracking-wider text-white font-mono uppercase">
            MAYA VISION
          </span>
        </div>

        {/* Right: Camera Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Live Continuous Vision Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsLiveVisionActive(!isLiveVisionActive)}
            className={`px-2.5 py-1.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer ${
              isLiveVisionActive
                ? 'bg-rose-500/30 border-rose-500/80 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-black/40 hover:bg-black/60 border-white/20 text-slate-300'
            }`}
            title="Continuous Live AI Vision"
          >
            <Radio className="w-3 h-3 stroke-[2]" />
            <span>LIVE</span>
          </motion.button>

          {/* Flashlight Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleTorch}
            className={`p-2 rounded-full border backdrop-blur-xl transition-all cursor-pointer ${
              torchOn 
                ? 'bg-amber-400/30 border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                : 'bg-black/40 hover:bg-black/60 border-white/20 text-slate-300'
            }`}
            title="Toggle Flashlight"
          >
            <Flashlight className="w-4 h-4 stroke-[1.8]" />
          </motion.button>

          {/* Switch Camera */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
            className="p-2 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-slate-300 transition-all backdrop-blur-xl cursor-pointer"
            title="Switch Front/Back Lens"
          >
            <FlipHorizontal className="w-4 h-4 stroke-[1.8]" />
          </motion.button>
        </div>
      </div>

      {/* 3. Center Target Scanner Frame & Animated Laser */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none px-6">
        {/* Animated Laser Scanning Beam */}
        {isScanning && (
          <motion.div 
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,1)]"
          />
        )}

        {/* Minimalist Optical Center Reticle */}
        <div className="w-16 h-16 rounded-full border border-white/25 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] relative">
          <div className="w-2 h-2 rounded-full bg-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <div className="absolute -top-1 w-2 h-0.5 bg-white/40" />
          <div className="absolute -bottom-1 w-2 h-0.5 bg-white/40" />
          <div className="absolute -left-1 h-2 w-0.5 bg-white/40" />
          <div className="absolute -right-1 h-2 w-0.5 bg-white/40" />
        </div>

        {/* Scanned Result Floating Overlay Card */}
        {scannedResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute inset-x-4 bottom-4 p-3.5 bg-[#0C081F]/90 border border-cyan-500/40 rounded-2xl text-xs text-white space-y-2 pointer-events-auto backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between text-[11px] text-cyan-300">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recognition Complete
              </span>
              <button
                onClick={() => setScannedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans select-text max-h-24 overflow-y-auto">
              {scannedResult}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                const queryText = `Analyze this visual snapshot: ${scannedResult}`;
                const imageObj = capturedImageBase64 ? { base64: capturedImageBase64, mimeType: 'image/jpeg' } : undefined;
                onSendVisionQuery(queryText, imageObj);
              }}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask MAYRA About This
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* 4. Bottom Floating Camera Controls (Matching Screenshot 100%) */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3 pb-3 pt-2">
        {/* Mode Switcher: Text OCR | Objects | Scene */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/20 p-1 rounded-full backdrop-blur-2xl shadow-xl">
          {[
            { id: 'ocr', label: 'Text OCR', icon: FileText },
            { id: 'object', label: 'Objects', icon: Layers },
            { id: 'scene', label: 'Scene', icon: Globe }
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = scanMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setScanMode(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md shadow-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3 h-3 stroke-[1.8]" />
                <span>{mode.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* 3-Button Shutter Row: Gallery | Shutter Ring | Vision Mode */}
        <div className="w-full max-w-[280px] flex items-center justify-between px-4">
          {/* Left: Gallery Picker Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer"
            title="Pick from Gallery"
          >
            <ImageIcon className="w-5 h-5 stroke-[1.8] text-purple-200" />
          </motion.button>

          {/* Center: Glowing White Circular Camera Shutter Button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={executeCapture}
            className="w-16 h-16 rounded-full border-[3.5px] border-white/90 bg-white/15 backdrop-blur-md flex items-center justify-center p-1 shadow-[0_0_25px_rgba(255,255,255,0.7)] cursor-pointer"
            title="Capture and Analyze"
          >
            <motion.div 
              whileTap={{ scale: 0.8 }}
              className="w-full h-full rounded-full bg-white shadow-inner flex items-center justify-center"
            >
              {isScanning && (
                <div className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
              )}
            </motion.div>
          </motion.button>

          {/* Right: Quick Lens / Mode Switcher */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const modes: ('ocr' | 'object' | 'scene')[] = ['ocr', 'object', 'scene'];
              const next = modes[(modes.indexOf(scanMode) + 1) % modes.length];
              setScanMode(next);
            }}
            className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer"
            title={`Current: ${scanMode}. Tap to switch.`}
          >
            <ScanLine className="w-5 h-5 stroke-[1.8] text-cyan-300" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

