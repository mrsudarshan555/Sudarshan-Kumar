import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, Layers, 
  BarChart2, ShieldAlert, Sparkles, Plus, Play, CheckCircle2, 
  BookOpen, ArrowLeft, RefreshCw, Zap, Target, Sliders, LineChart,
  Send, Bot, User, Clock, ChevronRight, Volume2, Maximize2, 
  Percent, ArrowUpRight, ArrowDownRight, AlertCircle, Sparkle
} from 'lucide-react';
import { NeuralTradingFinanceEngine, ChartLevel, TradingStrategy, TradeJournalEntry } from '../../services/finance/NeuralTradingFinanceEngine';
import { Mouth } from '../../services/audio/mouth';
import { AutomationDialogueManager } from '../../services/automation/AutomationDialogueManager';

interface NeuralTradingStudioViewProps {
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'stonicx';
  text: string;
  time: string;
  tag?: string;
}

export const NeuralTradingStudioView: React.FC<NeuralTradingStudioViewProps> = ({ onBack }) => {
  const engine = NeuralTradingFinanceEngine.getInstance();
  const mouth = Mouth.getInstance();
  const dialogManager = AutomationDialogueManager.getInstance();

  const [activeTab, setActiveTab] = useState<'levels' | 'strategies' | 'patterns' | 'calculator' | 'journal'>('levels');
  const [symbol, setSymbol] = useState(engine.getSymbol());
  const [levels, setLevels] = useState<ChartLevel[]>(engine.getLevels());
  const [strategies, setStrategies] = useState<TradingStrategy[]>(engine.getStrategies());
  const [signals] = useState(engine.getSignals());
  const [journal, setJournal] = useState<TradeJournalEntry[]>(engine.getJournal());

  // Dynamic Price & Metrics State
  const [currentPrice, setCurrentPrice] = useState(engine.getPrice());
  const [currentChange, setCurrentChange] = useState(engine.getChange());
  const [pcr, setPcr] = useState(engine.getPCR());

  // Calculator State
  const [capital, setCapital] = useState<number>(100000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(24850);
  const [stopLossPrice, setStopLossPrice] = useState<number>(24800);
  const [calcResult, setCalcResult] = useState(engine.calculatePositionSize(100000, 2, 24850, 24800));

  // New Strategy Form
  const [newStratName, setNewStratName] = useState('');
  const [newStratRule, setNewStratRule] = useState('');

  // New Journal Form
  const [newSymbol, setNewSymbol] = useState('NIFTY 24900 CE');
  const [newEntry, setNewEntry] = useState(140);
  const [newExit, setNewExit] = useState(190);
  const [newQty, setNewQty] = useState(100);
  const [newStratTag, setNewStratTag] = useState('9:20 AM Range Breakout');

  // Selected Timeline Trade for detail modal/drawer
  const [selectedTrade, setSelectedTrade] = useState<TradeJournalEntry | null>(null);

  // In-Dashboard Side Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'stonicx',
      text: 'STONICX Neural Finance Core online. NIFTY 24,800 PE strong demand zone detected with 1.28 PCR. How can I assist your setup?',
      time: '09:15',
      tag: 'MARKET RADAR'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return engine.subscribe(() => {
      setLevels([...engine.getLevels()]);
      setStrategies([...engine.getStrategies()]);
      setJournal([...engine.getJournal()]);
      setSymbol(engine.getSymbol());
      setCurrentPrice(engine.getPrice());
      setCurrentChange(engine.getChange());
      setPcr(engine.getPCR());
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleRecalculateLevels = (sym: string) => {
    const newL = engine.autoDetectChartLevels(sym);
    setLevels(newL);
    const symPrice = sym.includes('BANK') ? 53420.50 : sym.includes('FIN') ? 23890.20 : sym.includes('SENSEX') ? 81450.00 : 24850.75;
    setCurrentPrice(symPrice);
    
    const text = dialogManager.formatDialogue(
      `चार्ट के स्विंग पॉइंट्स स्कैन कर लिए हैं {Title}। ${sym} पर प्रमुख सपोर्ट ₹${newL[2].price} और रेजिस्टेंस ₹${newL[1].price} पर मार्क कर दिया गया है।`
    );
    mouth.speak(text, { persona: 'STONICX' });

    // Add to chat stream
    setChatMessages(prev => [
      ...prev,
      {
        id: `chat_${Date.now()}`,
        sender: 'stonicx',
        text: `Switched to ${sym} (₹${symPrice.toLocaleString()}). Key Support: ₹${newL[2].price} | Key Resistance: ₹${newL[1].price}. SMC liquidity sweeps active.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tag: 'LEVELS UPDATED'
      }
    ]);
  };

  const handleRunPositionCalc = () => {
    const res = engine.calculatePositionSize(capital, riskPercent, entryPrice, stopLossPrice);
    setCalcResult(res);
    const speech = dialogManager.formatDialogue(
      `{Title}, ₹${capital.toLocaleString()} की कैपिटल और 2% रिस्क के अनुसार आपका स्टॉपलॉस ₹${stopLossPrice} और 1:2 टारगेट ₹${res.target12} होगा। आप सुरक्षित रूप से ${res.recommendedQuantity} शेयर ले सकते हैं।`
    );
    mouth.speak(speech, { persona: 'STONICX' });

    setChatMessages(prev => [
      ...prev,
      {
        id: `calc_${Date.now()}`,
        sender: 'stonicx',
        text: `Risk Calculation for Capital ₹${capital.toLocaleString()} (Risk: ${riskPercent}% = ₹${res.riskAmount}): Recommended Qty: ${res.recommendedQuantity} shares. Target 1:2: ₹${res.target12} | Target 1:3: ₹${res.target13}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tag: 'RISK SIZING'
      }
    ]);
  };

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName || !newStratRule) return;
    engine.addStrategy(newStratName, [newStratRule]);
    setNewStratName('');
    setNewStratRule('');
    mouth.speak(`आपकी नई ट्रेडिंग स्ट्रैटेजी सफलतापूर्वक रजिस्टर कर दी गई है {Title}। जैसे ही कंडीशन मैच होगी, मैं आपको तुरंत अलर्ट कर दूँगी।`, { persona: 'STONICX' });
  };

  const handleAddJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const pnl = (newExit - newEntry) * newQty;
    engine.addTradeJournal({
      symbol: newSymbol,
      type: 'BUY',
      entryPrice: newEntry,
      exitPrice: newExit,
      stopLoss: newEntry * 0.9,
      target: newExit,
      quantity: newQty,
      pnl,
      strategy: newStratTag,
      notes: 'Executed smoothly with STONICX voice assistant tracking.'
    });
    const speech = dialogManager.formatDialogue(
      `आज का ट्रेड डायरी में दर्ज कर दिया गया है {Title}। शुद्ध लाभ: +₹${pnl.toLocaleString()}।`
    );
    mouth.speak(speech, { persona: 'STONICX' });
  };

  // Chat message submit handler
  const handleSendChat = (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';
      let tag = 'AI TRADING INSIGHT';
      const lower = textToSend.toLowerCase();

      if (lower.includes('support') || lower.includes('resistance') || lower.includes('level')) {
        botResponse = `NIFTY Institutional Support rests firmly at ₹24,800.00 (0.618 Golden Fibonacci). Major overhead Call Resistance is pegged at ₹25,000.00.`;
        tag = 'S&R SCANNER';
      } else if (lower.includes('risk') || lower.includes('calc') || lower.includes('position')) {
        botResponse = `Position Sizing Rule: With 2% Risk on ₹1,00,000, max drawdown per trade is capped at ₹2,000. For 50 pts StopLoss, take exactly 40 quantity.`;
        tag = 'POSITION MATH';
      } else if (lower.includes('candle') || lower.includes('hammer') || lower.includes('pattern')) {
        botResponse = `15-Minute Bullish Hammer detected at 24,800 demand base with 96.5% AI confidence. Buyers aggressively absorbed the morning supply.`;
        tag = 'CANDLESTICK AI';
      } else if (lower.includes('pcr') || lower.includes('oi') || lower.includes('sentiment')) {
        botResponse = `Current Put-Call Ratio (PCR) is 1.28 indicating strong Bullish Bias. Maximum Put writing at 24,800 (6.2M OI) acts as concrete floor.`;
        tag = 'OPTION RADAR';
      } else {
        botResponse = `STONICX neural model confirms bullish momentum above 24,820. Trailing Stoploss recommended at 24,800 cost-basis.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'stonicx',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tag
        }
      ]);
      setIsTyping(false);
      mouth.speak(botResponse, { persona: 'STONICX' });
    }, 700);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-slate-100 overflow-hidden select-none font-sans">
      
      {/* 1. TOP HEADER / APP BAR - Liquid Magnifying Glass */}
      <div className="px-4 py-2.5 bg-black/30 border-b border-white/10 backdrop-blur-3xl flex items-center justify-between shrink-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white rounded-full shadow-lg border border-white/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs font-sans font-black text-white tracking-wider uppercase">
                  STONICX NEURAL TRADING MATRIX
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-sans font-bold tracking-tight">
                  SIMULATED / PAPER DATA
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 font-sans">
                Project Dashboard • Real-Time Flow • Multi-Timeframe Confluence
              </p>
            </div>
          </div>
        </div>

        {/* Live Index Selector Pills */}
        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xl p-1 rounded-2xl border border-white/10">
          {['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map(sym => (
            <button
              key={sym}
              onClick={() => handleRecalculateLevels(sym)}
              className={`px-3 py-1 rounded-xl text-[10px] font-sans transition-all font-bold cursor-pointer ${
                symbol === sym
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                  : 'text-purple-300/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Transparent Disclaimer Banner */}
      <div className="px-4 py-1.5 bg-amber-950/30 backdrop-blur-xl border-b border-amber-500/20 flex items-center justify-between text-[10px] text-amber-200/90 font-sans shrink-0">
        <div className="flex items-center gap-2 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            <strong>Simulation Benchmark:</strong> Educational paper trading matrix. Not direct broker execution or SEBI advice.
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0 ml-2">
          ENGINE ACTIVE • 18ms
        </span>
      </div>

      {/* 2. MAIN SCROLLABLE DASHBOARD VIEW */}
      <div className="flex-1 overflow-y-auto p-3.5 md:p-5 space-y-4">
        
        {/* ROW 1: BADE VIBRANT GRADIENT STAT-CARDS (Orange/Pink, Purple/Blue, Emerald/Teal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Card 1: Sunset Orange-to-Pink (Current Real-Time Price) */}
          <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-amber-500/90 via-rose-500/90 to-pink-600/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/20 backdrop-blur-2xl transition-all hover:scale-[1.01]">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-amber-100 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-200" />
                {symbol} SPOT PRICE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white font-sans text-[9px] font-bold border border-white/20">
                [SIMULATED]
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 bg-black/20 px-2.5 py-0.5 rounded-xl text-emerald-200 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+{currentChange} (+0.58%)</span>
              </div>
              <span className="text-[10px] text-amber-100 font-sans">
                Day Range: 24,780 - 24,940
              </span>
            </div>
          </div>

          {/* Card 2: Cosmic Purple-to-Indigo (PCR & Open Interest Sentiment) */}
          <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-violet-600/90 via-purple-600/90 to-indigo-700/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/20 backdrop-blur-2xl transition-all hover:scale-[1.01]">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-purple-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-200" />
                OPTION CHAIN & PCR RADAR
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-sans text-[9px] font-bold border border-emerald-400/30">
                BULLISH BIAS
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
                {pcr} PCR
              </span>
              <span className="text-xs font-mono text-purple-200">(6.2M PE / 4.8M CE)</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-sans">
              <span className="text-[10px] text-purple-100">
                Max Call Pain: <strong className="text-white font-mono">25,000</strong>
              </span>
              <span className="text-[10px] text-purple-100">
                Max Put Support: <strong className="text-white font-mono">24,800</strong>
              </span>
            </div>
          </div>

          {/* Card 3: Emerald-to-Teal (SMC Liquidity & AI Confluence) */}
          <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-emerald-600/90 via-teal-600/90 to-cyan-700/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/20 backdrop-blur-2xl transition-all hover:scale-[1.01]">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-emerald-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                SMC ORDER BLOCK CONFLUENCE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/30 text-emerald-200 font-sans text-[9px] font-bold border border-white/20">
                96.5% WIN PROB
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
                ₹24,800 Zone
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-sans">
              <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> 0.618 Fib Reversal Tap
              </span>
              <button 
                onClick={() => handleSendChat('Analyze 0.618 Fib Reversal')}
                className="text-[9px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl text-white font-bold transition-all cursor-pointer"
              >
                QUICK AUDIT
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: TIMELINE VIEW — TRADES & POSITIONS OF THE DAY - Magnifying Glass */}
        <div className="bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Timeline of Active Trades & Intraday Sessions
                </h2>
                <p className="text-[10px] text-slate-400 font-sans">
                  Visual execution timeline across 09:15 AM to 03:30 PM market hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Total Day P&L:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-black text-xs">
                +₹12,375.00 (+42.5%)
              </span>
            </div>
          </div>

          {/* Timeline Time Header Grid */}
          <div className="bg-black/30 backdrop-blur-xl p-3 rounded-2xl border border-white/10 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between text-[10px] font-sans text-purple-200/70 border-b border-white/10 pb-1.5 min-w-[500px]">
              <span className="w-1/5 text-left font-bold text-amber-400">09:15 AM (Open)</span>
              <span className="w-1/5 text-center">10:30 AM (Morning Flow)</span>
              <span className="w-1/5 text-center">12:30 PM (Midday Range)</span>
              <span className="w-1/5 text-center">02:00 PM (EU Confluence)</span>
              <span className="w-1/5 text-right font-bold text-rose-400">03:30 PM (Close)</span>
            </div>

            {/* Stacked Interactive Timeline Bars */}
            <div className="space-y-2.5 min-w-[500px]">
              
              {/* Timeline Bar 1: NIFTY 24800 CE */}
              <div 
                onClick={() => setSelectedTrade(journal[0] || null)}
                className="group relative h-9 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-2xl flex items-center p-1 cursor-pointer transition-all border border-white/10 hover:border-emerald-500/40"
              >
                {/* Bar position (09:20 to 10:45) */}
                <div 
                  className="absolute left-[3%] w-[32%] h-7 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 p-2 flex items-center justify-between text-white shadow-md shadow-emerald-950/30 transition-transform group-hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span className="text-[10px] font-sans font-bold truncate">NIFTY 24800 CE</span>
                  </div>
                  <span className="text-[10px] font-mono font-black shrink-0 bg-black/30 px-1.5 py-0.5 rounded">
                    +₹6,525 (+35%)
                  </span>
                </div>
                <div className="ml-auto pr-2 text-[9px] font-mono text-purple-200/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  Entry ₹124.50 • Exit ₹168.00 • Qty 150
                </div>
              </div>

              {/* Timeline Bar 2: BANKNIFTY 53200 PE */}
              <div 
                onClick={() => setSelectedTrade(journal[1] || null)}
                className="group relative h-9 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-2xl flex items-center p-1 cursor-pointer transition-all border border-white/10 hover:border-purple-500/40"
              >
                {/* Bar position (11:15 to 01:15) */}
                <div 
                  className="absolute left-[35%] w-[38%] h-7 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-2 flex items-center justify-between text-white shadow-md shadow-indigo-950/30 transition-transform group-hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
                    <span className="text-[10px] font-sans font-bold truncate">BANKNIFTY 53200 PE</span>
                  </div>
                  <span className="text-[10px] font-mono font-black shrink-0 bg-black/30 px-1.5 py-0.5 rounded">
                    +₹5,850 (+23%)
                  </span>
                </div>
                <div className="ml-auto pr-2 text-[9px] font-mono text-purple-200/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  Entry ₹280.00 • Exit ₹345.00 • Qty 90
                </div>
              </div>

              {/* Timeline Bar 3: FINNIFTY 23900 CE (Live Active/Scanning Bar) */}
              <div className="relative h-9 bg-white/[0.04] rounded-2xl flex items-center p-1 border border-white/10 backdrop-blur-md">
                {/* Bar position (02:00 to 03:15) */}
                <div 
                  className="absolute left-[70%] w-[27%] h-7 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 border border-cyan-400/50 p-2 flex items-center justify-between text-white shadow-md animate-pulse"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                    <span className="text-[10px] font-sans font-bold truncate">FINNIFTY 23900 CE</span>
                  </div>
                  <span className="text-[9px] font-sans font-bold bg-black/30 px-1 py-0.5 rounded text-emerald-200">
                    SCANNING
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ROW 3: TWO-COLUMN WORKBENCH: [LEFT: MATRIX TOOLS & CHARTS] + [RIGHT: DIRECT STONICX CHAT PANEL] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT 7-COLUMNS: MATRIX TABS & ENGINE WORKSPACE */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Navigation Tabs Bar - Magnifying Glass */}
            <div className="flex border border-white/15 bg-black/35 backdrop-blur-2xl p-1.5 gap-1.5 rounded-2xl overflow-x-auto shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              {[
                { id: 'levels', label: 'S&R Levels', icon: LineChart },
                { id: 'strategies', label: 'Strategy Radar', icon: Zap },
                { id: 'patterns', label: 'Candlestick AI', icon: BarChart2 },
                { id: 'calculator', label: 'Risk Sizing', icon: Target },
                { id: 'journal', label: 'P&L Journal', icon: BookOpen }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-sans transition-all whitespace-nowrap font-bold cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-purple-300/70 hover:text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: S&R AUTO-LEVELS - Magnifying Glass */}
            {activeTab === 'levels' && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Institutional Support, Resistance & SMC Zones
                  </h3>
                  <button
                    onClick={() => handleRecalculateLevels(symbol)}
                    className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-purple-200 hover:text-white font-sans text-[10px] rounded-xl flex items-center gap-1 border border-white/15 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> RE-SCAN
                  </button>
                </div>

                {/* Visual Chart Level Grid */}
                <div className="h-44 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-3 relative flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                  {levels.map((lvl) => (
                    <div
                      key={lvl.id}
                      className={`relative z-10 flex items-center justify-between py-1 px-2.5 rounded border text-[10px] font-mono ${
                        lvl.type === 'resistance'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {lvl.type.toUpperCase()}: ₹{lvl.price.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400">({lvl.label})</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] uppercase tracking-wider font-bold">
                        {lvl.timeframe} • {lvl.strength}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: STRATEGIES - Magnifying Glass */}
            {activeTab === 'strategies' && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <form onSubmit={handleAddStrategy} className="p-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl space-y-2">
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    Register Custom Strategy Radar
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newStratName}
                      onChange={(e) => setNewStratName(e.target.value)}
                      placeholder="e.g. 15m Reversal + RSI 60"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                    />
                    <input
                      type="text"
                      value={newStratRule}
                      onChange={(e) => setNewStratRule(e.target.value)}
                      placeholder="e.g. 9 EMA > 21 EMA + Supertrend"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans text-xs rounded-xl font-bold cursor-pointer transition-all"
                  >
                    + ACTIVATE STRATEGY RADAR
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {strategies.map((strat) => (
                    <div key={strat.id} className="p-2.5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-sans font-bold text-xs text-white block">{strat.name}</span>
                        <span className="text-[10px] text-purple-200/70 font-sans">{strat.conditions[0]}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans text-[9px] font-bold border border-emerald-500/30">
                        {strat.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: CANDLESTICK AI - Magnifying Glass */}
            {activeTab === 'patterns' && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <h3 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  Real-Time Candlestick AI Recognition
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {signals.map((sig, idx) => (
                    <div key={idx} className="p-3 bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs font-sans">{sig.patternName}</span>
                        <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-sans text-[9px] rounded-full font-bold">
                          {sig.bias} ({sig.confidence}%)
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-200/80">{sig.description}</p>
                      <button
                        onClick={() => mouth.speak(`{Title}, 15 मिनट चार्ट पर ${sig.patternName} बना है। ${sig.description}`, { persona: 'STONICX' })}
                        className="w-full py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 font-sans text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Volume2 className="w-3 h-3" /> VOICE BRIEFING
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: RISK-REWARD & POSITION SIZING - Magnifying Glass */}
            {activeTab === 'calculator' && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <h3 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  Risk-Reward & 2% Capital Position Calculator
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] font-sans text-purple-200/70 block mb-0.5">Capital (₹):</label>
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(Number(e.target.value))}
                      className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans text-purple-200/70 block mb-0.5">Risk (%):</label>
                    <input
                      type="number"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(Number(e.target.value))}
                      className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans text-purple-200/70 block mb-0.5">Entry (₹):</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value))}
                      className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans text-purple-200/70 block mb-0.5">StopLoss (₹):</label>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-black/30 backdrop-blur-xl border border-amber-500/30 rounded-2xl grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 bg-white/[0.06] rounded-xl border border-white/10">
                    <span className="text-[8px] font-sans text-purple-200/70 block">RISK BUDGET</span>
                    <span className="text-xs font-bold font-mono text-rose-400">₹{calcResult.riskAmount.toLocaleString()}</span>
                  </div>
                  <div className="p-1.5 bg-white/[0.06] rounded-xl border border-white/10">
                    <span className="text-[8px] font-sans text-purple-200/70 block">MAX QTY</span>
                    <span className="text-xs font-bold font-mono text-amber-300">{calcResult.recommendedQuantity} Shares</span>
                  </div>
                  <div className="p-1.5 bg-white/[0.06] rounded-xl border border-white/10">
                    <span className="text-[8px] font-sans text-purple-200/70 block">1:2 TARGET</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">₹{calcResult.target12.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleRunPositionCalc}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs rounded-xl font-bold cursor-pointer transition-all"
                >
                  CALCULATE & DISPATCH TO STONICX
                </button>
              </div>
            )}

            {/* TAB CONTENT 5: JOURNAL - Magnifying Glass */}
            {activeTab === 'journal' && (
              <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <form onSubmit={handleAddJournalEntry} className="p-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl space-y-2">
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    Quick Log Trade to Auto-Journal
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Symbol"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2 py-1 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={newEntry}
                      onChange={(e) => setNewEntry(Number(e.target.value))}
                      placeholder="Entry"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2 py-1 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={newExit}
                      onChange={(e) => setNewExit(Number(e.target.value))}
                      placeholder="Exit"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2 py-1 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={newQty}
                      onChange={(e) => setNewQty(Number(e.target.value))}
                      placeholder="Qty"
                      className="bg-white/[0.06] border border-white/15 rounded-xl px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs rounded-xl font-bold cursor-pointer transition-all"
                  >
                    + SAVE TRADE RECORD
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {journal.map((item) => (
                    <div key={item.id} className="p-2.5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-sans font-bold text-xs text-white block">{item.symbol}</span>
                        <span className="text-[9px] text-purple-200/70">Entry: ₹{item.entryPrice} • Exit: ₹{item.exitPrice}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.pnl >= 0 ? `+₹${item.pnl.toLocaleString()}` : `-₹${Math.abs(item.pnl).toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT 5-COLUMNS: IN-DASHBOARD STONICX AI TRADING CHAT COPILOT - Magnifying Glass */}
          <div className="lg:col-span-5 flex flex-col bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] h-[420px]">
            
            {/* Chat Header */}
            <div className="px-3.5 py-2.5 bg-black/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-sans text-xs font-bold text-white uppercase tracking-wider">
                    STONICX AI COPILOT
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-sans px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-purple-200">
                LIVE ASSIST
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-2.5 py-1.5 bg-black/20 backdrop-blur-lg border-b border-white/5 flex gap-1.5 overflow-x-auto shrink-0">
              {[
                { label: '🔍 S&R Levels', text: 'Scan institutional support and resistance for NIFTY' },
                { label: '📊 Candlestick', text: 'What candlestick pattern is active on 15m chart?' },
                { label: '🎯 2% Risk', text: 'Calculate 2% risk on ₹100,000 capital' },
                { label: '⚡ PCR Radar', text: 'Check current PCR open interest concentration' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(chip.text)}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[9px] font-sans text-purple-200 hover:text-white whitespace-nowrap transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs font-sans">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.tag && (
                    <span className="text-[8px] font-sans font-bold text-amber-400 uppercase tracking-wider mb-0.5 px-1">
                      {msg.tag}
                    </span>
                  )}
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl font-sans text-[11px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-br-none shadow-md'
                        : 'bg-black/30 backdrop-blur-xl border border-white/10 text-slate-100 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-mono text-purple-300/50 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-1.5 p-2 bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 w-fit">
                  <Sparkle className="w-3 h-3 text-amber-400 animate-spin" />
                  <span className="text-[10px] font-sans text-purple-200/70">Computing neural matrix response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Box */}
            <div className="p-2 bg-black/30 backdrop-blur-xl border-t border-white/10 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask STONICX about levels, risk, or SMC setups..."
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-2xl px-3 py-1.5 text-xs text-white placeholder-purple-300/40 outline-none focus:border-amber-400 font-sans"
              />
              <button
                onClick={() => handleSendChat()}
                className="p-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-full shadow transition-transform active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
