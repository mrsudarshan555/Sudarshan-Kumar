/**
 * Barehands AR Camera Stage (Authentic Port from barehands-main)
 * 
 * Features:
 * - Direct Fullscreen Live Camera AR Feed (Front/Rear facing, Mirror toggle)
 * - Zero Clutter / No Fake Phone Overlays: Pure spatial canvas with live video
 * - Invisible 21-point MediaPipe hand tracking (no skeleton bone clutter, subtle holographic laser ring cursor)
 * - 60 FPS Kinetic Multi-Touch Physics (Pinch to Grab, Inertia Throw/Fling, 2-Hand Bimanual Zoom, Clap Clear, Fist Freeze)
 * - Spatial Card Nodes (3D Code Terminal, Markdown Notes, 3D Airlock Model, Holographic Projections)
 * - Throw to Mayra Voice Intercept: When a card is flung off-screen, Mayra catches it and responds via voice.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, X, RefreshCw, Volume2, VolumeX, Plus, FileText, 
  Terminal, Box, Sparkles, Lock, Unlock, RotateCcw,
  Bot, Mic, ExternalLink, HelpCircle, Activity
} from 'lucide-react';
import { BarehandsTracker } from '../../services/gestures/barehandsTracker';
import { BarehandsGestureState } from '../../types/gestures';
import { StagePhysicsEngine } from '../../services/stage/stagePhysicsEngine';
import { StageStateManager } from '../../services/stage/stageStateManager';
import { SpatialCard, StageCanvasConfig } from '../../services/stage/types';
import { SpatialCardNode } from './SpatialCardNode';
import { Mouth } from '../../services/audio/mouth';

interface BarehandsCameraStageProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onTriggerVoice?: () => void;
}

export const BarehandsCameraStage: React.FC<BarehandsCameraStageProps> = ({
  isOpen,
  onClose,
  userName = 'Zafer',
  onTriggerVoice
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraMirror, setIsCameraMirror] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cards, setCards] = useState<SpatialCard[]>([]);
  const [stageConfig, setStageConfig] = useState<StageCanvasConfig>({
    isOpen: true,
    gravity: 0,
    friction: 0.92,
    throwVelocityThreshold: 1.2,
    isFrozen: false,
    showGrid: false,
    enableSoundEffects: true
  });
  const [handState, setHandState] = useState<BarehandsGestureState | null>(null);

  // Mayra Throw/Fling Intercept
  const [interceptedCard, setInterceptedCard] = useState<SpatialCard | null>(null);
  const [mayraSpeechText, setMayraSpeechText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const tracker = BarehandsTracker.getInstance();
  const physics = StagePhysicsEngine.getInstance();
  const stateManager = StageStateManager.getInstance();
  const mouth = Mouth.getInstance();

  // Audio synthesizer for spatial feedback
  const playSfx = useCallback((freq = 520, type: OscillatorType = 'sine', duration = 0.1) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [isMuted]);

  // Initial stage & physics startup
  useEffect(() => {
    if (!isOpen) return;

    // 1. Initialize Stage Workspace
    stateManager.initializeWorkspace();
    physics.start();

    // 2. Subscribe to Cards & Physics state
    const unsubCards = physics.subscribeCards((updatedCards) => {
      setCards([...updatedCards]);

      // Check if any card was thrown out of screen bounds
      updatedCards.forEach((card) => {
        if (
          card.isSliding &&
          (card.position.y < -150 || card.position.y > window.innerHeight + 150 ||
           card.position.x < -200 || card.position.x > window.innerWidth + 200)
        ) {
          // Trigger Mayra Intercept if not already intercepted
          if (!interceptedCard || interceptedCard.id !== card.id) {
            handleCardThrownOut(card);
          }
        }
      });
    });

    const unsubConfig = physics.subscribeConfig((cfg) => {
      setStageConfig({ ...cfg });
    });

    // 3. Subscribe to Barehands Hand Tracking
    const unsubTracker = tracker.subscribe((state) => {
      setHandState({ ...state });
    });

    // 4. Start Tracker with Video Element
    tracker.start(
      videoRef.current,
      (state) => {
        setHandState({ ...state });
      },
      {
        maxHands: 2,
        cameraFacingMode: facingMode
      }
    ).catch((err) => {
      console.warn('[Barehands AR] Camera start notification:', err);
    });

    // Bind stream when ready
    const checkStreamInterval = setInterval(() => {
      const stream = tracker.getMediaStream();
      if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        clearInterval(checkStreamInterval);
      }
    }, 200);

    // 5. Particle FX Animation Loop
    let particleAnimId: number;
    const renderParticles = () => {
      const canvas = particleCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const particles = physics.getParticles();

          particles.forEach((p) => {
            ctx.save();
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
      }
      particleAnimId = requestAnimationFrame(renderParticles);
    };

    particleAnimId = requestAnimationFrame(renderParticles);

    const handleResize = () => {
      if (particleCanvasRef.current) {
        particleCanvasRef.current.width = window.innerWidth;
        particleCanvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      unsubCards();
      unsubConfig();
      unsubTracker();
      clearInterval(checkStreamInterval);
      cancelAnimationFrame(particleAnimId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, facingMode]);

  // Card Thrown to Mayra Handler
  const handleCardThrownOut = useCallback((card: SpatialCard) => {
    playSfx(750, 'triangle', 0.25);
    setInterceptedCard(card);

    const title = card.title || (card.type === 'code_snippet' ? 'Code Script' : 'Spatial Object');
    const speech = `${userName}, आपने "${title}" को मेरी तरफ भेजा है! इसके बारे में आप क्या जानना या करवाना चाहते हैं?`;
    setMayraSpeechText(speech);

    mouth.speak(speech, {
      persona: 'MAYRA',
      voice: 'Aoede',
      language: 'hi'
    }).catch(() => {});

    // Reposition card back gently
    setTimeout(() => {
      card.position = { x: Math.max(40, window.innerWidth / 2 - 140), y: window.innerHeight / 2 - 100, z: 0 };
      card.velocity = { vx: 0, vy: 0 };
      card.isSliding = false;
      physics.setCards([...physics.getCards()]);
    }, 1000);
  }, [userName, playSfx, mouth, physics]);

  if (!isOpen) return null;

  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setIsCameraMirror(nextMode === 'user');
    tracker.stop();
    await tracker.start(
      videoRef.current,
      (state) => {
        setHandState({ ...state });
      },
      { maxHands: 2, cameraFacingMode: nextMode }
    );
  };

  const handleCardUpdate = (updatedCard: SpatialCard) => {
    const list = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    physics.setCards(list);
    stateManager.saveState();
  };

  const handleRemoveCard = (id: string) => {
    physics.removeCard(id);
    stateManager.saveState();
  };

  const toggleFreeze = () => {
    if (stageConfig.isFrozen) {
      physics.unfreezeWorkspace();
    } else {
      physics.freezeWorkspace();
    }
  };

  // Get primary hand landmark coords for subtle laser pointer (no ugly skeleton bones)
  const primaryHand = handState?.hands?.[0];
  const indexTip = primaryHand?.landmarks?.[8] || primaryHand?.indexTip;
  const isPinching = primaryHand?.isPinching || false;
  const handScreenPos = indexTip
    ? {
        x: (isCameraMirror ? (1 - indexTip.x) : indexTip.x) * (typeof window !== 'undefined' ? window.innerWidth : 1280),
        y: indexTip.y * (typeof window !== 'undefined' ? window.innerHeight : 800)
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[1000] bg-black overflow-hidden select-none"
    >
      {/* 1. REAL LIVE CAMERA VIDEO (Fullscreen Background) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          isCameraMirror ? '-scale-x-100' : 'scale-x-100'
        }`}
      />

      {/* Subtle AR Holographic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/50" />

      {/* 2. Hardware-Accelerated Particle Canvas Layer */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 3. Floating Spatial Card Nodes (Pinch, Drag, Fling, 3D Models) */}
      <div className="absolute inset-0 pointer-events-auto z-20">
        {cards.map((card) => (
          <SpatialCardNode
            key={card.id}
            card={card}
            onRemove={handleRemoveCard}
            onUpdate={handleCardUpdate}
          />
        ))}
      </div>

      {/* 4. Subtle Hand Laser Pointer (Invisible bones, elegant target ring only) */}
      {handScreenPos && handState?.isActive && (
        <div
          style={{
            position: 'absolute',
            left: `${handScreenPos.x}px`,
            top: `${handScreenPos.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 150
          }}
          className="flex items-center justify-center transition-transform duration-75"
        >
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              isPinching
                ? 'border-cyan-400 bg-cyan-500/40 shadow-[0_0_25px_#22d3ee] scale-125'
                : 'border-white/60 bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isPinching ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-cyan-400'}`} />
          </div>
          {isPinching && (
            <span className="absolute -top-6 text-[10px] font-mono font-bold text-cyan-300 bg-black/85 px-2 py-0.5 rounded-full border border-cyan-500/50 shadow-md whitespace-nowrap">
              GRABBED
            </span>
          )}
        </div>
      )}

      {/* 5. Minimal Spatial AR Header Toolbar */}
      <div className="absolute top-3 inset-x-3 z-50 flex items-center justify-between pointer-events-none">
        {/* Left: Telemetry & Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#090b14]/85 backdrop-blur-xl border border-cyan-500/30 text-white shadow-xl pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[11px] font-mono font-bold text-cyan-300">BAREHANDS AR</span>
          <span className="text-[10px] font-mono text-slate-400 border-l border-white/20 pl-2">
            {handState?.hands?.length ? `${handState.hands.length} HAND ACTIVE` : 'SHOW HAND'}
          </span>
        </div>

        {/* Center: Spatial Quick Actions (+ Note, + Code, + 3D) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#090b14]/85 backdrop-blur-xl border border-white/15 shadow-xl pointer-events-auto">
          <button
            onClick={() => stateManager.spawnNoteCard()}
            className="px-2.5 py-1 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileText className="w-3 h-3 text-purple-400" />
            <span>+ Note</span>
          </button>

          <button
            onClick={() => stateManager.spawnCodeCard()}
            className="px-2.5 py-1 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>+ Code</span>
          </button>

          <button
            onClick={() => stateManager.spawnAirlockModel3D()}
            className="px-2.5 py-1 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Box className="w-3 h-3 text-emerald-400" />
            <span>+ 3D Model</span>
          </button>

          <button
            onClick={toggleFreeze}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              stageConfig.isFrozen
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-white/10 border-white/10 text-slate-300 hover:text-white'
            }`}
            title={stageConfig.isFrozen ? 'Unfreeze Workspace (Fist)' : 'Freeze Workspace (Fist)'}
          >
            {stageConfig.isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Camera Flip, Sound & Exit */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleFlipCamera}
            className="p-2 rounded-2xl bg-[#090b14]/85 backdrop-blur-xl border border-white/20 text-slate-200 hover:text-white cursor-pointer shadow-lg"
            title="Flip Front / Rear Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-2xl bg-[#090b14]/85 backdrop-blur-xl border border-white/20 text-slate-200 hover:text-white cursor-pointer shadow-lg"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xl"
          >
            <X className="w-4 h-4" />
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* 6. Mobile Floating Action Bar (Bottom for small screens) */}
      <div className="sm:hidden absolute bottom-4 inset-x-4 z-50 flex items-center justify-around px-3 py-2 rounded-2xl bg-[#090b14]/90 backdrop-blur-xl border border-white/20 shadow-2xl">
        <button
          onClick={() => stateManager.spawnNoteCard()}
          className="px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-300 text-xs font-bold flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ Note</span>
        </button>
        <button
          onClick={() => stateManager.spawnCodeCard()}
          className="px-3 py-1.5 rounded-xl bg-cyan-600/30 text-cyan-300 text-xs font-bold flex items-center gap-1"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>+ Code</span>
        </button>
        <button
          onClick={() => stateManager.spawnAirlockModel3D()}
          className="px-3 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center gap-1"
        >
          <Box className="w-3.5 h-3.5" />
          <span>+ 3D</span>
        </button>
        <button
          onClick={() => {
            physics.handleClapClear();
            playSfx(880, 'triangle', 0.2);
          }}
          className="p-2 rounded-xl bg-white/10 text-slate-300"
          title="Clear All (Clap)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 7. MAYRA INTERCEPT OVERLAY (Triggered when user flings a card off-screen) */}
      <AnimatePresence>
        {interceptedCard && (
          <motion.div
            initial={{ y: 220, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 220, opacity: 0 }}
            className="absolute inset-x-3 bottom-18 sm:bottom-4 max-w-lg mx-auto z-50 p-4 bg-[#0a0518]/95 backdrop-blur-2xl border-2 border-purple-500/70 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.5)] flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                  <Bot className="w-5 h-5 text-purple-100" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-200 block">MAYRA SPATIAL INTERCEPT</span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Item Received: {interceptedCard.title || 'Spatial Card'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInterceptedCard(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Speech Dialogue */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-white/5 p-2.5 rounded-xl border border-white/10">
              {mayraSpeechText}
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => {
                  if (onTriggerVoice) onTriggerVoice();
                  setInterceptedCard(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/60 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Reply by Voice</span>
              </button>

              <button
                onClick={() => {
                  mouth.speak(`इस कार्ड में संग्रहीत डेटा को प्रोसेस कर रही हूँ।`, { persona: 'MAYRA', voice: 'Aoede', language: 'hi' });
                  setInterceptedCard(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/60 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Analyze Card</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
