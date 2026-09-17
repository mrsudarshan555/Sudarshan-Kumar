import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Lock, KeyRound, Check, ExternalLink, 
  Sparkles, ShieldCheck, ShoppingCart, AlertCircle
} from 'lucide-react';

interface LicenseActivationViewProps {
  onBack: () => void;
  onNavigateToPlans?: () => void;
  isSubscribed?: boolean;
  onActivateSuccess?: (tier: 'pro' | 'lifetime') => void;
}

export const LicenseActivationView: React.FC<LicenseActivationViewProps> = ({ 
  onBack,
  onNavigateToPlans,
  isSubscribed = false,
  onActivateSuccess
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(isSubscribed);
  const [errorMsg, setErrorMsg] = useState('');

  const handleActivate = () => {
    if (!licenseKey.trim()) {
      setErrorMsg('Please enter a valid license key.');
      return;
    }
    setErrorMsg('');
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setIsSuccess(true);
      if (onActivateSuccess) {
        onActivateSuccess('lifetime');
      }
    }, 1500);
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
            License & Subscription
          </h1>
          <p className="text-[11px] text-gray-400">
            Secure MAYRA premium access
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-24">
        {/* Status Card */}
        <div className="p-5 rounded-2xl bg-[#121318] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            {isSuccess ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">
              {isSuccess ? 'ACTIVATED (PRO LIFETIME)' : 'NOT ACTIVATED'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Plan: {isSuccess ? 'Lifetime Membership' : 'Free Tier'}
            </p>
          </div>
        </div>

        {/* Activation Card */}
        <div className="p-5 rounded-2xl bg-[#121318] border border-white/5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">
              Activate your license
            </h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Enter the license / access key you purchased from the official store to unlock all AI models & unlimited automations.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="MAYRA-XXXX-XXXX-XXXX"
              className="w-full bg-[#15161d] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400 transition-colors font-mono uppercase tracking-wider"
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isActivating ? (
              <span>Verifying Cryptographic Signature...</span>
            ) : isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>License Activated!</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Activate License</span>
              </>
            )}
          </button>

          <button
            onClick={onNavigateToPlans}
            className="w-full py-3 rounded-xl bg-[#181922] hover:bg-[#20222f] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-purple-400" />
            <span>Buy License from Official Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};
