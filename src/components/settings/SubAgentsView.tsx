import React from 'react';
import { SubAgentItem } from '../../types';
import { 
  Bot, Terminal, Search, ShieldAlert, 
  Eye, Zap, ShieldCheck, Lock, Play, Cpu, ArrowLeft
} from 'lucide-react';

interface SubAgentsViewProps {
  subAgents: SubAgentItem[];
  onToggleAgent: (agentId: string) => void;
  onBack: () => void;
}

export const SubAgentsView: React.FC<SubAgentsViewProps> = ({
  subAgents,
  onToggleAgent,
  onBack
}) => {
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'agent-stonicx': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'agent-coding': return <Terminal className="w-4 h-4 text-purple-400" />;
      case 'agent-research': return <Search className="w-4 h-4 text-blue-400" />;
      case 'agent-code-runner': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'agent-sentinel': return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'agent-vision': return <Eye className="w-4 h-4 text-pink-400" />;
      default: return <Bot className="w-4 h-4 text-emerald-400" />;
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
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Sub-Agents</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Multi-Agent Task Orchestration</p>
            </div>
          </div>
        </div>

        <span className="text-[9px] font-sans text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
          Architecture Ready
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        <p className="text-[11px] text-purple-200/70 leading-relaxed font-sans">
          MAYRA delegates specialized background tasks, code refactoring, and multi-query research to dedicated sub-agents.
        </p>

        {/* Sub-Agent Cards */}
        <div className="space-y-3">
          {subAgents.map((agent) => (
            <div
              key={agent.id}
              className={`p-4 bg-black/35 backdrop-blur-2xl border rounded-3xl transition-all space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                agent.enabled ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                    {getAgentIcon(agent.id)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs flex items-center gap-1.5 font-sans">
                      {agent.name}
                    </div>
                    <div className="text-[9px] font-sans text-indigo-400">{agent.role}</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={agent.enabled}
                  onChange={() => onToggleAgent(agent.id)}
                  className="w-4 h-4 accent-indigo-500 rounded mt-1 cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-purple-100/90 leading-relaxed font-sans">
                {agent.description}
              </p>

              {/* Capabilities & Sandbox Status */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] font-sans">
                <div className="flex items-center gap-1 text-purple-200/70">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Sandboxed Execution</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-purple-300/50">Priority:</span>
                  <span className={`uppercase font-bold ${
                    agent.priority === 'high' ? 'text-purple-400' : 'text-blue-400'
                  }`}>
                    {agent.priority}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-[8px] font-sans text-purple-200/80 bg-black/30 backdrop-blur-xl border border-white/10 px-2.5 py-0.5 rounded-full"
                  >
                    • {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
