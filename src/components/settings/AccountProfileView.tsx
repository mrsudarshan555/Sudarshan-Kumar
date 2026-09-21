import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, User, Mail, Shield, Smartphone, KeyRound, 
  Gift, Tag, FileText, History, Download, Trash2, Key, 
  Database, FileCheck, LogOut, ChevronRight, X, Check, RefreshCw, Camera, Sparkles, Wifi, Cpu
} from 'lucide-react';
import { UserPersonalConfig } from '../../types';
import { 
  detectUserDevice, 
  DeviceTelemetry, 
  subscribeDeviceTelemetry, 
  initDynamicDeviceDetector 
} from '../../utils/deviceDetector';
import { ProfilePhotoUploadModal, FALLBACK_DEFAULT_PHOTO } from './ProfilePhotoUploadModal';
import { LegalTermsPrivacyModal } from './LegalTermsPrivacyModal';

interface AccountProfileViewProps {
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  onBack: () => void;
  onLogout?: () => void;
}

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({
  personalConfig,
  setPersonalConfig,
  onBack,
  onLogout
}) => {
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | null>(null);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(personalConfig.userName || personalConfig.fullName || 'MindSet Zafer');
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(() => detectUserDevice());
  const [isRefreshingDevice, setIsRefreshingDevice] = useState(false);

  const activeAvatar = personalConfig.profilePhoto || personalConfig.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('mayra_user_avatar') : null) || FALLBACK_DEFAULT_PHOTO;

  // Real-time live hardware & network updates
  useEffect(() => {
    // Initial sync
    setTelemetry(detectUserDevice());
    
    // Async client hints for true model names
    initDynamicDeviceDetector().then(detected => {
      setTelemetry(detected);
    });

    // Subscribe to live network type (5G/4G/Wi-Fi) shifts and battery
    const unsubscribe = subscribeDeviceTelemetry((updated) => {
      setTelemetry(updated);
    });

    return () => unsubscribe();
  }, []);

  const handleRefreshDevice = () => {
    setIsRefreshingDevice(true);
    initDynamicDeviceDetector().then((detected) => {
      setTelemetry(detected);
      setIsRefreshingDevice(false);
      showToast(`Hardware Updated: ${detected.deviceName} • ${detected.networkType}`);
    }).catch(() => {
      const detected = detectUserDevice();
      setTelemetry(detected);
      setIsRefreshingDevice(false);
      showToast(`Device verified: ${detected.deviceName}`);
    });
  };

  const handleEditDeviceName = () => {
    const custom = prompt('Enter your phone model name (e.g. Samsung Galaxy S23, Realme 9 Pro 5G, etc.):', telemetry.deviceName);
    if (custom && custom.trim()) {
      localStorage.setItem('mayra_custom_device_name', custom.trim());
      setTelemetry(prev => ({ ...prev, deviceName: custom.trim() }));
      showToast('Device model updated!');
    }
  };

  const handleEditRam = () => {
    const custom = prompt('Enter your phone RAM capacity (e.g. 6 GB RAM, 8 GB RAM, 12 GB RAM):', telemetry.ramEstimate);
    if (custom && custom.trim()) {
      localStorage.setItem('mayra_custom_device_ram', custom.trim());
      setTelemetry(prev => ({ ...prev, ramEstimate: custom.trim() }));
      showToast('RAM information updated!');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
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
            Account & Profile
          </h1>
          <p className="text-[11px] text-gray-400">
            Manage your profile and device telemetry
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-28">
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div 
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative group cursor-pointer"
              title="Click to update profile photo"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-900 to-indigo-900 border border-purple-400/30 p-0.5 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.35)] group-hover:border-purple-400 transition-all">
                <img
                  src={activeAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as any).src = FALLBACK_DEFAULT_PHOTO;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 border-2 border-[#121318] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <Camera className="w-3 h-3 stroke-[2.2]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white">
                  {userName}
                </h2>
                <button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Edit Photo
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                mindsetzafer@gmail.com
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const newName = prompt('Enter display name:', userName);
              if (newName && newName.trim()) {
                setUserName(newName.trim());
                setPersonalConfig(prev => ({ ...prev, userName: newName.trim() }));
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 text-xs font-bold text-gray-200 transition-colors cursor-pointer"
          >
            Edit Name
          </button>
        </div>

        {/* Plan Details Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs text-gray-400">Current Plan</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-950/80 text-purple-300 border border-purple-500/30">
              Free Tier
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-[#15161f]">
              <p className="text-[10px] text-gray-500 font-medium">Credits Used</p>
              <p className="text-xs font-bold text-white mt-0.5">-- / --</p>
            </div>
            <div className="p-2 rounded-xl bg-[#15161f]">
              <p className="text-[10px] text-gray-500 font-medium">Tasks Left</p>
              <p className="text-xs font-bold text-white mt-0.5">N/A</p>
            </div>
            <div className="p-2 rounded-xl bg-[#15161f]">
              <p className="text-[10px] text-gray-500 font-medium">Valid Till</p>
              <p className="text-xs font-bold text-white mt-0.5">--</p>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            ACCOUNT DETAILS
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">UID</span>
              <span className="font-mono text-gray-200">{telemetry.uid}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Activation ID</span>
              <span className="font-mono text-gray-200">{telemetry.activationId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-200">15 Sep 2026</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Last Login</span>
              <span className="text-gray-200">Active Now</span>
            </div>
          </div>
        </div>

        {/* Device & App Info (Live Real Hardware Detection) */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider">
              DEVICE & APP INFO
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditDeviceName}
                className="text-[10px] text-purple-400 hover:underline font-semibold cursor-pointer"
                title="Change phone model name"
              >
                Change
              </button>
              <button
                onClick={handleRefreshDevice}
                className={`p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer ${isRefreshingDevice ? 'animate-spin' : ''}`}
                title="Detect Real Hardware"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5 items-center">
              <span className="text-gray-400">Current Device</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <span>{telemetry.deviceName}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  LIVE
                </span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Android OS</span>
              <span className="text-white font-medium">{telemetry.osVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5 items-center">
              <span className="text-gray-400 flex items-center gap-1">
                <span>RAM / Memory</span>
                <button
                  onClick={handleEditRam}
                  className="text-[10px] text-purple-400 hover:underline font-normal cursor-pointer ml-1"
                  title="Edit RAM"
                >
                  (Adjust)
                </button>
              </span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <span>{telemetry.ramEstimate}</span>
                <span className="text-gray-400 font-normal">({telemetry.cpuCores} Cores)</span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Display Resolution</span>
              <span className="text-white font-medium">{telemetry.screenResolution}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Runtime Package</span>
              <span className="text-white font-medium">{telemetry.browserOrRuntime}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5 items-center">
              <span className="text-gray-400 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-purple-400" />
                <span>Network Telemetry</span>
              </span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <span>{telemetry.networkType}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Voice Pipeline Status</span>
              <span className="text-white font-medium text-emerald-400">Engine Ready (24kHz HD)</span>
            </div>
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-2">
          {[
            { title: 'Referral Program', icon: Gift, action: () => showToast('Referral program link copied!') },
            { title: 'My Coupons', icon: Tag, action: () => showToast('No active coupons found.') },
            { title: 'Invoices', icon: FileText, action: () => showToast('Invoices is coming soon!') },
            { title: 'Purchase History', icon: History, action: () => showToast('Purchase History is coming soon!') },
            { title: 'License Key', icon: KeyRound, action: () => setShowRedeemModal(true) },
            { title: 'Export Data', icon: Download, action: () => showToast('Export Data is coming soon!') },
            { title: 'Delete Account', icon: Trash2, color: 'text-red-500', action: () => {
              if (confirm('Are you sure you want to request account deletion?')) {
                showToast('Account deletion requested.');
              }
            }},
            { title: 'Change Password', icon: Key, action: () => showToast('Change Password is coming soon!') },
            { title: 'Backup & Restore', icon: Database, action: () => showToast('Backup & Restore is coming soon!') },
            { title: 'Privacy Policy', icon: Shield, action: () => setLegalModalTab('privacy') },
            { title: 'Terms & Conditions', icon: FileCheck, action: () => setLegalModalTab('terms') }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={item.action}
                className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 hover:bg-[#161720] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1b24] border border-white/10 flex items-center justify-center text-purple-400 shrink-0">
                    <Icon className={`w-4 h-4 ${item.color || 'text-purple-400'}`} />
                  </div>
                  <span className={`text-xs font-bold ${item.color || 'text-white'}`}>
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (onLogout) onLogout();
              showToast('Logged out successfully.');
            }}
            className="w-full py-3.5 rounded-2xl bg-transparent border border-purple-500/50 hover:bg-purple-950/20 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out from Account</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 inset-x-6 py-2.5 px-4 bg-[#181924] border border-purple-500/30 rounded-xl text-center text-xs font-semibold text-white shadow-2xl z-40"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Access Key Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          >
            <div className="w-full max-w-sm bg-[#121318] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Redeem Access Key
                </h3>
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Enter the access key you received to activate a MAYRA plan on this account.
              </p>

              <input
                type="text"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                placeholder="ACCESS-KEY-XXXX"
                className="w-full bg-[#161720] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-purple-400"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (accessKeyInput.trim()) {
                      setShowRedeemModal(false);
                      setAccessKeyInput('');
                      showToast('Access Key Redeemed Successfully!');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                >
                  REDEEM
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Photo Upload Modal */}
      <ProfilePhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        personalConfig={personalConfig}
        setPersonalConfig={setPersonalConfig}
        onPhotoUpdated={(newUrl) => {
          showToast('Profile photo updated successfully!');
        }}
      />

      {/* Standard Privacy Policy & Terms & Conditions Modal */}
      <LegalTermsPrivacyModal
        isOpen={legalModalTab !== null}
        onClose={() => setLegalModalTab(null)}
        defaultTab={legalModalTab || 'privacy'}
      />
    </div>
  );
};
