import React, { useState } from 'react';
import { Play, Square, Check, Volume2, Mic, Sparkles, Sliders, Music, Radio } from 'lucide-react';
import { VOICE_CATALOG, VoiceItem, VoiceGender } from '../../services/voice/voiceCatalog';
import { speakText, stopCurrentSpeech } from '../../utils/speechEngine';
import { AssistantConfig, AssistantMode } from '../../types';

interface MtManagerVoiceStudioProps {
  config: AssistantConfig;
  onChange: (patch: Partial<AssistantConfig>) => void;
  defaultTarget?: AssistantMode;
}

export const MtManagerVoiceStudio: React.FC<MtManagerVoiceStudioProps> = ({
  config,
  onChange,
  defaultTarget = 'mayra'
}) => {
  const [targetAssistant, setTargetAssistant] = useState<AssistantMode>(
    config.activeMode || defaultTarget
  );
  const [genderFilter, setGenderFilter] = useState<'All' | VoiceGender>('All');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const currentMayraVoice = config.mayraVoice || config.voiceProfile || 'Aoede';
  const currentStonicxVoice = config.stonicxVoice || 'Charon';

  const selectedVoiceId = targetAssistant === 'mayra' ? currentMayraVoice : currentStonicxVoice;

  const filteredVoices = VOICE_CATALOG.filter((v) => {
    if (genderFilter === 'All') return true;
    return v.gender === genderFilter;
  });

  const handleSelectVoice = (voiceId: string) => {
    if (targetAssistant === 'mayra') {
      onChange({
        mayraVoice: voiceId,
        voiceProfile: voiceId
      });
    } else {
      onChange({
        stonicxVoice: voiceId
      });
    }
  };

  const handlePlayPreview = async (v: VoiceItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingVoiceId === v.id) {
      stopCurrentSpeech();
      setPreviewingVoiceId(null);
      return;
    }

    stopCurrentSpeech();
    setPreviewingVoiceId(v.id);

    const isHindi = config.language?.startsWith('hi');
    const textToSpeak = isHindi ? v.sampleTextHi : v.sampleTextEn;

    await speakText(
      textToSpeak,
      isHindi ? 'hi' : 'en',
      () => setPreviewingVoiceId(v.id),
      () => setPreviewingVoiceId(null),
      null,
      v.id
    );
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Target Assistant Switcher (MAYRA vs STONICX) - Liquid Magnifying Glass */}
      <div className="p-1.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl flex items-center gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <button
          type="button"
          onClick={() => setTargetAssistant('mayra')}
          className={`flex-1 py-2.5 px-3.5 rounded-2xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            targetAssistant === 'mayra'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 border border-white/20'
              : 'text-purple-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-300" />
          <span>MAYRA Voice</span>
          <span className="text-[10px] opacity-80 font-normal">({currentMayraVoice})</span>
        </button>

        <button
          type="button"
          onClick={() => setTargetAssistant('stonicx')}
          className={`flex-1 py-2.5 px-3.5 rounded-2xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            targetAssistant === 'stonicx'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-white/20'
              : 'text-purple-200/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-300" />
          <span>STONICX Voice</span>
          <span className="text-[10px] opacity-80 font-normal">({currentStonicxVoice})</span>
        </button>
      </div>

      {/* Gender Filters (All, Female, Male) - Inspired by MT Manager file classification */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
          {(['All', 'Female', 'Male'] as const).map((filter) => {
            const count =
              filter === 'All'
                ? VOICE_CATALOG.length
                : VOICE_CATALOG.filter((v) => v.gender === filter).length;
            const isActive = genderFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setGenderFilter(filter)}
                className={`px-3 py-1 rounded-xl text-[11px] font-sans font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm border border-white/20'
                    : 'text-purple-200/60 hover:text-white'
                }`}
              >
                {filter === 'Female' && '🌸 '}
                {filter === 'Male' && '⚡ '}
                {filter} <span className="opacity-60 text-[9px]">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="text-[10px] font-sans text-purple-200/70 flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>16 Neural Voices</span>
        </div>
      </div>

      {/* Voice Cards List (MT Manager UI / Sound Selector Inspired) */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoiceId.toLowerCase() === v.id.toLowerCase();
          const isPlaying = previewingVoiceId === v.id;
          const mtFile = targetAssistant === 'mayra' ? v.mtManagerMayaFile : v.mtManagerFridayFile;

          return (
            <div
              key={v.id}
              onClick={() => handleSelectVoice(v.id)}
              className={`p-3.5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                isSelected
                  ? targetAssistant === 'mayra'
                    ? 'bg-purple-950/40 border-purple-400/60 shadow-lg shadow-purple-900/30'
                    : 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-900/30'
                  : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Top Row: Name, Badges, MT Manager File Reference */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm tracking-wide font-sans">{v.name}</span>
                  
                  {/* Gender Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider ${
                      v.gender === 'Female'
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {v.gender === 'Female' ? '♀ Female' : '♂ Male'}
                  </span>

                  {v.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-sans bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {v.badge}
                    </span>
                  )}
                </div>

                {/* MT Manager Filename Tag */}
                <div className="text-[10px] font-mono text-purple-200/70 bg-black/30 px-2.5 py-0.5 rounded-xl border border-white/10">
                  📁 {mtFile}
                </div>
              </div>

              {/* Tone & Description */}
              <div className="mt-1 flex items-center justify-between text-[11px] text-purple-200/90 font-sans">
                <span className="text-cyan-300/90 font-medium">{v.tone}</span>
                <span className="text-[10px] text-purple-300/60">{v.category}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-purple-200/60 line-clamp-1 font-sans">{v.description}</p>

              {/* Action Bar: Test Preview Button + Select Checkmark */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handlePlayPreview(v, e)}
                  className={`px-3 py-1.5 rounded-2xl text-[11px] font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white border border-white/10'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-1 h-3 bg-white animate-pulse" />
                        <span className="w-1 h-2 bg-white animate-pulse delay-75" />
                        <span className="w-1 h-4 bg-white animate-pulse delay-150" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Test Voice</span>
                    </>
                  )}
                </button>

                {/* Selection State */}
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active for {targetAssistant === 'mayra' ? 'Mayra' : 'Stonicx'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVoice(v.id);
                      }}
                      className="text-[10px] font-sans text-purple-200/70 hover:text-white px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 cursor-pointer transition-all"
                    >
                      Choose
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
