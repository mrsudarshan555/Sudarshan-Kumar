import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, ArrowUp, X, Paperclip } from 'lucide-react';
import { AssistantStatus } from '../../types';

interface MorphingAuroraInputBoxProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSubmit: () => void;
  onTriggerVoice: () => void;
  onStartPtt?: () => void;
  onStopPtt?: () => void;
  onOpenAttachment?: () => void;
  status?: AssistantStatus;
  attachedFile?: { name: string; size?: string; mimeType?: string } | null;
  onRemoveAttachment?: () => void;
  placeholder?: string;
  showHeading?: boolean;
  headingText?: string;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const SUGGESTIONS = [
  "Ask Mayra anything...",
  "Search memories or facts...",
  "Analyze a document or photo...",
  "Plan today's schedule & routines...",
  "Draft a message or summarize...",
  "Ask about tech, health, or code..."
];

export const MorphingAuroraInputBox: React.FC<MorphingAuroraInputBoxProps> = ({
  inputText,
  setInputText,
  onSubmit,
  onTriggerVoice,
  onStartPtt,
  onStopPtt,
  onOpenAttachment,
  status = 'READY',
  attachedFile = null,
  onRemoveAttachment,
  placeholder = "What's your mind today",
  showHeading = true,
  headingText = "What's on your mind today?",
  isFocused: externalIsFocused,
  onFocusChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalIsFocused, setInternalIsFocused] = useState<boolean>(false);
  const [lineCount, setLineCount] = useState<number>(1);

  // Dedicated Undo & Redo History Stack
  const historyRef = useRef<{ past: string[]; future: string[]; lastSavedText: string }>({
    past: [],
    future: [],
    lastSavedText: ''
  });

  const micPressTimerRef = useRef<any>(null);
  const isMicHoldingRef = useRef<boolean>(false);
  const micPressStartTimeRef = useRef<number>(0);

  const isFocused = externalIsFocused !== undefined ? externalIsFocused : internalIsFocused;

  const handleFocusChange = (focused: boolean) => {
    setInternalIsFocused(focused);
    onFocusChange?.(focused);
  };

  // Track text changes into Undo History Stack
  const handleTextChange = (newVal: string) => {
    const current = historyRef.current;
    if (newVal !== inputText) {
      // Save snapshot if word boundary or significant edit
      const lengthDiff = Math.abs(newVal.length - current.lastSavedText.length);
      const isWordBoundary = newVal.endsWith(' ') || newVal.endsWith('\n') || newVal.endsWith('.');
      
      if (lengthDiff > 5 || isWordBoundary || current.past.length === 0) {
        current.past.push(inputText);
        if (current.past.length > 50) current.past.shift();
        current.future = []; // Clear redo on new input
        current.lastSavedText = newVal;
      }
    }
    setInputText(newVal);
  };

  // Undo implementation
  const handleUndo = useCallback(() => {
    const current = historyRef.current;
    if (current.past.length > 0) {
      const prevText = current.past.pop()!;
      current.future.push(inputText);
      current.lastSavedText = prevText;
      setInputText(prevText);
    } else if (inputText.length > 0) {
      current.future.push(inputText);
      current.lastSavedText = '';
      setInputText('');
    }
  }, [inputText, setInputText]);

  // Redo implementation
  const handleRedo = useCallback(() => {
    const current = historyRef.current;
    if (current.future.length > 0) {
      const nextText = current.future.pop()!;
      current.past.push(inputText);
      current.lastSavedText = nextText;
      setInputText(nextText);
    }
  }, [inputText, setInputText]);

  // Push-to-talk pointer handlers
  const handleMicPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    micPressStartTimeRef.current = Date.now();
    isMicHoldingRef.current = false;

    if (status === 'SPEAKING') {
      onTriggerVoice();
      return;
    }

    micPressTimerRef.current = setTimeout(() => {
      isMicHoldingRef.current = true;
      onStartPtt?.();
    }, 260);
  };

  const handleMicPointerUp = () => {
    if (micPressTimerRef.current) {
      clearTimeout(micPressTimerRef.current);
      micPressTimerRef.current = null;
    }
    if (isMicHoldingRef.current) {
      isMicHoldingRef.current = false;
      onStopPtt?.();
    }
  };

  const handleMicPointerCancel = () => {
    if (micPressTimerRef.current) {
      clearTimeout(micPressTimerRef.current);
      micPressTimerRef.current = null;
    }
    if (isMicHoldingRef.current) {
      isMicHoldingRef.current = false;
      onStopPtt?.();
    }
  };

  const handleMicClick = () => {
    const pressDuration = Date.now() - micPressStartTimeRef.current;
    if (pressDuration >= 260 && !isMicHoldingRef.current) {
      return;
    }
    onTriggerVoice();
  };

  // Smooth gradual height calculation (line-by-line: 1 line -> 2 lines -> 3 lines -> max 4 lines)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height temporarily to accurately measure scrollHeight
    textarea.style.height = '24px';
    const scrollH = textarea.scrollHeight;

    // Line height is approximately 20-22px
    // Single line: <= 28px
    // 2 lines: ~44-48px
    // 3 lines: ~64-70px
    // 4 lines: ~84-92px
    const singleLineH = 24;
    const maxLineH = 88; // max 3-4 lines, scrolls internally beyond this

    if (scrollH <= 30) {
      textarea.style.height = `${singleLineH}px`;
      textarea.style.overflowY = 'hidden';
      setLineCount(1);
    } else {
      const calculatedHeight = Math.min(scrollH, maxLineH);
      textarea.style.height = `${calculatedHeight}px`;
      textarea.style.overflowY = scrollH > maxLineH ? 'auto' : 'hidden';
      const lines = Math.min(Math.round(calculatedHeight / 22), 4);
      setLineCount(Math.max(lines, 2));
    }
  }, [inputText]);

  // Keyboard shortcut listener: Enter to submit, Shift+Enter for newline, Ctrl+Z / Cmd+Z for undo, Ctrl+Y / Cmd+Shift+Z for redo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Standard Undo / Redo shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Submit on Enter without shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim().length > 0 || Boolean(attachedFile)) {
        onSubmit();
      }
    }
  };

  const activePlaceholder = status === 'THINKING' ? 'thinking...' : 'Ask anything';

  const hasText = inputText.trim().length > 0 || Boolean(attachedFile);
  const isExpanded = lineCount > 1 || Boolean(attachedFile);

  return (
    <div className="w-full flex flex-col items-center select-none relative px-0.5">
      <div className="relative w-full max-w-lg flex flex-col items-center">
        <div className={`w-full relative transition-all duration-200 ${isExpanded ? 'rounded-[24px]' : 'rounded-full'}`}
          style={{ background: isFocused ? 'rgba(226,228,235,0.98)' : 'rgba(235,237,243,0.98)', border: '1px solid rgba(190,193,202,0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.10)' }}>
          <div className={`w-full transition-all duration-200 relative overflow-hidden backdrop-blur-xl ${isExpanded ? 'rounded-[23px] px-4 py-3' : 'rounded-full px-4 py-2.5'}`}
            style={{ background: 'rgba(248,249,252,0.98)' }}>
            {attachedFile && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs text-slate-700 shadow-sm">
                <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
                {onRemoveAttachment && <button type="button" onClick={onRemoveAttachment} className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-3 h-3" /></button>}
              </motion.div>
            )}
            <div className={`flex items-end gap-3 w-full ${isExpanded ? 'items-end' : 'items-center'}`}>
              <div className="flex-1 relative flex items-center min-w-0">
                <textarea ref={textareaRef} value={inputText} onChange={(e) => handleTextChange(e.target.value)} onKeyDown={handleKeyDown}
                  onFocus={() => handleFocusChange(true)} onBlur={() => handleFocusChange(false)} placeholder={activePlaceholder} rows={1}
                  className="w-full bg-transparent border-none outline-none resize-none text-[16px] sm:text-[17px] text-slate-900 placeholder-slate-500 font-sans leading-[24px] py-0.5 min-h-[24px] max-h-[88px] scrollbar-thin"
                  style={{ height: '24px', transition: 'height 0.12s ease-out' }} />
              </div>
              <div className="shrink-0 flex items-center gap-3 mb-0.5">
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} type="button" onClick={handleMicClick}
                  onPointerDown={handleMicPointerDown} onPointerUp={handleMicPointerUp} onPointerCancel={handleMicPointerCancel} onPointerLeave={handleMicPointerCancel}
                  className="p-0.5 rounded-full text-black transition-all cursor-pointer flex items-center justify-center select-none touch-none" title="Hold to talk / Tap for Hands-Free">
                  <Mic className="w-8 h-8 stroke-[2.4]" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} type="button" onClick={onOpenAttachment}
                  className="p-0.5 text-slate-700 hover:text-black rounded-full transition-colors shrink-0 cursor-pointer" title="Add attachment">
                  <Plus className="w-9 h-9 stroke-[1.7]" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} type="button" onClick={hasText ? onSubmit : onTriggerVoice}
          className="mt-2 w-14 h-14 rounded-full bg-white border border-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.10)] flex items-center justify-center text-black"
          title={hasText ? "Send message" : "Voice mode"} aria-label={hasText ? "Send message" : "Voice mode"}>
          {hasText ? <ArrowUp className="w-6 h-6 stroke-[2.2]" /> : (
            <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
              <path d="M14 19v10M20 14v20M26 20v8M32 16v16" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
              <path d="M35 8l1.8 4.2L41 14l-4.2-1.8L35 8z" fill="currentColor"/>
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  );
};
