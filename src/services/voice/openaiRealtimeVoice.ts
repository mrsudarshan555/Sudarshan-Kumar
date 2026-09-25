/**
 * MAYRA OpenAI Realtime WebRTC transport.
 * The API key remains server-side; this client receives only a SDP answer.
 */
export type OpenAILiveVoiceOptions = {
  sessionUrl?: string;
  voice?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onState?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
  onEvent?: (event: any) => void;
  onUserTranscript?: (text: string) => void;
};

export class OpenAILiveVoice {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sessionUrl: string;
  private voice: string;
  private onRemoteStream?: OpenAILiveVoiceOptions['onRemoteStream'];
  private onState?: OpenAILiveVoiceOptions['onState'];
  private onError?: OpenAILiveVoiceOptions['onError'];
  private onEvent?: OpenAILiveVoiceOptions['onEvent'];
  private onUserTranscript?: OpenAILiveVoiceOptions['onUserTranscript'];
  private dataChannel: RTCDataChannel | null = null;
  private reconnecting = false;
  private stopped = false;

  constructor(options: OpenAILiveVoiceOptions = {}) {
    this.sessionUrl = options.sessionUrl || '/api/voice/openai-live/session';
    this.voice = options.voice || 'marin';
    this.onRemoteStream = options.onRemoteStream;
    this.onState = options.onState;
    this.onError = options.onError;
    this.onEvent = options.onEvent;
    this.onUserTranscript = options.onUserTranscript;
  }

  async connect(): Promise<void> {
    this.stopped = false;
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
        void this.audioElement.play().catch(() => undefined);
      };
      this.dataChannel = pc.createDataChannel('oai-events');
      this.dataChannel.addEventListener('message', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.onEvent?.(parsed);
          const type = typeof parsed?.type === 'string' ? parsed.type : '';
          if (
            type === 'conversation.item.input_audio_transcription.completed' &&
            typeof parsed?.transcript === 'string'
          ) {
            this.onUserTranscript?.(parsed.transcript);
          }
          if (type === 'error') {
            const code = String(parsed?.error?.code || '').toLowerCase();
            if (code.includes('expired') || code.includes('session')) {
              void this.reconnect();
            }
          }
        } catch { /* ignore non-JSON events */ }
      });
      this.localStream = await navigator.mediaDevices.getUserMedia({audio:true});
      for (const track of this.localStream.getAudioTracks()) pc.addTrack(track, this.localStream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);
      let response: Response;
      try {
        response = await fetch(this.sessionUrl, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({sdp:offer.sdp || '',voice:this.voice}),
          signal: controller.signal
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
      if (!response.ok) throw new Error(`OpenAI Realtime session failed: HTTP ${response.status}`);
      const data = await response.json() as {sdp?:string};
      if (!data.sdp) throw new Error('OpenAI Realtime session returned no SDP answer');
      await pc.setRemoteDescription({type:'answer',sdp:data.sdp});
    } catch (e) {
      this.disconnect();
      const err = e instanceof Error ? e : new Error(String(e));
      this.onError?.(err);
      throw err;
    }
  }

  interrupt(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.dataChannel?.readyState === 'open') {
      try { this.dataChannel.send(JSON.stringify({ type: 'response.cancel' })); } catch { /* ignore */ }
    }
  }

  async reconnect(): Promise<void> {
    if (this.stopped || this.reconnecting) return;
    this.reconnecting = true;
    try {
      this.disconnect();
      for (let attempt = 1; attempt <= 2 && !this.stopped; attempt += 1) {
        try {
          await this.connect();
          return;
        } catch (error) {
          this.onError?.(error instanceof Error ? error : new Error(String(error)));
          if (attempt < 2) {
            await new Promise(resolve => window.setTimeout(resolve, 500 * attempt));
          }
        }
      }
    } finally {
      this.reconnecting = false;
    }
  }

  disconnect(): void {
    this.stopped = true;
    this.localStream?.getTracks().forEach(t=>t.stop());
    this.localStream = null;
    this.dataChannel?.close();
    this.dataChannel = null;
    this.pc?.close();
    this.pc = null;
    if (this.audioElement) { this.audioElement.srcObject=null; this.audioElement.remove(); this.audioElement=null; }
  }
}
