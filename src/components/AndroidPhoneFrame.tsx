import React, { useState, useEffect } from 'react';
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
import { 
  Home, Camera, Brain, MessageSquare, 
  Settings as SettingsIcon, Shield,
  Trash2, Plus, Zap, Smartphone, UserCheck
} from 'lucide-react';
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
  onSelectRoutineAction: (action: string) => void;
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  onClearChat: () => void;
  // Agent V1 Props
  activeAgentTask?: AgentTaskContext | null;
  onApproveAgentAction?: () => void;
  onRejectAgentAction?: () => void;
  onCancelAgentTask?: () => void;
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
  onSelectRoutineAction,
  onSendVisionQuery,
  onClearChat,
  activeAgentTask,
  onApproveAgentAction,
  onRejectAgentAction,
  onCancelAgentTask,
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

  const handleCenterAction = () => {
    if (activeTab === 'scan') {
      // Trigger Vision Shutter
      setScanCaptureSignal(prev => prev + 1);
    } else if (activeTab === 'memories') {
      // Trigger Memories Add Context Menu
      setMemoriesAddSignal(prev => prev + 1);
    } else {
      // Trigger Voice Engine
      console.log('[MAYRA Pipeline] MIC_CLICK: Center Action Button pressed on tab:', activeTab);
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

      {/* Screen Body Viewport with AnimatePresence Transitions & Error Boundary */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <MayraErrorBoundary>
          <AnimatePresence mode="wait" custom={direction}>
            {/* Settings Full View */}
            {isSettingsOpen ? (
              <motion.div
                key="settings-screen"
                initial={{ opacity: 0, x: 30, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.99 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex flex-col"
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex flex-col min-h-0"
              >
                {activeTab === 'home' && (
                  <HomeScreen
                    status={status}
                    inputText={inputText}
                    setInputText={setInputText}
                    onSubmitPrompt={onSubmitPrompt}
                    onTriggerVoice={onTriggerVoice}
                    onOpenSettings={handleOpenSettingsWithSpring}
                    onOpenWhiteboard={() => {
                      window.dispatchEvent(new CustomEvent('mayra_toggle_stage_canvas'));
                    }}
                    onOpenRoutines={() => setIsRoutinesOpen(true)}
                    onOpenWidgetGuide={() => setIsWidgetGuideOpen(true)}
                    onOpenSignIn={() => setIsAuthModalOpen(true)}
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

      {/* Bottom Navigation Bar */}
      {!isSettingsOpen && (
        <div className="h-16 px-3 z-20 shrink-0 grid grid-cols-5 items-center bg-white/[0.07] backdrop-blur-2xl border-t border-white/15 shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.25)] relative">
          {/* Magnifying Glass Top Specular Sheen (Matching Mayra Chat Box Glass) */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Tab 1: Home */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleTabSwitch('home')}
            aria-label="Home"
            title="Home"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'home' 
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home 
              className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'home' ? 'scale-110' : 'opacity-70'}`}
              strokeWidth={activeTab === 'home' ? 2.2 : 1.75}
            />
          </motion.button>

          {/* Tab 2: Scan */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleTabSwitch('scan')}
            aria-label="Scan"
            title="Scan"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'scan' 
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera 
              className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'scan' ? 'scale-110' : 'opacity-70'}`}
              strokeWidth={activeTab === 'scan' ? 2.2 : 1.75}
            />
          </motion.button>

          {/* Tab 3: Center Large Dynamic Action Button (Frosted Glow Sphere) */}
          <div className="flex flex-col items-center justify-center w-full min-w-0 -mt-3">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCenterAction}
              className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all shrink-0 overflow-hidden relative cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-fuchsia-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.8)] border border-white/50'
                  : activeTab === 'memories'
                  ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.8)] border border-white/50'
                  : isListeningMode || status === 'LISTENING'
                  ? 'bg-[#180735] text-white shadow-[0_0_30px_rgba(168,85,247,0.9)] border-2 border-purple-400'
                  : status === 'SPEAKING'
                  ? 'bg-[#180735] text-white shadow-[0_0_30px_rgba(192,132,252,0.85)] border-2 border-purple-300'
                  : status === 'THINKING'
                  ? 'bg-[#180735] text-white shadow-[0_0_25px_rgba(245,158,11,0.75)] border-2 border-amber-400'
                  : 'bg-[#1a0c36]/90 hover:bg-[#25104d] text-purple-200 hover:text-white border border-white/30 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]'
              }`}
              title={
                activeTab === 'scan'
                  ? 'Tap to Capture and Analyze'
                  : activeTab === 'memories'
                  ? 'Add Memory or Family Contact'
                  : isListeningMode || status === 'LISTENING'
                  ? 'Listening... Tap to stop'
                  : status === 'SPEAKING'
                  ? 'Mayra Speaking... Tap to interrupt'
                  : 'Tap to speak'
              }
            >
              {activeTab === 'scan' ? (
                <Camera className="w-5 h-5 stroke-[2] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              ) : activeTab === 'memories' ? (
                <Plus className="w-5 h-5 stroke-[2.2] text-white" />
              ) : (
                <VoiceControlOrb
                  status={status}
                  isListeningMode={isListeningMode}
                  appearanceConfig={appearanceConfig}
                  size={48}
                />
              )}
            </motion.button>
          </div>

          {/* Tab 4: Memories */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleTabSwitch('memories')}
            aria-label="Memories"
            title="Memories"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'memories' 
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain 
              className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'memories' ? 'scale-110' : 'opacity-70'}`}
              strokeWidth={activeTab === 'memories' ? 2.2 : 1.75}
            />
          </motion.button>

          {/* Tab 5: Chat */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleTabSwitch('chat')}
            aria-label="Chat"
            title="Chat"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'chat' 
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare 
              className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'chat' ? 'scale-110' : 'opacity-70'}`}
              strokeWidth={activeTab === 'chat' ? 2.2 : 1.75}
            />
          </motion.button>
        </div>
      )}

      {/* iPhone Home Indicator Line */}
      <div className="h-4 flex items-center justify-center shrink-0 bg-white/[0.05] backdrop-blur-2xl border-t border-white/5">
        <div className="w-32 h-1 rounded-full bg-white/25"></div>
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

    </div>
  );
};
