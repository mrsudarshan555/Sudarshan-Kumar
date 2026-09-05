import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, HardDrive, Cpu, 
  Mic, Eye, Bell, Key, Ban, Trash2, ArrowLeft,
  Smartphone, CheckCircle2, AlertCircle, RefreshCw,
  Fingerprint, Sparkles, AlertTriangle, Shield, Check, X
} from 'lucide-react';
import { PermissionItem, MemoryItem, ChatMessage } from '../../types';
import { AppLockConfig } from '../security/useAppLock';

interface PrivacyViewProps {
  onBack: () => void;
  permissions?: PermissionItem[];
  setPermissions?: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
  memories?: MemoryItem[];
  setMemories?: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  messages?: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  appLockConfig?: AppLockConfig;
  onUpdateAppLock?: (updates: Partial<AppLockConfig>) => void;
  onLockAppNow?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  onBack,
  permissions = [],
  setPermissions,
  memories = [],
  setMemories,
  messages = [],
  setMessages,
  appLockConfig,
  onUpdateAppLock,
  onLockAppNow
}) => {
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<boolean>(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);

  // Toggle permission
  const handleTogglePermission = (id: string) => {
    if (!setPermissions) return;
    setPermissions(prev => prev.map(p => {
      if (p.id === id) {
        const isCurrentlyGranted = p.status === 'granted';
        return {
          ...p,
          status: isCurrentlyGranted ? ('denied' as const) : ('granted' as const),
          statusLabel: isCurrentlyGranted ? 'Denied' : 'Granted'
        };
      }
      return p;
    }));
  };

  // Perform total erasure
  const handleConfirmTotalWipe = () => {
    if (setMemories) setMemories([]);
    if (setMessages) setMessages([]);
    
    // Clear local storage keys
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('mayra_chat_messages_v1');
        window.localStorage.removeItem('mayra_memories_data_v1');
      } catch (e) {
        console.error(e);
      }
    }

    setShowConfirmDeleteModal(false);
    setDeleteSuccessToast('Sab memories aur chat data safalta-purvak delete ho gaya!');
    setTimeout(() => setDeleteSuccessToast(null), 3500);
  };

  const handleSaveNewPin = () => {
    if (newPinInput.length === 4 && onUpdateAppLock) {
      onUpdateAppLock({ pin: newPinInput });
      setIsChangingPin(false);
      setNewPinInput('');
      setPinChangeSuccess(true);
      setTimeout(() => setPinChangeSuccess(false), 2500);
    }
  };

  const totalMemoriesCount = memories.length;
  const totalMessagesCount = messages.length;
  const estimatedStorageKb = Math.max(12, Math.round((totalMemoriesCount * 1.5) + (totalMessagesCount * 0.8)));

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-transparent text-slate-200 select-none">
      
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
              <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Privacy & Trust Dashboard</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Permissions, Storage & Security Controls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-4 text-xs font-sans pb-10">
        
        {/* Success Toast */}
        {deleteSuccessToast && (
          <div className="p-3 bg-emerald-950/60 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg shadow-emerald-950/40 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2]" />
            <span>{deleteSuccessToast}</span>
          </div>
        )}

        {/* 1. App-Lock Security Center */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30">
                <Lock className="w-3.5 h-3.5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white font-sans">App-Lock & PIN Security</h3>
                <p className="text-[10px] text-purple-200/60">Lock app on startup with PIN or Biometrics</p>
              </div>
            </div>

            {/* Toggle Switch */}
            {onUpdateAppLock && appLockConfig && (
              <button
                onClick={() => onUpdateAppLock({ isEnabled: !appLockConfig.isEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  appLockConfig.isEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-white/10'
                }`}
                title="Toggle App-Lock"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 transform ${
                    appLockConfig.isEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            )}
          </div>

          {appLockConfig?.isEnabled && (
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Biometric Unlock (Fingerprint)</span>
                <button
                  onClick={() => onUpdateAppLock && onUpdateAppLock({ useBiometrics: !appLockConfig.useBiometrics })}
                  className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all cursor-pointer ${
                    appLockConfig.useBiometrics 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/5 text-purple-300/60 border border-white/5'
                  }`}
                >
                  {appLockConfig.useBiometrics ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* PIN Settings */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Current PIN: <strong className="font-mono text-purple-300">•••• ({appLockConfig.pin})</strong></span>
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="text-[10px] font-sans px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  Change PIN
                </button>
              </div>

              {pinChangeSuccess && (
                <div className="text-[10px] text-emerald-400 font-sans flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2]" /> PIN badal gaya hai!
                </div>
              )}

              {isChangingPin && (
                <div className="p-2.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-purple-500/30 space-y-2">
                  <span className="text-[10px] text-slate-300">Naya 4-digit PIN enter karein:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 5678"
                      className="bg-black/50 border border-white/15 rounded-xl px-2.5 py-1 text-sm font-mono text-center text-white w-28 outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={handleSaveNewPin}
                      disabled={newPinInput.length !== 4}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Save PIN
                    </button>
                    <button
                      onClick={() => { setIsChangingPin(false); setNewPinInput(''); }}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lock Now Action */}
              {onLockAppNow && (
                <button
                  onClick={onLockAppNow}
                  className="w-full py-1.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-purple-200 text-[11px] font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                >
                  <Lock className="w-3 h-3 stroke-[1.8]" />
                  <span>Lock App Screen Abhi</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Live Permissions Matrix */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400 stroke-[1.8]" />
              Active System Permissions
            </h3>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
              AUDITED ON-DEVICE
            </span>
          </div>

          <p className="text-[10px] text-purple-200/60">
            MAYRA asks for only necessary hardware access. Toggle permissions anytime:
          </p>

          <div className="space-y-1.5 pt-1">
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-bold text-white truncate">{perm.name}</div>
                  <div className="text-[9px] text-purple-300/60 truncate">{perm.description}</div>
                </div>
                <button
                  onClick={() => handleTogglePermission(perm.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                    perm.status === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {perm.status === 'granted' ? 'GRANTED' : 'DENIED'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. On-Device Storage & Data Breakdown */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-300 stroke-[1.8]" />
              Stored Personal Data & Memories
            </h3>
            <span className="text-[10px] font-mono text-purple-300/70">
              ~{estimatedStorageKb} KB Local
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
              <span className="text-purple-300/70 block text-[10px]">Saved Memories</span>
              <strong className="text-sm font-bold text-white">{totalMemoriesCount}</strong> items
            </div>
            <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
              <span className="text-purple-300/70 block text-[10px]">Chat Messages</span>
              <strong className="text-sm font-bold text-white">{totalMessagesCount}</strong> turns
            </div>
          </div>

          {/* Delete All Data Danger Button */}
          <button
            onClick={() => setShowConfirmDeleteModal(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold font-sans flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
            <span>Sab Memory & Data Delete Karein (One-Click Wipe)</span>
          </button>
        </div>

        {/* 4. Privacy Charter Guarantees */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-white flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-red-400 stroke-[1.8]" /> Zero Advertising & No Telemetry
          </div>
          <p className="text-[10px] text-purple-200/70 leading-relaxed font-sans">
            MAYRA contains zero advertising SDKs, zero cross-site trackers, and zero third-party telemetry. Context memories stay strictly on your device.
          </p>
        </div>

      </div>

      {/* Confirmation Wipe Modal - Magnifying Glass */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none animate-fade-in">
          <div className="w-full max-w-xs p-5 rounded-3xl bg-black/75 backdrop-blur-3xl border border-rose-500/40 space-y-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
              <span>Permanent Data Deletion?</span>
            </div>

            <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
              Kya aap sach mein <strong>sab memories, chat history, aur personalized state</strong> delete karna chahte hain? Yeh action revert nahi ho sakta.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmTotalWipe}
                className="flex-1 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-sans transition-all cursor-pointer shadow-lg shadow-rose-900/40"
              >
                Haan, Delete Karein
              </button>
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="py-2 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-sans transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
