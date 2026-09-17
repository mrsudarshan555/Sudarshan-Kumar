import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Search, Check, Plus, ExternalLink, 
  Link as LinkIcon, RefreshCw, Sparkles, Shield
} from 'lucide-react';
import { IntegrationItem } from '../../types';

interface ConnectorsViewProps {
  onBack: () => void;
}

interface ConnectorItem {
  id: string;
  name: string;
  description: string;
  category: string;
  isConnected: boolean;
  color: string;
  letter: string;
}

const CONNECTORS_LIST: ConnectorItem[] = [
  { id: 'groq', name: 'Groq', description: 'Ultra fast LPUs inference', category: 'AI', isConnected: true, color: '#f55036', letter: 'G' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o & o1 reasoning engines', category: 'AI', isConnected: true, color: '#10a37f', letter: 'O' },
  { id: 'claude', name: 'Claude', description: 'Anthropic Claude 3.5 Sonnet', category: 'AI', isConnected: true, color: '#cc785c', letter: 'C' },
  { id: 'perplexity', name: 'Perplexity', description: 'Live web radar search engine', category: 'Search', isConnected: false, color: '#20b2aa', letter: 'P' },
  { id: 'tavily', name: 'Tavily AI', description: 'Deep Research grounding agent', category: 'Search', isConnected: true, color: '#4f46e5', letter: 'T' },
  { id: 'deepseek', name: 'DeepSeek', description: 'V3 & R1 mathematical reasoning', category: 'AI', isConnected: true, color: '#0ea5e9', letter: 'D' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Universal LLM aggregation mesh', category: 'AI', isConnected: true, color: '#6366f1', letter: 'R' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Ultra-realistic human neural speech', category: 'Voice', isConnected: false, color: '#000000', letter: 'E' },
  { id: 'replicate', name: 'Replicate', description: 'FLUX image & diffusion models', category: 'Vision', isConnected: false, color: '#ec4899', letter: 'F' },
  { id: 'notion', name: 'Notion', description: 'Sync notes, databases & daily tasks', category: 'Productivity', isConnected: false, color: '#000000', letter: 'N' },
  { id: 'slack', name: 'Slack', description: 'Work channels & DM autonomous bot', category: 'Work', isConnected: false, color: '#4a154b', letter: 'S' },
  { id: 'microsoft', name: 'Microsoft 365', description: 'Outlook, Teams & OneDrive bridge', category: 'Work', isConnected: false, color: '#0078d4', letter: 'M' },
  { id: 'youtube', name: 'YouTube Data', description: 'Summarize videos & search channels', category: 'Media', isConnected: true, color: '#ff0000', letter: 'Y' },
  { id: 'spotify', name: 'Spotify Web API', description: 'Hands-free voice playback & playlists', category: 'Media', isConnected: false, color: '#1db954', letter: 'S' },
  { id: 'telegram', name: 'Telegram Bot', description: 'Remote terminal & alert broadcaster', category: 'Social', isConnected: false, color: '#229ed9', letter: 'T' },
  { id: 'home_assistant', name: 'Home Assistant', description: 'Zigbee/Z-Wave local IoT appliances', category: 'IoT', isConnected: false, color: '#03a9f4', letter: 'H' },
  { id: 'alpha_vantage', name: 'Alpha Vantage', description: 'Real-time equity & forex telemetry', category: 'Finance', isConnected: false, color: '#10b981', letter: 'A' }
];

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Connected' | 'Not Connected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectors, setConnectors] = useState<ConnectorItem[]>(CONNECTORS_LIST);

  const toggleConnection = (id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, isConnected: !c.isConnected } : c));
  };

  const filteredConnectors = connectors.filter(c => {
    if (activeTab === 'Connected' && !c.isConnected) return false;
    if (activeTab === 'Not Connected' && c.isConnected) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-white tracking-wide">
            Connectors
          </h1>
          <p className="text-[11px] text-gray-400">
            Checking connections...
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none pb-24">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connectors..."
            className="w-full bg-[#15161d] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-400/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['All', 'Connected', 'Not Connected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-[#15161d] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Connectors Grid / List */}
        <div className="space-y-2.5">
          {filteredConnectors.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 hover:border-white/10 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner"
                  style={{ backgroundColor: item.color }}
                >
                  {item.letter}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    {item.name}
                    <span className="px-1.5 py-0.2 rounded bg-white/5 text-gray-400 text-[9px]">
                      {item.category}
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleConnection(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  item.isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#181922] text-gray-300 hover:text-white border border-white/10 hover:border-purple-400/50'
                }`}
              >
                {item.isConnected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
