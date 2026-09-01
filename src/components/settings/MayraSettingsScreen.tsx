import React, { useState } from 'react';
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
import { AdvancedSettingsView } from './AdvancedSettingsView';
import { OptionalIntegrationsView } from './OptionalIntegrationsView';
import { PrivacyView } from './PrivacyView';
import { AboutView } from './AboutView';
import { PermissionsCenterView } from './PermissionsCenterView';
import { NativeIntegrationView } from './NativeIntegrationView';
import { LinkedDevicesView } from './LinkedDevicesView';
import { OfflineModelsView } from './OfflineModelsView';
import { WhiteboardTool } from '../tools/WhiteboardTool';
import { MayraLogo } from '../common/MayraLogo';
import { AppIconTile } from '../common/AppIconTile';
import { ORB_STYLES, ORB_COLORS } from '../character/MayraOrb';
import { 
  Settings as SettingsIcon, User, Globe, Sparkles, 
  Wrench, Bot, ShieldCheck, Database, Cpu, 
  Boxes, Lock, Info, ChevronRight, ArrowLeft, Search, X,
  Shield, CheckCircle2, Smartphone, PenTool, HardDrive,
  Palette, Moon, Sun
} from 'lucide-react';

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
  const isDark = appearanceConfig?.darkMode ?? true;

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
          onBack={() => setCurrentSubScreen('root')}
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
          onBack={() => setCurrentSubScreen('personal')}
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
          onBack={() => setCurrentSubScreen('root')}
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

  if (currentSubScreen === 'advanced') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AdvancedSettingsView
          config={advancedConfig}
          onChange={(updated) => setAdvancedConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
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
          onBack={() => setCurrentSubScreen('root')} 
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

interface SettingCategoryItem {
  id: SettingsSubScreen;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

interface SettingCategorySection {
  category: string;
  items: SettingCategoryItem[];
}

  const grantedPermissionsCount = permissions.filter(p => p.status === 'granted' || p.id === 'default_assistant').length;

  const currentOrbStyleName = ORB_STYLES.find(s => s.id === appearanceConfig.orbStyle)?.name || 'Mayra Glow';
  const currentOrbColorName = ORB_COLORS[appearanceConfig.orbColor]?.name || 'Cyan';

  const settingSections: SettingCategorySection[] = [
    {
      category: 'APPEARANCE & PERSONALIZATION',
      items: [
        {
          id: 'orb_customization' as SettingsSubScreen,
          title: 'Orb Customization Studio',
          subtitle: `Rendering physics • Rainbow hue spectrum • Voice visualizer & aura edge`,
          badge: 'STUDIO',
          icon: <AppIconTile icon={Sparkles} color="cyan" size="md" />
        },
        {
          id: 'appearance' as SettingsSubScreen,
          title: 'Appearance & Display',
          subtitle: `${isDark ? 'Dark Mode' : 'Light Mode'} • ${currentOrbStyleName} • Theme Presets`,
          badge: isDark ? 'DARK' : 'LIGHT',
          icon: <AppIconTile icon={Palette} color="purple" size="md" />
        }
      ]
    },
    {
      category: 'PERMISSIONS & SYSTEM ACCESS',
      items: [
        {
          id: 'native_integration' as SettingsSubScreen,
          title: 'Android System Integration',
          subtitle: 'Calls • Direct SMS • WhatsApp auto-tap • Notifications',
          badge: 'KOTLIN',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        },
        {
          id: 'permissions' as SettingsSubScreen,
          title: 'Permissions Center',
          subtitle: `${grantedPermissionsCount} of ${permissions.length} active • Assistant, Screen, Mic, Overlay`,
          badge: `${grantedPermissionsCount}/${permissions.length}`,
          icon: <AppIconTile icon={Shield} color="emerald" size="md" />
        }
      ]
    },
    {
      category: 'ACCOUNT',
      items: [
        {
          id: 'personal' as SettingsSubScreen,
          title: 'Account',
          subtitle: `${personalConfig.preferredName || personalConfig.fullName || 'Zafer'}${personalConfig.profession ? ` • ${personalConfig.profession}` : ''} • Profile & AI Config`,
          icon: <AppIconTile icon={User} color="indigo" size="md" />
        },
        {
          id: 'country_code' as SettingsSubScreen,
          title: 'Country Code',
          subtitle: `${personalConfig.countryName} (${personalConfig.countryDialCode})`,
          icon: <AppIconTile icon={Globe} color="teal" size="md" />
        }
      ]
    },
    {
      category: 'ASSISTANT',
      items: [
        {
          id: 'assistant' as SettingsSubScreen,
          title: 'AI Assistant Core Engine',
          subtitle: assistantConfig.activeMode === 'stonicx' 
            ? 'STONICX Active • Living Circuit • Quantum Terminal' 
            : `MAYRA Active • ${assistantConfig.personaTone.toUpperCase()} • 3D Avatar`,
          badge: assistantConfig.activeMode === 'stonicx' ? '⚡ STONICX' : '⭐ MAYRA',
          icon: <AppIconTile icon={Sparkles} color={assistantConfig.activeMode === 'stonicx' ? 'amber' : 'purple'} size="md" />
        },
        {
          id: 'offline_models' as SettingsSubScreen,
          title: 'Offline AI Models',
          subtitle: 'Local GGUF models • LFM 2.5, Qwen, SmolLM2, Llama',
          badge: 'GGUF',
          icon: <AppIconTile icon={HardDrive} color="slate" size="md" />
        },
        {
          id: 'skills' as SettingsSubScreen,
          title: 'Skills',
          subtitle: `${skills.filter(s => s.enabled).length} of ${skills.length} active`,
          icon: <AppIconTile icon={Wrench} color="amber" size="md" />
        },
        {
          id: 'sub_agents' as SettingsSubScreen,
          title: 'Sub-agents',
          subtitle: `${subAgents.filter(a => a.enabled).length} active agents`,
          icon: <AppIconTile icon={Bot} color="pink" size="md" />
        }
      ]
    },
    {
      category: 'VOICE GUARDIAN',
      items: [
        {
          id: 'voice_guardian' as SettingsSubScreen,
          title: 'Voice Guardian',
          subtitle: voiceGuardianConfig.enabled ? 'ACTIVE • Owner Only' : 'DISABLED',
          badge: voiceGuardianConfig.enabled ? 'SHIELD ON' : 'OFF',
          icon: <AppIconTile icon={ShieldCheck} color="cyan" size="md" />
        }
      ]
    },
    {
      category: 'MULTI-DEVICE & CREATIVE TOOLS',
      items: [
        {
          id: 'linked_devices' as SettingsSubScreen,
          title: 'Linked Devices & Sync',
          subtitle: '4 connected • Pixel Watch, Tablet, MacBook relay',
          badge: 'MESH ON',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        },
        {
          id: 'whiteboard' as SettingsSubScreen,
          title: 'Interactive Whiteboard',
          subtitle: 'Canvas drawing, wireframing & Vision AI analysis',
          badge: 'NEW',
          icon: <AppIconTile icon={PenTool} color="rose" size="md" />
        },
        {
          id: 'widget_guide' as SettingsSubScreen,
          title: 'Home Screen Widget',
          subtitle: 'Android 4x2 Launcher Quick Widget • 1-tap Voice & Scan',
          badge: 'PREVIEW',
          icon: <AppIconTile icon={Smartphone} color="cyan" size="md" />,
          onClick: () => setIsWidgetModalOpen(true)
        }
      ]
    },
    {
      category: 'MEMORY & DATA',
      items: [
        {
          id: 'backup' as SettingsSubScreen,
          title: 'Backup & Storage',
          subtitle: `${memories.length} memories • Export / Reset`,
          icon: <AppIconTile icon={Database} color="blue" size="md" />
        }
      ]
    },
    {
      category: 'SYSTEM & INTEGRATIONS',
      items: [
        {
          id: 'advanced' as SettingsSubScreen,
          title: 'Advanced Settings',
          subtitle: 'Safety filters • Debug logs • Background tasks',
          icon: <AppIconTile icon={Cpu} color="slate" size="md" />
        },
        {
          id: 'optional_integrations' as SettingsSubScreen,
          title: 'Optional Integrations',
          subtitle: `${integrations.filter(i => i.status === 'configured').length} configured • Workspace, Maps, IoT`,
          icon: <AppIconTile icon={Boxes} color="orange" size="md" />
        },
        {
          id: 'privacy' as SettingsSubScreen,
          title: 'Privacy & Security',
          subtitle: 'Zero data sales • On-device biometric shield',
          icon: <AppIconTile icon={Lock} color="rose" size="md" />
        },
        {
          id: 'about' as SettingsSubScreen,
          title: 'About MAYRA',
          subtitle: 'v2.4.0 • Android Jetpack Compose Architecture',
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
    <div className={`flex-1 flex flex-col h-full relative select-none transition-colors duration-200 ${
      isDark ? 'bg-[#070312] text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      
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
              Settings
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
            placeholder="Search settings..."
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
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/20">
        {filteredSections.map((section) => (
          <div key={section.category} className="space-y-1.5">
            <h3 className="text-[10px] font-sans font-bold tracking-widest px-2.5 uppercase text-purple-300/80">
              {section.category}
            </h3>

            <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-[#160b29]/50 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ((item as any).onClick) {
                      (item as any).onClick();
                    } else {
                      setCurrentSubScreen(item.id);
                    }
                  }}
                  className="w-full p-3.5 flex items-center justify-between active:scale-[0.99] transition-colors text-left group hover:bg-white/[0.06] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-sans tracking-tight text-white group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm ${
                            item.badge === 'STUDIO'
                              ? 'bg-purple-950/80 text-purple-200 border border-purple-400/40'
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
                      <p className="text-[10px] font-normal font-sans line-clamp-1 mt-0.5 text-purple-300/60">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
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

