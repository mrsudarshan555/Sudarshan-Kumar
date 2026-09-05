import React, { useState } from 'react';
import { AssistantConfig } from '../../types';
import { 
  Sparkles, Volume2, Globe, 
  Vibrate, Bell, Zap, Check, Play, MessageSquare,
  ArrowLeft, Palette
} from 'lucide-react';
import { MtManagerVoiceStudio } from './MtManagerVoiceStudio';

interface AssistantSettingsViewProps {
  config: AssistantConfig;
  onChange: (updated: Partial<AssistantConfig>) => void;
  onBack: () => void;
}

export const AssistantSettingsView: React.FC<AssistantSettingsViewProps> = ({
  config,
  onChange,
  onBack
}) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const playVoiceDemo = () => {
    setIsPlayingDemo(true);
    setTimeout(() => setIsPlayingDemo(false), 2000);
  };

  const getSkinToneLabel = (val: number = 50) => {
    if (val < 25) return 'Dusky / Deep (Kala)';
    if (val < 45) return 'Warm Dusky / Tan';
    if (val <= 60) return 'Medium (Natural Warm Default)';
    if (val <= 80) return 'Light Warm';
    return 'Fair / Glowing (Gora)';
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-200">
      
      {/* Header with Top-Left Back Arrow - Liquid Magnifying Glass */}
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
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">MAYRA Assistant</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Persona, 3D Character & Voice Settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* AI Assistant Core Engine Selector (MAYRA vs STONICX) - Magnifying Glass */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Assistant Core Engine
            </div>
            <span className="text-[9px] font-sans text-purple-300 font-bold uppercase bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
              Full Shell Switch
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* MAYRA Option */}
            <button
              onClick={() => onChange({ activeMode: 'mayra' })}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                (config.activeMode || 'mayra') === 'mayra'
                  ? 'bg-purple-600/25 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'bg-[#070913] border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-purple-200 flex items-center gap-1">
                  ⭐ MAYRA
                </span>
                {(config.activeMode || 'mayra') === 'mayra' && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                )}
              </div>
              <p className="text-[9px] text-slate-300 leading-snug">
                3D Interactive Companion, Emotional Intelligence, Pastel Cosy UI & Voice
              </p>
            </button>

            {/* STONICX Option */}
            <button
              onClick={() => onChange({ activeMode: 'stonicx' })}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                config.activeMode === 'stonicx'
                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-[#070913] border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-amber-400 flex items-center gap-1">
                  ⚡ STONICX
                </span>
                {config.activeMode === 'stonicx' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                )}
              </div>
              <p className="text-[9px] text-slate-300 leading-snug">
                Living Circuit-Board Visualizer, Quantum Terminal, Isolated Neural Vault
              </p>
            </button>
          </div>
        </div>

        {/* Assistant Persona Tone */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Persona & Personality
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { id: 'executive', title: 'Executive & Sharp', desc: 'Direct, structured, highly professional' },
              { id: 'friendly', title: 'Warm & Natural', desc: 'Conversational, empathetic, helpful' },
              { id: 'technical', title: 'Deep Technical', desc: 'Precise code, architecture & logic' },
              { id: 'concise', title: 'Concise Minimalist', desc: 'Minimal words, bullet summaries' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ personaTone: item.id as any })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.personaTone === item.id
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                    : 'bg-black/30 border-white/10 text-purple-300/70 hover:text-white hover:bg-black/50'
                }`}
              >
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-[9px] text-purple-300/60 leading-tight mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Character Skin Tone Slider (ONLY Skin Tone Slider per design spec) */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-sans font-bold text-amber-300 uppercase flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-300" /> Character Complexion
            </div>
            <span className="text-[9px] font-sans text-amber-300 font-bold uppercase bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Live Shader
            </span>
          </div>

          {/* Character Skin Tone Slider */}
          <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-medium text-xs">Character Skin Tone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans text-amber-400 font-bold">{config.characterSkinTone ?? 50}%</span>
                <span className="text-[9px] font-sans text-slate-400">({getSkinToneLabel(config.characterSkinTone ?? 50)})</span>
              </div>
            </div>
            <p className="text-[10px] text-purple-300/70">
              Adjust complexion from Fair (Gora) to Dark (Kala). Default is Medium (50%).
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.characterSkinTone ?? 50}
              onChange={(e) => onChange({ characterSkinTone: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-sans text-slate-400">
              <span className="text-amber-600">Dusky (Kala)</span>
              <span className="text-amber-300 font-bold">Medium (Natural 50%)</span>
              <span className="text-amber-200">Fair (Gora)</span>
            </div>
          </div>
        </div>

        {/* Voice & Synthesis Settings */}
        <div className="p-3.5 bg-[#0C1021] border border-blue-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Neural Voice Studio (Mayra & Stonicx)
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
              Male & Female Voices
            </span>
          </div>

          <MtManagerVoiceStudio config={config} onChange={onChange} />

          <div className="pt-2 border-t border-white/5">
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Primary Assistant Language</label>
            <select
              value={config.language}
              onChange={(e) => onChange({ language: e.target.value })}
              className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-white font-mono text-xs outline-none focus:border-blue-500"
            >
              <option value="en-IN">English (India / Hinglish) • Default</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
            </select>
          </div>

          {/* Speech Rate & Pitch */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Speed Rate</label>
                <span className="text-[10px] font-mono text-blue-400">{config.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.speechRate}
                onChange={(e) => onChange({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Pitch Level</label>
                <span className="text-[10px] font-mono text-blue-400">{config.speechPitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={config.speechPitch}
                onChange={(e) => onChange({ speechPitch: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Incoming Calls & Messages Voice Alerts */}
        <div className="p-3.5 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Call & Message Voice Alerts
          </div>
          <p className="text-[10px] text-slate-400">MAYRA speaks aloud to notify you of incoming calls, texts, and WhatsApp messages.</p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Announce Incoming Calls</div>
                <div className="text-[9px] text-slate-400">Speak caller name & prompt to answer or decline</div>
              </div>
              <input
                type="checkbox"
                checked={config.voiceAlertCalls}
                onChange={(e) => onChange({ voiceAlertCalls: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Read Incoming Messages</div>
                <div className="text-[9px] text-slate-400">Speak message sender & preview aloud</div>
              </div>
              <input
                type="checkbox"
                checked={config.voiceAlertMessages}
                onChange={(e) => onChange({ voiceAlertMessages: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Proactive Silence Check-In</div>
                <div className="text-[9px] text-slate-400">MAYRA speaks up if silent for 1–2 min, matching your conversation's language</div>
              </div>
              <input
                type="checkbox"
                checked={config.proactiveIdleCheckin}
                onChange={(e) => onChange({ proactiveIdleCheckin: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* Interaction & Feedback Toggles */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Interaction & Feedback
          </div>

          <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Vibrate className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-white font-medium text-xs">Haptic Touch Feedback</div>
                <div className="text-[9px] text-slate-400">Vibrate on speech recognition events</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.hapticFeedback}
              onChange={(e) => onChange({ hapticFeedback: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-white font-medium text-xs">Audio Chimes on Wake</div>
                <div className="text-[9px] text-slate-400">Play subtle futuristic tone when listening</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.audioChimes}
              onChange={(e) => onChange({ audioChimes: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-white font-medium text-xs">Auto-Readback Text Answers</div>
                <div className="text-[9px] text-slate-400">Automatically synthesize voice responses</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.autoReadback}
              onChange={(e) => onChange({ autoReadback: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded"
            />
          </div>
        </div>

        {/* Conversation Context Window */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Context Window Size
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold">{config.contextWindowSize} turns</span>
          </div>
          <p className="text-[10px] text-slate-400">Number of previous conversational messages passed for short-term memory.</p>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={config.contextWindowSize}
            onChange={(e) => onChange({ contextWindowSize: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>

      </div>
    </div>
  );
};
