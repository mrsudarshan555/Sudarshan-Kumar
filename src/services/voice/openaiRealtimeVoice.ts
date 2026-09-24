/**
 * MAYRA OpenAI Realtime voice transport.
 *
 * Security boundary: the browser/Android WebView never receives the standard
 * OpenAI API key. The application must request a short-lived client secret
 * from the trusted MAYRA server, then use that secret for the realtime
 * WebRTC session.
 *
 * This module intentionally does not replace the existing Gemini voice path.
 */

export type OpenAIRealtimeVoiceOptions = {
  sessionUrl?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onState?: (state: RTCPeerConnectionState) => void;
};

export class OpenAIRealtimeVoice {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sessionUrl: string;

  constructor(options: OpenAIRealtimeVoiceOptions = {}) {
    this.sessionUrl = options.sessionUrl || '/api/voice/openai-realtime/session';
    this.onRemoteStream = options.onRemoteStream;
    this.onState = options.onState;
  }

  private onRemoteStream?: OpenAIRealtimeVoiceOptions['onRemoteStream'];
  private onState?: OpenAIRealtimeVoiceOptions['onState'];

  async connect(): Promise<void> {
    if (this.pc) return;

    this.pc = new RTCPeerConnection();
    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.onState?.(this.pc.connectionState);
    };

    this.pc.ontrack = (event) => {
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
    };

    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of this.localStream.getAudioTracks()) {
      this.pc.addTrack(track, this.localStream);
    }

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const response = await fetch(this.sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp || ''
    });

    if (!response.ok) {
      throw new Error(`OpenAI Realtime session failed: HTTP ${response.status}`);
    }

    const answerSdp = await response.text();
    await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  }

  disconnect(): void {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.remove();
      this.audioElement = null;
    }
  }
}
