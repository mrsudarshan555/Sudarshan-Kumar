import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenShare, X, Camera, Minimize2, Maximize2, Sparkles, Eye, EyeOff, Activity } from 'lucide-react';
import { ScreenObserverEngine, ScreenObservationEvent } from '../../services/screen/ScreenObserverEngine';

interface ScreenShareHUDProps {
  stream: MediaStream | null;
  isOpen: boolean;
  onStop: () => void;
  onAnalyzeScreen: (capturedImage: { base64: string; mimeType: string; name: string }) => void;
  isAnalyzing?: boolean;
}

export const ScreenShareHUD: React.FC<ScreenShareHUDProps> = ({
  stream,
  isOpen,
  onStop,
  onAnalyzeScreen,
  isAnalyzing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isContinuousWatcher, setIsContinuousWatcher] = useState<boolean>(true);
  const [recentEvent, setRecentEvent] = useState<ScreenObservationEvent | null>(null);
  const [timelineCount, setTimelineCount] = useState<number>(0);

  // Register stream & video element with ScreenObserverEngine
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('[ScreenShareHUD] Video play error:', err);
      });

      ScreenObserverEngine.getInstance().registerStream(stream, videoRef.current);
      if (isContinuousWatcher) {
        ScreenObserverEngine.getInstance().startWatcher(4500);
      }
    }

    const unsub = ScreenObserverEngine.getInstance().subscribe((events) => {
      setTimelineCount(events.length);
      if (events.length > 0) {
        setRecentEvent(events[events.length - 1]);
      } else {
        setRecentEvent(null);
      }
    });

    return () => {
      unsub();
      if (!stream) {
        ScreenObserverEngine.getInstance().registerStream(null, null);
      }
    };
  }, [stream]);

  // Handle continuous watcher toggle
  const toggleContinuousWatcher = () => {
    if (isContinuousWatcher) {
      ScreenObserverEngine.getInstance().stopWatcher();
      setIsContinuousWatcher(false);
    } else {
      ScreenObserverEngine.getInstance().startWatcher(4500);
      setIsContinuousWatcher(true);
    }
  };

  const captureFrame = () => {
    const frame = ScreenObserverEngine.getInstance().captureCurrentFrame();
    if (frame) {
      onAnalyzeScreen(frame);
    } else if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onAnalyzeScreen({
          base64: dataUrl,
          mimeType: 'image/jpeg',
          name: `Screen_Capture_${Date.now()}.jpg`,
        });
      } catch (err) {
        console.error('[ScreenShareHUD] Fallback capture error:', err);
      }
    }
  };

  const handleCleanStop = () => {
    ScreenObserverEngine.getInstance().stopWatcher();
    ScreenObserverEngine.getInstance().registerStream(null, null);
    onStop();
  };

  if (!isOpen || !stream) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragConstraints={{ left: -100, right: 100, top: -50, bottom: 250 }}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -10 }}
        className="fixed top-16 right-4 z-40 select-none shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl bg-[#090D1E]/95 border border-cyan-500/40 rounded-2xl overflow-hidden max-w-[300px] w-[300px]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/80 to-[#0c142e] border-b border-cyan-500/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 -ml-3.5" />
            <span className="text-[11px] font-bold font-mono tracking-wider text-cyan-200 flex items-center gap-1">
              <ScreenShare className="w-3.5 h-3.5 text-cyan-400" />
              ASTRA VISION LIVE
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleContinuousWatcher}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isContinuousWatcher ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
              }`}
              title={isContinuousWatcher ? 'Continuous Screen Watching Active' : 'Start Continuous Watching'}
            >
              {isContinuousWatcher ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={handleCleanStop}
              className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Stop Sharing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Thumbnail (Collapsible) */}
        {!isMinimized && (
          <div className="relative bg-black aspect-video overflow-hidden border-b border-cyan-500/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute top-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Continuous Stream
            </div>

            {isContinuousWatcher && (
              <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-cyan-950/80 backdrop-blur-md text-[8px] font-mono text-cyan-200 border border-cyan-500/30 flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
                Auto-Watching ({timelineCount})
              </div>
            )}
          </div>
        )}

        {/* Live Observation Activity Bar */}
        {recentEvent && (
          <div className="px-2.5 py-1.5 bg-black/40 border-b border-white/5 text-[10px] text-cyan-200/90 font-mono flex items-start gap-1.5">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">👁️</span>
            <span className="line-clamp-2 text-slate-300 text-[10px] leading-tight">
              {recentEvent.actionSummary}
            </span>
          </div>
        )}

        {/* Quick Action Footer */}
        <div className="p-2 flex items-center gap-2">
          <button
            onClick={captureFrame}
            disabled={isAnalyzing}
            className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Analyze Now</span>
              </>
            )}
          </button>

          <button
            onClick={handleCleanStop}
            className="py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-medium rounded-xl transition-all cursor-pointer"
            title="Stop Screen Stream"
          >
            Stop
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
