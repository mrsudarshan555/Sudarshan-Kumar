/**
 * Voice Output & Speech Synthesis Engine (Ported from backtalk-main mouth.py)
 * 
 * Features:
 * - Plays Charon Deep Voice / Gemini TTS / Web Speech API
 * - Automatically triggers Audio Ducking on speech start
 * - Restores Audio Ducking on speech completion
 * - Dispatches onSpeechStart & onSpeechEnd lifecycle hooks
 */

import { AudioDuckingManager } from './audioDuckingManager';
import { playPcmAudio, stopCurrentSpeech } from '../../utils/speechEngine';
import { OfflineVoiceMatcher } from './offlineVoiceMatcher';

export interface MouthSpeakOptions {
  voice?: string;
  persona?: 'MAYRA' | 'STONICX';
  language?: 'en' | 'hi';
  onStart?: () => void;
  onEnd?: () => void;
}

export class Mouth {
  private static instance: Mouth | null = null;
  private isSpeaking: boolean = false;

  private constructor() {}

  public static getInstance(): Mouth {
    if (!this.instance) {
      this.instance = new Mouth();
    }
    return this.instance;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Speaks text using Charon/Aoede Gemini TTS when online, or high-fidelity Offline Persona Voice Matching
   */
  public async speak(text: string, options: MouthSpeakOptions = {}): Promise<boolean> {
    if (!text || typeof window === 'undefined') return false;

    const ducking = AudioDuckingManager.getInstance();
    
    // Stop any currently playing speech
    this.stop();

    this.isSpeaking = true;
    ducking.duck({ duckGain: 0.20, rampDownTimeSec: 0.15 });

    // Sync signal bus for AI-Visualizer faces
    fetch('/api/voice/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'speaking', level: 0.85 })
    }).catch(() => {});

    if (options.onStart) {
      options.onStart();
    }

    let activeMode = 'mayra';
    try {
      const savedConfig = localStorage.getItem('mayra_assistant_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.activeMode) activeMode = parsed.activeMode;
      }
    } catch (e) {}

    const persona = options.persona || (activeMode === 'stonicx' ? 'STONICX' : 'MAYRA');
    const voiceName = options.voice || (persona === 'STONICX' ? 'Charon' : 'Aoede');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

    const handleSpeechEnd = () => {
      this.isSpeaking = false;
      ducking.restore({ rampUpTimeSec: 0.30 });
      fetch('/api/voice/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'idle', level: 0 })
      }).catch(() => {});
      if (options.onEnd) {
        options.onEnd();
      }
    };

    // 1. Primary: Server-side Gemini Live TTS (Charon for STONICX, Aoede for MAYRA) when online
    if (isOnline) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName,
            assistant: persona.toLowerCase(),
            language: options.language || 'en'
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const played = playPcmAudio(
              data.audioBase64,
              () => {},
              handleSpeechEnd
            );
            if (played) return true;
          }
        }
      } catch (e) {
        console.warn(`[Mouth Engine] Direct TTS service unreachable for ${persona}: staying silent without browser voice fallback.`);
      }
    }

    // Explicit User Rule: Do NOT fall back to robotic browser speechSynthesis on failure. Stay silent.
    handleSpeechEnd();
    return false;
  }

  public stop(): void {
    this.isSpeaking = false;
    stopCurrentSpeech();
    OfflineVoiceMatcher.stop();
    AudioDuckingManager.getInstance().restore({ rampUpTimeSec: 0.20 });
    fetch('/api/voice/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'idle', level: 0 })
    }).catch(() => {});
  }
}
