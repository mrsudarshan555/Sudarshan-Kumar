import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, User, Mail, Shield, Smartphone, KeyRound, 
  Gift, Tag, FileText, History, Download, Trash2, Key, 
  Database, FileCheck, LogOut, ChevronRight, X, Check, RefreshCw
} from 'lucide-react';
import { UserPersonalConfig } from '../../types';
import { detectUserDevice, DeviceTelemetry } from '../../utils/deviceDetector';

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
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(personalConfig.userName || personalConfig.fullName || 'MindSet Zafer');
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(() => detectUserDevice());
  const [isRefreshingDevice, setIsRefreshingDevice] = useState(false);

  useEffect(() => {
    setTelemetry(detectUserDevice());
  }, []);

  const handleRefreshDevice = () => {
    setIsRefreshingDevice(true);
    setTimeout(() => {
      const detected = detectUserDevice();
      setTelemetry(detected);
      setIsRefreshingDevice(false);
      showToast(`Device detected: ${detected.deviceName}`);
    }, 400);
  };

  const handleEditDeviceName = () => {
    const custom = prompt('Enter your phone model name (e.g. Samsung Galaxy S23, Realme 9 Pro, etc.):', telemetry.deviceName);
    if (custom && custom.trim()) {
      localStorage.setItem('mayra_custom_device_name', custom.trim());
      setTelemetry(prev => ({ ...prev, deviceName: custom.trim() }));
      showToast('Device name updated!');
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
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-900 to-red-900 border border-white/10 p-0.5 shrink-0 shadow-[0_0_15px_rgba(255,42,75,0.3)]">
              <img
                src="/mayra_logo.png"
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                }}
              />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-white">
                {userName}
              </h2>
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
            Edit Profile
          </button>
        </div>

        {/* Plan Details Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs text-gray-400">Current Plan</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ff2a4b]/10 text-[#ff2a4b] border border-[#ff2a4b]/30">
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

        {/* Device & App Info */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 tracking-wider">
              DEVICE & APP INFO
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditDeviceName}
                className="text-[10px] text-[#ff2a4b] hover:underline font-semibold cursor-pointer"
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
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Current Device</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <span>{telemetry.deviceName}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  DETECTED
                </span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Android OS</span>
              <span className="text-white font-medium">{telemetry.osVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">RAM / Memory</span>
              <span className="text-white font-medium">{telemetry.ramEstimate} ({telemetry.cpuCores} Cores)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Display Resolution</span>
              <span className="text-white font-medium">{telemetry.screenResolution}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Runtime Package</span>
              <span className="text-white font-medium">MAYRA Native APK (v2.1.48)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Network Telemetry</span>
              <span className="text-white font-medium">{telemetry.networkType}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Voice Pipeline Status</span>
              <span className="text-white font-medium text-emerald-400">Engine Ready</span>
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
            { title: 'Privacy Policy', icon: FileCheck, action: () => window.open('#', '_blank') },
            { title: 'Terms & Conditions', icon: FileCheck, action: () => window.open('#', '_blank') }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={item.action}
                className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 hover:bg-[#161720] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1b24] border border-white/10 flex items-center justify-center text-[#ff2a4b] shrink-0">
                    <Icon className={`w-4 h-4 ${item.color || 'text-[#ff2a4b]'}`} />
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
            className="w-full py-3.5 rounded-2xl bg-transparent border border-[#ff2a4b]/50 hover:bg-[#ff2a4b]/10 text-[#ff2a4b] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
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
            className="absolute bottom-6 inset-x-6 py-2.5 px-4 bg-[#181924] border border-white/10 rounded-xl text-center text-xs font-semibold text-white shadow-2xl z-40"
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
                Enter the access key you received to activate a MYRA plan on this account.
              </p>

              <input
                type="text"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                placeholder="ACCESS-KEY-XXXX"
                className="w-full bg-[#161720] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 font-mono outline-none focus:border-[#ff2a4b]"
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
                  className="px-5 py-2 rounded-xl bg-[#ff2a4b] text-white text-xs font-bold shadow-[0_0_12px_rgba(255,42,75,0.4)]"
                >
                  REDEEM
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
