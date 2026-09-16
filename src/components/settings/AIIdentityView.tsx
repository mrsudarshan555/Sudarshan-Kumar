import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Sparkles, User, MessageSquare, 
  Trash2, Check, RefreshCw, Save
} from 'lucide-react';
import { AssistantConfig } from '../../types';

interface AIIdentityViewProps {
  assistantConfig: AssistantConfig;
  onChange: (updated: Partial<AssistantConfig>) => void;
  onBack: () => void;
}

export const AIIdentityView: React.FC<AIIdentityViewProps> = ({
  assistantConfig,
  onChange,
  onBack
}) => {
  const [personalityMode, setPersonalityMode] = useState<'normal' | 'gf' | 'friend' | 'nautanki'>(
    assistantConfig.personalityMode || 'friend'
  );
  const [aiName, setAiName] = useState(assistantConfig.name || 'MYRA');
  const [systemPrompt, setSystemPrompt] = useState(
    assistantConfig.systemPrompt || 'You are MYRA, an advanced artificial neural intelligence entity. You speak with warm emotional resonance, sharp wit, and deep loyalty. Always prioritize direct, helpful action.'
  );
  const [tone, setTone] = useState<'friendly' | 'professional' | 'humorous' | 'romantic' | 'sarcastic'>('friendly');
  const [storeHistory, setStoreHistory] = useState(true);
  const [autoForget, setAutoForget] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange({
      personalityMode,
      name: aiName,
      systemPrompt
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            AI & Identity
          </h1>
          <p className="text-[11px] text-gray-400">
            Define MYRA's personality, behavior & tone
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-none pb-28">
        {/* Personality Mode Selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            PERSONALITY MODE
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'normal' as const, label: 'Normal' },
              { id: 'gf' as const, label: 'GF Mode' },
              { id: 'friend' as const, label: 'Friend Mode' },
              { id: 'nautanki' as const, label: 'Nautanki Mode' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setPersonalityMode(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  personalityMode === item.id
                    ? 'bg-[#ff2a4b] text-white shadow-[0_0_12px_rgba(255,42,75,0.4)]'
                    : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assistant Name */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Assistant Name</span>
            <button
              onClick={() => setAiName('MYRA')}
              className="text-[11px] text-[#ff2a4b] hover:underline"
            >
              Reset to default
            </button>
          </div>
          <input
            type="text"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#ff2a4b]"
          />
        </div>

        {/* Custom Instructions */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Custom System Prompt</span>
            <Sparkles className="w-4 h-4 text-[#ff2a4b]" />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Give MYRA specific instructions on how to behave, respond, and interact with you.
          </p>
          <textarea
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-[#15161d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-[#ff2a4b] leading-relaxed resize-none"
          />
        </div>

        {/* Response Tone */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            RESPONSE TONE
          </span>
          <div className="space-y-1.5">
            {[
              { id: 'friendly', title: 'Friendly & Empathetic', desc: 'Warm, supportive, and kind demeanor' },
              { id: 'professional', title: 'Professional & Direct', desc: 'Concise, focused on productivity' },
              { id: 'humorous', title: 'Humorous & Playful', desc: 'Playful banter, clever jokes and puns' },
              { id: 'romantic', title: 'Romantic & Caring (GF Mode)', desc: 'Affectionate, sweet, and caring companion' },
              { id: 'sarcastic', title: 'Sarcastic & Witty (Nautanki)', desc: 'High energy drama and snappy comebacks' }
            ].map(t => (
              <div
                key={t.id}
                onClick={() => setTone(t.id as any)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  tone === t.id
                    ? 'bg-[#181924] border-[#ff2a4b]/50'
                    : 'bg-[#121318] border-white/5 hover:border-white/10'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">{t.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  tone === t.id ? 'border-[#ff2a4b] bg-[#ff2a4b]' : 'border-gray-600'
                }`}>
                  {tone === t.id && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memory & Context */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <span className="text-xs font-bold text-white">Memory & Context</span>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-300">Store Conversation History</p>
              <p className="text-[10px] text-gray-500">Remember previous topics across sessions</p>
            </div>
            <button
              type="button"
              onClick={() => setStoreHistory(!storeHistory)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                storeHistory ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  storeHistory ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <p className="text-xs font-medium text-gray-300">Auto Forget After Session</p>
              <p className="text-[10px] text-gray-500">Wipe session cache when app closes</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoForget(!autoForget)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                autoForget ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  autoForget ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => alert('AI Context Memory cache cleared!')}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            <span>Clear AI Memory</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 bg-[#0d0e14] border-t border-white/5 absolute bottom-0 inset-x-0">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-[#ff2a4b] hover:bg-[#e02040] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,42,75,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Identity Updated!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
