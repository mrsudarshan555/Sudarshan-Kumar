import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Key, Cpu, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Zap, Bot, Activity,
  Lock, Sparkles, Sliders, BatteryCharging, Radio, VolumeX
} from 'lucide-react';
import { EchoGuardService } from '../../services/voice/echoGuardService';

interface AIProviderFallbackViewProps {
  onBack: () => void;
}

export const AIProviderFallbackView: React.FC<AIProviderFallbackViewProps> = ({ onBack }) => {
  // Provider Keys
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => localStorage.getItem('mayra_openrouter_key') || '');
  const [nvidiaKey, setNvidiaKey] = useState<string>(() => localStorage.getItem('mayra_nvidia_key') || '');
  const [anthropicKey, setAnthropicKey] = useState<string>(() => localStorage.getItem('mayra_anthropic_key') || '');

  // Models
  const [openRouterModel, setOpenRouterModel] = useState<string>('meta-llama/llama-3.3-70b-instruct');
  const [nvidiaModel, setNvidiaModel] = useState<string>('meta/llama-3.3-70b-instruct');
  const [anthropicModel, setAnthropicModel] = useState<string>('claude-3-5-haiku-20241022');

  // Test statuses: 'idle' | 'testing' | 'success' | 'error'
  const [orStatus, setOrStatus] = useState<{ state: string; msg?: string }>({ state: 'idle' });
  const [nvStatus, setNvStatus] = useState<{ state: string; msg?: string }>({ state: 'idle' });
  const [antStatus, setAntStatus] = useState<{ state: string; msg?: string }>({ state: 'idle' });

  // Echo Guard & Edge Glow state
  const echoGuard = EchoGuardService.getInstance();
  const [echoGuardEnabled, setEchoGuardEnabled] = useState<boolean>(() => echoGuard.getIsEnabled());
  const [edgeGlowEnabled, setEdgeGlowEnabled] = useState<boolean>(() => localStorage.getItem('mayra_edge_glow') !== 'false');
  const [batterySaverGlow, setBatterySaverGlow] = useState<boolean>(() => localStorage.getItem('mayra_glow_battery_saver') === 'true');

  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const handleSaveKeys = () => {
    localStorage.setItem('mayra_openrouter_key', openRouterKey.trim());
    localStorage.setItem('mayra_nvidia_key', nvidiaKey.trim());
    localStorage.setItem('mayra_anthropic_key', anthropicKey.trim());
    localStorage.setItem('mayra_edge_glow', String(edgeGlowEnabled));
    localStorage.setItem('mayra_glow_battery_saver', String(batterySaverGlow));
    echoGuard.setEnabled(echoGuardEnabled);

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const testProvider = async (provider: 'openrouter' | 'nvidia' | 'anthropic') => {
    let key = '';
    let model = '';
    let setFn: (s: { state: string; msg?: string }) => void;

    if (provider === 'openrouter') {
      key = openRouterKey;
      model = openRouterModel;
      setFn = setOrStatus;
    } else if (provider === 'nvidia') {
      key = nvidiaKey;
      model = nvidiaModel;
      setFn = setNvStatus;
    } else {
      key = anthropicKey;
      model = anthropicModel;
      setFn = setAntStatus;
    }

    if (!key.trim()) {
      setFn({ state: 'error', msg: 'Please enter an API Key first' });
      return;
    }

    setFn({ state: 'testing' });

    try {
      const res = await fetch('/api/ai/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: key.trim(), model })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFn({ state: 'success', msg: data.message || 'Operational' });
      } else {
        setFn({ state: 'error', msg: data.error || 'Provider rejected request' });
      }
    } catch (e: any) {
      setFn({ state: 'error', msg: e.message || 'Connection network error' });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Multiple AI Provider Fallback</h2>
              <p className="text-[10px] text-slate-400 font-sans">Automatic failover when Gemini hits rate-limits</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveKeys}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
        >
          Save All
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">

        {savedBanner && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>AI Provider Fallback Configuration Saved Successfully.</span>
          </div>
        )}

        {/* Explain Failover Matrix */}
        <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-[#0e1022] to-cyan-950/40 border border-purple-500/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Seamless Failover Matrix
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              AUTO-ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            MAYRA uses Gemini as primary. If Gemini triggers quota or 429 rate-limit errors,
            the engine instantly routes your request to your configured alternate keys below 
            without dropping conversational context.
          </p>
        </div>

        {/* 1. Primary Engine Status */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-slate-200">1. PRIMARY: Google Gemini Engine</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
              Built-in
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Default AI Model: Gemini 2.5 Flash / Pro (Server Managed)
          </p>
        </div>

        {/* 2. Provider 1: OpenRouter */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-mono font-bold text-purple-300">2. FALLBACK 1: OpenRouter Matrix</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">Multi-Model Gateway</span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">OpenRouter API Key</label>
            <div className="relative">
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-purple-500 pr-24"
              />
              <button
                type="button"
                onClick={() => testProvider('openrouter')}
                disabled={orStatus.state === 'testing'}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {orStatus.state === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Activity className="w-3 h-3" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Preferred Model</label>
            <select
              value={openRouterModel}
              onChange={(e) => setOpenRouterModel(e.target.value)}
              className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-xs text-slate-300 font-mono outline-none"
            >
              <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct (Free/Low Latency)</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="mistralai/mistral-large-2407">Mistral Large 2407</option>
              <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (OpenRouter)</option>
            </select>
          </div>

          {orStatus.state !== 'idle' && (
            <div className={`p-2 rounded-xl text-[10px] font-mono flex items-center gap-1.5 ${
              orStatus.state === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' :
              orStatus.state === 'error' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' :
              'bg-blue-950/60 text-blue-300 border border-blue-500/30'
            }`}>
              {orStatus.state === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{orStatus.msg || 'Testing connection...'}</span>
            </div>
          )}
        </div>

        {/* 3. Provider 2: NVIDIA NIM */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-300">3. FALLBACK 2: NVIDIA NIM (Inference Microservice)</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">High Speed Cloud</span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">NVIDIA NIM API Key</label>
            <div className="relative">
              <input
                type="password"
                value={nvidiaKey}
                onChange={(e) => setNvidiaKey(e.target.value)}
                placeholder="nvapi-..."
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500 pr-24"
              />
              <button
                type="button"
                onClick={() => testProvider('nvidia')}
                disabled={nvStatus.state === 'testing'}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {nvStatus.state === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Activity className="w-3 h-3" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">NVIDIA NIM Model</label>
            <select
              value={nvidiaModel}
              onChange={(e) => setNvidiaModel(e.target.value)}
              className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-xs text-slate-300 font-mono outline-none"
            >
              <option value="meta/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
              <option value="nvidia/llama-3.1-nemotron-70b-instruct">NVIDIA Nemotron 70B Instruct</option>
              <option value="mistralai/mistral-large-2-instruct">Mistral Large 2</option>
            </select>
          </div>

          {nvStatus.state !== 'idle' && (
            <div className={`p-2 rounded-xl text-[10px] font-mono flex items-center gap-1.5 ${
              nvStatus.state === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' :
              nvStatus.state === 'error' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' :
              'bg-blue-950/60 text-blue-300 border border-blue-500/30'
            }`}>
              {nvStatus.state === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{nvStatus.msg || 'Testing connection...'}</span>
            </div>
          )}
        </div>

        {/* 4. Provider 3: Anthropic Claude */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-cyan-300">4. FALLBACK 3: Anthropic Claude</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">Direct API</span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Anthropic API Key</label>
            <div className="relative">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500 pr-24"
              />
              <button
                type="button"
                onClick={() => testProvider('anthropic')}
                disabled={antStatus.state === 'testing'}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                {antStatus.state === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Activity className="w-3 h-3" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Claude Model</label>
            <select
              value={anthropicModel}
              onChange={(e) => setAnthropicModel(e.target.value)}
              className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-xs text-slate-300 font-mono outline-none"
            >
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast & Cost Efficient)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            </select>
          </div>

          {antStatus.state !== 'idle' && (
            <div className={`p-2 rounded-xl text-[10px] font-mono flex items-center gap-1.5 ${
              antStatus.state === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' :
              antStatus.state === 'error' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' :
              'bg-blue-950/60 text-blue-300 border border-blue-500/30'
            }`}>
              {antStatus.state === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{antStatus.msg || 'Testing connection...'}</span>
            </div>
          )}
        </div>

        {/* 5. ECHO GUARD & EDGE GLOW CONTROLS */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Voice Echo Guard & Edge Glow
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Echo Guard (Auto-Mute Mic)</div>
                <div className="text-[10px] text-slate-400">Automatically mutes microphone while MAYRA speaks to stop acoustic feedback</div>
              </div>
              <input
                type="checkbox"
                checked={echoGuardEnabled}
                onChange={(e) => setEchoGuardEnabled(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Edge Glow Ambient Ring</div>
                <div className="text-[10px] text-slate-400">Visual gradient perimeter ring indicating active listening & speaking states</div>
              </div>
              <input
                type="checkbox"
                checked={edgeGlowEnabled}
                onChange={(e) => setEdgeGlowEnabled(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div>
                <div className="text-white font-medium text-xs">Battery Saver for Edge Glow</div>
                <div className="text-[10px] text-slate-400">Reduces gradient blur complexity to conserve phone battery</div>
              </div>
              <input
                type="checkbox"
                checked={batterySaverGlow}
                onChange={(e) => setBatterySaverGlow(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
