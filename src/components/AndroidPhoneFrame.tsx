import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AssistantStatus, UserPersonalConfig, AssistantConfig, 
  VoiceGuardianConfig, AdvancedConfig, SkillItem, SubAgentItem, 
  IntegrationItem, MemoryItem, ChatMessage, SettingsSubScreen, ActiveTab,
  PermissionItem, AppearanceConfig, AgentTaskContext
} from '../types';
import { UserAccount } from '../types/auth';
import { HomeScreen } from './screens/HomeScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { MemoriesScreen } from './screens/MemoriesScreen';
import { ChatScreen } from './screens/ChatScreen';
import { MayraSettingsScreen } from './settings/MayraSettingsScreen';
import { MayraLogo } from './common/MayraLogo';
import { VoiceControlOrb } from './voice/VoiceControlOrb';
import { useMayraWakeWord } from '../hooks/useMayraWakeWord';
import { FloatingMayraOverlay } from './overlay/FloatingMayraOverlay';
import { BackgroundGestureOverlayBubble } from './overlay/BackgroundGestureOverlayBubble';
import { AgentTaskHUD } from './agent/AgentTaskHUD';
import { ProactiveGuardianHUD } from './agent/ProactiveGuardianHUD';
import { ProactiveAlert } from '../services/automation/ProactiveSmartGuardianEngine';
import { 
  Home, Camera, Brain, MessageSquare, MessageCircleMore,
  Settings as SettingsIcon, Shield,
  Trash2, Plus, Zap, Smartphone, UserCheck, Sparkles, Search
} from 'lucide-react';
import { useLanguage } from '../services/i18n/languageContext';
import { MarkLIIUndoToast } from './MarkLIIUndoToast';
import { MarkLIIConfirmationModal } from './MarkLIIConfirmationModal';
import { getThemePreset } from '../utils/themePresets';
import { MayraErrorBoundary } from './common/MayraErrorBoundary';
import { useAppLock } from './security/useAppLock';
import { AppLockModal } from './security/AppLockModal';
import { RoutinesModal } from './routines/RoutinesModal';
import { HomeScreenWidgetModal } from './widgets/HomeScreenWidgetModal';
import { GlassAuthModal } from './auth/GlassAuthModal';
import { AccountSyncService } from '../services/auth/accountSyncService';
import { FloatingHomeQuizModal } from './quiz/FloatingHomeQuizModal';
import { QuizPayload } from '../types';
import { MicStatusIndicator } from './voice/MicStatusIndicator';
import { EdgeGlowRing } from './character/EdgeGlowRing';

interface AndroidPhoneFrameProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  currentSubScreen: SettingsSubScreen;
  setCurrentSubScreen: (screen: SettingsSubScreen) => void;
  status: AssistantStatus;
  isListeningMode?: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  onSubmitPrompt: (customText?: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => void;
  onTriggerVoice: () => void;
  onStartPtt?: () => void;
  onStopPtt?: () => void;
  isPttActive?: boolean;
  onSelectRoutineAction: (action: string) => void;
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  onClearChat: () => void;
  // Agent V1 Props
  activeAgentTask?: AgentTaskContext | null;
  onApproveAgentAction?: () => void;
  onRejectAgentAction?: () => void;
  onCancelAgentTask?: () => void;
  // Feature C: Proactive Guardian Alert Props
  activeProactiveAlert?: ProactiveAlert | null;
  onDismissProactiveAlert?: () => void;
  // Configs
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  assistantConfig: AssistantConfig;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  appearanceConfig: AppearanceConfig;
  setAppearanceConfig: React.Dispatch<React.SetStateAction<AppearanceConfig>>;
  voiceGuardianConfig: VoiceGuardianConfig;
  setVoiceGuardianConfig: React.Dispatch<React.SetStateAction<VoiceGuardianConfig>>;
  advancedConfig: AdvancedConfig;
  setAdvancedConfig: React.Dispatch<React.SetStateAction<AdvancedConfig>>;
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
  skills: SkillItem[];
  setSkills: React.Dispatch<React.SetStateAction<SkillItem[]>>;
  subAgents: SubAgentItem[];
  setSubAgents: React.Dispatch<React.SetStateAction<SubAgentItem[]>>;
  integrations: IntegrationItem[];
  memories: MemoryItem[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onOpenOnboarding?: () => void;
}

export const AndroidPhoneFrame: React.FC<AndroidPhoneFrameProps> = ({
  activeTab,
  setActiveTab,
  isSettingsOpen,
  setIsSettingsOpen,
  currentSubScreen,
  setCurrentSubScreen,
  status,
  isListeningMode = false,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onStartPtt,
  onStopPtt,
  isPttActive = false,
  onSelectRoutineAction,
  onSendVisionQuery,
  onClearChat,
  activeAgentTask,
  onApproveAgentAction,
  onRejectAgentAction,
  onCancelAgentTask,
  activeProactiveAlert,
  onDismissProactiveAlert,
  personalConfig,
  setPersonalConfig,
  assistantConfig,
  setAssistantConfig,
  appearanceConfig,
  setAppearanceConfig,
  voiceGuardianConfig,
  setVoiceGuardianConfig,
  advancedConfig,
  setAdvancedConfig,
  permissions,
  setPermissions,
  skills,
  setSkills,
  subAgents,
  setSubAgents,
  integrations,
  memories,
  setMemories,
  messages,
  setMessages,
  onOpenOnboarding
}) => {
  const { t } = useLanguage();
  const [isFloatingOverlayOpen, setIsFloatingOverlayOpen] = useState<boolean>(false);
  const [scanCaptureSignal, setScanCaptureSignal] = useState<number>(0);
  const [memoriesAddSignal, setMemoriesAddSignal] = useState<number>(0);
  const [isGearRotating, setIsGearRotating] = useState<boolean>(false);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState<boolean>(false);
  const [isWidgetGuideOpen, setIsWidgetGuideOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Active sync account
  const authService = AccountSyncService.getInstance();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(authService.getCurrentUser());

  // Interactive Objective Quiz Modal for Home Screen ("Google dabba/varg jaisa compact box")
  const [activeHomeQuiz, setActiveHomeQuiz] = useState<QuizPayload | null>(null);

  useEffect(() => {
    const handleQuizTriggered = (e: any) => {
      if (e.detail) {
        setActiveHomeQuiz(e.detail);
      }
    };
    const handleQuizUpdated = (e: any) => {
      if (e.detail) {
        setActiveHomeQuiz(e.detail);
      }
    };
    window.addEventListener('mayra_active_quiz_triggered', handleQuizTriggered);
    window.addEventListener('mayra_active_quiz_updated', handleQuizUpdated);
    return () => {
      window.removeEventListener('mayra_active_quiz_triggered', handleQuizTriggered);
      window.removeEventListener('mayra_active_quiz_updated', handleQuizUpdated);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [authService]);

  // App Lock Security State & Persistence
  const {
    config: appLockConfig,
    isLocked,
    lockApp,
    unlockApp,
    verifyPin,
    verifyBiometric,
    updateConfig: updateAppLockConfig
  } = useAppLock();

  // Tab Directional Animation Logic
  const tabOrder: ActiveTab[] = ['home', 'scan', 'memories', 'chat'];
  const [direction, setDirection] = useState<number>(0);

  const handleTabSwitch = (newTab: ActiveTab) => {
    const prevIndex = tabOrder.indexOf(activeTab);
    const nextIndex = tabOrder.indexOf(newTab);
    setDirection(nextIndex >= prevIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const isDark = appearanceConfig?.darkMode ?? true;

  const handleOpenSettingsWithSpring = () => {
    setIsGearRotating(true);
    setTimeout(() => {
      setIsSettingsOpen(true);
      setCurrentSubScreen('root');
      setIsGearRotating(false);
    }, 200);
  };

  // Background Wake-Word activation ("Mayra", "Hey Mayra", "Mayra utho") & continuous listening
  const { isListeningForWakeWord } = useMayraWakeWord({
    status,
    isListeningMode,
    enabled: true,
    onSpeechCaptured: (text) => {
      setInputText(text);
      onSubmitPrompt(text);
    },
    onWakeWordDetected: (query) => {
      setIsFloatingOverlayOpen(true);
      if (query && query.length > 1) {
        setInputText(query);
        onSubmitPrompt(query);
      } else {
        onTriggerVoice();
      }
    }
  });

  const handleOpenPermissions = () => {
    setIsSettingsOpen(true);
    setCurrentSubScreen('permissions');
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.getAttribute('type') !== 'button' && target.getAttribute('type') !== 'file'))) {
        setIsKeyboardVisible(prev => (prev ? prev : true));
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'TEXTAREA' && active.tagName !== 'INPUT')) {
          setIsKeyboardVisible(prev => (!prev ? prev : false));
        }
      }, 120);
    };

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const active = document.activeElement;
        const isInputActive = active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && (active as HTMLElement).getAttribute('type') !== 'button' && (active as HTMLElement).getAttribute('type') !== 'file'));
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (isInputActive && heightDiff > 120) {
          setIsKeyboardVisible(prev => (prev ? prev : true));
        } else if (!isInputActive || heightDiff < 60) {
          setIsKeyboardVisible(prev => (!prev ? prev : false));
        }
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  const pressTimerRef = useRef<any>(null);
  const isHoldingPttRef = useRef<boolean>(false);
  const pressStartTimeRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only apply PTT hold to voice orb (not scan or memories tab)
    if (activeTab === 'scan' || activeTab === 'memories') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    pressStartTimeRef.current = Date.now();
    isHoldingPttRef.current = false;

    // If currently speaking, immediately interrupt
    if (status === 'SPEAKING') {
      console.log('[MAYRA PTT] Orb pressed while speaking -> Interrupting speech');
      onTriggerVoice();
      return;
    }

    // Set hold threshold timer (260ms)
    pressTimerRef.current = setTimeout(() => {
      console.log('[MAYRA PTT] Center Orb Hold Threshold Reached -> Starting PTT');
      isHoldingPttRef.current = true;
      onStartPtt?.();
    }, 260);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isHoldingPttRef.current) {
      console.log('[MAYRA PTT] Center Orb Pointer Released -> Submitting PTT Turn');
      isHoldingPttRef.current = false;
      onStopPtt?.();
    }
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isHoldingPttRef.current) {
      console.log('[MAYRA PTT] Center Orb Pointer Canceled -> Submitting PTT Turn');
      isHoldingPttRef.current = false;
      onStopPtt?.();
    }
  };

  const handleCenterAction = () => {
    if (activeTab === 'scan') {
      // Trigger Vision Shutter
      setScanCaptureSignal(prev => prev + 1);
    } else if (activeTab === 'memories') {
      // Trigger Memories Add Context Menu
      setMemoriesAddSignal(prev => prev + 1);
    } else {
      // Check if this click is the release of a long PTT hold
      const pressDuration = Date.now() - pressStartTimeRef.current;
      if (pressDuration >= 260 && !isHoldingPttRef.current) {
        // Was a PTT hold-release, ignore synthetic click so we don't toggle hands-free
        return;
      }
      // Genuine short tap: toggle Hands-Free continuous mode!
      console.log('[MAYRA Pipeline] MIC_CLICK: Center Action Button tapped -> Toggling voice mode');
      onTriggerVoice();
    }
  };

  const lastAssistantMessage = messages.filter(m => m.sender === 'mayra').slice(-1)[0]?.text;
  const currentTheme = getThemePreset(appearanceConfig.appTheme);

  return (
    <div 
      className="w-full h-full flex flex-col relative overflow-hidden bg-[#070312] text-slate-100 select-none"
      style={{
        '--theme-primary': currentTheme.primaryHex,
        '--theme-secondary': currentTheme.secondaryHex
      } as React.CSSProperties}
    >

      {/* Edge Glow Gradient Ring for Visual Feedback */}
      <EdgeGlowRing 
        status={status} 
        isBatterySaver={localStorage.getItem('mayra_glow_battery_saver') === 'true'}
      />

      {/* Aura Border Pulse Effect */}
      {appearanceConfig.auraBorderMode && (
        <div className="absolute inset-0 pointer-events-none z-50 border border-purple-500/30 rounded-none shadow-[inset_0_0_24px_rgba(168,85,247,0.15)] animate-pulse" />
      )}
      
      {/* Top Floating Quick Controls Bar (Visible on Memories and Chat screens) */}
      {!isSettingsOpen && (activeTab === 'memories' || activeTab === 'chat') && (
        <div className="h-11 px-3.5 bg-[#120626]/60 backdrop-blur-2xl flex items-center justify-between border-b border-white/10 z-20 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 min-w-0">
            <MayraLogo size={20} showGlow={false} iconVariant={appearanceConfig.launcherIconVariant} />
            <span className="font-sans font-extrabold text-xs text-white tracking-wide truncate">
              ★𝐌₳ᎽⱤ₳ ᥫ᭡
            </span>
            {/* Visual Mute/Unmute Mic Status Indicator */}
            <MicStatusIndicator
              status={status}
              isListeningMode={isListeningMode}
              onToggleMic={onTriggerVoice}
              variant="pill"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* User Account / Sync Profile Button - only shown when not signed in */}
            {!currentUser && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 rounded-full text-[10px] font-sans text-purple-200 transition-all cursor-pointer shadow-sm"
                title="Sign In / Sync Account"
              >
                <UserCheck className="w-3 h-3 text-purple-300" />
                <span>Sign In</span>
              </motion.button>
            )}

            {/* Backup button ONLY on Memories and Chat screens */}
            {(activeTab === 'memories' || activeTab === 'chat') && (
              <button
                onClick={handleOpenPermissions}
                className="flex items-center gap-1 px-2 py-1 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/15 rounded-full text-[10px] font-sans text-slate-300 transition-all whitespace-nowrap shadow-sm cursor-pointer active:scale-95"
                title="Data Backup & Permissions"
              >
                <Shield className="w-3 h-3 text-purple-300 shrink-0 stroke-[1.8]" />
                <span>Backup</span>
              </button>
            )}

            {/* Top Bar Memory Vault button when on Chat screen */}
            {activeTab === 'chat' && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabSwitch('memories')}
                className="p-1.5 text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 rounded-full border border-purple-400/30 backdrop-blur-xl shadow-[0_0_10px_rgba(168,85,247,0.25)] transition-all shrink-0 cursor-pointer"
                title="Open Memory Vault"
              >
                <Brain className="w-3.5 h-3.5 stroke-[1.8]" />
              </motion.button>
            )}

            {/* Top Bar Back to Home button when on Memories screen */}
            {activeTab === 'memories' && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleTabSwitch('home')}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 rounded-full text-[10px] font-sans text-purple-200 transition-all cursor-pointer shadow-sm"
                title="Return to Home"
              >
                <Home className="w-3 h-3 text-purple-300" />
                <span>Home</span>
              </motion.button>
            )}

            {/* If on Chat screen, place Delete / Trash icon right next to Settings */}
            {activeTab === 'chat' && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClearChat}
                className="p-1.5 text-slate-300 hover:text-red-400 bg-white/[0.06] hover:bg-white/[0.14] rounded-full border border-white/15 backdrop-blur-xl transition-all shrink-0 cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenSettingsWithSpring}
              className="p-1.5 text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 rounded-full border border-purple-400/30 backdrop-blur-xl shadow-[0_0_10px_rgba(168,85,247,0.25)] transition-all shrink-0 group cursor-pointer"
              title="Dashboard"
            >
              <SettingsIcon className={`w-3.5 h-3.5 text-purple-300 stroke-[1.8] transition-transform duration-300 ${isGearRotating ? 'rotate-180 scale-110' : 'animate-[spin_10s_linear_infinite]'}`} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Screen Body Viewport with Fast Solid Native Transitions & Error Boundary */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-[#090a0f]">
        <MayraErrorBoundary>
          <AnimatePresence initial={false} custom={direction}>
            {/* Settings Full View */}
            {isSettingsOpen ? (
              <motion.div
                key="settings-screen"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="w-full h-full flex flex-col will-change-transform"
              >
                <MayraSettingsScreen
                  currentSubScreen={currentSubScreen}
                  setCurrentSubScreen={setCurrentSubScreen}
                  onCloseSettings={() => setIsSettingsOpen(false)}
                  personalConfig={personalConfig}
                  setPersonalConfig={setPersonalConfig}
                  assistantConfig={assistantConfig}
                  setAssistantConfig={setAssistantConfig}
                  appearanceConfig={appearanceConfig}
                  setAppearanceConfig={setAppearanceConfig}
                  voiceGuardianConfig={voiceGuardianConfig}
                  setVoiceGuardianConfig={setVoiceGuardianConfig}
                  advancedConfig={advancedConfig}
                  setAdvancedConfig={setAdvancedConfig}
                  permissions={permissions}
                  setPermissions={setPermissions}
                  skills={skills}
                  setSkills={setSkills}
                  subAgents={subAgents}
                  setSubAgents={setSubAgents}
                  integrations={integrations}
                  memories={memories}
                  setMemories={setMemories}
                  messages={messages}
                  setMessages={setMessages}
                  onOpenOnboarding={onOpenOnboarding}
                  appLockConfig={appLockConfig}
                  onUpdateAppLock={updateAppLockConfig}
                  onLockAppNow={lockApp}
                  onLaunchVoice={onTriggerVoice}
                  onLaunchScan={() => {
                    handleTabSwitch('scan');
                    setIsSettingsOpen(false);
                  }}
                  onLaunchChat={() => {
                    handleTabSwitch('chat');
                    setIsSettingsOpen(false);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                custom={direction}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
                className="w-full h-full flex flex-col min-h-0 will-change-transform"
              >
                {activeTab === 'home' && (
                  <HomeScreen
                    status={status}
                    inputText={inputText}
                    setInputText={setInputText}
                    onSubmitPrompt={onSubmitPrompt}
                    onTriggerVoice={onTriggerVoice}
                    onStartPtt={onStartPtt}
                    onStopPtt={onStopPtt}
                    onOpenSettings={handleOpenSettingsWithSpring}
                    onOpenWhiteboard={() => {
                      window.dispatchEvent(new CustomEvent('mayra_toggle_stage_canvas'));
                    }}
                    onOpenRoutines={() => setIsRoutinesOpen(true)}
                    onOpenWidgetGuide={() => setIsWidgetGuideOpen(true)}
                    onOpenSignIn={() => setIsAuthModalOpen(true)}
                    onOpenMemories={() => handleTabSwitch('memories')}
                    currentUser={currentUser}
                    personalConfig={personalConfig}
                    assistantConfig={assistantConfig}
                    appearanceConfig={appearanceConfig}
                    messages={messages}
                    onSwitchMode={(mode) => {
                      setAssistantConfig(prev => ({ ...prev, activeMode: mode }));
                    }}
                  />
                )}
                {activeTab === 'scan' && (
                  <ScannerScreen 
                    onSendVisionQuery={onSendVisionQuery}
                    triggerCaptureSignal={scanCaptureSignal}
                    aspectRatio={appearanceConfig.cameraAspectRatio}
                  />
                )}
                {activeTab === 'memories' && (
                  <MemoriesScreen
                    memories={memories}
                    onAddMemory={(newMem) => {
                      setMemories(prev => [{
                        id: `mem-${Date.now()}`,
                        timestamp: Date.now(),
                        ...newMem
                      }, ...prev]);
                    }}
                    onDeleteMemory={(id) => {
                      setMemories(prev => prev.filter(m => m.id !== id));
                    }}
                    onTogglePin={(id) => {
                      setMemories(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
                    }}
                    onTriggerDirectMessage={(contactName, service) => {
                      handleTabSwitch('chat');
                      const prompt = service === 'whatsapp' 
                        ? `Send a WhatsApp message to ${contactName}` 
                        : `Call ${contactName}`;
                      setInputText(prompt);
                      onSubmitPrompt(prompt);
                    }}
                    triggerAddSignal={memoriesAddSignal}
                    onBack={() => handleTabSwitch('home')}
                  />
                )}
                {activeTab === 'chat' && (
                  <ChatScreen
                    messages={messages}
                    status={status}
                    inputText={inputText}
                    setInputText={setInputText}
                    onSubmitPrompt={onSubmitPrompt}
                    onTriggerVoice={onTriggerVoice}
                    onStartPtt={onStartPtt}
                    onStopPtt={onStopPtt}
                    onClearChat={onClearChat}
                    onOpenVisionScanner={() => handleTabSwitch('scan')}
                    onOpenRoutines={() => setIsRoutinesOpen(true)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </MayraErrorBoundary>
      </div>

      {/* Bottom Navigation Bar — Full Width Flush at Bottom with Top Curvature (rounded-t-[28px]) */}
      {!isSettingsOpen && !isKeyboardVisible && (
        <div className="relative w-full z-20 shrink-0 select-none bg-[#0c0517]/95 backdrop-blur-2xl rounded-t-[28px] rounded-b-none border-t border-purple-500/30 shadow-[0_-8px_32px_rgba(0,0,0,0.7),0_-1px_15px_rgba(168,85,247,0.25)]">
          {/* Subtle Purple Specular Highlight Arc along top edge */}
          <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-[28px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent pointer-events-none z-30 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
          <div className="absolute top-[2px] left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-30" />

          {/* Active / Loading State: Magnifying-Glass-Style Pulsing Indicator */}
          {(status === 'THINKING' || status === 'LISTENING') && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="px-3.5 py-1 rounded-full bg-[#0d071d]/95 border border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.6)] backdrop-blur-xl flex items-center gap-2"
              >
                {/* Magnifying Glass with expanding pulsing lens aura */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 -m-1 rounded-full bg-purple-500/30"
                    animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Search className="w-3 h-3 text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.95)]" />
                  </motion.div>
                </div>

                <span className="text-[9.5px] font-mono font-bold text-purple-100 tracking-wider">
                  {status === 'THINKING' ? 'MAYRA REASONING' : 'MAYRA LISTENING'}
                </span>

                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>
          )}

          {/* Navigation Bar Content Grid */}
          <div className="h-[64px] px-2 relative grid grid-cols-5 items-center w-full">
            {/* Tab 1: Home */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleTabSwitch('home')}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-colors ${
                activeTab === 'home'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Home"
              aria-label="Home"
            >
              <Home
                className={`w-[21px] h-[21px] transition-all ${
                  activeTab === 'home'
                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : 'text-gray-400'
                }`}
                strokeWidth={activeTab === 'home' ? 2.3 : 1.8}
              />
              <span
                className={`text-[11px] font-medium leading-none tracking-tight ${
                  activeTab === 'home' ? 'text-white font-semibold' : 'text-gray-400'
                }`}
              >
                {t.home}
              </span>
            </motion.button>

            {/* Tab 2: Chat */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleTabSwitch('chat')}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-colors ${
                activeTab === 'chat'
                  ? 'text-purple-300'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Chat"
              aria-label="Chat"
            >
              <MessageCircleMore
                className={`w-[21px] h-[21px] transition-all ${
                  activeTab === 'chat'
                    ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                    : 'text-purple-400/80 hover:text-purple-300'
                }`}
                strokeWidth={activeTab === 'chat' ? 2.2 : 1.8}
              />
              <span
                className={`text-[11px] font-medium leading-none tracking-tight ${
                  activeTab === 'chat' ? 'text-purple-300 font-semibold' : 'text-gray-400'
                }`}
              >
                {t.chat}
              </span>
            </motion.button>

            {/* Tab 3: Center MAYRA Orb / Voice Mic Button */}
            <div className="flex flex-col items-center justify-center w-full min-w-0 relative">
              <div className="relative -mt-7">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleCenterAction}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  onPointerLeave={handlePointerCancel}
                  className={`w-[64px] h-[64px] rounded-full p-[2.5px] flex items-center justify-center relative cursor-pointer select-none touch-none transition-all ${
                    isPttActive
                      ? 'ring-2 ring-fuchsia-400 shadow-[0_0_32px_rgba(217,70,239,0.95)] bg-gradient-to-b from-fuchsia-500 to-purple-800 scale-105'
                      : isListeningMode || status === 'LISTENING'
                      ? 'ring-2 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.95)] bg-gradient-to-b from-purple-500 via-fuchsia-600 to-purple-900 animate-pulse'
                      : status === 'SPEAKING'
                      ? 'ring-2 ring-purple-300 shadow-[0_0_30px_rgba(192,132,252,0.85)] bg-gradient-to-b from-purple-400 to-indigo-700'
                      : status === 'THINKING'
                      ? 'ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] bg-gradient-to-b from-amber-500 to-purple-900'
                      : 'ring-[2.5px] ring-purple-500/90 hover:ring-purple-400 shadow-[0_0_22px_rgba(168,85,247,0.7),0_0_10px_rgba(239,68,68,0.35)] bg-gradient-to-b from-purple-500/80 via-fuchsia-600/60 to-purple-950'
                  }`}
                  title={
                    activeTab === 'scan'
                      ? 'Tap to Capture and Analyze'
                      : activeTab === 'memories'
                      ? 'Add Memory or Family Contact'
                      : isPttActive
                      ? 'Hold-to-Talk (PTT) active... Release to send'
                      : isListeningMode || status === 'LISTENING'
                      ? 'Listening (Hands-Free)... Tap to stop'
                      : status === 'SPEAKING'
                      ? 'Mayra Speaking... Tap to interrupt'
                      : 'MAYRA Voice Orb — Tap to Talk / Hold for PTT'
                  }
                  aria-label="Voice Mic Orb"
                >
                  {/* Inner 3D Sphere Body */}
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-[#0e061c] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.85)]">
                    {/* Top Specular Crescent Highlight */}
                    <div className="absolute top-0.5 left-2 right-2 h-3.5 rounded-full bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none z-20" />

                    {/* Internal Ambient Starlight & Core */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#f97316]/50 via-[#a855f7]/60 to-[#ec4899]/40 rounded-full blur-[1px]" />
                    <div className="absolute inset-1 rounded-full bg-[#130728]/85 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(249,115,22,0.5)_0%,rgba(168,85,247,0.5)_40%,transparent_70%)]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_#ffffff] animate-ping" />
                      <div className="absolute w-1 h-1 rounded-full bg-amber-300 top-2 left-3 blur-[0.5px]" />
                      <div className="absolute w-1 h-1 rounded-full bg-purple-300 bottom-2 right-3 blur-[0.5px]" />
                    </div>

                    {/* Active State / Voice Animation */}
                    {activeTab === 'scan' ? (
                      <Camera className="w-5 h-5 text-white relative z-10 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                    ) : activeTab === 'memories' ? (
                      <Plus className="w-5 h-5 text-white relative z-10 stroke-[2.4]" />
                    ) : (
                      <div className="relative z-10">
                        <VoiceControlOrb
                          status={status}
                          isListeningMode={isListeningMode}
                          appearanceConfig={appearanceConfig}
                          size={42}
                        />
                      </div>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Tab 4: Camera */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleTabSwitch('scan')}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-colors ${
                activeTab === 'scan'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Camera"
              aria-label="Camera"
            >
              <Camera
                className={`w-[21px] h-[21px] transition-all ${
                  activeTab === 'scan'
                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : 'text-gray-400'
                }`}
                strokeWidth={activeTab === 'scan' ? 2.3 : 1.8}
              />
              <span
                className={`text-[11px] font-medium leading-none tracking-tight ${
                  activeTab === 'scan' ? 'text-white font-semibold' : 'text-gray-400'
                }`}
              >
                {t.camera}
              </span>
            </motion.button>

            {/* Tab 5: Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleOpenSettingsWithSpring}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-colors ${
                isSettingsOpen
                  ? 'text-cyan-300'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <SettingsIcon
                className={`w-[21px] h-[21px] transition-all ${
                  isSettingsOpen
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] rotate-45'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
                strokeWidth={isSettingsOpen ? 2.3 : 1.8}
              />
              <span
                className={`text-[11px] font-medium leading-none tracking-tight ${
                  isSettingsOpen
                    ? 'text-cyan-300 font-semibold'
                    : 'text-purple-400/90 hover:text-purple-300'
                }`}
              >
                {t.settings}
              </span>
            </motion.button>
          </div>

          {/* Integrated Flush Bottom Base Home Indicator Line (Zero bottom gap) */}
          <div className="h-3 flex items-center justify-center shrink-0 -mt-1 pb-1">
            <div className="w-32 h-1 rounded-full bg-white/25"></div>
          </div>
        </div>
      )}

      {/* iPhone Home Indicator Line for Settings overlay */}
      {isSettingsOpen && (
        <div className="h-4 flex items-center justify-center shrink-0 bg-white/[0.05] backdrop-blur-2xl border-t border-white/5">
          <div className="w-32 h-1 rounded-full bg-white/25"></div>
        </div>
      )}

      {/* Routines / Smart Shortcuts Modal */}
      <RoutinesModal
        isOpen={isRoutinesOpen}
        onClose={() => setIsRoutinesOpen(false)}
        onRunRoutine={(prompt) => {
          handleTabSwitch('chat');
          setInputText(prompt);
          onSubmitPrompt(prompt);
        }}
      />

      {/* Home Screen Widget Launcher Simulation Modal */}
      <HomeScreenWidgetModal
        isOpen={isWidgetGuideOpen}
        onClose={() => setIsWidgetGuideOpen(false)}
        onLaunchVoice={() => {
          setIsWidgetGuideOpen(false);
          onTriggerVoice();
        }}
        onLaunchScan={() => {
          setIsWidgetGuideOpen(false);
          handleTabSwitch('scan');
        }}
        onLaunchChat={() => {
          setIsWidgetGuideOpen(false);
          handleTabSwitch('chat');
        }}
        onLaunchRoutine={(prompt) => {
          setIsWidgetGuideOpen(false);
          handleTabSwitch('chat');
          setInputText(prompt);
          onSubmitPrompt(prompt);
        }}
      />

      {/* Glass Auth & Account Cloud Sync Modal */}
      <GlassAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userName={personalConfig.preferredName || personalConfig.fullName || 'Zafer'}
        onLoginSuccess={(user) => {
          setPersonalConfig(prev => ({
            ...prev,
            fullName: user.name,
            preferredName: user.name,
            email: user.email
          }));
        }}
      />

      {/* App Lock Biometric / PIN Authentication Gate */}
      <AppLockModal
        isOpen={isLocked && appLockConfig.isEnabled}
        onVerifyPin={verifyPin}
        onVerifyBiometric={verifyBiometric}
      />

      {/* Agent V1 Task HUD & Permission Gate Approval UI */}
      <AgentTaskHUD
        taskContext={activeAgentTask || null}
        onApprove={onApproveAgentAction || (() => {})}
        onReject={onRejectAgentAction || (() => {})}
        onCancel={onCancelAgentTask || (() => {})}
      />

      {/* Feature C: Proactive Smart Guardian Live Alert HUD */}
      <ProactiveGuardianHUD
        alert={activeProactiveAlert || null}
        onDismiss={onDismissProactiveAlert || (() => {})}
        onAccept={(alert) => {
          if (alert.suggestedAction?.actionType === 'OPEN_MEMORIES') {
            setActiveTab('memories');
          }
        }}
      />

      {/* iOS Magnifying Glass / Glassmorphism Floating Assistant Overlay */}
      <FloatingMayraOverlay
        isOpen={isFloatingOverlayOpen}
        onClose={() => setIsFloatingOverlayOpen(false)}
        status={status}
        inputText={inputText}
        setInputText={setInputText}
        onSubmitPrompt={onSubmitPrompt}
        onTriggerVoice={onTriggerVoice}
        onSelectAction={onSelectRoutineAction}
        lastResponse={lastAssistantMessage}
        appearanceConfig={appearanceConfig}
      />

      {/* Background Hand-Gesture Floating Overlay Bubble & Always-Visible Camera Indicator */}
      <BackgroundGestureOverlayBubble
        isEnabled={advancedConfig.backgroundHandGestureEnabled}
        onToggleEnabled={(enabled) => setAdvancedConfig(prev => ({ ...prev, backgroundHandGestureEnabled: enabled }))}
        status={status}
        appearanceConfig={appearanceConfig}
        onTriggerVoice={onTriggerVoice}
        onOpenApp={() => {
          setIsSettingsOpen(false);
          setActiveTab('home');
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setCurrentSubScreen('advanced');
        }}
      />

      {/* Phase 4A: Home Screen Floating Interactive Objective Quiz Modal (Google AI Mode style compact dabba with cut button) */}
      <FloatingHomeQuizModal
        quiz={activeHomeQuiz}
        isOpen={Boolean(activeHomeQuiz) && activeTab === 'home' && !isSettingsOpen}
        onClose={() => setActiveHomeQuiz(null)}
        onSelectTopic={(topic) => {
          onSubmitPrompt(`${topic} ka quiz banao`);
        }}
        onExplainResults={(score) => {
          setActiveHomeQuiz(null);
          handleTabSwitch('chat');
          onSubmitPrompt(`Maine quiz me ${score.correct}/${score.total} score kiya. Meri galtiyan samjhao aur important concepts explain karo.`);
        }}
      />

      {/* Mark-LII Reversible Action Undo Toast */}
      <MarkLIIUndoToast />

      {/* Mark-LII Tamper-Proof Confirmation Gate Modal */}
      <MarkLIIConfirmationModal />

    </div>
  );
};
