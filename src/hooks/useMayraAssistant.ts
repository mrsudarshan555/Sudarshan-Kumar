import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantStatus, ChatMessage, UserPersonalConfig, AssistantConfig, AppAction, MemoryItem, AgentTaskContext } from '../types';
import { apiUrl, getWebSocketUrl } from '../config/api';
import { getMayraSmartFallback } from '../services/ai/mayraConversationalFallback';
import { 
  getSavedLanguage, 
  saveLanguagePreference, 
  detectLanguage, 
  getDynamicGreeting, 
  speakText, 
  prewarmAudioEngine,
  playCustomActivationSound,
  stopCurrentSpeech,
  startPcm16kCapture,
  stopPcm16kCapture,
  schedulePcm24kChunk,
  flushQueuedAudio,
  getAudioContext,
  playAudioPayload,
  MayraLanguage 
} from '../utils/speechEngine';
import { MayraSystemBridge } from '../services/native/MayraSystemIntegrationBridge';
import { MemoryVaultService } from '../services/memory/memoryVaultService';
import { MemorySyncBridge } from '../services/memory/memorySyncBridge';
import { MayraNativeBridgeClient } from '../services/bridge/MayraNativeBridgeClient';
import { MemoryQueryEngine } from '../services/memory/memoryQueryEngine';
import { ContinuousConversationEngine } from '../services/voice/continuousConversationEngine';
import { MayraAgentEngine } from '../services/agent/agentEngine';
import { GestureVoiceBridge } from '../services/gestures/gestureVoiceBridge';
import { DelegationRouter } from '../services/router/delegationRouter';
import { QuizDataService, QuizConfig } from '../services/quiz/quizDataService';
import { UndoService } from '../services/markLII/undoService';
import { ConfirmationGateService } from '../services/markLII/confirmationGateService';
import { InstantAcknowledgmentEngine } from '../services/markLII/instantAcknowledgmentEngine';
import { MarkLIIToolsService } from '../services/markLII/markLIITools';
import { MultiAgentSwarmCoordinator } from '../services/agent/multiAgentSwarm';
import { ProactiveSmartGuardianEngine, ProactiveAlert } from '../services/automation/ProactiveSmartGuardianEngine';
import { ScreenObserverEngine } from '../services/screen/ScreenObserverEngine';
import { MayraEmpathyEngine } from '../services/character/mayraEmpathyEngine';
import { UnifiedSettingsManager } from '../services/settings/UnifiedSettingsManager';
import { AppearanceConfig } from '../types';
import { hybridAiRouter, ActiveAiMode } from '../services/offline/hybridAiRouter';
import { offlineMayraProvider } from '../services/offline/offlineMayraProvider';
import { OpenAILiveVoice } from '../services/voice/openaiRealtimeVoice';

export interface UseMayraAssistantProps {
  personalConfig: UserPersonalConfig;
  assistantConfig: AssistantConfig;
  appearanceConfig?: AppearanceConfig;
  memories?: MemoryItem[];
  onExecuteAction?: (action: AppAction) => void;
  onModeSwitch?: (mode: 'mayra' | 'stonicx') => void;
}

export function useMayraAssistant({ personalConfig, assistantConfig, appearanceConfig, memories = [], onExecuteAction, onModeSwitch }: UseMayraAssistantProps) {
  const [status, setStatus] = useState<AssistantStatus>('READY');
  const [isListeningMode, setIsListeningMode] = useState<boolean>(false);
  const [isPttActive, setIsPttActive] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<MayraLanguage>(() => getSavedLanguage());
  const [activeAgentTask, setActiveAgentTask] = useState<AgentTaskContext | null>(null);
  const [activeProactiveAlert, setActiveProactiveAlert] = useState<ProactiveAlert | null>(null);
  const [aiMode, setAiMode] = useState<ActiveAiMode>(() => hybridAiRouter.getRecommendedMode());
  const [isNetworkAvailable, setIsNetworkAvailable] = useState<boolean>(() => hybridAiRouter.getNetworkStatus());
  const [isOfflineModelReady, setIsOfflineModelReady] = useState<boolean>(() => hybridAiRouter.getOfflineReadiness().isReady);
  
  const isListeningModeRef = useRef<boolean>(false);
  isListeningModeRef.current = isListeningMode;
  const isPttActiveRef = useRef<boolean>(false);

  // Keep the UI/runtime aware of the real hybrid routing state.
  useEffect(() => {
    const unsubscribe = hybridAiRouter.subscribe((state) => {
      setAiMode(state.currentMode);
      setIsNetworkAvailable(state.isNetworkAvailable);
      setIsOfflineModelReady(state.isModelReady);
    });
    return unsubscribe;
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const openAiVoiceRef = useRef<OpenAILiveVoice | null>(null);
  const activeModelMsgIdRef = useRef<string | null>(null);
  const activeUserMsgIdRef = useRef<string | null>(null);

  const continuousEngineRef = useRef<ContinuousConversationEngine | null>(null);
  const agentEngineRef = useRef<MayraAgentEngine | null>(null);
  const pendingQuizConfigRef = useRef<Partial<QuizConfig> | null>(null);

  const userName = personalConfig.preferredName || personalConfig.fullName || (typeof window !== 'undefined' ? localStorage.getItem('mayra_user_name') : null) || 'Friend';
  const initialGreeting = useRef(getDynamicGreeting(userName, getSavedLanguage())).current;

  // Initialize MayraAgentEngine
  if (!agentEngineRef.current) {
    agentEngineRef.current = new MayraAgentEngine({
      onTaskStatusChange: (taskStatus, context) => {
        setActiveAgentTask({ ...context });
        if (taskStatus === 'PLANNING' || taskStatus === 'EXECUTING') {
          setStatus('THINKING');
        } else if (taskStatus === 'WAITING_CONFIRMATION') {
          setStatus('READY');
        }
      },
      onStepProgress: (_step, _desc, context) => {
        setActiveAgentTask({ ...context });
      },
      onConfirmationRequired: (_conf, context) => {
        setActiveAgentTask({ ...context });
        setStatus('READY');
      },
      onTaskComplete: (finalResponse, context) => {
        setActiveAgentTask({ ...context });
        const assistantMsg: ChatMessage = {
          id: `msg-m-agent-${Date.now()}`,
          sender: 'mayra',
          text: finalResponse,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(finalResponse, lastSpokenLanguageRef.current, handleSpeechStart, handleSpeechEnd);
        setTimeout(() => {
          setActiveAgentTask((curr) => (curr?.taskId === context.taskId ? null : curr));
        }, 3500);
      },
      onTaskError: (error, context) => {
        setActiveAgentTask({ ...context });
        const assistantMsg: ChatMessage = {
          id: `msg-m-err-${Date.now()}`,
          sender: 'mayra',
          text: `Task execution encountered fault: ${error}. Engaging STONICX fallback recovery...`,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        DelegationRouter.triggerAutonomousFallback({
          error,
          failingComponent: 'MAYRA_AGENT_ENGINE',
          userPrompt: context.originalUserRequest,
          chatHistory: messages,
          language: lastSpokenLanguageRef.current === 'hi' ? 'hi' : 'en',
          onModeSwitch
        });
      }
    });
  }

  const approveAgentAction = useCallback(async () => {
    if (agentEngineRef.current) {
      await agentEngineRef.current.approveConfirmation();
    }
  }, []);

  const rejectAgentAction = useCallback(async () => {
    if (agentEngineRef.current) {
      await agentEngineRef.current.rejectConfirmation();
    }
  }, []);

  const cancelAgentTask = useCallback(() => {
    if (agentEngineRef.current) {
      agentEngineRef.current.cancelActiveTask();
    }
    setActiveAgentTask(null);
  }, []);

  const CHAT_STORAGE_KEY = 'mayra_chat_messages_v2';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[useMayraAssistant] Error loading stored messages:', e);
      }
    }
    return [
      {
        id: '1',
        sender: 'mayra',
        text: initialGreeting,
        timestamp: Date.now()
      }
    ];
  });

  // Save chat messages to localStorage whenever they update (preserving last 100 turns)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages && messages.length > 0) {
      try {
        const toSave = messages.slice(-100);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn('[useMayraAssistant] Error saving messages to localStorage:', e);
      }
    }
  }, [messages]);

  // Synchronize memories to server memoryStore so /api/chat and live-ws are always aligned
  useEffect(() => {
    if (memories && memories.length > 0) {
      try {
        fetch('/api/memory/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memories })
        }).catch(() => {});
      } catch (_) {}
    }
  }, [memories]);

  const hasGreetedRef = useRef(false);
  const lastUserActivityRef = useRef<number>(Date.now());
  const hasTriggeredIdleCheckinRef = useRef<boolean>(false);
  const lastSpokenLanguageRef = useRef<MayraLanguage>(getSavedLanguage());
  const lastSubmittedPromptRef = useRef<string>('');
  const accumulatedModelTurnTextRef = useRef<string>('');

  // Unified voice state lifecycle transitions
  const handleSpeechStart = useCallback(() => {
    console.log('[MAYRA Assistant] Natural Voice Playback: STARTED');
    continuousEngineRef.current?.onAssistantSpeakingStart();
    setStatus('SPEAKING');
  }, []);

  const handleSpeechEnd = useCallback(() => {
    console.log('[MAYRA Assistant] Natural Voice Playback: ENDED. Continuous active:', isListeningModeRef.current);
    continuousEngineRef.current?.onAssistantSpeakingEnd();
    if (!isListeningModeRef.current) {
      setStatus('READY');
    }
  }, []);

  // Proactive Emotional Silence Check-in: Checks if user has been silent during active session
  // Analyzes emotion over recent turns to offer motivation, comfort, or creative anti-boredom questions
  useEffect(() => {
    if (assistantConfig.proactiveIdleCheckin === false) return;

    const idleInterval = setInterval(() => {
      // 28-30 seconds of quiet after last response
      const isIdle = Date.now() - lastUserActivityRef.current >= 28000;
      if (
        isIdle &&
        !hasTriggeredIdleCheckinRef.current &&
        status === 'READY' &&
        !isListeningModeRef.current &&
        messages.length >= 2
      ) {
        hasTriggeredIdleCheckinRef.current = true;
        const currentLang = lastSpokenLanguageRef.current || currentLanguage;
        const userName = personalConfig.preferredName || personalConfig.fullName || (typeof window !== 'undefined' ? localStorage.getItem('mayra_user_name') : null) || 'Friend';
        
        // Deep multi-turn empathy evaluation
        const empathy = MayraEmpathyEngine.evaluateEmpathyState(messages, status, true);
        MayraEmpathyEngine.markProactiveDelivered();

        let checkinPrompt = '';
        if (empathy.sentiment === 'demotivated') {
          checkinPrompt = (currentLang === 'hi')
            ? `Bhai ${userName}, aap thode shant ho gaye... Yaad rakhna, haar manne se safar rukta hai, ladne se nahi! Batao, kya atka raha hai? Hum milkar solution nikalenge.`
            : `Hey ${userName}, you went quiet... Don't give up! Every challenge is a stepping stone. What's on your mind? Let's solve it together.`;
        } else if (empathy.sentiment === 'sad') {
          checkinPrompt = (currentLang === 'hi')
            ? `${userName} bhai, aap shant lag rahe hain... Main hamesha yahin hoon aapke sath. Agar dil me koi bhi baat ho toh bejhijhak batao, dil halka ho jayega.`
            : `${userName}, you seem a bit down and quiet... I'm right here with you. Whatever is on your mind, feel free to share.`;
        } else if (empathy.sentiment === 'stressed') {
          checkinPrompt = (currentLang === 'hi')
            ? `Bhai, zyada tension mat lo. Ek lambi saans lo. Jo cheez pareshan kar rahi hai, usko step-by-step tod kar hal karte hain.`
            : `Take a gentle breath, ${userName}. Let's break down whatever is stressing you into simple, easy steps.`;
        } else if (empathy.sentiment === 'happy') {
          checkinPrompt = (currentLang === 'hi')
            ? `Aapki khushi dekh kar mera bhi din ban gaya ${userName} bhai! Aage ka kya plan socha hai?`
            : `Seeing you so happy made my day ${userName}! What exciting thing are we tackling next?`;
        } else if (empathy.sentiment === 'curious' || empathy.sentiment === 'ambitious') {
          checkinPrompt = (currentLang === 'hi')
            ? `Waise ${userName} bhai, jo hum discuss kar rahe the, uspar ek zabardast idea yaad aaya... Sunoge?`
            : `By the way ${userName}, thinking about what we were discussing, a great idea struck me... Want to hear it?`;
        } else {
          // Anti-boredom proactive conversational spark
          checkinPrompt = (currentLang === 'hi')
            ? `Shanti acchi lagti hai ${userName} bhai, par agar thode bore feel kar rahe ho toh batao—ek bohot rochak sawal puchun ya ek naya idea discuss karein?`
            : `Peace is great ${userName}, but if you're feeling a bit bored, want to hear a fascinating question or discuss a fun new idea?`;
        }

        const checkinMsg: ChatMessage = {
          id: `msg-m-idle-${Date.now()}`,
          sender: 'mayra',
          text: checkinPrompt,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, checkinMsg]);
        speakText(
          checkinPrompt,
          currentLang,
          () => setStatus('SPEAKING'),
          () => setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY')
        );
        console.log('[MAYRA Assistant] Proactive empathy check-in triggered:', empathy.sentiment, checkinPrompt);
      }
    }, 5000);

    return () => clearInterval(idleInterval);
  }, [assistantConfig.proactiveIdleCheckin, status, currentLanguage, messages, personalConfig]);

  // Feature C: Proactive Smart Guardian Live Subscription
  useEffect(() => {
    const unsub = ProactiveSmartGuardianEngine.getInstance().subscribe((alert) => {
      setActiveProactiveAlert(alert);
      const lang = lastSpokenLanguageRef.current || currentLanguage;
      const alertText = (lang === 'hi') ? alert.messageHi : alert.messageEn;
      const voiceAudioText = (lang === 'hi') ? alert.spokenAudioTextHi : alert.spokenAudioTextEn;

      const alertMsg: ChatMessage = {
        id: `msg-m-guard-${alert.id}`,
        sender: 'mayra',
        text: alertText,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, alertMsg]);
      speakText(
        voiceAudioText, 
        lang, 
        () => setStatus('SPEAKING'), 
        () => setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY')
      );
    });
    return () => unsub();
  }, [currentLanguage]);

  // Dynamic natural voice greeting and pre-warming on app launch
  useEffect(() => {
    prewarmAudioEngine();

    const handleFirstTouch = () => {
      prewarmAudioEngine();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch, { passive: true });
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });

    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    // Small delay to allow audio context readiness
    const timer = setTimeout(() => {
      setStatus('SPEAKING');
      speakText(
        initialGreeting, 
        currentLanguage,
        handleSpeechStart,
        handleSpeechEnd
      );
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, [initialGreeting, currentLanguage, handleSpeechStart, handleSpeechEnd]);

  // Connects or retrieves the persistent Live WebSocket connection
  const getOrConnectLiveWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }

    try {
      const activeVoice = assistantConfig.mayraVoice || assistantConfig.voiceProfile || 'Kore';
      const wsUrl = getWebSocketUrl(`/api/live-ws?voiceName=${encodeURIComponent(activeVoice)}`);
      console.log('[LIVE_WS_STATE] CONNECTING ->', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[LIVE_WS_STATE] OPEN - Connected to persistent Gemini Live session');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 1. Model Audio Chunks (24 kHz Aoede raw PCM)
          if (data.audio) {
            console.log('[LIVE_AUDIO_CHUNK_RECEIVED] Size:', data.audio.length, 'bytes base64');
            schedulePcm24kChunk(
              data.audio,
              handleSpeechStart,
              handleSpeechEnd
            );
          }

          // 2. Model Live Output Transcription
          if (data.transcription) {
            const cleanModelText = typeof data.transcription === 'string'
              ? data.transcription.replace(/^(mayra|assistant|model):\s*/i, '')
              : data.transcription;
            if (cleanModelText) {
              accumulatedModelTurnTextRef.current += cleanModelText;
              setMessages((prev) => {
                if (activeModelMsgIdRef.current) {
                  const id = activeModelMsgIdRef.current;
                  const existing = prev.find((m) => m.id === id);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === id ? { ...m, text: `${m.text}${cleanModelText}` } : m
                    );
                  }
                }
                const newId = `msg-m-${Date.now()}`;
                activeModelMsgIdRef.current = newId;
                return [
                  ...prev,
                  {
                    id: newId,
                    sender: 'mayra',
                    text: cleanModelText,
                    timestamp: Date.now()
                  }
                ];
              });
            }
          }

          // 3. User Live Input Transcription
          if (data.userTranscription) {
            lastUserActivityRef.current = Date.now();
            hasTriggeredIdleCheckinRef.current = false;
            const cleanUserText = typeof data.userTranscription === 'string'
              ? data.userTranscription.replace(/^(user|you):\s*/i, '').trim()
              : data.userTranscription;
            if (cleanUserText) {
              const detected = detectLanguage(cleanUserText);
              lastSpokenLanguageRef.current = detected;
              setMessages((prev) => {
                if (activeUserMsgIdRef.current) {
                  const id = activeUserMsgIdRef.current;
                  return prev.map((m) => {
                    if (m.id !== id) return m;
                    const currentText = m.text.trim();
                    const updated = currentText
                      ? (cleanUserText.startsWith(currentText) ? cleanUserText : `${currentText} ${cleanUserText}`.trim())
                      : cleanUserText;
                    return { ...m, text: updated };
                  });
                } else {
                  const newId = `msg-u-${Date.now()}`;
                  activeUserMsgIdRef.current = newId;
                  return [
                    ...prev,
                    {
                      id: newId,
                      sender: 'user',
                      text: cleanUserText,
                      timestamp: Date.now()
                    }
                  ];
                }
              });
            }
          }

          // 4. Turn Complete -> Reset active message trackers & evaluate turn memory
          if (data.turnComplete) {
            if (lastSubmittedPromptRef.current && accumulatedModelTurnTextRef.current) {
              MemorySyncBridge.getInstance().syncConversationTurn(
                'MAYRA',
                lastSubmittedPromptRef.current,
                accumulatedModelTurnTextRef.current
              ).catch((err) => console.warn('[MemoryVault] Live turn sync notice:', err));
            }
            accumulatedModelTurnTextRef.current = '';
            activeModelMsgIdRef.current = null;
            activeUserMsgIdRef.current = null;
          }

          // 5. Interrupted -> Flush active playback and return to LISTENING
          if (data.interrupted) {
            console.log('[MAYRA Pipeline] LIVE_EVENT: INTERRUPTED (User speaking)');
            flushQueuedAudio();
            setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY');
            activeModelMsgIdRef.current = null;
            activeUserMsgIdRef.current = null;
          }

          // 6. Action Execution (e.g. SAVE_MEMORY, NAVIGATE_TAB, OPEN_SETTINGS)
          if (data.action && onExecuteAction) {
            console.log('[MAYRA Pipeline] LIVE_ACTION_EXECUTED:', data.action.type);
            onExecuteAction(data.action);
          }
        } catch (e) {
          // Ignore JSON parse error
        }
      };

      ws.onerror = (err) => {
        console.warn('[LIVE_WS_STATE] ERROR:', err);
      };

      ws.onclose = () => {
        console.log('[LIVE_WS_STATE] CLOSED');
        wsRef.current = null;
      };

      wsRef.current = ws;
      return ws;
    } catch (err) {
      console.warn('[LIVE_WS_STATE] INIT_ERROR:', err);
      return null;
    }
  }, [onExecuteAction, handleSpeechStart, handleSpeechEnd]);

  // Unified sendGeminiText: Old APK style persistent Gemini Live session text turn
  const sendGeminiText = useCallback(async (textToSend: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => {
    const trimmed = textToSend.trim();
    if (!trimmed && !image) return;

    // Reset silence tracker on user active input
    lastUserActivityRef.current = Date.now();
    hasTriggeredIdleCheckinRef.current = false;

    console.log(`[HOME_TEXT_SUBMIT] Typed prompt submitted: "${trimmed}" (hasImage: ${Boolean(image)})`);
    console.log(`[TEXT_SEND_REQUEST] Sending text turn to Live Session`);

    // Ensure AudioContext is running on user gesture
    prewarmAudioEngine();
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    // VISIBLE DEBUG LOGGING FOR MULTIMODAL ATTACHMENTS
    let activeImage = image;
    // Auto-capture live screen snapshot if user is actively sharing their screen
    if (!activeImage && ScreenObserverEngine.getInstance().isSharing()) {
      const liveFrame = ScreenObserverEngine.getInstance().captureCurrentFrame();
      if (liveFrame) {
        activeImage = {
          base64: liveFrame.base64,
          mimeType: liveFrame.mimeType,
          name: liveFrame.name
        };
        console.log('[MAYRA Screen Vision] Auto-captured live screen frame for ongoing query:', trimmed);
      }
    }

    console.log(`[MAYRA_MULTIMODAL_CLIENT_DEBUG] Pre-flight Check:`, {
      hasImageAttachment: Boolean(activeImage && activeImage.base64),
      attachmentName: activeImage?.name || (activeImage ? 'unnamed' : 'none'),
      mimeType: activeImage?.mimeType || 'none',
      base64Length: activeImage?.base64 ? activeImage.base64.length : 0,
      base64Preview: activeImage?.base64 ? `${activeImage.base64.slice(0, 40)}...` : 'none',
      promptText: trimmed
    });

    // Language adaptation and memory
    const detected = detectLanguage(trimmed);
    lastSpokenLanguageRef.current = detected;
    if (detected !== currentLanguage) {
      setCurrentLanguage(detected);
      saveLanguagePreference(detected);
    }

    // Add user message to UI
    const isDoc = activeImage?.mimeType?.includes('pdf') || 
                  activeImage?.mimeType?.includes('document') || 
                  activeImage?.mimeType?.includes('text') || 
                  activeImage?.mimeType?.includes('csv') || 
                  activeImage?.name?.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: trimmed || (activeImage ? (isDoc ? `Attached document: ${activeImage.name || 'document'}` : 'Live Screen View') : ''),
      image: activeImage ? { base64: activeImage.base64, mimeType: activeImage.mimeType, name: activeImage.name } : undefined,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setStatus('THINKING');
    activeModelMsgIdRef.current = null;

    const lower = (trimmed || '').toLowerCase();

    // 0.0a GOOGLE DRIVE BACKUP INTENT ("मेरी सभी फाइल को तुम मेरे ड्राइव में सेव कर दो Mayra नाम से")
    const isDriveBackupIntent = 
      (lower.includes('ड्राइव') || lower.includes('drive')) && 
      (
        lower.includes('सेव') || lower.includes('save') || 
        lower.includes('बैकअप') || lower.includes('backup') || 
        lower.includes('अपलोड') || lower.includes('upload') || 
        lower.includes('फाइल') || lower.includes('file') || 
        lower.includes('डाल') || lower.includes('store')
      );

    if (!activeImage && isDriveBackupIntent) {
      let targetFolderName = 'Mayra';
      if (lower.includes('mayra') || lower.includes('मायरा')) {
        targetFolderName = 'Mayra';
      } else {
        const folderMatch = trimmed.match(/([a-zA-Z0-9_\-\u0900-\u097F]+)\s*(?:नाम\s*से|name|folder)/i);
        if (folderMatch && folderMatch[1] && !['ड्राइव', 'drive', 'फाइल', 'file', 'files', 'सब', 'सभी'].includes(folderMatch[1].toLowerCase())) {
          targetFolderName = folderMatch[1];
        }
      }

      const assistantMsg: ChatMessage = {
        id: `msg-m-drive-${Date.now()}`,
        sender: 'mayra',
        text: `जी हाँ! मैं आपकी सभी फाइलों (Living Profile, Notes, Projects, Daily Timeline, Memories और Full Backup Snapshot) को आपके Google Drive में '${targetFolderName}' नाम के फ़ोल्डर में सुरक्षित रूप से सेव करने के लिए तैयार हूँ।\n\nनीचे दिए गए कार्ड से अपने Google Drive खाते की पुष्टि करें और "सेव करें" पर टैप करें:`,
        timestamp: Date.now(),
        driveBackupPrompt: {
          folderName: targetFolderName,
          autoStart: true
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('READY');
      speakText(
        `जी हाँ, मैंने आपके Google Drive में ${targetFolderName} नाम के फ़ोल्डर में सभी फ़ाइलें सेव करने के लिए बैकअप कार्ड तैयार कर दिया है।`,
        detected,
        handleSpeechStart,
        handleSpeechEnd
      );
      return;
    }

    // 0.0 INTERACTIVE QUIZ TRIGGER WITH MISSING DETAILS PROMPT FLOW (GOOGLE AI MODE STYLE)
    if (!activeImage && trimmed) {
      const quizAnalysis = QuizDataService.getInstance().parseQuizIntentOrDetails(
        trimmed, 
        pendingQuizConfigRef.current || undefined
      );

      if (quizAnalysis.isQuizIntent) {
        // If some required details (Subject, Chapter, Mode, Board) are missing:
        if (!quizAnalysis.isComplete) {
          pendingQuizConfigRef.current = quizAnalysis.config;
          const configPromptMsg: ChatMessage = {
            id: `msg-m-quiz-cfg-${Date.now()}`,
            sender: 'mayra',
            text: quizAnalysis.promptMessage,
            timestamp: Date.now(),
            quizConfigPrompt: {
              missingFields: quizAnalysis.missingFields,
              currentConfig: quizAnalysis.config,
              optionsChips: quizAnalysis.chips
            }
          };

          setMessages((prev) => [...prev, configPromptMsg]);
          setStatus('READY');
          speakText(quizAnalysis.promptMessage, detected, handleSpeechStart, handleSpeechEnd);
          return;
        }

        // All details are confirmed/provided: Generate the Quiz!
        const finalConfig = quizAnalysis.config;
        pendingQuizConfigRef.current = null; // Reset pending state

        const quizIntroSpeech = finalConfig.mode === 'subjective'
          ? `यहाँ आपके लिए ${finalConfig.subject || 'विषय'} (${finalConfig.chapter || 'पूरा सिलेबस'}) का वर्णनात्मक (Subjective) टेस्ट तैयार है। नीचे बॉक्स में अपना विस्तृत उत्तर लिखें:`
          : `यहाँ आपके लिए ${finalConfig.subject || 'विषय'} (${finalConfig.chapter || 'पूरा सिलेबस'}) का इंटरैक्टिव क्विज तैयार है। सही विकल्प चुनिए:`;

        const quizMessageId = `msg-m-quiz-${Date.now()}`;
        
        // 1. First render message in loading state
        const initialQuizMsg: ChatMessage = {
          id: quizMessageId,
          sender: 'mayra',
          text: quizIntroSpeech,
          timestamp: Date.now(),
          quizData: {
            id: `loading-quiz-${Date.now()}`,
            title: `${finalConfig.subject || 'क्विज'} प्रश्नोत्तरी`,
            topic: finalConfig.subject || 'General Knowledge',
            chapter: finalConfig.chapter,
            board: finalConfig.board,
            mode: finalConfig.mode,
            questions: [],
            isLoading: true
          }
        };

        setMessages((prev) => [...prev, initialQuizMsg]);
        setStatus('SPEAKING');

        // Broadcast to Home screen floating card if user is on Home screen
        window.dispatchEvent(new CustomEvent('mayra_active_quiz_triggered', {
          detail: initialQuizMsg.quizData
        }));

        // Voice feedback in background
        speakText(quizIntroSpeech, detected, handleSpeechStart, undefined);

        // 2. Fetch or generate the full rich quiz (Objective or Subjective)
        QuizDataService.getInstance().getQuiz({
          topic: finalConfig.subject || 'General Knowledge',
          chapter: finalConfig.chapter,
          board: finalConfig.board,
          mode: finalConfig.mode,
          count: finalConfig.questionCount || 5,
          language: finalConfig.language || 'hi'
        }).then((fullQuiz) => {
          setMessages((prev) => prev.map((m) => m.id === quizMessageId ? {
            ...m,
            quizData: {
              ...fullQuiz,
              isLoading: false
            }
          } : m));

          // Notify Home Screen floating card with loaded quiz
          window.dispatchEvent(new CustomEvent('mayra_active_quiz_updated', {
            detail: {
              ...fullQuiz,
              isLoading: false
            }
          }));

          setStatus('READY');
        }).catch((err) => {
          console.error('[useMayraAssistant] Error generating quiz:', err);
          setStatus('READY');
        });

        return;
      }
    }

    // 0.04 UNIFIED SETTINGS CONTROLLER (External Phone Settings & Internal Mayra Settings)
    if (!image && trimmed) {
      const settingResult = await UnifiedSettingsManager.executeSettingCommand(
        trimmed,
        { appearance: appearanceConfig, assistant: assistantConfig },
        detected
      );

      if (settingResult && settingResult.handled) {
        if (settingResult.action && onExecuteAction) {
          onExecuteAction(settingResult.action);
        }
        const assistantMsg: ChatMessage = {
          id: `msg-m-setting-${Date.now()}`,
          sender: 'mayra',
          text: settingResult.reply,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStatus('READY');
        speakText(settingResult.reply, detected, handleSpeechStart, handleSpeechEnd);
        return;
      }
    }

    // 0.05 MARK-LII PORTED FEATURE: REVERSIBLE UNDO STACK COMMAND
    if (!image && trimmed && lower.match(/^(undo|wapas karo|wapas kar do|cancel karo|cancel that|undo that|pehle jaisa kar do|undo action)$/i)) {
      const undoRes = await UndoService.undoLast();
      const undoText = undoRes.success
        ? (detected === 'en' ? `Reverted action: ${undoRes.undoneLabel || undoRes.message}` : `पिछली क्रिया वापस कर दी गई: ${undoRes.undoneLabel || undoRes.message}`)
        : (detected === 'en' ? `Nothing to undo in stack.` : `वापस करने के लिए अभी कोई क्रिया नहीं है।`);

      const assistantMsg: ChatMessage = {
        id: `msg-m-undo-${Date.now()}`,
        sender: 'mayra',
        text: undoText,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('READY');
      speakText(undoText, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 0.052 MULTI-AGENT SWARM PARALLEL ORCHESTRATOR (Feature B)
    const isSwarmTrigger = !image && Boolean(trimmed) && (
      lower.includes('swarm') ||
      lower.includes('मल्टी एजेंट') ||
      lower.includes('मल्टी-एजेंट') ||
      lower.includes('multi agent') ||
      lower.includes('multi-agent') ||
      lower.includes('saare agents') ||
      lower.includes('sab agents') ||
      lower.includes('all agents') ||
      lower.includes('ek saath sabhi') ||
      lower.includes('chalo b karo') ||
      lower.includes('chalo ab b karo') ||
      lower.includes('chalo ab bhi karo') ||
      lower.includes('chalo ab b') ||
      lower.includes('option b') ||
      lower.includes('feature b')
    );

    if (isSwarmTrigger) {
      console.log(`[MAYRA Swarm] Multi-Agent Swarm triggered: "${trimmed}"`);
      const effectiveObjective = (lower.includes('chalo') && (lower.includes('b karo') || lower.includes('bhi karo') || lower.includes('ab b')))
        ? 'दिल्ली का मौसम, मुंबई की फ्लाइट्स, सिस्टम हार्डवेयर हेल्थ और नई मेमोरी एक साथ समानांतर में चेक करो'
        : trimmed;

      const plan = MultiAgentSwarmCoordinator.planSwarm(effectiveObjective, detected === 'hi' ? 'hi' : 'en');
      const deployedNames = plan.activeAgents.map(a => a.name).join(', ');

      const immediateAck = (detected === 'hi')
        ? `हाँ ${userName} भाई, बिल्कुल! मल्टी-एजेंट स्वार्म को तैनात कर रही हूँ—${plan.activeAgents.length} एजेंट्स एक साथ समानांतर में जुट रहे हैं!`
        : `Right away, ${userName}! Deploying Multi-Agent Swarm with ${plan.activeAgents.length} specialized agents in parallel!`;

      const ackMsg: ChatMessage = {
        id: `msg-m-swarm-ack-${Date.now()}`,
        sender: 'mayra',
        text: immediateAck,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, ackMsg]);
      speakText(immediateAck, detected, handleSpeechStart, undefined);

      const swarmTaskId = `swarm-${Date.now()}`;
      setActiveAgentTask({
        taskId: swarmTaskId,
        originalUserRequest: trimmed,
        status: 'EXECUTING',
        currentStep: 1,
        totalSteps: plan.subTasks.length,
        stepDescription: (detected === 'hi')
          ? `मल्टी-एजेंट स्वार्म सक्रिय: ${deployedNames}`
          : `Multi-Agent Swarm deployed: ${deployedNames}`,
        toolCalls: [{ 
          name: 'run_multi_agent_swarm', 
          args: { objective: effectiveObjective },
          step: 1,
          timestamp: Date.now()
        }],
        toolResults: [],
        pendingConfirmation: null,
        isCancelled: false,
        finalResult: null
      });

      // Execute swarm sub-tasks in parallel
      MultiAgentSwarmCoordinator.executeSwarm(plan, (task, curr, tot) => {
        setActiveAgentTask(prev => prev ? {
          ...prev,
          currentStep: curr || 1,
          stepDescription: `${task.agentName}: ${task.instruction}`
        } : null);
      }).then(report => {
        const finalMsg: ChatMessage = {
          id: `msg-m-swarm-res-${Date.now()}`,
          sender: 'mayra',
          text: report.synthesizedSummary,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, finalMsg]);
        speakText(report.synthesizedSummary, detected, handleSpeechStart, handleSpeechEnd);

        setActiveAgentTask(prev => prev ? {
          ...prev,
          status: 'COMPLETED',
          stepDescription: (detected === 'hi') ? 'स्वार्म कार्य संपन्न हुआ।' : 'Swarm complete.',
          finalResult: report.synthesizedSummary
        } : null);

        setTimeout(() => {
          setActiveAgentTask(curr => (curr?.taskId === swarmTaskId ? null : curr));
        }, 4500);
      }).catch(err => {
        console.error('[MultiAgentSwarm] Error:', err);
        setActiveAgentTask(null);
      });

      return;
    }

    // 0.053 PROACTIVE SMART GUARDIAN & BACKGROUND INTELLIGENCE (Feature C)
    const isFeatureCTrigger = !image && Boolean(trimmed) && (
      lower.includes('chalo ab c') ||
      lower.includes('chalo c') ||
      lower.includes('chalo ab c karo') ||
      lower.includes('chalo c karo') ||
      lower.includes('c karo') ||
      lower.includes('c implement') ||
      lower.includes('feature c') ||
      lower.includes('option c') ||
      lower.includes('smart guardian') ||
      lower.includes('proactive guardian') ||
      lower.includes('proactive monitor') ||
      lower.includes('स्मार्ट गार्डियन') ||
      lower.includes('प्रोएक्टिव')
    );

    if (isFeatureCTrigger) {
      console.log(`[MAYRA Guardian] Feature C Proactive Smart Guardian triggered: "${trimmed}"`);
      const auditAlert = ProactiveSmartGuardianEngine.getInstance().triggerImmediateAudit(userName);
      setActiveProactiveAlert(auditAlert);

      const reply = (detected === 'hi') ? auditAlert.messageHi : auditAlert.messageEn;
      const voiceText = (detected === 'hi') ? auditAlert.spokenAudioTextHi : auditAlert.spokenAudioTextEn;

      const auditMsg: ChatMessage = {
        id: `msg-m-guard-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, auditMsg]);
      setStatus('READY');
      speakText(voiceText, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 0.054 ZERO-LATENCY DIRECT MEMORY RECALL (Feature C Memory Pillar)
    const activeMemoriesList = (memories && memories.length > 0)
      ? memories
      : MemoryVaultService.loadPersistedMemories([]);
    const directRecall = MemoryVaultService.recallDirectMemory(trimmed, activeMemoriesList, userName);
    if (directRecall.recalled && (directRecall.replyHi || directRecall.replyEn)) {
      const reply = (detected === 'hi' ? directRecall.replyHi : directRecall.replyEn) || directRecall.replyHi!;
      const memMsg: ChatMessage = {
        id: `msg-m-recall-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, memMsg]);
      setStatus('READY');
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 0.055 AUTONOMOUS MULTI-STEP TASK / REACT EXECUTION LOOP (Mark-53 Autonomous Engine)
    const isMultiStepIntent = !image && Boolean(trimmed) && (
      lower.includes('aur fir') ||
      lower.includes('aur phir') ||
      lower.includes('aur uske baad') ||
      lower.includes('and then') ||
      lower.includes('after that') ||
      lower.includes('dono karo') ||
      lower.includes('teeno karo') ||
      lower.includes('step by step') ||
      lower.includes('automate') ||
      lower.includes('automation') ||
      lower.includes('khud karo') ||
      lower.includes('khud se karo') ||
      lower.includes('autonomous') ||
      lower.includes('auto task') ||
      lower.includes('research about') ||
      lower.includes('pata lagao aur') ||
      lower.includes('search karo aur') ||
      (lower.includes(' aur ') && (
        (lower.includes('weather') || lower.includes('मौसम')) && (lower.includes('flight') || lower.includes('उड़ान') || lower.includes('save') || lower.includes('याद') || lower.includes('status'))
      )) ||
      (lower.includes(' and ') && (
        (lower.includes('weather')) && (lower.includes('flight') || lower.includes('save') || lower.includes('status') || lower.includes('search'))
      ))
    );

    if (isMultiStepIntent && agentEngineRef.current) {
      console.log(`[MAYRA Agent V1] Multi-step autonomous task detected: "${trimmed}"`);
      const immediateAck = (detected === 'hi')
        ? `हाँ ${userName} भाई, बिल्कुल! मैं यह काम अभी स्टेप-बाय-स्टेप पूरा कर रही हूँ।`
        : `Right away, ${userName}! Executing autonomous task loop now.`;
      const ackMsg: ChatMessage = {
        id: `msg-m-agent-ack-${Date.now()}`,
        sender: 'mayra',
        text: immediateAck,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, ackMsg]);
      speakText(immediateAck, detected, handleSpeechStart, undefined);

      agentEngineRef.current.executeTask(trimmed, {
        userName,
        language: detected,
        persona: assistantConfig.personaTone
      });
      return;
    }

    // 0.06 MARK-LII PORTED FEATURE: LIVE WEATHER REPORT WITH INSTANT ACKNOWLEDGMENT
    if (!image && trimmed && (lower.includes('weather') || lower.includes('मौसम') || lower.includes('तापमान') || lower.includes('forecast')) && !lower.includes('code')) {
      const cityMatch = trimmed.match(/(?:in|of|for|का|के|में)\s+([a-zA-Z\u0900-\u097F]+)/i);
      const city = cityMatch ? cityMatch[1].trim() : 'Delhi';

      const ack = InstantAcknowledgmentEngine.getAcknowledgment({ taskType: 'weather', target: city, lang: detected === 'en' ? 'en' : 'hi' });
      const ackId = `msg-m-ack-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: ackId,
        sender: 'mayra',
        text: ack,
        timestamp: Date.now()
      }]);
      speakText(ack, detected, handleSpeechStart, undefined);

      try {
        const weather = await MarkLIIToolsService.fetchWeather(city);
        const reply = detected === 'en'
          ? `**Live Weather in ${weather.city}:** ${weather.temperature}°C, ${weather.condition}. Feels like ${weather.feelsLike}°C with ${weather.humidity}% humidity and wind at ${weather.windSpeed}. ${weather.summary}`
          : `**${weather.city} में लाइव मौसम:** ${weather.temperature}°C, ${weather.condition}। यह ${weather.feelsLike}°C जैसा महसूस हो रहा है, नमी ${weather.humidity}% और हवा की गति ${weather.windSpeed} है। ${weather.summary}`;

        setMessages((prev) => prev.map((m) => m.id === ackId ? { ...m, text: reply } : m));
        setStatus('READY');
        speakText(reply.replace(/\*\*/g, ''), detected, handleSpeechStart, handleSpeechEnd);
        return;
      } catch (e) {
        // Fall through to regular Gemini pipeline
      }
    }

    // 0.07 MARK-LII PORTED FEATURE: FLIGHT FINDER WITH INSTANT ACKNOWLEDGMENT
    if (!image && trimmed && (lower.includes('flight') || lower.includes('उड़ान') || lower.includes('टिकट') || lower.includes('airfare')) && (lower.includes(' to ') || lower.includes(' se ') || lower.includes('से') || lower.includes('तक'))) {
      const ack = InstantAcknowledgmentEngine.getAcknowledgment({ taskType: 'flight', lang: detected === 'en' ? 'en' : 'hi' });
      const ackId = `msg-m-ack-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: ackId,
        sender: 'mayra',
        text: ack,
        timestamp: Date.now()
      }]);
      speakText(ack, detected, handleSpeechStart, undefined);

      try {
        let origin = 'Delhi';
        let dest = 'Mumbai';
        const fromMatch = trimmed.match(/(?:from|se|से)\s+([a-zA-Z\u0900-\u097F]+)/i);
        const toMatch = trimmed.match(/(?:to|तक|ko|को)\s+([a-zA-Z\u0900-\u097F]+)/i);
        if (fromMatch) origin = fromMatch[1].trim();
        if (toMatch) dest = toMatch[1].trim();

        const flightsData = await MarkLIIToolsService.searchFlights(origin, dest);
        const listSummary = flightsData.flights.map(f => `• ${f.airline} (${f.flightNumber}): ${f.departureTime} → ${f.arrivalTime} (${f.duration}) — **${f.estimatedPrice}**`).join('\n');
        const reply = detected === 'en'
          ? `**Commercial Flights from ${origin} to ${dest}:**\n${listSummary}\n\n_${flightsData.bookingHint || 'Check-in opens 48h before flight.'}_`
          : `**${origin} से ${dest} के लिए उपलब्ध उड़ानें:**\n${listSummary}\n\n_${flightsData.bookingHint || 'उड़ान से 48 घंटे पहले ऑनलाइन चेक-इन खुलता है।'}_`;

        setMessages((prev) => prev.map((m) => m.id === ackId ? { ...m, text: reply } : m));
        setStatus('READY');
        speakText(`${origin} se ${dest} ke liye ${flightsData.flights.length} flights mil gayi hain.`, detected, handleSpeechStart, handleSpeechEnd);
        return;
      } catch (e) {
        // Fall through
      }
    }

    // 0.08 MARK-LII PORTED FEATURE: REAL-TIME SYSTEM TELEMETRY WITH INSTANT ACKNOWLEDGMENT
    if (!image && trimmed && (lower.includes('system status') || lower.includes('telemetry') || lower.includes('सिस्टम स्टेटस') || lower.includes('cpu status') || lower.includes('ram usage'))) {
      const ack = InstantAcknowledgmentEngine.getAcknowledgment({ taskType: 'system', lang: detected === 'en' ? 'en' : 'hi' });
      const ackId = `msg-m-ack-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: ackId,
        sender: 'mayra',
        text: ack,
        timestamp: Date.now()
      }]);
      speakText(ack, detected, handleSpeechStart, undefined);

      try {
        const telemetry = await MarkLIIToolsService.getSystemTelemetry();
        const reply = detected === 'en'
          ? `**System Telemetry Diagnostics:**\n• **Platform:** ${telemetry.platform} (${telemetry.architecture})\n• **CPU Load:** ${telemetry.cpu.load1m} avg (${telemetry.cpu.count} Cores)\n• **RAM Usage:** ${telemetry.memory.percentage}% (${telemetry.memory.usedMb}MB / ${telemetry.memory.totalMb}MB)\n• **System Uptime:** ${telemetry.uptime.formatted}\n• **Status:** Optimal Performance`
          : `**सिस्टम टेलीमेट्री डायग्नोस्टिक्स:**\n• **प्लेटफ़ॉर्म:** ${telemetry.platform} (${telemetry.architecture})\n• **CPU लोड:** ${telemetry.cpu.load1m} औसत (${telemetry.cpu.count} कोर)\n• **RAM उपयोग:** ${telemetry.memory.percentage}% (${telemetry.memory.usedMb}MB / ${telemetry.memory.totalMb}MB)\n• **अपटाइम:** ${telemetry.uptime.formatted}\n• **स्थिति:** उत्तम (Optimal)`;

        setMessages((prev) => prev.map((m) => m.id === ackId ? { ...m, text: reply } : m));
        setStatus('READY');
        speakText(detected === 'en' ? `System telemetry is optimal with ${telemetry.memory.percentage} percent RAM usage.` : `सिस्टम सुचारु रूप से चल रहा है, रैम उपयोग ${telemetry.memory.percentage} प्रतिशत है।`, detected, handleSpeechStart, handleSpeechEnd);
        return;
      } catch (e) {
        // Fall through
      }
    }

    // 0. MAYRA <-> STONICX Autonomous Task Delegation & Direct Switch Router
    if (!image && trimmed) {
      const decision = await DelegationRouter.routePrompt({
        prompt: trimmed,
        currentPersona: 'MAYRA',
        chatHistory: messages,
        language: detected,
        onModeSwitch
      });

      // 0.1 Explicit Screen Switch Request (e.g. "switch screen to stonicx")
      if (decision.shouldDelegate && decision.actionTaken === 'direct_switch') {
        setStatus('READY');
        return;
      }

      // 0.2 Delegated Execution (e.g. "Mayra ye kaam StonicX se karwao", web search, codebase scan, technical code)
      if (decision.actionTaken === 'delegated_to_stonicx' || decision.classification.isDelegatedTask) {
        const agentType = decision.classification.delegatedAgent || 'STONICX';
        const interimAckText = DelegationRouter.getDelegationAckText(agentType, detected, trimmed);
        const interimId = `msg-m-delegated-pending-${Date.now()}`;

        const defaultBadge = agentType === 'RESEARCH_AGENT'
          ? { name: 'Deep Research Agent', icon: 'search', role: 'Multi-Query Web Analyst' }
          : (agentType === 'CODING_AGENT'
              ? { name: 'Coding & Architecture Agent', icon: 'terminal', role: 'Software Engineer' }
              : { name: 'STONICX Core', icon: 'zap', role: 'Cybernetic AI Engine' });

        // 1. Immediately present interim dispatch message
        const interimMsg: ChatMessage = {
          id: interimId,
          sender: 'mayra',
          text: interimAckText,
          isDelegationPending: true,
          delegatedAgentBadge: defaultBadge,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, interimMsg]);
        setStatus('SPEAKING');

        // 2. Immediately speak out loud in user's detected language so user gets instant voice feedback
        speakText(interimAckText, detected, handleSpeechStart, undefined);

        try {
          // 3. Execute delegated task in the background
          const delegatedRes = await DelegationRouter.executeDelegatedTask({
            prompt: trimmed,
            delegatedAgent: agentType,
            userName,
            language: detected,
            chatHistory: messages
          });

          // 4. Update the interim message with full comprehensive results
          const finalMsg: ChatMessage = {
            id: `msg-m-delegated-${Date.now()}`,
            sender: 'mayra',
            text: delegatedRes.replyText,
            delegatedAgentBadge: delegatedRes.badge,
            timestamp: Date.now()
          };

          setMessages((prev) => prev.map((m) => m.id === interimId ? finalMsg : m));
          setStatus('SPEAKING');

          // 5. Speak synthesized summary or response via Mayra voice
          const textToSpeak = delegatedRes.spokenSummary || delegatedRes.replyText;
          speakText(textToSpeak, detected, handleSpeechStart, handleSpeechEnd);
          return;
        } catch (err) {
          console.warn('[useMayraAssistant] Error in delegated task execution:', err);
          const fallbackText = (detected === 'hi')
            ? 'STONICX से परिणाम प्राप्त करने में कुछ विलम्ब हुआ, किन्तु सिस्टम सुरक्षित है।'
            : 'Execution finished with fallback status. All systems remain operational.';
          
          setMessages((prev) => prev.map((m) => m.id === interimId ? {
            ...m,
            text: fallbackText,
            isDelegationPending: false
          } : m));
          setStatus('READY');
          return;
        }
      }
    }

    // 0.1 Voice-Activated Gesture Toggle Intent Bridge ("gesture chalu karo", "gesture band karo", etc.)
    if (!image) {
      const gestureIntent = GestureVoiceBridge.parseIntent(trimmed);
      if (gestureIntent.isMatch) {
        const result = await GestureVoiceBridge.executeVoiceCommand(trimmed);
        const assistantMsg: ChatMessage = {
          id: `msg-m-gesture-${Date.now()}`,
          sender: 'mayra',
          text: result.replyText,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(result.replyText, detected, handleSpeechStart, handleSpeechEnd);
        return;
      }
    }

    // Check if user request is an actionable task or tool execution command
    const isAgentTask = !image && (
      lower.includes('whatsapp') ||
      lower.includes('sms') ||
      lower.startsWith('text ') ||
      lower.includes('send text') ||
      lower.includes('send message') ||
      lower.includes('make a call') ||
      lower.startsWith('call ') ||
      lower.includes('phone lagao') ||
      lower.startsWith('open ') ||
      lower.startsWith('launch ') ||
      lower.includes('battery') ||
      lower.includes('device status') ||
      lower.includes('notification') ||
      lower.includes('search memory') ||
      lower.includes('find in memory') ||
      lower.includes('kholo') ||
      lower.includes('bhejo') ||
      lower.includes('check karo')
    );

    if (isAgentTask && agentEngineRef.current) {
      console.log(`[MAYRA Agent V1] Dispatching user request to Agent Engine: "${trimmed}"`);
      const immediateAck = (detected === 'hi')
        ? `हाँ ${userName} भाई, बिल्कुल! मैं इस कार्य पर तुरंत लग रही हूँ।`
        : `Right away, ${userName}! Executing action now.`;
      const ackMsg: ChatMessage = {
        id: `msg-m-agent-ack-${Date.now()}`,
        sender: 'mayra',
        text: immediateAck,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, ackMsg]);
      speakText(immediateAck, detected, handleSpeechStart, undefined);

      agentEngineRef.current.executeTask(trimmed, {
        userName,
        language: detected,
        persona: assistantConfig.personaTone
      });
      return;
    }

    // Direct Call Answer / Reject Quick Command
    if (lower.includes('answer call') || lower.includes('accept call') || lower === 'answer' || lower === 'accept') {
      const result = await MayraSystemBridge.answerCall();
      const reply = result.success ? "Call answered." : "No active ringing call to answer.";
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    if (lower.includes('reject call') || lower.includes('decline call') || lower === 'reject' || lower === 'decline' || lower === 'end call') {
      const result = await MayraSystemBridge.rejectCall();
      const reply = result.success ? "Call declined." : "No active call to decline.";
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 4. App Launch Command
    const openMatch = trimmed.match(/^(?:open|launch)\s+([a-zA-Z0-9\s]+)$/i);
    if (openMatch && !trimmed.toLowerCase().includes('setting') && !trimmed.toLowerCase().includes('camera')) {
      const targetApp = openMatch[1].trim();
      const result = await MayraSystemBridge.launchApp(targetApp);
      const reply = result.success ? `Opening ${targetApp}.` : `Could not open ${targetApp}.`;
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 5. Memory Vault: Analyze for persistent facts with conservative threshold
    if (onExecuteAction && trimmed.length > 8) {
      const extraction = MemoryVaultService.analyzeForMemoryExtraction(trimmed);
      if (extraction.shouldMemorize && extraction.key && extraction.value && extraction.confidence >= 0.85) {
        console.log('[MemoryVault] ✦ Conservative memory extracted:', extraction.key, '->', extraction.value, `(${extraction.reason})`);
        onExecuteAction({
          type: 'AUTO_MEMORY_SAVED',
          payload: {
            key: extraction.key,
            value: extraction.value,
            category: extraction.category || 'personal',
            importance: extraction.importance || 4,
            tags: extraction.tags || ['auto_vault']
          }
        });
      }
    }

    // Hybrid AI routing: when the device is actually offline, use the verified
    // on-device model instead of attempting Gemini/network transport. Images stay
    // on the existing online Vision path because this offline LLM path is text-only.
    if (!activeImage && hybridAiRouter.getRecommendedMode() === 'offline_local') {
      try {
        console.log('[MAYRA HYBRID] Network unavailable -> routing to verified offline model');
        const offlineResult = await offlineMayraProvider.generateStreamingResponse(trimmed, {
          systemPrompt: 'You are MAYRA, a friendly and concise offline AI companion. Respond naturally in the user\'s language. Do not claim to have internet access or capabilities that are unavailable offline.',
          onToken: (_token, accumulated) => {
            const id = activeModelMsgIdRef.current || `msg-m-offline-${Date.now()}`;
            activeModelMsgIdRef.current = id;
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === id);
              if (!exists) return [...prev, { id, sender: 'mayra', text: accumulated, timestamp: Date.now() }];
              return prev.map((m) => m.id === id ? { ...m, text: accumulated } : m);
            });
          }
        });

        const reply = offlineResult.text.trim();
        if (reply) {
          if (!activeModelMsgIdRef.current) {
            setMessages((prev) => [...prev, { id: `msg-m-offline-${Date.now()}`, sender: 'mayra', text: reply, timestamp: Date.now() }]);
          }
          MemorySyncBridge.getInstance().syncConversationTurn('MAYRA', trimmed, reply).catch(() => {});
          // Existing speech engine decides the available local/online voice path.
          speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
        }
        setStatus('READY');
      } catch (offlineError) {
        console.warn('[MAYRA HYBRID] Offline model route failed:', offlineError);
        const message = detected === 'hi'
          ? 'अभी इंटरनेट उपलब्ध नहीं है और offline model भी तैयार नहीं है। Settings में Offline AI Model install कर लो।'
          : 'Internet is unavailable and the offline model is not ready. Install an Offline AI Model from Settings.';
        setMessages((prev) => [...prev, { id: `msg-m-offline-error-${Date.now()}`, sender: 'mayra', text: message, timestamp: Date.now() }]);
        speakText(message, detected, handleSpeechStart, handleSpeechEnd);
        setStatus('READY');
      }
      return;
    }

    // Connect or reuse existing persistent WebSocket
    const ws = getOrConnectLiveWs();
    console.log(`[LIVE_WS_STATE] ReadyState: ${ws?.readyState}`);

    // Record submitted turn prompt for post-turn persistence & evaluation
    lastSubmittedPromptRef.current = trimmed;
    accumulatedModelTurnTextRef.current = '';

    // Unified On-Demand Memory Retrieval:
    // Combine all active user memories from props and local vault
    const activeMemories = (memories && memories.length > 0)
      ? memories
      : MemoryVaultService.loadPersistedMemories([]);

    const vaultContext = MemoryVaultService.buildPromptContext(activeMemories, trimmed, 12);
    const bridgeContext = MemorySyncBridge.getInstance().generateSystemContextPrompt('MAYRA', trimmed);
    const memoryContext = [vaultContext, bridgeContext].filter(Boolean).join('\n\n');

    // Multi-turn conversation history (last 12 turns for deep context analysis)
    const recentHistory = messages
      .filter(m => m.text && m.text.trim())
      .slice(-12)
      .map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text.trim()
      }));

    const screenPromptContext = ScreenObserverEngine.getInstance().getScreenContextPrompt();
    const effectiveContextPrompt = [memoryContext, screenPromptContext].filter(Boolean).join('\n\n');

    const hasImagePayload = Boolean(activeImage && activeImage.base64);
    console.log(`[MAYRA_CLIENT_SEND_DISPATCH] Dispatching turn:`, {
      channel: (ws && ws.readyState === WebSocket.OPEN) ? 'WebSocket (/api/live-ws)' : 'HTTP (/api/chat)',
      text: trimmed,
      hasMemoryContext: Boolean(effectiveContextPrompt),
      historyLength: recentHistory.length,
      hasImageAttachment: hasImagePayload,
      mimeType: activeImage?.mimeType || 'none',
      base64Length: activeImage?.base64 ? activeImage.base64.length : 0,
      imageName: activeImage?.name || 'none'
    });

    let deliveredViaWs = false;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ text: trimmed, image: activeImage, contextPrompt: effectiveContextPrompt, history: recentHistory }));
        console.log(`[LIVE_TEXT_SENT] Dispatched text, history & image to /api/live-ws`);
        deliveredViaWs = true;
      } catch (err) {
        console.warn('[LIVE_TEXT_SEND_ERROR] Falling back to HTTP:', err);
      }
    }

    if (!deliveredViaWs) {
      // Direct HTTP /api/chat with timeout, native fallback, and custom API key validation
      try {
        console.log('[LIVE_WS_STATE] Dispatching via HTTP apiUrl(/api/chat)');
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 35000);

        const res = await fetch(apiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify({
            message: trimmed,
            history: recentHistory,
            image: activeImage,
            contextPrompt: effectiveContextPrompt,
            persona: assistantConfig.personaTone,
            model: personalConfig.geminiModel || 'gemini-3.6-flash',
            temperature: personalConfig.temperature ?? 0.7,
            userName: personalConfig.preferredName || personalConfig.fullName,
            language: detected,
            assistant: 'mayra',
            voiceName: assistantConfig.mayraVoice || assistantConfig.voiceProfile || 'Kore',
            apiKey: personalConfig.geminiApiKey,
            returnAudio: true,
            stream: true
          })
        });
        clearTimeout(timeoutId);

        // Handle SSE streaming response if returned
        if (res.ok && res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          const assistantMsgId = `msg-m-${Date.now() + 1}`;
          let accumulatedText = '';
          let receivedAnyAudio = false;

          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              sender: 'mayra',
              text: '',
              timestamp: Date.now()
            }
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
              const clean = line.trim();
              if (clean.startsWith('data: ')) {
                try {
                  const ev = JSON.parse(clean.slice(6));
                  if (ev.type === 'chunk' && ev.text) {
                    accumulatedText += ev.text;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId ? { ...m, text: accumulatedText } : m
                      )
                    );
                  } else if (ev.type === 'sentence' && (ev.audio || ev.wavBase64 || ev.audioUrl)) {
                    receivedAnyAudio = true;
                    if (ev.audio) {
                      schedulePcm24kChunk(ev.audio, handleSpeechStart, handleSpeechEnd);
                    } else if (ev.wavBase64 || ev.audioUrl) {
                      playAudioPayload({ wavBase64: ev.wavBase64, audioUrl: ev.audioUrl }, handleSpeechStart, handleSpeechEnd);
                    }
                  } else if (ev.type === 'done') {
                    if (ev.autoMemorySaved && onExecuteAction) {
                      onExecuteAction({
                        type: 'AUTO_MEMORY_SAVED',
                        payload: ev.autoMemorySaved
                      });
                    }
                    if (ev.action && onExecuteAction) {
                      onExecuteAction(ev.action);
                    }
                    const finalText = ev.fullText || accumulatedText;
                    MemorySyncBridge.getInstance().syncConversationTurn('MAYRA', trimmed, finalText).catch(() => {});
                    if (!receivedAnyAudio && finalText) {
                      speakText(finalText, detected, handleSpeechStart, handleSpeechEnd);
                    }
                  }
                } catch {
                  // ignore malformed SSE line
                }
              }
            }
          }
          setStatus('READY');
          return;
        }

        if (res.ok) {
          // Standard JSON response handling
          const data = await res.json();
          if (data.action && onExecuteAction) {
            onExecuteAction(data.action);
          }
          if (data.autoMemorySaved && onExecuteAction) {
            onExecuteAction({
              type: 'AUTO_MEMORY_SAVED',
              payload: data.autoMemorySaved
            });
          }
          const reply = data.response || (detected === 'hi' ? `जी ${userName} भाई, मैं तैयार हूँ!` : `Yes ${userName}, I am ready!`);
          const assistantMsg: ChatMessage = {
            id: `msg-m-${Date.now() + 1}`,
            sender: 'mayra',
            text: reply,
            timestamp: Date.now()
          };
          setMessages((prev) => [...prev, assistantMsg]);
          MemorySyncBridge.getInstance().syncConversationTurn('MAYRA', trimmed, reply).catch(() => {});
          if (data.audioBase64 || data.wavBase64 || data.audioUrl) {
            playAudioPayload(
              { audioBase64: data.audioBase64, wavBase64: data.wavBase64, audioUrl: data.audioUrl },
              handleSpeechStart,
              handleSpeechEnd
            );
          } else {
            speakText(
              reply,
              detected,
              handleSpeechStart,
              handleSpeechEnd
            );
          }
          setStatus('READY');
          return;
        }

        throw new Error(`HTTP error ${res.status}`);
      } catch (e) {
        console.warn('[MAYRA Fallback] Remote /api/chat error, activating instant neural fallback:', e);
        // Guaranteed zero-hang response: immediate warm reply in Hindi/English + voice synthesis
        const smartFallback = getMayraSmartFallback(
          trimmed, 
          personalConfig.preferredName || personalConfig.fullName, 
          personalConfig.geminiApiKey
        );
        const assistantMsg: ChatMessage = {
          id: `msg-m-${Date.now() + 1}`,
          sender: 'mayra',
          text: smartFallback.reply,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        MemorySyncBridge.getInstance().syncConversationTurn('MAYRA', trimmed, smartFallback.reply).catch(() => {});
        speakText(smartFallback.reply, detected, handleSpeechStart, handleSpeechEnd);
        setStatus('READY');
      }
    }
  }, [currentLanguage, assistantConfig, personalConfig, onExecuteAction, getOrConnectLiveWs, handleSpeechStart, handleSpeechEnd, memories]);

  // Initialize Continuous Conversation Engine
  useEffect(() => {
    const engine = new ContinuousConversationEngine({
      onStateChange: (newState) => {
        setStatus(newState);
      },
      onUserTranscript: (transcript, isFinal) => {
        lastUserActivityRef.current = Date.now();
        hasTriggeredIdleCheckinRef.current = false;
        const cleanUserText = transcript.replace(/^(user|you):\s*/i, '').trim();
        if (!cleanUserText) return;

        const detected = detectLanguage(cleanUserText);
        lastSpokenLanguageRef.current = detected;

        setMessages((prev) => {
          if (activeUserMsgIdRef.current) {
            const id = activeUserMsgIdRef.current;
            return prev.map((m) => (m.id === id ? { ...m, text: cleanUserText } : m));
          } else {
            const newId = `msg-u-${Date.now()}`;
            activeUserMsgIdRef.current = newId;
            return [
              ...prev,
              {
                id: newId,
                sender: 'user',
                text: cleanUserText,
                timestamp: Date.now()
              }
            ];
          }
        });
        if (isFinal) {
          activeUserMsgIdRef.current = null;
        }
      },
      onTurnComplete: (completedTranscript) => {
        console.log('[Continuous Conversation] Turn completed:', completedTranscript);
        activeUserMsgIdRef.current = null;
        sendGeminiText(completedTranscript);
      },
      onInterruption: () => {
        console.log('[Continuous Conversation] Barge-in interruption triggered!');
        activeModelMsgIdRef.current = null;
        activeUserMsgIdRef.current = null;
      },
      onError: (err) => {
        console.warn('[Continuous Conversation] Engine notice:', err);
      }
    }, currentLanguage);

    continuousEngineRef.current = engine;

    return () => {
      engine.stopContinuousMode();
    };
  }, [sendGeminiText, currentLanguage]);

  // Main prompt submission for typed chat input (Home Screen / Chat Screen)
  const submitPrompt = useCallback((customText?: string, image?: { base64: string; mimeType?: string }) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend && !image) return;
    sendGeminiText(textToSend, image);
  }, [inputText, sendGeminiText]);

  // OpenAI Realtime is the primary WebRTC voice path. Gemini Live remains the fallback.
  const connectOpenAIRealtime = useCallback(async (): Promise<boolean> => {
    if (openAiVoiceRef.current) return true;
    const engine = new OpenAILiveVoice({
      voice: 'marin',
      onState: (state) => {
        console.log('[OPENAI_REALTIME_STATE]', state);
        if (state === 'connected') setStatus('LISTENING');
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          if (isListeningModeRef.current) setStatus('READY');
        }
      },
      onEvent: (event) => {
        const type = typeof event?.type === 'string' ? event.type : '';
        if (type.includes('output_audio_transcript') && typeof event?.delta === 'string') {
          const delta = event.delta;
          setMessages((prev) => {
            if (activeModelMsgIdRef.current) {
              return prev.map((m) => m.id === activeModelMsgIdRef.current ? { ...m, text: m.text + delta } : m);
            }
            const id = 'msg-m-openai-' + Date.now();
            activeModelMsgIdRef.current = id;
            return [...prev, { id, sender: 'mayra', text: delta, timestamp: Date.now() }];
          });
        }
        if (type === 'input_audio_buffer.speech_started') {
          setStatus('LISTENING');
          flushQueuedAudio();
        }
        if (type === 'response.created') setStatus('THINKING');
        if (type === 'response.done') {
          setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY');
          activeModelMsgIdRef.current = null;
        }
      },
      onError: (error) => console.warn('[OPENAI_REALTIME] Primary voice failed:', error)
    });
    try {
      await engine.connect();
      openAiVoiceRef.current = engine;
      console.log('[OPENAI_REALTIME] PRIMARY voice connected');
      return true;
    } catch (error) {
      engine.disconnect();
      openAiVoiceRef.current = null;
      console.warn('[OPENAI_REALTIME] Falling back to Gemini Live:', error);
      return false;
    }
  }, []);

  // Backtalk-Style Continuous Voice Mode Toggle: 1st tap = Continuous ON, 2nd tap = Continuous OFF
  const triggerVoice = useCallback(async () => {
    console.log('[MAYRA Pipeline] MIC_CLICK triggered. Current ListeningMode:', isListeningModeRef.current, 'Status:', status);
    prewarmAudioEngine();

    // If currently speaking, tapping mic acts as instant manual interruption
    if (status === 'SPEAKING') {
      console.log('[MAYRA Pipeline] Assistant speaking -> Manual interruption triggered');
      continuousEngineRef.current?.interruptManually();
      flushQueuedAudio();
      stopCurrentSpeech();
      setStatus('LISTENING');
      return;
    }

    if (isListeningModeRef.current) {
      // Turn Continuous Listening OFF
      setIsListeningMode(false);
      isListeningModeRef.current = false;
      continuousEngineRef.current?.stopContinuousMode();
      openAiVoiceRef.current?.disconnect();
      openAiVoiceRef.current = null;
      stopPcm16kCapture();
      flushQueuedAudio();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
      setStatus('READY');
      if (MayraNativeBridgeClient.isAvailableSync()) {
        MayraNativeBridgeClient.resumeOfflineWakeWord();
      }
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: OFF -> READY');
    } else {
      // The background Android wake-word service already owns the microphone.
      // Release its capture before interactive WebView voice starts to avoid two
      // simultaneous microphone pipelines causing audio failure/app instability.
      if (MayraNativeBridgeClient.isAvailableSync()) {
        MayraNativeBridgeClient.pauseOfflineWakeWord();
      }

      // Play custom activation sound strictly ONCE on explicit physical user mic click
      playCustomActivationSound();
      // Interrupt any current speech before listening
      flushQueuedAudio();
      // Turn Continuous Listening ON
      setIsListeningMode(true);
      isListeningModeRef.current = true;
      setStatus('LISTENING');
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: ON -> LISTENING');

      // OpenAI Realtime WebRTC is primary. Existing Gemini Live remains fallback.
      const openAiConnected = await connectOpenAIRealtime();
      if (openAiConnected) {
        setStatus('LISTENING');
        console.log('[MAYRA Pipeline] OPENAI_REALTIME: PRIMARY voice active');
        return;
      }

      await continuousEngineRef.current?.startContinuousMode();
      const ws = getOrConnectLiveWs();
      const started = await startPcm16kCapture((pcmBase64) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: pcmBase64 }));
        }
      });

      if (!started) {
        console.warn('[MAYRA Pipeline] Could not start PCM capture.');
      }
    }
  }, [connectOpenAIRealtime, getOrConnectLiveWs, status]);

  // Backtalk-Style Push-to-Talk (PTT / Hold-to-Talk)
  const startPtt = useCallback(async () => {
    if (isPttActiveRef.current) return;
    console.log('[MAYRA Pipeline] PTT_START initiated. Current Status:', status);
    prewarmAudioEngine();

    // If currently speaking, immediately interrupt
    if (status === 'SPEAKING') {
      console.log('[MAYRA Pipeline] Assistant speaking -> PTT manual interruption');
      continuousEngineRef.current?.interruptManually();
      flushQueuedAudio();
      stopCurrentSpeech();
    }

    if (MayraNativeBridgeClient.isAvailableSync()) {
      MayraNativeBridgeClient.pauseOfflineWakeWord();
    }

    isPttActiveRef.current = true;
    setIsPttActive(true);
    setStatus('LISTENING');

    // Start PTT mode on continuous engine
    await continuousEngineRef.current?.startPtt();

    // Stream 16kHz PCM audio if WebSocket is connected
    const ws = getOrConnectLiveWs();
    const started = await startPcm16kCapture((pcmBase64) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ audio: pcmBase64 }));
      }
    });

    if (!started) {
      console.warn('[MAYRA Pipeline] Could not start PCM capture for PTT.');
    }
  }, [getOrConnectLiveWs, status]);

  const stopPtt = useCallback(() => {
    if (!isPttActiveRef.current) return;
    console.log('[MAYRA Pipeline] PTT_STOP initiated. Submitting turn.');
    isPttActiveRef.current = false;
    setIsPttActive(false);

    if (!isListeningModeRef.current && MayraNativeBridgeClient.isAvailableSync()) {
      MayraNativeBridgeClient.resumeOfflineWakeWord();
    }

    // Stop PCM audio stream if not in continuous hands-free mode
    if (!isListeningModeRef.current) {
      stopPcm16kCapture();
    }

    // Stop PTT on engine; this triggers onTurnComplete if speech was recorded
    const dispatched = continuousEngineRef.current?.stopPtt();
    if (!dispatched && !isListeningModeRef.current) {
      setStatus('READY');
    }
  }, []);

  // Backtalk-Style Spacebar Push-to-Talk (Hold Space to talk, release to send)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;

      // Crucial: check if user is typing in a text input field or textarea
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable) {
          return; // Do NOT interfere with text-input fields!
        }
      }

      // Prevent page scrolling on Spacebar
      e.preventDefault();

      // If already holding (e.repeat is fired repeatedly while key is pressed), ignore
      if (e.repeat || isPttActiveRef.current) return;

      console.log('[MAYRA PTT] Spacebar pressed down -> starting PTT');
      startPtt();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;

      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      if (isPttActiveRef.current) {
        e.preventDefault();
        console.log('[MAYRA PTT] Spacebar released -> stopping PTT and completing turn');
        stopPtt();
      }
    };

    const handleWindowBlur = () => {
      if (isPttActiveRef.current) {
        console.log('[MAYRA PTT] Window blur -> auto-stopping PTT');
        stopPtt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [startPtt, stopPtt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      continuousEngineRef.current?.stopContinuousMode();
      stopPcm16kCapture();
      flushQueuedAudio();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
    };
  }, []);

  const clearChat = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch (e) {}
    }
    setMessages([
      {
        id: `m-init-${Date.now()}`,
        sender: 'mayra',
        text: initialGreeting,
        timestamp: Date.now()
      }
    ]);
    activeModelMsgIdRef.current = null;
    activeUserMsgIdRef.current = null;
  }, [initialGreeting]);

  return {
    status,
    setStatus,
    isListeningMode,
    setIsListeningMode,
    isPttActive,
    startPtt,
    stopPtt,
    inputText,
    setInputText,
    isProcessing,
    messages,
    setMessages,
    submitPrompt,
    triggerVoice,
    clearChat,
    currentLanguage,
    setCurrentLanguage,
    activeAgentTask,
    approveAgentAction,
    rejectAgentAction,
    cancelAgentTask,
    activeProactiveAlert,
    dismissProactiveAlert: () => setActiveProactiveAlert(null),
    aiMode,
    isNetworkAvailable,
    isOfflineModelReady
  };
}
