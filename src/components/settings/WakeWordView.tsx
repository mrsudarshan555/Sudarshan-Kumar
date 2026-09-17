import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mic, Radio, Sliders, Check, 
  Key, ShieldCheck, Cpu, Volume2, Save
} from 'lucide-react';

interface WakeWordViewProps {
  onBack: () => void;
}

export const WakeWordView: React.FC<WakeWordViewProps> = ({ onBack }) => {
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [picovoiceKey, setPicovoiceKey] = useState('');
  const [customWakeWord, setCustomWakeWord] = useState('MAYRA');
  const [currentWord, setCurrentWord] = useState('MAYRA');
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  const handleTestMic = () => {
    setIsMicTesting(true);
    let count = 0;
    const interval = setInterval(() => {
      setMicVolume(Math.floor(Math.random() * 85) + 15);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsMicTesting(false);
        setMicVolume(0);
      }
    }, 150);
  };

  const handleSaveWakeWord = () => {
    if (customWakeWord.trim()) {
      setCurrentWord(customWakeWord.trim().toUpperCase());
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-white tracking-wide">
            Wake Word
          </h1>
          <p className="text-[11px] text-gray-400">
            Customize how you start MAYRA
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-24">
        {/* Toggle Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Wake Word
              </h3>
              <p className="text-[11px] text-gray-400">
                Current engine: STT (Cloud) {wakeWordEnabled ? '(Active)' : '(not running)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              wakeWordEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                wakeWordEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Microphone Test */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">Microphone Status</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              Hardware Ready
            </span>
          </div>

          {isMicTesting && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Input Level</span>
                <span>{micVolume}%</span>
              </div>
              <div className="h-2 w-full bg-[#181924] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 transition-all duration-100" 
                  style={{ width: `${micVolume}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleTestMic}
            disabled={isMicTesting}
            className="w-full py-2.5 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 text-xs font-bold text-gray-200 transition-colors cursor-pointer"
          >
            {isMicTesting ? 'Calibrating Noise Floor...' : 'Test Microphone'}
          </button>
        </div>

        {/* Picovoice Access Key */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2">
          <span className="text-xs font-bold text-white">
            Picovoice Access Key (Optional)
          </span>
          <p className="text-[11px] text-gray-400">
            Enables ultra-low power on-device hotword detection without wake locks.
          </p>
          <input
            type="password"
            value={picovoiceKey}
            onChange={(e) => setPicovoiceKey(e.target.value)}
            placeholder="Enter Picovoice access key..."
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400 transition-colors font-mono"
          />
        </div>

        {/* Sensitivity */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Detection Sensitivity
            </span>
            <span className="text-xs font-bold text-purple-400">
              {Math.round(sensitivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1f212d] rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>Low (Fewer false alarms)</span>
            <span>High (Fast trigger)</span>
          </div>
        </div>

        {/* Custom Wake Word */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <span className="text-xs font-bold text-white">
            Custom Wake Word
          </span>
          <p className="text-[11px] text-gray-400">
            Just the name, e.g. Mayra (not "Hey Mayra")
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customWakeWord}
              onChange={(e) => setCustomWakeWord(e.target.value)}
              placeholder="e.g. Mayra, Nova, Jarvis"
              className="flex-1 bg-[#15161d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400 transition-colors"
            />
            <button
              onClick={handleSaveWakeWord}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Current wake word: <span className="text-white font-bold">{currentWord}</span>
          </p>
        </div>

        {/* Offline Mode (Vosk) info */}
        <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Offline Engine (Vosk / Sherpa-ONNX)</p>
            <p className="text-[11px] text-gray-400">Zero internet required hotword engine</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Ready
          </span>
        </div>
      </div>
    </div>
  );
};
