import React, { useEffect, useState } from 'react';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';
import { ConfirmationGateService, PendingConfirmation } from '../services/markLII/confirmationGateService';

export const MarkLIIConfirmationModal: React.FC = () => {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = ConfirmationGateService.subscribe((conf) => {
      setPending(conf);
      if (conf) {
        const remaining = Math.max(0, Math.round((conf.expiresAt - Date.now()) / 1000));
        setSecondsRemaining(remaining);
      }
    });

    return () => unsubscribe();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!pending) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((pending.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        ConfirmationGateService.cancelPending(pending.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pending]);

  if (!pending) return null;

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await ConfirmationGateService.confirmPending(pending.id);
    setIsProcessing(false);
  };

  const handleCancel = () => {
    ConfirmationGateService.cancelPending(pending.id);
  };

  const isCritical = pending.dangerLevel === 'critical';

  return (
    <div
      id="marklii-confirmation-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-5 text-white flex flex-col space-y-4">
        <div className="flex items-start space-x-3">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
            }`}
          >
            {isCritical ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Mark-LII Safety Gate
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {secondsRemaining}s
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mt-1">{pending.title}</h3>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{pending.description}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <p className="text-[11px] text-amber-300 font-medium leading-normal">
            ⚠️ यह एक संवेदनशील क्रिया है। सुरक्षा कारणों से AI मॉडल इसे स्वयं अनुमोदित नहीं कर सकता। आपकी सीधी पुष्टि आवश्यक है।
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            id="marklii-confirm-cancel-btn"
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
            <span>रद्द करें (Cancel)</span>
          </button>
          <button
            id="marklii-confirm-approve-btn"
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl font-medium text-xs text-white shadow-lg active:scale-95 transition ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'प्रोसेसिंग...' : 'पुष्टि करें (Confirm)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
