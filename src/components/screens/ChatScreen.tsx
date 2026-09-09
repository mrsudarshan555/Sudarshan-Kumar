import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AssistantStatus } from '../../types';
import { 
  Sparkles, Copy, X, FileText, Image as ImageIcon,
  Check, Zap
} from 'lucide-react';
import { AttachmentBottomSheet, AttachmentItem } from '../common/AttachmentBottomSheet';
import { MorphingAuroraInputBox } from '../common/MorphingAuroraInputBox';
import { HomeAtmosphereBackground } from '../character/HomeAtmosphereBackground';
import { getDynamicSuggestions } from '../../utils/dynamicSuggestions';
import { EmptyStateIllustration } from '../common/EmptyStateIllustration';
import { ShimmerSkeleton } from '../common/ShimmerSkeleton';
import { PullToRefresh } from '../common/PullToRefresh';
import { InteractiveQuizWidget } from '../quiz/InteractiveQuizWidget';

interface ChatScreenProps {
  messages: ChatMessage[];
  status: AssistantStatus;
  inputText: string;
  setInputText: (val: string) => void;
  onSubmitPrompt: (customText?: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => void;
  onTriggerVoice: () => void;
  onStartPtt?: () => void;
  onStopPtt?: () => void;
  onClearChat: () => void;
  onOpenVisionScanner?: () => void;
  onOpenRoutines?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  status,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onStartPtt,
  onStopPtt,
  onOpenVisionScanner
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [attachedFile, setAttachedFile] = useState<AttachmentItem | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Keyboard open/close layout coordinator via visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualResize = () => {
      if (!window.visualViewport) return;
      if (isInputFocused) {
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 60);
      }
    };

    window.visualViewport.addEventListener('resize', handleVisualResize);
    window.visualViewport.addEventListener('scroll', handleVisualResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualResize);
    };
  }, [isInputFocused]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, status]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDoc = attachedFile?.mimeType?.includes('pdf') || 
                  attachedFile?.mimeType?.includes('text') || 
                  attachedFile?.mimeType?.includes('csv') || 
                  attachedFile?.mimeType?.includes('json') ||
                  attachedFile?.name.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const defaultPrompt = isDoc
      ? `Please read and analyze this attached document (${attachedFile?.name}). Summarize key points and explain its contents.`
      : 'Please analyze what is in this image in detail.';

    const promptToSend = attachedFile && !inputText.trim()
      ? defaultPrompt
      : inputText;
    
    const filePayload = attachedFile?.dataUrl 
      ? { 
          base64: attachedFile.dataUrl, 
          mimeType: attachedFile.mimeType || (isDoc ? 'application/pdf' : 'image/jpeg'),
          name: attachedFile.name,
          size: attachedFile.size
        }
      : undefined;

    onSubmitPrompt(promptToSend, filePayload);
    setAttachedFile(null);
  };

  const [rotationSeed, setRotationSeed] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationSeed(prev => (prev + 1) % 10);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const samplePrompts = useMemo(() => {
    return getDynamicSuggestions(messages, 'en', rotationSeed);
  }, [messages, rotationSeed]);

  return (
    <div 
      className="w-full h-full flex flex-col overflow-hidden bg-transparent text-slate-100 relative min-h-0"
    >
      {/* 1. Atmospheric Ambient Background Depth & Drifting Particles (Matching 3D Avatar/Home) */}
      <HomeAtmosphereBackground status={status} />

      {/* Pull To Refresh Wrapped Messages Stream */}
      <PullToRefresh
        ref={messagesContainerRef}
        onRefresh={async () => {
          await new Promise(res => setTimeout(res, 600));
        }}
        className="flex-1 overflow-y-auto p-3.5 flex flex-col min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center my-auto min-h-[300px]">
            <EmptyStateIllustration
              type="chat"
              suggestions={samplePrompts.slice(0, 3)}
              onSelectSuggestion={(sug) => {
                setInputText(sug);
              }}
            />
          </div>
        ) : (
          <div className="space-y-3 w-full flex flex-col">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';

                return (
                  <motion.div
                    id={`msg-${msg.id}`}
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl p-3 text-xs leading-relaxed font-sans transition-all ${
                        isUser
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 backdrop-blur-xl border border-white/20 text-white rounded-br-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)]'
                          : 'bg-white/[0.07] backdrop-blur-2xl border border-white/15 text-slate-100 rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[9px] font-mono text-cyan-300 font-bold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                            <span>MAYRA</span>
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Delegated Sub-Agent / STONICX Badge */}
                      {!isUser && msg.delegatedAgentBadge && (
                        <div className={`mb-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono w-fit border transition-all ${
                          msg.isDelegationPending 
                            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        }`}>
                          {msg.isDelegationPending ? (
                            <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>{msg.delegatedAgentBadge.name} • {msg.isDelegationPending ? 'Executing in background...' : msg.delegatedAgentBadge.role}</span>
                        </div>
                      )}

                      {/* Render attached image or document in user bubble if present */}
                      {msg.image && (msg.image.url || msg.image.base64) && (
                        <div className="mb-2">
                          {msg.image.mimeType?.startsWith('image/') || (!msg.image.mimeType && !msg.image.name?.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i)) ? (
                            <div className="overflow-hidden rounded-lg border border-white/20 max-w-[220px]">
                              <img 
                                src={msg.image.url || msg.image.base64} 
                                alt="Attached vision snapshot" 
                                className="w-full h-auto object-cover max-h-48"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/20 text-left max-w-[240px]">
                              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-white truncate">{msg.image.name || 'Document'}</p>
                                <p className="text-[9px] text-slate-300 uppercase">{msg.image.mimeType?.split('/')[1] || 'PDF'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </div>

                      {/* Quiz Details Quick-Tap Chips */}
                      {msg.quizConfigPrompt?.optionsChips && msg.quizConfigPrompt.optionsChips.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                          {msg.quizConfigPrompt.optionsChips.map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              type="button"
                              onClick={() => onSubmitPrompt(chip.actionValue)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 hover:bg-white/20 border border-white/15 text-cyan-200 hover:text-white backdrop-blur-md transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{chip.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Objective (MCQ) Quiz Widget if attached to message */}
                    {msg.quizData && (
                      <div className="w-full max-w-[98%] mt-2 self-stretch">
                        <InteractiveQuizWidget 
                          quiz={msg.quizData}
                          onSelectTopic={(topic) => onSubmitPrompt(`${topic} ka quiz banao`)}
                          onExplainResults={(score) => {
                            onSubmitPrompt(`Maine quiz me ${score.correct}/${score.total} score kiya. Meri galtiyan samjhao aur important concepts revise karao.`);
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Shimmering Reasoning Card for Thinking State */}
            {status === 'THINKING' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-[75%] rounded-2xl rounded-bl-sm p-3 bg-slate-900/90 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_4px_24px_rgba(6,182,212,0.25)] space-y-2"
              >
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>MAYRA Neural Reasoning...</span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <ShimmerSkeleton width="100%" height="8px" className="rounded-full bg-cyan-950/40" />
                  <ShimmerSkeleton width="75%" height="8px" className="rounded-full bg-cyan-950/40" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </PullToRefresh>

      {/* Dynamic Suggested Quick Chips: Appears above input box on focus or when input text is entered */}
      <AnimatePresence>
        {(isInputFocused || inputText.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="px-3.5 py-1 flex gap-2 overflow-x-auto scrollbar-none shrink-0 z-10"
          >
            {samplePrompts.slice(0, 5).map((p, pIdx) => (
              <motion.button
                key={`chat-prompt-${p}-${pIdx}`}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setInputText(p);
                }}
                className="px-3 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-400/30 hover:border-cyan-400/60 rounded-full text-[11px] text-purple-200 hover:text-white whitespace-nowrap backdrop-blur-xl transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)] cursor-pointer shrink-0"
              >
                {p}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attached File Preview Chip */}
      <AnimatePresence>
        {attachedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="px-3.5 py-1.5 shrink-0 z-10"
          >
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <div className="flex items-center gap-2 truncate">
                {attachedFile.mimeType?.includes('image') ? (
                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-cyan-400/60 shrink-0">({attachedFile.size})</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Bar - Morphing Aurora Capsule (Fully Blended with Space Ambient Glow) */}
      <div className="w-full px-3 pb-1 pt-0.5 bg-transparent shrink-0 flex justify-center z-10">
        <div className="w-full max-w-lg">
          <MorphingAuroraInputBox
            inputText={inputText}
            setInputText={setInputText}
            isFocused={isInputFocused}
            onFocusChange={setIsInputFocused}
            onSubmit={() => {
              if (inputText.trim() || attachedFile) {
                onSubmitPrompt(
                  inputText,
                  attachedFile
                    ? {
                        base64: attachedFile.dataUrl || '',
                        mimeType: attachedFile.mimeType,
                        name: attachedFile.name,
                        size: attachedFile.size
                      }
                    : undefined
                );
                setAttachedFile(null);
                setInputText('');
              }
            }}
            onTriggerVoice={onTriggerVoice}
            onStartPtt={onStartPtt}
            onStopPtt={onStopPtt}
            onOpenAttachment={() => setIsAttachmentSheetOpen(true)}
            status={status}
            attachedFile={attachedFile}
            onRemoveAttachment={() => setAttachedFile(null)}
            placeholder="Ask Mayra anything..."
            showHeading={false}
          />
        </div>
      </div>

      {/* Modern Glassmorphic Attachment Bottom Sheet */}
      <AttachmentBottomSheet
        isOpen={isAttachmentSheetOpen}
        onClose={() => setIsAttachmentSheetOpen(false)}
        onSelectAttachment={(item) => {
          setAttachedFile(item);
        }}
        onOpenVisionScanner={onOpenVisionScanner}
      />

    </div>
  );
};
