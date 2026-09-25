import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, X, AlertCircle, Video, MonitorUp, Mic } from 'lucide-react';
import { CameraAspectRatio } from '../../types';
interface ScannerScreenProps {
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  triggerCaptureSignal?: number;
  aspectRatio?: CameraAspectRatio;
  onCloseScanner?: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ 
  onSendVisionQuery,
  triggerCaptureSignal,
  onCloseScanner
}) => {
  // Live Camera stream & hardware states
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const cameraFacing: 'environment' | 'user' = 'environment';
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  // Vision & Scanning states
  const scanMode: 'ocr' | 'object' | 'scene' = 'ocr';
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // DOM and stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
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
    if (videoRef.current) videoRef.current.srcObject = null;
    if (backgroundVideoRef.current) backgroundVideoRef.current.srcObject = null;
    setIsStreaming(false);
  }, []);

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
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = mediaStream;
        backgroundVideoRef.current.muted = true;
        backgroundVideoRef.current.autoplay = true;
        backgroundVideoRef.current.play().catch(() => {});
      }

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
    return () => {
      stopAllTracks();
    };
  }, [cameraFacing, startCamera, stopAllTracks]);

  const handleToggleLive = () => {
    if (isStreaming) stopAllTracks();
    else startCamera(cameraFacing);
  };

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

  const analyzeImagePayload = async (base64DataUrl: string) => {
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
          image: { base64: cleanBase64, mimeType: 'image/jpeg' },
          query: modePrompt,
          mode: scanMode,
          language: 'en'
        })
      });
      const data = await res.json();
      if (data.description) {
        setScannedResult(data.description);
        return;
      }
    } catch (err) {
      console.warn('[Vision Scanner] Network analysis error:', err);
    }
    setScannedResult('Vision analysis failed. Please check your network/API configuration and try again.');
  };

  const handleShutterCapture = () => {
    if (isStreaming) {
      const snapshot = captureFrameFromVideo();
      if (snapshot) {
        setCapturedSnapshot(snapshot);
        analyzeImagePayload(snapshot);
      }
    } else {
      startCamera(cameraFacing);
    }
  };

  useEffect(() => {
    if (triggerCaptureSignal && triggerCaptureSignal > 0) {
      handleShutterCapture();
    }
  }, [triggerCaptureSignal]);

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
    <div className="w-full h-full relative overflow-hidden bg-[#090a0f] text-white select-none flex flex-col">
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryPhotoSelected} />

      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden bg-[#090a0f]">
          <video
            ref={backgroundVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isStreaming ? 'opacity-100' : 'opacity-0'} blur-2xl scale-110`}
            aria-hidden="true"
          />
          {isStreaming && <div className="absolute inset-0 bg-black/30 pointer-events-none" />}
        </div>
        <div className="relative w-full h-full overflow-hidden rounded-[52px] bg-black shadow-[0_0_35px_rgba(0,0,0,0.45)]">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isStreaming ? 'opacity-100' : 'opacity-0'}`} />
          {!isStreaming && <div className="absolute inset-0 flex items-center justify-center bg-[#101114]">{isStartingCamera && <div className="w-7 h-7 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}</div>}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/45 via-transparent to-black/45" />

          {permissionDenied && (
            <div className="absolute top-20 left-5 right-5 z-20 px-4 py-3 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-300" /> Camera permission denied</span>
              <button onClick={() => startCamera(cameraFacing)} className="px-3 py-1.5 rounded-full bg-white text-black font-semibold">Retry</button>
            </div>
          )}

          {scannedResult && (
            <div className="absolute left-5 right-5 bottom-28 z-20">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-black/75 border border-white/15 rounded-3xl text-xs backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-2 text-[11px] text-white/80">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Recognition Complete</span>
                  <button onClick={() => setScannedResult(null)}><X className="w-4 h-4" /></button>
                </div>
                <p className="leading-relaxed max-h-24 overflow-y-auto">{scannedResult}</p>
                <button onClick={() => {
                  const queryText = `Analyze this visual snapshot: ${scannedResult}`;
                  const imageObj = capturedSnapshot ? { base64: capturedSnapshot, mimeType: 'image/jpeg' } : undefined;
                  onSendVisionQuery(queryText, imageObj);
                }} className="w-full mt-3 py-2.5 rounded-full bg-white text-black font-semibold">Ask MAYRA About This</button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 shrink-0 h-[112px] flex items-center justify-center gap-4 px-5 bg-[#090a0f]">
        <motion.button whileTap={{ scale: 0.94 }} onClick={handleToggleLive}
          className="w-[72px] h-[72px] rounded-full bg-white text-black flex items-center justify-center shadow-lg" aria-label="Camera">
          <Video className="w-9 h-9 stroke-[2.3]" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => galleryInputRef.current?.click()}
          className="w-[72px] h-[72px] rounded-full bg-[#46515f] text-white flex items-center justify-center shadow-lg" aria-label="Gallery">
          <MonitorUp className="w-9 h-9 stroke-[2.2]" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} onClick={handleShutterCapture}
          className="w-[72px] h-[72px] rounded-full bg-[#46515f] text-white flex items-center justify-center shadow-lg" aria-label="Scan">
          <Mic className="w-9 h-9 stroke-[2.2]" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => { stopAllTracks(); onCloseScanner?.(); }}
          className="w-[72px] h-[72px] rounded-full bg-[#ef3028] text-white flex items-center justify-center shadow-lg" aria-label="Close camera">
          <X className="w-10 h-10 stroke-[2.5]" />
        </motion.button>
      </div>
    </div>
  );};
