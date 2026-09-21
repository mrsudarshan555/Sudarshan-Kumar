import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, FileText, CheckCircle2, Lock, Eye, Mic, 
  Camera, Server, Smartphone, Cpu, RefreshCw, ChevronRight, ExternalLink
} from 'lucide-react';

interface LegalTermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const LegalTermsPrivacyModal: React.FC<LegalTermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl max-h-[88vh] bg-[#0c0919] border border-purple-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-[#130d28]/60 to-purple-950/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {activeTab === 'privacy' ? <Shield className="w-5 h-5 stroke-[2.2]" /> : <FileText className="w-5 h-5 stroke-[2.2]" />}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{activeTab === 'privacy' ? 'Privacy Policy & Data Charter' : 'Terms & Conditions of Service'}</span>
                </h2>
                <p className="text-xs text-purple-200/60 font-sans">
                  MAYRA / STONICX Neural Operating System • Version 2.4.0
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="px-4 pt-3 pb-2 bg-[#0e0a22]/70 border-b border-white/5 flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/40'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400/40'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </button>
          </div>

          {/* Scrollable Document Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-[13px] leading-relaxed text-slate-300 scrollbar-thin scrollbar-thumb-purple-500/20">
            {activeTab === 'privacy' ? (
              <div className="space-y-6">
                {/* Highlights Banner */}
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/30 text-purple-100 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Zero Ambient Spy Guarantee</span>
                    Your personal conversations, standby microphone monitoring, and keystrokes are processed strictly on your local device RAM. We never sell, rent, or trade your personal data.
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">1</span>
                    <span>Identity & Application Scope</span>
                  </h3>
                  <p>
                    MAYRA (alongside the STONICX dual neural persona) is an advanced personal AI companion and spatial productivity interface built for Android and modern web runtimes. This Privacy Policy details how data is accessed, processed, and preserved when you interact with voice recognition, vision scanner, memory vaults, and automated assistant tools.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">2</span>
                    <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-purple-400" /> Microphone & Audio Stream Processing</span>
                  </h3>
                  <p>
                    <strong className="text-white">Push-to-Talk (PTT) & Hands-Free Voice:</strong> Microphone audio is captured only when voice mode is explicitly initiated by you (via tap on the voice orb, hold-to-talk button, or registered wake word). Audio frames are transformed into text query representations and passed to the voice synthesis engine.
                  </p>
                  <p>
                    <strong className="text-white">Wake Word & Standby Monitoring:</strong> Wake word detection evaluates acoustic phonemes strictly on-device in volatile RAM memory. Background audio is discarded immediately within milliseconds and is never uploaded to remote servers.
                  </p>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">3</span>
                    <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-purple-400" /> Camera, Photos & Vision Scanner</span>
                  </h3>
                  <p>
                    <strong className="text-white">Ephemeral Visual Analysis:</strong> When using BareHands gesture recognition, object scanning, or document summarization, the camera stream is inspected ephemerally in device memory to compute landmarks or visual descriptions. 
                  </p>
                  <p>
                    Bulk photo galleries are never scanned or indexed without your explicit file-picker selection. Once an image query is answered, unpinned snapshots are automatically cleared from the session cache.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">4</span>
                    <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-400" /> Third-Party AI Models & Cloud Processing</span>
                  </h3>
                  <p>
                    To provide natural intelligence, complex reasoning queries may be processed using Google Gemini multimodal AI models through secure, encrypted TLS connections (HTTPS).
                  </p>
                  <p>
                    You retain the ability to supply your own private Gemini API Key in Settings. When your own API key is configured, calls flow directly against your personal Google AI account without routing through shared intermediate telemetry.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">5</span>
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-purple-400" /> Device Telemetry, Hardware & Permissions</span>
                  </h3>
                  <p>
                    The app gathers real-time hardware telemetry (such as battery percentage, network connection type 5G/4G/Wi-Fi, CPU core counts, and RAM memory estimation) solely for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li>Dynamic audio quality adaptation (adjusting 24kHz HD bitrate on high-speed 5G vs cellular).</li>
                    <li>Preventing memory overflow crashes by managing model caches inside available RAM.</li>
                    <li>Displaying accurate device stats on your Account & Profile page.</li>
                  </ul>
                </div>

                {/* Section 6 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[11px] font-mono flex items-center justify-center">6</span>
                    <span>Your Data Rights & Local Vault Purge</span>
                  </h3>
                  <p>
                    You have total authority over your data. At any time, you may:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Purge chat message logs instantly</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Delete or unpin quantum memories</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Revoke camera or mic permissions</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Export memory vault backup to JSON</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Terms Highlights */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-400/30 text-indigo-100 flex items-start gap-3">
                  <FileText className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Agreement to Terms</span>
                    By installing, accessing, or interacting with MAYRA or STONICX, you confirm that you have read, understood, and agreed to be bound by these Terms & Conditions.
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">1</span>
                    <span>Nature of AI Assistant Services</span>
                  </h3>
                  <p>
                    MAYRA provides intelligent conversational assistance, voice synthesis, task planning, and device automation. You understand that generative AI models may occasionally produce speculative or non-deterministic statements. Information provided regarding legal, medical, or financial matters is for educational convenience and must not replace professional human expertise.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">2</span>
                    <span>Responsible & Permitted Use</span>
                  </h3>
                  <p>
                    You agree to use MAYRA strictly in accordance with applicable local, national, and international laws. You shall not use MAYRA to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li>Perform unauthorized covert audio or video surveillance without mutual consent.</li>
                    <li>Generate harassing, defamatory, or maliciously deceptive material.</li>
                    <li>Attempt to reverse-engineer, exploit, or bypass system security boundaries.</li>
                    <li>Interfere with device emergency communication channels or traffic safety regulations.</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">3</span>
                    <span>Device Automation & Emergency SOS Features</span>
                  </h3>
                  <p>
                    Automation routines (such as automated SMS dispatch, dialer triggers, car parking trackers, and anti-theft sensors) depend on device hardware sensors and operating system permissions. While designed for high reliability, automated emergency notifications should not be relied upon as the sole emergency lifeline during critical rescue situations.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">4</span>
                    <span>Third-Party Network & API Quotas</span>
                  </h3>
                  <p>
                    Interaction with cloud neural intelligence models requires network connectivity (5G, 4G, or Wi-Fi). Cellular carrier data rates apply. Free-tier cloud intelligence quotas are subject to provider availability. Users who supply their own API keys are responsible for compliance with their respective provider's terms and usage billing.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">5</span>
                    <span>Intellectual Property & Licensing</span>
                  </h3>
                  <p>
                    All trademarks, software architecture, 3D character avatars, audio algorithms, and graphical interfaces are protected by intellectual property laws. Your user-generated inputs, memories, and personal notes remain exclusively your property.
                  </p>
                </div>

                {/* Section 6 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono flex items-center justify-center">6</span>
                    <span>Warranty Disclaimer & Limitation of Liability</span>
                  </h3>
                  <p>
                    The software is provided on an "AS IS" and "AS AVAILABLE" basis without express or implied warranties. In no event shall MAYRA developers or affiliated services be held liable for indirect, incidental, or consequential damages resulting from data loss or system interruption.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-white/10 bg-[#090714] flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Last updated: September 2026 • Encrypted on-device
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              Close & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
