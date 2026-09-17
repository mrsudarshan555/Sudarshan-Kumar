import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Sparkles, ChevronRight, Globe, 
  Vibrate, Cpu, Layers, Lock, Shield
} from 'lucide-react';
import { AppearanceConfig, AssistantConfig } from '../../types';
import { useLanguage } from '../../services/i18n/languageContext';
import { LanguageSelectionModal } from './LanguageSelectionModal';

interface AuraControlViewProps {
  appearanceConfig: AppearanceConfig;
  assistantConfig: AssistantConfig;
  onChangeAppearance: (updated: Partial<AppearanceConfig>) => void;
  onChangeAssistant: (updated: Partial<AssistantConfig>) => void;
  onBack: () => void;
  onNavigateToSubscription?: () => void;
  isSubscribed?: boolean;
}

export const AuraControlView: React.FC<AuraControlViewProps> = ({
  appearanceConfig,
  assistantConfig,
  onChangeAppearance,
  onChangeAssistant,
  onBack,
  onNavigateToSubscription,
  isSubscribed = false
}) => {
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAuraSignatureModal, setShowAuraSignatureModal] = useState(false);
  const [launcherCoreEnabled, setLauncherCoreEnabled] = useState(true);
  const [holographicCore, setHolographicCore] = useState(true);

  const { currentLanguage, languages, t } = useLanguage();
  const currentLangObj = languages.find(l => l.code === currentLanguage) || languages[0];

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

        <h1 className="text-sm font-extrabold text-purple-300 tracking-widest uppercase">
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Launcher Core
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isSubscribed ? 'Premium Identity Active' : 'Lifetime Premium Required'}
                </p>
              </div>
            </div>

            {isSubscribed ? (
              <div className="space-y-3 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Launcher Core Override</p>
                    <p className="text-[10px] text-gray-400">High-performance background rendering</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLauncherCoreEnabled(!launcherCoreEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      launcherCoreEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        launcherCoreEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Holographic Avatar Core</p>
                    <p className="text-[10px] text-gray-400">Volumetric particle aura shaders</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHolographicCore(!holographicCore)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      holographicCore ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        holographicCore ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onNavigateToSubscription}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Unlock Lifetime Identity</span>
              </button>
            )}
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
                <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Aura Signature
                  </h4>
                  <p className="text-[11px] text-purple-300">
                    Current: Cosmic Velvet Aura
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
                <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Language / भाषा
                  </h4>
                  <p className="text-[11px] text-purple-300 font-medium">
                    Current: {currentLangObj.label} ({currentLangObj.native})
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            {/* Haptic Feedback */}
            <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
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
                  hapticFeedback ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-[#222430]'
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
                <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
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
          <p className="text-[11px] font-extrabold text-purple-400 tracking-wider uppercase">
            MAYRA MULTIMODAL SYSTEM
          </p>
          <p className="text-[10px] text-gray-500 font-medium">
            Engineered for Zafer • 2026
          </p>
        </div>
      </div>

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </div>
  );
};
