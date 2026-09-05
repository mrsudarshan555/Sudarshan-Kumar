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
            <div className="p-1.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white rounded-xl shadow-md border border-white/15">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                  System Unlock Automation
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-sans font-bold">
                  SIMULATION DEMO
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 font-sans">Features 56-61: Voice Lock, PIN & Pattern Automation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/20 text-[10px] text-amber-200/90 font-sans backdrop-blur-xl">
        ℹ️ Note: Web browser security prevents directly unlocking the physical OS lockscreen. In native APK build, this pairs with Android Accessibility Service.
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* Unlock Method Selector */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> 1. Screen Unlock Mechanism
            </span>
            <span className="text-[9px] font-sans text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Accessibility Engine
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'pin', name: 'PIN Code', icon: KeyRound },
              { id: 'pattern', name: 'Pattern Lock', icon: Grid },
              { id: 'swipe', name: 'Swipe Only', icon: Smartphone }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleUpdate({ unlockType: m.id as any })}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all backdrop-blur-xl cursor-pointer ${
                  config.unlockType === m.id
                    ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-black/30 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <m.icon className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-[11px] font-sans">{m.name}</span>
              </button>
            ))}
          </div>

          {/* If PIN Selected */}
          {config.unlockType === 'pin' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-purple-200/70 font-sans">4-6 Digit Security PIN:</label>
              <input
                type="password"
                maxLength={6}
                value={config.pinCode}
                onChange={(e) => handleUpdate({ pinCode: e.target.value })}
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 text-white font-mono text-xs tracking-widest outline-none focus:border-cyan-500 transition-all"
                placeholder="Enter PIN"
              />
            </div>
          )}

          {/* If Pattern Selected */}
          {config.unlockType === 'pattern' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-purple-200/70 font-sans">Pattern Node Sequence (0-8 Matrix):</label>
              <div className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">
                  {config.patternNodes.join(' ➔ ')}
                </span>
                <span className="text-[10px] text-purple-300/60 font-sans">Calibrated Path</span>
              </div>
            </div>
          )}
        </div>

        {/* Calibration Tuning (Features 60 & 61) */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <span className="text-[11px] font-sans font-bold text-white uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" /> 2. Gesture & Coordinate Calibration
          </span>

          <div className="space-y-2">
            <label className="text-[10px] text-purple-200/70 font-sans">Swipe-Up Distance Profile:</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['short', 'standard', 'long'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => handleUpdate({ swipeDistance: d })}
                  className={`py-2 rounded-2xl border font-sans text-[10px] uppercase font-bold transition-all backdrop-blur-xl cursor-pointer ${
                    config.swipeDistance === d
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'bg-black/30 text-purple-200/70 border-white/10 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulation Test */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold text-indigo-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 3. Live Voice Unlock Simulator
            </span>
            <button
              onClick={handleSimulateUnlock}
              disabled={isSimulating}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold font-sans text-xs rounded-2xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {isSimulating ? 'Simulating...' : 'Test Unlock Sequence'}
            </button>
          </div>

          {simulationLog && (
            <div className="p-3.5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl font-mono text-[11px] text-cyan-300 shadow-inner">
              {simulationLog}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
