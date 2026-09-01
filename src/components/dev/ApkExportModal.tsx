import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, Smartphone, Copy, Check, Terminal, ExternalLink, 
  Layers, ShieldAlert, Sparkles, X, Code2, Globe
} from 'lucide-react';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'termux' | 'mtmanager'>('quick');

  if (!isOpen) return null;

  const webAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-dev-mik7qwqh4upkra3dkuqx3h-686105212526.asia-east1.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[2000] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-[#0a0a14] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] relative text-white flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Build & Export Android APK</h2>
              <p className="text-xs text-slate-400 font-mono">MAYRA Barehands AI Mobile Package</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live App Link Copy Card */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col gap-2">
          <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
            1. Your Live Web App Link (URL):
          </span>
          <div className="flex items-center justify-between gap-2 bg-[#050711] p-2.5 rounded-xl border border-white/10">
            <span className="text-xs font-mono text-slate-300 truncate select-all">{webAppUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Build Method Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'quick' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 1-Click Online (Easiest)
          </button>
          <button
            onClick={() => setActiveTab('mtmanager')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'mtmanager' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            📁 MT Manager
          </button>
          <button
            onClick={() => setActiveTab('termux')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'termux' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            💻 Termux / Capacitor
          </button>
        </div>

        {/* Tab 1: 1-Click Online Builder */}
        {activeTab === 'quick' && (
          <div className="space-y-3 bg-[#050711] p-4 rounded-2xl border border-white/10 text-xs text-slate-300">
            <p className="font-semibold text-white">मोबाइल में 1 मिनट में APK डाउनलोड करने के स्टेप्स:</p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
              <li>ऊपर दिया गया अपना **App URL** कॉपी करें।</li>
              <li>
                Chrome में जाएं और <a href="https://websitetoapk.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold">Web2Apk</a> या <a href="https://appsgeyser.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold">AppsGeyser</a> खोलें।
              </li>
              <li>"Website URL" बॉक्स में अपना लिंक पेस्ट करें।</li>
              <li>App Name: <b>MAYRA Assistant</b> डालें।</li>
              <li><b>"Create & Download APK"</b> पर क्लिक करें — APK सीधे आपके फोन में डाउनलोड हो जाएगी!</li>
            </ol>
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
              ✓ कैमरा और मोशन परमिशन APK में अपने-आप एनेबल्ड रहेंगी।
            </div>
          </div>
        )}

        {/* Tab 2: MT Manager */}
        {activeTab === 'mtmanager' && (
          <div className="space-y-3 bg-[#050711] p-4 rounded-2xl border border-white/10 text-xs text-slate-300">
            <p className="font-semibold text-white">MT Manager से APK मॉडिफाई करने के स्टेप्स:</p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
              <li>अपने फोन में **MT Manager** ऐप खोलें।</li>
              <li>किसी भी WebView या React बेस APK को सेलेक्ट करें।</li>
              <li><b>`assets/`</b> डायरेक्टरी में प्रोजेक्ट के वेब कंपोनेंट्स लिंक करें।</li>
              <li><b>AndroidManifest.xml</b> में यह परमिशन जोड़ें:
                <pre className="mt-1 p-2 bg-black/60 rounded-lg text-[10px] font-mono text-cyan-300 overflow-x-auto">
{`<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />`}
                </pre>
              </li>
              <li>APK को <b>Sign (हस्ताक्षर)</b> करके इनस्टॉल करें।</li>
            </ol>
          </div>
        )}

        {/* Tab 3: Termux / Node.js */}
        {activeTab === 'termux' && (
          <div className="space-y-3 bg-[#050711] p-4 rounded-2xl border border-white/10 text-xs text-slate-300">
            <p className="font-semibold text-white">Termux CLI में डायरेक्ट APK कंपाइल करें:</p>
            <pre className="p-3 bg-black/80 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-white/10">
{`# 1. Termux में जरूरी टूल्स इंस्टॉल करें
pkg update && pkg install nodejs openjdk-17 -y

# 2. Capacitor CLI इन्स्टॉल करें
npm i -g @capacitor/cli @capacitor/core @capacitor/android

# 3. Android प्रोजेक्ट बिल्ड करें
npx cap add android
npx cap copy
cd android && ./gradlew assembleDebug`}
            </pre>
            <p className="text-[11px] text-slate-400">आउटपुट APK फाइल `android/app/build/outputs/apk/debug/app-debug.apk` में मिलेगी।</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
