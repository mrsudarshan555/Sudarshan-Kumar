import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanText, QrCode, Languages, Calculator, ArrowLeft, 
  Copy, Check, Sparkles, Camera, Upload, RefreshCw, Volume2, 
  Coins, ArrowRightLeft, FileText, Download, Share2
} from 'lucide-react';
import { AIToolkitScannerEngine } from '../../services/ai/AIToolkitScannerEngine';
import { Mouth } from '../../services/audio/mouth';

interface AIToolkitScannerViewProps {
  onBack: () => void;
}

export const AIToolkitScannerView: React.FC<AIToolkitScannerViewProps> = ({ onBack }) => {
  const engine = AIToolkitScannerEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activeTab, setActiveTab] = useState<'ocr' | 'qr' | 'translate' | 'converter'>('ocr');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // --- OCR State ---
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrHistory, setOcrHistory] = useState(engine.getOcrHistory());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- QR State ---
  const [qrText, setQrText] = useState<string>('https://stonicx.ai');
  const [qrGeneratedUrl, setQrGeneratedUrl] = useState<string>(
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://stonicx.ai')}`
  );

  // --- Translator State ---
  const [transSourceText, setTransSourceText] = useState<string>('Drive safely, your journey is secured by STONICX.');
  const [transSourceLang, setTransSourceLang] = useState<string>('en');
  const [transTargetLang, setTransTargetLang] = useState<string>('hi');
  const [transResultText, setTransResultText] = useState<string>('सुरक्षित ड्राइव करें, आपकी यात्रा स्टोनिक्स द्वारा सुरक्षित है।');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // --- Converter & Math State ---
  const [convType, setConvType] = useState<'currency' | 'metric' | 'math'>('currency');
  const [currAmount, setCurrAmount] = useState<number>(100);
  const [currFrom, setCurrFrom] = useState<string>('USD');
  const [currTo, setCurrTo] = useState<string>('INR');
  const [convFormatted, setConvFormatted] = useState<string>('');

  const [metricVal, setMetricVal] = useState<number>(100);
  const [metricCategory, setMetricCategory] = useState<'speed' | 'length' | 'weight' | 'temperature'>('speed');
  const [metricFrom, setMetricFrom] = useState<string>('km/h');
  const [metricTo, setMetricTo] = useState<string>('mph');
  const [metricFormatted, setMetricFormatted] = useState<string>('');

  const [mathExpr, setMathExpr] = useState<string>('25 * 40 + (1200 / 4) - 75');
  const [mathOutput, setMathOutput] = useState<{ result: number | string; steps: string[] } | null>(null);

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setOcrHistory([...engine.getOcrHistory()]);
    });
    return unsub;
  }, [engine]);

  // Handle OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setOcrLoading(true);
      const text = await engine.extractTextFromImage(dataUrl);
      setExtractedText(text);
      setOcrLoading(false);
      await mouth.speak('Text extracted from document successfully.', { persona: 'STONICX' });
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateOcr = async () => {
    setOcrLoading(true);
    const text = await engine.extractTextFromImage('');
    setExtractedText(text);
    setOcrLoading(false);
    await mouth.speak('Text extraction complete.', { persona: 'STONICX' });
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // Handle QR Generation
  const handleGenerateQR = () => {
    if (!qrText.trim()) return;
    setQrGeneratedUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrText.trim())}`);
  };

  // Handle Translation
  const handleTranslate = async () => {
    if (!transSourceText.trim()) return;
    setIsTranslating(true);
    const res = await engine.translateText(transSourceText.trim(), transSourceLang, transTargetLang);
    setTransResultText(res.translatedText);
    setIsTranslating(false);
  };

  const handleSpeakTranslation = async () => {
    if (transResultText) {
      await mouth.speak(transResultText, { persona: 'STONICX' });
    }
  };

  // Handle Currency Conversion
  const handleConvertCurrency = () => {
    const res = engine.convertCurrency(currAmount, currFrom, currTo);
    setConvFormatted(res.formatted);
  };

  // Handle Metric Conversion
  const handleConvertMetric = () => {
    const res = engine.convertUnit(metricVal, metricCategory, metricFrom, metricTo);
    setMetricFormatted(res.formatted);
  };

  // Handle Math Solve
  const handleSolveMath = () => {
    const res = engine.solveMathExpression(mathExpr);
    setMathOutput(res);
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
            <div className="p-1.5 bg-gradient-to-tr from-violet-600 to-cyan-600 text-white rounded-lg shadow-md">
              <ScanText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                All-In-One AI Toolkit & Scanner
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                OCR Document Scanner • QR Studio • Multilingual Translator • Converter
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-[#0C1021]/50">
        {[
          { id: 'ocr', label: 'OCR Scanner', icon: ScanText },
          { id: 'qr', label: 'QR & Barcode', icon: QrCode },
          { id: 'translate', label: 'Live Translator', icon: Languages },
          { id: 'converter', label: 'Converter & Math', icon: Calculator }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === t.id
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: OCR & DOCUMENT SCANNER */}
        {activeTab === 'ocr' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Neural Document & Text Scanner
                </span>
                <span className="text-[9px] font-mono text-slate-400">High-Precision OCR</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Document / Photo
                </button>
                <button
                  onClick={handleSimulateOcr}
                  disabled={ocrLoading}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> {ocrLoading ? 'Scanning...' : 'Test Scan'}
                </button>
              </div>

              {ocrLoading && (
                <div className="p-4 bg-[#070913] rounded-xl border border-cyan-500/30 text-center font-mono text-cyan-300 animate-pulse">
                  Neural Engine analyzing image matrix and extracting text glyphs...
                </div>
              )}

              {extractedText && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Extracted Text Output:</span>
                    <button
                      onClick={() => handleCopyText(extractedText)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-300 font-mono text-[10px] rounded-lg flex items-center gap-1"
                    >
                      {copiedStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedStatus ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full bg-[#070913] border border-white/10 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: QR & BARCODE STUDIO */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" /> QR Code & Barcode Studio
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="Enter URL, Text or UPI ID"
                  className="flex-1 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                />
                <button
                  onClick={handleGenerateQR}
                  className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl"
                >
                  GENERATE
                </button>
              </div>

              {qrGeneratedUrl && (
                <div className="p-5 bg-[#070913] rounded-xl border border-white/10 flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <img src={qrGeneratedUrl} alt="Generated QR" className="w-44 h-44 object-contain" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Scan with any camera or phone to decode payload
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE TRANSLATOR */}
        {activeTab === 'translate' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" /> 15+ Indian & Global Dialect Translator
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono">From Language:</label>
                  <select
                    value={transSourceLang}
                    onChange={(e) => setTransSourceLang(e.target.value)}
                    className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none mt-1"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="bhojpuri">भोजपुरी (Bhojpuri)</option>
                    <option value="haryanvi">हरियाणवी (Haryanvi)</option>
                    <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono">To Language:</label>
                  <select
                    value={transTargetLang}
                    onChange={(e) => setTransTargetLang(e.target.value)}
                    className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none mt-1"
                  >
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="bhojpuri">भोजपुरी (Bhojpuri)</option>
                    <option value="haryanvi">हरियाणवी (Haryanvi)</option>
                    <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="marathi">मराठी (Marathi)</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                    <option value="telugu">తెలుగు (Telugu)</option>
                    <option value="bengali">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={transSourceText}
                onChange={(e) => setTransSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-white font-sans text-xs outline-none focus:border-cyan-500"
              />

              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 text-white font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <Languages className="w-3.5 h-3.5" /> TRANSLATE NOW
              </button>

              {transResultText && (
                <div className="p-3 bg-[#070913] border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">Translated Output:</span>
                    <button
                      onClick={handleSpeakTranslation}
                      className="px-2 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] rounded-lg flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Speak Output
                    </button>
                  </div>
                  <p className="text-white text-xs font-sans font-medium">{transResultText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CONVERTER & MATH */}
        {activeTab === 'converter' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'currency', label: 'Currency / Crypto', icon: Coins },
                { id: 'metric', label: 'Unit Converter', icon: ArrowRightLeft },
                { id: 'math', label: 'Math Equation', icon: Calculator }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setConvType(c.id as any)}
                  className={`py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-all ${
                    convType === c.id
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                      : 'bg-[#070913] text-slate-400 border-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Sub-View: Currency */}
            {convType === 'currency' && (
              <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">Live Forex & Crypto Rates</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={currAmount}
                    onChange={(e) => setCurrAmount(Number(e.target.value))}
                    className="w-24 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                  <select
                    value={currFrom}
                    onChange={(e) => setCurrFrom(e.target.value)}
                    className="bg-[#070913] border border-white/10 rounded-xl px-2 py-2 text-white text-xs"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BTC">BTC (₿)</option>
                  </select>
                  <span className="self-center text-slate-400 font-mono">➔</span>
                  <select
                    value={currTo}
                    onChange={(e) => setCurrTo(e.target.value)}
                    className="bg-[#070913] border border-white/10 rounded-xl px-2 py-2 text-white text-xs"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="BTC">BTC (₿)</option>
                    <option value="ETH">ETH (Ξ)</option>
                  </select>
                  <button
                    onClick={handleConvertCurrency}
                    className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl"
                  >
                    CALC
                  </button>
                </div>

                {convFormatted && (
                  <div className="p-3 bg-[#070913] border border-white/10 rounded-xl font-mono text-xs text-emerald-300 font-bold">
                    {convFormatted}
                  </div>
                )}
              </div>
            )}

            {/* Sub-View: Metric Units */}
            {convType === 'metric' && (
              <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">Unit Conversion</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={metricVal}
                    onChange={(e) => setMetricVal(Number(e.target.value))}
                    className="w-24 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                  <select
                    value={metricFrom}
                    onChange={(e) => setMetricFrom(e.target.value)}
                    className="bg-[#070913] border border-white/10 rounded-xl px-2 py-2 text-white text-xs"
                  >
                    <option value="km/h">km/h</option>
                    <option value="mph">mph</option>
                    <option value="m/s">m/s</option>
                  </select>
                  <span className="self-center text-slate-400 font-mono">➔</span>
                  <select
                    value={metricTo}
                    onChange={(e) => setMetricTo(e.target.value)}
                    className="bg-[#070913] border border-white/10 rounded-xl px-2 py-2 text-white text-xs"
                  >
                    <option value="mph">mph</option>
                    <option value="km/h">km/h</option>
                    <option value="m/s">m/s</option>
                  </select>
                  <button
                    onClick={handleConvertMetric}
                    className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl"
                  >
                    CONVERT
                  </button>
                </div>

                {metricFormatted && (
                  <div className="p-3 bg-[#070913] border border-white/10 rounded-xl font-mono text-xs text-cyan-300 font-bold">
                    {metricFormatted}
                  </div>
                )}
              </div>
            )}

            {/* Sub-View: Math Solver */}
            {convType === 'math' && (
              <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">Math & Equation Solver</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mathExpr}
                    onChange={(e) => setMathExpr(e.target.value)}
                    placeholder="Enter arithmetic expression"
                    className="flex-1 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                  <button
                    onClick={handleSolveMath}
                    className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl"
                  >
                    SOLVE
                  </button>
                </div>

                {mathOutput && (
                  <div className="p-3 bg-[#070913] border border-white/10 rounded-xl space-y-1.5">
                    <div className="font-mono text-xs text-emerald-300 font-bold">
                      Result: {String(mathOutput.result)}
                    </div>
                    {mathOutput.steps.map((st, i) => (
                      <div key={i} className="text-[10px] font-mono text-slate-400">{st}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
