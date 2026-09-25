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
import { MayraLiveScreen } from './screens/MayraLiveScreen';
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
  Trash2, Plus, Zap, Smartphone, UserCheck, Sparkles, Search, Radio, Menu as MenuIcon, PenLine, MoreVertical
} from 'lucide-react';
import { useLanguage } from '../services/i18n/languageContext';
import { MarkLIIUndoToast } from './MarkLIIUndoToast';
import { MarkLIIConfirmationModal } from './MarkLIIConfirmationModal';
import { getThemePreset } from '../utils/themePresets';
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
import mayraChatIcon from '../assets/mayra-chat-icon.svg';

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

  const planTier = personalConfig?.subscription?.tier || 'free';
  const currentPlan = {
    label: planTier === 'elite_pro' ? 'MAX' : planTier === 'premium' ? 'PLUS' : planTier === 'basic' ? 'BASIC' : 'FREE'
  };
  const planLabel = currentPlan.label;

  const navigateFromDrawer = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSettingsOpen(false);
    setIsSideDrawerOpen(false);
  };

  const openDrawerSettings = (screen: SettingsSubScreen) => {
    setCurrentSubScreen(screen);
    setIsSettingsOpen(true);
    setIsSideDrawerOpen(false);
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
      className={`w-full h-full flex flex-col relative overflow-hidden select-none ${appearanceConfig.darkMode ? "bg-[#070312] text-slate-100" : "bg-[#f8f9fc] text-slate-900"}`}
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
      
      {/* MAYRA global navigation. Chat uses a clean Gemini-style header; other screens keep the four-icon bar. */}
      {!isSettingsOpen && (
        activeTab === 'chat' ? (
          <div className={`h-14 px-4 flex items-center justify-between border-b z-30 shrink-0 relative ${appearanceConfig.darkMode ? 'border-white/10 bg-black' : 'border-slate-200 bg-black'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setIsSideDrawerOpen(true)} aria-label="Open menu" className="text-white/90">
                <MenuIcon className="w-7 h-7" strokeWidth={1.7} />
              </button>
              <button type="button" className="flex items-center gap-1.5 text-white text-[17px] font-medium">
                <span>Mayra {planLabel === 'PLUS' ? 'Plus' : planLabel === 'MAX' ? 'Max' : planLabel === 'BASIC' ? 'Basic' : 'Free'}</span>
                <span className="text-white/45 text-[15px]">⌄</span>
              </button>
            </div>
            <div className="flex items-center gap-5 text-white/90">
              <button type="button" aria-label="New chat" onClick={onClearChat}><PenLine className="w-6 h-6" strokeWidth={1.8} /></button>
              <button type="button" aria-label="More options"><MoreVertical className="w-6 h-6" strokeWidth={1.8} /></button>
            </div>
          </div>
        ) : (
          <div className={`h-14 px-3 flex items-center justify-between border-b z-30 shrink-0 ${appearanceConfig.darkMode ? "border-white/10 bg-[#070312]/95" : "border-slate-200 bg-white/95"} relative`}>
            <button onClick={() => navigateFromDrawer('home')} className="flex items-center gap-2 min-w-0" aria-label="MAYRA Home">
              <MayraLogo size={28} showGlow={false} iconVariant={appearanceConfig.launcherIconVariant} />
              <span className={`font-semibold text-sm tracking-tight ${appearanceConfig.darkMode ? "text-white" : "text-slate-900"}`}>MAYRA</span>
              <span className="px-2 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[9px] font-semibold text-slate-200">{planLabel}</span>
            </button>

            {activeTab === 'scan' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 text-white text-[22px] font-medium tracking-tight drop-shadow-lg">
                  <Radio className="w-6 h-6 stroke-[2.5]" /><span>Live</span>
                </div>
              </div>
            )}

            <nav className="flex items-center gap-1 shrink-0" aria-label="MAYRA navigation">
              {[
                { id: 'home' as ActiveTab, icon: Home, label: 'Home' },
                { id: 'scan' as ActiveTab, icon: Camera, label: 'Camera' },
                { id: 'memories' as ActiveTab, icon: Brain, label: 'Memory' },
                { id: 'chat' as ActiveTab, icon: MessageCircleMore, label: 'Chat' }
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button" onClick={() => navigateFromDrawer(id)} aria-label={label} title={label}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${appearanceConfig.darkMode ? (activeTab === id ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/[0.07] hover:text-white') : (activeTab === id ? 'bg-slate-900/10 text-slate-900' : 'text-slate-500 hover:bg-slate-900/[0.06] hover:text-slate-900')}`}>
                  {id === 'chat' ? (
                    <img src={mayraChatIcon} alt="" aria-hidden="true" className={`w-[19px] h-[19px] object-contain ${appearanceConfig.darkMode ? '' : '[filter:brightness(0)]'}`} />
                  ) : id === 'home' ? (
                    <svg width="20" height="20" viewBox="0 0 1536 1404" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <path fill="currentColor" fillRule="evenodd" d="M 1384 764 L 1332 711 L 1300 707 L 1284 722 L 1275 782 L 1269 1257 L 1204 1283 L 1009 1281 L 993 1272 L 994 867 L 983 814 L 959 778 L 913 743 L 857 729 L 679 729 L 609 747 L 566 784 L 535 847 L 526 1291 L 333 1285 L 276 1267 L 265 1186 L 262 768 L 233 722 L 190 719 L 155 752 L 145 798 L 144 1211 L 159 1291 L 223 1364 L 299 1394 L 558 1401 L 618 1383 L 645 1326 L 652 855 L 695 838 L 833 836 L 876 844 L 894 864 L 894 1311 L 903 1382 L 938 1395 L 1232 1399 L 1281 1386 L 1350 1336 L 1391 1248 L 1395 826Z M 7 651 L 12 680 L 36 714 L 54 724 L 85 714 L 205 613 L 661 198 L 749 124 L 769 116 L 828 160 L 1452 716 L 1467 724 L 1491 716 L 1516 695 L 1531 668 L 1516 632 L 1469 584 L 928 95 L 843 28 L 786 7 L 738 11 L 707 23 L 603 97 L 76 570 L 24 623Z"/>
                    </svg>
                  ) : id === 'scan' ? (
                    <svg width="20" height="20" viewBox="0 0 1536 1193" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <path fill="currentColor" fillRule="evenodd" d="M 965 740 L 960 735 L 952 731 L 938 731 L 932 734 L 927 739 L 924 745 L 923 752 L 922 753 L 921 765 L 920 766 L 917 781 L 915 784 L 911 797 L 903 813 L 889 834 L 858 862 L 841 874 L 831 879 L 829 879 L 822 883 L 816 884 L 813 886 L 806 887 L 794 891 L 776 892 L 775 893 L 764 893 L 763 894 L 759 894 L 753 897 L 747 903 L 743 914 L 743 923 L 748 935 L 755 940 L 769 944 L 785 944 L 786 943 L 791 943 L 792 942 L 799 941 L 803 939 L 820 937 L 824 935 L 831 934 L 848 926 L 850 926 L 872 914 L 875 911 L 884 906 L 904 889 L 919 874 L 933 857 L 948 833 L 957 813 L 965 790 L 966 781 L 967 780 L 967 776 L 970 765 L 970 752 L 968 745Z M 798 561 L 793 556 L 783 552 L 777 552 L 776 551 L 757 552 L 752 554 L 740 556 L 736 558 L 725 559 L 713 563 L 706 567 L 704 567 L 680 580 L 677 583 L 674 584 L 664 591 L 634 620 L 620 638 L 617 644 L 613 649 L 603 669 L 602 674 L 598 682 L 597 688 L 595 691 L 595 694 L 591 707 L 591 712 L 589 718 L 589 724 L 588 725 L 588 731 L 589 732 L 590 739 L 595 747 L 602 752 L 608 754 L 617 754 L 625 750 L 630 745 L 630 743 L 632 740 L 635 718 L 645 688 L 658 665 L 668 652 L 695 628 L 709 618 L 718 613 L 720 613 L 733 607 L 750 602 L 762 601 L 763 600 L 784 599 L 793 595 L 798 590 L 802 578 L 801 568Z M 172 451 L 171 452 L 167 452 L 163 454 L 156 455 L 153 457 L 146 459 L 124 472 L 104 492 L 98 500 L 89 517 L 89 520 L 87 522 L 82 539 L 82 546 L 81 547 L 81 572 L 82 573 L 82 581 L 84 588 L 86 591 L 86 595 L 96 616 L 99 619 L 105 629 L 122 646 L 141 658 L 162 666 L 175 668 L 176 669 L 205 669 L 215 666 L 219 663 L 225 663 L 233 661 L 253 650 L 264 641 L 279 624 L 289 608 L 296 589 L 299 571 L 300 551 L 299 550 L 296 531 L 285 505 L 276 492 L 255 471 L 232 458 L 213 452 L 201 451 L 200 450Z M 177 493 L 183 493 L 184 492 L 196 492 L 197 493 L 204 493 L 205 494 L 208 494 L 211 496 L 216 497 L 226 502 L 228 504 L 232 506 L 241 514 L 241 515 L 244 518 L 244 519 L 249 525 L 254 535 L 255 542 L 256 543 L 256 545 L 257 546 L 257 549 L 258 550 L 258 570 L 257 571 L 257 574 L 255 578 L 255 581 L 254 582 L 254 586 L 253 587 L 253 589 L 251 591 L 249 596 L 243 603 L 241 607 L 233 614 L 230 615 L 225 619 L 219 622 L 217 622 L 212 625 L 209 625 L 208 626 L 205 626 L 204 627 L 195 627 L 194 628 L 187 628 L 186 627 L 178 627 L 177 626 L 173 626 L 172 625 L 169 625 L 166 623 L 164 623 L 154 618 L 152 616 L 151 616 L 136 601 L 136 600 L 133 597 L 126 583 L 126 581 L 125 580 L 125 576 L 124 575 L 124 571 L 123 570 L 123 565 L 122 564 L 122 555 L 123 554 L 123 550 L 124 549 L 124 545 L 125 544 L 125 540 L 126 539 L 126 537 L 133 523 L 137 519 L 137 518 L 149 506 L 150 506 L 154 502 L 156 501 L 158 501 L 162 498 L 164 498 L 170 495 L 172 495 L 173 494 L 176 494Z M 766 381 L 697 390 L 627 415 L 570 450 L 514 502 L 471 563 L 446 618 L 431 675 L 427 707 L 427 758 L 442 835 L 470 900 L 507 955 L 550 999 L 598 1034 L 655 1062 L 729 1081 L 789 1084 L 850 1077 L 923 1053 L 979 1021 L 1037 969 L 1073 923 L 1109 850 L 1125 789 L 1129 712 L 1117 642 L 1093 578 L 1073 543 L 1046 506 L 1002 462 L 953 428 L 887 398 L 822 383Z M 747 441 L 805 441 L 868 454 L 917 475 L 961 505 L 1006 550 L 1036 596 L 1058 650 L 1068 702 L 1068 761 L 1058 814 L 1034 872 L 1002 919 L 961 959 L 900 997 L 849 1015 L 789 1024 L 764 1024 L 727 1019 L 679 1006 L 622 978 L 582 947 L 540 900 L 511 849 L 493 795 L 487 751 L 489 688 L 498 648 L 519 597 L 554 546 L 594 506 L 642 474 L 684 455Z M 586 152 L 587 175 L 595 194 L 602 204 L 610 212 L 621 220 L 644 228 L 669 228 L 670 229 L 911 228 L 932 220 L 947 209 L 954 201 L 961 189 L 967 169 L 967 152 L 965 142 L 959 127 L 955 123 L 950 114 L 943 107 L 928 98 L 921 95 L 905 92 L 646 92 L 641 94 L 635 94 L 618 102 L 604 114 L 595 126 L 590 136Z M 626 160 L 630 148 L 632 146 L 633 143 L 639 138 L 651 133 L 900 133 L 901 134 L 908 135 L 914 138 L 922 145 L 927 157 L 927 164 L 926 165 L 925 171 L 917 181 L 911 185 L 901 186 L 900 187 L 661 187 L 660 186 L 647 186 L 642 183 L 640 183 L 629 171 L 627 165 L 627 161Z M 135 121 L 124 155 L 125 240 L 77 250 L 42 271 L 18 300 L 3 342 L 3 1090 L 18 1135 L 48 1169 L 111 1193 L 1427 1193 L 1474 1178 L 1510 1146 L 1533 1087 L 1533 349 L 1518 300 L 1493 270 L 1464 252 L 1425 243 L 1116 243 L 1024 48 L 992 19 L 939 4 L 614 4 L 571 14 L 522 58 L 436 243 L 413 242 L 411 140 L 401 119 L 382 104 L 172 99Z M 1470 408 L 1471 1021 L 1442 1003 L 1420 998 L 1133 998 L 1131 994 L 1154 961 L 1179 913 L 1206 834 L 1217 767 L 1217 697 L 1201 613 L 1178 550 L 1138 480 L 1097 429 L 1118 432 L 1421 432 L 1446 425Z M 90 1072 L 97 1052 L 122 1038 L 521 1037 L 443 944 L 395 836 L 385 788 L 382 713 L 393 636 L 407 592 L 435 534 L 471 482 L 523 429 L 571 394 L 625 366 L 686 346 L 736 337 L 799 336 L 864 345 L 920 362 L 978 390 L 1029 425 L 1105 508 L 1154 607 L 1174 720 L 1171 785 L 1158 848 L 1138 900 L 1106 956 L 1034 1037 L 1414 1038 L 1439 1052 L 1445 1077 L 1431 1101 L 1383 1108 L 196 1108 L 111 1104 L 97 1093Z M 92 352 L 94 345 L 97 340 L 103 334 L 112 329 L 117 328 L 422 328 L 432 332 L 441 341 L 444 347 L 447 359 L 446 360 L 446 366 L 442 373 L 442 375 L 432 385 L 424 389 L 415 391 L 120 391 L 115 390 L 105 385 L 97 377 L 92 365Z M 1091 357 L 1094 346 L 1100 336 L 1112 329 L 1123 328 L 1124 327 L 1126 328 L 1420 328 L 1425 329 L 1435 334 L 1438 337 L 1443 347 L 1445 356 L 1445 362 L 1442 373 L 1438 379 L 1430 386 L 1422 390 L 1417 390 L 1416 391 L 1120 391 L 1115 390 L 1107 386 L 1098 378 L 1093 369 L 1091 366 L 1091 362Z M 206 183 L 208 181 L 328 181 L 330 183 L 331 222 L 331 223 L 330 224 L 330 227 L 328 229 L 327 229 L 326 230 L 319 230 L 318 229 L 208 229 L 206 226Z M 967 69 L 986 94 L 1065 276 L 1086 294 L 1063 318 L 1052 342 L 1056 389 L 992 347 L 924 316 L 867 300 L 801 291 L 718 295 L 661 307 L 592 333 L 545 359 L 476 414 L 410 492 L 371 566 L 347 642 L 338 717 L 347 822 L 382 923 L 426 996 L 115 998 L 86 1007 L 57 1033 L 56 394 L 80 418 L 116 432 L 439 428 L 473 402 L 487 363 L 476 321 L 452 295 L 472 290 L 484 278 L 566 90 L 584 68 L 608 57 L 941 57Z"/>
                    </svg>
                  ) : (
                    <Icon
                      className={`w-[19px] h-[19px] ${activeTab === id && (id === 'memories' || id === 'home') ? 'fill-current' : ''}`}
                      strokeWidth={activeTab === id ? 2.2 : 1.8}
                    />
                  )}
                </button>
              ))
            </nav>
          </div>
        )
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

      {/* Screen Body Viewport with Fast Solid Native Transitions */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-[#090a0f]">
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
                  <MayraLiveScreen
                    onOpenChat={() => navigateFromDrawer('chat')}
                    onOpenHome={() => navigateFromDrawer('home')}
                    onEndSession={() => navigateFromDrawer('home')}
                    onOpenMemory={() => navigateFromDrawer('memories')}
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
                    appearanceConfig={appearanceConfig}
                    userName={personalConfig.preferredName || personalConfig.fullName || currentUser?.name || 'there'}
                    onToolPrompt={(prompt) => onSubmitPrompt(prompt)}
                  />
                )}
              </motion.div>
            )}
        </AnimatePresence>
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
