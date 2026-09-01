import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Mic, ArrowUp, X, Paperclip } from 'lucide-react';
import { AssistantStatus } from '../../types';

interface MorphingAuroraInputBoxProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSubmit: () => void;
  onTriggerVoice: () => void;
  onOpenAttachment?: () => void;
  status?: AssistantStatus;
  attachedFile?: { name: string; size?: string; mimeType?: string } | null;
  onRemoveAttachment?: () => void;
  placeholder?: string;
  showHeading?: boolean;
  headingText?: string;
}

export const MorphingAuroraInputBox: React.FC<MorphingAuroraInputBoxProps> = ({
  inputText,
  setInputText,
  onSubmit,
  onTriggerVoice,
  onOpenAttachment,
  status = 'IDLE',
  attachedFile = null,
  onRemoveAttachment,
  placeholder = 'Ask anything',
  showHeading = true,
  headingText = "What's on your mind today?"
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const hasText = inputText.trim().length > 0 || Boolean(attachedFile);
  // Expand when text is long or has newlines or attachment
  const isMultiLine = inputText.length > 32 || inputText.includes('\n') || (attachedFile !== null);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = isMultiLine
      ? Math.min(Math.max(textarea.scrollHeight, 50), 130)
      : 24;
    textarea.style.height = `${newHeight}px`;
  }, [inputText, isMultiLine]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasText) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none relative px-2">
      
      {/* 1. TOP HEADING FROM VIDEO ("What's on your mind today?") */}
      {showHeading && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2.5 text-center"
        >
          <h2 className="text-[15px] sm:text-base font-sans font-medium text-white/90 tracking-wide drop-shadow-[0_2px_14px_rgba(217,70,239,0.5)]">
            {headingText}
          </h2>
        </motion.div>
      )}

      {/* 2. OUTER CONTAINER WITH 4 FLOATING DUAL-COLOR AURORAS (Half Blue-Violet, Half Hot-Magenta) */}
      <div className="relative w-full max-w-md flex flex-col items-center">
        
        {/* Floating Aurora Plume 1: Top-Right Hot Magenta Bloom */}
        <div 
          className="absolute -top-6 -right-6 w-40 h-32 rounded-full pointer-events-none blur-2xl opacity-75 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.65) 0%, rgba(217,70,239,0.4) 50%, transparent 80%)',
            animationDuration: '3.5s'
          }}
        />

        {/* Floating Aurora Plume 2: Bottom-Left Electric Violet-Blue Bloom */}
        <div 
          className="absolute -bottom-8 -left-8 w-44 h-36 rounded-full pointer-events-none blur-2xl opacity-70"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.65) 0%, rgba(139,92,246,0.45) 50%, transparent 80%)',
            animationDuration: '4.5s'
          }}
        />

        {/* Floating Aurora Plume 3: Center-Bottom Flowing Violet Drift */}
        <div 
          className="absolute -bottom-4 left-1/4 w-48 h-20 rounded-full pointer-events-none blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse, rgba(168,85,247,0.6) 0%, rgba(217,70,239,0.3) 60%, transparent 85%)'
          }}
        />

        {/* 3. DUAL-TONE BORDER GRADIENT WRAPPER (Fixed Rounded Squircle: 22px-24px) */}
        <motion.div
          layout
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
            mass: 0.7
          }}
          className="w-full relative rounded-[22px] p-[1.5px] shadow-[0_12px_45px_rgba(0,0,0,0.8),0_0_35px_rgba(217,70,239,0.3)] transition-all duration-300"
          style={{
            background: isFocused
              ? 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(147,51,234,0.7) 45%, rgba(217,70,239,0.95) 75%, rgba(244,114,182,1) 100%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(147,51,234,0.45) 45%, rgba(217,70,239,0.7) 75%, rgba(236,72,153,0.8) 100%)'
          }}
        >
          {/* Inner Frosted Glass Card with Half-and-Half Ambient Color Flow */}
          <div
            className={`w-full rounded-[21px] transition-all duration-200 relative overflow-hidden backdrop-blur-2xl ${
              isMultiLine ? 'p-3.5' : 'px-3.5 py-2.5'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(13, 8, 30, 0.88) 0%, rgba(20, 9, 42, 0.85) 45%, rgba(38, 10, 60, 0.82) 75%, rgba(48, 12, 68, 0.85) 100%)'
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

            {/* 4. MULTILINE EXPANDED CARD LAYOUT */}
            {isMultiLine ? (
              <div className="flex flex-col gap-2">
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full bg-transparent border-none outline-none resize-none text-[13px] sm:text-sm text-white placeholder-purple-200/40 font-sans leading-relaxed min-h-[50px] max-h-[130px] scrollbar-thin scrollbar-thumb-fuchsia-500/20"
                />

                {/* Bottom Bar: Plus on Left, (↑) Send Button on Right */}
                <div className="flex items-center justify-between pt-1">
                  {/* Plus Icon at bottom-left corner */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.88 }}
                    type="button"
                    onClick={onOpenAttachment}
                    className="p-1 text-purple-200/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Add attachment / photo / doc"
                  >
                    <Plus className="w-4 h-4 stroke-[2]" />
                  </motion.button>

                  {/* Circular Up-Arrow Button at bottom-right corner */}
                  <div className="flex items-center gap-1.5">
                    <AnimatePresence mode="wait">
                      {hasText ? (
                        <motion.button
                          key="multiline-send"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={onSubmit}
                          className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white flex items-center justify-center shadow-[0_0_18px_rgba(217,70,239,0.7)] border border-white/50 cursor-pointer"
                          title="Send message"
                        >
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="multiline-mic"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={onTriggerVoice}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            status === 'LISTENING'
                              ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.9)] animate-pulse'
                              : 'text-purple-200/80 hover:text-white hover:bg-white/10'
                          }`}
                          title="Voice input"
                        >
                          <Mic className="w-4 h-4 stroke-[2]" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              /* 5. SINGLE-LINE SQUIRCLE BAR LAYOUT */
              <div className="flex items-center gap-2">
                {/* Left Plus Icon */}
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.88 }}
                  type="button"
                  onClick={onOpenAttachment}
                  className="p-1 text-purple-200/80 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
                  title="Add attachment"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                </motion.button>

                {/* Center Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hasText) {
                      e.preventDefault();
                      onSubmit();
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent border-none outline-none text-[13px] sm:text-sm text-white placeholder-purple-200/40 font-sans min-w-0"
                />

                {/* Right: Mic or (↑) Send Button */}
                <div className="shrink-0 flex items-center">
                  <AnimatePresence mode="wait">
                    {hasText ? (
                      <motion.button
                        key="single-send"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={onSubmit}
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.7)] border border-white/50 cursor-pointer"
                        title="Send message"
                      >
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </motion.button>
                    ) : (
                      <motion.button
                        key="single-mic"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={onTriggerVoice}
                        className={`p-1.5 rounded-full transition-all cursor-pointer ${
                          status === 'LISTENING'
                            ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.9)] animate-pulse'
                            : 'text-purple-200/80 hover:text-white hover:bg-white/10'
                        }`}
                        title="Voice input"
                      >
                        <Mic className="w-4 h-4 stroke-[2]" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
