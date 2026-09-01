import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, Grid, ArrowLeft, Check, Sparkles, Sliders, Play, Smartphone, Volume2, ShieldCheck
} from 'lucide-react';
import { SystemAutomationEmergencyEngine, SystemUnlockConfig } from '../../services/automation/SystemAutomationEmergencyEngine';
import { Mouth } from '../../services/audio/mouth';

interface SystemUnlockAutomationViewProps {
  onBack: () => void;
}

export const SystemUnlockAutomationView: React.FC<SystemUnlockAutomationViewProps> = ({ onBack }) => {
  const engine = SystemAutomationEmergencyEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [config, setConfig] = useState<SystemUnlockConfig>(engine.getUnlockConfig());
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setConfig(engine.getUnlockConfig());
    });
    return unsub;
  }, [engine]);

  const handleUpdate = (patch: Partial<SystemUnlockConfig>) => {
    engine.updateUnlockConfig(patch);
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const handleSimulateUnlock = async () => {
    setIsSimulating(true);
    setSimulationLog('1. Voice Command Verified: "STONICX Phone Unlock Karo"');
    await mouth.speak('Unlocking device screen now.', { persona: 'STONICX' });

    setTimeout(() => {
      setSimulationLog('2. Executing calibrated swipe-up gesture...');
      setTimeout(() => {
        if (config.unlockType === 'pin') {
          setSimulationLog(`3. Automated Accessibility Key Injection: Typing PIN [${config.pinCode}]...`);
        } else if (config.unlockType === 'pattern') {
          setSimulationLog(`3. Gesture Path Automation: Drawing pattern nodes [${config.patternNodes.join(' -> ')}]...`);
        } else {
          setSimulationLog('3. Executing direct swipe gesture...');
        }

        setTimeout(() => {
          setSimulationLog('✅ Phone Unlocked Successfully (Screen Dispatched)');
          setIsSimulating(false);
        }, 1200);
      }, 1000);
    }, 1000);
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
            <div className="p-1.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white rounded-lg shadow-md">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                System Unlock Automation
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">Features 56-61: Voice Lock, PIN & Pattern Automation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* Unlock Method Selector */}
        <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> 1. Screen Unlock Mechanism
            </span>
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Accessibility Engine
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pin', name: 'PIN Code', icon: KeyRound },
              { id: 'pattern', name: 'Pattern Lock', icon: Grid },
              { id: 'swipe', name: 'Swipe Only', icon: Smartphone }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleUpdate({ unlockType: m.id as any })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  config.unlockType === m.id
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-md'
                    : 'bg-[#070913] border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <m.icon className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-[11px]">{m.name}</span>
              </button>
            ))}
          </div>

          {/* If PIN Selected */}
          {config.unlockType === 'pin' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-slate-400 font-mono">4-6 Digit Security PIN:</label>
              <input
                type="password"
                maxLength={6}
                value={config.pinCode}
                onChange={(e) => handleUpdate({ pinCode: e.target.value })}
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs tracking-widest outline-none focus:border-cyan-500"
                placeholder="Enter PIN"
              />
            </div>
          )}

          {/* If Pattern Selected */}
          {config.unlockType === 'pattern' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-slate-400 font-mono">Pattern Node Sequence (0-8 Matrix):</label>
              <div className="p-3 bg-[#070913] rounded-xl border border-white/10 flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">
                  {config.patternNodes.join(' ➔ ')}
                </span>
                <span className="text-[10px] text-slate-400">Calibrated Path</span>
              </div>
            </div>
          )}
        </div>

        {/* Calibration Tuning (Features 60 & 61) */}
        <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <span className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> 2. Gesture & Coordinate Calibration
          </span>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-mono">Swipe-Up Distance Profile:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['short', 'standard', 'long'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => handleUpdate({ swipeDistance: d })}
                  className={`py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-all ${
                    config.swipeDistance === d
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-[#070913] text-slate-400 border-white/10'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulation Test */}
        <div className="p-4 bg-[#0C1021] border border-indigo-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 3. Live Voice Unlock Simulator
            </span>
            <button
              onClick={handleSimulateUnlock}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Play className="w-3.5 h-3.5" /> {isSimulating ? 'Simulating...' : 'Test Unlock Sequence'}
            </button>
          </div>

          {simulationLog && (
            <div className="p-3 bg-[#070913] border border-white/10 rounded-xl font-mono text-[11px] text-cyan-300">
              {simulationLog}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
