/**
 * MAYRA GPT-Live-1 WebRTC transport.
 * The API key remains server-side; this client receives only a SDP answer.
 */
export type OpenAILiveVoiceOptions = {
  sessionUrl?: string;
  voice?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onState?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
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

  constructor(options: OpenAILiveVoiceOptions = {}) {
    this.sessionUrl = options.sessionUrl || '/api/voice/openai-live/session';
    this.voice = options.voice || 'willow';
    this.onRemoteStream = options.onRemoteStream;
    this.onState = options.onState;
    this.onError = options.onError;
  }

  async connect(): Promise<void> {
    if (this.pc) return;
    try {
      const pc = new RTCPeerConnection();
      this.pc = pc;
      pc.onconnectionstatechange = () => this.onState?.(pc.connectionState);
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
      this.localStream = await navigator.mediaDevices.getUserMedia({audio:true});
      for (const track of this.localStream.getAudioTracks()) pc.addTrack(track, this.localStream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch(this.sessionUrl, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp || '',voice:this.voice})});
      if (!response.ok) throw new Error(`GPT-Live session failed: HTTP ${response.status}`);
      const data = await response.json() as {sdp?:string};
      if (!data.sdp) throw new Error('GPT-Live session returned no SDP answer');
      await pc.setRemoteDescription({type:'answer',sdp:data.sdp});
    } catch (e) {
      this.disconnect();
      const err = e instanceof Error ? e : new Error(String(e));
      this.onError?.(err);
      throw err;
    }
  }

  disconnect(): void {
    this.localStream?.getTracks().forEach(t=>t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    if (this.audioElement) { this.audioElement.srcObject=null; this.audioElement.remove(); this.audioElement=null; }
  }
}
