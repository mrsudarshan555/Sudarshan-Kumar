/**
 * Echo Guard Service
 * 
 * Prevents MAYRA from listening to her own speaker output.
 * When MAYRA enters the SPEAKING state, Echo Guard automatically silences/mutes
 * the microphone stream and pauses speech recognition.
 * As soon as speech finishes, the microphone is automatically re-activated
 * after an acoustic clearance buffer (250ms).
 */

export interface EchoGuardState {
  isActive: boolean;
  isGuarded: boolean;
  reason: 'speaking' | 'playback' | 'idle';
  lastGuardedAt: number;
}

export class EchoGuardService {
  private static instance: EchoGuardService | null = null;
  private isEnabled: boolean = true;
  private isGuarded: boolean = false;
  private activeStreams: Set<MediaStream> = new Set();
  private recognitionInstance: any = null;
  private subscribers: Set<(state: EchoGuardState) => void> = new Set();
  private clearTimer: any = null;

  private constructor() {
    // Read user preference
    const saved = localStorage.getItem('mayra_echo_guard_enabled');
    if (saved !== null) {
      this.isEnabled = saved === 'true';
    }
  }

  public static getInstance(): EchoGuardService {
    if (!this.instance) {
      this.instance = new EchoGuardService();
    }
    return this.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('mayra_echo_guard_enabled', String(enabled));
    if (!enabled && this.isGuarded) {
      this.disarm();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getIsGuarded(): boolean {
    return this.isGuarded;
  }

  /**
   * Register an active microphone MediaStream so its audio tracks can be muted during speech
   */
  public registerStream(stream: MediaStream): () => void {
    this.activeStreams.add(stream);
    return () => {
      this.activeStreams.delete(stream);
    };
  }

  /**
   * Register the active SpeechRecognition instance to pause during speech
   */
  public registerRecognition(recognition: any): void {
    this.recognitionInstance = recognition;
  }

  /**
   * Arm Echo Guard: Called when MAYRA starts speaking
   */
  public arm(reason: 'speaking' | 'playback' = 'speaking'): void {
    if (!this.isEnabled) return;
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    if (!this.isGuarded) {
      this.isGuarded = true;
      console.log(`[EchoGuard] 🛡️ Guard ARM: Mic muted to prevent acoustic feedback (${reason})`);

      // Mute all registered stream tracks
      this.activeStreams.forEach(stream => {
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      });

      // Pause speech recognition if active
      if (this.recognitionInstance) {
        try {
          this.recognitionInstance.abort?.();
        } catch {}
      }

      this.notifySubscribers(reason);
    }
  }

  /**
   * Disarm Echo Guard: Called when MAYRA finishes speaking
   * Uses a 250ms acoustic dissipation buffer
   */
  public disarm(bufferMs: number = 250): void {
    if (!this.isEnabled) return;
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }

    this.clearTimer = setTimeout(() => {
      this.isGuarded = false;
      console.log('[EchoGuard] 🎙️ Guard DISARM: Mic unmuted, ready for user input');

      // Unmute all registered stream tracks
      this.activeStreams.forEach(stream => {
        stream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      });

      this.notifySubscribers('idle');
      this.clearTimer = null;
    }, bufferMs);
  }

  public subscribe(listener: (state: EchoGuardState) => void): () => void {
    this.subscribers.add(listener);
    listener({
      isActive: this.isEnabled,
      isGuarded: this.isGuarded,
      reason: this.isGuarded ? 'speaking' : 'idle',
      lastGuardedAt: Date.now()
    });
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notifySubscribers(reason: 'speaking' | 'playback' | 'idle'): void {
    const state: EchoGuardState = {
      isActive: this.isEnabled,
      isGuarded: this.isGuarded,
      reason,
      lastGuardedAt: Date.now()
    };
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch {}
    });
  }
}
