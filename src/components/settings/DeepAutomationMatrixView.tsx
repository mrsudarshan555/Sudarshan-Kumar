import React, { useState, useEffect } from 'react';
import { 
  Cpu, Terminal, Sparkles, Play, Plus, Trash2, ArrowLeft, 
  Smartphone, Activity, BatteryCharging, HardDrive, Check, 
  ToggleLeft, ToggleRight, Radio, Shield, Zap, RefreshCw, Send
} from 'lucide-react';
import { DeepAutomationMatrixEngine, AirGestureConfig, SystemVoiceMacro, HardwareTelemetryData } from '../../services/automation/DeepAutomationMatrixEngine';
import { Mouth } from '../../services/audio/mouth';

interface DeepAutomationMatrixViewProps {
  onBack: () => void;
}

export const DeepAutomationMatrixView: React.FC<DeepAutomationMatrixViewProps> = ({ onBack }) => {
  const engine = DeepAutomationMatrixEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activeTab, setActiveTab] = useState<'macros' | 'gestures' | 'telemetry' | 'terminal'>('macros');
  const [gestures, setGestures] = useState<AirGestureConfig>(engine.getGestures());
  const [macros, setMacros] = useState<SystemVoiceMacro[]>(engine.getMacros());
  const [telemetry, setTelemetry] = useState<HardwareTelemetryData>(engine.getTelemetry());
  const [logs, setLogs] = useState<string[]>(engine.getTerminalLogs());

  // Macro creation state
  const [newTrigger, setNewTrigger] = useState<string>('STONICX Work Mode');
  const [newDesc, setNewDesc] = useState<string>('Custom productive setup with smart lights and Spotify');
  const [newActionInput, setNewActionInput] = useState<string>('Turn on Focus lights\nStart 45m timer\nPlay Deep Focus Playlist');

  // Terminal state
  const [termInput, setTermInput] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setGestures({ ...engine.getGestures() });
      setMacros([...engine.getMacros()]);
      setTelemetry({ ...engine.getTelemetry() });
      setLogs([...engine.getTerminalLogs()]);
    });
    return unsub;
  }, [engine]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleToggleGesture = (key: keyof AirGestureConfig) => {
    const updated = !gestures[key];
    engine.updateGestureConfig({ [key]: updated });
    showToast(`Gesture ${key} ${updated ? 'Enabled' : 'Disabled'}`);
  };

  const handleExecuteMacro = async (macro: SystemVoiceMacro) => {
    showToast(`Executing Routine: "${macro.triggerPhrase}"`);
    await mouth.speak(`Executing routine ${macro.triggerPhrase}. Running ${macro.actions.length} automated steps.`, { persona: 'STONICX' });
  };

  const handleCreateMacro = () => {
    if (!newTrigger.trim()) return;
    const actionsList = newActionInput.split('\n').map(a => a.trim()).filter(Boolean);
    engine.addMacro({
      triggerPhrase: newTrigger.trim(),
      description: newDesc.trim() || 'Custom user routine',
      actions: actionsList.length > 0 ? actionsList : ['Execute standard workflow'],
      isEnabled: true
    });
    showToast(`Created Voice Macro: "${newTrigger}"`);
    setNewTrigger('');
    setNewDesc('');
    setNewActionInput('');
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    engine.executeTerminalCommand(termInput);
    setTermInput('');
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
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                Deep Automation & Developer Matrix
              </h2>
              <p className="text-[10px] text-purple-300/70 font-sans">
                Voice Routines • Air Gestures • Hardware Telemetry • Kernel Terminal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Magnifying Glass */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-black/20 backdrop-blur-xl overflow-x-auto">
        {[
          { id: 'macros', label: 'Voice Routines', icon: Sparkles },
          { id: 'gestures', label: 'Air Gestures', icon: Smartphone },
          { id: 'telemetry', label: 'Hardware Telemetry', icon: Activity },
          { id: 'terminal', label: 'Kernel Terminal', icon: Terminal }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-sans font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === t.id
                ? 'text-purple-300 border-purple-400'
                : 'text-purple-200/50 border-transparent hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {notification && (
        <div className="mx-4 mt-3 p-3 bg-purple-950/60 backdrop-blur-2xl border border-purple-500/40 rounded-2xl text-purple-200 font-sans text-xs flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 stroke-[2]" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: VOICE ROUTINES & MACROS */}
        {activeTab === 'macros' && (
          <div className="space-y-4">
            {/* Macro Builder */}
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Custom Voice Routine Macro
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="Voice Trigger (e.g. Good Morning STONICX)"
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white text-xs outline-none focus:border-purple-400 transition-colors"
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Routine Description"
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white text-xs outline-none focus:border-purple-400 transition-colors"
                />
                <textarea
                  rows={3}
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  placeholder="Automated actions (One step per line)"
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 text-white text-xs outline-none focus:border-purple-400 transition-colors resize-none"
                />
                <button
                  onClick={handleCreateMacro}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> SAVE VOICE ROUTINE
                </button>
              </div>
            </div>

            {/* List of Active Macros */}
            <div className="space-y-3">
              {macros.map(m => (
                <div key={m.id} className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 px-3 bg-purple-950/50 backdrop-blur-xl border border-purple-400/30 text-purple-200 rounded-full font-bold text-xs">
                        "{m.triggerPhrase}"
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExecuteMacro(m)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-full flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-white" /> TEST
                      </button>
                      <button
                        onClick={() => engine.deleteMacro(m.id)}
                        className="text-purple-300/50 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-purple-200/60 text-[11px]">{m.description}</p>
                  <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[9px] text-purple-300/70 uppercase font-bold">Execution Chain:</span>
                    {m.actions.map((act, i) => (
                      <div key={i} className="text-[10px] text-purple-200 flex items-center gap-1.5">
                        <span className="text-purple-400">•</span> {act}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AIR GESTURES */}
        {activeTab === 'gestures' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-300 uppercase">Proximity & Accelerometer Gestures</span>
              
              <div className="space-y-2.5">
                {[
                  { key: 'proximityWaveToAnswer', label: 'Wave Over Sensor to Answer Calls', desc: 'Answer incoming voice & video calls hands-free with a hand wave.' },
                  { key: 'shakeToToggleTorch', label: 'Shake to Toggle Flashlight / Torch', desc: 'Quick double shake triggers bright LED flashlight.' },
                  { key: 'doubleTapToLock', label: 'Double Tap Screen to Lock / Sleep', desc: 'Tap anywhere on the empty matrix canvas to lock the phone.' },
                  { key: 'flipToMuteCall', label: 'Flip Phone Down to Silence Incoming Calls', desc: 'Instantly mutes ringer when placed face-down on a desk.' },
                  { key: 'threeFingerScreenshot', label: '3-Finger Swipe Instant Screenshot', desc: 'Capture screenshot and immediately run OCR Text Extractor.' }
                ].map(item => (
                  <div key={item.key} className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{item.label}</div>
                      <div className="text-[10px] text-purple-200/60">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggleGesture(item.key as any)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        gestures[item.key as keyof AirGestureConfig] ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        gestures[item.key as keyof AirGestureConfig] ? 'left-5' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HARDWARE TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="p-3 bg-black/30 backdrop-blur-xl border border-white/15 rounded-2xl text-[10px] text-purple-300 font-sans flex items-center justify-between shadow-lg">
              <span>HARDWARE TELEMETRY DIAGNOSTICS</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 font-bold">
                HYBRID (REAL SENSORS + SIM ESTIMATION)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* CPU Card */}
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <div className="flex items-center justify-between text-purple-300 font-sans text-[10px]">
                  <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> CPU Load</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-amber-300">ESTIMATED</span>
                </div>
                <div className="text-2xl font-black text-white">{telemetry.cpuUsage}%</div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${telemetry.cpuUsage}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-purple-300/60">
                  <span>{telemetry.cpuCores} Real Hardware Cores</span>
                  <span>{telemetry.cpuTempCelsius}°C (Est.)</span>
                </div>
              </div>

              {/* Battery Card */}
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <div className="flex items-center justify-between text-emerald-400 font-sans text-[10px]">
                  <span className="flex items-center gap-1"><BatteryCharging className="w-3.5 h-3.5" /> Battery</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">REAL API</span>
                </div>
                <div className="text-2xl font-black text-white">{telemetry.batteryLevel}%</div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${telemetry.batteryLevel}%` }} />
                </div>
                <span className="text-[9px] text-purple-300/60">Status: {telemetry.chargingStatus}</span>
              </div>
            </div>

            {/* RAM & Storage Telemetry */}
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-white uppercase">Memory & Storage Matrix</span>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-purple-200">
                    <span>RAM Memory:</span>
                    <span>{telemetry.ramUsedGb} GB / {telemetry.ramTotalGb} GB ({(telemetry.ramUsedGb/telemetry.ramTotalGb*100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-indigo-400 h-full" style={{ width: `${(telemetry.ramUsedGb/telemetry.ramTotalGb)*100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-purple-200">
                    <span>UFS 4.0 Storage:</span>
                    <span>{telemetry.storageUsedGb} GB / {telemetry.storageTotalGb} GB ({(telemetry.storageUsedGb/telemetry.storageTotalGb*100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-purple-400 h-full" style={{ width: `${(telemetry.storageUsedGb/telemetry.storageTotalGb)*100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KERNEL TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-black/60 backdrop-blur-3xl border border-purple-500/30 rounded-3xl font-mono text-[11px] space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-purple-300 font-bold">
                <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> STONICX Kernel Console</span>
                <span className="text-[9px] text-purple-300/50">TTY: /dev/stonicx0</span>
              </div>

              <div className="h-60 overflow-y-auto space-y-1 text-slate-300 text-[10px]">
                {logs.map((l, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap">{l}</div>
                ))}
              </div>

              <form onSubmit={handleRunCommand} className="flex gap-2 pt-2 border-t border-white/10">
                <span className="text-purple-400 font-bold self-center">$</span>
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Type 'help', 'sysinfo', 'ping', 'trigger-sos'..."
                  className="flex-1 bg-transparent text-white font-mono text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
