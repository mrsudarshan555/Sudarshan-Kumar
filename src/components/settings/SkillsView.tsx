import React, { useState } from 'react';
import { SkillItem } from '../../types';
import { 
  Wrench, Globe, FileText, Monitor, Cpu, 
  CheckCircle2, Plus, Search, Shield, ChevronRight, Sparkles, Store, ArrowLeft
} from 'lucide-react';

interface SkillsViewProps {
  skills: SkillItem[];
  onToggleSkill: (skillId: string) => void;
  onBack: () => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  skills,
  onToggleSkill,
  onBack
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoreSheet, setShowStoreSheet] = useState(false);

  const categories = ['all', 'Intelligence', 'Vision', 'Productivity', 'System', 'Development'];

  const filteredSkills = skills.filter((s) => {
    const matchesCategory = filterCategory === 'all' || s.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSkillIcon = (id: string) => {
    switch (id) {
      case 'skill-web-search': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'skill-screen-vision': return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'skill-file-doc': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'skill-device-automation': return <Cpu className="w-4 h-4 text-purple-400" />;
      default: return <Wrench className="w-4 h-4 text-emerald-400" />;
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
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">MAYRA Skills & Tools</h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Installed Plugins & Capabilities</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowStoreSheet(true)}
          className="text-[10px] font-sans text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-900/60 transition-colors cursor-pointer"
        >
          <Store className="w-3 h-3" /> Skill Store
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Search Bar - Magnifying Glass */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-purple-300/70 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search installed skills or tools..."
            className="w-full bg-black/40 border border-white/15 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-300/50 outline-none focus:border-purple-400 font-sans backdrop-blur-md"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-purple-600/40 border border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-black/30 text-purple-300/70 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills Cards - Magnifying Glass */}
        <div className="space-y-3">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={`p-4 bg-black/35 backdrop-blur-2xl border rounded-3xl transition-all space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] ${
                skill.enabled ? 'border-purple-500/40' : 'border-white/10 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-black/40 rounded-2xl border border-white/10">
                    {getSkillIcon(skill.id)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      {skill.name}
                      <span className="text-[8px] font-mono text-purple-300/70 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-400/30">
                        v{skill.version}
                      </span>
                    </div>
                    <div className="text-[9px] font-sans text-purple-300">{skill.category} • by {skill.author}</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={skill.enabled}
                  onChange={() => onToggleSkill(skill.id)}
                  className="w-4 h-4 accent-purple-500 rounded mt-1 cursor-pointer"
                />
              </div>

              <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
                {skill.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1 border-t border-white/10">
                <span className="text-[8px] font-sans text-purple-300/60 uppercase mr-1">Permissions:</span>
                {skill.permissionsRequired.map((perm) => (
                  <span
                    key={perm}
                    className="text-[8px] font-sans text-purple-200/80 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skill Store Sheet Simulation - Magnifying Glass */}
        {showStoreSheet && (
          <div className="p-4 bg-black/60 backdrop-blur-3xl border border-purple-500/40 rounded-3xl space-y-3 animate-in fade-in shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
                <Store className="w-4 h-4" /> MAYRA Skill Hub (Future Store)
              </span>
              <button onClick={() => setShowStoreSheet(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
                Close
              </button>
            </div>
            <p className="text-[11px] text-purple-200/80">
              Future integration pipeline to install community-verified skills, MCP servers, and custom tool bridges.
            </p>
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <div className="text-white font-medium">Home Assistant BLE Bridge</div>
                <div className="text-[9px] text-purple-300/70">Control 50+ smart home brands</div>
              </div>
              <span className="text-[9px] font-sans text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                Coming Phase 3+
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
