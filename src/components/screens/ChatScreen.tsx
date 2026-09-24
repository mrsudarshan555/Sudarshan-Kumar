import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AssistantStatus } from '../../types';
import { MayraLogo } from '../common/MayraLogo';
import { 
  Sparkles, Copy, X, FileText, Image as ImageIcon,
  Check, Zap, ThumbsUp, ThumbsDown, Share2, MoreHorizontal
} from 'lucide-react';
import { AttachmentBottomSheet, AttachmentItem } from '../common/AttachmentBottomSheet';
import { MorphingAuroraInputBox } from '../common/MorphingAuroraInputBox';
import { PullToRefresh } from '../common/PullToRefresh';
import { ShimmerSkeleton } from '../common/ShimmerSkeleton';
import { InteractiveQuizWidget } from '../quiz/InteractiveQuizWidget';
import { GoogleDriveChatCard } from '../drive/GoogleDriveChatCard';

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
  appearanceConfig?: { darkMode: boolean };
  userName?: string;
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
  onOpenVisionScanner,
  appearanceConfig = { darkMode: true },
  userName = 'there'
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [attachedFile, setAttachedFile] = useState<AttachmentItem | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Keyboard layout coordinator via visualViewport: elevates ONLY input + suggestions
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualResize = () => {
      if (!window.visualViewport) return;
      const windowH = window.innerHeight;
      const viewportH = window.visualViewport.height;
      const diff = Math.max(0, windowH - viewportH);
      
      setKeyboardOffset(prev => (Math.abs(prev - diff) > 1 ? diff : prev));
      if (diff > 50 || isInputFocused) {
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 50);
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

  return (
    <div 
      className={`w-full h-full flex flex-col overflow-hidden bg-transparent relative min-h-0 ${appearanceConfig.darkMode ? "text-slate-100" : "text-slate-900"}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_100%,rgba(28,74,180,0.34)_0%,rgba(8,17,45,0.20)_38%,transparent_72%)]" />
      <PullToRefresh
        ref={messagesContainerRef}
        onRefresh={async () => { await new Promise(res => setTimeout(res, 600)); }}
        className="relative z-[1] flex-1 overflow-y-auto px-4 pt-5 pb-3 flex flex-col min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto min-h-[300px] px-6 text-center">
            <MayraLogo size={58} showGlow={false} variant="raw" />
            <div className={`mt-5 text-[27px] font-light tracking-tight ${appearanceConfig.darkMode ? 'text-white' : 'text-slate-900'}`}>
              What&apos;s next, {userName}?
            </div>
          </div>
        ) : (
          <div className="space-y-10 w-full flex flex-col pt-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div key={msg.id} id={`msg-${msg.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {isUser ? (
                      <div className="max-w-[76%] px-5 py-3 rounded-[28px] bg-[#202124] text-white text-[15px] leading-relaxed shadow-sm">
                        {msg.image && (msg.image.url || msg.image.base64) && <img src={msg.image.url || msg.image.base64} alt="Attachment" className="w-full rounded-2xl mb-2 max-h-52 object-cover" />}
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="w-full max-w-[94%]">
                        <div className={`whitespace-pre-wrap text-[16px] leading-[1.62] ${appearanceConfig.darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{msg.text}</div>
                        {msg.quizData && (
                          <div className="w-full mt-4">
                            <InteractiveQuizWidget
                              quiz={msg.quizData}
                              onSelectTopic={(topic) => onSubmitPrompt(topic + ' ka quiz banao')}
                              onExplainResults={(score) => onSubmitPrompt('Maine quiz me ' + score.correct + '/' + score.total + ' score kiya. Meri galtiyan samjhao aur important concepts revise karao.')}
                            />
                          </div>
                        )}
                        {msg.driveBackupPrompt && (
                          <div className="w-full mt-4">
                            <GoogleDriveChatCard folderName={msg.driveBackupPrompt.folderName || 'Mayra'} />
                          </div>
                        )}
                        <div className={`flex items-center gap-5 mt-3 ${appearanceConfig.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          <button type="button" aria-label="Like"><ThumbsUp className="w-[19px] h-[19px]" strokeWidth={1.8} /></button>
                          <button type="button" aria-label="Dislike"><ThumbsDown className="w-[19px] h-[19px]" strokeWidth={1.8} /></button>
                          <button type="button" onClick={() => copyToClipboard(msg.text, msg.id)} aria-label="Copy">{copiedMessageId === msg.id ? <Check className="w-[19px] h-[19px]" /> : <Copy className="w-[19px] h-[19px]" strokeWidth={1.8} />}</button>
                          <button type="button" aria-label="Share"><Share2 className="w-[19px] h-[19px]" strokeWidth={1.8} /></button>
                          <button type="button" aria-label="More"><MoreHorizontal className="w-[20px] h-[20px]" /></button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {status === 'THINKING' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[94%] text-slate-300 text-sm"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-pulse" /> MAYRA is thinking…</div></motion.div>}
          </div>
        )}
      </PullToRefresh>

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

      {/* Chat Input Bar - Morphing Aurora Capsule (Only input & suggestions elevate above keyboard) */}
      <div 
        className="w-full px-3 pb-2 pt-0.5 bg-transparent shrink-0 flex flex-col items-center z-10 transition-transform duration-150 ease-out"
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : 'none'
        }}
      >
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
