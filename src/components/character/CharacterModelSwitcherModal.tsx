import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Box, Upload, Link as LinkIcon, Check, Trash2, 
  Sparkles, Layers, ShieldCheck, HardDrive, Globe, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  characterModelManager, 
  CharacterModelEntry 
} from '../../services/models/CharacterModelManager';

interface CharacterModelSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterModelSwitcherModal: React.FC<CharacterModelSwitcherModalProps> = ({
  isOpen,
  onClose
}) => {
  const [models, setModels] = useState<CharacterModelEntry[]>([]);
  const [activeModel, setActiveModel] = useState<CharacterModelEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'import'>('catalog');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Import form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customFormat, setCustomFormat] = useState<'GLB' | 'PMX' | 'gLTF' | 'VRM'>('GLB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubList = characterModelManager.subscribeModelList((updatedList) => {
      setModels(updatedList);
    });
    const unsubActive = characterModelManager.subscribeActiveModel((active) => {
      setActiveModel(active);
    });
    return () => {
      unsubList();
      unsubActive();
    };
  }, []);

  const showToast = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 3500);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleSelectModel = async (modelId: string) => {
    setIsProcessing(true);
    try {
      const success = await characterModelManager.setActiveModel(modelId);
      if (success) {
        showToast('3D मॉडल सफलतापूर्वक स्विच किया गया!');
      }
    } catch (e: any) {
      showToast('मॉडल लोड करने में त्रुटि: ' + (e?.message || 'अज्ञात कारण'), true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const imported = await characterModelManager.importModelFromDevice(file);
      showToast(`"${imported.name}" सफलतापूर्वक फ़ोन से जोड़ा गया!`);
      setActiveTab('catalog');
    } catch (err: any) {
      showToast('फ़ाइल इम्पोर्ट करने में त्रुटि: ' + (err?.message || 'Unknown error'), true);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setIsProcessing(true);
    try {
      const imported = await characterModelManager.importModelFromUrl(
        customName || 'Cloud 3D Model',
        customUrl,
        customFormat
      );
      showToast(`"${imported.name}" क्लाउड लिंक से जोड़ा गया!`);
      setCustomName('');
      setCustomUrl('');
      setActiveTab('catalog');
    } catch (err: any) {
      showToast('URL से जोड़ने में त्रुटि: ' + (err?.message || 'Invalid link'), true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteModel = async (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    if (window.confirm('क्या आप इस कस्टम मॉडल को हटाना चाहते हैं?')) {
      await characterModelManager.deleteCustomModel(modelId);
      showToast('मॉडल हटा दिया गया');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#0A0E1A] border border-cyan-500/30 rounded-3xl shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0E1528]/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Box className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                  3D Avatar Model Switcher
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-medium border border-cyan-500/30">
                    Zero APK Bloat
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  बिना APK भारी किए सीधे क्लाउड या फ़ोन स्टोरेज से मॉडल बदलें
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 px-4 pt-2 gap-2 bg-[#090C16]">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'catalog'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              मॉडल लाइब्रेरी ({models.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'import'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              नया मॉडल जोड़ें (Import)
            </button>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {successToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-4 mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                {successToast}
              </motion.div>
            )}
            {errorToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-4 mt-3 p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300 font-medium"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {errorToast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
            {activeTab === 'catalog' ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>सक्रिय मॉडल पर टैप करके तुरंत बदलें:</span>
                  <span className="font-mono text-[11px] text-cyan-400/80">
                    Active: {activeModel?.name}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {models.map((model) => {
                    const isActive = activeModel?.id === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectModel(model.id)}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                          isActive
                            ? 'bg-cyan-950/40 border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                            : 'bg-[#10162A]/60 border-white/10 hover:border-cyan-500/40 hover:bg-[#131B33]'
                        }`}
                      >
                        {/* 3D Icon or thumbnail */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isActive 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                            : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30'
                        }`}>
                          <Box className="w-6 h-6" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {model.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono font-medium">
                              {model.format}
                            </span>
                            {model.sourceType === 'local_storage' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <HardDrive className="w-3 h-3" /> Phone File
                              </span>
                            )}
                            {model.sourceType === 'cloud_cdn' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Cloud CDN
                              </span>
                            )}
                            {model.sourceType === 'built_in' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Built-in
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {model.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                            {model.sizeDisplay && <span>Size: {model.sizeDisplay}</span>}
                            {model.hasPhysics && <span className="text-cyan-400/90 font-medium">✦ Dynamic Physics</span>}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectModel(model.id);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-black text-slate-200 text-xs font-medium transition-all"
                            >
                              स्विच करें
                            </button>
                          )}

                          {model.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModel(e, model.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors"
                              title="हटाएं (Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* IMPORT TAB */
              <div className="space-y-4">
                {/* Method 1: Local File from Phone */}
                <div className="p-4 rounded-2xl bg-[#10162A]/70 border border-purple-500/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    फ़ोन स्टोरेज से मॉडल जोड़ें (Device File Picker)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    अपने फ़ोन की मेमोरी से कोई भी 3ds Max / Blender से एक्सपोर्ट किया हुआ <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">.glb</code>, <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">.pmx</code> या <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">.vrm</code> मॉडल सीधे सेलेक्ट करें।
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".glb,.gltf,.pmx,.vrm"
                    className="hidden"
                    id="phone-3d-model-upload"
                  />
                  <label
                    htmlFor="phone-3d-model-upload"
                    className="w-full py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  >
                    <Upload className="w-4 h-4" />
                    फ़ोन से 3D फ़ाइल चुनें (.glb, .pmx)
                  </label>
                  <p className="text-[11px] text-slate-400 text-center">
                    ✦ यह मॉडल आपके फ़ोन के सुरक्षित IndexedDB में रहता है — APK का साइज़ बिल्कुल नहीं बढ़ता!
                  </p>
                </div>

                {/* Method 2: Cloud URL Link */}
                <form onSubmit={handleUrlImport} className="p-4 rounded-2xl bg-[#10162A]/70 border border-blue-500/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Globe className="w-4 h-4 text-blue-400" />
                    क्लाउड लिंक / CDN URL से जोड़ें
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    अगर आपका मॉडल Google Drive (Direct link), GitHub Releases, Cloudflare R2 या Catbox पर अपलोड है, तो उसका डायरेक्ट URL यहाँ पेस्ट करें:
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="मॉडल का नाम (उदा. Cyber Warrior)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="url"
                      required
                      placeholder="डायरेक्ट 3D मॉडल लिंक (https://.../model.glb या .pmx)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400">फॉर्मेट:</span>
                      {(['GLB', 'PMX', 'VRM'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setCustomFormat(fmt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                            customFormat === fmt
                              ? 'bg-blue-500 text-white font-semibold shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !customUrl.trim()}
                    className="w-full mt-1 py-2.5 px-4 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/50 text-blue-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <LinkIcon className="w-4 h-4" />
                    लिंक से मॉडल जोड़ें (Add from Cloud)
                  </button>
                </form>

                {/* Info Card */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-cyan-200/90 leading-relaxed">
                    <strong>Zero APK Bloat गारंटी:</strong> सारे 3D मॉडल्स या तो क्लाउड से स्ट्रीम होते हैं या यूजर के फ़ोन ब्राउज़र स्टोरेज (IndexedDB) में रहते हैं। इससे आपका APK सिर्फ ~15MB का हल्का रहता है और कोई भी बड़ा मॉडल जोड़ने पर भी APK साइज़ 100MB+ नहीं होगा।
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#0E1528]/80 shrink-0">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              रियल-टाइम 3D रेंडरर इंजन
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              पूर्ण (Close)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
