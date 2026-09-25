/**
 * MAYRA GPT-Live-1 WebRTC transport.
 * The OpenAI API key remains server-side; this client receives only the Live session SDP.
 */
export type OpenAILiveVoiceOptions = {
  sessionUrl?: string;
  voice?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onState?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
  onReconnectFailed?: (error: Error) => void;
  onEvent?: (event: any) => void;
  onUserTranscript?: (text: string) => void;
};

export class OpenAILiveVoice {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sessionUrl: string;
  private voice: string;
  private onRemoteStream?: OpenAILiveVoiceOptions['onRemoteStream'];
  private onState?: OpenAILiveVoiceOptions['onState'];
  private onError?: OpenAILiveVoiceOptions['onError'];
  private onReconnectFailed?: OpenAILiveVoiceOptions['onReconnectFailed'];
  private onEvent?: OpenAILiveVoiceOptions['onEvent'];
  private onUserTranscript?: OpenAILiveVoiceOptions['onUserTranscript'];
  private reconnecting = false;
  private stopped = false;
  private sessionStarted = false;
  private inputTranscriptBuffer = '';

  constructor(options: OpenAILiveVoiceOptions = {}) {
    this.sessionUrl = options.sessionUrl || '/api/voice/openai-live/session';
    this.voice = options.voice || 'willow';
    this.onRemoteStream = options.onRemoteStream;
    this.onState = options.onState;
    this.onError = options.onError;
    this.onReconnectFailed = options.onReconnectFailed;
    this.onEvent = options.onEvent;
    this.onUserTranscript = options.onUserTranscript;
  }

  async connect(): Promise<void> {
    this.stopped = false;
    this.sessionStarted = false;
    this.inputTranscriptBuffer = '';
    if (this.pc) return;

    try {
      const pc = new RTCPeerConnection();
      this.pc = pc;

      pc.onconnectionstatechange = () => {
        this.onState?.(pc.connectionState);
        if (
          (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') &&
          !this.stopped &&
          !this.reconnecting
        ) {
          void this.reconnect();
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        this.onRemoteStream?.(stream);

        if (!this.audioElement) {
          this.audioElement = document.createElement('audio');
          this.audioElement.autoplay = true;
          this.audioElement.setAttribute('playsinline', 'true');
          this.audioElement.style.display = 'none';
          document.body.appendChild(this.audioElement);
        }

        this.audioElement.srcObject = stream;
        void this.audioElement.play().catch((error) => this.onError?.(
          error instanceof Error ? error : new Error(String(error))
        ));
      };

      // GPT-Live uses the data channel for JSON events and the negotiated
      // WebRTC media track for microphone input and generated speech.
      this.dataChannel = pc.createDataChannel('oai-events');
      this.dataChannel.addEventListener('message', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const type = typeof parsed?.type === 'string' ? parsed.type : '';
          this.onEvent?.(parsed);

          if (type === 'session.started') {
            this.sessionStarted = true;
            this.onState?.('connected');
          }

          if (type === 'session.input_transcript.delta' && typeof parsed?.delta === 'string') {
            this.inputTranscriptBuffer = (this.inputTranscriptBuffer + parsed.delta).slice(-160);
            this.onUserTranscript?.(this.inputTranscriptBuffer);
          }

          if (type === 'session.output_transcript.delta' && typeof parsed?.delta === 'string') {
            this.onState?.('connected');
          }

          if (type === 'session.closed') {
            this.sessionStarted = false;
            const reason = String(parsed?.reason || '').toLowerCase();
            if (!this.stopped && (reason === 'expired' || reason === 'connection_lost' || reason === 'remote_hangup')) {
              void this.reconnect();
            }
          }

          if (type === 'error') {
            const message = String(parsed?.error?.message || 'GPT-Live session error');
            const err = new Error(message);
            this.onError?.(err);
            const code = String(parsed?.error?.code || '').toLowerCase();
            if (!this.stopped && (code.includes('expired') || code.includes('session') || code.includes('connection'))) {
              void this.reconnect();
            }
          }
        } catch {
          // Ignore non-JSON data-channel messages.
        }
      });

      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = media;
      for (const track of media.getAudioTracks()) {
        pc.addTrack(track, media);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch(this.sessionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sdp: offer.sdp || '', voice: this.voice }),
          signal: controller.signal
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`GPT-Live session failed: HTTP ${response.status}`);
      }

      const data = await response.json() as {
        session?: { id?: string };
        transport?: { type?: string; sdp?: string };
      };

      if (data.transport?.type !== 'webrtc' || !data.transport.sdp) {
        throw new Error('GPT-Live session returned no WebRTC SDP answer');
      }

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: data.transport.sdp
      });
    } catch (error) {
      this.disconnect(!this.reconnecting);
      const err = error instanceof Error ? error : new Error(String(error));
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Local immediate stop for MAYRA's current playback.
   * GPT-Live is full-duplex and handles spoken barge-in at the model/session
   * level; WebRTC also owns the output audio buffer, so stopping the media
   * element prevents stale audio from continuing locally.
   */
  interrupt(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  async reconnect(): Promise<void> {
    if (this.stopped || this.reconnecting) return;
    this.reconnecting = true;

    try {
      this.disconnect(false);
      this.stopped = false;

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 2 && !this.stopped; attempt += 1) {
        try {
          await this.connect();
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          this.onError?.(lastError);
          if (attempt < 2) {
            await new Promise(resolve => window.setTimeout(resolve, 500 * attempt));
          }
        }
      }

      if (lastError) this.onReconnectFailed?.(lastError);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onReconnectFailed?.(err);
    } finally {
      this.reconnecting = false;
    }
  }

  disconnect(stopPermanently = true): void {
    if (stopPermanently) this.stopped = true;
    this.sessionStarted = false;
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.dataChannel?.close();
    this.dataChannel = null;
    this.pc?.close();
    this.pc = null;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      this.audioElement.remove();
      this.audioElement = null;
    }
  }
}
