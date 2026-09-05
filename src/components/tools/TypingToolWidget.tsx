/**
 * Typing Tool Widget & Live Interactive Tester
 * 
 * Demonstrates MAYRA's autonomous typing capability with adjustable speed (Fast/Normal/Slow).
 * Users can test MAYRA typing into fields live in Preview!
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, Zap, Clock, Play, RotateCcw, CheckCircle2, Sparkles, X } from 'lucide-react';
import { TypingToolService, TypingSpeed } from '../../services/tools/typingTool';

interface TypingToolWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypingToolWidget: React.FC<TypingToolWidgetProps> = ({ isOpen, onClose }) => {
  const [speed, setSpeed] = useState<TypingSpeed>('normal');
  const [inputText, setInputText] = useState<string>('MAYRA: Searching weather and traffic updates for Mumbai Central...');
  const [previewValue, setPreviewValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [stats, setStats] = useState<{ charCount: number; durationMs: number } | null>(null);

  const typingService = TypingToolService.getInstance();

  useEffect(() => {
    const handleTypingEvent = (e: any) => {
      if (e.detail?.target === 'widget_preview_input') {
        setPreviewValue(e.detail.text);
      }
    };
    window.addEventListener('mayra-autonomous-typing', handleTypingEvent);
    return () => {
      window.removeEventListener('mayra-autonomous-typing', handleTypingEvent);
    };
  }, []);

  if (!isOpen) return null;

  const handleStartTyping = async () => {
    if (!inputText.trim()) return;
    setPreviewValue('');
    setIsTyping(true);
    setStats(null);

    const res = await typingService.typeText(inputText, {
      speed,
      target: 'widget_preview_input',
      addHumanJitter: true,
      clearFirst: true,
      onProgress: (current) => {
        setPreviewValue(current);
      }
    });

    setIsTyping(false);
    if (res.success) {
      setStats({
        charCount: res.typedText.length,
        durationMs: Math.round(res.durationMs)
      });
    }
  };

  const handlePreset = (text: string) => {
    setInputText(text);
    setPreviewValue('');
    setStats(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg bg-[#0d0d15] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.2)] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 border border-cyan-400/30 rounded-xl">
              <Keyboard className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                MAYRA Autonomous Typing Tool
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">v1.0</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">Natural human-like typing with adjustable speed into any input field</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">1. Typing Speed (Human Cadence)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'fast', label: 'Fast (18ms)', desc: 'Rapid data entry', icon: Zap },
              { id: 'normal', label: 'Normal (48ms)', desc: 'Natural human cadence', icon: Keyboard },
              { id: 'slow', label: 'Slow (110ms)', desc: 'Deliberate demo', icon: Clock }
            ].map((item) => {
              const Icon = item.icon;
              const active = speed === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSpeed(item.id as TypingSpeed)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {item.label}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-3">
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Quick Test Prompts</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Ramesh ko message bhejo: Kal subah meeting hai',
              'Search Google: Latest news on artificial intelligence in India',
              'Form input: Name = Zafer, City = Mumbai, Role = Lead Architect'
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePreset(p)}
                className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-cyan-300/80 border border-white/5 transition-all text-left truncate max-w-full cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">2. Text for MAYRA to Type</label>
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type text for MAYRA to type..."
            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400"
          />
        </div>

        {/* LIVE SIMULATED TARGET INPUT */}
        <div className="mb-4 p-3.5 bg-black/60 border border-cyan-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-cyan-300 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Target Field (Input Simulation)
            </span>
            {isTyping && (
              <span className="text-[10px] font-mono text-fuchsia-400 animate-pulse">
                MAYRA TYPING...
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={previewValue}
              placeholder="MAYRA will type here..."
              className="w-full bg-[#141420] border border-cyan-400/40 rounded-lg p-2.5 text-xs text-cyan-200 font-mono pr-8"
            />
            {isTyping && (
              <span className="absolute right-2.5 top-2.5 w-2 h-4 bg-cyan-400 animate-ping" />
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Typing Complete!
            </span>
            <span>{stats.charCount} chars in {stats.durationMs}ms</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setPreviewValue('')}
            className="px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
          >
            Clear Field
          </button>
          <button
            onClick={handleStartTyping}
            disabled={isTyping || !inputText.trim()}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isTyping ? 'Typing in Progress...' : 'Start Autonomous Typing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
