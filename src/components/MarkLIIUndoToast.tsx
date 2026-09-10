import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle2, Sparkles, X } from 'lucide-react';
import { UndoService, UndoEntry } from '../services/markLII/undoService';

export const MarkLIIUndoToast: React.FC = () => {
  const [lastEntry, setLastEntry] = useState<UndoEntry | null>(null);
  const [undoneNotice, setUndoneNotice] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = UndoService.subscribe((stack, lastUndone) => {
      if (lastUndone) {
        setUndoneNotice(lastUndone);
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 4000);
        return () => clearTimeout(timer);
      } else if (stack.length > 0) {
        setLastEntry(stack[0]);
        setUndoneNotice(null);
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 6000);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUndo = async () => {
    if (isUndoing) return;
    setIsUndoing(true);
    await UndoService.undoLast();
    setIsUndoing(false);
  };

  if (!isVisible) return null;

  return (
    <div
      id="marklii-undo-toast"
      className="absolute top-14 left-4 right-4 z-50 flex items-center justify-between p-3 rounded-xl backdrop-blur-md bg-zinc-900/90 border border-cyan-500/40 text-white shadow-2xl shadow-cyan-950/40 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        {undoneNotice ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-100 truncate">
            {undoneNotice ? `वापस किया गया: ${undoneNotice}` : `किया गया: ${lastEntry?.label}`}
          </p>
          <p className="text-[10px] text-zinc-400">
            {undoneNotice ? 'Mark-LII Reversible Stack Restored' : 'Mark-LII Undo Stack उपलब्ध है'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {!undoneNotice && (
          <button
            id="marklii-undo-action-btn"
            type="button"
            onClick={handleUndo}
            disabled={isUndoing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium active:scale-95 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isUndoing ? 'animate-spin' : ''}`} />
            <span>{isUndoing ? 'वापस हो रहा...' : 'Undo'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
