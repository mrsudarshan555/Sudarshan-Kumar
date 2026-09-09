import React, { useState, useEffect } from 'react';
import { 
  RotateCw, Plus, TrendingDown, TrendingUp, Calendar, Clock, 
  Battery, BatteryCharging, HardDrive, Cpu, Mic, ShieldCheck, 
  Layers, Sparkles, ChevronRight, Zap, Search, Bell, Smartphone,
  CheckCircle2, Volume2, Shield, Play, Pause, SkipForward, SkipBack,
  Music, Sun, CloudSun, AlertOctagon, PhoneCall, Car, Brain, Leaf, Compass, Radio,
  X, Moon, Navigation, Thermometer, Eye, EyeOff
} from 'lucide-react';
import { 
  SettingsSubScreen, 
  PermissionItem, 
  AssistantConfig, 
  VoiceGuardianConfig, 
  UserPersonalConfig 
} from '../../types';
import { NeuralTradingFinanceEngine } from '../../services/finance/NeuralTradingFinanceEngine';
import { UnifiedAppHubEngine, CalendarEventEntry, SmartAlarmTimer } from '../../services/hub/UnifiedAppHubEngine';
import { DeepAutomationMatrixEngine, HardwareTelemetryData } from '../../services/automation/DeepAutomationMatrixEngine';
import { TouchSecurityEngine } from '../../services/security/TouchSecurityEngine';
import { SmartLifestyleIoTEngine } from '../../services/lifestyle/SmartLifestyleIoTEngine';
import { localModelManager } from '../../services/offline/localModelManager';
import { SystemAutomationEmergencyEngine } from '../../services/automation/SystemAutomationEmergencyEngine';
import { QuantumMemoryVisionEngine } from '../../services/memory/QuantumMemoryVisionEngine';
import { LiveWidgetsWorkflowEngine, LiveWidgetsState } from '../../services/lifestyle/LiveWidgetsWorkflowEngine';

interface SettingsTopWidgetCarouselProps {
  onNavigateSubScreen: (subScreen: SettingsSubScreen) => void;
  assistantConfig: AssistantConfig;
  voiceGuardianConfig: VoiceGuardianConfig;
  personalConfig: UserPersonalConfig;
  permissions: PermissionItem[];
  appLockConfig?: { isEnabled: boolean };
}

export const SettingsTopWidgetCarousel: React.FC<SettingsTopWidgetCarouselProps> = ({
  onNavigateSubScreen,
  assistantConfig,
  voiceGuardianConfig,
  personalConfig,
  permissions,
  appLockConfig
}) => {
  // 1. Finance / Trading Live State
  const [tradingData, setTradingData] = useState(() => {
    const e = NeuralTradingFinanceEngine.getInstance();
    return {
      symbol: e.getSymbol(),
      price: e.getPrice(),
      change: e.getChange(),
      pcr: e.getPCR()
    };
  });

  const [isRefreshingTrading, setIsRefreshingTrading] = useState(false);

  // 2. Schedule / Calendar Live State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventEntry[]>(() => {
    return UnifiedAppHubEngine.getInstance().getCalendar();
  });
  const [alarms, setAlarms] = useState<SmartAlarmTimer[]>(() => {
    return UnifiedAppHubEngine.getInstance().getAlarms();
  });

  // 3. System Hardware Telemetry
  const [telemetry, setTelemetry] = useState<HardwareTelemetryData>(() => {
    return DeepAutomationMatrixEngine.getInstance().getTelemetry();
  });

  // 4. Touch Security State
  const [touchSecurity, setTouchSecurity] = useState(() => {
    const e = TouchSecurityEngine.getInstance();
    return {
      isArmed: e.getArmedStatus(),
      isAlarming: e.isAlarming()
    };
  });

  // 5. Smart IoT State
  const [iotData, setIotData] = useState(() => {
    const e = SmartLifestyleIoTEngine.getInstance();
    return {
      total: e.getDevices().length,
      active: e.getDevices().filter(d => d.state).length
    };
  });

  // 6. Offline Models Count
  const [offlineModels, setOfflineModels] = useState(() => {
    const all = localModelManager.getAllModels();
    const ready = all.filter(m => m.status === 'ready').length;
    return { total: all.length, ready };
  });

  // 7. Media & Music Player Live State
  const [mediaState, setMediaState] = useState(() => {
    return SmartLifestyleIoTEngine.getInstance().getMedia();
  });

  // 8. Emergency SOS & Driving Mode State
  const [emergencyState, setEmergencyState] = useState(() => {
    const e = SystemAutomationEmergencyEngine.getInstance();
    return {
      isTriggered: e.isSosTriggered(),
      contactsCount: e.getEmergencyContacts().length,
      drivingConfig: e.getDrivingConfig()
    };
  });

  // 9. Quantum Memory Vault State
  const [memoryState, setMemoryState] = useState(() => {
    const e = QuantumMemoryVisionEngine.getInstance();
    return {
      factsCount: e.getMemories().length,
      scansCount: e.getVisionScans().length
    };
  });

  // Top Custom Requested Widgets Real Workflow State (Sem-tu-Sem)
  const [liveWorkflow, setLiveWorkflow] = useState<LiveWidgetsState>(() => 
    LiveWidgetsWorkflowEngine.getInstance().getState()
  );

  // Live real clock & date for Card 1
  const [clockTimeStr, setClockTimeStr] = useState('4:24 AM');
  const [clockDateStr, setClockDateStr] = useState('12 dec');

  // Real-time engine event listeners
  useEffect(() => {
    const liveEngine = LiveWidgetsWorkflowEngine.getInstance();
    const unsubLive = liveEngine.subscribe(() => {
      setLiveWorkflow(liveEngine.getState());
    });

    // Real system clock update
    const updateClock = () => {
      const now = new Date();
      setClockTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setClockDateStr(now.toLocaleDateString([], { day: 'numeric', month: 'short' }).toLowerCase());
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 30000);

    const tradingEngine = NeuralTradingFinanceEngine.getInstance();
    const unsubTrading = tradingEngine.subscribe(() => {
      setTradingData({
        symbol: tradingEngine.getSymbol(),
        price: tradingEngine.getPrice(),
        change: tradingEngine.getChange(),
        pcr: tradingEngine.getPCR()
      });
    });

    const hubEngine = UnifiedAppHubEngine.getInstance();
    const unsubHub = hubEngine.subscribe(() => {
      setCalendarEvents([...hubEngine.getCalendar()]);
      setAlarms([...hubEngine.getAlarms()]);
    });

    const matrixEngine = DeepAutomationMatrixEngine.getInstance();
    const unsubMatrix = matrixEngine.subscribe(() => {
      setTelemetry({ ...matrixEngine.getTelemetry() });
    });

    const touchEngine = TouchSecurityEngine.getInstance();
    const unsubTouch = touchEngine.subscribe(() => {
      setTouchSecurity({
        isArmed: touchEngine.getArmedStatus(),
        isAlarming: touchEngine.isAlarming()
      });
    });

    const iotEngine = SmartLifestyleIoTEngine.getInstance();
    const unsubIot = iotEngine.subscribe(() => {
      setIotData({
        total: iotEngine.getDevices().length,
        active: iotEngine.getDevices().filter(d => d.state).length
      });
      setMediaState({ ...iotEngine.getMedia() });
    });

    const emergencyEngine = SystemAutomationEmergencyEngine.getInstance();
    const unsubEmergency = emergencyEngine.subscribe(() => {
      setEmergencyState({
        isTriggered: emergencyEngine.isSosTriggered(),
        contactsCount: emergencyEngine.getEmergencyContacts().length,
        drivingConfig: emergencyEngine.getDrivingConfig()
      });
    });

    const memoryEngine = QuantumMemoryVisionEngine.getInstance();
    const unsubMemory = memoryEngine.subscribe(() => {
      setMemoryState({
        factsCount: memoryEngine.getMemories().length,
        scansCount: memoryEngine.getVisionScans().length
      });
    });

    return () => {
      unsubLive();
      clearInterval(clockInterval);
      unsubTrading();
      unsubHub();
      unsubMatrix();
      unsubTouch();
      unsubIot();
      unsubEmergency();
      unsubMemory();
    };
  }, []);

  const handleRefreshTrading = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingTrading(true);
    NeuralTradingFinanceEngine.getInstance().autoDetectChartLevels(tradingData.symbol);
    setTimeout(() => setIsRefreshingTrading(false), 600);
  };

  const handleToggleMediaPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const iotEngine = SmartLifestyleIoTEngine.getInstance();
    iotEngine.toggleMediaPlay();
    setMediaState({ ...iotEngine.getMedia() });
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const iotEngine = SmartLifestyleIoTEngine.getInstance();
    iotEngine.playTrack('Chaleya - Jawan', 'Anirudh Ravichander, Arijit Singh', 'spotify');
    setMediaState({ ...iotEngine.getMedia() });
  };

  const handlePrevTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const iotEngine = SmartLifestyleIoTEngine.getInstance();
    iotEngine.playTrack('Kesariya - Brahmāstra', 'Arijit Singh, Pritam', 'spotify');
    setMediaState({ ...iotEngine.getMedia() });
  };

  // Date formatting matching screenshot: "2 Wed"
  const now = new Date();
  const dayOfMonth = now.getDate();
  const weekdayShort = now.toLocaleDateString('en-US', { weekday: 'short' });
  const monthShort = now.toLocaleDateString('en-US', { month: 'short' });

  // Permissions summary
  const grantedPermsCount = permissions.filter(p => p.status === 'granted' || p.id === 'default_assistant').length;
  const totalPermsCount = permissions.length || 9;

  // Active persona
  const isStonicx = assistantConfig.activeMode === 'stonicx';

  // Watchlist calculations
  const isTradePositive = tradingData.change >= 0;
  const changePct = ((tradingData.change / (tradingData.price || 1)) * 100).toFixed(2);

  // SVG Sparkline path calculation for Watchlist widget
  const sparkPoints = isTradePositive 
    ? [20, 26, 23, 30, 28, 35, 32, 40, 44, 42, 49, 58] 
    : [58, 48, 52, 40, 44, 36, 32, 28, 30, 22, 24, 18];
  
  const minVal = Math.min(...sparkPoints);
  const maxVal = Math.max(...sparkPoints);
  const range = maxVal - minVal || 1;
  const svgW = 210;
  const svgH = 50;
  const step = svgW / (sparkPoints.length - 1);

  const polylineCoords = sparkPoints.map((val, idx) => {
    const x = idx * step;
    const y = svgH - ((val - minVal) / range) * (svgH - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  const areaCoords = `0,${svgH} ${polylineCoords} ${svgW},${svgH}`;

  return (
    <div className="w-full space-y-2 mb-3">
      {/* Subtle Section Label with Horizontal Swipe Hint */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span className="text-[11px] font-sans font-bold tracking-wider text-purple-200/90 uppercase">
            Glance & Live Widgets
          </span>
        </div>
        <span className="text-[9px] font-mono text-purple-300/60 flex items-center gap-1">
          <span>18 Live Widgets • Swipe</span>
          <span className="animate-pulse">→</span>
        </span>
      </div>

      {/* HORIZONTAL CAROUSEL ROW (Left-to-Right Swipe) */}
      <div className="w-full overflow-x-auto flex gap-3 pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scrollbar-none touch-pan-x scroll-smooth">

        {/* =========================================================================
            1. RECHARGE / REAL PHONE BATTERY WIDGET (Exact Match to Video 1 + Real Device Live Sync)
        ========================================================================= */}
        <div 
          onClick={() => {
            LiveWidgetsWorkflowEngine.getInstance().refreshBatteryStatusAndSpeak();
          }}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#121212] text-white rounded-[28px] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-white/10 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer"
          title="Tap for real-time battery status & vocal report"
        >
          {/* Top Row: Title + Real Hardware Cable Simulator Tool */}
          <div className="z-10 pt-0.5">
            <div className="flex items-start justify-between">
              <h2 className="text-[34px] font-bold text-white tracking-tight leading-tight">
                {liveWorkflow.batteryPercent >= 100 
                  ? 'Fully charged.' 
                  : liveWorkflow.isCharging 
                  ? 'Charging...' 
                  : liveWorkflow.batteryPercent <= 22 
                  ? 'Please charge.' 
                  : 'Recharge.'}
              </h2>

              {/* Mini Manual Cable Test Switch (For testing plug animation without physical cable) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  LiveWidgetsWorkflowEngine.getInstance().toggleSimulateChargerPlug();
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all border ${
                  liveWorkflow.isCharging 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
                title={liveWorkflow.isCharging ? "Unplug Charger Cable" : "Plug in Charger Cable (Test)"}
              >
                {liveWorkflow.isCharging ? '⚡' : '🔌'}
              </button>
            </div>

            {/* Subtitle reflects real hardware state */}
            {liveWorkflow.isCharging ? (
              <p className="text-[11px] font-medium text-emerald-400 -mt-0.5 animate-pulse flex items-center gap-1">
                <span>⚡</span>
                <span>Fast Charger connected {liveWorkflow.batteryChargingTimeText ? `• ${liveWorkflow.batteryChargingTimeText}` : ''}</span>
              </p>
            ) : liveWorkflow.batteryPercent <= 22 ? (
              <p className="text-[11px] font-medium text-red-400 -mt-0.5 animate-pulse flex items-center gap-1">
                <span>⚠️</span>
                <span>Low battery • Please connect charger</span>
              </p>
            ) : liveWorkflow.batteryPercent >= 100 ? (
              <p className="text-[11px] font-medium text-lime-400 -mt-0.5 flex items-center gap-1">
                <span>✓</span>
                <span>Optimal power • 100% capacity</span>
              </p>
            ) : (
              <p className="text-[11px] font-medium text-neutral-400 -mt-0.5">
                Phone on battery power • Discharging
              </p>
            )}
          </div>

          {/* Scale Markers: 0, 50, 100 */}
          <div className="flex items-center justify-between text-[13px] font-medium text-[#737373] px-2.5 pt-1 z-10 font-sans">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>

          {/* Center Capsule Pill Track with Liquid Fluid & Radiant Halo */}
          <div className="relative w-full h-[78px] rounded-full bg-[#181819] border border-white/10 flex items-center p-1.5 shadow-[inset_0_3px_10px_rgba(0,0,0,0.85)] overflow-hidden my-auto z-10">
            {/* Subtle Dot Grid Mesh Inside Track */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 1.2px, transparent 1.2px)',
                backgroundSize: '7px 7px'
              }}
            />

            {/* Glowing Liquid Fluid with dynamic color & aura based on real hardware state */}
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out relative flex items-center justify-end overflow-hidden ${
                liveWorkflow.isCharging || liveWorkflow.batteryPercent >= 90
                  ? 'bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#84cc16]'
                  : liveWorkflow.batteryPercent <= 25
                  ? 'bg-gradient-to-r from-[#b91c1c] via-[#ef4444] to-[#f97316]'
                  : 'bg-gradient-to-r from-[#c2410c] via-[#f59e0b] to-[#84cc16]'
              }`}
              style={{
                width: `${Math.max(14, Math.min(100, liveWorkflow.batteryPercent))}%`,
                boxShadow: (liveWorkflow.isCharging || liveWorkflow.batteryPercent >= 90)
                  ? '0 0 45px rgba(132, 204, 22, 0.95), 0 0 20px rgba(34, 197, 94, 0.95), inset 0 0 16px rgba(254, 240, 138, 0.45)'
                  : liveWorkflow.batteryPercent <= 25
                  ? '0 0 35px rgba(239, 68, 68, 0.9), 0 0 16px rgba(249, 115, 22, 0.9), inset 0 0 12px rgba(254, 240, 138, 0.35)'
                  : '0 0 30px rgba(245, 158, 11, 0.8), 0 0 14px rgba(132, 204, 22, 0.7)'
              }}
            >
              {/* Molten edge highlight */}
              <div className="absolute right-0 top-0 bottom-0 w-8 rounded-r-full bg-gradient-to-l from-white/40 via-amber-200/30 to-transparent pointer-events-none" />

              {/* Charging light pulse wave across the fluid */}
              {liveWorkflow.isCharging && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Specular glass reflection along top half of capsule */}
            <div className="absolute inset-x-4 top-2 h-[30%] rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent pointer-events-none" />
          </div>

          {/* Bottom Status Row: Live Hardware Status */}
          <div className="z-10 flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1 pb-0.5">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                liveWorkflow.isCharging || liveWorkflow.batteryPercent >= 100
                  ? 'bg-lime-400 shadow-[0_0_8px_#a3e635]' 
                  : liveWorkflow.batteryPercent <= 22
                  ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
                  : 'bg-amber-400'
              }`} />
              <span className="font-bold text-neutral-200">{liveWorkflow.batteryPercent}% LIVE</span>
            </span>

            <span className="flex items-center gap-1 font-semibold">
              {liveWorkflow.isCharging ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="animate-pulse">⚡</span> CHARGING
                </span>
              ) : liveWorkflow.batteryPercent >= 100 ? (
                <span className="text-lime-400">100% FULL</span>
              ) : liveWorkflow.batteryPercent <= 22 ? (
                <span className="text-red-400 animate-pulse">PLUG IN CHARGER</span>
              ) : (
                <span className="text-neutral-400">DISCHARGING</span>
              )}
            </span>
          </div>
        </div>


        {/* =========================================================================
            2. MULTI-CARD FINTECH LEATHER WALLET (Exact Match to Video 2)
        ========================================================================= */}
        <div 
          onClick={() => {
            LiveWidgetsWorkflowEngine.getInstance().toggleWalletVisibility();
          }}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#243527] text-white rounded-[28px] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-emerald-900/40 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer"
        >
          {/* Background subtle radial ambient olive lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#344d37]/80 via-[#243527] to-[#1a271c] pointer-events-none" />

          {/* Top Protruding Cards: Stripe, Wise, PayPal */}
          <div className="w-full pt-1 px-1 z-10 space-y-0 relative">
            {/* Stripe Card (Lavender) */}
            <div 
              className={`w-full h-11 rounded-2xl bg-[#c4b5fd] text-[#3b1d70] px-3.5 flex items-center justify-between shadow-md transition-all duration-300 ${
                liveWorkflow.isWalletRevealed ? '-translate-y-1 scale-[1.01]' : 'translate-y-1'
              }`}
            >
              <span className="text-[14px] font-black tracking-tight lowercase">
                stripe
              </span>
              <span className="text-[12px] font-mono font-bold">
                {liveWorkflow.isWalletRevealed ? '$32,495' : '••••••'}
              </span>
            </div>

            {/* Wise Card (Lime Green) */}
            <div 
              className={`w-full h-11 rounded-2xl bg-[#86efac] text-[#064e3b] px-3.5 flex items-center justify-between shadow-md -mt-3 transition-all duration-300 ${
                liveWorkflow.isWalletRevealed ? '-translate-y-1.5' : 'translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black">❯❯</span>
                <span className="text-[14px] font-extrabold tracking-tight lowercase">
                  wise
                </span>
              </div>
              <span className="text-[12px] font-mono font-bold">
                {liveWorkflow.isWalletRevealed ? '$45,654' : '••••••'}
              </span>
            </div>

            {/* PayPal Card (Ice Blue) */}
            <div 
              className={`w-full h-11 rounded-2xl bg-[#bae6fd] text-[#0369a1] px-3.5 flex items-center justify-between shadow-md -mt-3 transition-all duration-300 ${
                liveWorkflow.isWalletRevealed ? '-translate-y-2' : 'translate-y-0'
              }`}
            >
              <span className="text-[14px] font-extrabold tracking-tight italic">
                PayPal
              </span>
              <span className="text-[12px] font-mono font-bold">
                {liveWorkflow.isWalletRevealed ? '$345,865' : '••••••'}
              </span>
            </div>
          </div>

          {/* Front Stitched Leather Pocket */}
          <div className="w-full bg-[#152417] rounded-[24px] p-4 border border-emerald-800/50 relative shadow-[0_12px_28px_rgba(0,0,0,0.65)] flex flex-col items-center justify-center -mt-3 z-20">
            {/* Dashed perimeter stitch line */}
            <div className="absolute inset-1.5 rounded-[20px] border border-dashed border-[#345237]/90 pointer-events-none" />

            {/* Total Balance Digits */}
            <div className="text-center pt-0.5 pb-1">
              <div className="text-[34px] font-extrabold tracking-tight text-white leading-none drop-shadow-sm font-sans">
                {liveWorkflow.isWalletRevealed ? '424,014' : '******'}
              </div>
              <div className="text-[11px] font-medium tracking-wide text-[#7fa384] mt-1.5 uppercase">
                Total Balance
              </div>
            </div>

            {/* Center Eye Icon Button */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                LiveWidgetsWorkflowEngine.getInstance().toggleWalletVisibility();
              }}
              className="mt-1.5 w-9 h-9 rounded-full bg-[#203623] hover:bg-[#2a452e] text-[#a3c2a8] hover:text-white flex items-center justify-center transition-all shadow-inner active:scale-95 cursor-pointer"
              title={liveWorkflow.isWalletRevealed ? "Hide Balances" : "Reveal Balances"}
            >
              {liveWorkflow.isWalletRevealed ? (
                <Eye className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <EyeOff className="w-4 h-4 stroke-[2.2]" />
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            1. MIN READING 42 MEDITATIVE GAUGE WIDGET (Real Workflow + Sem-tu-Sem)
        ========================================================================= */}
        <div 
          onClick={() => {
            const engine = LiveWidgetsWorkflowEngine.getInstance();
            if (liveWorkflow.isBreathingActive) {
              engine.pauseBreathingSession();
            } else {
              engine.startBreathingSession();
            }
          }}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#120e09] text-[#fef08a] rounded-[28px] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-[#f59e0b]/25 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer"
        >
          {/* Ambient warm background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#5c3509]/35 via-transparent to-transparent pointer-events-none" />

          {/* Header: Dynamic Clock & Date */}
          <div className="flex items-center justify-between z-10 px-1 pt-0.5">
            <span className="text-[13px] font-sans font-medium text-[#d8b88c]">
              {clockDateStr}
            </span>
            <span className="text-[13px] font-mono font-medium text-[#d8b88c]">
              {clockTimeStr}
            </span>
          </div>

          {/* Center Arc Gauge + MIN READING 42 */}
          <div className="relative flex flex-col items-center justify-center my-auto -mt-0.5">
            <svg className="w-[185px] h-[135px] overflow-visible" viewBox="0 0 185 135">
              <defs>
                <linearGradient id="minReadingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>
                <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Golden Gradient Progress Arc */}
              <path
                d="M 28 118 A 68 68 0 1 1 157 118"
                fill="none"
                stroke="url(#minReadingGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                filter="url(#amberGlow)"
                className={liveWorkflow.isBreathingActive ? "opacity-100 animate-pulse" : "opacity-95"}
              />

              {/* Inner Dotted Tick Track */}
              <path
                d="M 38 112 A 56 56 0 1 1 147 112"
                fill="none"
                stroke="#e2b774"
                strokeWidth="3.5"
                strokeDasharray="1 8"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>

            {/* Center Text Overlaid on Arc */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#e2b774] font-semibold">
                {liveWorkflow.isBreathingActive 
                  ? `${liveWorkflow.breathPhase} (${liveWorkflow.breathSecondsLeft}s)`
                  : 'MIN READING'}
              </span>
              <span className="text-[58px] font-light tracking-tight text-[#fef08a] leading-none mt-0.5 drop-shadow-[0_0_16px_rgba(254,240,138,0.45)]">
                {liveWorkflow.reading}
              </span>
            </div>
          </div>

          {/* Bottom Controls: Pause, Play, Close (Live Real Audio & Cadence) */}
          <div className="flex items-center justify-center gap-4 z-10 pb-0.5">
            {/* Left: Pause Button */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                LiveWidgetsWorkflowEngine.getInstance().pauseBreathingSession();
              }}
              className={`w-11 h-11 rounded-full bg-[#2a2119]/80 text-[#d8b88c] border border-white/5 flex items-center justify-center hover:bg-[#382b20] active:scale-95 transition-all shadow-md ${!liveWorkflow.isBreathingActive ? 'opacity-60' : ''}`}
              title="Pause Guided Breath"
            >
              <div className="flex items-center gap-1">
                <span className="w-1 h-3.5 bg-current rounded-full" />
                <span className="w-1 h-3.5 bg-current rounded-full" />
              </div>
            </button>

            {/* Center: Glowing Golden Play Button */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const engine = LiveWidgetsWorkflowEngine.getInstance();
                if (liveWorkflow.isBreathingActive) {
                  engine.pauseBreathingSession();
                } else {
                  engine.startBreathingSession();
                }
              }}
              className={`w-14 h-14 rounded-full bg-gradient-to-b from-[#fde68a] via-[#f59e0b] to-[#b45309] text-[#451a03] shadow-[0_0_24px_rgba(245,158,11,0.65)] border border-yellow-200/60 flex items-center justify-center hover:brightness-110 active:scale-95 transition-transform ${liveWorkflow.isBreathingActive ? 'ring-4 ring-yellow-400/50 scale-105' : ''}`}
              title={liveWorkflow.isBreathingActive ? "Active Session" : "Start Guided Breath"}
            >
              {liveWorkflow.isBreathingActive ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-5 bg-[#451a03] rounded-full" />
                  <span className="w-1.5 h-5 bg-[#451a03] rounded-full" />
                </div>
              ) : (
                <Play className="w-6 h-6 fill-[#451a03] stroke-none ml-1" />
              )}
            </button>

            {/* Right: Dismiss / Reset Button */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                LiveWidgetsWorkflowEngine.getInstance().resetBreathingSession();
              }}
              className="w-11 h-11 rounded-full bg-[#2a2119]/80 text-[#d8b88c] border border-white/5 flex items-center justify-center hover:bg-[#382b20] active:scale-95 transition-all shadow-md"
              title="Reset Target Reading"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>


        {/* =========================================================================
            2. NIGHT 18 C° / FULL MOON HORIZON WIDGET (Real Lunar & Night Mode Scene)
        ========================================================================= */}
        <div 
          onClick={() => {
            LiveWidgetsWorkflowEngine.getInstance().toggleNightModeScene();
          }}
          className={`w-[275px] h-[290px] shrink-0 snap-start bg-[#050505] text-white rounded-[28px] p-5 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border-[2.5px] border-white/95 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer ${liveWorkflow.isNightModeActive ? 'ring-2 ring-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between z-10">
            <div>
              <h2 className="text-[26px] font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
                Night
                {liveWorkflow.isNightModeActive && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping inline-block ml-1" />
                )}
              </h2>
              <p className="text-[13px] text-neutral-400 font-normal mt-1.5">
                {liveWorkflow.moonPhaseName}
              </p>
            </div>
            {/* Real Temp & Unit Switcher */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                LiveWidgetsWorkflowEngine.getInstance().toggleNightTempUnit();
              }}
              className="text-[22px] font-medium text-white font-sans tracking-tight hover:text-indigo-200 active:scale-95 transition-transform"
              title="Click to Switch C° / F°"
            >
              {liveWorkflow.nightTemp} {liveWorkflow.nightTempUnit}°
            </button>
          </div>

          {/* Celestial Arc with Glowing Real Lunar Phase Moon */}
          <div className="relative w-full h-[155px] flex items-end pb-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 235 145">
              <defs>
                <linearGradient id="nightArcGrad" x1="0%" y1="100%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
                </linearGradient>
                <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Celestial Horizon Orbit Arc */}
              <path
                d="M 12 138 Q 140 18 226 138"
                fill="none"
                stroke="url(#nightArcGrad)"
                strokeWidth="15"
                strokeLinecap="round"
              />

              {/* Glowing Real Lunar Moon Orb */}
              <circle
                cx="145"
                cy="62"
                r="15"
                fill="#ffffff"
                filter="url(#moonGlow)"
                className="drop-shadow-[0_0_18px_rgba(255,255,255,0.95)]"
              />
            </svg>
          </div>

          {/* Real scene status indicator */}
          <div className="z-10 flex items-center justify-between text-[9px] font-mono text-neutral-400 pt-0.5 border-t border-white/10">
            <span>{liveWorkflow.moonIllumination}% ILLUMINATION</span>
            <span className={liveWorkflow.isNightModeActive ? "text-indigo-300 font-bold" : "text-neutral-500"}>
              {liveWorkflow.isNightModeActive ? "EYE COMFORT ON" : "TAP FOR NIGHT MODE"}
            </span>
          </div>
        </div>


        {/* =========================================================================
            3. 600m SESAME ST NAVIGATION HUD (Turn-by-Turn Voice & Driving Shield)
        ========================================================================= */}
        <div 
          onClick={() => {
            LiveWidgetsWorkflowEngine.getInstance().startNavigationTracking();
          }}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#08080a] text-white rounded-[28px] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-white/10 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer"
        >
          {/* Top Header: Turn Arrow + Dynamic Meters + Dual Speed Badges */}
          <div className="flex items-start justify-between z-10">
            <div className="flex items-start gap-3">
              {/* Curved Right Turn Arrow */}
              <svg className="w-8 h-8 text-white mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19v-7a6 6 0 0 1 6-6h9" />
                <path d="m14 2 5 4-5 4" fill="currentColor" stroke="none" />
              </svg>
              <div>
                <div className="text-[26px] font-bold text-white tracking-tight leading-none">
                  {liveWorkflow.navDistanceMeters} m
                </div>
                <div className="text-[14px] text-neutral-400 font-medium mt-1">
                  {liveWorkflow.navStreet}
                </div>
              </div>
            </div>

            {/* Dual Stacked Speed Limit Badges */}
            <div className="flex flex-col items-center">
              {/* Red Alert Speed Pill */}
              <div 
                className={`w-8 h-8 rounded-full bg-[#ef4444] text-white text-sm font-bold flex items-center justify-center shadow-[0_0_14px_rgba(239,68,68,0.85)] z-10 border border-red-400/40 ${liveWorkflow.navCurrentSpeed > liveWorkflow.navSpeedLimit ? 'animate-pulse' : ''}`}
                title={`Current Speed: ${liveWorkflow.navCurrentSpeed} km/h`}
              >
                {liveWorkflow.navCurrentSpeed}
              </div>
              {/* White Speed Limit Pill (Clickable to change speed limit) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  LiveWidgetsWorkflowEngine.getInstance().toggleSpeedLimit();
                }}
                className="w-8 h-8 rounded-full bg-white text-black text-sm font-bold flex items-center justify-center shadow-md -mt-1 border border-neutral-300 hover:bg-neutral-100 active:scale-95 transition-transform"
                title="Click to Change Speed Limit"
              >
                {liveWorkflow.navSpeedLimit}
              </button>
            </div>
          </div>

          {/* 3D Perspective Road with Glowing Cyan Center Track & Delta Navigator */}
          <div className="relative w-full h-[160px] flex items-end justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 240 160">
              <defs>
                <linearGradient id="roadCyanLine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00a6ff" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#00a6ff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                </linearGradient>
                <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="deltaGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Road Perspective Outer Border Lines */}
              <line x1="90" y1="40" x2="20" y2="160" stroke="#334155" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="150" y1="40" x2="220" y2="160" stroke="#334155" strokeWidth="2" strokeOpacity="0.6" />

              {/* Road Dashed Perspective Lane Lines */}
              <line x1="105" y1="40" x2="65" y2="160" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6 8" />
              <line x1="135" y1="40" x2="175" y2="160" stroke="#475569" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6 8" />

              {/* Glowing Neon Cyan Navigation Center Track */}
              <line 
                x1="120" y1="45" x2="120" y2="135" 
                stroke="url(#roadCyanLine)" 
                strokeWidth="5" 
                strokeLinecap="round"
                filter="url(#cyanGlow)" 
                className="animate-pulse"
              />

              {/* Glowing Delta Arrowhead Navigator Marker */}
              <path
                d="M 120 118 L 138 144 Q 120 138 120 138 Q 120 138 102 144 Z"
                fill="#ffffff"
                filter="url(#deltaGlow)"
                className="drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]"
              />
            </svg>
          </div>

          {/* Bottom GPS Voice status */}
          <div className="z-10 flex items-center justify-between text-[9px] font-mono text-cyan-300/80 pt-0.5">
            <span>DRIVING SHIELD ACTIVE</span>
            <span className="font-bold text-white">TAP FOR VOICE PROMPT</span>
          </div>
        </div>


        {/* =========================================================================
            4. 22:00 TIME TO SLEEP? BEDTIME WIDGET (Real Bedtime, Alarms & DND Automation)
        ========================================================================= */}
        <div 
          onClick={() => {
            onNavigateSubScreen('unified_app_hub');
          }}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-b from-[#120525] via-[#0d031c] to-[#070211] text-white rounded-[28px] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-purple-500/30 flex flex-col justify-between transition-all select-none relative overflow-hidden group shadow-[inset_0_0_24px_rgba(147,51,234,0.2)] cursor-pointer"
        >
          {/* Ambient Purple Atmospheric Glow */}
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-purple-600/30 blur-3xl pointer-events-none" />

          {/* Center Content: 3D Purple Crescent Moon + 22:00 TIME TO SLEEP? */}
          <div className="flex items-center gap-3 my-auto pt-2 z-10">
            {/* 3D Glowing Purple Crescent Moon */}
            <div className="relative shrink-0">
              <svg className="w-[88px] h-[88px] overflow-visible" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="crescentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d8b4fe" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7e22ce" />
                  </linearGradient>
                  <filter id="moonPurpleGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ambient Halo Behind Moon */}
                <circle cx="45" cy="50" r="34" fill="#9333ea" opacity="0.3" filter="url(#moonPurpleGlow)" />

                {/* Crescent Path */}
                <path
                  d="M 68 18 C 36 24 24 52 38 82 C 18 64 22 34 68 18 Z"
                  fill="url(#crescentGrad)"
                  filter="drop-shadow(0 0 12px rgba(168,85,247,0.7))"
                />
              </svg>
            </div>

            {/* Right: Time & Question */}
            <div className="flex-1">
              <div className="text-[34px] font-extrabold text-[#e9d5ff] tracking-tight leading-none">
                {liveWorkflow.bedtimeStr}
              </div>
              <div className="text-[13px] font-extrabold tracking-wide text-[#d8b4fe] leading-tight mt-1.5 uppercase">
                TIME TO<br />SLEEP?
              </div>
              {liveWorkflow.sleepNotification && (
                <span className="text-[10px] text-purple-300 font-mono block mt-1 animate-pulse">
                  {liveWorkflow.sleepNotification}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Action Pill Buttons: Real Automation Triggers */}
          <div className="flex items-center gap-2.5 z-10 pb-0.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                LiveWidgetsWorkflowEngine.getInstance().triggerSleepAutomation();
              }}
              className="flex-1 py-2.5 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-[13px] text-center shadow-[0_4px_16px_rgba(124,58,237,0.4)] active:scale-95 transition-all"
            >
              sleep
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                LiveWidgetsWorkflowEngine.getInstance().snoozeSleepReminder(15);
              }}
              className="flex-1 py-2.5 rounded-2xl bg-[#23103d]/80 border border-purple-800/50 hover:bg-[#2d154f] text-purple-200 font-medium text-[13px] text-center active:scale-95 transition-all"
            >
              no, go away
            </button>
          </div>
        </div>


        {/* =========================================================================
            5. SUMMER 38° RADIAL HEATWAVE GAUGE (Real Thermostat & Turbo AC Protocol)
        ========================================================================= */}
        <div 
          onClick={() => {
            LiveWidgetsWorkflowEngine.getInstance().activateHeatwaveCoolingProtocol();
          }}
          className={`w-[275px] h-[290px] shrink-0 snap-start bg-[#050505] text-white rounded-[28px] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.65)] border border-orange-500/20 flex flex-col justify-between transition-all select-none relative overflow-hidden group cursor-pointer ${liveWorkflow.isAcTurboActive ? 'ring-2 ring-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]' : ''}`}
        >
          {/* Bottom Fiery Heatwave Ambient Gradient Flare */}
          <div className="absolute inset-x-0 bottom-0 h-[105px] bg-gradient-to-t from-[#ea580c] via-[#f97316]/50 to-transparent pointer-events-none opacity-90 blur-[2px]" />

          {/* Top Label: "Summer" in Futuristic Square Font */}
          <div className="text-center z-10 pt-1">
            <span className="text-white font-mono tracking-[0.2em] text-[15px] font-bold">
              Summer
            </span>
          </div>

          {/* Center: Radial Dial + Dynamic Needle + Big Metallic 38° */}
          <div className="relative flex flex-col items-center justify-center my-auto z-10">
            <svg className="w-[220px] h-[140px] overflow-visible" viewBox="0 0 220 140">
              <defs>
                <linearGradient id="metallicText" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>

              {/* Radial Dial Fine Tick Marks */}
              {Array.from({ length: 41 }).map((_, i) => {
                const angle = -140 + i * (190 / 40);
                const rad = (angle * Math.PI) / 180;
                const cx = 110;
                const cy = 110;
                const r1 = 82;
                const r2 = i % 5 === 0 ? 72 : 76;
                const x1 = cx + r1 * Math.cos(rad);
                const y1 = cy + r1 * Math.sin(rad);
                const x2 = cx + r2 * Math.cos(rad);
                const y2 = cy + r2 * Math.sin(rad);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ffffff"
                    strokeWidth={i % 5 === 0 ? 1.5 : 0.75}
                    strokeOpacity={i % 5 === 0 ? 0.8 : 0.35}
                  />
                );
              })}

              {/* Dynamic Precision Needle Pointing Exactly to Temperature Angle */}
              {(() => {
                const needleAngle = -140 + Math.min(190, Math.max(0, ((liveWorkflow.summerTemp - 15) / 35) * 190));
                const rad = (needleAngle * Math.PI) / 180;
                const cx = 110;
                const cy = 110;
                const nx = cx + 72 * Math.cos(rad);
                const ny = cy + 72 * Math.sin(rad);
                return (
                  <line
                    x1="110"
                    y1="110"
                    x2={nx}
                    y2={ny}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] transition-all duration-300"
                  />
                );
              })()}
            </svg>

            {/* Massive Temperature Number Centered (Clickable to adjust temp) */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const nextTemp = liveWorkflow.summerTemp === 38 ? 40 : liveWorkflow.summerTemp === 40 ? 42 : 38;
                LiveWidgetsWorkflowEngine.getInstance().setSummerTemperature(nextTemp);
              }}
              className="absolute inset-0 flex items-center justify-center pt-5 hover:scale-105 active:scale-95 transition-transform"
              title="Click to Test Heat Index"
            >
              <span className="text-[72px] font-black tracking-tight text-white leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                {liveWorkflow.summerTemp}°
              </span>
            </button>
          </div>

          {/* Bottom Heat Gauge Bar & Turbo AC Status */}
          <div className="z-10 flex items-center justify-between text-[9px] font-mono text-amber-200/80 px-2 pb-0.5">
            <span>{liveWorkflow.heatIndexText}</span>
            <span className={liveWorkflow.isAcTurboActive ? "text-cyan-300 font-bold animate-pulse" : "font-bold text-white"}>
              {liveWorkflow.isAcTurboActive ? "AC TURBO 20°C ON ❄️" : "TAP TO COOL DOWN"}
            </span>
          </div>
        </div>


        {/* =========================================================================
            6. WATCHLIST / FINANCE WIDGET (Exact match to screenshot)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('neural_trading_matrix')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-white text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-100/90 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Watchlist
            </h3>
            <button 
              onClick={handleRefreshTrading}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors active:rotate-180"
              title="Refresh Watchlist"
            >
              <RotateCw className={`w-4 h-4 stroke-[2.2] ${isRefreshingTrading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Hero Stock: e.g. Dow Jones / NIFTY 50 */}
          <div className="mt-2.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold font-sans tracking-tight text-slate-900 leading-none">
                  {tradingData.symbol === 'NIFTY 50' ? '24,850.75' : '52,766.88'}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                  <span>{tradingData.symbol === 'NIFTY 50' ? 'NIFTY 50' : 'Dow Jones'}</span>
                  <span className={`font-semibold ${isTradePositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isTradePositive ? `+${changePct}%` : `-${Math.abs(Number(changePct))}%`}
                  </span>
                </div>
              </div>

              {/* Red/Green Circle Arrow Badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${
                isTradePositive ? 'bg-emerald-600' : 'bg-[#b81d1d]'
              }`}>
                {isTradePositive ? (
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span className="text-base font-bold leading-none">↓</span>
                )}
              </div>
            </div>

            {/* Dashed Guideline & Sparkline Area Chart */}
            <div className="mt-2 relative w-full h-[52px]">
              <div className="absolute top-0 left-0 right-0 border-t border-dashed border-slate-300" />
              <svg width="100%" height="50" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="overflow-visible">
                <defs>
                  <linearGradient id="widgetSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isTradePositive ? '#10b981' : '#dc2626'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={isTradePositive ? '#10b981' : '#dc2626'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon points={areaCoords} fill="url(#widgetSparkGrad)" />
                <polyline 
                  fill="none" 
                  stroke={isTradePositive ? '#10b981' : '#b81d1d'} 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  points={polylineCoords} 
                />
              </svg>
            </div>
          </div>

          {/* Sub Items Capsules (Matching Screenshot: S&P 500 & Nasdaq) */}
          <div className="mt-3 space-y-2">
            {/* S&P 500 */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  7,631<span className="text-slate-500 font-normal">.47</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  S&P 500 <span className="text-rose-600 font-semibold">-0.71%</span>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#b81d1d] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ↓
              </div>
            </div>

            {/* Nasdaq / BankNifty */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  26,099<span className="text-slate-500 font-normal">.77</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Nasdaq <span className="text-emerald-600 font-semibold">+0.38%</span>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ↑
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            2. SCHEDULE / CALENDAR WIDGET (Exact match to screenshot)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('unified_app_hub')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-white text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-100/90 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Top Header: "2 Wed" & Blue Plus Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {dayOfMonth} {weekdayShort}
            </h3>
            <div className="w-7 h-7 rounded-full bg-[#1a73e8] flex items-center justify-center text-white shadow-sm hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4 stroke-[2.8]" />
            </div>
          </div>

          {/* Grey Rounded Capsule: Today's Status */}
          <div className="mt-3 p-3 rounded-2xl bg-[#eef1f6] border border-slate-200/60">
            {calendarEvents.length > 0 ? (
              <div>
                <div className="text-xs font-bold text-[#1a5fb4] leading-tight truncate">
                  {calendarEvents[0].title}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{calendarEvents[0].time}</span>
                  <span className="text-[#1a5fb4] font-medium font-mono">Today</span>
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium text-[#2d5b99] leading-tight">
                Nothing<br />scheduled
              </div>
            )}
          </div>

          {/* Upcoming Section Header & Teal Pills (Matching Screenshot) */}
          <div className="mt-3 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-600">
              Upcoming Events
            </div>
            
            {/* Teal pills */}
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 rounded-full bg-[#008779] text-white text-xs font-medium truncate shadow-sm">
                Janmashtami
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#008779] text-white text-xs font-medium truncate shadow-sm">
                Janmashtami (Smarta)
              </div>
            </div>
          </div>

          {/* Bottom Alarm footnote */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Bell className="w-3 h-3 text-[#1a73e8]" />
              <span>{alarms.length > 0 ? `${alarms.length} Alarms active` : 'Hub calendar sync'}</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>


        {/* =========================================================================
            3. DATA & SYSTEM TELEMETRY WIDGET (Matching Screenshot "500 MB Remaining")
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('deep_automation_matrix')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#121214] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-white/10 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {now.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-mono">
                {telemetry.storageTotalGb ? `${(telemetry.storageTotalGb - telemetry.storageUsedGb).toFixed(1)} GB` : '48 GB'}
              </span>
              <RotateCw className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
            </div>
          </div>

          <div className="text-right text-[10px] font-medium text-slate-400 -mt-1">
            Storage Remaining
          </div>

          {/* Middle: Neural Core & RAM Indicators */}
          <div className="my-2.5 p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold font-mono text-white">
                  Neural Core
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-300/80">
                Active 4.2 GHz
              </span>
            </div>

            {/* Neural Load Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse" 
                style={{ width: `68%` }} 
              />
            </div>
          </div>

          {/* Bottom Telemetry Metrics */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>RAM: {telemetry.ramUsedGb || 4.8}GB / {telemetry.ramTotalGb || 8}GB</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            4. UNIFIED SEARCH & APP HUB LAUNCHER WIDGET (Matching Screenshot Search Card)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('ai_toolkit_scanner')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#f0f3f8] text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-200/80 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Rounded Search Bar with Mic Icon */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search apps or tools</span>
            </div>
            <Mic className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Bottom Two Pill Cards: Top Apps & Top Games / AI Tools */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-700 block">Top Apps</span>
              <div className="grid grid-cols-2 gap-1 w-6 h-6 text-emerald-500">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-700 block">AI Toolkit</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                ⚡
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>Vision & OCR Scanner</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>


        {/* =========================================================================
            5. ACTIVE PERSONA & VOICE STUDIO WIDGET (MAYRA vs STONICX)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('persona_voice_studio')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-br from-[#1d0b38] via-[#130728] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-purple-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center shadow-inner">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  {isStonicx ? 'STONICX AI' : 'MAYRA AI'}
                </h4>
                <p className="text-[9px] font-mono text-purple-300/70">
                  {isStonicx ? 'Male Iron Core' : 'Female Neural Soul'}
                </p>
              </div>
            </div>

            <div className="px-2 py-0.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-[9px] font-mono font-bold text-purple-200">
              {isStonicx ? 'STONICX' : 'MAYRA'}
            </div>
          </div>

          {/* Middle Body */}
          <div className="my-2.5 p-2 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-purple-200/80">Voice Engine</span>
              <span className="font-bold text-white font-mono">{assistantConfig.voiceProfile || 'Neerja Neural'}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-purple-300/70 font-mono">
              <span>Speed {assistantConfig.speechRate || 1.0}x</span>
              <span>Pitch {assistantConfig.speechPitch || 1.0}x</span>
              <span className="text-emerald-400">Low-Latency</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300/80">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-purple-300" />
              <span>Persona & Voice Studio</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            6. OFFLINE ON-DEVICE AI MODELS WIDGET
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('offline_models')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-br from-[#170a33] via-[#100524] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-cyan-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shadow-inner">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Offline Edge AI
                </h4>
                <p className="text-[9px] font-mono text-cyan-300/70">
                  On-Device Neural Engine
                </p>
              </div>
            </div>

            <div className="px-2 py-0.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold">
              {offlineModels.ready > 0 ? `${offlineModels.ready} READY` : 'HYBRID'}
            </div>
          </div>

          {/* Middle Body */}
          <div className="my-2.5 p-2 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-purple-200">Catalog Capacity</span>
              <span className="text-[9px] font-mono text-white font-bold">{offlineModels.total} Models Loaded</span>
            </div>
            <p className="text-[9px] text-purple-300/60 font-sans line-clamp-1">
              LFM 2.5 230M, Piper TTS & Whisper STT
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-cyan-300/80">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-300" />
              <span>Offline Edge Intelligence</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            7. PRIVACY & TOUCH SECURITY VAULT WIDGET
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen(touchSecurity.isArmed ? 'touch_security_vault' : 'permissions')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-br from-[#1a0930] via-[#120422] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-emerald-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Privacy & Security
                </h4>
                <p className="text-[9px] font-mono text-emerald-300/70">
                  {grantedPermsCount}/{totalPermsCount} Permissions Active
                </p>
              </div>
            </div>

            <div className="px-2 py-0.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
              {appLockConfig?.isEnabled ? 'LOCKED' : 'SECURE'}
            </div>
          </div>

          {/* Middle Body */}
          <div className="my-2.5 p-2 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-purple-200">Touch Guard Vault</span>
              <span className={`text-[9px] font-mono font-bold ${touchSecurity.isArmed ? 'text-rose-400' : 'text-emerald-400'}`}>
                {touchSecurity.isArmed ? 'ARMED' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[9px] text-purple-300/60 font-sans line-clamp-1">
              Zero telemetry leaks & encrypted memories
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300/80">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-300" />
              <span>Biometric Vault Active</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            8. LIVE MEDIA & MUSIC PLAYER WIDGET (Spotify & YouTube Music)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('smart_lifestyle_iot')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-[#121214] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-emerald-500/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shadow-inner">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Now Playing
                </h4>
                <p className="text-[9px] font-mono text-emerald-400/80 uppercase">
                  {mediaState.platform || 'Spotify'} • 320kbps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-full bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-75" />
                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse delay-150" />
              </span>
              <span>LIVE</span>
            </div>
          </div>

          {/* Middle Body: Track Info & Playback Bar */}
          <div className="my-2 p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-slate-800 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow">
                <Radio className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white leading-tight truncate">
                  {mediaState.title || 'Kesariya - Brahmāstra'}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {mediaState.artist || 'Arijit Singh, Pritam'}
                </div>
              </div>
            </div>

            {/* Progress Scrubber */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 w-1/2" />
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                <span>1:45</span>
                <span>3:28</span>
              </div>
            </div>

            {/* Interactive Player Controls */}
            <div className="flex items-center justify-center gap-4 pt-0.5">
              <button 
                onClick={handlePrevTrack}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={handleToggleMediaPlay}
                className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title={mediaState.isPlaying ? 'Pause' : 'Play'}
              >
                {mediaState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button 
                onClick={handleNextTrack}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300/90">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3 text-emerald-400" />
              <span>Smart Media & Audio Hub</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            9. WEATHER & ENVIRONMENTAL RADAR WIDGET (Google Weather / At a Glance)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('smart_lifestyle_iot')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-white text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-100/90 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                  New Delhi • IN
                </h3>
                <p className="text-[10px] text-slate-500">
                  Clear & Sunny
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold font-sans text-slate-900 leading-none">
                28°
              </div>
              <span className="text-[9px] font-mono text-slate-400">H: 33° L: 22°</span>
            </div>
          </div>

          {/* Middle Body */}
          <div className="space-y-2">
            {/* AQI Pill */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-emerald-50 border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>AQI 58 • Good Air Quality</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                CLEAN
              </span>
            </div>

            {/* 3-Hour Forecast Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                <div className="text-[9px] text-slate-400 font-medium">12 PM</div>
                <div className="text-sm">☀️</div>
                <div className="text-[10px] font-bold text-slate-800">28°</div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                <div className="text-[9px] text-slate-400 font-medium">3 PM</div>
                <div className="text-sm">🌤️</div>
                <div className="text-[10px] font-bold text-slate-800">32°</div>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                <div className="text-[9px] text-slate-400 font-medium">6 PM</div>
                <div className="text-sm">⛅</div>
                <div className="text-[10px] font-bold text-slate-800">29°</div>
              </div>
            </div>

            {/* Environmental Micro-Metrics */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
              <span>💧 Humidity: 48%</span>
              <span>💨 Wind: 12 km/h NW</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Compass className="w-3 h-3 text-amber-500" />
              <span>At A Glance • Realtime Radar</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>


        {/* =========================================================================
            10. EMERGENCY SOS & DRIVING SHIELD WIDGET (Road & Personal Safety)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('emergency_sos')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-br from-[#290915] via-[#1a050f] to-[#0c0208] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-rose-500/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-400/40 flex items-center justify-center shadow-inner">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Emergency & Safety
                </h4>
                <p className="text-[9px] font-mono text-rose-300/70">
                  Road Guardian Shield
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>SOS READY</span>
            </div>
          </div>

          {/* Middle Body */}
          <div className="my-2 p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-rose-200/90 flex items-center gap-1">
                <Car className="w-3 h-3 text-rose-400" />
                <span>Driving Shield</span>
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* 1-Tap Trigger Button */}
            <div className="p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-[11px] font-bold text-white">Emergency Dials</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-rose-200 bg-rose-500/30 px-1.5 py-0.5 rounded">
                112 / 108
              </span>
            </div>

            {/* Speed & Auto-Reply SMS */}
            <div className="flex items-center justify-between text-[9px] font-mono text-rose-200/70">
              <span>Auto-SMS on Call</span>
              <span className="text-white font-bold">{emergencyState.contactsCount || 3} Contacts Saved</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-rose-300/80">
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3 text-rose-400" />
              <span>Emergency & Driving Protocol</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-rose-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>


        {/* =========================================================================
            11. QUANTUM MEMORY & KNOWLEDGE VAULT WIDGET (Jarvis Memory Architecture)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('quantum_memory_vision')}
          className="w-[275px] h-[290px] shrink-0 snap-start bg-gradient-to-br from-[#1b0a33] via-[#110524] to-[#090216] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-purple-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center shadow-inner">
                <Brain className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Quantum Memory
                </h4>
                <p className="text-[9px] font-mono text-purple-300/70">
                  Semantic Knowledge Engine
                </p>
              </div>
            </div>

            <div className="px-2 py-0.5 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold">
              VAULT LIVE
            </div>
          </div>

          {/* Middle Body */}
          <div className="my-2 p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-purple-200">Semantic Index</span>
              <span className="text-[9px] font-mono text-white font-bold">{memoryState.factsCount || 128} Facts Stored</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-900/30 border border-purple-500/30">
              <div className="text-[8px] font-mono text-purple-300 uppercase">Latest Synthesized Memory</div>
              <p className="text-[10px] text-white/90 font-sans line-clamp-2 mt-0.5">
                "Prefers concise Hindi & English responses with dark obsidian mode."
              </p>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-purple-300/70">
              <span>{memoryState.scansCount || 3} Vision Scans Indexed</span>
              <span className="text-emerald-400">Vector Synced</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300/80">
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-300" />
              <span>Quantum Vector Memory Vault</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

      </div>
    </div>
  );
};
