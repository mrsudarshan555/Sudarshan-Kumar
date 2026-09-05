import React, { useState } from 'react';
import { MemoryItem, ChatMessage } from '../../types';
import { 
  Download, Upload, Trash2, Database, 
  CheckCircle2, AlertTriangle, HardDrive, FileJson, Clock, RefreshCw, ArrowLeft,
  Package, ShieldCheck
} from 'lucide-react';
import { MemoryBackupService } from '../../services/memory/memoryBackupService';

interface BackupViewProps {
  memories: MemoryItem[];
  messages: ChatMessage[];
  onClearAllData: () => void;
  onRestoreData: (restoredMemories: MemoryItem[]) => void;
  onBack: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  memories,
  messages,
  onClearAllData,
  onRestoreData,
  onBack
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string>('Never');

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportComprehensive = () => {
    try {
      const res = MemoryBackupService.getInstance().exportBackup();
      setLastBackup(new Date().toLocaleTimeString());
      showStatus(`Comprehensive backup exported (${res.stats.memoriesCount} memories, ${res.stats.chatMessagesCount} chats, ${res.stats.contactsCount} contacts).`);
    } catch (err: any) {
      showStatus(`Export failed: ${err.message}`);
    }
  };

  const handleExportMemories = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mayra_memories_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setLastBackup(new Date().toLocaleTimeString());
    showStatus(`Exported ${memories.length} context memories.`);
  };

  const handleExportChats = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mayra_chats_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setLastBackup(new Date().toLocaleTimeString());
    showStatus(`Exported ${messages.length} conversation messages.`);
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      const result = await MemoryBackupService.getInstance().restoreBackup(fileText);
      if (result.success) {
        try {
          const parsed = JSON.parse(fileText);
          const data = parsed.data || parsed;
          if (Array.isArray(data.memories)) {
            onRestoreData(data.memories);
          }
        } catch {}
        showStatus(result.message);
      }
    } catch (err: any) {
      showStatus(`Restore failed: ${err?.message || 'Invalid backup file'}`);
    } finally {
      e.target.value = '';
    }
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
            <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Backup & Data Storage</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">On-Device Local Data Governance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Status banner */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-sans flex items-center gap-2 animate-in fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Local Storage Metrics - Magnifying Glass */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-purple-300" /> Local Storage Breakdown
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-[10px] text-purple-300/70 uppercase">Context Memories</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{memories.length} facts</div>
              <div className="text-[9px] text-purple-300/50">~{Math.round(JSON.stringify(memories).length / 1024 * 10) / 10} KB</div>
            </div>

            <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-[10px] text-purple-300/70 uppercase">Chat History</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{messages.length} messages</div>
              <div className="text-[9px] text-purple-300/50">~{Math.round(JSON.stringify(messages).length / 1024 * 10) / 10} KB</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-purple-300/70 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" /> Last Export: {lastBackup}
            </span>
            <span className="text-emerald-400 font-sans">SQLite / Room Ready</span>
          </div>
        </div>

        {/* Export Controls */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Data
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportComprehensive}
              className="w-full p-2.5 bg-black/30 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-white font-medium text-xs flex items-center gap-1.5">
                    <span>Full Comprehensive Backup (.json)</span>
                    <span className="text-[9px] font-sans text-purple-300 bg-purple-900/60 px-1.5 py-0.2 rounded-full border border-purple-400/30">Recommended</span>
                  </div>
                  <div className="text-[9px] text-purple-200/60">All memories, chat history, contacts & settings into one archive</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-purple-300 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={handleExportMemories}
              className="w-full p-2.5 bg-black/30 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-white font-medium text-xs">Export Memories (.json)</div>
                  <div className="text-[9px] text-purple-200/60">Save all personal facts and system preferences</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-purple-300/60 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={handleExportChats}
              className="w-full p-2.5 bg-black/30 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-white font-medium text-xs">Export Chat Logs (.json)</div>
                  <div className="text-[9px] text-purple-200/60">Export conversational transcript history</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-purple-300/60 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Restore Data */}
        <div className="p-3.5 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-purple-400" /> Restore Data from File
          </div>

          <p className="text-[10px] text-purple-200/60">
            Import a previously exported MAYRA JSON backup file to restore memories.
          </p>

          <label className="w-full p-2.5 bg-black/30 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-purple-500/40 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-purple-300 font-sans text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Select Backup File (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Danger Zone: Clear / Reset */}
        <div className="p-3.5 bg-rose-950/20 backdrop-blur-2xl border border-rose-500/25 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-[11px] font-sans font-bold text-rose-400 uppercase flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear All Local Data
          </div>

          <p className="text-[10px] text-rose-200/70">
            Permanently erases all local stored context memories, chats, and customized settings.
          </p>

          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer backdrop-blur-md"
            >
              Clear & Reset MAYRA Data
            </button>
          ) : (
            <div className="p-3.5 bg-black/75 backdrop-blur-3xl border border-rose-500/60 rounded-2xl space-y-2 animate-in fade-in shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <div className="text-xs text-white font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Confirm Irreversible Deletion?
              </div>
              <p className="text-[10px] text-purple-200/80">
                This action cannot be undone. Are you sure?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-sans cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllData();
                    setShowConfirmClear(false);
                    showStatus('All local memories and chats cleared.');
                  }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-sans font-bold cursor-pointer shadow-lg shadow-rose-900/40"
                >
                  Yes, Reset All
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
