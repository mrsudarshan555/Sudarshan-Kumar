import React from 'react';
import { Sparkles, Terminal, ShieldCheck, Heart, Info, Code2, ArrowLeft, RefreshCw } from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';

interface AboutViewProps {
  onBack: () => void;
  onOpenOnboarding?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, onOpenOnboarding }) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-200">
      
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">About MAYRA</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">System Architecture & Version Manifest</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Brand Orb Hero - Magnifying Glass */}
        <div className="p-6 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <MayraLogo size={64} showGlow={true} />
          <div>
            <h1 className="text-lg font-extrabold text-white font-mono tracking-tight">★𝐌₳ᎽⱤ₳ ᥫ᭡</h1>
            <p className="text-xs text-purple-300 font-sans">Personal AI Assistant</p>
          </div>
          <div className="px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[10px] font-mono text-purple-200 backdrop-blur-md">
            Version 2.0.0-phase2 (Settings & System UI)
          </div>

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="mt-2 py-2 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Onboarding Dobara Dekhein (Replay Tour)</span>
            </button>
          )}
        </div>

        {/* Credits & Acknowledgments Card */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" /> Credits &amp; Acknowledgments
          </div>
          <div className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300/70 font-sans">Original Spatial &amp; Voice Architecture</span>
              <span className="text-purple-200 font-bold font-sans">Jared Rhodenizer</span>
            </div>
            <p className="text-[10px] text-purple-200/60 leading-normal font-sans">
              Special recognition and credit to <strong>Jared Rhodenizer</strong> for the groundbreaking Barehands (air-board hand-tracking), Backtalk (voice ducking engine), and AI-Visualizer (living circuit board) foundational concepts.
            </p>
          </div>
          <div className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300/70 font-sans">Android &amp; Dual-Brain Integration</span>
              <span className="text-emerald-300 font-bold font-sans">Zafer &amp; Sudarshan</span>
            </div>
            <p className="text-[10px] text-purple-200/60 leading-normal font-sans">
              MAYRA Android UI architecture, Jetpack Compose system bridge, StonicX dual-persona integration, offline model runner, and full-stack runtime engineering.
            </p>
          </div>
        </div>

        {/* Technical Specs Card */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-white uppercase flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" /> Engineering Architecture
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">APPLICATION_ID</span>
              <span className="text-white font-semibold font-mono">com.mayra.assistant</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">OWNERSHIP</span>
              <span className="text-emerald-300 font-bold">Zafer & Sudarshan</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">LICENSE STATUS</span>
              <span className="text-amber-300 font-semibold">Private & Proprietary (Not Open Source)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">UI FRAMEWORK</span>
              <span className="text-blue-300 font-semibold">Jetpack Compose (BOM 2024.12)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">DESIGN SYSTEM</span>
              <span className="text-white font-semibold">Material 3 Dark Palette</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">TARGET ANDROID SDK</span>
              <span className="text-white font-semibold font-mono">Android 16 (API 36)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <span className="text-purple-300/70">MINIMUM ANDROID SDK</span>
              <span className="text-white font-semibold font-mono">Android 8.0 (API 26)</span>
            </div>
          </div>
        </div>

        {/* Ownership & Private Rights Banner */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-purple-500/30 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Proprietary Project & Ownership
          </div>
          <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
            Yeh project <strong className="text-white font-semibold">Zafer &amp; Sudarshan</strong> ka private aur proprietary project hai. Yeh open-source bilkul nahi hai. All rights reserved.
          </p>
        </div>

        {/* Credits & Acknowledgments Section */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Credits, Attribution & Licenses
          </div>
          <div className="space-y-2 text-[11px] font-sans text-slate-300">
            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
              <div className="font-bold text-white flex justify-between">
                <span>Core Project & System Architects</span>
                <span className="text-purple-300 font-sans text-[10px]">Zafer & Sudarshan</span>
              </div>
              <p className="text-[10px] text-purple-200/60">
                Creators of MAYRA & STONICX multimodal assistant architecture, UI/UX design, autonomous agents, and voice pipelines.
              </p>
            </div>

            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
              <div className="font-bold text-white flex justify-between">
                <span>Voice Studio & Audio Architecture</span>
                <span className="text-purple-300 font-sans text-[10px]">MT Manager Inspired</span>
              </div>
              <p className="text-[10px] text-purple-200/60">
                Multi-voice switcher and audition interface inspired by MT Manager audio and file utility workflows.
              </p>
            </div>

            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
              <div className="font-bold text-white flex justify-between">
                <span>3D Graphics & Engine</span>
                <span className="text-blue-300 font-sans text-[10px]">Three.js (MIT License)</span>
              </div>
              <p className="text-[10px] text-purple-200/60">
                MMD / PMX character animation and shader pipeline powered by Three.js (Mr.doob & open source contributors).
              </p>
            </div>

            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
              <div className="font-bold text-white flex justify-between">
                <span>Typography & Visual Fonts</span>
                <span className="text-amber-300 font-sans text-[10px]">Peter Hull (SIL OFL 1.1)</span>
              </div>
              <p className="text-[10px] text-purple-200/60">
                VT323 retro font created by Peter Hull, distributed under the SIL Open Font License 1.1.
              </p>
            </div>

            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-emerald-500/20 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>License Compliance Guarantee</span>
                <span className="text-emerald-400 font-mono text-[10px]">0% AGPL</span>
              </div>
              <p className="text-[10px] text-purple-200/60">
                Strict compliance verified: No AGPL (Affero General Public License) code is included or used in this project. All dependencies utilize permissive licenses (MIT, Apache 2.0, BSD, SIL OFL).
              </p>
            </div>
          </div>
        </div>

        {/* Development Philosophy */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-white uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Phase 2 Accomplishments
          </div>
          <p className="text-[11px] text-purple-200/70 leading-relaxed font-sans">
            Phase 2 establishes a complete, production-grade Settings & System navigation architecture, Voice Guardian security layout, Personal/Country preferences, Multi-Agent pipelines, and local data governance.
          </p>
        </div>

      </div>
    </div>
  );
};
