import React, { useState } from 'react';
import { PermissionItem, PermissionStatusType } from '../../types';
import { MayraLogo } from '../common/MayraLogo';
import { 
  ArrowLeft, Bell, Check, ExternalLink, 
  ShieldCheck, AlertCircle, Info, RefreshCw, X, ShieldAlert, Sparkles
} from 'lucide-react';

interface PermissionsCenterViewProps {
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
  onBack: () => void;
}

export const PermissionsCenterView: React.FC<PermissionsCenterViewProps> = ({
  permissions,
  setPermissions,
  onBack
}) => {
  // Modal states for authentic Android system flows
  const [activeSystemModal, setActiveSystemModal] = useState<
    | null
    | 'floating_windows'
    | 'screen_capture_dialog'
    | 'default_assistant_picker'
    | 'battery_dialog'
    | 'accessibility_dialog'
    | 'notification_dialog'
    | 'permission_detail'
  >(null);

  const [selectedPermForDetail, setSelectedPermForDetail] = useState<PermissionItem | null>(null);
  const [floatingWindowToggle, setFloatingWindowToggle] = useState(false);
  const [screenCaptureRemember, setScreenCaptureRemember] = useState(true);
  const [selectedDefaultAssistant, setSelectedDefaultAssistant] = useState('mayra');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleActionClick = (perm: PermissionItem) => {
    if (perm.id === 'overlay') {
      setActiveSystemModal('floating_windows');
    } else if (perm.id === 'screen_capture') {
      setActiveSystemModal('screen_capture_dialog');
    } else if (perm.id === 'default_assistant') {
      setActiveSystemModal('default_assistant_picker');
    } else if (perm.id === 'battery_optimization') {
      setActiveSystemModal('battery_dialog');
    } else if (perm.id === 'accessibility_service') {
      setActiveSystemModal('accessibility_dialog');
    } else if (perm.id === 'notification_access') {
      setActiveSystemModal('notification_dialog');
    } else {
      // Toggle permission state between granted and not_granted for standard permissions
      setPermissions((prev) =>
        prev.map((p) => {
          if (p.id === perm.id) {
            const nextStatus: PermissionStatusType = p.status === 'granted' ? 'not_granted' : 'granted';
            return {
              ...p,
              status: nextStatus,
              statusLabel: nextStatus === 'granted' ? 'Granted' : 'Grant'
            };
          }
          return p;
        })
      );
    }
  };

  const handleGrantPermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'granted', statusLabel: 'Granted' } : p))
    );
    setActiveSystemModal(null);
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-slate-100 relative select-none">
      
      {/* Top Header matching iPhone Liquid Frosted Glass */}
      <div className="h-14 px-4 bg-black/30 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between z-20 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 active:scale-95 transition-all cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>

          <h1 className="text-base font-bold font-sans text-white tracking-tight">
            Permissions
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notification Bell */}
          <button 
            onClick={handleRefreshAll}
            className={`p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-colors cursor-pointer ${
              isRefreshing ? 'animate-spin text-purple-300' : ''
            }`}
            title="Refresh Permissions Status"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* MAYRA Logo Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-400/30 bg-purple-950/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <MayraLogo size={16} showGlow={false} />
            <span className="text-[10px] font-sans font-bold tracking-wider text-purple-100">
              ★MAYRA
            </span>
          </div>
        </div>
      </div>

      {/* Permissions List Stream */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scrollbar-thin scrollbar-thumb-purple-500/20">
        
        {/* Top Disclaimer / Instruction text */}
        <div className="px-2 py-1 text-purple-300/80 text-[11px] font-sans font-normal leading-relaxed">
          Mayra needs these permissions to do everything for you. Allow only what you want.
        </div>

        {/* Permission Cards */}
        {permissions.map((perm) => {
          const isGranted = perm.status === 'granted';
          const isDefaultRole = perm.id === 'default_assistant';

          return (
            <div
              key={perm.id}
              className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 hover:border-purple-400/40 rounded-3xl flex items-center justify-between gap-3 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]"
            >
              {/* Left Details */}
              <div className="flex-1 pr-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white font-sans tracking-wide">
                    {perm.name}
                  </h3>
                  {perm.isRequired && (
                    <span className="text-[8px] font-sans font-bold text-purple-200 bg-purple-950/80 border border-purple-400/40 px-2 py-0.5 rounded-full shadow-sm">
                      REQUIRED
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-normal text-purple-300/70 leading-relaxed font-sans">
                  {perm.description}
                </p>
              </div>

              {/* Right Action / Status Badge */}
              <div className="shrink-0 flex items-center">
                {isDefaultRole ? (
                  <button
                    onClick={() => handleActionClick(perm)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-purple-600/30 cursor-pointer border border-white/20"
                  >
                    MAYRA
                  </button>
                ) : isGranted ? (
                  <button
                    onClick={() => handleActionClick(perm)}
                    className="text-xs font-bold text-purple-300 hover:text-white transition-colors px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-400/30 flex items-center gap-1 cursor-pointer"
                    title="Click to toggle or manage"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Granted</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleActionClick(perm)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-purple-600/30 cursor-pointer border border-white/20"
                  >
                    Grant
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer Note */}
        <div className="pt-2 pb-6 text-center text-[10px] text-slate-400 font-mono space-y-1">
          <p>Target SDK 36 (Android 16) Runtime Compliance</p>
          <p className="text-slate-400">Strict zero-silent-bypass privacy architecture</p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* AUTHENTIC ANDROID SYSTEM FLOW SIMULATIONS (Exact video recording match) */}
      {/* ========================================================================= */}

      {/* 1. Android Floating Windows / Display Over Other Apps Settings Screen */}
      {activeSystemModal === 'floating_windows' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl text-white z-50 flex flex-col animate-in fade-in duration-200">
          
          {/* Android System Top Bar - Liquid Magnifying Glass */}
          <div className="h-14 px-4 bg-black/40 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (floatingWindowToggle) {
                    handleGrantPermission('overlay');
                  } else {
                    setActiveSystemModal(null);
                  }
                }}
                className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2]" />
              </button>
              <h2 className="text-sm font-bold font-sans text-white">Floating Windows</h2>
            </div>
          </div>

          <div className="px-4 py-2 text-[11px] text-purple-300/80 border-b border-white/10 bg-black/20 backdrop-blur-md">
            14 turned on. Allows overlaying assistant UI above active applications.
          </div>

          {/* App List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
            
            {/* Airtel */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-sm">airtel</div>
                <span className="font-medium text-white text-sm">Airtel</span>
              </div>
              <div className="w-9 h-5 bg-emerald-500 rounded-full flex items-center justify-end p-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* CapCut */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">CC</div>
                <span className="font-medium text-white text-sm">CapCut</span>
              </div>
              <div className="w-9 h-5 bg-white/20 rounded-full flex items-center justify-start p-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">IG</div>
                <span className="font-medium text-white text-sm">Instagram</span>
              </div>
              <div className="w-9 h-5 bg-white/20 rounded-full flex items-center justify-start p-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* MAYRA (Highlight item) */}
            <div className="flex items-center justify-between py-2 px-3 bg-purple-500/20 border border-purple-400/40 rounded-2xl shadow-[0_0_14px_rgba(168,85,247,0.2)]">
              <div className="flex items-center gap-3">
                <MayraLogo size={32} showGlow={false} />
                <div>
                  <span className="font-bold text-white text-sm">Mayra</span>
                  <div className="text-[10px] text-purple-300">Allows overlaying assistant UI</div>
                </div>
              </div>

              <button
                onClick={() => setFloatingWindowToggle(!floatingWindowToggle)}
                className={`w-10 h-6 rounded-full flex items-center transition-colors p-0.5 cursor-pointer ${
                  floatingWindowToggle ? 'bg-purple-500 justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Meesho */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">m</div>
                <span className="font-medium text-white text-sm">Meesho</span>
              </div>
              <div className="w-9 h-5 bg-white/20 rounded-full flex items-center justify-start p-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-black/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">TG</div>
                <span className="font-medium text-white text-sm">Telegram</span>
              </div>
              <div className="w-9 h-5 bg-emerald-500 rounded-full flex items-center justify-end p-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>

          </div>

          <div className="p-4 bg-black/40 backdrop-blur-2xl border-t border-white/10">
            <button
              onClick={() => {
                if (floatingWindowToggle) {
                  handleGrantPermission('overlay');
                } else {
                  setActiveSystemModal(null);
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              {floatingWindowToggle ? 'Save & Return to MAYRA' : 'Close Settings'}
            </button>
          </div>

        </div>
      )}

      {/* 2. Android Native Screen Capture Consent Prompt - Magnifying Glass */}
      {activeSystemModal === 'screen_capture_dialog' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] bg-black/60 backdrop-blur-3xl text-white rounded-3xl p-5 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 font-sans">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MayraLogo size={24} showGlow={false} />
                <span className="text-xs font-bold text-purple-300">Screen Share Request</span>
              </div>

              <p className="text-sm font-semibold text-white leading-snug">
                "Mayra" will start capturing everything that's displayed on your screen.
              </p>
            </div>

            {/* Checkbox "Do not show again" */}
            <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={screenCaptureRemember}
                onChange={(e) => setScreenCaptureRemember(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 bg-black/50 border-white/20 focus:ring-0"
              />
              <span>Do not show again</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveSystemModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => handleGrantPermission('screen_capture')}
                className="px-5 py-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-xl transition-all cursor-pointer"
              >
                Allow
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Android Default Digital Assistant Picker - Magnifying Glass */}
      {activeSystemModal === 'default_assistant_picker' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] bg-black/60 backdrop-blur-3xl text-white rounded-3xl p-5 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Default digital assistant app</h3>
              <button onClick={() => setActiveSystemModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed">
              Select which application handles the long-press power and corner swipe assistant gestures.
            </p>

            <div className="space-y-2">
              {[
                { id: 'none', label: 'None', desc: 'No assistant designated' },
                { id: 'google', label: 'Google Assistant', desc: 'System default' },
                { id: 'mayra', label: 'MAYRA', desc: 'Personal AI Assistant (Recommended)' }
              ].map((item) => (
                <label
                  key={item.id}
                  onClick={() => setSelectedDefaultAssistant(item.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
                    selectedDefaultAssistant === item.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-purple-300/70">{item.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedDefaultAssistant === item.id ? 'border-purple-400 bg-purple-500' : 'border-white/20'
                  }`}>
                    {selectedDefaultAssistant === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveSystemModal(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrantPermission('default_assistant')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Android Battery Optimization Exemption - Magnifying Glass */}
      {activeSystemModal === 'battery_dialog' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] bg-black/60 backdrop-blur-3xl text-white rounded-3xl p-5 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 font-sans">
            <h3 className="text-sm font-bold text-white">Let app always run in background?</h3>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Allowing <span className="font-bold text-purple-300">MAYRA</span> to always run in the background reduces battery life, but ensures wake-words, routines, and voice guardian shields operate continuously with screen off.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveSystemModal(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Deny
              </button>
              <button
                onClick={() => handleGrantPermission('battery_optimization')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Android Accessibility Service Dialog - Magnifying Glass */}
      {activeSystemModal === 'accessibility_dialog' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] bg-black/60 backdrop-blur-3xl text-white rounded-3xl p-5 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 font-sans">
            <h3 className="text-sm font-bold text-white">Enable MAYRA Accessibility Service</h3>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              To automate app workflows (e.g. sending messages on WhatsApp or YouTube playback controls), Android requires explicit user consent in Accessibility settings.
            </p>
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200">
              Note: MAYRA uses Accessibility solely for user-requested on-device task execution and never collects sensitive passwords.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveSystemModal(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrantPermission('accessibility_service')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Enable in Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Android Notification Listener Service Dialog - Magnifying Glass */}
      {activeSystemModal === 'notification_dialog' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-[320px] bg-black/60 backdrop-blur-3xl text-white rounded-3xl p-5 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-4 font-sans">
            <h3 className="text-sm font-bold text-white">Allow Notification Access?</h3>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Allowing <span className="font-bold text-purple-300">MAYRA</span> to read device notifications lets her announce incoming WhatsApp/SMS messages and caller names hands-free.
            </p>
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-[11px] text-indigo-200">
              Android will open Special App Access settings for you to toggle MAYRA on.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveSystemModal(null)}
                className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrantPermission('notification_access')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Open Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
