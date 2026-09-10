import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantStatus, ChatMessage, UserPersonalConfig, AssistantConfig, AppAction, MemoryItem, AgentTaskContext } from '../types';
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
  MayraLanguage 
} from '../utils/speechEngine';
import { MayraSystemBridge } from '../services/native/MayraSystemIntegrationBridge';
import { MemoryVaultService } from '../services/memory/memoryVaultService';
import { MemorySyncBridge } from '../services/memory/memorySyncBridge';
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

export interface UseMayraAssistantProps {
  personalConfig: UserPersonalConfig;
  assistantConfig: AssistantConfig;
  memories?: MemoryItem[];
  onExecuteAction?: (action: AppAction) => void;
  onModeSwitch?: (mode: 'mayra' | 'stonicx') => void;
}

export function useMayraAssistant({ personalConfig, assistantConfig, memories = [], onExecuteAction, onModeSwitch }: UseMayraAssistantProps) {
  const [status, setStatus] = useState<AssistantStatus>('READY');
  const [isListeningMode, setIsListeningMode] = useState<boolean>(false);
  const [isPttActive, setIsPttActive] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<MayraLanguage>(() => getSavedLanguage());
  const [activeAgentTask, setActiveAgentTask] = useState<AgentTaskContext | null>(null);
  const [activeProactiveAlert, setActiveProactiveAlert] = useState<ProactiveAlert | null>(null);
  
  const isListeningModeRef = useRef<boolean>(false);
  isListeningModeRef.current = isListeningMode;
  const isPttActiveRef = useRef<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const activeModelMsgIdRef = useRef<string | null>(null);
  const activeUserMsgIdRef = useRef<string | null>(null);

  const continuousEngineRef = useRef<ContinuousConversationEngine | null>(null);
  const agentEngineRef = useRef<MayraAgentEngine | null>(null);
  const pendingQuizConfigRef = useRef<Partial<QuizConfig> | null>(null);

  const userName = personalConfig.preferredName || personalConfig.fullName || 'Zafer';
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

  // Proactive Silence Check-in: Checks if user has been silent for 85-90 seconds during active session
  useEffect(() => {
    if (assistantConfig.proactiveIdleCheckin === false) return;

    const idleInterval = setInterval(() => {
      const isIdle = Date.now() - lastUserActivityRef.current >= 90000; // 90 seconds
      if (
        isIdle &&
        !hasTriggeredIdleCheckinRef.current &&
        status === 'READY' &&
        !isListeningModeRef.current
      ) {
        hasTriggeredIdleCheckinRef.current = true;
        const currentLang = lastSpokenLanguageRef.current || currentLanguage;
        const checkinPrompt = (currentLang === 'hi')
          ? "Hey, aap itni der se shant ho gaye—sab theek hai na, ya kisi cheez mein madad chahiye?"
          : "Hey, why did you go quiet? Anything I can help with?";

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
        console.log('[MAYRA Assistant] Proactive silence check-in triggered in language:', currentLang);
      }
    }, 10000);

    return () => clearInterval(idleInterval);
  }, [assistantConfig.proactiveIdleCheckin, status, currentLanguage]);

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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const activeVoice = assistantConfig.mayraVoice || assistantConfig.voiceProfile || 'Aoede';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws?voiceName=${encodeURIComponent(activeVoice)}`;
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
    console.log(`[MAYRA_MULTIMODAL_CLIENT_DEBUG] Pre-flight Check:`, {
      hasImageAttachment: Boolean(image && image.base64),
      attachmentName: image?.name || (image ? 'unnamed' : 'none'),
      mimeType: image?.mimeType || 'none',
      base64Length: image?.base64 ? image.base64.length : 0,
      base64Preview: image?.base64 ? `${image.base64.slice(0, 40)}...` : 'none',
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
    const isDoc = image?.mimeType?.includes('pdf') || 
                  image?.mimeType?.includes('document') || 
                  image?.mimeType?.includes('text') || 
                  image?.mimeType?.includes('csv') || 
                  image?.name?.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: trimmed || (image ? (isDoc ? `Attached document: ${image.name || 'document'}` : 'Uploaded image') : ''),
      image: image ? { base64: image.base64, mimeType: image.mimeType, name: image.name } : undefined,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setStatus('THINKING');
    activeModelMsgIdRef.current = null;

    const lower = (trimmed || '').toLowerCase();

    // 0.0 INTERACTIVE QUIZ TRIGGER WITH MISSING DETAILS PROMPT FLOW (GOOGLE AI MODE STYLE)
    if (!image && trimmed) {
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
        ? `हाँ Zafer भाई, बिल्कुल! मल्टी-एजेंट स्वार्म को तैनात कर रही हूँ—${plan.activeAgents.length} एजेंट्स एक साथ समानांतर में जुट रहे हैं!`
        : `Right away, Zafer! Deploying Multi-Agent Swarm with ${plan.activeAgents.length} specialized agents in parallel!`;

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
        ? 'हाँ भाई, बिल्कुल! मैं यह काम अभी स्टेप-बाय-स्टेप पूरा कर रही हूँ।'
        : 'Right away, Zafer! Executing autonomous task loop now.';
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
        ? 'हाँ भाई, बिल्कुल! मैं इस कार्य पर तुरंत लग रही हूँ।'
        : 'Right away, Zafer! Executing action now.';
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

    const hasImagePayload = Boolean(image && image.base64);
    console.log(`[MAYRA_CLIENT_SEND_DISPATCH] Dispatching turn:`, {
      channel: (ws && ws.readyState === WebSocket.OPEN) ? 'WebSocket (/api/live-ws)' : 'HTTP (/api/chat)',
      text: trimmed,
      hasMemoryContext: Boolean(memoryContext),
      historyLength: recentHistory.length,
      hasImageAttachment: hasImagePayload,
      mimeType: image?.mimeType || 'none',
      base64Length: image?.base64 ? image.base64.length : 0,
      imageName: image?.name || 'none'
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: trimmed, image, contextPrompt: memoryContext, history: recentHistory }));
      console.log(`[LIVE_TEXT_SENT] Dispatched text, history & image to /api/live-ws`);
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      ws.addEventListener('open', () => {
        try {
          ws.send(JSON.stringify({ text: trimmed, image, contextPrompt: memoryContext, history: recentHistory }));
          console.log(`[LIVE_TEXT_SENT] Dispatched queued text, history & image on WebSocket OPEN`);
        } catch (err) {
          console.warn('[LIVE_TEXT_SEND_ERROR]', err);
        }
      }, { once: true });
    } else {
      // Fallback via /api/chat if WebSocket is unavailable (with multi-turn history & sentence-level TTS streaming)
      try {
        console.log('[LIVE_WS_STATE] Fallback to /api/chat');
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history: recentHistory,
            image,
            contextPrompt: memoryContext,
            persona: assistantConfig.personaTone,
            model: personalConfig.geminiModel || 'gemini-3.1-flash-lite',
            temperature: personalConfig.temperature ?? 0.7,
            userName: personalConfig.preferredName || personalConfig.fullName,
            language: detected,
            assistant: 'mayra',
            voiceName: assistantConfig.mayraVoice || assistantConfig.voiceProfile || 'Aoede',
            returnAudio: true,
            stream: true
          })
        });

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
                  } else if (ev.type === 'sentence' && ev.audio) {
                    receivedAnyAudio = true;
                    schedulePcm24kChunk(ev.audio, handleSpeechStart, handleSpeechEnd);
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
          return;
        }

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
        const reply = data.response || 'Routine executed.';
        const assistantMsg: ChatMessage = {
          id: `msg-m-${Date.now() + 1}`,
          sender: 'mayra',
          text: reply,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        MemorySyncBridge.getInstance().syncConversationTurn('MAYRA', trimmed, reply).catch(() => {});
        if (data.audioBase64) {
          schedulePcm24kChunk(
            data.audioBase64,
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
      } catch (e) {
        console.warn('Fallback error:', e);
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
      stopPcm16kCapture();
      flushQueuedAudio();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
      setStatus('READY');
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: OFF -> READY');
    } else {
      // Play custom activation sound strictly ONCE on explicit physical user mic click
      playCustomActivationSound();
      // Interrupt any current speech before listening
      flushQueuedAudio();
      // Turn Continuous Listening ON
      setIsListeningMode(true);
      isListeningModeRef.current = true;
      setStatus('LISTENING');
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: ON -> LISTENING');

      // Start continuous turn detection & VAD barge-in loop
      await continuousEngineRef.current?.startContinuousMode();

      // Connect WebSocket and start continuous raw 16kHz PCM stream
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
  }, [getOrConnectLiveWs, status]);

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
    dismissProactiveAlert: () => setActiveProactiveAlert(null)
  };
}
