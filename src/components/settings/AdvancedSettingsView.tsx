import React, { useState } from 'react';
import { 
  AdvancedConfig, SettingsSubScreen, PermissionItem, 
  VoiceGuardianConfig 
} from '../../types';
import { AppLockConfig } from '../security/useAppLock';
import { 
  ShieldAlert, ShieldCheck, Shield, Mic, Camera, Bell, 
  Layers, Accessibility, Cpu, Battery, 
  Terminal, Bug, AlertOctagon, Sliders, ArrowLeft,
  Hand, Flame, Activity, Sparkles, ChevronRight,
  Car, Lock, ScanText, Volume2, HardDrive, Smartphone,
  Zap, HelpCircle, CheckCircle2
} from 'lucide-react';
import { GestureUsageService } from '../../services/gestures/gestureUsageService';
import { GestureTutorialModal } from '../gestures/GestureTutorialModal';
import { GesturePracticeModal } from '../gestures/GesturePracticeModal';
import { AppIconTile } from '../common/AppIconTile';

export interface AdvancedSettingsViewProps {
  config: AdvancedConfig;
  onChange: (updated: Partial<AdvancedConfig>) => void;
  onBack: () => void;
  onNavigateSubScreen?: (subScreen: SettingsSubScreen) => void;
  telemetryLive?: {
    cpuTemp: number;
    cpuLoad: number;
    ramAllocatedMb: number;
    batteryLevel: number;
    batteryHealth: string;
    chargingStatus: string;
  };
  permissions?: PermissionItem[];
  voiceGuardianConfig?: VoiceGuardianConfig;
  appLockConfig?: AppLockConfig;
}

export const AdvancedSettingsView: React.FC<AdvancedSettingsViewProps> = ({
  config,
  onChange,
  onBack,
  onNavigateSubScreen,
  telemetryLive = {
    cpuTemp: 38,
    cpuLoad: 24,
    ramAllocatedMb: 412,
    batteryLevel: 88,
    batteryHealth: 'Good (98%)',
    chargingStatus: 'Discharging'
  },
  permissions = [],
  voiceGuardianConfig,
  appLockConfig
}) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState<boolean>(false);
  const todayUsageCount = GestureUsageService.getTodayGestureCount();

  const handleToggleBackgroundGesture = (checked: boolean) => {
    onChange({ backgroundHandGestureEnabled: checked });
    if (checked && !GestureUsageService.hasCompletedGestureTutorial()) {
      setIsTutorialOpen(true);
    }
  };

  const grantedPermissionsCount = permissions.filter(
    p => p.status === 'granted' || p.id === 'default_assistant'
  ).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-200">
      
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Advanced System & Security</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Security shields, telemetry, permissions & kernel controls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-16">

        {/* 1. SECURITY & ANTI-THEFT SUB-GROUP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
            <h3 className="text-[11px] font-sans font-bold tracking-wider uppercase text-rose-300">
              Security & Anti-Theft Protection
            </h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-rose-500/30 to-transparent" />
          </div>

          <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* Voice Guardian */}
            <button
              onClick={() => onNavigateSubScreen?.('voice_guardian')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={ShieldCheck} color="cyan" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Voice Guardian
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-400/40">
                      {voiceGuardianConfig?.enabled ? 'SHIELD ON' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    Biometric voice match, owner-only shield & acoustic protection
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Touch Guard & Anti-Theft */}
            <button
              onClick={() => onNavigateSubScreen?.('touch_security_vault')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={ShieldAlert} color="rose" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                      Touch Guard & Anti-Theft
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-950/90 text-rose-300 border border-rose-400/40">
                      ARMED
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    Motion alarm, pocket guard, unauthorized pickup detection
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Emergency SOS & Driving Automation */}
            <button
              onClick={() => onNavigateSubScreen?.('emergency_sos')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={Car} color="amber" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Emergency SOS & Driving Automation
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-950/90 text-rose-300 border border-rose-400/40">
                      SOS READY
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    Fall detection, crash impact, auto SOS dispatcher & driving mode
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Privacy & App Lock */}
            <button
              onClick={() => onNavigateSubScreen?.('privacy')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={Lock} color="purple" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      Privacy & App Lock
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-purple-950/90 text-purple-300 border border-purple-400/40">
                      {appLockConfig?.isEnabled ? 'LOCKED' : 'READY'}
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    PIN protection, biometric app lock, hidden vault & access guards
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>

        {/* 2. SYSTEM & HARDWARE SUB-GROUP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <h3 className="text-[11px] font-sans font-bold tracking-wider uppercase text-cyan-300">
              System, Hardware & Kernel
            </h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-500/30 to-transparent" />
          </div>

          <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            
            {/* Live Hardware Telemetry Panel */}
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AppIconTile icon={Cpu} color="cyan" size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Hardware Telemetry & Kernel</span>
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-400/40">
                        LIVE MONITOR
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/60 mt-0.5">
                      Octa-core Snapdragon NPU • Adreno 750 • Sensor Hub
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Live Hardware Gauges */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-purple-300/70 font-sans block">CPU Core Load</span>
                    <span className="text-sm font-mono font-bold text-white">{telemetryLive.cpuLoad}%</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-purple-300/70 font-sans block">Thermal Sensor</span>
                    <span className="text-sm font-mono font-bold text-amber-300">{telemetryLive.cpuTemp}°C</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-purple-300/70 font-sans block">RAM Allocation</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">{telemetryLive.ramAllocatedMb} MB</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-purple-300/70 font-sans block">Battery & Health</span>
                    <span className="text-sm font-mono font-bold text-purple-200">{telemetryLive.batteryLevel}%</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Battery className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Center */}
            <button
              onClick={() => onNavigateSubScreen?.('permissions')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={Sliders} color="blue" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      Permissions Center
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-950/90 text-blue-300 border border-blue-400/40">
                      {grantedPermissionsCount} GRANTED
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    Microphone, camera, notifications, background overlay & accessibility
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>

        {/* 3. AI TOOLS & AUTOMATION SUB-GROUP */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h3 className="text-[11px] font-sans font-bold tracking-wider uppercase text-emerald-300">
              AI Tools & Automation Matrix
            </h3>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-emerald-500/30 to-transparent" />
          </div>

          <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* AI Toolkit, Scanner & Whiteboard */}
            <button
              onClick={() => onNavigateSubScreen?.('ai_toolkit_scanner')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={ScanText} color="emerald" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      AI Toolkit, Scanner & Whiteboard
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-400/40">
                      VISION PRO
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    Document scanner, OCR text extractor, whiteboard math solver
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Voice Dialogue Rules & Automation */}
            <button
              onClick={() => onNavigateSubScreen?.('automation_dialogue_matrix')}
              className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.06] active:scale-[0.99] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <AppIconTile icon={Volume2} color="teal" size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      Voice Dialogue Rules & Automation
                    </span>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded-full font-bold bg-teal-950/90 text-teal-300 border border-teal-400/40">
                      55 RULES
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-purple-200/60 line-clamp-1 mt-0.5">
                    55 Trigger speech rules for action, success & alert states
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>

        {/* 4. BACKGROUND HAND GESTURE & FLOATING CHAT HEAD */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Background Hand Gesture & Chat Head</span>
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-400/30">
                    OVERLAY
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/60 font-sans">
                  Floating bubble across phone UI with touchless camera gesture triggers
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={config.backgroundHandGestureEnabled} 
                onChange={(e) => handleToggleBackgroundGesture(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600 shadow-inner"></div>
            </label>
          </div>

          {/* Today's Usage Badge */}
          <div className="flex items-center justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-white block">Today&apos;s Gesture Usage</span>
                <span className="text-[8px] text-purple-300/70 font-mono">Live bubble badge counter</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono font-bold text-[11px]">
              {todayUsageCount} actions
            </span>
          </div>

          {/* Interactive Tutorial & Practice Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="p-2.5 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 border border-cyan-500/30 flex items-center gap-2 transition-all text-left shadow-sm active:scale-98 cursor-pointer backdrop-blur-md"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold block text-white">Visual Tutorial</span>
                <span className="text-[9px] text-cyan-300/80 font-mono">Gesture guide</span>
              </div>
            </button>

            <button
              onClick={() => setIsPracticeOpen(true)}
              className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 flex items-center gap-2 transition-all text-left shadow-sm active:scale-98 cursor-pointer backdrop-blur-md"
            >
              <Flame className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-bold block text-white">Test / Practice</span>
                <span className="text-[9px] text-purple-300/80 font-mono">Zero-risk sandbox</span>
              </div>
            </button>
          </div>
        </div>

        {/* 5. SAFETY & DEVELOPER OPTIONS */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Safety & Content Filtering
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'strict', label: 'Strict', desc: 'Max safety' },
              { id: 'standard', label: 'Standard', desc: 'Balanced' },
              { id: 'permissive', label: 'Permissive', desc: 'Dev/Direct' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onChange({ safetyLevel: lvl.id as any })}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  config.safetyLevel === lvl.id
                    ? 'bg-purple-600/30 border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-black/30 border-white/10 text-purple-200/60 hover:text-white'
                }`}
              >
                <div className="text-xs">{lvl.label}</div>
                <div className="text-[9px] text-purple-300/50 mt-0.5">{lvl.desc}</div>
              </button>
            ))}
          </div>

          {/* Background Execution & Power */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-[10px] font-mono font-bold text-purple-300/80 uppercase">
              Kernel & Background Service
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <div>
                <div className="text-white font-medium text-xs">Background Service Keeper</div>
                <div className="text-[9px] text-purple-300/60">Keep assistant listening and timers active</div>
              </div>
              <input
                type="checkbox"
                checked={config.backgroundServiceEnabled}
                onChange={(e) => onChange({ backgroundServiceEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <div>
                <div className="text-white font-medium text-xs">Battery Optimization Ignore</div>
                <div className="text-[9px] text-purple-300/60">Prevents Android OS from killing background tasks</div>
              </div>
              <input
                type="checkbox"
                checked={config.batteryOptimizationExempt}
                onChange={(e) => onChange({ batteryOptimizationExempt: e.target.checked })}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <Bug className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <div className="text-white font-medium text-xs">Debug Diagnostics Mode</div>
                  <div className="text-[9px] text-purple-300/60">Display API latency metrics & execution graph</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.developerDebugMode}
                onChange={(e) => onChange({ developerDebugMode: e.target.checked })}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Tutorial Guide Modal */}
      <GestureTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenPracticeMode={() => setIsPracticeOpen(true)}
      />

      {/* Practice Sandbox Modal */}
      <GesturePracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
    </div>
  );
};
