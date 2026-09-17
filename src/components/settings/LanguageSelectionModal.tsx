import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Check, Search, Sparkles } from 'lucide-react';
import { useLanguage, LanguageCode } from '../../services/i18n/languageContext';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle
}) => {
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = languages.filter((lang) =>
    lang.label.toLowerCase().includes(search.toLowerCase()) ||
    lang.native.toLowerCase().includes(search.toLowerCase()) ||
    lang.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-[#0f1017] border border-purple-500/20 rounded-t-[28px] sm:rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#131420]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {title || t.chooseLanguage}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {subtitle || t.chooseLanguageSub}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-white/5 bg-[#0c0d14] shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search language / भाषा खोजें..."
                className="w-full pl-8 pr-4 py-2 bg-[#171824] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-all"
              />
            </div>
          </div>

          {/* Language List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
            {filteredLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-[#141520] border-white/5 hover:border-white/20 text-gray-200 hover:bg-[#191b29]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white/5 text-gray-400 border border-white/5'
                      }`}
                    >
                      {lang.code.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {lang.label}
                        </span>
                        <span className="text-xs text-purple-300 font-medium font-sans">
                          ({lang.native})
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {lang.code === 'hi' && 'हिंदी में सभी सेटिंग्स व अनुमतियां'}
                        {lang.code === 'hinglish' && 'Hinglish style natural voice & explanations'}
                        {lang.code === 'en' && 'English descriptive text & privacy details'}
                        {lang.code === 'ur' && 'اردو زبان میں تمام تر تفصیلات'}
                        {lang.code === 'bn' && 'বাংলা ভাষায় সমস্ত নির্দেশাবলী'}
                        {lang.code === 'te' && 'తెలుగు వివరణలు మరియు అనుమతులు'}
                        {lang.code === 'ta' && 'தமிழ் விளக்கங்கள் மற்றும் அனுமதிகள்'}
                        {lang.code === 'mr' && 'मराठी संपूर्ण मार्गदर्शन'}
                        {lang.code === 'gu' && 'ગુજરાતી વિગતવાર માર્ગદર્શન'}
                        {lang.code === 'kn' && 'ಕನ್ನಡ ವಿವರಣೆಗಳು'}
                        {lang.code === 'ml' && 'മലയാളം വിവരണങ്ങൾ'}
                        {lang.code === 'pa' && 'ਪੰਜਾਬੀ ਵੇਰਵੇ'}
                        {lang.code === 'es' && 'Explicaciones en Español'}
                        {lang.code === 'fr' && 'Détails en Français'}
                        {lang.code === 'de' && 'Erklärungen auf Deutsch'}
                        {lang.code === 'ar' && 'شروحات وتفاصيل باللغة العربية'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-[#0a0b10] border-t border-white/5 text-center shrink-0">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Permission explanations & privacy notices instantly adapt.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
