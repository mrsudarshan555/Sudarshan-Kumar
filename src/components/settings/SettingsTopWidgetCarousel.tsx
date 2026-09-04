import React, { useState, useEffect } from 'react';
import { 
  RotateCw, Plus, TrendingDown, TrendingUp, Calendar, Clock, 
  Battery, BatteryCharging, HardDrive, Cpu, Mic, ShieldCheck, 
  Layers, Sparkles, ChevronRight, Zap, Search, Bell, Smartphone,
  CheckCircle2, Volume2, Shield
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

  // Real-time engine event listeners
  useEffect(() => {
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
    });

    return () => {
      unsubTrading();
      unsubHub();
      unsubMatrix();
      unsubTouch();
      unsubIot();
    };
  }, []);

  const handleRefreshTrading = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingTrading(true);
    NeuralTradingFinanceEngine.getInstance().autoDetectChartLevels(tradingData.symbol);
    setTimeout(() => setIsRefreshingTrading(false), 600);
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
          <span>Swipe horizontally</span>
          <span className="animate-pulse">→</span>
        </span>
      </div>

      {/* HORIZONTAL CAROUSEL ROW (Left-to-Right Swipe) */}
      <div className="w-full overflow-x-auto flex gap-3 pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scrollbar-none touch-pan-x scroll-smooth">

        {/* =========================================================================
            1. WATCHLIST / FINANCE WIDGET (Exact match to screenshot)
        ========================================================================= */}
        <div 
          onClick={() => onNavigateSubScreen('neural_trading_matrix')}
          className="w-[280px] shrink-0 snap-start bg-white text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-100/90 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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
          className="w-[260px] shrink-0 snap-start bg-white text-slate-900 rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-100/90 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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
          className="w-[260px] shrink-0 snap-start bg-[#121214] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-white/10 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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

          {/* Middle: Battery & RAM Indicators */}
          <div className="my-2.5 p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {telemetry.chargingStatus?.includes('Charging') ? (
                  <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Battery className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-bold font-mono text-white">
                  {telemetry.batteryLevel}%
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-300/80">
                {telemetry.chargingStatus || 'Battery Healthy'}
              </span>
            </div>

            {/* Battery Level Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" 
                style={{ width: `${Math.min(telemetry.batteryLevel || 82, 100)}%` }} 
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
          className="w-[260px] shrink-0 snap-start bg-[#f0f3f8] text-slate-900 rounded-[28px] p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-slate-200/80 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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
            <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-700 block">Top Apps</span>
              <div className="grid grid-cols-2 gap-1 w-6 h-6 text-emerald-500">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
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
          className="w-[260px] shrink-0 snap-start bg-gradient-to-br from-[#1d0b38] via-[#130728] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-purple-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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
          className="w-[260px] shrink-0 snap-start bg-gradient-to-br from-[#170a33] via-[#100524] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-cyan-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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
          className="w-[260px] shrink-0 snap-start bg-gradient-to-br from-[#1a0930] via-[#120422] to-[#0b031a] text-white rounded-[28px] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-emerald-400/30 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden select-none"
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

      </div>
    </div>
  );
};
