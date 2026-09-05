import React, { useState, useEffect } from 'react';
import { Mic, MicOff, VolumeX, ShieldAlert, Sparkles, Radio } from 'lucide-react';
import { AssistantStatus } from '../../types';
import { EchoGuardService } from '../../services/voice/echoGuardService';

interface MicStatusIndicatorProps {
  status: AssistantStatus;
  isListeningMode?: boolean;
  onToggleMic?: () => void;
  className?: string;
  variant?: 'pill' | 'compact' | 'badge';
}

export const MicStatusIndicator: React.FC<MicStatusIndicatorProps> = ({
  status,
  isListeningMode,
  onToggleMic,
  className = '',
  variant = 'pill'
}) => {
  const [isEchoGuarded, setIsEchoGuarded] = useState<boolean>(false);
  const [echoActive, setEchoActive] = useState<boolean>(true);

  useEffect(() => {
    const service = EchoGuardService.getInstance();
    const unsub = service.subscribe((state) => {
      setIsEchoGuarded(state.isGuarded);
      setEchoActive(state.isActive);
    });
    return () => unsub();
  }, []);

  // When Mayra is speaking, Echo Guard automatically mutes mic
  const isAutoMuted = (status === 'SPEAKING' && echoActive) || isEchoGuarded;
  const isMicLive = (isListeningMode || status === 'LISTENING') && !isAutoMuted;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onToggleMic}
        title={
          isAutoMuted 
            ? 'Echo Guard Active: Microphone automatically muted to eliminate audio feedback' 
            : isMicLive 
            ? 'Microphone Live: Listening to you' 
            : 'Microphone Standby: Tap to activate'
        }
        className={`p-1.5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
          isAutoMuted 
            ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
            : isMicLive 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' 
            : 'bg-white/[0.06] border-white/15 text-slate-300 hover:text-white'
        } ${className}`}
      >
        {isAutoMuted ? (
          <MicOff className="w-3.5 h-3.5 text-amber-400" />
        ) : isMicLive ? (
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Mic className="w-3.5 h-3.5 text-slate-300" />
        )}
      </button>
    );
  }

  // Pill variant
  return (
    <button
      type="button"
      onClick={onToggleMic}
      title={
        isAutoMuted 
          ? 'Echo Guard Active: Mic muted during speech' 
          : isMicLive 
          ? 'Mic Live: Capturing voice' 
          : 'Mic Standby: Tap to speak'
      }
      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
        isAutoMuted 
          ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
          : isMicLive 
          ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse' 
          : 'bg-purple-950/40 border-purple-500/30 text-purple-200 hover:bg-purple-900/40'
      } ${className}`}
    >
      {isAutoMuted ? (
        <>
          <VolumeX className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="font-bold uppercase tracking-wider text-[9px]">Echo Muted</span>
        </>
      ) : isMicLive ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <Mic className="w-3 h-3 text-emerald-300 shrink-0" />
          <span className="font-bold uppercase tracking-wider text-[9px]">Mic Live</span>
        </>
      ) : (
        <>
          <Mic className="w-3 h-3 text-purple-300 shrink-0" />
          <span className="text-[9px] text-purple-200 uppercase tracking-wider">Mic Ready</span>
        </>
      )}
    </button>
  );
};
