import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mic, ShieldCheck, ShieldAlert, Check, 
  Lock, KeyRound, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';

interface VoiceAuthViewProps {
  onBack: () => void;
}

export const VoiceAuthView: React.FC<VoiceAuthViewProps> = ({ onBack }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [threshold, setThreshold] = useState<'low' | 'medium' | 'high'>('medium');
  const [verifyMode, setVerifyMode] = useState<'always' | 'sensitive'>('sensitive');

  const handleEnrollVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setIsEnrolled(true);
    }, 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-white tracking-wide">
            Voice Authentication
          </h1>
          <p className="text-[11px] text-gray-400">
            Secure your assistant with your voice
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-24">
        {/* Enable Voice Authentication Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1b24] border border-white/10 flex items-center justify-center text-[#ff2a4b] shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Enable Voice Authentication
              </h3>
              <p className="text-[11px] text-gray-400">
                Only respond to your verified vocal print
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              isEnabled ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Enrollment Status */}
        <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-400">Status:</span>
          {isEnrolled ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Voice Profile Enrolled</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ff2a4b]/10 text-[#ff2a4b] border border-[#ff2a4b]/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Voice Not Enrolled</span>
            </span>
          )}
        </div>

        {/* Voice Profile Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <h3 className="text-sm font-bold text-white">
            Voice Profile
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Record a short sample so MYRA can recognize your voice. Takes about a minute.
          </p>

          <button
            onClick={handleEnrollVoice}
            disabled={isRecording}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(255,42,75,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            {isRecording ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Listening & Vectorizing Vocal Biometrics...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{isEnrolled ? 'Re-enroll Voice Profile' : 'Enroll Voice Profile'}</span>
              </>
            )}
          </button>
        </div>

        {/* Security Threshold */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            SECURITY THRESHOLD
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map(th => (
              <button
                key={th}
                onClick={() => setThreshold(th)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  threshold === th
                    ? 'bg-[#ff2a4b] text-white shadow-[0_0_12px_rgba(255,42,75,0.4)]'
                    : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Mode */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            VERIFICATION MODE
          </span>
          <div className="space-y-2">
            {[
              { id: 'always', title: 'Always Verify', desc: 'Verify your voice on every single command' },
              { id: 'sensitive', title: 'Sensitive Commands Only', desc: 'Verify only when executing payments, calls, or privacy actions' }
            ].map(vm => (
              <div
                key={vm.id}
                onClick={() => setVerifyMode(vm.id as any)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  verifyMode === vm.id
                    ? 'bg-[#181924] border-[#ff2a4b]/50'
                    : 'bg-[#15161d] border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">{vm.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{vm.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  verifyMode === vm.id ? 'border-[#ff2a4b] bg-[#ff2a4b]' : 'border-gray-600'
                }`}>
                  {verifyMode === vm.id && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
