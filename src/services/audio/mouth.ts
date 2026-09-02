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
  voice?: 'Charon' | 'Aoede' | 'Fenrir' | 'Puck' | 'Kore';
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

    if (options.onStart) {
      options.onStart();
    }

    const persona = options.persona || 'STONICX';
    const voiceName = options.voice || (persona === 'STONICX' ? 'Charon' : 'Aoede');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

    const handleSpeechEnd = () => {
      this.isSpeaking = false;
      ducking.restore({ rampUpTimeSec: 0.30 });
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
        console.warn(`[Mouth Engine] Direct TTS service unreachable, engaging calibrated on-device ${persona} voice match.`);
      }
    }

    // 2. Secondary: Persona-matched On-Device Voice (Soft/Warm Female for MAYRA, Deep Baritone for STONICX)
    const spoke = OfflineVoiceMatcher.speakOffline(text, {
      persona,
      language: options.language || 'en',
      onStart: () => {},
      onEnd: handleSpeechEnd
    });

    if (spoke) return true;

    handleSpeechEnd();
    return false;
  }

  public stop(): void {
    this.isSpeaking = false;
    stopCurrentSpeech();
    OfflineVoiceMatcher.stop();
    AudioDuckingManager.getInstance().restore({ rampUpTimeSec: 0.20 });
  }
}
