import React, { useState } from 'react';
import { 
  Volume2, Play, CheckCircle2, AlertTriangle, Sparkles, 
  ArrowLeft, Search, Shield, Smartphone, MessageSquare, 
  Share2, Phone, Camera, Brain, Tv, Cpu
} from 'lucide-react';
import { AUTOMATION_VOICE_RULES, AutomationDialogueManager, AutomationVoiceRule } from '../../services/automation/AutomationDialogueManager';
import { Mouth } from '../../services/audio/mouth';

interface AutomationDialogueStudioViewProps {
  onBack: () => void;
}

export const AutomationDialogueStudioView: React.FC<AutomationDialogueStudioViewProps> = ({ onBack }) => {
  const manager = AutomationDialogueManager.getInstance();
  const mouth = Mouth.getInstance();

  const [rules] = useState<AutomationVoiceRule[]>(manager.getAllRules());
  const [selectedRule, setSelectedRule] = useState<AutomationVoiceRule>(rules[0]);
  const [userTitle, setUserTitle] = useState<string>(manager.getUserTitle());
  const [userName, setUserName] = useState<string>(manager.getUserName());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.triggers.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeFilter === 'all' || r.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePlayDialogue = async (text: string, label: string) => {
    setCurrentPlaying(label);
    const formatted = manager.formatDialogue(text, {
      Target: 'अभिषेक',
      Sender: 'राहुल वर्मा',
      Message: 'कल की मीटिंग का समय 11:00 बजे तय हुआ है।',
      CallerName: 'विक्रम मल्होत्रा',
      Summary: 'व्हाट्सएप चैट स्क्रीन और 3 अनरीड नोटिफिकेशन प्रदर्शित हैं',
      ObjectText: 'मैकबुक प्रो और कॉफी कप',
      SongName: 'केसरिया तेरा इश्क है पिया',
      SubscriberCount: '1.25 लाख',
      ViewCount: '45 लाख',
      Amount: '2,500',
      LocationName: 'प्लैटिनम टावर बेसमेंट 2',
      MedicineName: 'पैरासिटामोल 650mg',
      CleanSize: '1.8 GB',
      TrainName: 'वंदे भारत एक्सप्रेस',
      SupportPrice: '24,800',
      ResistancePrice: '25,050',
      StockIndex: 'NIFTY 50',
      LevelPrice: '24,900',
      CandlePattern: 'बुलिश हैमर (Bullish Hammer)',
      SLPrice: '24,800',
      TargetPrice: '25,050',
      LotSize: '50',
      PCRRatio: '1.24 (बुलिश)',
      StrikePrice: '24,800 पुट',
      EntryPrice: '24,850',
      PriceRange: '24,820 - 24,840',
      ProfitAmount: '6,450'
    });

    await mouth.speak(formatted, { persona: 'MAYRA' });
    setCurrentPlaying(null);
  };

  const handleSaveTitles = () => {
    manager.setUserTitle(userTitle);
    manager.setUserName(userName);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-rose-600 text-white rounded-lg shadow-md">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Automation Voice Dialogue Matrix
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                25 Real-Time Event Voice Actions • Success & Failure Speech Sync
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Title & Name Config Bar */}
      <div className="p-3.5 bg-[#0C1021] border-b border-white/10 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400">Address Title ({`{Title}`}):</span>
          <input
            type="text"
            value={userTitle}
            onChange={(e) => setUserTitle(e.target.value)}
            onBlur={handleSaveTitles}
            className="w-20 bg-[#070913] border border-white/15 rounded-lg px-2 py-1 text-white font-mono text-xs outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400">User Name ({`{UserName}`}):</span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={handleSaveTitles}
            className="w-24 bg-[#070913] border border-white/15 rounded-lg px-2 py-1 text-white font-mono text-xs outline-none focus:border-amber-400"
          />
        </div>
        <button
          onClick={handleSaveTitles}
          className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-mono text-[10px] rounded-lg border border-amber-500/40"
        >
          SAVE PREFERENCES
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="p-3 px-4 border-b border-white/10 space-y-2 bg-[#070913]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search automation by trigger or action (e.g. अनलॉक, whatsapp, sos)..."
            className="w-full bg-[#0C1021] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-white font-sans text-xs outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All 55 Rules' },
            { id: 'finance_trading', label: 'Finance & Trading (15)' },
            { id: 'lifestyle_smart', label: 'Lifestyle & Pro (15)' },
            { id: 'screen', label: 'Screen Lock/Unlock' },
            { id: 'messaging', label: 'WhatsApp & Reports' },
            { id: 'telephony', label: 'Calls & Driving' },
            { id: 'security', label: 'Touch Guard & SOS' },
            { id: 'vision_tools', label: 'Vision & Whiteboard' },
            { id: 'media_iot', label: 'YouTube & IoT' },
            { id: 'system', label: 'System & PC Link' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List & Live Voice Preview */}
      <div className="p-4 space-y-3 pb-16">
        {filteredRules.map((rule, idx) => (
          <div
            key={rule.id}
            className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3 transition-all hover:border-amber-500/30"
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-white text-xs font-mono">{rule.name}</h3>
              </div>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-400 font-mono text-[9px] uppercase rounded-md">
                {rule.category}
              </span>
            </div>

            {/* Triggers */}
            <div className="p-2 bg-[#070913] rounded-xl border border-white/5 flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono text-amber-400 uppercase font-bold">Triggers:</span>
              {rule.triggers.map((trig, tIdx) => (
                <span key={tIdx} className="px-2 py-0.5 bg-amber-950/40 border border-amber-500/20 text-amber-300 rounded-md text-[10px] font-mono">
                  "{trig}"
                </span>
              ))}
            </div>

            {/* Dialogue Matrix: Action, Success, Failure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              {/* 1. Action Start Speech */}
              <div className="p-2.5 bg-[#070913] border border-cyan-500/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 1. Action Start (शुरुआत)
                  </div>
                  <p className="text-slate-200 mt-1 italic">
                    "{manager.formatDialogue(rule.actionSpeech)}"
                  </p>
                </div>
                <button
                  onClick={() => handlePlayDialogue(rule.actionSpeech, `${rule.id}_action`)}
                  className="w-full py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-mono text-[9px] rounded-lg flex items-center justify-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-cyan-300" /> LISTEN ACTION SPEECH
                </button>
              </div>

              {/* 2. Success Speech */}
              <div className="p-2.5 bg-[#070913] border border-emerald-500/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 2. Success (सफलता)
                  </div>
                  <p className="text-slate-200 mt-1 italic">
                    "{manager.formatDialogue(rule.successSpeech, { Target: 'अभिषेक', Sender: 'राहुल', Message: 'मीटिंग 11 बजे है', CallerName: 'विक्रम', SongName: 'केसरिया' })}"
                  </p>
                </div>
                <button
                  onClick={() => handlePlayDialogue(rule.successSpeech, `${rule.id}_success`)}
                  className="w-full py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] rounded-lg flex items-center justify-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-emerald-300" /> LISTEN SUCCESS SPEECH
                </button>
              </div>

              {/* 3. Failure Speech */}
              <div className="p-2.5 bg-[#070913] border border-rose-500/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 3. Failure (विफलता)
                  </div>
                  <p className="text-slate-200 mt-1 italic">
                    "{manager.formatDialogue(rule.failureSpeech, { Target: 'अभिषेक' })}"
                  </p>
                </div>
                <button
                  onClick={() => handlePlayDialogue(rule.failureSpeech, `${rule.id}_failure`)}
                  className="w-full py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-mono text-[9px] rounded-lg flex items-center justify-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-rose-300" /> LISTEN FAILURE SPEECH
                </button>
              </div>
            </div>

            {/* Optional Disarm Dialogue for Security */}
            {(rule.disarmSuccessSpeech || rule.disarmFailureSpeech) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                {rule.disarmSuccessSpeech && (
                  <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Owner Voice Disarm:</span>
                      <p className="text-slate-300 italic text-[10px]">"{manager.formatDialogue(rule.disarmSuccessSpeech)}"</p>
                    </div>
                    <button
                      onClick={() => handlePlayDialogue(rule.disarmSuccessSpeech!, `${rule.id}_disarm_ok`)}
                      className="p-1.5 bg-emerald-600/30 text-emerald-300 rounded-lg shrink-0 ml-2"
                    >
                      <Play className="w-3 h-3 fill-emerald-300" />
                    </button>
                  </div>
                )}
                {rule.disarmFailureSpeech && (
                  <div className="p-2 bg-rose-950/30 border border-rose-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-rose-400 font-bold uppercase">Unknown Voice Alert:</span>
                      <p className="text-slate-300 italic text-[10px]">"{manager.formatDialogue(rule.disarmFailureSpeech)}"</p>
                    </div>
                    <button
                      onClick={() => handlePlayDialogue(rule.disarmFailureSpeech!, `${rule.id}_disarm_fail`)}
                      className="p-1.5 bg-rose-600/30 text-rose-300 rounded-lg shrink-0 ml-2"
                    >
                      <Play className="w-3 h-3 fill-rose-300" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
