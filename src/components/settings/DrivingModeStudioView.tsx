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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg shadow-md text-white ${config.isEnabled ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Driving Mode Studio
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">Features 81-86: Auto Reject Call, SMS & Caller Announcer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* Driving Mode Master Toggle Card */}
        <div className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all ${
          config.isEnabled
            ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
            : 'bg-[#0C1021] border-white/10'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
            config.isEnabled ? 'bg-amber-600/20 border-amber-400 text-amber-400' : 'bg-white/5 border-white/20 text-slate-400'
          }`}>
            <Car className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-mono font-bold text-sm text-white uppercase">
              {config.isEnabled ? 'DRIVING MODE ACTIVE' : 'DRIVING MODE OFF'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Say <span className="text-amber-400 font-mono">"STONICX Driving Mode On Karo"</span> to activate hands-free protection.
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <button
              onClick={handleToggleMode}
              className={`flex-1 py-3 rounded-xl font-bold font-mono text-xs transition-all shadow-md ${
                config.isEnabled ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {config.isEnabled ? 'DEACTIVATE DRIVING MODE' : '🚗 ACTIVATE DRIVING MODE'}
            </button>
            <button
              onClick={handleSimulateIncomingCall}
              disabled={testSimulating}
              className="px-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold"
              title="Test Call Rejection"
            >
              TEST
            </button>
          </div>
        </div>

        {testLog && (
          <div className="p-3 bg-[#0C1021] border border-amber-500/30 rounded-xl font-mono text-[11px] text-amber-300">
            {testLog}
          </div>
        )}

        {/* Driving Protocols Configuration */}
        <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <PhoneOff className="w-3.5 h-3.5" /> Call Rejection & SMS Template
          </span>

          {/* Caller Announcement */}
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-cyan-400" /> Caller Name Announcement
              </div>
              <p className="text-[9px] text-slate-400">Speaks out loud who is calling over speakers while ringing.</p>
            </div>
            <button
              onClick={() => handleUpdate({ announceCallerName: !config.announceCallerName })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.announceCallerName ? 'bg-cyan-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                config.announceCallerName ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Auto Reject Calls */}
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <PhoneOff className="w-3 h-3 text-rose-400" /> Auto-Reject Incoming Calls
              </div>
              <p className="text-[9px] text-slate-400">Silently declines incoming calls to keep your focus on the road.</p>
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
            <label className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-amber-400" /> Auto-Reply SMS Template:
            </label>
            <textarea
              rows={2}
              value={config.smsTemplate}
              onChange={(e) => handleUpdate({ smsTemplate: e.target.value })}
              className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-white font-sans text-xs outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
