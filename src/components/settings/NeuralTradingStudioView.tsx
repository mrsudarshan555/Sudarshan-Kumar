import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, Layers, 
  BarChart2, ShieldAlert, Sparkles, Plus, Play, CheckCircle2, 
  BookOpen, ArrowLeft, RefreshCw, Zap, Target, Sliders, LineChart
} from 'lucide-react';
import { NeuralTradingFinanceEngine, ChartLevel, TradingStrategy, TradeJournalEntry } from '../../services/finance/NeuralTradingFinanceEngine';
import { Mouth } from '../../services/audio/mouth';
import { AutomationDialogueManager } from '../../services/automation/AutomationDialogueManager';

interface NeuralTradingStudioViewProps {
  onBack: () => void;
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

  useEffect(() => {
    return engine.subscribe(() => {
      setLevels([...engine.getLevels()]);
      setStrategies([...engine.getStrategies()]);
      setJournal([...engine.getJournal()]);
      setSymbol(engine.getSymbol());
    });
  }, []);

  const handleRecalculateLevels = (sym: string) => {
    const newL = engine.autoDetectChartLevels(sym);
    setLevels(newL);
    const text = dialogManager.formatDialogue(
      `चार्ट के स्विंग पॉइंट्स स्कैन कर लिए हैं {Title}। ${sym} पर प्रमुख सपोर्ट ₹${newL[2].price} और रेजिस्टेंस ₹${newL[1].price} पर मार्क कर दिया गया है।`
    );
    mouth.speak(text, { persona: 'MAYRA' });
  };

  const handleRunPositionCalc = () => {
    const res = engine.calculatePositionSize(capital, riskPercent, entryPrice, stopLossPrice);
    setCalcResult(res);
    const speech = dialogManager.formatDialogue(
      `{Title}, ₹${capital.toLocaleString()} की कैपिटल और 2% रिस्क के अनुसार आपका स्टॉपलॉस ₹${stopLossPrice} और 1:2 टारगेट ₹${res.target12} होगा। आप सुरक्षित रूप से ${res.recommendedQuantity} शेयर ले सकते हैं।`
    );
    mouth.speak(speech, { persona: 'MAYRA' });
  };

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName || !newStratRule) return;
    engine.addStrategy(newStratName, [newStratRule]);
    setNewStratName('');
    setNewStratRule('');
    mouth.speak(`आपकी नई ट्रेडिंग स्ट्रैटेजी सफलतापूर्वक रजिस्टर कर दी गई है {Title}। जैसे ही कंडीशन मैच होगी, मैं आपको तुरंत अलर्ट कर दूँगी।`);
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
      notes: 'Executed smoothly with Mayra voice assistant tracking.'
    });
    const speech = dialogManager.formatDialogue(
      `आज का ट्रेड डायरी में दर्ज कर दिया गया है {Title}। शुद्ध लाभ: +₹${pnl.toLocaleString()}।`
    );
    mouth.speak(speech, { persona: 'MAYRA' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-cyan-600 text-white rounded-lg shadow-md">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Neural Trading & Financial Chart Matrix
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                Auto Support/Resistance • Custom Strategy Radar • Position Sizing • Trade Journal
              </p>
            </div>
          </div>
        </div>

        {/* Live Index Pill */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-bold">{symbol}: 24,850.75</span>
            <span className="text-emerald-400 text-[10px]">(+0.58%)</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 bg-[#0C1021] px-4 gap-2 overflow-x-auto">
        {[
          { id: 'levels', label: '1. S&R Auto-Levels', icon: LineChart },
          { id: 'strategies', label: '2. User Strategy Tracker', icon: Zap },
          { id: 'patterns', label: '3. Candlestick AI', icon: BarChart2 },
          { id: 'calculator', label: '4. Risk-Reward Calc', icon: Target },
          { id: 'journal', label: '5. P&L Trade Journal', icon: BookOpen }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-mono transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-300 font-bold bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4 pb-16">
        {/* TAB 1: SUPPORT & RESISTANCE AUTO-LEVELS */}
        {activeTab === 'levels' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Auto Support, Resistance & SMC Liquidity Levels
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mayra scans high/low swing wicks and auto-marks institutional supply & demand zones.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map(sym => (
                    <button
                      key={sym}
                      onClick={() => handleRecalculateLevels(sym)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                        symbol === sym
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Visualizer Box */}
              <div className="h-44 bg-[#05070E] rounded-xl border border-white/10 p-3 relative flex flex-col justify-between overflow-hidden">
                {/* Visual Grid Lines */}
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
                    <span className="px-1.5 py-0.2 bg-white/10 rounded text-[8px] uppercase tracking-wider">
                      {lvl.timeframe} • {lvl.strength}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleRecalculateLevels(symbol)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> RE-SCAN CHART LEVELS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER STRATEGY TRACKER */}
        {activeTab === 'strategies' && (
          <div className="space-y-4">
            {/* Add Custom Strategy Form */}
            <form onSubmit={handleAddStrategy} className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-400" />
                Teach Mayra a New Custom Trading Strategy (अपनी स्ट्रैटेजी सिखाएँ)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Strategy Name:</label>
                  <input
                    type="text"
                    value={newStratName}
                    onChange={(e) => setNewStratName(e.target.value)}
                    placeholder="e.g. 15m Reversal + RSI 60 Breakout"
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Trigger Condition / Rules:</label>
                  <input
                    type="text"
                    value={newStratRule}
                    onChange={(e) => setNewStratRule(e.target.value)}
                    placeholder="e.g. 9 EMA > 21 EMA + Supertrend Green"
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> SAVE & ACTIVATE STRATEGY RADAR
              </button>
            </form>

            {/* Active Strategies List */}
            <div className="space-y-3">
              {strategies.map((strat) => (
                <div key={strat.id} className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-white text-xs font-mono">{strat.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] rounded-md font-bold">
                      {strat.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070913] rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold">Active Rules:</span>
                    {strat.conditions.map((cond, cIdx) => (
                      <div key={cIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{cond}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>Status: {strat.lastTriggered}</span>
                    <button
                      onClick={() => mouth.speak(`आपकी स्ट्रैटेजी ${strat.name} लाइव स्कैन हो रही है {Title}। 3 में से 2 रूल्स मैच हो चुके हैं।`)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10"
                    >
                      VOICE STATUS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CANDLESTICK RECOGNITION */}
        {activeTab === 'patterns' && (
          <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
            <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Real-Time Candlestick AI Pattern Recognition
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signals.map((sig, sIdx) => (
                <div key={sIdx} className="p-3.5 bg-[#070913] border border-purple-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono">{sig.patternName}</span>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] rounded font-bold">
                      {sig.bias} ({sig.confidence}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">{sig.description}</p>
                  <button
                    onClick={() => mouth.speak(`{Title}, 15 मिनट चार्ट पर सपोर्ट लेवल पर स्ट्रॉन्ग ${sig.patternName} बना है। ${sig.description}`)}
                    className="w-full py-1 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/30 text-purple-300 font-mono text-[10px] rounded-lg flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-purple-300" /> LISTEN PATTERN BRIEFING
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RISK-REWARD & POSITION SIZING */}
        {activeTab === 'calculator' && (
          <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-4">
            <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              Smart Risk-Reward & Position Sizing Calculator (1:2 & 1:3 Rules)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Total Capital (₹):</label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Max Risk Per Trade (%):</label>
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Entry Price (₹):</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">StopLoss Price (₹):</label>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  className="w-full bg-[#070913] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              onClick={handleRunPositionCalc}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-950/40"
            >
              <Target className="w-4 h-4" /> CALCULATE POSITION & SPEAK
            </button>

            {/* Calculated Output Box */}
            <div className="p-4 bg-[#070913] border border-amber-500/30 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 block">MAX RISK AMOUNT</span>
                <span className="text-sm font-bold font-mono text-rose-400">₹{calcResult.riskAmount.toLocaleString()}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 block">RECOMMENDED QTY</span>
                <span className="text-sm font-bold font-mono text-amber-300">{calcResult.recommendedQuantity} Shares</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 block">1:2 TARGET (50% Qty)</span>
                <span className="text-sm font-bold font-mono text-emerald-400">₹{calcResult.target12.toLocaleString()}</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <span className="text-[9px] font-mono text-slate-400 block">1:3 TARGET (Runner)</span>
                <span className="text-sm font-bold font-mono text-cyan-400">₹{calcResult.target13.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRADE JOURNAL & P&L */}
        {activeTab === 'journal' && (
          <div className="space-y-4">
            <form onSubmit={handleAddJournalEntry} className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <h3 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Quick Log Trade to Auto-Journal (ट्रेड दर्ज करें)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Contract / Symbol:</label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Entry (₹):</label>
                  <input
                    type="number"
                    value={newEntry}
                    onChange={(e) => setNewEntry(Number(e.target.value))}
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Exit (₹):</label>
                  <input
                    type="number"
                    value={newExit}
                    onChange={(e) => setNewExit(Number(e.target.value))}
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Quantity:</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-[#070913] border border-white/15 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> SAVE TRADE TO JOURNAL
              </button>
            </form>

            <div className="space-y-2">
              {journal.map((item) => (
                <div key={item.id} className="p-3 bg-[#0C1021] border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs font-mono">{item.symbol}</span>
                      <span className="text-[10px] text-slate-400">({item.strategy})</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Entry: ₹{item.entryPrice} • Exit: ₹{item.exitPrice} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.pnl >= 0 ? `+₹${item.pnl.toLocaleString()}` : `-₹${Math.abs(item.pnl).toLocaleString()}`}
                    </span>
                    <span className="block text-[9px] text-slate-500">{item.date}</span>
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
