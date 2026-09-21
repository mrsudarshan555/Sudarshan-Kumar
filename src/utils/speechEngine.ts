import { OfflineVoiceMatcher } from '../services/audio/offlineVoiceMatcher';
import { apiUrl } from '../config/api';

/**
 * MAYRA Voice & Live Audio Speech Engine
 * Powered by Pure Gemini Aoede Natural Voice Synthesis & Web Audio API (24kHz PCM).
 * Includes robust AudioContext lifecycle management, echo cancellation & feedback prevention,
 * and media stream cleanup.
 */

const LANGUAGE_STORAGE_KEY = 'mayra_preferred_language';

export type MayraLanguage = 'en' | 'hi';

let outputAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
const audioResponseCache = new Map<string, string>();

/**
 * Standard Hardware Echo Cancellation & Noise Suppression Constraints
 * Explicitly prevents acoustic feedback loops and squealing.
 */
export const MICROPHONE_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: false
};

// Global registry of active microphone streams for clean session tear-down
let activeMicStream: MediaStream | null = null;

// Audio Analyser node for live speech/mic waveform visualization
let globalAudioAnalyser: AnalyserNode | null = null;

export function getSpeechAudioAnalyser(): AnalyserNode | null {
  return globalAudioAnalyser;
}

// Microphone capture state
let micAudioContext: AudioContext | null = null;
let micSourceNode: MediaStreamAudioSourceNode | null = null;
let micScriptProcessor: ScriptProcessorNode | null = null;
let micSilentGain: GainNode | null = null;
let isMicCapturing = false;

// Streaming playback state
let nextSchedulePlayTime = 0;
const activeSourceNodes = new Set<AudioBufferSourceNode>();
let activePlaybackCount = 0;

function resampleAndConvertTo16BitPCM(input: Float32Array, inputSampleRate: number, targetSampleRate: number = 16000): ArrayBuffer {
  if (inputSampleRate === targetSampleRate) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(input.length / ratio);
  const output = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(input.length - 1, Math.ceil(srcIndex));
    const interpolation = srcIndex - srcIndexFloor;
    const sample = input[srcIndexFloor] + (input[srcIndexCeil] - input[srcIndexFloor]) * interpolation;
    const s = Math.max(-1, Math.min(1, sample));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Starts continuous 16kHz raw PCM microphone capture (Old APK Mx.initializeMicrophone architecture)
 */
export async function startPcm16kCapture(onPcmChunk: (base64Pcm: string) => void): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  stopPcm16kCapture();

  try {
    const stream = await acquireMicrophoneStream();
    if (!stream) return false;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    micAudioContext = new AudioContextClass({ sampleRate: 16000 });
    if (micAudioContext.state === 'suspended') {
      await micAudioContext.resume();
    }

    micSourceNode = micAudioContext.createMediaStreamSource(stream);
    
    // Create AnalyserNode for audio visualization
    try {
      globalAudioAnalyser = micAudioContext.createAnalyser();
      globalAudioAnalyser.fftSize = 64;
      globalAudioAnalyser.smoothingTimeConstant = 0.8;
      micSourceNode.connect(globalAudioAnalyser);
    } catch (e) {}

    // Buffer size 2048 samples (~128ms @ 16kHz)
    micScriptProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);

    micScriptProcessor.onaudioprocess = (e) => {
      if (!isMicCapturing) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBuffer = resampleAndConvertTo16BitPCM(inputData, micAudioContext?.sampleRate || 16000, 16000);
      const base64Pcm = arrayBufferToBase64(pcmBuffer);
      onPcmChunk(base64Pcm);
    };

    micSilentGain = micAudioContext.createGain();
    micSilentGain.gain.value = 0; // Completely silent so microphone is not echoed to speaker

    micSourceNode.connect(micScriptProcessor);
    micScriptProcessor.connect(micSilentGain);
    micSilentGain.connect(micAudioContext.destination);

    isMicCapturing = true;
    console.log('[MAYRA Pipeline] PCM_16K_CAPTURE: STARTED (Continuous Old APK Voice Engine)');
    return true;
  } catch (err) {
    console.warn('[MAYRA Pipeline] PCM_16K_CAPTURE_ERROR:', err);
    stopPcm16kCapture();
    return false;
  }
}

/**
 * Stops continuous 16kHz PCM microphone capture cleanly
 */
export function stopPcm16kCapture(): void {
  isMicCapturing = false;
  if (micScriptProcessor) {
    try {
      micScriptProcessor.disconnect();
      micScriptProcessor.onaudioprocess = null;
    } catch (e) {}
    micScriptProcessor = null;
  }
  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch (e) {}
    micSourceNode = null;
  }
  if (micSilentGain) {
    try { micSilentGain.disconnect(); } catch (e) {}
    micSilentGain = null;
  }
  if (micAudioContext) {
    try {
      if (micAudioContext.state !== 'closed') {
        micAudioContext.close();
      }
    } catch (e) {}
    micAudioContext = null;
  }
  cleanupAudioStreams();
  console.log('[MAYRA Pipeline] PCM_16K_CAPTURE: STOPPED');
}

/**
 * Schedules 24kHz raw PCM Aoede audio chunk for seamless queued playback
 */
export function schedulePcm24kChunk(
  base64Data: string,
  onStart?: () => void,
  onEnded?: () => void
): boolean {
  if (typeof window === 'undefined' || !base64Data) return false;

  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (int16Array.length === 0) return false;

    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    console.log('[AUDIO_CONTEXT_STATE] AudioContext state:', audioCtx.state);
    console.log('[AUDIO_CHUNK_DECODED] Samples:', float32Array.length, 'Duration:', (float32Array.length / 24000).toFixed(3), 's');

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Connect to global analyser for speech waveform animation
    try {
      if (!globalAudioAnalyser || globalAudioAnalyser.context !== audioCtx) {
        globalAudioAnalyser = audioCtx.createAnalyser();
        globalAudioAnalyser.fftSize = 64;
        globalAudioAnalyser.smoothingTimeConstant = 0.8;
      }
      source.connect(globalAudioAnalyser);
    } catch (e) {}

    source.connect(audioCtx.destination);

    const currentTime = audioCtx.currentTime;
    const startTime = Math.max(currentTime + 0.02, nextSchedulePlayTime);
    nextSchedulePlayTime = startTime + audioBuffer.duration;

    console.log('[AUDIO_CHUNK_SCHEDULED] Scheduled at:', startTime.toFixed(3), 'Duration:', audioBuffer.duration.toFixed(3), 's');

    activeSourceNodes.add(source);
    activePlaybackCount++;

    if (onStart && activePlaybackCount === 1) {
      console.log('[AUDIO_PLAYBACK_START] Continuous 24kHz Aoede Voice Playing');
      onStart();
    }

    source.onended = () => {
      activeSourceNodes.delete(source);
      activePlaybackCount = Math.max(0, activePlaybackCount - 1);
      if (activePlaybackCount === 0) {
        nextSchedulePlayTime = 0;
        console.log('[AUDIO_PLAYBACK_END] All queued 24kHz Aoede Voice Playback Completed');
        if (onEnded) onEnded();
      }
    };

    source.start(startTime);
    return true;
  } catch (err) {
    console.warn('[Voice Engine] schedulePcm24kChunk error:', err);
    return false;
  }
}

/**
 * Cleanly flushes all queued 24kHz audio chunks and resets the schedule timeline
 */
export function flushQueuedAudio(): void {
  activeSourceNodes.forEach((source) => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {}
  });
  activeSourceNodes.clear();
  activePlaybackCount = 0;
  nextSchedulePlayTime = 0;
  stopCurrentSpeech();
}

/**
 * Play a standalone 24kHz raw PCM float buffer audio block directly (e.g. from /api/voice/speak or /api/chat)
 */
export function playPcmAudio(
  base64Data: string,
  onStart?: () => void,
  onEnded?: () => void
): boolean {
  flushQueuedAudio();
  return schedulePcm24kChunk(base64Data, onStart, onEnded);
}

/**
 * Checks if voice audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return activePlaybackCount > 0 || currentSourceNode !== null;
}

/**
 * Clean up existing audio streams and tracks before starting a new recording session
 */
export function cleanupAudioStreams(stream?: MediaStream | null): void {
  const target = stream || activeMicStream;
  if (target) {
    try {
      target.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop errors
        }
      });
    } catch (e) {
      // Ignore
    }
  }
  if (!stream && activeMicStream) {
    activeMicStream = null;
  }
}

/**
 * Safely requests a microphone stream with echo cancellation and stores it for tracking
 */
export async function acquireMicrophoneStream(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    console.warn('[MAYRA Pipeline] GET_USER_MEDIA: NOT_SUPPORTED');
    return null;
  }

  // Clean up any stale streams first
  cleanupAudioStreams();

  try {
    console.log('[MAYRA Pipeline] GET_USER_MEDIA: REQUESTING');
    const stream = await navigator.mediaDevices.getUserMedia(MICROPHONE_CONSTRAINTS);
    activeMicStream = stream;
    const audioTracks = stream.getAudioTracks();
    const isActive = audioTracks.length > 0 && audioTracks[0].readyState === 'live';
    console.log('[MAYRA Pipeline] STREAM_ACTIVE:', isActive ? 'ACTIVE' : 'INACTIVE', {
      trackCount: audioTracks.length,
      label: audioTracks[0]?.label || 'Default Mic'
    });
    return stream;
  } catch (err) {
    console.warn('[MAYRA Pipeline] GET_USER_MEDIA_ERROR:', err);
    return null;
  }
}

/**
 * Safe singleton AudioContext accessor.
 * Prevents rapid re-initialization loops and buffer overflows.
 */
export function getAudioContext(): AudioContext {
  if (!outputAudioContext || outputAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  return outputAudioContext;
}

let lastActivationPlayTimestamp = 0;

/**
 * Plays the Custom Microphone Activation Sound
 * - Attached EXCLUSIVELY to explicit user UI mic button tap (triggerVoice)
 * - Never triggered by recognition.onend, automatic restart, silence timeout, or VAD
 * - Strict timestamp debouncing guarantees exactly ONE playback per real user action
 */
export function playCustomActivationSound(): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  if (now - lastActivationPlayTimestamp < 600) {
    return false; // Debounced
  }
  lastActivationPlayTimestamp = now;

  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const t0 = audioCtx.currentTime;
    
    // Tone 1: Subtle warm digital transient (587.33 Hz - D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t0);
    osc1.frequency.exponentialRampToValueAtTime(783.99, t0 + 0.06);

    gain1.gain.setValueAtTime(0.001, t0);
    gain1.gain.linearRampToValueAtTime(0.18, t0 + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.085);

    // Tone 2: Crisp harmonic chime resolution (880 Hz - A5 to 1046.5 Hz - C6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, t0 + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, t0 + 0.12);

    gain2.gain.setValueAtTime(0.001, t0 + 0.05);
    gain2.gain.linearRampToValueAtTime(0.22, t0 + 0.065);
    gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(t0 + 0.05);
    osc2.stop(t0 + 0.23);

    console.log('[MAYRA Pipeline] ACTIVATION_SOUND: PLAYED_CUSTOM_SOUND (User Physical Mic Click)');
    return true;
  } catch (e) {
    console.warn('[MAYRA Pipeline] ACTIVATION_SOUND_ERROR:', e);
    return false;
  }
}

let currentHtml5Audio: HTMLAudioElement | null = null;

// Convert 16-bit PCM base64 string to a standard playable Blob URL (.wav)
export function pcmToWavDataUrl(base64Pcm: string, sampleRate: number = 24000): string {
  try {
    const binary = atob(base64Pcm);
    const dataSize = binary.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    // RIFF chunk
    view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46); // 'RIFF'
    view.setUint32(4, 36 + dataSize, true);
    view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45); // 'WAVE'

    // fmt subchunk
    view.setUint8(12, 0x66); view.setUint8(13, 0x6D); view.setUint8(14, 0x74); view.setUint8(15, 0x20); // 'fmt '
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data subchunk
    view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61); // 'data'
    view.setUint32(40, dataSize, true);

    const bytes = new Uint8Array(buffer, 44);
    for (let i = 0; i < dataSize; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    return '';
  }
}

/**
 * Universal HTML5 Audio player for mobile APK WebViews, Safari, and direct WAV URLs
 */
export function playWavAudioUrl(url: string, onStart?: () => void, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !url) return false;
  try {
    stopCurrentSpeech();
    const audio = new Audio(url);
    currentHtml5Audio = audio;

    let started = false;
    const handleStart = () => {
      if (!started) {
        started = true;
        if (onStart) onStart();
      }
    };

    audio.onplay = handleStart;
    audio.onplaying = handleStart;
    audio.onended = () => {
      if (currentHtml5Audio === audio) {
        currentHtml5Audio = null;
      }
      if (onEnd) onEnd();
    };
    audio.onerror = (err) => {
      console.warn('[Voice Engine] HTML5 Audio element playback error:', err);
      if (currentHtml5Audio === audio) {
        currentHtml5Audio = null;
      }
      if (onEnd) onEnd();
    };

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn('[Voice Engine] HTML5 Audio play promise notice:', err);
      });
    }
    return true;
  } catch (err) {
    console.warn('[Voice Engine] Failed to play WAV audio url:', err);
    return false;
  }
}

/**
 * Prewarms AudioContext on user gesture without throwing or rapid loops
 */
export function prewarmAudioEngine(): void {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    // Ignore prewarm errors
  }
}

// Global user interaction listener to unlock Web Audio in mobile APK / browser
if (typeof window !== 'undefined') {
  const unlockAudioListener = () => {
    prewarmAudioEngine();
    window.removeEventListener('click', unlockAudioListener);
    window.removeEventListener('touchstart', unlockAudioListener);
    window.removeEventListener('touchend', unlockAudioListener);
  };
  window.addEventListener('click', unlockAudioListener, { passive: true });
  window.addEventListener('touchstart', unlockAudioListener, { passive: true });
  window.addEventListener('touchend', unlockAudioListener, { passive: true });
}

/**
 * Cleanly stops any active speech playback source (Web Audio + HTML5 Audio + SpeechSynthesis)
 */
export function stopCurrentSpeech(): void {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {
      // Ignore
    }
    currentSourceNode = null;
  }
  if (currentHtml5Audio) {
    try {
      currentHtml5Audio.pause();
      currentHtml5Audio.currentTime = 0;
      currentHtml5Audio.src = '';
    } catch (e) {
      // Ignore
    }
    currentHtml5Audio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Plays audio payload across platforms: tries Web Audio API 24kHz PCM first,
 * and seamlessly falls back to HTML5 Audio element for APK WebViews.
 */
export function playAudioPayload(
  payload: { audioBase64?: string | null; wavBase64?: string | null; audioUrl?: string | null },
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (!payload) return false;

  // 1. Try Web Audio API with raw 24kHz PCM
  if (payload.audioBase64) {
    const success = playRawPcm24kAudio(payload.audioBase64, onStart, onEnd);
    if (success) return true;
  }

  // 2. Try HTML5 Audio with WAV URL or WAV base64
  const targetUrl = payload.audioUrl || (payload.wavBase64 ? `data:audio/wav;base64,${payload.wavBase64}` : '');
  if (targetUrl) {
    return playWavAudioUrl(targetUrl, onStart, onEnd);
  }

  // 3. Convert raw PCM to Blob URL
  if (payload.audioBase64) {
    const blobUrl = pcmToWavDataUrl(payload.audioBase64, 24000);
    if (blobUrl) {
      return playWavAudioUrl(blobUrl, onStart, onEnd);
    }
  }

  return false;
}

/**
 * Plays 16-bit PCM little-endian 24kHz audio base64 through Web Audio API
 */
export function playRawPcm24kAudio(
  base64Data: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !base64Data) {
    return false;
  }

  try {
    stopCurrentSpeech();
    const audioCtx = getAudioContext();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Int16 PCM to Float32 [-1, 1]
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (int16Array.length === 0) return false;

    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    currentSourceNode = source;
    console.log('[MAYRA Pipeline] PLAY_PCM_AUDIO: STARTED (24kHz Raw PCM Aoede Buffer, Samples:', float32Array.length, ')');

    if (onStart) onStart();

    source.onended = () => {
      console.log('[MAYRA Pipeline] PLAY_PCM_AUDIO: COMPLETED');
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
      if (onEnd) onEnd();
    };

    source.start(0);
    return true;
  } catch (err) {
    console.warn('[Voice Engine] Web Audio PCM playback error:', err);
    return false;
  }
}

export function getSavedLanguage(): MayraLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') return saved;
  } catch (e) {
    // Ignore storage errors
  }
  return 'en';
}

export function saveLanguagePreference(lang: MayraLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Detects whether a string is primarily Hindi (Devanagari or Romanized Hinglish) or English
 */
export function detectLanguage(text: string): MayraLanguage {
  if (!text || typeof text !== 'string') return 'en';
  
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    return 'hi';
  }

  const hinglishWords = [
    'namaste', 'kaise', 'kaisi', 'haal', 'kya', 'hai', 'hain', 'ho', 'hoga',
    'batao', 'karo', 'shukriya', 'dhanyawad', 'dhanyavaad', 'aap', 'tum', 'mera',
    'meri', 'mere', 'accha', 'theek', 'bolo', 'sunao', 'kuch', 'kaam', 'madad',
    'chahiye', 'kaun', 'kahan', 'kab', 'kyun', 'nahi', 'haan', 'namaskar'
  ];

  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = lower.split(/\s+/).filter(Boolean);
  
  let hinglishCount = 0;
  for (const w of words) {
    if (hinglishWords.includes(w)) {
      hinglishCount++;
    }
  }

  if (hinglishCount >= 1 && words.length <= 4) {
    return 'hi';
  }
  if (words.length > 0 && hinglishCount / words.length >= 0.25) {
    return 'hi';
  }

  return 'en';
}

/**
 * Generates dynamic greeting according to user language preference, time of day,
 * and random variation so the user never hears the exact same phrase twice.
 */
export function getDynamicGreeting(name: string = 'Zafer', lang: MayraLanguage = 'en'): string {
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isEvening = currentHour >= 17 && currentHour < 22;
  const isLateNight = currentHour >= 22 || currentHour < 5;

  if (lang === 'hi') {
    const hindiGreetings = [
      `Arre ${name} bhai! Dekh ke chehre pe alag hi muskaan aa gayi. Batao aaj kya bada plan hai?`,
      `Kaise ho ${name} bhai! Main to kab se aapka hi intezar kar rahi thi. Sab badhiya na?`,
      `Arre ${name} bhai, swagat hai! Batao aaj kis cheez pe dhoom machani hai?`,
      `Namaste ${name} bhai! Aapki energy aate hi poora mahoul fresh ho gaya. Chalo batao kya karein?`,
      `Arre ${name} bhai! Aaj ka din kaisa chal raha hai? Batao aaj kis kaam mein saath doon?`,
      `Suno na ${name} bhai, aap aaye to achcha laga! Chalo batao kya naya explore karna hai?`
    ];

    if (isMorning) {
      hindiGreetings.push(
        `Good morning ${name} bhai! Ek nayi shuruaat aur nayi energy... batao aaj kya focus rahega?`,
        `Subah bakhair ${name} bhai! Taaza hawa aur fresh mood ke saath chalo shuru karte hain!`
      );
    } else if (isEvening) {
      hindiGreetings.push(
        `Good evening ${name} bhai! Din kaisa beeta? Chalo thodi guftagu karein ya koi kaam niptaayein?`,
        `Shaam ho gayi ${name} bhai! Thoda din bhar ka update do, sab badhiya raha na?`
      );
    } else if (isLateNight) {
      hindiGreetings.push(
        `Arre ${name} bhai, itni raat tak jag rahe ho? Lagta hai koi bada thought chal raha hai dimag mein!`,
        `Raat ka sukoon aur aapka saath... batao ${name} bhai, kis cheez pe dhyan lagaya hai?`
      );
    }

    const randomIndex = Math.floor(Math.random() * hindiGreetings.length);
    return hindiGreetings[randomIndex];
  }

  // English greetings pool
  const englishGreetings = [
    `Hey ${name}! Always an absolute pleasure to have you here. What exciting thing are we tackling today?`,
    `Welcome back, ${name}! Your presence instantly sets the momentum. Tell me, what's on your mind?`,
    `Hey ${name}! I was waiting for you. How's everything going? What are we building or solving?`,
    `Great to see you, ${name}! Ready to jump into action whenever you are. What's our primary focus?`,
    `Hey ${name}! Good to have you around. Let's make today count—where shall we begin?`
  ];

  if (isMorning) {
    englishGreetings.push(`Good morning, ${name}! Hope your day kicks off with massive positive momentum. What's step one?`);
  } else if (isEvening) {
    englishGreetings.push(`Good evening, ${name}! Wrapping up the day or gearing up for an evening sprint?`);
  } else if (isLateNight) {
    englishGreetings.push(`Late night hustle, ${name}? I'm right here beside you—what are we working on?`);
  }

  const randomIndex = Math.floor(Math.random() * englishGreetings.length);
  return englishGreetings[randomIndex];
}

/**
 * Strips formatting, markdown, and meta headers from text before speaking aloud
 */
export function sanitizeTextForSpeech(text: string): string {
  return text
    // Replace markdown links [Label](URL) with just Label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code blocks and replace with brief speech indicator
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown table lines
    .replace(/\|.*?\|/g, ' ')
    // Remove raw markdown brackets like [AUTO_MEMORY] or [ACTION]
    .replace(/\[.*?\]/g, '')
    // Replace bullets and list numbers with commas for speech cadence
    .replace(/^[\s]*[•\-\*]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Strip bold/italic/strikethrough markers
    .replace(/[*#_~`]/g, '')
    // Replace full URLs with 'link'
    .replace(/https?:\/\/\S+/g, 'link')
    // Normalize excessive spaces and linebreaks
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits long text into natural conversational sentence chunks for continuous streaming speech
 */
export function splitIntoSpeechChunks(text: string, maxChunkLength: number = 180): string[] {
  const clean = sanitizeTextForSpeech(text);
  if (!clean) return [];
  if (clean.length <= maxChunkLength) return [clean];

  const sentences = clean.split(/(?<=[.?!।\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (!currentChunk) {
      currentChunk = trimmed;
    } else if ((currentChunk + ' ' + trimmed).length <= maxChunkLength) {
      currentChunk += ' ' + trimmed;
    } else {
      chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [clean];
}

function getStoredApiKey(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const rawConfig = localStorage.getItem('mayra_personal_config');
    if (rawConfig) {
      const parsed = JSON.parse(rawConfig);
      if (parsed.geminiApiKey && typeof parsed.geminiApiKey === 'string' && parsed.geminiApiKey.trim().length > 10) {
        return parsed.geminiApiKey.trim();
      }
    }
    const directKey = localStorage.getItem('gemini_api_key');
    if (directKey && directKey.trim().length > 10) {
      return directKey.trim();
    }
  } catch (e) {
    // Ignore storage read errors
  }
  return undefined;
}

// Module-level reference to prevent GC from terminating speech prematurely on Android WebViews
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedSpeechVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedSpeechVoices = window.speechSynthesis.getVoices();
    } catch (e) {}
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

export function fallbackSpeechSynthesis(
  text: string, 
  lang: MayraLanguage = 'hi', 
  onStart?: () => void, 
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_~`]/g, '').trim();
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower, more natural cadence
    utterance.pitch = 1.08; // Warm, friendly tone

    let voices = cachedSpeechVoices.length > 0 ? cachedSpeechVoices : window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Re-query voices synchronously
      voices = window.speechSynthesis.getVoices();
    }

    // Prioritize natural, online, google, or neural voices over robotic defaults
    const isTargetLang = (v: SpeechSynthesisVoice) => {
      if (lang === 'hi') {
        return v.lang.includes('hi') || v.name.toLowerCase().includes('hindi');
      }
      return v.lang.includes('en-IN') || v.lang.includes('en_IN') || v.name.toLowerCase().includes('india') || v.lang.startsWith('en');
    };

    const targetVoice = voices.find(v => isTargetLang(v) && (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('online')))
      || voices.find(v => isTargetLang(v) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')))
      || voices.find(v => isTargetLang(v))
      || voices[0];

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    activeUtterance = utterance;

    const cleanup = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      cleanup();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      cleanup();
      console.warn('[SpeechSynthesis] Utterance notice:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    if (onEnd) onEnd();
  }
}

/**
 * Speaks text using Direct Gemini Natural Voice API (24kHz Neural Audio)
 * Seamlessly supports Desktop, Mobile, and Android APK WebViews with Web Audio + HTML5 Audio fallback.
 */
export async function speakText(
  text: string, 
  lang: MayraLanguage = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  audioBase64Payload?: string | null,
  customVoiceName?: string
): Promise<void> {
  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Map legacy 'Aoede' or missing voices to 'Kore' (Gemini natural female voice)
  let effectiveVoice = (customVoiceName || 'Kore').trim();
  if (effectiveVoice.toLowerCase() === 'aoede' || effectiveVoice.toLowerCase() === 'maya') {
    effectiveVoice = 'Kore';
  }

  // 1. If audio base64 is already provided in the response payload, play directly
  if (audioBase64Payload) {
    audioResponseCache.set(`${effectiveVoice}:${lang}:${cleanText}`, audioBase64Payload);
    const success = playAudioPayload({ audioBase64: audioBase64Payload }, onStart, onEnd);
    if (success) return;
  }

  // 2. For multi-sentence long speech, handle continuous chained playback
  const chunks = splitIntoSpeechChunks(cleanText, 250);
  if (chunks.length > 1) {
    let hasTriggeredStart = false;
    let chunkIndex = 0;

    const playNextChunk = async () => {
      if (chunkIndex >= chunks.length) {
        if (onEnd) onEnd();
        return;
      }

      const currentChunkText = chunks[chunkIndex];
      chunkIndex++;

      const isFirst = !hasTriggeredStart;
      const isLast = chunkIndex >= chunks.length;

      const chunkCacheKey = `${effectiveVoice}:${lang}:${currentChunkText}`;
      if (audioResponseCache.has(chunkCacheKey)) {
        const cached = audioResponseCache.get(chunkCacheKey)!;
        playAudioPayload(
          { audioBase64: cached },
          () => {
            if (isFirst) {
              hasTriggeredStart = true;
              if (onStart) onStart();
            }
          },
          () => {
            if (isLast) {
              if (onEnd) onEnd();
            } else {
              playNextChunk();
            }
          }
        );
        return;
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(apiUrl('/api/voice/speak'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: currentChunkText, 
            language: lang, 
            voiceName: effectiveVoice, 
            assistant: 'mayra',
            apiKey: getStoredApiKey()
          }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64 || data.audioUrl || data.wavBase64) {
            if (data.audioBase64) {
              audioResponseCache.set(chunkCacheKey, data.audioBase64);
            }
            const played = playAudioPayload(
              { audioBase64: data.audioBase64, wavBase64: data.wavBase64, audioUrl: data.audioUrl },
              () => {
                if (isFirst) {
                  hasTriggeredStart = true;
                  if (onStart) onStart();
                }
              },
              () => {
                if (isLast) {
                  if (onEnd) onEnd();
                } else {
                  playNextChunk();
                }
              }
            );
            if (played) return;
          }
        }
      } catch (e) {
        console.warn('[Voice Engine] Voice fetch chunk notice:', e);
      }

      // If network fetch for chunk failed, fallback to native device TTS for this chunk
      fallbackSpeechSynthesis(currentChunkText, lang, onStart, () => {
        if (isLast && onEnd) onEnd();
        else if (!isLast) playNextChunk();
      });
    };

    playNextChunk();
    return;
  }

  // 3. Check local audio response cache for zero network latency (single chunk)
  const cacheKey = `${effectiveVoice}:${lang}:${cleanText}`;
  if (audioResponseCache.has(cacheKey)) {
    const cachedAudio = audioResponseCache.get(cacheKey)!;
    const played = playAudioPayload({ audioBase64: cachedAudio }, onStart, onEnd);
    if (played) return;
  }

  // 4. Attempt direct natural Gemini Voice from backend (single chunk)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(apiUrl('/api/voice/speak'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: cleanText, 
        language: lang, 
        voiceName: effectiveVoice, 
        assistant: 'mayra',
        apiKey: getStoredApiKey()
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64 || data.audioUrl || data.wavBase64) {
        if (data.audioBase64) {
          audioResponseCache.set(cacheKey, data.audioBase64);
        }
        const played = playAudioPayload(
          { audioBase64: data.audioBase64, wavBase64: data.wavBase64, audioUrl: data.audioUrl },
          onStart,
          onEnd
        );
        if (played) return;
      }
    }
  } catch (err) {
    console.warn('[Voice Engine] Voice synthesis notice:', err);
  }

  // If direct natural voice audio from backend is unreachable, fallback to on-device SpeechSynthesis
  fallbackSpeechSynthesis(cleanText, lang, onStart, onEnd);
}
