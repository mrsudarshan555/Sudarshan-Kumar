import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Key, ExternalLink, Cpu, Check, 
  Sparkles, Sliders, ShieldCheck, AlertCircle, Save
} from 'lucide-react';
import { UserPersonalConfig } from '../../types';

interface APICloudSettingsViewProps {
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  onBack: () => void;
}

export const APICloudSettingsView: React.FC<APICloudSettingsViewProps> = ({
  personalConfig,
  setPersonalConfig,
  onBack
}) => {
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState<'openrouter' | 'groq' | 'gemini' | 'deepseek'>('gemini');
  const [openRouterKey, setOpenRouterKey] = useState(personalConfig.openRouterApiKey || '');
  const [groqKey, setGroqKey] = useState(personalConfig.groqApiKey || '');
  const [geminiKey, setGeminiKey] = useState(personalConfig.geminiApiKey || '');
  const [deepSeekKey, setDeepSeekKey] = useState(personalConfig.deepSeekApiKey || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setPersonalConfig(prev => ({
      ...prev,
      openRouterApiKey: openRouterKey,
      groqApiKey: groqKey,
      geminiApiKey: geminiKey,
      deepSeekApiKey: deepSeekKey
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
            API & Cloud Settings
          </h1>
          <p className="text-[11px] text-gray-400">
            Configure all API keys and services
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none pb-28">
        {/* OpenRouter (Recommended) */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1a1b24] border border-white/10 flex items-center justify-center text-purple-400">
                <Key className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">
                OpenRouter API Keys (Recommended)
              </span>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Get key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Enter OpenRouter API keys separated by commas for load balancing and high availability.
          </p>

          <input
            type="password"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400/60 transition-colors font-mono"
          />
        </div>

        {/* Primary LLM Model */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            PRIMARY LLM MODEL
          </span>

          <div className="space-y-2">
            {[
              { id: 'openrouter', title: 'OpenRouter', subtitle: 'Auto-fallback across top models' },
              { id: 'groq', title: 'Groq', subtitle: 'Ultra-fast inference (Llama 3.3 70B)' },
              { id: 'gemini', title: 'Gemini', subtitle: 'Best Quality (Multimodal Gemini 2.5/Flash)' },
              { id: 'deepseek', title: 'DeepSeek', subtitle: 'Good Reasoning (DeepSeek V3 / R1)' }
            ].map(m => {
              const isSelected = selectedPrimaryModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedPrimaryModel(m.id as any)}
                  className={`p-3.5 rounded-2xl bg-[#121318] border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-[#161720]'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {m.title}
                      {m.id === 'gemini' && (
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                          Recommended
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {m.subtitle}
                    </p>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-purple-500 bg-purple-600' : 'border-gray-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Groq API Keys */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Groq API Keys
            </span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Get key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400/60 transition-colors font-mono"
          />
        </div>

        {/* Gemini API Keys */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Gemini API Keys
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Get key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400/60 transition-colors font-mono"
          />
        </div>

        {/* DeepSeek API Keys */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              DeepSeek API Keys
            </span>
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Get key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            value={deepSeekKey}
            onChange={(e) => setDeepSeekKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400/60 transition-colors font-mono"
          />
        </div>

        {/* Deep Research (Tavily AI) */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Deep Research (Tavily AI)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Real-time web search and live grounding queries for factual answers.
          </p>
          <button
            onClick={() => alert('Configuring Tavily Deep Research provider...')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 text-xs font-bold text-gray-200 transition-colors cursor-pointer"
          >
            Configure Deep Research Settings
          </button>
        </div>
      </div>

      {/* Save Button (Bottom Bar) */}
      <div className="p-4 bg-[#0d0e14] border-t border-white/5 absolute bottom-0 inset-x-0">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
