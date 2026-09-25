import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Paperclip, X } from 'lucide-react';
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
  placeholder = 'Ask anything',
  showHeading = false,
  headingText = '',
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
      const lengthDiff = Math.abs(newVal.length - current.lastSavedText.length);
      const isWordBoundary = newVal.endsWith(' ') || newVal.endsWith('\n') || newVal.endsWith('.');
      
      if (lengthDiff > 5 || isWordBoundary || current.past.length === 0) {
        current.past.push(inputText);
        if (current.past.length > 50) current.past.shift();
        current.future = [];
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

  // Smooth gradual height calculation
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '24px';
    const scrollH = textarea.scrollHeight;
    const singleLineH = 24;
    const maxLineH = 88;

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

  // Keyboard shortcut listener: Enter to submit, Shift+Enter for newline, Ctrl+Z / Cmd+Z for undo, Ctrl+Y for redo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim().length > 0 || Boolean(attachedFile)) {
        onSubmit();
      }
    }
  };

  const activePlaceholder = status === 'THINKING' ? 'thinking...' : (placeholder || 'Ask anything');
  const hasText = inputText.trim().length > 0 || Boolean(attachedFile);
  const isExpanded = lineCount > 1 || Boolean(attachedFile);

  return (
    <div className="w-full flex items-center justify-center select-none relative px-0">
      <div className="w-full max-w-[480px] flex items-center gap-[10px]">
        {/* Input Pill */}
        <div
          className={`flex-1 flex flex-col bg-[#eceaf2] dark:bg-[#1a1b20] min-w-0 transition-all duration-200 border border-black/[0.04] dark:border-white/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${
            isExpanded ? 'rounded-[28px] px-5 py-3' : 'rounded-[999px] px-5 py-[13px]'
          }`}
        >
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-full text-xs text-slate-800 dark:text-slate-200 shadow-sm w-fit"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
              {onRemoveAttachment && (
                <button
                  type="button"
                  onClick={onRemoveAttachment}
                  className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          )}

          <div className={`flex w-full ${isExpanded ? 'items-end' : 'items-center'} gap-[14px]`}>
            {/* Textarea Field */}
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
                className="w-full bg-transparent border-none outline-none resize-none text-[17px] text-[#1a1a1a] dark:text-white placeholder-[#444444] dark:placeholder-slate-400 font-sans leading-[24px] py-0 min-h-[24px] max-h-[88px] scrollbar-thin"
                style={{ height: '24px', transition: 'height 0.12s ease-out' }}
              />
            </div>

            {/* Right icons inside pill: Mic and Plus */}
            <div className="shrink-0 flex items-center gap-[14px]">
              {/* Mic Icon Button */}
              <button
                type="button"
                onClick={handleMicClick}
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerCancel={handleMicPointerCancel}
                onPointerLeave={handleMicPointerCancel}
                className="p-0 bg-transparent border-none flex items-center justify-center cursor-pointer shrink-0 text-[#1a1a1a] dark:text-white hover:opacity-80 active:scale-95 transition-all select-none touch-none"
                aria-label="Voice input"
                title="Voice input"
              >
                <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 15.5C12.2091 15.5 14 13.7091 14 11.5V5.5C14 3.29086 12.2091 1.5 10 1.5C7.79086 1.5 6 3.29086 6 5.5V11.5C6 13.7091 7.79086 15.5 10 15.5Z" fill="currentColor"/>
                  <path d="M17 11.5C17 15.0899 14.0899 18 10.5 18H9.5C5.91015 18 3 15.0899 3 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="10" y1="18" x2="10" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="6.5" y1="22" x2="13.5" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Plus Icon Button */}
              <button
                type="button"
                onClick={onOpenAttachment}
                className="p-0 bg-transparent border-none flex items-center justify-center cursor-pointer shrink-0 text-[#6b6b6b] dark:text-[#a1a1aa] hover:opacity-80 active:scale-95 transition-all"
                aria-label="Add"
                title="Add attachment"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* External Round Sparkle Button */}
        <button
          type="button"
          onClick={hasText ? onSubmit : onTriggerVoice}
          className="w-[52px] h-[52px] rounded-full bg-[#eceaf2] dark:bg-[#1a1b20] border-none flex items-center justify-center cursor-pointer shrink-0 text-[#1a1a1a] dark:text-white hover:opacity-90 active:scale-95 transition-all shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          aria-label="AI assist"
          title={hasText ? 'Send message' : 'AI assist'}
        >
          <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="12" width="4" height="10" rx="2" fill="currentColor"/>
            <rect x="10.5" y="5" width="4" height="20" rx="2" fill="currentColor"/>
            <rect x="18" y="13" width="4" height="8" rx="2" fill="currentColor"/>
            <path d="M25 1C25.15 3 25.5 4.2 26.1 4.9C26.7 5.6 27.7 5.9 29.5 6.05C27.7 6.2 26.7 6.5 26.1 7.2C25.5 7.9 25.15 9.1 25 11.1C24.85 9.1 24.5 7.9 23.9 7.2C23.3 6.5 22.3 6.2 20.5 6.05C22.3 5.9 23.3 5.6 23.9 4.9C24.5 4.2 24.85 3 25 1Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};
