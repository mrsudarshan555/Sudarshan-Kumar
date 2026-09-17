import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Info, Check, Sparkles, Star, Crown, 
  ShieldCheck, Zap, User, Lock, CreditCard, ExternalLink
} from 'lucide-react';

interface SubscriptionPlansViewProps {
  onBack: () => void;
  currentTier?: string;
  isSubscribed?: boolean;
  onUpgrade?: (tier: string) => void;
}

interface PlanItem {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  creditBadge: string;
  features: string[];
  icon: any;
}

const PLANS: PlanItem[] = [
  {
    id: 'free',
    name: 'FREE',
    tagline: 'Try MAYRA free for a day.',
    price: '₹ 0',
    period: '/ month',
    creditBadge: '10 CREDITS • 1-DAY TRIAL',
    icon: Sparkles,
    features: [
      '10 Credits - 1 Day Trial',
      'Standard AI Responses',
      'Basic Automation',
      'Community Support'
    ]
  },
  {
    id: 'basic',
    name: 'BASIC',
    tagline: 'Perfect for getting started.',
    price: '₹ 299',
    period: '/ month',
    creditBadge: '50 CREDITS • THEN 20/DAY',
    icon: Star,
    features: [
      '50 Credits, then 20/Day',
      'Standard AI Responses',
      'Basic Automation',
      'Standard Support'
    ]
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    tagline: 'More power, more automation.',
    price: '₹ 349',
    period: '/ month',
    creditBadge: '150 CREDITS • THEN 100/DAY',
    icon: Crown,
    features: [
      '150 Credits, then 100/Day',
      'Advanced AI Models',
      'Smart Automation',
      'Priority Support'
    ]
  },
  {
    id: 'elite',
    name: 'ELITE',
    tagline: 'Unleash advanced features.',
    price: '₹ 449',
    period: '/ month',
    creditBadge: '250 CREDITS • THEN 150/DAY',
    icon: ShieldCheck,
    features: [
      '250 Credits, then 150/Day',
      'All AI Models Access',
      'Advanced Automation',
      'Faster Support'
    ]
  },
  {
    id: 'elite_pro',
    name: 'ELITE PRO',
    tagline: 'Pro level performance and speed',
    price: '₹ 559',
    period: '/ month',
    creditBadge: '500 CREDITS • THEN 200/DAY',
    icon: Zap,
    features: [
      '500 Credits, then 200/Day',
      'All AI Models + Early Access',
      'Pro Automation',
      '24/7 Support'
    ]
  },
  {
    id: 'lifetime',
    name: 'MEMBERSHIP',
    tagline: 'Unlimited power. Unlimited possibilities',
    price: '₹ 999',
    period: '/ lifetime',
    creditBadge: '∞ UNLIMITED CREDIT',
    icon: User,
    features: [
      'Unlimited Credit',
      'All AI Models + Early Access',
      'Ultimate Automation',
      '24/7 Premium Support',
      'Exclusive Features'
    ]
  }
];

export const SubscriptionPlansView: React.FC<SubscriptionPlansViewProps> = ({ 
  onBack,
  currentTier = 'free',
  isSubscribed = false,
  onUpgrade
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(isSubscribed ? currentTier : 'free');
  const [showCreditInfo, setShowCreditInfo] = useState<boolean>(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setUpgradingPlan(planId);
    setTimeout(() => {
      setUpgradingPlan(null);
      setSelectedPlan(planId);
      setUpgradeSuccess(planId);
      if (onUpgrade) {
        onUpgrade(planId);
      }
      setTimeout(() => setUpgradeSuccess(null), 3000);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top App Bar */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-extrabold text-purple-300 tracking-wider uppercase">
            MAYRA
          </h1>
          <p className="text-[11px] text-gray-400">
            Subscription Plans
          </p>
        </div>

        <button
          onClick={() => setShowCreditInfo(!showCreditInfo)}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Main Plans List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-24">
        {/* Upgrade Success Notification */}
        {upgradeSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-white flex items-center gap-3 animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-200">Plan Upgraded Successfully!</p>
              <p className="text-[10px] text-emerald-300/80">All features of the {upgradeSuccess.toUpperCase()} tier are now fully unlocked.</p>
            </div>
          </div>
        )}

        {/* Banner Card */}
        <div className="p-4 rounded-2xl bg-[#121318] border border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-base font-bold text-white leading-snug">
            Unlock the full power <br /> of MAYRA
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Choose the perfect plan and supercharge your AI experience.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#181922] border border-white/10 rounded-full text-[11px] font-medium text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>1 Credit = 1 Action</span>
          </div>
        </div>

        {/* Plan Cards */}
        {PLANS.map(plan => {
          const IconComp = plan.icon;
          const isCurrent = plan.id === selectedPlan;
          const isProcessing = upgradingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`p-4 rounded-2xl bg-[#121318] border transition-all ${
                isCurrent 
                  ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Header inside plan */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  {plan.creditBadge}
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline justify-between mt-4 pb-3 border-b border-white/5">
                <div>
                  <span className="text-xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    {plan.period}
                  </span>
                </div>

                {isCurrent ? (
                  <button
                    disabled
                    className="px-5 py-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? 'Activating...' : (plan.id === 'free' ? 'Select Free' : 'Subscribe')}
                  </button>
                )}
              </div>

              {/* Feature Bullets */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer Guarantee Links */}
        <div className="pt-4 space-y-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-purple-400 font-medium cursor-pointer">
            <span>How Credits Work?</span>
            <span className="underline ml-1">View Credit Usage &gt;</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121318] border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Secure Payment</p>
                <p className="text-[10px] text-gray-500">100% Safe & Secure</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121318] border border-white/5">
              <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Cancel Anytime</p>
                <p className="text-[10px] text-gray-500">No hidden charges</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121318] border border-white/5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Instant Activation</p>
                <p className="text-[10px] text-gray-500">Activate in Seconds</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121318] border border-white/5">
              <User className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Dedicated Support</p>
                <p className="text-[10px] text-gray-500">We're here for you</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 pt-2">
            By continuing, you agree to MAYRA's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
