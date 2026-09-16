import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Sparkles, ChevronRight, Globe, 
  Vibrate, Cpu, Layers, Lock, Shield
} from 'lucide-react';
import { AppearanceConfig, AssistantConfig } from '../../types';

interface AuraControlViewProps {
  appearanceConfig: AppearanceConfig;
  assistantConfig: AssistantConfig;
  onChangeAppearance: (updated: Partial<AppearanceConfig>) => void;
  onChangeAssistant: (updated: Partial<AssistantConfig>) => void;
  onBack: () => void;
  onNavigateToSubscription?: () => void;
}

export const AuraControlView: React.FC<AuraControlViewProps> = ({
  appearanceConfig,
  assistantConfig,
  onChangeAppearance,
  onChangeAssistant,
  onBack,
  onNavigateToSubscription
}) => {
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAuraSignatureModal, setShowAuraSignatureModal] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <h1 className="text-sm font-extrabold text-[#ff2a4b] tracking-widest uppercase">
          AURA CONTROL
        </h1>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none pb-24">
        {/* Section 1: Visual identity */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-400">
            Visual identity
          </p>

          <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(255,42,75,0.4)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Launcher Core
                </h3>
                <p className="text-[11px] text-gray-400">
                  Lifetime Premium Required
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToSubscription}
              className="w-full py-3 px-4 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-[#ff2a4b]" />
              <span>Unlock Lifetime Identity</span>
            </button>
          </div>
        </div>

        {/* Section 2: Core interaction */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-400">
            Core interaction
          </p>

          <div className="space-y-2">
            {/* Aura Signature */}
            <div 
              onClick={() => setShowAuraSignatureModal(true)}
              className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between hover:bg-[#161720] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1b24] border border-white/5 flex items-center justify-center text-[#ff2a4b] shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Aura Signature
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Current: Crimson Aura
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            {/* Language */}
            <div 
              onClick={() => setShowLanguageModal(true)}
              className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between hover:bg-[#161720] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1b24] border border-white/5 flex items-center justify-center text-[#ff2a4b] shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Language
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Current: Auto (Hinglish)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            {/* Haptic Feedback */}
            <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1b24] border border-white/5 flex items-center justify-center text-[#ff2a4b] shrink-0">
                  <Vibrate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Haptic Feedback
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Somatic vibrations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHapticFeedback(!hapticFeedback)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  hapticFeedback ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* System Nodes */}
            <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between hover:bg-[#161720] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1b24] border border-white/5 flex items-center justify-center text-[#ff2a4b] shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    System Nodes
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Access all hardware nodes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Footer Brand Watermark */}
        <div className="pt-8 text-center space-y-1">
          <p className="text-[11px] font-extrabold text-[#ff2a4b] tracking-wider uppercase">
            MYRA MULTIMODAL SYSTEM
          </p>
          <p className="text-[10px] text-gray-500 font-medium">
            Engineered for Zafer • 2026
          </p>
        </div>
      </div>
    </div>
  );
};
