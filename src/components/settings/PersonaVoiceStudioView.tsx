import React, { useState } from 'react';
import { 
  Sparkles, Volume2, Globe, Heart, Zap, 
  ArrowLeft, Check, Play, Shield, Lock, Bot, MessageSquare, AlertCircle
} from 'lucide-react';
import { PERSONA_PROFILES, PersonaSwitchManager, PersonaProfile } from '../../services/persona/PersonaSwitchManager';
import { REGIONAL_LANGUAGES, RegionalLanguageAudioEngine, RegionalLanguageConfig } from '../../services/audio/RegionalLanguageAudioEngine';
import { Mouth } from '../../services/audio/mouth';
import { MtManagerVoiceStudio } from './MtManagerVoiceStudio';
import { AssistantConfig } from '../../types';

interface PersonaVoiceStudioViewProps {
  onBack: () => void;
  userGender?: 'Male' | 'Female' | 'Other';
  assistantConfig?: AssistantConfig;
  onUpdateAssistantConfig?: (patch: Partial<AssistantConfig>) => void;
}

export const PersonaVoiceStudioView: React.FC<PersonaVoiceStudioViewProps> = ({
  onBack,
  userGender = 'Male',
  assistantConfig,
  onUpdateAssistantConfig
}) => {
  const personaManager = PersonaSwitchManager.getInstance();
  const langEngine = RegionalLanguageAudioEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activePersona, setActivePersona] = useState<PersonaProfile>(personaManager.getActivePersona());
  const [selectedLang, setSelectedLang] = useState<RegionalLanguageConfig>(langEngine.getSelectedLanguage());
  const [alias, setAlias] = useState<string>(personaManager.getCustomAlias());
  const [highEmotion, setHighEmotion] = useState<boolean>(personaManager.isHighEmotion());
  const [fastResponse, setFastResponse] = useState<boolean>(personaManager.isFastResponse());
  const [proactive, setProactive] = useState<boolean>(personaManager.isProactive());
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSelectPersona = (p: PersonaProfile) => {
    const res = personaManager.setPersona(p.id, true, userGender);
    if (res.success) {
      setActivePersona(personaManager.getActivePersona());
      setStatusBanner({ message: `Active Persona: ${p.name}`, type: 'success' });
      setTimeout(() => setStatusBanner(null), 2500);
    } else {
      setStatusBanner({ message: res.message, type: 'error' });
      setTimeout(() => setStatusBanner(null), 3500);
    }
  };

  const handleSelectLanguage = (lang: RegionalLanguageConfig) => {
    langEngine.setLanguage(lang.id);
    setSelectedLang(lang);
    setStatusBanner({ message: `Language set to ${lang.nativeName}`, type: 'success' });
    setTimeout(() => setStatusBanner(null), 2500);
  };

  const handleTestVoice = async (p: PersonaProfile, lang: RegionalLanguageConfig) => {
    setPreviewingId(p.id);
    const speechText = lang.sampleGreeting || `Hello! I am ${p.name}. Systems online.`;
    await mouth.speak(speechText, {
      persona: 'STONICX',
      voice: p.voice as any
    });
    setPreviewingId(null);
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
            <div className="p-1.5 bg-gradient-to-tr from-cyan-600 to-purple-600 text-white rounded-xl shadow-md border border-white/15">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Persona & Voice Studio</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Multi-Persona, Dialects & Neural Voice Engines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusBanner && (
        <div className={`mx-4 mt-3 p-3 rounded-2xl border text-xs font-sans flex items-center gap-2 backdrop-blur-xl ${
          statusBanner.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.2)]' 
            : 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-[0_4px_16px_rgba(244,63,94,0.2)]'
        }`}>
          {statusBanner.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusBanner.message}</span>
        </div>
      )}

      <div className="p-4 space-y-5 text-xs font-sans pb-10">

        {/* Custom Assistant Name Alias */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-sans font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Assistant Name Alias
            </label>
            <span className="text-[9px] font-sans text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Voice Wake Identity
            </span>
          </div>
          <p className="text-[10px] text-purple-200/70 font-sans">
            Customize the name you use to call your assistant (e.g. STONICX, Jarvis, Friday).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value);
                personaManager.setCustomAlias(e.target.value);
              }}
              placeholder="e.g. STONICX"
              className="flex-1 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 text-white font-mono text-xs outline-none focus:border-cyan-500 transition-all"
            />
            <button
              onClick={() => {
                personaManager.setCustomAlias(alias);
                setStatusBanner({ message: `Alias saved: ${alias}`, type: 'success' });
                setTimeout(() => setStatusBanner(null), 2000);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl transition-all font-sans text-xs shadow-md active:scale-95 cursor-pointer"
            >
              SAVE
            </button>
          </div>
        </div>

        {/* Neural Voice Selection Studio (Male/Female MT Manager Style) */}
        {assistantConfig && onUpdateAssistantConfig && (
          <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-sans font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Neural Voice Studio (Mayra & Stonicx)
              </div>
              <span className="text-[9px] font-sans text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                MT Manager Audio Engine
              </span>
            </div>
            <p className="text-[10px] text-purple-200/70 font-sans">
              Select any male or female voice for Mayra and Stonicx. Test audio clips and apply instantly.
            </p>
            <MtManagerVoiceStudio
              config={assistantConfig}
              onChange={onUpdateAssistantConfig}
            />
          </div>
        )}

        {/* 1. Multi-Persona Selection */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-sans font-bold text-purple-400 uppercase flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> 1. Select Active Persona Profile
            </div>
            <span className="text-[9px] font-sans text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
              Voice-Triggerable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONA_PROFILES.map((p) => {
              const isSelected = activePersona.id === p.id;
              const isLocked = p.requiresGender && p.requiresGender !== userGender;

              return (
                <div
                  key={p.id}
                  onClick={() => !isLocked && handleSelectPersona(p)}
                  className={`p-4 rounded-3xl border transition-all relative cursor-pointer backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                      : isLocked
                      ? 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
                      : 'bg-black/30 border-white/10 hover:border-purple-400/40 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.themeAccent }} />
                      <span className="font-bold text-xs text-white font-sans">{p.name}</span>
                    </div>
                    {isLocked ? (
                      <span className="text-[9px] font-sans text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-500/30">
                        <Lock className="w-2.5 h-2.5" /> {p.requiresGender} Only
                      </span>
                    ) : isSelected ? (
                      <span className="text-[9px] font-sans text-purple-300 bg-purple-900/60 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-purple-500/40">
                        <Check className="w-2.5 h-2.5" /> ACTIVE
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-cyan-300 font-sans mb-1">{p.tagline}</p>
                  <p className="text-[10px] text-purple-200/70 leading-snug mb-3 font-sans">{p.description}</p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                    <span className="text-[9px] font-mono text-purple-300/60 uppercase">Voice: {p.voice}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(p, selectedLang);
                      }}
                      className="px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white font-sans text-[9px] flex items-center gap-1 transition-all border border-white/10 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400/40" />
                      <span>{previewingId === p.id ? 'Playing...' : 'Test Audio'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Regional Languages & Dialects */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-sans font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> 2. Regional Dialects & Languages (15 Indian Dialects)
            </div>
            <span className="text-[9px] font-sans text-blue-300 bg-blue-950/60 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Full Multilingual
            </span>
          </div>

          <p className="text-[10px] text-purple-200/70 font-sans">
            Select the dialect for STONICX neural voice greetings, responses and command understanding.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {REGIONAL_LANGUAGES.map((lang) => {
              const isSelected = selectedLang.id === lang.id;

              return (
                <button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`p-3 rounded-2xl border text-left transition-all backdrop-blur-xl cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/50 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-400'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:border-white/20 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate font-sans">{lang.nativeName}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                  </div>
                  <div className="text-[9px] font-sans text-purple-300/60">{lang.englishName} ({lang.region})</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. High Emotion, Fast Response & Proactive Switches */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-white uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Advanced Vocal Dynamics
          </div>

          {/* High Emotion Switch */}
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5 font-sans">
                <Heart className="w-3.5 h-3.5 text-pink-400" /> High-Emotion Voice Inflections
              </div>
              <p className="text-[9px] text-purple-200/70 font-sans">Adds natural breathing, pitch dynamics and emotional tones.</p>
            </div>
            <button
              onClick={() => {
                const next = !highEmotion;
                setHighEmotion(next);
                personaManager.toggleHighEmotion(next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                highEmotion ? 'bg-pink-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                highEmotion ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Fast Response Switch */}
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5 font-sans">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Fast Voice Response Mode
              </div>
              <p className="text-[9px] text-purple-200/70 font-sans">Ultra-low latency real-time voice streaming with zero delays.</p>
            </div>
            <button
              onClick={() => {
                const next = !fastResponse;
                setFastResponse(next);
                personaManager.toggleFastResponse(next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                fastResponse ? 'bg-cyan-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                fastResponse ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Proactive Mode */}
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div>
              <div className="font-semibold text-white text-xs flex items-center gap-1.5 font-sans">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Proactive AI Interaction
              </div>
              <p className="text-[9px] text-purple-200/70 font-sans">When enabled, STONICX proactively initiates conversations.</p>
            </div>
            <button
              onClick={() => {
                const next = !proactive;
                setProactive(next);
                personaManager.toggleProactive(next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                proactive ? 'bg-purple-600' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                proactive ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
