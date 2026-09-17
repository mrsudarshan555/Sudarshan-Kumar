import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Lock, Fingerprint, KeyRound, ShieldCheck, 
  EyeOff, Check, Smartphone, Sparkles
} from 'lucide-react';

interface MyraSecurityViewProps {
  onBack: () => void;
}

export const MyraSecurityView: React.FC<MyraSecurityViewProps> = ({ onBack }) => {
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [gfModeSecretPin, setGfModeSecretPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('1234');
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

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
            MAYRA Security
          </h1>
          <p className="text-[11px] text-gray-400">
            App lock, PIN, biometric, and GF Mode
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-24">
        {/* Enable App Lock */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Enable App Lock
              </h3>
              <p className="text-[11px] text-gray-400">
                Protect apps you pick with a PIN, pattern, or biometric
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAppLockEnabled(!appLockEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              appLockEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                appLockEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Biometric Unlock */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Biometric Unlock
              </h3>
              <p className="text-[11px] text-gray-400">
                Use fingerprint or Face Unlock for quick access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBiometricEnabled(!biometricEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              biometricEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                biometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* GF Mode Secret Protection */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                GF Mode Vault & Disguise
              </h3>
              <p className="text-[11px] text-gray-400">
                Camouflage chat logs and intimate memory fragments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGfModeSecretPin(!gfModeSecretPin)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              gfModeSecretPin ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                gfModeSecretPin ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* PIN Configuration */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              Security PIN Code
            </h4>
            <span className="text-xs text-purple-300 font-mono tracking-widest">
              ••••
            </span>
          </div>

          {isEditingPin ? (
            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                className="w-full bg-[#161720] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 font-mono tracking-widest text-center outline-none focus:border-purple-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingPin(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newPin.length >= 4) {
                      setCurrentPin(newPin);
                      setIsEditingPin(false);
                      setNewPin('');
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
                >
                  Save PIN
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPin(true)}
              className="w-full py-2.5 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 text-xs font-bold text-gray-200 transition-colors cursor-pointer"
            >
              Change Master Security PIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
