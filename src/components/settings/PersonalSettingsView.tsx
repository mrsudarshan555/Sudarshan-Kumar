import React, { useState } from 'react';
import { UserPersonalConfig } from '../../types';
import { 
  User, Mail, Globe, Sparkles, Key, 
  Eye, EyeOff, Check, Cpu, Lock, ShieldCheck, ChevronRight, ArrowLeft
} from 'lucide-react';

interface PersonalSettingsProps {
  config: UserPersonalConfig;
  onChange: (updated: Partial<UserPersonalConfig>) => void;
  onOpenCountryPicker: () => void;
  onBack: () => void;
}

export const PersonalSettingsView: React.FC<PersonalSettingsProps> = ({
  config,
  onChange,
  onOpenCountryPicker,
  onBack
}) => {
  const [showKey, setShowKey] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const triggerSaveNotification = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070312] text-slate-100 scrollbar-thin scrollbar-thumb-purple-500/20">
      
      {/* Top Header with Back Arrow - iPhone Frosted Glass */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#120626]/80 backdrop-blur-2xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
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
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Personal Settings</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Account & Identity Preferences</p>
            </div>
          </div>
        </div>
        {savedBadge && (
          <span className="text-[9px] font-sans text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in shadow-sm">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* User Identity Section - Liquid Frosted Card */}
        <div className="p-4 bg-[#160b29]/50 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> User Profile
          </div>

          <div>
            <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Full Name</label>
            <input
              type="text"
              value={config.fullName}
              onChange={(e) => {
                onChange({ fullName: e.target.value });
                triggerSaveNotification();
              }}
              placeholder="e.g. Zafer"
              className="w-full bg-[#1c0d36]/60 border border-white/15 rounded-2xl px-3.5 py-2 text-white font-sans text-xs outline-none focus:border-purple-400/70 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] placeholder:text-purple-300/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Preferred Name / Pronoun</label>
            <input
              type="text"
              value={config.preferredName}
              onChange={(e) => {
                onChange({ preferredName: e.target.value });
                triggerSaveNotification();
              }}
              placeholder="e.g. Zafer"
              className="w-full bg-[#1c0d36]/60 border border-white/15 rounded-2xl px-3.5 py-2 text-white font-sans text-xs outline-none focus:border-purple-400/70 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] placeholder:text-purple-300/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Email (Optional)</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-purple-300/60 absolute left-3.5 top-2.5" />
              <input
                type="email"
                value={config.email}
                onChange={(e) => {
                  onChange({ email: e.target.value });
                  triggerSaveNotification();
                }}
                placeholder="e.g. zafer@example.com"
                className="w-full bg-[#1c0d36]/60 border border-white/15 rounded-2xl pl-9 pr-3 py-2 text-white font-sans text-xs outline-none focus:border-purple-400/70 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] placeholder:text-purple-300/40"
              />
            </div>
          </div>

          {/* Country Code Trigger Card */}
          <div>
            <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Country & Region</label>
            <button
              onClick={onOpenCountryPicker}
              className="w-full bg-[#1c0d36]/60 hover:bg-[#25104d] border border-white/15 hover:border-purple-400/50 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all text-left shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white font-medium">{config.countryName}</span>
                <span className="text-purple-300 font-sans font-bold text-[11px]">{config.countryDialCode}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/50" />
            </button>
          </div>
        </div>

        {/* Assistant Greeting Style */}
        <div className="p-4 bg-[#160b29]/50 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Greeting Preference
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { id: 'warm', title: 'Warm & Helpful', desc: 'Friendly welcome' },
              { id: 'formal', title: 'Executive', desc: 'Concise & formal' },
              { id: 'casual', title: 'Casual', desc: 'Relaxed tone' },
              { id: 'brief', title: 'Brief / Silent', desc: 'Minimal words' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onChange({ greetingStyle: item.id as any });
                  triggerSaveNotification();
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.greetingStyle === item.id
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                    : 'bg-[#1c0d36]/40 border-white/10 text-purple-300/70 hover:text-white hover:bg-[#1c0d36]/70'
                }`}
              >
                <div className="font-bold text-white">{item.title}</div>
                <div className="text-[9px] text-purple-300/60 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider & API Key Configuration */}
        <div className="p-4 bg-[#160b29]/50 backdrop-blur-2xl border border-purple-500/30 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> AI Engine Configuration
            </div>
            <span className="text-[9px] font-sans text-emerald-300 bg-emerald-950/60 border border-emerald-400/30 px-2.5 py-0.5 rounded-full shadow-sm">
              Secure Cloud / Local
            </span>
          </div>

          <p className="text-[10px] text-purple-300/70 leading-relaxed font-sans">
            API keys and credentials are safe and masked. You can also customize temperature and target model.
          </p>

          <div>
            <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Gemini API Key Slot</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.geminiApiKey}
                onChange={(e) => {
                  onChange({ geminiApiKey: e.target.value });
                  triggerSaveNotification();
                }}
                placeholder="AIzaSy... (Default server-side key enabled)"
                className="w-full bg-[#1c0d36]/60 border border-white/15 rounded-2xl pl-3.5 pr-9 py-2 text-white font-mono text-xs outline-none focus:border-purple-400/70 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] placeholder:text-purple-300/40"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-purple-300/70 hover:text-white cursor-pointer"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-sans text-purple-300/70 uppercase block mb-1">Target Model</label>
              <select
                value={config.geminiModel}
                onChange={(e) => {
                  onChange({ geminiModel: e.target.value });
                  triggerSaveNotification();
                }}
                className="w-full bg-[#1c0d36]/60 border border-white/15 rounded-2xl p-2 text-white font-sans text-xs outline-none focus:border-purple-400/70 cursor-pointer"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Default • Fast)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-sans text-purple-300/70 uppercase">Temperature</label>
                <span className="text-[10px] font-sans text-purple-300 font-bold">{config.temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => {
                  onChange({ temperature: parseFloat(e.target.value) });
                  triggerSaveNotification();
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
