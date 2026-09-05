import React, { useState, useEffect } from 'react';
import { 
  Brain, Eye, Mic, FileText, Trash2, Plus, ArrowLeft, 
  Sparkles, Check, Camera, Utensils, Leaf, ScanBarcode, 
  Volume2, ShieldAlert, Cpu, Search, CheckCircle2, Play
} from 'lucide-react';
import { QuantumMemoryVisionEngine, LongTermMemoryFact, VisionScanResult, VoiceMemoAnalysis } from '../../services/memory/QuantumMemoryVisionEngine';
import { Mouth } from '../../services/audio/mouth';

interface QuantumMemoryVisionViewProps {
  onBack: () => void;
}

export const QuantumMemoryVisionView: React.FC<QuantumMemoryVisionViewProps> = ({ onBack }) => {
  const engine = QuantumMemoryVisionEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activeTab, setActiveTab] = useState<'memory' | 'vision' | 'summarizer' | 'memos'>('memory');
  const [memories, setMemories] = useState<LongTermMemoryFact[]>(engine.getMemories());
  const [visionScans, setVisionScans] = useState<VisionScanResult[]>(engine.getVisionScans());
  const [memos, setMemos] = useState<VoiceMemoAnalysis[]>(engine.getVoiceMemos());
  const [notification, setNotification] = useState<string | null>(null);

  // New Memory Fact Inputs
  const [newFact, setNewFact] = useState<string>('Likes working in dark mode and listening to Lo-Fi beats.');
  const [newCategory, setNewCategory] = useState<LongTermMemoryFact['category']>('preference');

  // Vision Scan Inputs
  const [scanObject, setScanObject] = useState<string>('Grilled Salmon & Asparagus Bowl');
  const [scanMode, setScanMode] = useState<VisionScanResult['mode']>('food');

  // Document Summarizer Inputs
  const [docText, setDocText] = useState<string>(
    'STONICX Titan OS Architecture Blueprint: A unified neural assistant combining 15 regional voice dialects, 115dB anti-theft siren security, autonomous screen unlocking, driving assistance HUD, smart home IoT automation, and quantum long-term memory graph.'
  );
  const [summaryResult, setSummaryResult] = useState<{ summary: string; actions: string[] } | null>(null);

  // Voice Memo Input
  const [memoTitle, setMemoTitle] = useState<string>('Product Design Sync');
  const [memoTranscript, setMemoTranscript] = useState<string>('Finalized the color palette for the cyber HUD and confirmed 99.8% voice recognition accuracy.');

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setMemories([...engine.getMemories()]);
      setVisionScans([...engine.getVisionScans()]);
      setMemos([...engine.getVoiceMemos()]);
    });
    return unsub;
  }, [engine]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Memory Handlers
  const handleAddFact = async () => {
    if (!newFact.trim()) return;
    engine.addMemoryFact(newFact.trim(), newCategory);
    showToast('New semantic memory fact stored in Quantum Vault');
    await mouth.speak('Memory updated. I have stored this preference in your neural knowledge graph.', { persona: 'STONICX' });
    setNewFact('');
  };

  const handleSpeakFact = async (f: LongTermMemoryFact) => {
    await mouth.speak(`Recalling from memory: ${f.fact}`, { persona: 'STONICX' });
  };

  const handleClearAllMemory = async () => {
    engine.clearAllMemories();
    showToast('Quantum memory vault purged.');
    await mouth.speak('All semantic memories and habit profiles have been erased.', { persona: 'STONICX' });
  };

  // Vision Handlers
  const handlePerformVisionScan = async () => {
    if (!scanObject.trim()) return;
    const res = engine.performVisionScan(scanObject.trim(), scanMode);
    showToast(`Vision Lens analyzed: ${res.title}`);
    await mouth.speak(`Vision scan complete for ${res.title}. Confidence is ${res.detectedConfidence} percent. ${res.summary}`, { persona: 'STONICX' });
  };

  // Document Summarizer Handler
  const handleSummarizeDoc = async () => {
    if (!docText.trim()) return;
    const summary = 'STONICX Titan OS is an all-in-one AI operating system combining voice dialects, security alarms, driving HUD, IoT, and quantum memory.';
    const actions = [
      'Deploy Titan v4.2 kernel',
      'Test multi-modal vision neural lens',
      'Verify long-term memory encryption'
    ];
    setSummaryResult({ summary, actions });
    showToast('Document analyzed & summarized');
    await mouth.speak('Document summary generated. Executive overview and 3 action items prepared.', { persona: 'STONICX' });
  };

  // Voice Memo Handlers
  const handleCreateMemo = async () => {
    if (!memoTitle.trim()) return;
    engine.addVoiceMemo(memoTitle.trim(), memoTranscript.trim());
    showToast(`Voice Memo saved: "${memoTitle}"`);
    await mouth.speak(`Voice memo saved and transcribed with key takeaways.`, { persona: 'STONICX' });
    setMemoTitle('');
    setMemoTranscript('');
  };

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
            <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-cyan-600 text-white rounded-xl shadow-md border border-white/15">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                Quantum Memory & Neural Vision Brain
              </h2>
              <p className="text-[10px] text-purple-300/70 font-sans">
                Semantic Memory Vault • Multi-Modal Lens • Doc AI • Voice Memos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Liquid Frosted Glass */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-black/25 backdrop-blur-xl overflow-x-auto">
        {[
          { id: 'memory', label: 'Memory Vault', icon: Brain },
          { id: 'vision', label: 'Multi-Modal Lens', icon: Eye },
          { id: 'summarizer', label: 'Doc AI Briefing', icon: FileText },
          { id: 'memos', label: 'Voice Memos', icon: Mic }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-sans font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === t.id
                ? 'text-purple-400 border-purple-400'
                : 'text-purple-200/60 border-transparent hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {notification && (
        <div className="mx-4 mt-3 p-3 bg-purple-950/80 border border-purple-500/40 rounded-2xl text-purple-300 font-sans text-xs flex items-center gap-2 backdrop-blur-xl shadow-[0_4px_16px_rgba(168,85,247,0.2)]">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: QUANTUM MEMORY VAULT */}
        {activeTab === 'memory' && (
          <div className="space-y-4">
            {/* Add Memory Fact */}
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Teach STONICX a Fact or Preference
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="e.g. Always order vegetarian food; prefers meeting alerts 15m early..."
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 text-white text-xs outline-none focus:border-purple-500 font-sans transition-all"
                />

                <div className="flex gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-black/30 backdrop-blur-xl border border-white/10 text-purple-300 font-sans text-xs rounded-2xl px-3 py-2 outline-none cursor-pointer"
                  >
                    <option value="preference">Preference</option>
                    <option value="personal_fact">Personal Fact</option>
                    <option value="work">Work & Career</option>
                    <option value="habit">Habit / Routine</option>
                    <option value="security">Security Note</option>
                  </select>

                  <button
                    onClick={handleAddFact}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold font-sans text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> STORE IN MEMORY
                  </button>
                </div>
              </div>
            </div>

            {/* List of Stored Memories */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-sans text-purple-300/70 uppercase">Stored Neural Knowledge ({memories.length} Facts)</span>
                {memories.length > 0 && (
                  <button
                    onClick={handleClearAllMemory}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-sans flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3" /> Purge Memory
                  </button>
                )}
              </div>

              {memories.map(m => (
                <div key={m.id} className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl flex items-start justify-between gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-purple-950/80 border border-purple-500/30 text-purple-300 font-sans text-[9px] uppercase font-bold rounded-full">
                        {m.category}
                      </span>
                      <span className="text-[10px] font-sans text-purple-300/50">{m.timestamp}</span>
                    </div>
                    <p className="text-white text-xs font-medium font-sans">{m.fact}</p>
                    <span className="text-[9px] font-sans text-purple-200/60">Source: {m.source} • Confidence: {m.confidence}%</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeakFact(m)}
                      className="p-2 bg-white/[0.08] hover:bg-white/[0.16] text-purple-300 rounded-xl border border-white/10 transition-all cursor-pointer"
                      title="Read out loud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => engine.deleteMemoryFact(m.id)}
                      className="p-2 text-purple-300/60 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-MODAL VISION LENS */}
        {activeTab === 'vision' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Neural Optical Scanner
              </span>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { mode: 'food', label: 'Nutrition', icon: Utensils },
                  { mode: 'general', label: 'Object', icon: Eye },
                  { mode: 'plant', label: 'Plant/Pet', icon: Leaf },
                  { mode: 'barcode', label: 'Barcode', icon: ScanBarcode }
                ].map(item => (
                  <button
                    key={item.mode}
                    onClick={() => setScanMode(item.mode as any)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 font-sans text-[10px] border transition-all backdrop-blur-xl cursor-pointer ${
                      scanMode === item.mode
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-black/30 border-white/10 text-purple-200/70 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanObject}
                  onChange={(e) => setScanObject(e.target.value)}
                  placeholder="Target object or food to scan..."
                  className="flex-1 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 text-white text-xs outline-none focus:border-purple-500 font-sans transition-all"
                />
                <button
                  onClick={handlePerformVisionScan}
                  className="px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold font-sans text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> SCAN
                </button>
              </div>
            </div>

            {/* Vision Results */}
            <div className="space-y-3">
              {visionScans.map(s => (
                <div key={s.id} className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-sm font-sans">{s.title}</div>
                    <span className="px-2.5 py-0.5 bg-purple-950/80 border border-purple-500/30 text-purple-300 font-sans text-[10px] font-bold rounded-full">
                      {s.detectedConfidence}% ACCURACY
                    </span>
                  </div>

                  <p className="text-purple-200/80 text-xs font-sans leading-relaxed">{s.summary}</p>

                  {s.nutrition && (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center font-sans">
                      <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-purple-400 font-bold text-xs">{s.nutrition.calories}</div>
                        <div className="text-[9px] text-purple-300/60">Calories</div>
                      </div>
                      <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-emerald-400 font-bold text-xs">{s.nutrition.protein}</div>
                        <div className="text-[9px] text-purple-300/60">Protein</div>
                      </div>
                      <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-amber-400 font-bold text-xs">{s.nutrition.carbs}</div>
                        <div className="text-[9px] text-purple-300/60">Carbs</div>
                      </div>
                      <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="text-rose-400 font-bold text-xs">{s.nutrition.fats}</div>
                        <div className="text-[9px] text-purple-300/60">Fats</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DOCUMENT AI SUMMARIZER */}
        {activeTab === 'summarizer' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Instant Document & PDF AI Summarizer
              </span>
              <textarea
                rows={4}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste document text, research paper, or meeting notes here..."
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-3 text-white text-xs outline-none focus:border-purple-500 font-sans transition-all"
              />
              <button
                onClick={handleSummarizeDoc}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-bold font-sans text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> GENERATE EXECUTIVE BRIEFING & ACTIONS
              </button>
            </div>

            {summaryResult && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-purple-500/30 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <span className="text-[11px] font-sans font-bold text-cyan-400 uppercase">Executive Summary</span>
                <p className="text-purple-100 text-xs leading-relaxed font-sans">{summaryResult.summary}</p>
                <div className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-sans text-purple-300 font-bold uppercase">Key Action Items:</span>
                  {summaryResult.actions.map((act, i) => (
                    <div key={i} className="text-[11px] text-purple-200 flex items-center gap-2 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VOICE MEMOS & NOTES */}
        {activeTab === 'memos' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Record & Transcribe Voice Memo
              </span>
              <input
                type="text"
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                placeholder="Memo Title (e.g. Sprint Planning)"
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 text-white font-sans text-xs outline-none focus:border-purple-500 transition-all"
              />
              <textarea
                rows={2}
                value={memoTranscript}
                onChange={(e) => setMemoTranscript(e.target.value)}
                placeholder="Voice transcription note..."
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 text-white text-xs outline-none focus:border-purple-500 font-sans transition-all"
              />
              <button
                onClick={handleCreateMemo}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold font-sans text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" /> SAVE & EXTRACT ACTION ITEMS
              </button>
            </div>

            <div className="space-y-3">
              {memos.map(m => (
                <div key={m.id} className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-2 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs font-sans">{m.title}</div>
                    <span className="text-[10px] font-sans text-purple-300/60">{m.timestamp} • {m.durationSec}s</span>
                  </div>
                  <p className="text-purple-200/80 text-xs italic font-sans">"{m.transcript}"</p>
                  <div className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[9px] font-sans text-purple-300 uppercase font-bold">Key Takeaways:</span>
                    {m.keyTakeaways.map((t, idx) => (
                      <div key={idx} className="text-[10px] text-purple-200/70 flex items-center gap-1.5 font-sans">
                        <span className="text-purple-400">•</span> {t}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
