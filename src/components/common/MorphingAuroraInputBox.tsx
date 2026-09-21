import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, ArrowUp, X, Paperclip, RotateCcw, RotateCw } from 'lucide-react';
import { AssistantStatus } from '../../types';
import { AudioWaveformIcon } from './AudioWaveformIcon';

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
  const [suggestionIdx, setSuggestionIdx] = useState<number>(0);
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

  // Rotate smart suggestions only while the user has focused into the input box
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      setSuggestionIdx((prev) => (prev + 1) % SUGGESTIONS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isFocused]);

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

  // Dynamic placeholder
  const activePlaceholder = (() => {
    if (status === 'THINKING') return 'thinking...';
    if (isFocused) return SUGGESTIONS[suggestionIdx];
    return placeholder || "What's your mind today";
  })();

  const hasText = inputText.trim().length > 0 || Boolean(attachedFile);
  const isExpanded = lineCount > 1 || Boolean(attachedFile);

  return (
    <div className="w-full flex flex-col items-center select-none relative px-0.5">
      
      {/* 1. TOP HEADING ("What's on your mind today?") - Hides when user taps/focuses into chat box */}
      <AnimatePresence>
        {showHeading && !isFocused && !hasText && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 text-center overflow-hidden"
          >
            <h2 className="text-[14px] sm:text-[15px] font-sans font-medium text-white/90 tracking-wide drop-shadow-[0_2px_14px_rgba(217,70,239,0.5)]">
              {headingText}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. OUTER CONTAINER WITH FLOATING AURORA GLOWS */}
      <div className="relative w-full max-w-lg flex flex-col items-center">
        
        {/* Floating Aurora Plumes */}
        <div 
          className="absolute -top-6 -right-6 w-40 h-32 rounded-full pointer-events-none blur-2xl opacity-75 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.65) 0%, rgba(217,70,239,0.4) 50%, transparent 80%)',
            animationDuration: '3.5s'
          }}
        />
        <div 
          className="absolute -bottom-8 -left-8 w-44 h-36 rounded-full pointer-events-none blur-2xl opacity-70"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.65) 0%, rgba(139,92,246,0.45) 50%, transparent 80%)',
            animationDuration: '4.5s'
          }}
        />

        {/* 3. DUAL-TONE GRADIENT BORDER WITH SMOOTH BORDER RADIUS TRANSITION */}
        <div
          className={`w-full relative p-[1.5px] shadow-[0_12px_45px_rgba(0,0,0,0.8),0_0_35px_rgba(217,70,239,0.3)] transition-all duration-200 ${
            isExpanded ? 'rounded-[24px]' : 'rounded-full'
          }`}
          style={{
            background: isFocused
              ? 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(147,51,234,0.7) 45%, rgba(217,70,239,0.95) 75%, rgba(244,114,182,1) 100%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(147,51,234,0.45) 45%, rgba(217,70,239,0.7) 75%, rgba(236,72,153,0.8) 100%)'
          }}
        >
          {/* Inner Frosted Glass Card - Never unmounts, preserves input state & keyboard */}
          <div
            className={`w-full transition-all duration-200 relative overflow-hidden backdrop-blur-2xl ${
              isExpanded ? 'rounded-[23px] px-3.5 py-3' : 'rounded-full px-3.5 py-2'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(13, 8, 30, 0.9) 0%, rgba(20, 9, 42, 0.88) 45%, rgba(38, 10, 60, 0.85) 75%, rgba(48, 12, 68, 0.88) 100%)'
            }}
          >
            {/* Subtle Inner Glass Specular Sheen */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            {/* Attached File Preview Badge */}
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 border border-purple-400/40 rounded-full text-xs text-purple-200 shadow-sm"
              >
                <Paperclip className="w-3.5 h-3.5 text-purple-300" />
                <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={onRemoveAttachment}
                    className="p-0.5 hover:bg-white/20 rounded-full text-purple-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            )}

            {/* Unified Input Row: Persistent Textarea with Smooth Gradual Line Growth */}
            <div className={`flex items-end gap-2 w-full ${isExpanded ? 'items-end' : 'items-center'}`}>
              
              {/* Left Action: Plus / Attachment Button */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={onOpenAttachment}
                className="p-1 text-purple-200/80 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 mb-0.5 cursor-pointer"
                title="Add attachment / photo / doc"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </motion.button>

              {/* Center: Persistent Single Textarea (Never unmounts -> Keyboard never flickers) */}
              <div className="flex-1 relative flex items-center min-w-0">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => handleFocusChange(true)}
                  onBlur={() => handleFocusChange(false)}
                  placeholder={activePlaceholder}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none resize-none text-[13px] sm:text-sm text-white placeholder-purple-200/40 font-sans leading-[22px] py-0.5 min-h-[24px] max-h-[88px] scrollbar-thin scrollbar-thumb-purple-500/30"
                  style={{
                    height: '24px',
                    transition: 'height 0.12s ease-out'
                  }}
                />
              </div>

              {/* Right Action: Send Button or Voice / PTT Orb */}
              <div className="shrink-0 flex items-center gap-1 mb-0.5">
                <AnimatePresence mode="wait">
                  {hasText ? (
                    <motion.button
                      key="send-btn"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={onSubmit}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white flex items-center justify-center shadow-[0_0_18px_rgba(217,70,239,0.7)] border border-white/50 cursor-pointer"
                      title="Send message (Enter)"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="mic-btn"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={handleMicClick}
                      onPointerDown={handleMicPointerDown}
                      onPointerUp={handleMicPointerUp}
                      onPointerCancel={handleMicPointerCancel}
                      onPointerLeave={handleMicPointerCancel}
                      className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center select-none touch-none ${
                        status === 'LISTENING'
                          ? 'bg-fuchsia-500/20 text-white shadow-[0_0_15px_rgba(217,70,239,0.8)] border border-fuchsia-400/50 animate-pulse'
                          : 'text-purple-200 hover:text-white hover:bg-white/10'
                      }`}
                      title="Hold to talk (PTT) / Tap for Hands-Free"
                    >
                      <AudioWaveformIcon status={status || 'READY'} barCount={4} className="w-4 h-4 text-purple-200" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
