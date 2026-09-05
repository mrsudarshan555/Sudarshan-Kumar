import React, { useState, useEffect } from 'react';
import { 
  Car, PhoneOff, MessageSquare, Volume2, ArrowLeft, Check, Sparkles, Sliders, Shield, Bell, PhoneForwarded
} from 'lucide-react';
import { SystemAutomationEmergencyEngine, DrivingModeConfig } from '../../services/automation/SystemAutomationEmergencyEngine';
import { Mouth } from '../../services/audio/mouth';

interface DrivingModeStudioViewProps {
  onBack: () => void;
}

export const DrivingModeStudioView: React.FC<DrivingModeStudioViewProps> = ({ onBack }) => {
  const engine = SystemAutomationEmergencyEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [config, setConfig] = useState<DrivingModeConfig>(engine.getDrivingConfig());
  const [testSimulating, setTestSimulating] = useState<boolean>(false);
  const [testLog, setTestLog] = useState<string | null>(null);

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setConfig({ ...engine.getDrivingConfig() });
    });
    return unsub;
  }, [engine]);

  const handleToggleMode = () => {
    const newState = engine.toggleDrivingMode();
    setConfig(prev => ({ ...prev, isEnabled: newState }));
    if (newState) {
      mouth.speak('Driving Mode activated. Calls will be managed automatically.', { persona: 'STONICX' });
    } else {
      mouth.speak('Driving Mode deactivated.', { persona: 'STONICX' });
    }
  };

  const handleUpdate = (patch: Partial<DrivingModeConfig>) => {
    engine.updateDrivingConfig(patch);
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const handleSimulateIncomingCall = async () => {
    setTestSimulating(true);
    setTestLog('1. Incoming Call Detected from: "Boss (Work)"');
    
    if (config.announceCallerName) {
      await mouth.speak('Call from Boss. Auto-rejecting and sending driving SMS.', { persona: 'STONICX' });
    }

    setTimeout(() => {
      setTestLog(`2. Call Automatically Rejected ➔ Dispatched SMS: "${config.smsTemplate}"`);
      setTimeout(() => {
        setTestLog('✅ Driving Protocol Successfully Executed');
        setTestSimulating(false);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-200">
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full shadow-md text-white border ${
              config.isEnabled ? 'bg-amber-600 border-amber-400/50' : 'bg-purple-600 border-purple-400/50'
            }`}>
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                  Driving Mode Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-sans font-bold">
                  SIMULATION DEMO
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 font-sans">Features 81-86: Auto Reject Call, SMS & Caller Announcer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-amber-950/30 backdrop-blur-xl border-b border-amber-500/20 text-[10px] text-amber-200/90 font-sans">
        ℹ️ Note: Browser environment cannot intercept incoming GSM cellular calls directly. In native Android APK, this connects to Android InCallService Telecom API.
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* Driving Mode Master Toggle Card - Magnifying Glass */}
        <div className={`p-5 rounded-3xl border text-center flex flex-col items-center gap-3 transition-all backdrop-blur-2xl ${
          config.isEnabled
            ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_8px_32px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            : 'bg-black/35 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-xl ${
            config.isEnabled ? 'bg-amber-600/30 border-amber-400 text-amber-400' : 'bg-white/10 border-white/20 text-purple-200'
          }`}>
            <Car className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase">
              {config.isEnabled ? 'DRIVING MODE ACTIVE' : 'DRIVING MODE OFF'}
            </h3>
            <p className="text-[11px] text-purple-200/70 mt-0.5 font-sans">
              Say <span className="text-amber-300 font-bold">"STONICX Driving Mode On Karo"</span> to activate hands-free protection.
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <button
              onClick={handleToggleMode}
              className={`flex-1 py-3 rounded-2xl font-bold font-sans text-xs transition-all shadow-md cursor-pointer ${
                config.isEnabled ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white'
              }`}
            >
              {config.isEnabled ? 'DEACTIVATE DRIVING MODE' : '🚗 ACTIVATE DRIVING MODE'}
            </button>
            <button
              onClick={handleSimulateIncomingCall}
              disabled={testSimulating}
              className="px-4 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white font-sans text-xs font-bold border border-white/15 backdrop-blur-xl cursor-pointer"
              title="Test Call Rejection"
            >
              TEST
            </button>
          </div>
        </div>

        {testLog && (
          <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-amber-500/40 rounded-2xl font-sans text-[11px] text-amber-300 shadow-md">
            {testLog}
          </div>
        )}

        {/* Driving Protocols Configuration - Magnifying Glass */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <span className="text-[11px] font-sans font-bold text-amber-300 uppercase flex items-center gap-1.5">
            <PhoneOff className="w-3.5 h-3.5 text-amber-400" /> Call Rejection & SMS Template
          </span>

          {/* Caller Announcement */}
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Caller Name Announcement
              </div>
              <p className="text-[9px] text-purple-200/60">Speaks out loud who is calling over speakers while ringing.</p>
            </div>
            <button
              onClick={() => handleUpdate({ announceCallerName: !config.announceCallerName })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.announceCallerName ? 'bg-purple-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                config.announceCallerName ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Auto Reject Calls */}
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <PhoneOff className="w-3.5 h-3.5 text-rose-400" /> Auto-Reject Incoming Calls
              </div>
              <p className="text-[9px] text-purple-200/60">Silently declines incoming calls to keep your focus on the road.</p>
            </div>
            <button
              onClick={() => handleUpdate({ autoRejectCall: !config.autoRejectCall })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.autoRejectCall ? 'bg-rose-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                config.autoRejectCall ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>

          {/* SMS Template Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] text-purple-300/70 font-sans flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-amber-400" /> Auto-Reply SMS Template:
            </label>
            <textarea
              rows={2}
              value={config.smsTemplate}
              onChange={(e) => handleUpdate({ smsTemplate: e.target.value })}
              className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 text-white font-sans text-xs outline-none focus:border-purple-400/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
