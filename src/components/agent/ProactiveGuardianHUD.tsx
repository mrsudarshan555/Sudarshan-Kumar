import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, BatteryWarning, Moon, Cpu, Bell, Check, X, Eye } from 'lucide-react';
import { ProactiveAlert } from '../../services/automation/ProactiveSmartGuardianEngine';

interface ProactiveGuardianHUDProps {
  alert: ProactiveAlert | null;
  onDismiss: () => void;
  onAccept?: (alert: ProactiveAlert) => void;
}

export const ProactiveGuardianHUD: React.FC<ProactiveGuardianHUDProps> = ({
  alert,
  onDismiss,
  onAccept
}) => {
  if (!alert) return null;

  const getIcon = () => {
    switch (alert.type) {
      case 'battery':
        return <BatteryWarning className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'night_owl':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'system_ram':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'memory_insight':
        return <Eye className="w-5 h-5 text-pink-400" />;
      case 'routine':
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBorderColor = () => {
    switch (alert.priority) {
      case 'critical':
      case 'high':
        return 'border-amber-500/40 bg-amber-950/80 shadow-amber-500/20';
      case 'medium':
        return 'border-indigo-500/40 bg-slate-900/90 shadow-indigo-500/20';
      case 'low':
      default:
        return 'border-emerald-500/40 bg-slate-900/90 shadow-emerald-500/20';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: -25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed top-12 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className={`p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl text-white ${getBorderColor()}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-semibold tracking-wide text-emerald-300 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  SMART GUARDIAN (FEATURE C)
                </span>
                <span className="text-[10px] text-white/50">Live Watchdog</span>
              </div>

              <h4 className="text-sm font-semibold text-white/95 leading-snug">
                {alert.title}
              </h4>

              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {alert.messageHi}
              </p>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
                {alert.suggestedAction && (
                  <button
                    onClick={() => {
                      if (onAccept) onAccept(alert);
                      onDismiss();
                    }}
                    className="flex-1 py-1.5 px-3 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{alert.suggestedAction.labelHi}</span>
                  </button>
                )}

                <button
                  onClick={onDismiss}
                  className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>बंद करें</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
