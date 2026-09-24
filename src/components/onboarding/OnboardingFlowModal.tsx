import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Mic, Camera, Shield, ArrowRight, ArrowLeft, Check, 
  Moon, Sun, Bell, User, Mail, Smartphone, RefreshCw, Layers,
  Globe, AlertTriangle, Search
} from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';
import { 
  UserPersonalConfig, AssistantConfig, AppearanceConfig, 
  PermissionItem, AppThemePreset 
} from '../../types';
import { useLanguage, LanguageCode } from '../../services/i18n/languageContext';

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  assistantConfig: AssistantConfig;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  appearanceConfig: AppearanceConfig;
  setAppearanceConfig: React.Dispatch<React.SetStateAction<AppearanceConfig>>;
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
}

// Audio chime synthesis via Web Audio API
function playCelebrationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.85);
    });
  } catch (e) {
    // Ignore audio error
  }
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onClose,
  personalConfig,
  setPersonalConfig,
  assistantConfig,
  setAssistantConfig,
  appearanceConfig,
  setAppearanceConfig,
  permissions,
  setPermissions
}) => {
  // Step 0: Language Selection (Before anything else - requirement 2)
  // Step 1: Welcome Hero (Exact match of user's screenshot)
  // Step 2: Sign In & Profile Setup (User enters their name, email/phone)
  // Step 3: System Permissions (With inline explanations, sub-capabilities, risk warnings, and privacy policy)
  // Step 4 is intentionally removed: the app follows the system theme at first launch.
  // Step 5: Final Ready to Launch (Welcome Hero with user's customized name)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [languageSearchQuery, setLanguageSearchQuery] = useState<string>('');

  const { currentLanguage, setLanguage, languages, t, getPermissionDetails } = useLanguage();

  // Local state for interactive editing before final sync
  const [tempName, setTempName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mayra_user_name') || personalConfig.preferredName || personalConfig.fullName || '';
    }
    return personalConfig.preferredName || personalConfig.fullName || '';
  });
  const [tempEmail, setTempEmail] = useState<string>(personalConfig.email || '');
  const [tempPhone, setTempPhone] = useState<string>('');
  const [tempLanguage, setTempLanguage] = useState<string>(currentLanguage || assistantConfig.language || 'hi');
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [allGrantedFeedback, setAllGrantedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsCelebrating(false);
      const savedName = localStorage.getItem('mayra_user_name') || personalConfig.preferredName || personalConfig.fullName || '';
      setTempName(savedName);
      setTempLanguage(assistantConfig.language || 'hi');
    }
  }, [isOpen]);

  // LIVE THEME SYNC: Whenever appearanceConfig changes, reflect immediately on documentElement
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (appearanceConfig.darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [appearanceConfig.darkMode, appearanceConfig.appTheme]);

  if (!isOpen) return null;

  // Active display name for greetings
  const displayGreetingName = tempName.trim() || personalConfig.preferredName || personalConfig.fullName || 'Zafer';

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep === 5) {
      setCurrentStep(3);
      return;
    }
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleNameChange = (val: string) => {
    setTempName(val);
    const trimmed = val.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_user_name', trimmed);
    }
    setPersonalConfig(prev => {
      const updated = {
        ...prev,
        preferredName: trimmed,
        fullName: prev.fullName || trimmed
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mayra_personal_config', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const handleGrantAllPermissions = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      status: 'granted' as const,
      statusLabel: 'Granted',
      actionLabel: 'Granted'
    })));
    setAllGrantedFeedback(true);
    setTimeout(() => setAllGrantedFeedback(false), 2000);
  };

  const handleToggleSinglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'granted' ? 'denied' : 'granted';
        return {
          ...p,
          status: nextStatus as any,
          statusLabel: nextStatus === 'granted' ? 'Granted' : 'Grant',
          actionLabel: nextStatus === 'granted' ? 'Granted' : 'Grant'
        };
      }
      return p;
    }));
  };

  const handleSelectLanguage = (lang: string) => {
    setTempLanguage(lang);
    setLanguage(lang as LanguageCode);
    setAssistantConfig(prev => ({ ...prev, language: lang }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_preferred_language', lang);
    }
  };

  const handleToggleDarkMode = (dark: boolean) => {
    setAppearanceConfig(prev => ({
      ...prev,
      darkMode: dark
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_dark_mode', String(dark));
      if (dark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  };

  const handleCompleteOnboarding = () => {
    setIsCelebrating(true);
    playCelebrationChime();

    // Persist verified user details & onboarding completion
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_onboarding_completed', 'true');
      if (tempName.trim()) {
        localStorage.setItem('mayra_user_name', tempName.trim());
      }
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Core permissions for step 3
  const corePermissions = permissions.filter(p => 
    ['mic_core', 'cam_vision', 'storage_vault', 'notif_alerts'].includes(p.id)
  );

  const filteredLanguages = languages.filter(l => 
    l.label.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    l.native.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
  );

  const currentLangObj = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-[#05060b] text-white select-none overflow-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* STEP 0: LANGUAGE SELECTION (BEFORE ANYTHING ELSE - REQUIREMENT 2) */}
      {/* ========================================================================= */}
      {currentStep === 0 && (
        <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0e0f17] via-[#090a10] to-[#05060b]">
          {/* Glowing Atmospheric Aura */}
          <div 
            className="absolute top-0 right-0 w-[350px] h-[350px] opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(99, 102, 241, 0.2) 40%, transparent 70%)',
              filter: 'blur(50px)'
            }}
          />

          {/* Top App Bar */}
          <div className="relative z-10 pt-6 px-6 flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider text-purple-300 uppercase block">
                  MAYRA AI • STEP 1 OF 5
                </span>
                <span className="text-[11px] text-gray-400">
                  Initial Setup
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-950/70 text-purple-300 text-[10px] font-bold border border-purple-500/40">
              16 Languages
            </span>
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/20">
            <div className="space-y-1 text-center max-w-sm mx-auto">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Choose Your Language
              </h1>
              <p className="text-sm font-semibold text-purple-400">
                अपनी पसंदीदा भाषा चुनें
              </p>
              <p className="text-[11.5px] text-gray-400 leading-relaxed pt-1">
                Select how you'd like MAYRA to communicate. All settings, permission explanations, risk alerts, and privacy policies will immediately adapt to this language.
              </p>
            </div>

            {/* Search Filter Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={languageSearchQuery}
                onChange={(e) => setLanguageSearchQuery(e.target.value)}
                placeholder="Search language / भाषा खोजें..."
                className="w-full bg-[#12131a] border border-white/10 focus:border-purple-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Languages List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <div
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/30'
                        : 'bg-[#121318] border-white/5 hover:border-white/15 hover:bg-[#161720]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                          : 'bg-white/5 text-gray-300'
                      }`}>
                        {lang.native.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {lang.label}
                          </span>
                          {lang.badge && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                              {lang.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-purple-300/80 font-medium">
                          {lang.native}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                        : 'border-white/20 bg-transparent'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="relative z-10 p-5 bg-[#0a0b10]/90 backdrop-blur-xl border-t border-white/10 shrink-0">
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>{t.continueBtn} ({currentLangObj.label})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1 & STEP 5: WELCOME HERO (EXACT MATCH OF USER'S SCREENSHOT IMG_20260915_193902.jpg) */}
      {/* ========================================================================= */}
      {(currentStep === 1 || currentStep === 5) && (
        <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-hidden">
          
          {/* Top 60%: High-Altitude Deep Oceanic / Atmospheric Sky Aurora */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #103487 0%, #1e40af 18%, #2563eb 42%, #1d4ed8 58%, #0d1a3a 78%, #05060b 100%)'
            }}
          >
            {/* Luminous Diffuse Clouds & Sky Light Texture */}
            <div 
              className="absolute top-0 right-0 w-[380px] h-[340px] opacity-65 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 70% 30%, rgba(219, 234, 254, 0.55) 0%, rgba(147, 197, 253, 0.25) 45%, transparent 70%)',
                filter: 'blur(35px)'
              }}
            />
            <div 
              className="absolute top-12 left-0 w-[320px] h-[300px] opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 70%)',
                filter: 'blur(45px)'
              }}
            />
          </div>

          {/* Top Spacer & App Bar */}
          <div className="relative z-10 pt-6 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep === 1 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 -ml-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer mr-1"
                  title="Change Language"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
                MAYRA AI
              </span>
            </div>
            {currentStep === 5 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                Ready to Launch
              </span>
            ) : (
              <button
                onClick={() => setCurrentStep(0)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
              >
                <Globe className="w-3 h-3 text-purple-300" />
                <span>{currentLangObj.native}</span>
              </button>
            )}
          </div>

          {/* Bottom Area: Content & Action Button (Exact Layout from Image) */}
          <div className="relative z-10 px-6 pb-6 flex flex-col justify-end">
            
            {/* Greeting: Hello {Name} */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-white/85 text-lg font-normal tracking-wide mb-2.5"
            >
              Hello {displayGreetingName}
            </motion.p>

            {/* Headline: Increase your Productivity with Mayra AI */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[34px] sm:text-[40px] leading-[1.12] text-white tracking-tight mb-8"
            >
              <span className="font-normal block">Increase your</span>
              <span className="font-extrabold block text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Productivity</span>
              <span className="font-normal">with </span>
              <span className="font-bold">Mayra AI</span>
            </motion.h1>

            {/* Pagination Indicators */}
            <div className="flex items-center gap-1.5 mb-6">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === 1 ? 'w-8 bg-white' : 'w-4 bg-white/30'
                }`} 
              />
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep > 1 && currentStep < 5 ? 'w-8 bg-white' : 'w-4 bg-white/30'
                }`} 
              />
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === 5 ? 'w-8 bg-white' : 'w-4 bg-white/30'
                }`} 
              />
            </div>

            {/* Exact Action Button from Screenshot */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentStep === 1) {
                  setCurrentStep(2); // Proceed to Sign In / Profile setup
                } else {
                  handleCompleteOnboarding(); // Finish and launch
                }
              }}
              className="w-full h-15 rounded-full p-1.5 bg-gradient-to-r from-[#4477f7] via-[#3b82f6] to-[#60a5fa] shadow-[0_8px_25px_rgba(59,130,246,0.45)] flex items-center justify-between cursor-pointer active:brightness-95 transition-all"
            >
              {/* White Circle Arrow on the Left */}
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#2563eb] shadow-md shrink-0">
                <ArrowRight className="w-5 h-5 stroke-[2.6]" />
              </div>

              {/* Center Text: Get Started / Launch MAYRA */}
              <span className="text-white font-semibold text-base sm:text-lg tracking-wide select-none">
                {currentStep === 1 ? (t.getStarted || 'Get Started') : (t.launchMayra || 'Launch MAYRA')}
              </span>

              {/* Right Star / Sparkle Icon */}
              <div className="w-12 flex items-center justify-center text-white/95">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
            </motion.button>

            {/* Android Navigation Home Bar Indicator at Bottom */}
            <div className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-4" />
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* STEP 2: SIGN IN & USER PROFILE SETUP */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-y-auto px-6 py-6 scrollbar-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                STEP 2 OF 5
              </span>
              <h2 className="text-base font-bold text-white">Sign In & Profile</h2>
            </div>
            <div className="w-8" />
          </div>

          {/* Body */}
          <div className="flex-1 py-4 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">
                Welcome! Tell us your name
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                MAYRA will strictly address you by this name and remember your preferences.
              </p>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center py-2">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <div className="w-full h-full bg-[#121318] rounded-[14px] flex items-center justify-center overflow-hidden">
                  <User className="w-10 h-10 text-white/80" />
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 max-w-sm mx-auto w-full">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Your Name / Call-Sign <span className="text-purple-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your name (e.g. Zafer, Rahul...)"
                    className="w-full bg-[#13151f] border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all shadow-inner"
                    autoFocus
                  />
                  {tempName.trim() && (
                    <span className="absolute right-3 text-emerald-400">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-400 mt-1 font-medium">
                  {tempName.trim() ? `MAYRA will address you as: "${tempName.trim()} भाई"` : 'Please type your name above'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => {
                      setTempEmail(e.target.value);
                      setPersonalConfig(prev => ({ ...prev, email: e.target.value }));
                    }}
                    placeholder="you@example.com"
                    className="w-full bg-[#13151f] border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all shadow-inner"
                  />
                  <Mail className="absolute right-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#13151f] border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all shadow-inner"
                  />
                  <Smartphone className="absolute right-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-3 shrink-0">
            <button
              onClick={() => {
                if (!tempName.trim()) {
                  handleNameChange('Zafer');
                }
                setCurrentStep(3);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>{t.continueBtn} to Permissions (अनुमतियाँ दें)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: SYSTEM PERMISSIONS (INLINE EXPLANATIONS, RISKS & PRIVACY POLICY) */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-y-auto px-6 py-6 scrollbar-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                STEP 3 OF 5
              </span>
              <h2 className="text-base font-bold text-white">System Permissions</h2>
            </div>
            <div className="w-8" />
          </div>

          {/* Body */}
          <div className="flex-1 py-4 space-y-3.5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">
                Hardware & Sensor Access
              </h3>
              <p className="text-xs text-purple-300/90 max-w-xs mx-auto">
                {t.permissionCenterNotice || 'Enable device hardware for real-time voice, camera vision, and system intelligence.'}
              </p>
            </div>

            {/* Grant All Button */}
            <button
              onClick={handleGrantAllPermissions}
              className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                allGrantedFeedback
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-500/30 text-white'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Allow All Permissions (सभी अनुमतियाँ दें)</span>
            </button>

            {/* Permissions List with Inline Explanations, Risks, and Privacy Policies */}
            <div className="space-y-3">
              {corePermissions.map((perm) => {
                const isGranted = perm.status === 'granted';
                const details = getPermissionDetails(perm.id);

                return (
                  <div
                    key={perm.id}
                    className="p-3.5 rounded-2xl bg-[#121318] border border-white/10 flex flex-col gap-2.5 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isGranted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'
                        }`}>
                          {perm.id === 'mic_core' && <Mic className="w-4 h-4" />}
                          {perm.id === 'cam_vision' && <Camera className="w-4 h-4" />}
                          {perm.id === 'storage_vault' && <Shield className="w-4 h-4" />}
                          {perm.id === 'notif_alerts' && <Bell className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{perm.name}</p>
                          <span className="text-[10px] text-purple-300 font-medium">
                            {details.description || perm.description}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSinglePermission(perm.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer active:scale-95 transition-all ${
                          isGranted 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'bg-purple-600 hover:bg-purple-500 border-purple-400/40 text-white'
                        }`}
                      >
                        {isGranted ? t.granted : t.grant}
                      </button>
                    </div>

                    {/* Sub-capabilities */}
                    {details.subCapabilities && (
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-purple-300 block">
                          {t.subCapabilitiesLabel || 'Included Capabilities:'}
                        </span>
                        <p className="text-[10px] text-gray-300 leading-relaxed font-normal">
                          {details.subCapabilities}
                        </p>
                      </div>
                    )}

                    {/* Risk Warning Alert */}
                    {details.riskWarning && (
                      <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2 text-[10px] text-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>⚠️ Risk Warning:</strong> {details.riskWarning}</span>
                      </div>
                    )}

                    {/* Privacy Policy Inline Note */}
                    {details.privacyPolicy && (
                      <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[10px] text-purple-200/90 leading-relaxed">
                        <strong className="text-purple-300">Privacy Policy:</strong> {details.privacyPolicy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-3 shrink-0">
            <button
              onClick={() => setCurrentStep(5)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
    </div>
  );
};
