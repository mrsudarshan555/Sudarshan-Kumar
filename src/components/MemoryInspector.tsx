import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types';
import { Database, Plus, Search, Brain, Sparkles, FileText, Calendar, Table, Check, RefreshCw, Save, Layers } from 'lucide-react';
import { MemoryVaultManager } from '../services/memory/memoryVaultManager';

export const MemoryInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault_docs' | 'facts_db'>('vault_docs');
  const [activeDocName, setActiveDocName] = useState<'MEMORY.md' | 'DAILY-NOTE.md' | 'VAULT-INDEX.md'>('MEMORY.md');
  const [docContent, setDocContent] = useState<string>('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('user_preference');
  const [query, setQuery] = useState('');

  // Load active markdown document from Vault Manager
  const loadVaultDoc = async (docName: 'MEMORY.md' | 'DAILY-NOTE.md' | 'VAULT-INDEX.md') => {
    const vault = MemoryVaultManager.getInstance();
    await vault.initializeVault();
    const content = vault.getDocument(docName);
    setDocContent(content);
    setActiveDocName(docName);
  };

  const handleSaveDoc = async () => {
    setIsSavingDoc(true);
    try {
      const vault = MemoryVaultManager.getInstance();
      await vault.setDocument(activeDocName, docContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[MemoryInspector] Error saving markdown doc:', err);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultDoc('MEMORY.md');
    fetchMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category })
      });
      const data = await res.json();
      if (data.success) {
        setKey('');
        setValue('');
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const filteredMemories = memories.filter(
    m => m.key.toLowerCase().includes(query.toLowerCase()) || m.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#07070b] border border-white/10 rounded-2xl overflow-hidden p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              MAYRA AI Memory Vault
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Unified Markdown Storage (MEMORY.md • DAILY-NOTE.md • VAULT-INDEX.md)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center bg-black/60 border border-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('vault_docs')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeTab === 'vault_docs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Markdown Vault
            </button>
            <button
              onClick={() => setActiveTab('facts_db')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeTab === 'facts_db'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Context Facts DB
            </button>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync Active &lt;50ms
          </span>
        </div>
      </div>

      {activeTab === 'vault_docs' ? (
        /* Markdown Vault Document Editor View */
        <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
          {/* Doc Selector Toolbar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadVaultDoc('MEMORY.md')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  activeDocName === 'MEMORY.md'
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                MEMORY.md
              </button>

              <button
                onClick={() => loadVaultDoc('DAILY-NOTE.md')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  activeDocName === 'DAILY-NOTE.md'
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                DAILY-NOTE.md
              </button>

              <button
                onClick={() => loadVaultDoc('VAULT-INDEX.md')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  activeDocName === 'VAULT-INDEX.md'
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                VAULT-INDEX.md
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadVaultDoc(activeDocName)}
                className="px-2.5 py-1.5 bg-black/40 hover:bg-white/5 border border-white/10 rounded-lg text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                title="Reload note from storage"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
              </button>

              <button
                onClick={handleSaveDoc}
                disabled={isSavingDoc}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {isSavingDoc ? 'Saving...' : 'Save Document'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="flex-1 bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-[#0b0b14] px-4 py-2 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Path: /vault/{activeDocName}</span>
              <span>Obsidian-Compliant Markdown Note</span>
            </div>
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="flex-1 w-full p-4 bg-transparent text-xs font-mono text-slate-200 outline-none resize-none leading-relaxed focus:bg-black/60 transition-colors"
              placeholder="# Enter markdown content..."
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        /* Context Facts DB View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 flex-1 overflow-hidden">
          {/* Memory Creation Form */}
          <div className="bg-[#0b0b12] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-400" /> Add Context Fact
            </h3>

            <form onSubmit={handleAddMemory} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Key / Topic</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. Assistant Name"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Value / Memory Content</label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. User prefers Python and React with TypeScript."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none font-mono"
                >
                  <option value="user_preference">User Preference</option>
                  <option value="system_config">System Configuration</option>
                  <option value="context_fact">Context Fact</option>
                  <option value="routine">Routine</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors"
              >
                Store Memory Fact
              </button>
            </form>
          </div>

          {/* Memory List Inspector */}
          <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stored memory keys or content..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredMemories.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500 border border-white/5 rounded-xl">
                  No memories stored. Memory facts are automatically synchronized with the Markdown Vault.
                </div>
              ) : (
                filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3.5 bg-[#0a0a0e] border border-white/10 rounded-xl hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-cyan-400">{mem.key}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        {mem.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{mem.value}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
