import React, { useCallback, useEffect, useRef, useState } from 'react';

interface MayraLiveScreenProps {
  onOpenChat?: () => void;
  onOpenHome?: () => void;
  onEndSession?: () => void;
}

export const MayraLiveScreen: React.FC<MayraLiveScreenProps> = ({
  onOpenChat,
  onOpenHome,
  onEndSession
}) => {
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [camOn, setCamOn] = useState(false);
  const [transcriptOn, setTranscriptOn] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [flipSpin, setFlipSpin] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  const startCam = useCallback(async (nextFacing = facing) => {
    try {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch {
      setCamOn(false);
    }
  }, [facing]);

  useEffect(() => {
    startCam(facing);
    return () => stopCam();
  }, []);

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFlipSpin(false);
    requestAnimationFrame(() => setFlipSpin(true));
    setFacing(next);
    if (camOn) startCam(next);
  };

  const endSession = () => {
    stopCam();
    onEndSession?.();
  };

  return (
    <div className="h-full w-full overflow-hidden bg-black font-sans">
      <style>{`
        .mayra-live-screen, .mayra-live-screen * { box-sizing: border-box; }
        .mayra-live-screen { height: 100%; display: flex; flex-direction: column; background: linear-gradient(#000 0 22%, #1e5fbf 78%, #2b6fd8 100%); }
        .mayra-live-topbar { height: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; padding-top: env(safe-area-inset-top, 0px); }
        .mayra-live-label { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 17px; }
        .mayra-live-transcript { position: absolute; right: 20px; top: 26px; color: #fff; background: none; border: none; padding: 4px; cursor: pointer; display: flex; }
        .mayra-live-transcript .slash, .mayra-live-mic .slash { opacity: 0; transition: opacity .15s; }
        .mayra-live-transcript.off .slash, .mayra-live-mic.muted .slash { opacity: 1; }
        .mayra-live-cam-wrap { flex: 1; padding: 0; display: flex; min-height: 0; }
        .mayra-live-preview { position: relative; flex: 1; border-radius: 28px; overflow: hidden; background-image: linear-gradient(45deg,#b9b9b9 25%,transparent 25%),linear-gradient(-45deg,#b9b9b9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#b9b9b9 75%),linear-gradient(-45deg,transparent 75%,#b9b9b9 75%); background-size:44px 44px; background-position:center; background-color:#e6e6e6; }
        .mayra-live-preview video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; }
        .mayra-live-preview.live video { display:block; }
        .mayra-live-flip { position:absolute; right:16px; bottom:16px; width:44px; height:44px; border-radius:50%; background:rgba(30,30,30,.55); border:none; display:flex; align-items:center; justify-content:center; color:#fff; }
        .mayra-live-flip.spin svg { animation: mayraLiveFlip .4s ease; }
        @keyframes mayraLiveFlip { from { transform:rotate(0deg); } to { transform:rotate(180deg); } }
        .mayra-live-bottom { flex-shrink:0; display:flex; align-items:center; justify-content:space-around; padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px)); }
        .mayra-live-ctrl { border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .mayra-live-video { width:72px; height:50px; border-radius:25px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-home { width:60px; height:50px; border-radius:22px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-mic { width:60px; height:50px; border-radius:22px; background:rgba(255,255,255,.18); color:#fff; }
        .mayra-live-end { width:60px; height:50px; border-radius:25px; background:#e8362b; color:#fff; }
      `}</style>

      <div className="mayra-live-screen">
        <div className="mayra-live-topbar">
          <div className="mayra-live-label">
            <svg width="16" height="16" viewBox="0 0 30 28" fill="none" aria-hidden="true">
              <rect x="3" y="12" width="4" height="10" rx="2" fill="#fff"/>
              <rect x="10.5" y="5" width="4" height="20" rx="2" fill="#fff"/>
              <rect x="18" y="13" width="4" height="8" rx="2" fill="#fff"/>
              <path d="M25 1C25.15 3 25.5 4.2 26.1 4.9C26.7 5.6 27.7 5.9 29.5 6.05C27.7 6.2 26.7 6.5 26.1 7.2C25.5 7.9 25.15 9.1 25 11.1C24.85 9.1 24.5 7.9 23.9 7.2C23.3 6.5 22.3 6.2 20.5 6.05C22.3 5.9 23.3 5.6 23.9 4.9C24.5 4.2 24.85 3 25 1Z" fill="#fff"/>
            </svg>
            <span>Mayra Live</span>
          </div>
          <button className={`mayra-live-transcript ${transcriptOn ? '' : 'off'}`} onClick={() => setTranscriptOn(v => !v)} aria-label="Toggle transcript">
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
              <line x1="4" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <line className="slash" x1=".5" y1="17.5" x2="21.5" y2=".5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="mayra-live-cam-wrap">
          <div className={`mayra-live-preview ${camOn ? 'live' : ''}`}>
            <video ref={videoRef} autoPlay playsInline muted />
            <button className={`mayra-live-flip ${flipSpin ? 'spin' : ''}`} onClick={flipCamera} aria-label="Switch camera">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17.5 8.5C16.35 6.47 14.17 5 11.5 5C7.36 5 4 8.36 4 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 4.5V8.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 15.5C7.65 17.53 9.83 19 12.5 19C16.64 19 20 15.64 20 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 19V15H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mayra-live-bottom">
          <button className="mayra-live-ctrl mayra-live-home" onClick={onOpenHome} aria-label="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 11L12 4L20 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 9.5V19C6 19.5523 6.44772 20 7 20H10V15C10 14.4477 10.4477 14 11 14H13C13.5523 14 14 14.4477 14 15V20H17C17.5523 20 18 19.5523 18 19V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="mayra-live-ctrl mayra-live-home" onClick={() => window.dispatchEvent(new CustomEvent('mayra:open-memory'))} aria-label="Memory">
            <svg width="21" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 9H16M8 12H16M8 15H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <button className={`mayra-live-ctrl mayra-live-mic ${micMuted ? 'muted' : ''}`} onClick={() => setMicMuted(v => !v)} aria-label="Mute">
            <svg width="18" height="22" viewBox="0 0 20 24" fill="none" aria-hidden="true">
              <path d="M10 15.5C12.2091 15.5 14 13.7091 14 11.5V5.5C14 3.29086 12.2091 1.5 10 1.5C7.79086 1.5 6 3.29086 6 5.5V11.5C6 13.7091 7.79086 15.5 10 15.5Z" fill="currentColor"/>
              <path d="M17 11.5C17 15.0899 14.0899 18 10.5 18H9.5C5.91015 18 3 15.0899 3 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="10" y1="18" x2="10" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="6.5" y1="22" x2="13.5" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line className="slash" x1="1.5" y1="22.5" x2="18.5" y2="1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="mayra-live-ctrl mayra-live-video" onClick={onOpenChat} aria-label="Toggle chat">
            <svg width="22" height="20" viewBox="0 0 24 22" fill="none" aria-hidden="true">
              <path d="M22 11C22 15.4183 17.5228 19 12 19C10.7 19 9.46 18.81 8.33 18.46L3 20L4.55 15.66C3.58 14.34 3 12.73 3 11C3 6.58172 7.47715 3 13 3C17.4183 3 22 6.58172 22 11Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
