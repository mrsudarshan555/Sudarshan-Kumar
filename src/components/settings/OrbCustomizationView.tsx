import React, { useState } from 'react';
import { AppearanceConfig, OrbStyleType, OrbColorType, OrbTypePreset, AppLauncherIconVariant, AssistantStatus } from '../../types';
import { MayraOrb, ORB_STYLES, ORB_COLORS, normalizeOrbStyle } from '../character/MayraOrb';
import { LAUNCHER_ICONS, MayraLogo } from '../common/MayraLogo';
import { AppIconTile } from '../common/AppIconTile';
import { 
  ArrowLeft, Sparkles, Sliders, 
  Palette, Radio, Eye, Volume2, ShieldCheck, 
  RotateCcw, CheckCircle2, Zap, Sun, Orbit, Layers, Flame, LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrbCustomizationViewProps {
  config: AppearanceConfig;
  onChange: (updated: Partial<AppearanceConfig>) => void;
  onBack: () => void;
  onNavigateToAppearance?: () => void;
}

export const OrbCustomizationView: React.FC<OrbCustomizationViewProps> = ({
  config,
  onChange,
  onBack,
  onNavigateToAppearance
}) => {
  const isDark = config.darkMode ?? true;
  const [previewStatus, setPreviewStatus] = useState<AssistantStatus>('SPEAKING');

  const currentOrbType: OrbTypePreset = config.orbType || 'classic';
  const currentHue = config.customHue ?? 190;
  const hasCustomHue = config.customHue !== undefined;
  const currentLauncherIcon: AppLauncherIconVariant = config.launcherIconVariant || 'cyan_default';
  const currentNormalizedStyle = normalizeOrbStyle(config.orbStyle);
  const currentStyleDef = ORB_STYLES.find(s => s.id === currentNormalizedStyle) || ORB_STYLES[0];

  const handleOrbTypeSelect = (type: OrbTypePreset) => {
    onChange({ orbType: type });
  };

  const handleHueSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ customHue: val });
  };

  const handleResetHueToPreset = () => {
    onChange({ customHue: undefined });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ orbSize: parseInt(e.target.value, 10) });
  };

  const handleToggleVoiceVisualizer = () => {
    onChange({ voiceVisualizerEnabled: !(config.voiceVisualizerEnabled ?? true) });
  };

  const handleToggleAuraBorder = () => {
    onChange({ auraBorderMode: !(config.auraBorderMode ?? false) });
  };

  const handleSelectLauncherIcon = (variant: AppLauncherIconVariant) => {
    onChange({ launcherIconVariant: variant });
  };

  const orbTypesList: { id: OrbTypePreset; label: string; desc: string; icon: LucideIcon; color: 'cyan' | 'amber' | 'pink' | 'purple' }[] = [
    { 
      id: 'classic', 
      label: 'Classic', 
      desc: 'Pure harmonic geometry & natural core radiance',
      icon: Orbit,
      color: 'cyan'
    },
    { 
      id: 'energy', 
      label: 'Energy', 
      desc: 'Coronal plasma flares & high-velocity particle spikes',
      icon: Zap,
      color: 'amber'
    },
    { 
      id: 'neon', 
      label: 'Neon', 
      desc: 'High-luminescence electric halo & chromatic boundary ring',
      icon: Flame,
      color: 'pink'
    },
    { 
      id: 'hologram', 
      label: 'Hologram', 
      desc: 'Tactical HUD scanlines, telemetry ticks & digital matrix',
      icon: Layers,
      color: 'purple'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-transparent text-slate-100">
      
      {/* Top App Bar - Liquid Magnifying Glass */}
      <div className="h-14 px-4 border-b border-white/10 bg-black/30 backdrop-blur-3xl flex items-center justify-between z-10 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2.5">
            <AppIconTile icon={Sparkles} color="cyan" size="sm" />
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white font-sans">
                Orb Customization Studio
              </h1>
              <p className="text-[10px] font-normal text-purple-300/70 font-sans">
                Rendering Engine & Aura Presence
              </p>
            </div>
          </div>
        </div>

        {onNavigateToAppearance && (
          <button
            onClick={onNavigateToAppearance}
            className="text-[11px] font-bold px-3 py-1 rounded-xl border border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 backdrop-blur-xl transition-all cursor-pointer"
          >
            Styles
          </button>
        )}
      </div>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">

        {/* (a) LARGE LIVE PREVIEW BOX - Liquid Magnifying Glass */}
        <section className="p-4 rounded-3xl border border-cyan-500/30 bg-black/35 backdrop-blur-2xl relative overflow-hidden transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Subtle Ambient Radial Glow */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 blur-2xl transition-all duration-500"
            style={{
              background: hasCustomHue 
                ? `radial-gradient(circle at center, hsl(${currentHue}, 90%, 55%) 0%, transparent 70%)`
                : 'radial-gradient(circle at center, rgba(6,182,212,0.6) 0%, transparent 70%)'
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Header Badge */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-sans">
                  LIVE REAL-TIME ENGINE PREVIEW
                </span>
              </div>
              <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-purple-200 border border-white/15 backdrop-blur-xl">
                {currentStyleDef.name} • {currentOrbType.toUpperCase()}
              </span>
            </div>

            {/* Central Orb Stage */}
            <div className="py-5 flex items-center justify-center min-h-[170px]">
              <MayraOrb
                style={config.orbStyle}
                color={config.orbColor}
                orbType={config.orbType || 'classic'}
                customHue={config.customHue}
                size={Math.min(Math.max(config.orbSize * 1.5, 96), 160)}
                status={previewStatus}
                interactive={true}
                onClick={() => {
                  const statuses: AssistantStatus[] = ['SPEAKING', 'LISTENING', 'THINKING', 'READY'];
                  const next = statuses[(statuses.indexOf(previewStatus) + 1) % statuses.length];
                  setPreviewStatus(next);
                }}
              />
            </div>

            {/* Simulation Status Controls */}
            <div className="w-full pt-2.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/70 font-sans">
                Simulate Status:
              </span>
              <div className="flex items-center gap-1">
                {(['READY', 'LISTENING', 'THINKING', 'SPEAKING'] as AssistantStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPreviewStatus(st)}
                    className={`px-2.5 py-1 rounded-xl text-[9px] font-sans font-bold transition-all cursor-pointer ${
                      previewStatus === st
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-purple-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* (b) SELECT ORB CORE STYLE (Video-Inspired & All Presets) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-cyan-400">
                ORB CORE STYLES & PRESETS
              </h3>
            </div>
            <span className="text-[10px] font-sans font-normal text-purple-200/70">
              {ORB_STYLES.length} Dynamic Engines
            </span>
          </div>

          {/* Featured Video-Inspired Orbs Highlight */}
          <div className="grid grid-cols-2 gap-2.5">
            {ORB_STYLES.map((styleDef) => {
              const isSelected = currentNormalizedStyle === styleDef.id;
              const isVideoSpecial = ['electric_plasma', 'siri_prismatic_halo', 'silk_ribbon_vortex', 'quantum_stardust'].includes(styleDef.id);
              
              return (
                <button
                  key={styleDef.id}
                  onClick={() => onChange({ orbStyle: styleDef.id })}
                  className={`p-3.5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'bg-black/35 border-white/15 hover:border-cyan-400/50 hover:bg-black/45'
                  }`}
                >
                  {/* Top Badge for Video Special */}
                  {isVideoSpecial && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        NEW HD
                      </span>
                    </div>
                  )}

                  {/* Live Mini Orb Preview */}
                  <div className="w-full flex items-center justify-center py-2">
                    <div className="p-1 rounded-full bg-black/40 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                      <MayraOrb
                        style={styleDef.id}
                        color={config.orbColor}
                        orbType={config.orbType || 'classic'}
                        customHue={config.customHue}
                        size={48}
                        status={previewStatus}
                      />
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs tracking-tight font-sans ${
                        isSelected 
                          ? 'text-white font-extrabold'
                          : 'text-slate-100'
                      }`}>
                        {styleDef.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] font-sans font-normal mt-0.5 line-clamp-2 leading-tight text-purple-200/70">
                      {styleDef.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* (c) 'ORB TYPE' QUICK-SELECT BUTTONS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-cyan-400">
              ORB RENDERING TYPE
            </h3>
            <span className="text-[10px] font-sans font-normal text-purple-200/70">
              Visual Treatment Layer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {orbTypesList.map((type) => {
              const isSelected = currentOrbType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleOrbTypeSelect(type.id)}
                  className={`p-3.5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                      : 'bg-black/35 border-white/15 hover:bg-black/45 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <AppIconTile icon={type.icon} color={type.color} size="xs" />
                      <span className="font-bold text-xs tracking-tight text-white font-sans">
                        {type.label}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[10px] font-sans font-normal leading-relaxed mt-1 line-clamp-2 text-purple-200/70">
                    {type.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* (c) ADJUST ORB SIZE SLIDER - Liquid Magnifying Glass */}
        <section className="p-4 rounded-3xl border border-white/15 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Sliders} color="blue" size="xs" />
              <div>
                <h4 className="font-bold text-xs text-white font-sans">
                  Adjust Orb Size
                </h4>
                <p className="text-[10px] font-normal text-purple-200/70 font-sans">
                  Continuous scaling for home stage & widget
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {config.orbSize} dp
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="44"
              max="120"
              step="2"
              value={config.orbSize}
              onChange={handleSizeChange}
              className="w-full h-2 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] font-sans font-normal text-purple-300/60 px-1">
              <span>Compact (44dp)</span>
              <span>Standard (64dp)</span>
              <span>Large (96dp)</span>
              <span>Immersive (120dp)</span>
            </div>
          </div>
        </section>

        {/* (d) ADJUST COLOR HUE: CONTINUOUS RAINBOW GRADIENT SLIDER */}
        <section className="p-4 rounded-3xl border border-white/15 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Palette} color="pink" size="xs" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-white font-sans">
                    Adjust Color Hue
                  </h4>
                  {hasCustomHue && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      SPECTRUM HUE
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-normal text-purple-200/70 font-sans">
                  Full 360° continuous rainbow spectrum slider
                </p>
              </div>
            </div>

            {hasCustomHue ? (
              <button
                onClick={handleResetHueToPreset}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-sans font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all cursor-pointer"
                title="Reset to preset color swatch"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-white/10 text-purple-200 border border-white/10">
                Preset: {config.orbColor.toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Rainbow Spectrum Track */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={currentHue}
                onChange={handleHueSliderChange}
                className="w-full h-4 rounded-xl appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>

            {/* Current Selected Color Swatch & Value */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: `hsl(${currentHue}, 95%, 55%)` }}
                />
                <span className="text-[11px] font-mono font-bold text-white">
                  Hue: {currentHue}°
                </span>
              </div>
              <span className="text-[10px] font-sans text-purple-300/60">
                {hasCustomHue ? 'Continuous Custom Palette' : 'Sliding overrides preset'}
              </span>
            </div>
          </div>
        </section>

        {/* (e & f) SYSTEM PRESENCE & INTERACTIVE VISUALIZERS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-cyan-400">
              SYSTEM PRESENCE & VISUALIZERS
            </h3>
            <span className="text-[10px] font-sans font-normal text-purple-200/70">
              Voice Reactivity & Edge Glow
            </span>
          </div>

          <div className="border border-white/15 rounded-3xl overflow-hidden divide-y divide-white/10 bg-black/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            
            {/* (e) Voice Visualizer Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 pr-2">
                <AppIconTile icon={Volume2} color="cyan" size="xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white font-sans">
                      Voice Visualizer Presence
                    </span>
                    <span className={`text-[8px] font-sans px-2 py-0.5 rounded-full font-bold ${
                      (config.voiceVisualizerEnabled ?? true)
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(config.voiceVisualizerEnabled ?? true) ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] font-sans font-normal mt-0.5 text-purple-200/70">
                    Ambient orb dot sits quietly at idle and dynamically expands in real-time while MAYRA is speaking
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleVoiceVisualizer}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 cursor-pointer ${
                  (config.voiceVisualizerEnabled ?? true) ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  (config.voiceVisualizerEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* (f) Aura Border Mode Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 pr-2">
                <AppIconTile icon={ShieldCheck} color="purple" size="xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white font-sans">
                      Aura Border Mode
                    </span>
                    <span className={`text-[8px] font-sans px-2 py-0.5 rounded-full font-bold ${
                      (config.auraBorderMode ?? false)
                        ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(config.auraBorderMode ?? false) ? 'AURA ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] font-sans font-normal mt-0.5 text-purple-200/70">
                    Shows a thin, rotating glowing chromatic aura border around the phone screen bezel
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAuraBorder}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 cursor-pointer ${
                  (config.auraBorderMode ?? false) ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  (config.auraBorderMode ?? false) ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>
        </section>

        {/* 3. ALTERNATE APP LAUNCHER ICON VARIANTS */}
        <section className="space-y-2 pb-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-widest text-cyan-400">
              APP LAUNCHER ICON THEMES
            </h3>
            <span className="text-[10px] font-sans font-normal text-purple-200/70">
              Dynamic Insignia Styling
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {Object.values(LAUNCHER_ICONS).map((iconDef) => {
              const isSelected = currentLauncherIcon === iconDef.id;
              return (
                <button
                  key={iconDef.id}
                  onClick={() => handleSelectLauncherIcon(iconDef.id)}
                  className={`p-3.5 rounded-3xl border text-left transition-all relative flex flex-col items-center text-center backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'bg-black/35 border-white/15 hover:bg-black/45 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="mb-2">
                    <MayraLogo 
                      size={44} 
                      iconVariant={iconDef.id} 
                      showGlow={isSelected} 
                    />
                  </div>

                  <span className={`font-bold text-xs tracking-tight font-sans ${
                    isSelected 
                      ? 'text-white font-extrabold'
                      : 'text-slate-100'
                  }`}>
                    {iconDef.name}
                  </span>

                  <p className="text-[9px] font-sans font-normal mt-0.5 line-clamp-1 text-purple-200/70">
                    {iconDef.subtitle}
                  </p>

                  {isSelected && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-sans font-bold text-cyan-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
