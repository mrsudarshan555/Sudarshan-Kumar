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
  Settings as SettingsIcon, Shield, Menu, X as CloseIcon, ChevronRight,
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
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState<boolean>(false);

  // Active sync account
  const authService = AccountSyncService.getInstance();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(authService.getCurrentUser());

  // Left-edge swipe drawer: keeps the main screens clean while retaining all navigation/settings.
  const drawerTouchStartX = useRef<number | null>(null);
  const drawerTouchStartY = useRef<number | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    drawerTouchStartX.current = e.touches[0]?.clientX ?? null;
    drawerTouchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    const startX = drawerTouchStartX.current;
    const startY = drawerTouchStartY.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    const endY = e.changedTouches[0]?.clientY ?? null;
    drawerTouchStartX.current = null;
    drawerTouchStartY.current = null;
    if (startX == null || startY == null || endX == null || endY == null) return;
    if (startX <= 28 && endX - startX > 55 && Math.abs(endY - startY) < 90) {
      setIsSideDrawerOpen(true);
    }
  };

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
      onTouchStart={handleDrawerTouchStart}
      onTouchEnd={handleDrawerTouchEnd}
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
      
      {/* Unified MAYRA top bar: same on Home, Chat, Camera and Memory. */}
      {!isSettingsOpen && (
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/10 bg-black/45 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setIsSideDrawerOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10" aria-label="Open MAYRA menu">
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <button onClick={() => navigateFromDrawer('home')} className="flex items-center gap-2 min-w-0">
              <MayraLogo size={25} showGlow={false} iconVariant={appearanceConfig.launcherIconVariant} />
              <span className="font-sans font-semibold text-sm text-white truncate">MAYRA</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[10px] font-semibold text-slate-200">
              {currentPlan.label} · {currentPlan.price}
            </span>
            <button onClick={() => openDrawerSettings('subscription_plans')} className="px-2 py-1 rounded-full text-[10px] text-slate-300 hover:bg-white/10" title="Plan and credits">
              {currentPlan.credits}
            </button>
            <button onClick={() => setIsSideDrawerOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10" aria-label="Open menu">
              <MessageCircleMore className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* Left swipe drawer: advanced controls live here instead of crowding every screen. */}
      {isSideDrawerOpen && (
        <>
          <button aria-label="Close menu" onClick={() => setIsSideDrawerOpen(false)} className="absolute inset-0 z-[70] bg-black/55" />
          <aside className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[330px] z-[80] bg-[#0b0713] border-r border-white/10 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 px-4 pt-5 pb-4 bg-[#0b0713]/95 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MayraLogo size={30} showGlow={false} iconVariant={appearanceConfig.launcherIconVariant} />
                  <div><div className="text-sm font-semibold text-white">MAYRA</div><div className="text-[10px] text-slate-400">{planLabel}</div></div>
                </div>
                <button onClick={() => setIsSideDrawerOpen(false)} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"><CloseIcon className="w-5 h-5" /></button>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {[
                { label: 'Home', icon: Home, action: () => navigateFromDrawer('home') },
                { label: 'Chat', icon: MessageCircleMore, action: () => navigateFromDrawer('chat') },
                { label: 'Camera', icon: Camera, action: () => navigateFromDrawer('scan') },
                { label: 'Memory', icon: Brain, action: () => navigateFromDrawer('memories') },
              ].map(({label, icon: Icon, action}) => (
                <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-slate-200 hover:bg-white/[0.07]">
                  <Icon className="w-4.5 h-4.5 text-purple-300" strokeWidth={1.8} /><span>{label}</span><ChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {[
                { label: 'Settings', screen: 'root' as SettingsSubScreen },
                { label: 'Voice & AI', screen: 'persona_voice_studio' as SettingsSubScreen },
                { label: 'Privacy & Permissions', screen: 'permissions' as SettingsSubScreen },
                { label: 'Upgrade / Plans', screen: 'subscription_plans' as SettingsSubScreen },
                { label: 'Account', screen: 'user_profile' as SettingsSubScreen },
              ].map(item => (
                <button key={item.label} onClick={() => openDrawerSettings(item.screen)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-slate-300 hover:bg-white/[0.07]">
                  <SettingsIcon className="w-4 h-4 text-cyan-300" strokeWidth={1.8} /><span>{item.label}</span><ChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <button onClick={() => openDrawerSettings('root')} className="w-full text-left px-3.5 py-3 rounded-xl text-xs text-slate-400 hover:bg-white/[0.07]">Privacy Policy</button>
              <button onClick={() => openDrawerSettings('root')} className="w-full text-left px-3.5 py-3 rounded-xl text-xs text-slate-400 hover:bg-white/[0.07]">Terms & Conditions</button>
            </nav>
          </aside>
        </>
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
