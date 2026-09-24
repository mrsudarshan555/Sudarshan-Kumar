import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Sliders, Search, Play, Pause, Heart, Check, 
  Sparkles, Volume2, Mic, Settings as SettingsIcon, X
} from 'lucide-react';
import { AssistantConfig } from '../../types';
import { speakText, stopCurrentSpeech } from '../../utils/speechEngine';

interface VoiceModelsViewProps {
  config: AssistantConfig;
  onChange: (updated: Partial<AssistantConfig>) => void;
  onBack: () => void;
}

interface VoiceItem {
  id: string;
  name: string;
  description: string;
  gender: 'Male' | 'Female';
  language: 'English' | 'Hindi' | 'Hinglish';
  isFavorite?: boolean;
}

const VOICE_CATALOG: VoiceItem[] = [
  { id: 'Algenib', name: 'Algenib', description: 'Bright, youthful male voice', gender: 'Male', language: 'English' },
  { id: 'Algieba', name: 'Algieba', description: 'Deep, resonant male voice', gender: 'Male', language: 'English' },
  { id: 'Alnilam', name: 'Alnilam', description: 'Clear, neutral male voice', gender: 'Male', language: 'English' },
  { id: 'Aoede', name: 'Aoede', description: 'Soft, lyrical female voice', gender: 'Female', language: 'English' },
  { id: 'Autonoe', name: 'Autonoe', description: 'Bright, energetic female voice', gender: 'Female', language: 'English' },
  { id: 'Callirrhoe', name: 'Callirrhoe', description: 'Friendly, conversational female voice', gender: 'Female', language: 'English' },
  { id: 'Charon', name: 'Charon', description: 'Steady, reliable male voice', gender: 'Male', language: 'English' },
  { id: 'Despina', name: 'Despina', description: 'Lively, energetic female voice', gender: 'Female', language: 'English' },
  { id: 'Enceladus', name: 'Enceladus', description: 'Calm, soothing male voice', gender: 'Male', language: 'English' },
  { id: 'Erinome', name: 'Erinome', description: 'Sophisticated, elegant female voice', gender: 'Female', language: 'English' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Strong, commanding male voice', gender: 'Male', language: 'English' },
  { id: 'Gacrux', name: 'Gacrux', description: 'Crisp, articulate female voice', gender: 'Female', language: 'English' },
  { id: 'Schedar', name: 'Schedar', description: 'Solid, grounded male voice', gender: 'Male', language: 'English' },
  { id: 'Sulafat', name: 'Sulafat', description: 'Clear, singing female voice', gender: 'Female', language: 'English' },
  { id: 'Umbriel', name: 'Umbriel', description: 'Subdued, serious male voice', gender: 'Male', language: 'English' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Intelligent, focused female voice', gender: 'Female', language: 'English' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Airy, gentle female voice', gender: 'Female', language: 'English' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', description: 'Deep, velvety male voice', gender: 'Male', language: 'English' }
];

export const VoiceModelsView: React.FC<VoiceModelsViewProps> = ({
  config,
  onChange,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Female' | 'Male'>('All');
  const [personalityMode, setPersonalityMode] = useState<'normal' | 'gf' | 'friend' | 'nautanki'>(
    config.personalityMode || 'friend'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [favoriteVoices, setFavoriteVoices] = useState<Record<string, boolean>>({
    'Aoede': true,
    'Despina': true
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Voice Settings States (matching video frame 00:19-00:20)
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.3);
  const [voicePitch, setVoicePitch] = useState<'Low' | 'Normal' | 'High'>('Normal');
  const [speakingToggles, setSpeakingToggles] = useState({
    fastResponse: true,
    naturalPauses: true,
    expressiveVoice: true,
    interruptWhileSpeaking: false,
    autoStopOnUserTalk: true,
    continueSpeakingAfterInterruption: false
  });
  const [detectionToggles, setDetectionToggles] = useState({
    noiseSuppression: true,
    echoCancellation: true,
    autoMicGain: true,
    vad: true,
    backgroundFilter: true
  });

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteVoices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePlayVoiceSample = (voice: VoiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoiceId === voice.id) {
      stopCurrentSpeech();
      setPlayingVoiceId(null);
      return;
    }

    stopCurrentSpeech();
    setPlayingVoiceId(voice.id);
    const text = voice.language === 'English' 
      ? `Hello! I am ${voice.name}, your intelligent AI companion.`
      : `नमस्ते! मैं हूँ ${voice.name}, आपकी पर्सनल AI सहायक।`;
    const lang = voice.language === 'English' ? 'en' : 'hi';

    speakText(
      text,
      lang,
      () => setPlayingVoiceId(voice.id),
      () => setPlayingVoiceId(null),
      null,
      voice.name
    ).catch(() => {
      setPlayingVoiceId(null);
    });
  };

  const filteredVoices = VOICE_CATALOG.filter(voice => {
    if (activeTab === 'Female' && voice.gender !== 'Female') return false;
    if (activeTab === 'Male' && voice.gender !== 'Male') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return voice.name.toLowerCase().includes(q) || voice.description.toLowerCase().includes(q);
    }
    return true;
  });

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
          <h1 className="text-base font-bold text-purple-300 tracking-wide">
            Voice Models
          </h1>
          <p className="text-[11px] text-gray-400">
            Choose the perfect voice for MAYRA
          </p>
        </div>

        <button
          onClick={() => setShowVoiceSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16171f] hover:bg-[#1f202b] border border-white/10 rounded-full text-xs font-medium text-gray-200 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Voice Settings</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none pb-20">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['All', 'Female', 'Male'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voice model..."
            className="w-full bg-[#15161d] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-400/50 transition-colors"
          />
        </div>

        {/* Personality Mode Selector */}
        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">
            Select Personality Mode
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'normal' as const, label: 'Normal' },
              { id: 'gf' as const, label: 'GF Mode' },
              { id: 'friend' as const, label: 'Friend Mode' },
              { id: 'nautanki' as const, label: 'Nautanki Mode' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setPersonalityMode(item.id);
                  onChange({ personalityMode: item.id });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  personalityMode === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice List */}
        <div className="space-y-2.5">
          {filteredVoices.map(voice => {
            const isSelected = (config.selectedVoice || 'Aoede') === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            const isFav = favoriteVoices[voice.id];

            return (
              <div
                key={voice.id}
                onClick={() => onChange({ selectedVoice: voice.id })}
                className={`p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#161720] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-[#121318] border-white/5 hover:border-white/10 hover:bg-[#161720]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Play Button Circle */}
                  <button
                    onClick={(e) => handlePlayVoiceSample(voice, e)}
                    className="w-10 h-10 rounded-full bg-[#1a1b24] hover:bg-[#222430] border border-white/10 flex items-center justify-center text-white shrink-0 transition-transform active:scale-90 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {voice.name}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {voice.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-purple-500/30 text-purple-300 bg-purple-950/50">
                        {voice.gender}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/10 text-gray-400">
                        {voice.language}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleFavorite(voice.id, e)}
                  className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${isFav ? 'text-purple-400 fill-purple-400' : ''}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Settings Fullscreen Modal (Matching Video Frame 00:19-00:20) */}
      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 bg-[#0a0b0e] z-30 flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0">
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div className="text-center">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Voice Settings
                </h2>
                <p className="text-[11px] text-gray-400">
                  Tune how MAYRA sounds and listens
                </p>
              </div>
              <div className="w-8" />
            </div>

            {/* Settings Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none pb-12">
              {/* VOICE SPEED */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-400 tracking-wider">
                    VOICE SPEED
                  </span>
                  <span className="text-xs font-bold text-purple-400">
                    {voiceSpeed.toFixed(1)}x
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  How fast MAYRA talks. Applied to her actual speech output (AudioTrack playback speed) - your own speaking/listening speed is unaffected.
                </p>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#1f212d] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                  <span>0.5x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* VOICE PITCH */}
              <div>
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  VOICE PITCH
                </span>
                <p className="text-[11px] text-gray-500 mb-2.5">
                  Only changes MAYRA's voice - never your microphone input.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Normal', 'High'] as const).map(pitch => (
                    <button
                      key={pitch}
                      onClick={() => setVoicePitch(pitch)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        voicePitch === pitch
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {pitch}
                    </button>
                  ))}
                </div>
              </div>

              {/* SPEAKING BEHAVIOR */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  SPEAKING BEHAVIOR
                </span>

                {[
                  {
                    key: 'fastResponse',
                    title: 'Fast Response Mode',
                    desc: 'Starts speaking sooner by splitting replies into smaller pieces instead of waiting for the whole thing.'
                  },
                  {
                    key: 'naturalPauses',
                    title: 'Natural Pauses',
                    desc: 'A short beat between sentences instead of running them together.'
                  },
                  {
                    key: 'expressiveVoice',
                    title: 'Expressive Voice',
                    desc: 'Natural pacing, emphasis and emotion. Off = flatter, more consistent delivery.'
                  },
                  {
                    key: 'interruptWhileSpeaking',
                    title: 'Interrupt MAYRA While Speaking',
                    desc: 'Let you cut in and start talking any time, even mid-sentence.'
                  },
                  {
                    key: 'autoStopOnUserTalk',
                    title: 'Auto Stop When User Starts Talking',
                    desc: 'Cuts MAYRA\'s audio instantly on interruption. Off = lets the current buffered audio finish draining instead of an abrupt cut.'
                  },
                  {
                    key: 'continueSpeakingAfterInterruption',
                    title: 'Continue Speaking After Interruption',
                    desc: 'Adds a brief grace period before honoring an interruption, so a short blip doesn\'t cut MAYRA off instantly.'
                  }
                ].map(item => {
                  const val = (speakingToggles as any)[item.key];
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          {item.key === 'fastResponse' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpeakingToggles(prev => ({ ...prev, [item.key]: !val }))}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer mt-0.5 ${
                          val ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-[#222430]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            val ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* VOICE DETECTION */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  VOICE DETECTION
                </span>

                {[
                  {
                    key: 'noiseSuppression',
                    title: 'Noise Suppression',
                    desc: 'Reduces background noise from the microphone using your device\'s built-in noise suppression hardware.'
                  },
                  {
                    key: 'echoCancellation',
                    title: 'Echo Cancellation',
                    desc: 'Stops MAYRA\'s own voice from being picked up as if you said it - matters most on speakerphone.'
                  },
                  {
                    key: 'autoMicGain',
                    title: 'Automatic Microphone Gain',
                    desc: 'Keeps your voice at a usable volume automatically.'
                  },
                  {
                    key: 'vad',
                    title: 'Voice Activity Detection',
                    desc: 'How eagerly MAYRA decides you\'ve finished talking. This can\'t be dialed back - it\'s how she knows when to reply at all - but this controls sensitivity.'
                  },
                  {
                    key: 'backgroundFilter',
                    title: 'Background Noise Filter',
                    desc: 'Cuts out ambient hums, fan noise, and traffic hum.'
                  }
                ].map(item => {
                  const val = (detectionToggles as any)[item.key];
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetectionToggles(prev => ({ ...prev, [item.key]: !val }))}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer mt-0.5 ${
                          val ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-[#222430]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            val ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
