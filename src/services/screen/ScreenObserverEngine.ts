/**
 * ScreenObserverEngine.ts
 * Continuous Real-Time Screen Observation & Activity Timeline Engine (Gemini Astra / Live Screen Share style)
 * 
 * Capabilities:
 * 1. Instant 20ms Frame Capture from live video stream (Auto-attaches to voice & text queries).
 * 2. Continuous Active Watcher (Astra Mode): Periodically watches the screen, detects changes,
 *    and logs what the user clicked, what apps were opened, and what notifications appeared.
 * 3. Screen Timeline Memory: Allows Mayra to answer "Maine kya click kiya?", "Kiska message aaya?",
 *    "Main abhi kya kar raha hoon?", "Is setting me aage kya karu?".
 */

export interface ScreenObservationEvent {
  id: string;
  timestamp: number;
  timeString: string;
  actionSummary: string;
  appName?: string;
  notificationText?: string;
}

export class ScreenObserverEngine {
  private static instance: ScreenObserverEngine | null = null;
  private currentStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isWatcherActive: boolean = false;
  private watcherIntervalId: any = null;
  private timeline: ScreenObservationEvent[] = [];
  private listeners: Set<(events: ScreenObservationEvent[]) => void> = new Set();
  private isAnalyzingDelta: boolean = false;
  private lastCapturedHash: number = 0;

  private constructor() {}

  public static getInstance(): ScreenObserverEngine {
    if (!ScreenObserverEngine.instance) {
      ScreenObserverEngine.instance = new ScreenObserverEngine();
    }
    return ScreenObserverEngine.instance;
  }

  /**
   * Registers the active screen media stream and video playback element
   */
  public registerStream(stream: MediaStream | null, videoEl: HTMLVideoElement | null) {
    this.currentStream = stream;
    this.videoElement = videoEl;

    if (!stream) {
      this.stopWatcher();
      this.timeline = [];
      this.notifyListeners();
    } else {
      // Record initial start event
      this.addObservation({
        actionSummary: 'Screen sharing session initiated.',
        appName: 'System'
      });
    }
  }

  public isSharing(): boolean {
    return Boolean(this.currentStream && this.currentStream.active);
  }

  public isWatching(): boolean {
    return this.isWatcherActive;
  }

  /**
   * Instantly grabs the current live screen frame as a JPEG base64 string
   */
  public captureCurrentFrame(): { base64: string; mimeType: string; name: string } | null {
    if (!this.videoElement || !this.currentStream || !this.currentStream.active) {
      return null;
    }

    try {
      const video = this.videoElement;
      if (video.videoWidth === 0 || video.videoHeight === 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);

      return {
        base64,
        mimeType: 'image/jpeg',
        name: `Screen_Live_${Date.now()}.jpg`
      };
    } catch (err) {
      console.warn('[ScreenObserverEngine] Frame capture error:', err);
      return null;
    }
  }

  /**
   * Starts continuous background screen observation (Astra Mode)
   */
  public startWatcher(intervalMs: number = 5000) {
    if (this.isWatcherActive) return;
    this.isWatcherActive = true;

    // Do an immediate observation
    this.evaluateScreenDelta();

    this.watcherIntervalId = setInterval(() => {
      this.evaluateScreenDelta();
    }, intervalMs);

    console.log('[ScreenObserverEngine] Continuous Astra Screen Watcher ACTIVATED');
  }

  public stopWatcher() {
    this.isWatcherActive = false;
    if (this.watcherIntervalId) {
      clearInterval(this.watcherIntervalId);
      this.watcherIntervalId = null;
    }
    console.log('[ScreenObserverEngine] Continuous Screen Watcher STOPPED');
  }

  /**
   * Periodically checks if the screen content has changed significantly, and logs it
   */
  private async evaluateScreenDelta() {
    if (!this.videoElement || !this.currentStream || !this.currentStream.active || this.isAnalyzingDelta) {
      return;
    }

    try {
      const frame = this.captureCurrentFrame();
      if (!frame) return;

      // Simple hash check of 64 sample points to prevent redundant calls on static screen
      const quickHash = this.computeQuickHash();
      if (quickHash === this.lastCapturedHash) {
        return; // Screen hasn't changed
      }
      this.lastCapturedHash = quickHash;

      this.isAnalyzingDelta = true;

      // Request fast lightweight observation from server
      const res = await fetch('/api/vision/observe-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { base64: frame.base64, mimeType: frame.mimeType },
          recentHistory: this.timeline.slice(-3).map(e => e.actionSummary)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.actionSummary && data.isSignificant) {
          this.addObservation({
            actionSummary: data.actionSummary,
            appName: data.appName || 'Active Window',
            notificationText: data.notificationText
          });
        }
      }
    } catch (e) {
      // Non-blocking observation error
    } finally {
      this.isAnalyzingDelta = false;
    }
  }

  private computeQuickHash(): number {
    if (!this.videoElement) return 0;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.drawImage(this.videoElement, 0, 0, 16, 16);
      const imgData = ctx.getImageData(0, 0, 16, 16).data;
      let hash = 0;
      for (let i = 0; i < imgData.length; i += 8) {
        hash = ((hash << 5) - hash) + imgData[i];
        hash |= 0;
      }
      return hash;
    } catch {
      return Math.random();
    }
  }

  public addObservation(item: { actionSummary: string; appName?: string; notificationText?: string }) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newEvent: ScreenObservationEvent = {
      id: `screen-obs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      timeString,
      actionSummary: item.actionSummary,
      appName: item.appName,
      notificationText: item.notificationText
    };

    // Keep last 15 actions
    this.timeline = [...this.timeline.slice(-14), newEvent];
    this.notifyListeners();
  }

  public getTimeline(): ScreenObservationEvent[] {
    return [...this.timeline];
  }

  /**
   * Generates a concise context block for Mayra's prompt
   */
  public getScreenContextPrompt(): string {
    if (!this.isSharing() && this.timeline.length === 0) {
      return '';
    }

    const lines = this.timeline.map(e => `[${e.timeString}] ${e.actionSummary}`);
    return `
============================================================
CONTINUOUS SCREEN SHARE OBSERVATION STREAM (ACTIVE):
============================================================
The user is actively sharing their device/computer screen with you.
Here is the live observation timeline of what the user has done, clicked, or viewed on screen:
${lines.length > 0 ? lines.join('\n') : 'Screen share just started. Screen is active.'}

DIRECTIVES FOR SCREEN QUERIES:
- If the user asks what they clicked, what they are doing, what message/notification arrived, or what is on screen, directly use this timeline and the attached live screen image.
- Address the user warmly as "भाई" (Zafer भाई) and guide them step-by-step through their screen/settings.
`;
  }

  public subscribe(listener: (events: ScreenObservationEvent[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.timeline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => {
      try { l(this.timeline); } catch (e) {}
    });
  }
}
