import { useState, useRef, useEffect, useCallback } from 'react';
import { AssistantStatus } from '../types';
import { MayraNativeBridgeClient } from '../services/bridge/MayraNativeBridgeClient';

interface UseMayraWakeWordProps {
  onWakeWordDetected?: (transcript?: string) => void;
  onSpeechCaptured?: (transcript: string) => void;
  status: AssistantStatus;
  isListeningMode?: boolean;
  enabled?: boolean;
}

/**
 * High-sensitivity Wake-Word & Keyword matching patterns for Mayra & StonicX
 * Supports English, Hinglish, and Hindi (Devanagari)
 */
const WAKE_WORD_PATTERNS: RegExp[] = [
  // Roman / Hinglish / English prefixes
  /\b(?:hey|hi|hello|ok|okay|oy|oye|listen|sun)\s+(?:mayra|myra|mira|meyra|maira|maera)\b/i,
  /\b(?:hey|hi|hello|ok|okay)\s+(?:stonicx|stonix|stonik|stonicks)\b/i,
  /\b(?:mayra|myra|mira|meyra|maira|maera)\s+(?:wake\s*up|utho|jago|sun|listen|help|ji)\b/i,
  /\b(?:mayra|myra|mira|meyra|maira)\b/i,
  /\b(?:stonicx|stonix)\b/i,
  // Hindi (Devanagari)
  /(?:हे|हाय|हेलो|ओके|सुनो|नमस्ते)\s*(?:मायरा|माइरा|स्टोनिक्स)/i,
  /(?:मायरा|माइरा)\s*(?:सुनो|उठो|जागो|मदद|जी)/i,
  /(?:मायरा|माइरा|स्टोनिक्स)/i
];

/**
 * Synthesizes an instant dual-tone pleasant chime when Wake Word is spotted (Siri / Alexa style)
 */
function playWakeChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);

    // Auto-close context after chime ends
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 400);
  } catch (e) {
    // Graceful fallback if AudioContext is restricted
  }
}

/**
 * Extracts single-breath query if user says "Hey Mayra what's the weather"
 */
function parseWakeAndCommand(rawText: string): { isWake: boolean; command: string; matchedPhrase: string } {
  const text = (rawText || '').trim();
  if (!text) return { isWake: false, command: '', matchedPhrase: '' };

  for (const pattern of WAKE_WORD_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const matchedPhrase = match[0];
      const matchIndex = match.index;
      // Get text after wake word
      const trailingCommand = text.substring(matchIndex + matchedPhrase.length)
        .replace(/^[,!?:.\s-]+/, '')
        .trim();

      return {
        isWake: true,
        command: trailingCommand,
        matchedPhrase
      };
    }
  }

  return { isWake: false, command: '', matchedPhrase: '' };
}

/**
 * useMayraWakeWord:
 * Always-Listening 2-Meter Far-Field Background Wake Word Engine (Hey Siri / Ok Google style)
 * 
 * Pipeline:
 * 1. Primary Engine: Android Native On-Device Speech Recognizer (EXTRA_PREFER_OFFLINE).
 *    Works 100% offline without mobile data or Wi-Fi.
 * 2. Fallback Engine: Web Speech Recognition API with AGC for browser preview environments.
 * 3. Supports single-breath execution: "Hey Mayra weather kaisa hai" triggers command instantly.
 * 4. Dual-tone wake chime on trigger.
 */
export function useMayraWakeWord({
  onWakeWordDetected,
  onSpeechCaptured,
  status,
  isListeningMode = false,
  enabled = true
}: UseMayraWakeWordProps) {
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState<string | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(true);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isNativeOfflineActive, setIsNativeOfflineActive] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isRunningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);
  const statusRef = useRef<AssistantStatus>(status);
  statusRef.current = status;

  const callbacksRef = useRef({ onWakeWordDetected, onSpeechCaptured });
  callbacksRef.current = { onWakeWordDetected, onSpeechCaptured };

  const lastTriggerTimeRef = useRef<number>(0);

  // Far-field microphone stream pre-warming (unlocks high-gain AGC for browser fallback)
  const ensureMicrophoneAccess = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: true,    // Essential for 2-meter distant voice pickup
            echoCancellation: true,   // Prevents self-feedback
            noiseSuppression: true,   // Filters room background noise
            channelCount: 1
          }
        });
        setHasMicrophonePermission(true);
        // Keep the tracks alive briefly to establish permission
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
        }, 1000);
        return true;
      }
    } catch (err) {
      console.log('[WakeWord Far-Field] Mic permission check:', err);
    }
    return false;
  }, []);

  const handleWakeSpotting = useCallback((transcript: string, directCommand?: string) => {
    // Avoid double triggering within 2.5 seconds
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 2500) return;

    if (directCommand !== undefined) {
      // Direct trigger from native on-device offline recognition
      lastTriggerTimeRef.current = now;
      console.log('[Offline WakeWord Native] ✦ WAKE WORD TRIGGERED:', transcript, '| Command:', directCommand);
      setLastDetectedPhrase(transcript);
      playWakeChime();

      if (callbacksRef.current.onWakeWordDetected) {
        callbacksRef.current.onWakeWordDetected(directCommand);
      }
      return;
    }

    const parsed = parseWakeAndCommand(transcript);
    if (parsed.isWake) {
      lastTriggerTimeRef.current = now;
      console.log('[WakeWord Engine] ✦ WAKE WORD TRIGGERED:', parsed.matchedPhrase, '| Extracted Command:', parsed.command);

      setLastDetectedPhrase(parsed.matchedPhrase);
      playWakeChime();

      if (callbacksRef.current.onWakeWordDetected) {
        callbacksRef.current.onWakeWordDetected(parsed.command);
      }
    }
  }, []);

  // Web Speech Recognition Engine (Graceful Browser Preview Fallback)
  const startWebWakeWordEngine = useCallback(async () => {
    if (!enabled) return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    if (recognitionRef.current && isRunningRef.current) {
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = 'hi-IN'; // Multilingual / Hindi-English mixed recognizer

      recognition.onstart = () => {
        isRunningRef.current = true;
        setIsListeningForWakeWord(true);
        console.log('[WakeWord Engine] Web standby listening ACTIVE (Say "Hey Mayra" from 2m distance)');
      };

      recognition.onresult = (event: any) => {
        // If assistant is currently speaking, skip wake-word parsing
        if (statusRef.current === 'SPEAKING') {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';

          // Test all alternatives for maximum accuracy
          for (let a = 0; a < res.length; a++) {
            const altText = res[a]?.transcript;
            if (altText) {
              handleWakeSpotting(altText);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Silently handle normal background speech timeouts
        if (event.error === 'not-allowed') {
          setHasMicrophonePermission(false);
          setIsListeningForWakeWord(false);
          isRunningRef.current = false;
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.log('[WakeWord Engine] Passive info:', event.error);
        }
      };

      recognition.onend = () => {
        isRunningRef.current = false;
        setIsListeningForWakeWord(false);

        // Auto-restart continuous listening unless disabled or unmounted
        if (enabled && statusRef.current !== 'SPEAKING') {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (enabled) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore start collision
              }
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.log('[WakeWord Engine] Recognition init notice:', err);
    }
  }, [enabled, handleWakeSpotting]);

  const stopWebWakeWordEngine = useCallback(() => {
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    isRunningRef.current = false;
    setIsListeningForWakeWord(false);
  }, []);

  // Primary Start: Auto-routes to Native Android Offline Engine if available, or Web fallback
  const startWakeWordEngine = useCallback(async () => {
    if (!enabled) return;

    const isNative = await MayraNativeBridgeClient.isNativeWakeWordSupported();
    if (isNative) {
      console.log('[WakeWord Engine] ✦ Android Native On-Device Offline Engine detected — Starting Foreground Wake Service');
      const started = await MayraNativeBridgeClient.startOfflineWakeWord(true);
      if (started) {
        setIsNativeOfflineActive(true);
        setIsListeningForWakeWord(true);
        isRunningRef.current = true;
        return;
      }
    }

    // Fallback to Web Speech Recognition engine
    setIsNativeOfflineActive(false);
    startWebWakeWordEngine();
  }, [enabled, startWebWakeWordEngine]);

  const stopWakeWordEngine = useCallback(() => {
    if (isNativeOfflineActive) {
      MayraNativeBridgeClient.stopOfflineWakeWord();
      setIsNativeOfflineActive(false);
    }
    stopWebWakeWordEngine();
    isRunningRef.current = false;
    setIsListeningForWakeWord(false);
  }, [isNativeOfflineActive, stopWebWakeWordEngine]);

  // Hook Native Android Wake Word event listener
  useEffect(() => {
    const unsubscribe = MayraNativeBridgeClient.onNativeWakeWord(({ phrase, command }) => {
      handleWakeSpotting(phrase, command);
    });

    return () => {
      unsubscribe();
    };
  }, [handleWakeSpotting]);

  // Lifecycle control
  useEffect(() => {
    if (!enabled) {
      stopWakeWordEngine();
      return;
    }

    // Attempt start
    startWakeWordEngine();

    // Unlock far-field audio on first click or touch
    const handleFirstGesture = () => {
      ensureMicrophoneAccess();
      startWakeWordEngine();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      stopWakeWordEngine();
    };
  }, [enabled, startWakeWordEngine, stopWakeWordEngine, ensureMicrophoneAccess]);

  // Pause background recognition when Mayra/StonicX is speaking so they don't hear themselves
  useEffect(() => {
    if (status === 'SPEAKING') {
      if (isNativeOfflineActive) {
        MayraNativeBridgeClient.pauseOfflineWakeWord();
      }
      if (recognitionRef.current && isRunningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else if (status === 'READY') {
      if (enabled) {
        if (isNativeOfflineActive) {
          MayraNativeBridgeClient.resumeOfflineWakeWord();
        } else if (!isRunningRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            startWakeWordEngine();
          }, 400);
        }
      }
    }
  }, [status, enabled, isNativeOfflineActive, startWakeWordEngine]);

  return {
    isListeningForWakeWord,
    lastDetectedPhrase,
    hasMicrophonePermission,
    isSupported,
    isNativeOfflineActive,
    startListening: startWakeWordEngine,
    stopListening: stopWakeWordEngine
  };
}

