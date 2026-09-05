import React, { useState, useEffect } from 'react';
import { AppLockConfig } from '../security/useAppLock';
import { HomeScreenWidgetModal } from '../widgets/HomeScreenWidgetModal';
import { 
  SettingsSubScreen, UserPersonalConfig, AssistantConfig, 
  VoiceGuardianConfig, AdvancedConfig, SkillItem, SubAgentItem, 
  IntegrationItem, MemoryItem, ChatMessage, CountryCodeItem,
  PermissionItem, AppearanceConfig
} from '../../types';
import { PersonalSettingsView } from './PersonalSettingsView';
import { CountryCodeView } from './CountryCodeView';
import { AssistantSettingsView } from './AssistantSettingsView';
import { AppearanceView } from './AppearanceView';
import { OrbCustomizationView } from './OrbCustomizationView';
import { VoiceGuardianView } from './VoiceGuardianView';
import { SkillsView } from './SkillsView';
import { SubAgentsView } from './SubAgentsView';
import { BackupView } from './BackupView';
import { AIProviderFallbackView } from './AIProviderFallbackView';
import { AdvancedSettingsView } from './AdvancedSettingsView';
import { OptionalIntegrationsView } from './OptionalIntegrationsView';
import { PrivacyView } from './PrivacyView';
import { AboutView } from './AboutView';
import { PermissionsCenterView } from './PermissionsCenterView';
import { NativeIntegrationView } from './NativeIntegrationView';
import { LinkedDevicesView } from './LinkedDevicesView';
import { OfflineModelsView } from './OfflineModelsView';
import { PersonaVoiceStudioView } from './PersonaVoiceStudioView';
import { TouchSecurityVaultView } from './TouchSecurityVaultView';
import { SystemUnlockAutomationView } from './SystemUnlockAutomationView';
import { EmergencySOSView } from './EmergencySOSView';
import { DrivingModeStudioView } from './DrivingModeStudioView';
import { UnifiedAppHubView } from './UnifiedAppHubView';
import { AIToolkitScannerView } from './AIToolkitScannerView';
import { SmartLifestyleIoTView } from './SmartLifestyleIoTView';
import { DeepAutomationMatrixView } from './DeepAutomationMatrixView';
import { QuantumMemoryVisionView } from './QuantumMemoryVisionView';
import { AutomationDialogueStudioView } from './AutomationDialogueStudioView';
import { NeuralTradingStudioView } from './NeuralTradingStudioView';
import { SettingsTopWidgetCarousel } from './SettingsTopWidgetCarousel';
import { WhiteboardTool } from '../tools/WhiteboardTool';
import { HomeAtmosphereBackground } from '../character/HomeAtmosphereBackground';
import { MayraLogo } from '../common/MayraLogo';
import { AppIconTile } from '../common/AppIconTile';
import { ORB_STYLES, ORB_COLORS } from '../character/MayraOrb';
import { NeuralTradingFinanceEngine } from '../../services/finance/NeuralTradingFinanceEngine';
import { DeepAutomationMatrixEngine } from '../../services/automation/DeepAutomationMatrixEngine';
import { SystemAutomationEmergencyEngine } from '../../services/automation/SystemAutomationEmergencyEngine';
import { TouchSecurityEngine } from '../../services/security/TouchSecurityEngine';
import { UnifiedAppHubEngine } from '../../services/hub/UnifiedAppHubEngine';
import { SmartLifestyleIoTEngine } from '../../services/lifestyle/SmartLifestyleIoTEngine';
import { 
  Settings as SettingsIcon, User, Globe, Sparkles, 
  Wrench, Bot, ShieldCheck, ShieldAlert, Database, Cpu, 
  Boxes, Lock, Info, ChevronRight, ArrowLeft, Search, X,
  Shield, CheckCircle2, Smartphone, PenTool, HardDrive,
  Palette, Moon, Sun, KeyRound, AlertOctagon, Car, MessageSquare,
  ScanText, Zap, Terminal, Brain, Volume2, TrendingUp, Activity,
  BatteryCharging, Radio
} from 'lucide-react';

interface SettingCategoryItem {
  id: SettingsSubScreen;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  oneLineSummary?: {
    text: string;
    chipLabel?: string;
    chipTone?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'blue' | 'slate';
    isLive?: boolean;
    isSimulated?: boolean;
  };
}

interface SettingCategorySection {
  category: string;
  items: SettingCategoryItem[];
}

interface MayraSettingsScreenProps {
  currentSubScreen: SettingsSubScreen;
  setCurrentSubScreen: (screen: SettingsSubScreen) => void;
  onCloseSettings: () => void;
  // State bindings
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
  appLockConfig?: AppLockConfig;
  onUpdateAppLock?: (updates: Partial<AppLockConfig>) => void;
  onLockAppNow?: () => void;
  onLaunchVoice?: () => void;
  onLaunchScan?: () => void;
  onLaunchChat?: () => void;
  onLaunchRoutine?: (prompt: string) => void;
}

export const MayraSettingsScreen: React.FC<MayraSettingsScreenProps> = ({
  currentSubScreen,
  setCurrentSubScreen,
  onCloseSettings,
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
  onOpenOnboarding,
  appLockConfig,
  onUpdateAppLock,
  onLockAppNow,
  onLaunchVoice,
  onLaunchScan,
  onLaunchChat,
  onLaunchRoutine
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [cameFromAdvanced, setCameFromAdvanced] = useState(false);
  const isDark = appearanceConfig?.darkMode ?? true;

  // --- LIVE ENGINE SUBSCRIPTIONS FOR ANDROID WIDGET STACK ---
  const [tradingLive, setTradingLive] = useState(() => {
    const e = NeuralTradingFinanceEngine.getInstance();
    return { price: e.getPrice(), change: e.getChange(), symbol: e.getSymbol(), pcr: e.getPCR() };
  });

  const [telemetryLive, setTelemetryLive] = useState(() => {
    const e = DeepAutomationMatrixEngine.getInstance();
    return e.getTelemetry();
  });

  const [emergencyLive, setEmergencyLive] = useState(() => {
    const e = SystemAutomationEmergencyEngine.getInstance();
    return {
      contactsCount: e.getEmergencyContacts().length,
      isSosActive: e.isSosTriggered(),
      driving: e.getDrivingConfig(),
      unlock: e.getUnlockConfig()
    };
  });

  const [touchLive, setTouchLive] = useState(() => {
    const e = TouchSecurityEngine.getInstance();
    return {
      isArmed: e.getArmedStatus(),
      isAlarmSounding: e.isAlarming(),
      logsCount: e.getIntruderLogs().length
    };
  });

  const [hubLive, setHubLive] = useState(() => {
    const e = UnifiedAppHubEngine.getInstance();
    return {
      messagesCount: e.getMessages().length,
      alarmsCount: e.getAlarms().length,
      eventsCount: e.getCalendar().length
    };
  });

  const [iotLive, setIotLive] = useState(() => {
    const e = SmartLifestyleIoTEngine.getInstance();
    return {
      devicesCount: e.getDevices().length,
      activeDevices: e.getDevices().filter(d => d.state).length
    };
  });

  // Subscribe to real-time engine updates
  useEffect(() => {
    const tradingEngine = NeuralTradingFinanceEngine.getInstance();
    const unsubTrading = tradingEngine.subscribe(() => {
      setTradingLive({
        price: tradingEngine.getPrice(),
        change: tradingEngine.getChange(),
        symbol: tradingEngine.getSymbol(),
        pcr: tradingEngine.getPCR()
      });
    });

    const matrixEngine = DeepAutomationMatrixEngine.getInstance();
    const unsubMatrix = matrixEngine.subscribe(() => {
      setTelemetryLive({ ...matrixEngine.getTelemetry() });
    });

    const emergencyEngine = SystemAutomationEmergencyEngine.getInstance();
    const unsubEmergency = emergencyEngine.subscribe(() => {
      setEmergencyLive({
        contactsCount: emergencyEngine.getEmergencyContacts().length,
        isSosActive: emergencyEngine.isSosTriggered(),
        driving: emergencyEngine.getDrivingConfig(),
        unlock: emergencyEngine.getUnlockConfig()
      });
    });

    const touchEngine = TouchSecurityEngine.getInstance();
    const unsubTouch = touchEngine.subscribe(() => {
      setTouchLive({
        isArmed: touchEngine.getArmedStatus(),
        isAlarmSounding: touchEngine.isAlarming(),
        logsCount: touchEngine.getIntruderLogs().length
      });
    });

    const hubEngine = UnifiedAppHubEngine.getInstance();
    const unsubHub = hubEngine.subscribe(() => {
      setHubLive({
        messagesCount: hubEngine.getMessages().length,
        alarmsCount: hubEngine.getAlarms().length,
        eventsCount: hubEngine.getCalendar().length
      });
    });

    const iotEngine = SmartLifestyleIoTEngine.getInstance();
    const unsubIot = iotEngine.subscribe(() => {
      setIotLive({
        devicesCount: iotEngine.getDevices().length,
        activeDevices: iotEngine.getDevices().filter(d => d.state).length
      });
    });

    return () => {
      unsubTrading();
      unsubMatrix();
      unsubEmergency();
      unsubTouch();
      unsubHub();
      unsubIot();
    };
  }, []);

  // Handle toggles
  const handleToggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleToggleAgent = (id: string) => {
    setSubAgents(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleSelectCountry = (country: CountryCodeItem) => {
    setPersonalConfig(prev => ({
      ...prev,
      countryDialCode: country.dialCode,
      countryName: country.name
    }));
  };

  const handleClearAllData = () => {
    setMemories([]);
    setMessages([]);
  };

  const handleRestoreData = (restored: MemoryItem[]) => {
    setMemories(restored);
  };

  // Sub-screen routing
  if (currentSubScreen === 'permissions') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PermissionsCenterView
          permissions={permissions}
          setPermissions={setPermissions}
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'native_integration') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <NativeIntegrationView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'appearance') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppearanceView
          config={appearanceConfig}
          onChange={(updated) => setAppearanceConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
          onNavigateToOrbStudio={() => setCurrentSubScreen('orb_customization')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'orb_customization') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OrbCustomizationView
          config={appearanceConfig}
          onChange={(updated) => setAppearanceConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
          onNavigateToAppearance={() => setCurrentSubScreen('appearance')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'personal') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PersonalSettingsView
          config={personalConfig}
          onChange={(updated) => setPersonalConfig(prev => ({ ...prev, ...updated }))}
          onOpenCountryPicker={() => setCurrentSubScreen('country_code')}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'country_code') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <CountryCodeView
          selectedDialCode={personalConfig.countryDialCode}
          onSelectCountry={handleSelectCountry}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'persona_voice_studio') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PersonaVoiceStudioView
          userGender="Male"
          assistantConfig={assistantConfig}
          onUpdateAssistantConfig={(patch) => setAssistantConfig((prev) => ({ ...prev, ...patch }))}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'touch_security_vault') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TouchSecurityVaultView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'system_unlock_automation') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SystemUnlockAutomationView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'emergency_sos') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <EmergencySOSView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'driving_mode_studio') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DrivingModeStudioView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'unified_app_hub') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <UnifiedAppHubView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'ai_toolkit_scanner') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AIToolkitScannerView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'smart_lifestyle_iot') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SmartLifestyleIoTView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'deep_automation_matrix') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DeepAutomationMatrixView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'quantum_memory_vision') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <QuantumMemoryVisionView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'automation_dialogue_matrix') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AutomationDialogueStudioView
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'neural_trading_matrix') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <NeuralTradingStudioView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'assistant') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AssistantSettingsView
          config={assistantConfig}
          onChange={(updated) => setAssistantConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'voice_guardian') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <VoiceGuardianView
          config={voiceGuardianConfig}
          onChange={(updated) => setVoiceGuardianConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'skills') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SkillsView
          skills={skills}
          onToggleSkill={handleToggleSkill}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'sub_agents') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SubAgentsView
          subAgents={subAgents}
          onToggleAgent={handleToggleAgent}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'backup') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <BackupView
          memories={memories}
          messages={messages}
          onClearAllData={handleClearAllData}
          onRestoreData={handleRestoreData}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'ai_provider_fallback') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AIProviderFallbackView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'advanced') {
    const isChargingNow = telemetryLive.chargingStatus?.toLowerCase().includes('charging') && !telemetryLive.chargingStatus?.toLowerCase().includes('not');
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AdvancedSettingsView
          config={advancedConfig}
          onChange={(updated) => setAdvancedConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => {
            setCameFromAdvanced(false);
            setCurrentSubScreen('root');
          }}
          onNavigateSubScreen={(screen) => {
            setCameFromAdvanced(true);
            setCurrentSubScreen(screen);
          }}
          telemetryLive={{
            cpuTemp: telemetryLive.cpuTempCelsius ?? 38,
            cpuLoad: telemetryLive.cpuUsage ?? 24,
            ramAllocatedMb: Math.round((telemetryLive.ramUsedGb ?? 2.4) * 1024),
            batteryLevel: telemetryLive.batteryLevel ?? 88,
            batteryHealth: telemetryLive.batteryHealth || 'Good (98%)',
            chargingStatus: isChargingNow ? 'Charging' : 'Discharging'
          }}
          permissions={permissions}
          voiceGuardianConfig={voiceGuardianConfig}
          appLockConfig={appLockConfig}
        />
      </div>
    );
  }

  if (currentSubScreen === 'optional_integrations') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OptionalIntegrationsView
          integrations={integrations}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'privacy') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PrivacyView 
          onBack={() => setCurrentSubScreen(cameFromAdvanced ? 'advanced' : 'root')} 
          permissions={permissions}
          setPermissions={setPermissions}
          memories={memories}
          setMemories={setMemories}
          messages={messages}
          setMessages={setMessages}
          appLockConfig={appLockConfig}
          onUpdateAppLock={onUpdateAppLock}
          onLockAppNow={onLockAppNow}
        />
      </div>
    );
  }

  if (currentSubScreen === 'linked_devices') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <LinkedDevicesView onBack={() => setCurrentSubScreen('root')} />
      </div>
    );
  }

  if (currentSubScreen === 'offline_models') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OfflineModelsView onBack={() => setCurrentSubScreen('root')} />
      </div>
    );
  }

  if (currentSubScreen === 'whiteboard') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <WhiteboardTool 
          onClose={() => setCurrentSubScreen('root')} 
          onSendToChat={(text) => {
            setMessages(prev => [
              ...prev,
              { id: `msg-${Date.now()}`, sender: 'user', role: 'user', text, timestamp: Date.now() }
            ]);
            setCurrentSubScreen('root');
            onCloseSettings();
          }}
        />
      </div>
    );
  }

  if (currentSubScreen === 'about') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AboutView 
          onBack={() => setCurrentSubScreen('root')} 
          onOpenOnboarding={onOpenOnboarding}
        />
      </div>
    );
  }

  const grantedPermissionsCount = permissions.filter(p => p.status === 'granted' || p.id === 'default_assistant').length;

  const currentOrbStyleName = ORB_STYLES.find(s => s.id === appearanceConfig.orbStyle)?.name || 'Mayra Glow';
  const currentOrbColorName = ORB_COLORS[appearanceConfig.orbColor]?.name || 'Cyan';

  // Format battery charging and trading numbers
  const isCharging = telemetryLive.chargingStatus?.toLowerCase().includes('charging') && !telemetryLive.chargingStatus?.toLowerCase().includes('not');
  const isTradePositive = tradingLive.change >= 0;
  const changePct = ((tradingLive.change / (tradingLive.price || 1)) * 100).toFixed(2);
  const changeSign = isTradePositive ? '+' : '';
  const changeArrow = isTradePositive ? '▲' : '▼';

  const settingSections: SettingCategorySection[] = [
    {
      category: 'ACCOUNT',
      items: [
        {
          id: 'personal' as SettingsSubScreen,
          title: 'Personal',
          subtitle: 'Your name, music, Gemini & YouTube keys',
          badge: 'PROFILE',
          icon: <AppIconTile icon={User} color="indigo" size="md" />
        },
        {
          id: 'country_code' as SettingsSubScreen,
          title: 'Country Code',
          subtitle: `${personalConfig.countryName || 'India'} (${personalConfig.countryDialCode || '+91'}) • Dial code & region`,
          badge: personalConfig.countryDialCode || '+91',
          icon: <AppIconTile icon={Globe} color="teal" size="md" />,
          oneLineSummary: {
            text: `🌐 Region: ${personalConfig.countryName || 'India'} • Telecom Code (${personalConfig.countryDialCode || '+91'})`,
            chipLabel: personalConfig.countryDialCode || '+91',
            chipTone: 'cyan',
            isLive: true
          }
        }
      ]
    },
    {
      category: 'ASSISTANT',
      items: [
        {
          id: 'assistant' as SettingsSubScreen,
          title: 'MAYRA / STONICX Persona',
          subtitle: 'Persona mode, girlfriend tone, voice responsiveness & language',
          badge: assistantConfig.activeMode === 'stonicx' ? '⚡ STONICX' : '⭐ MAYRA',
          icon: <AppIconTile icon={Sparkles} color={assistantConfig.activeMode === 'stonicx' ? 'amber' : 'purple'} size="md" />
        },
        {
          id: 'persona_voice_studio' as SettingsSubScreen,
          title: 'Persona & Voice Studio',
          subtitle: '15 Regional Indian dialects, voice actors & high-emotion tuner',
          badge: 'STUDIO',
          icon: <AppIconTile icon={Bot} color="purple" size="md" />
        },
        {
          id: 'skills' as SettingsSubScreen,
          title: 'Skills',
          subtitle: 'Installed features, domain abilities & smart tools',
          badge: `${skills.filter(s => s.enabled).length}/${skills.length}`,
          icon: <AppIconTile icon={Wrench} color="amber" size="md" />
        },
        {
          id: 'sub_agents' as SettingsSubScreen,
          title: 'Sub-agents',
          subtitle: 'Coding models, research engines & background agents',
          badge: `${subAgents.filter(a => a.enabled).length} ACTIVE`,
          icon: <AppIconTile icon={Bot} color="pink" size="md" />
        },
        {
          id: 'offline_models' as SettingsSubScreen,
          title: 'Offline AI Models',
          subtitle: 'Local on-device GGUF models (LFM 2.5, Qwen, SmolLM2, Llama)',
          badge: 'GGUF',
          icon: <AppIconTile icon={HardDrive} color="slate" size="md" />
        }
      ]
    },
    {
      category: 'WORK & MESSAGES',
      items: [
        {
          id: 'native_integration' as SettingsSubScreen,
          title: 'Email',
          subtitle: 'Email dispatch, direct SMS, call relay & notification bridge',
          badge: 'KOTLIN',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        },
        {
          id: 'unified_app_hub' as SettingsSubScreen,
          title: 'WhatsApp groups & reports',
          subtitle: 'WhatsApp groups, automated daily reports & message templates',
          badge: 'HUB',
          icon: <AppIconTile icon={MessageSquare} color="emerald" size="md" />,
          oneLineSummary: {
            text: `💬 WhatsApp & Telegram • ${hubLive.messagesCount} Messages • ${hubLive.alarmsCount} Alarms Set`,
            chipLabel: '[SIM+INTENT]',
            chipTone: 'emerald',
            isLive: true
          }
        },
        {
          id: 'smart_lifestyle_iot' as SettingsSubScreen,
          title: 'Social media',
          subtitle: 'Instagram, YouTube, Spotify playback & smart lifestyle controls',
          badge: 'IOT PRO',
          icon: <AppIconTile icon={Zap} color="indigo" size="md" />,
          oneLineSummary: {
            text: `💡 ${iotLive.devicesCount} Smart Devices (${iotLive.activeDevices} Online) • Spotify & Fitness Active`,
            chipLabel: '[SIMULATED]',
            chipTone: 'blue',
            isLive: true,
            isSimulated: true
          }
        },
        {
          id: 'neural_trading_matrix' as SettingsSubScreen,
          title: 'Neural Trading & Finance',
          subtitle: 'Auto support/resistance, strategy radar & risk calculator',
          badge: 'FINANCE AI',
          icon: <AppIconTile icon={TrendingUp} color="emerald" size="md" />,
          oneLineSummary: {
            text: `📈 ${tradingLive.symbol} ₹${tradingLive.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${changeArrow}${Math.abs(tradingLive.change).toFixed(2)} (${changeSign}${changePct}%) • PCR ${tradingLive.pcr.toFixed(2)}`,
            chipLabel: '[SIMULATED]',
            chipTone: isTradePositive ? 'emerald' : 'rose',
            isLive: true,
            isSimulated: true
          }
        }
      ]
    },
    {
      category: 'CONNECTED ACCOUNTS',
      items: [
        {
          id: 'optional_integrations' as SettingsSubScreen,
          title: 'Connectors',
          subtitle: 'GitHub, Notion, Telegram, Google Workspace, Maps & Webhooks',
          badge: `${integrations.filter(i => i.status === 'configured' || i.status === 'enabled').length} ACTIVE`,
          icon: <AppIconTile icon={Boxes} color="orange" size="md" />
        },
        {
          id: 'linked_devices' as SettingsSubScreen,
          title: 'Linked Devices & Sync',
          subtitle: 'Sync with MacBook, Pixel Watch, tablet & desktop relays',
          badge: 'MESH ON',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        }
      ]
    },
    {
      category: 'MEMORY & DATA',
      items: [
        {
          id: 'backup' as SettingsSubScreen,
          title: 'Backup & Storage',
          subtitle: 'Export and restore memories, chats & configuration archives',
          badge: `${memories.length} MEMS`,
          icon: <AppIconTile icon={Database} color="blue" size="md" />
        },
        {
          id: 'ai_provider_fallback' as SettingsSubScreen,
          title: 'Multiple AI Provider Fallback',
          subtitle: 'OpenRouter, NVIDIA NIM & Anthropic auto-failover keys',
          badge: 'FAILOVER MATRIX',
          icon: <AppIconTile icon={Zap} color="purple" size="md" />,
          oneLineSummary: {
            text: '⚡ Multi-Provider Failover • OpenRouter • NVIDIA • Anthropic',
            chipLabel: 'AUTO-FAILOVER',
            chipTone: 'purple',
            isLive: true
          }
        },
        {
          id: 'quantum_memory_vision' as SettingsSubScreen,
          title: 'Quantum Memory Vault',
          subtitle: 'Semantic vector memory vault, multi-modal vision logs & doc AI',
          badge: 'BRAIN AI',
          icon: <AppIconTile icon={Brain} color="purple" size="md" />,
          oneLineSummary: {
            text: '🧠 Semantic Memory Vault • Multi-Modal Vision Brain Active',
            chipLabel: '[NEURAL]',
            chipTone: 'purple',
            isLive: true
          }
        }
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        {
          id: 'advanced' as SettingsSubScreen,
          title: 'Advanced',
          subtitle: 'Security shields, telemetry, permissions & kernel controls',
          badge: 'SYSTEM PRO',
          icon: <AppIconTile icon={Cpu} color="cyan" size="md" />,
          oneLineSummary: {
            text: '🛡️ Security Shields • ⚡ Telemetry • ⚙️ Permissions Hub',
            chipLabel: 'ADVANCED',
            chipTone: 'cyan',
            isLive: true
          }
        },
        {
          id: 'appearance' as SettingsSubScreen,
          title: 'Appearance & Orb Studio',
          subtitle: `Dark/light mode, 3D Orb customization, colors & visualizer`,
          badge: isDark ? 'DARK' : 'LIGHT',
          icon: <AppIconTile icon={Palette} color="purple" size="md" />
        },
        {
          id: 'about' as SettingsSubScreen,
          title: 'About MAYRA',
          subtitle: 'v2.4.0 • Android Jetpack Compose Architecture',
          badge: 'v2.4.0',
          icon: <AppIconTile icon={Info} color="slate" size="md" />
        }
      ]
    }
  ];

  const filteredSections = settingSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className={`flex-1 flex flex-col h-full relative select-none overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070312] text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Dynamic Cosmic Ambient Particle Background */}
      <HomeAtmosphereBackground status="READY" />
      
      {/* Top Header - iPhone Liquid Frosted Glass */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between z-10 shrink-0 bg-[#120626]/80 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCloseSettings}
            className="p-2 -ml-1 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2] text-purple-200" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-sans tracking-tight text-white">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Quick Dark Mode Switch & MAYRA Logo Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAppearanceConfig(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className="p-1.5 rounded-full border border-white/15 bg-white/[0.08] text-purple-200 hover:text-white hover:bg-white/[0.15] transition-all cursor-pointer shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Moon className="w-4 h-4 stroke-[1.8]" /> : <Sun className="w-4 h-4 stroke-[1.8]" />}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-400/30 bg-purple-950/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <MayraLogo size={16} showGlow={false} />
            <span className="text-[10px] font-sans font-bold tracking-wider text-purple-100">
              ★MAYRA
            </span>
          </div>
        </div>
      </div>

      {/* Search Input Bar - iPhone Frosted Pill */}
      <div className="p-3 border-b border-white/10 shrink-0 bg-[#120626]/50 backdrop-blur-xl">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300/70 stroke-[1.8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Dashboard..."
            className="w-full pl-9 pr-8 py-2 border border-white/20 rounded-2xl text-xs bg-[#160b29]/60 focus:bg-[#200e3b]/80 text-white placeholder:text-purple-300/40 focus:border-purple-400/70 focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/70 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Settings List - Frosted Liquid Glass Cards */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20">
        {/* Top Glance & Live Widgets Carousel (Watchlist, Alarms, Telemetry, Security) */}
        {!searchQuery && (
          <SettingsTopWidgetCarousel
            onNavigateSubScreen={(screen) => setCurrentSubScreen(screen)}
            assistantConfig={assistantConfig}
            voiceGuardianConfig={voiceGuardianConfig}
            personalConfig={personalConfig}
            permissions={permissions}
            appLockConfig={appLockConfig}
          />
        )}

        {filteredSections.map((section, sIdx) => (
          <div key={`section-${section.category}-${sIdx}`} className="space-y-2">
            <div className="flex items-center gap-2 px-1 pt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              <h3 className="text-[11px] font-sans font-bold tracking-wider uppercase text-purple-300/90">
                {section.category}
              </h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent" />
            </div>

            <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-[#160b29]/50 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              {section.items.map((item, itemIdx) => (
                <button
                  key={`item-${section.category}-${item.id}-${itemIdx}`}
                  onClick={() => {
                    if ((item as any).onClick) {
                      (item as any).onClick();
                    } else {
                      setCurrentSubScreen(item.id);
                    }
                  }}
                  className="w-full p-3.5 flex flex-col justify-center active:scale-[0.99] transition-all text-left group hover:bg-white/[0.06] cursor-pointer gap-1.5"
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-sans tracking-tight text-white group-hover:text-purple-300 transition-colors truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm shrink-0 ${
                              item.badge === 'STUDIO'
                                ? 'bg-purple-950/80 text-purple-200 border border-purple-400/40'
                                : item.badge === 'FINANCE AI'
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-400/40'
                                : item.badge === 'DEV PRO' || item.badge === 'AUTO'
                                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400/40'
                                : item.badge === 'SOS' || item.badge === 'SECURITY'
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-400/40'
                                : item.badge === 'DARK'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                                : item.badge === 'LIGHT'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-400/30'
                                : item.badge.includes('OFF') || item.badge.includes('0/') 
                                ? 'bg-white/10 text-purple-300/60 border border-white/10'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-400/30'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-normal font-sans line-clamp-1 mt-0.5 text-purple-200/60 leading-tight">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>

                  {/* Android Home-Screen Watchlist / Widget Stack: Compact One-Line Live Summary Card */}
                  {item.oneLineSummary && (
                    <div className="w-full mt-1 px-3 py-2 rounded-2xl bg-[#0d051d]/90 border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 group-hover:border-purple-400/40 transition-colors">
                      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        {item.oneLineSummary.isLive && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              item.oneLineSummary.chipTone === 'rose'
                                ? 'bg-rose-400'
                                : item.oneLineSummary.chipTone === 'amber'
                                ? 'bg-amber-400'
                                : item.oneLineSummary.chipTone === 'cyan'
                                ? 'bg-cyan-400'
                                : 'bg-emerald-400'
                            }`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                              item.oneLineSummary.chipTone === 'rose'
                                ? 'bg-rose-500'
                                : item.oneLineSummary.chipTone === 'amber'
                                ? 'bg-amber-500'
                                : item.oneLineSummary.chipTone === 'cyan'
                                ? 'bg-cyan-500'
                                : 'bg-emerald-500'
                            }`} />
                          </span>
                        )}
                        <span className="text-[11px] font-mono font-medium tracking-tight text-slate-100 truncate">
                          {item.oneLineSummary.text}
                        </span>
                      </div>

                      {item.oneLineSummary.chipLabel && (
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 tracking-wider shadow-sm border ${
                          item.oneLineSummary.chipTone === 'rose'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            : item.oneLineSummary.chipTone === 'amber'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : item.oneLineSummary.chipTone === 'cyan'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                            : item.oneLineSummary.chipTone === 'purple'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            : item.oneLineSummary.chipTone === 'blue'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                            : item.oneLineSummary.chipTone === 'slate'
                            ? 'bg-slate-800/80 text-slate-300 border-slate-600/40'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {item.oneLineSummary.chipLabel}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Replay Welcome Tour Card */}
        {onOpenOnboarding && (
          <div className="pt-2 pb-6">
            <button
              onClick={() => {
                onCloseSettings();
                onOpenOnboarding();
              }}
              className="w-full p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 via-violet-950/50 to-fuchsia-950/60 border border-white/20 hover:border-purple-400/60 flex items-center justify-between transition-all group active:scale-[0.98] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold font-sans text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                    <span>Onboarding Dobara Dekhein</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                      TOUR
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-300/70 mt-0.5 font-sans">
                    Replay 6-step Welcome Tour, Language & Permissions
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Home Screen Widget Guide & Preview Modal */}
      <HomeScreenWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        onLaunchVoice={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchVoice) onLaunchVoice();
        }}
        onLaunchScan={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchScan) onLaunchScan();
        }}
        onLaunchChat={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchChat) onLaunchChat();
        }}
        onLaunchRoutine={(routinePrompt) => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchRoutine) onLaunchRoutine(routinePrompt);
        }}
      />

    </div>
  );
};

