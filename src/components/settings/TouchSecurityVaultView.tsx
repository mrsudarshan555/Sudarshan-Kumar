import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Camera, Bell, Zap, Volume2, 
  Trash2, ArrowLeft, RefreshCw, Eye, Lock, Unlock, BatteryCharging, AlertTriangle, Check
} from 'lucide-react';
import { TouchSecurityEngine, IntruderLogEntry, TouchSensitivity } from '../../services/security/TouchSecurityEngine';

interface TouchSecurityVaultViewProps {
  onBack: () => void;
}

export const TouchSecurityVaultView: React.FC<TouchSecurityVaultViewProps> = ({ onBack }) => {
  const engine = TouchSecurityEngine.getInstance();

  const [isArmed, setIsArmed] = useState<boolean>(engine.getArmedStatus());
  const [isCounting, setIsCounting] = useState<boolean>(engine.isCountingDown());
  const [countdown, setCountdown] = useState<number>(engine.getArmingSeconds());
  const [isAlarming, setIsAlarming] = useState<boolean>(engine.isAlarming());
  const [sensitivity, setSensitivity] = useState<TouchSensitivity>(engine.getSensitivity());
  const [godMode, setGodMode] = useState<boolean>(engine.getGodMode());
  const [stealthMode, setStealthMode] = useState<boolean>(engine.getStealthMode());
  const [chargerAlarm, setChargerAlarm] = useState<boolean>(engine.getChargerAlarm());
  const [logs, setLogs] = useState<IntruderLogEntry[]>(engine.getIntruderLogs());
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [disarmVoiceInput, setDisarmVoiceInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setIsArmed(engine.getArmedStatus());
      setIsCounting(engine.isCountingDown());
      setCountdown(engine.getArmingSeconds());
      setIsAlarming(engine.isAlarming());
      setSensitivity(engine.getSensitivity());
      setGodMode(engine.getGodMode());
      setStealthMode(engine.getStealthMode());
      setChargerAlarm(engine.getChargerAlarm());
      setLogs([...engine.getIntruderLogs()]);
    });
    return unsub;
  }, [engine]);

  const handleArmToggle = () => {
    if (isArmed || isCounting) {
      if (godMode && isAlarming) {
        // Must verify voice passcode in God Mode
        if (disarmVoiceInput.trim().toLowerCase() !== 'stonicx' && disarmVoiceInput.trim().toLowerCase() !== 'disarm') {
          setErrorMessage('GOD MODE ACTIVE: Type "stonicx" or speak passcode to disarm!');
          return;
        }
      }
      const res = engine.disarmGuard(true);
      if (!res.success) {
        setErrorMessage(res.message);
      } else {
        setErrorMessage(null);
        setDisarmVoiceInput('');
      }
    } else {
      engine.armGuard();
      setErrorMessage(null);
    }
  };

  const handleSimulateIntruder = () => {
    engine.triggerSecurityAlert('motion', 120);
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto text-slate-200 transition-colors duration-500 ${
      isAlarming ? 'bg-red-950/90' : 'bg-[#070913]'
    }`}>
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
            <div className={`p-1.5 rounded-lg shadow-md text-white ${
              isAlarming ? 'bg-red-600 animate-ping' : isArmed ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Touch Guard & Anti-Theft Vault
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                  REAL SENSORS & SIREN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Features 45-55: Siren, Motion Alarm & Intruder Capture
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 space-y-4 text-xs font-sans pb-12">

        {/* Alarm Banner if Triggered */}
        {isAlarming && (
          <div className="p-4 rounded-2xl bg-red-600 border border-red-400 text-white flex flex-col gap-2 animate-bounce shadow-[0_0_40px_rgba(239,68,68,0.8)]">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> INTRUDER DETECTED! SIREN ACTIVE
              </span>
              <span className="bg-black/40 text-[10px] px-2 py-0.5 rounded-full font-mono">105dB ALARM</span>
            </div>
            <p className="text-xs text-red-100">
              A stranger touched or moved your phone! Front camera snapshot has been captured silently.
            </p>
            {godMode && (
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={disarmVoiceInput}
                  onChange={(e) => setDisarmVoiceInput(e.target.value)}
                  placeholder="Voice Passcode: Type 'stonicx' or 'disarm'"
                  className="flex-1 bg-black/60 border border-white/30 rounded-xl px-3 py-1.5 text-white font-mono text-xs outline-none"
                />
                <button
                  onClick={handleArmToggle}
                  className="px-4 py-1.5 bg-white text-red-700 font-bold rounded-xl text-xs font-mono"
                >
                  DISARM
                </button>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950 border border-red-500/50 rounded-xl text-red-300 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {/* 1. Arming Big Control Card */}
        <div className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-3 ${
          isArmed
            ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
            : isCounting
            ? 'bg-amber-950/40 border-amber-500/40 animate-pulse'
            : 'bg-[#0C1021] border-white/10'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-transform duration-300 ${
            isArmed
              ? 'bg-emerald-600/20 border-emerald-400 text-emerald-400 scale-105'
              : isCounting
              ? 'bg-amber-600/20 border-amber-400 text-amber-400 animate-spin'
              : 'bg-white/5 border-white/20 text-slate-400'
          }`}>
            {isCounting ? (
              <span className="font-mono text-xl font-bold">{countdown}</span>
            ) : isArmed ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="font-mono font-bold text-sm text-white uppercase">
              {isCounting
                ? `ARMING GUARD IN ${countdown} SECONDS...`
                : isArmed
                ? 'TOUCH GUARD IS ACTIVELY ARMED'
                : 'TOUCH GUARD IS DISARMED'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCounting
                ? 'Place your phone down on a flat surface now.'
                : isArmed
                ? 'Any stranger touching, lifting, or unplugging the phone will trigger the alarm.'
                : 'Activate touch guard before leaving your phone on a table or charging station.'}
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs mt-2">
            <button
              onClick={handleArmToggle}
              className={`flex-1 py-3 rounded-xl font-bold font-mono text-xs transition-all shadow-md cursor-pointer ${
                isArmed || isCounting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isCounting ? 'CANCEL ARMING' : isArmed ? 'DISARM GUARD' : '🛡️ ARM TOUCH GUARD (12s)'}
            </button>
            {isArmed && (
              <button
                onClick={handleSimulateIntruder}
                className="px-3 py-3 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-mono text-xs font-bold"
                title="Test Trigger Alarm"
              >
                TEST
              </button>
            )}
          </div>
        </div>

        {/* 2. Security Toggles & Sensitivity */}
        <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Guard Sensitivity & Protocols
          </span>

          {/* Sensitivity Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono">Motion Sensitivity Threshold:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as TouchSensitivity[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => engine.setSensitivity(lvl)}
                  className={`py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-all ${
                    sensitivity === lvl
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                      : 'bg-[#070913] text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {lvl === 'high' ? '🔥 HIGH (8m/s²)' : lvl === 'medium' ? '⚡ MED (15m/s²)' : '🛡️ LOW (25m/s²)'}
                </button>
              ))}
            </div>
          </div>

          {/* God Mode Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-400" /> God Mode (Owner Voice-Only Disarm)
              </div>
              <p className="text-[9px] text-slate-400">Intruders cannot silence the alarm by pressing buttons on screen.</p>
            </div>
            <button
              onClick={() => engine.setGodMode(!godMode)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                godMode ? 'bg-amber-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                godMode ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Charger Pull-Out Alarm */}
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <BatteryCharging className="w-3 h-3 text-emerald-400" /> Charger Cable Pull-Out Alarm
              </div>
              <p className="text-[9px] text-slate-400">Instantly sounds alarm if the charging cable is disconnected.</p>
            </div>
            <button
              onClick={() => engine.setChargerAlarm(!chargerAlarm)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                chargerAlarm ? 'bg-emerald-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                chargerAlarm ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Stealth Mode Logging */}
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-purple-400" /> Stealth Capture Mode (Silent Trap)
              </div>
              <p className="text-[9px] text-slate-400">Takes intruder photos secretly without sounding the siren.</p>
            </div>
            <button
              onClick={() => engine.setStealthMode(!stealthMode)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                stealthMode ? 'bg-purple-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                stealthMode ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* 3. 'Who Touched It' History Gallery (Feature 54) */}
        <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> 'Who Touched It' Intruder Gallery ({logs.length})
            </span>
            {logs.length > 0 && (
              <button
                onClick={() => engine.clearLogs()}
                className="text-[10px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear Gallery
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-[11px] bg-[#070913] rounded-xl border border-white/5">
              No unauthorized touches or intruder captures recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => log.photoDataUrl && setSelectedPhoto(log.photoDataUrl)}
                  className="p-2 bg-[#070913] rounded-xl border border-white/10 flex flex-col gap-1.5 cursor-pointer hover:border-cyan-500/50 transition-all"
                >
                  <div className="w-full h-24 bg-black/60 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {log.photoDataUrl ? (
                      <img src={log.photoDataUrl} alt="Intruder capture" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600 text-[10px]">
                        <Camera className="w-5 h-5 mb-1" />
                        <span>Silent Capture</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono text-cyan-300 px-1.5 py-0.5 rounded">
                      {log.triggerType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-rose-400">{log.motionIntensity} g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Full Photo Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-md w-full bg-[#0C1021] border border-cyan-500/40 p-4 rounded-2xl flex flex-col gap-3">
            <h4 className="font-mono text-xs font-bold text-white uppercase">Intruder Snapshot</h4>
            <img src={selectedPhoto} alt="Full capture" className="w-full rounded-xl object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold rounded-xl"
            >
              CLOSE PREVIEW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
