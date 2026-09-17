import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, Trash2, Camera, Sparkles, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { UserPersonalConfig } from '../../types';
import { useLanguage } from '../../services/i18n/languageContext';

export interface DefaultAvatarPreset {
  id: string;
  name: string;
  gradient: string;
  iconBg: string;
  accentColor: string;
  dataUrl: string;
}

// Generate stylish data URI SVG avatars for presets
function createSvgAvatarDataUrl(bgGradStart: string, bgGradEnd: string, accentColor: string, initials: string, symbol: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradStart}"/>
        <stop offset="100%" stop-color="${bgGradEnd}"/>
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="48" fill="url(#g)"/>
    <circle cx="100" cy="85" r="44" fill="url(#glow)" stroke="${accentColor}" stroke-width="2"/>
    <circle cx="100" cy="76" r="22" fill="${accentColor}" opacity="0.95"/>
    <path d="M58 140 C58 114 80 106 100 106 C120 106 142 114 142 140 Z" fill="${accentColor}" opacity="0.85"/>
    <text x="100" y="180" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">${symbol}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_AVATARS: DefaultAvatarPreset[] = [
  {
    id: 'cosmic_violet',
    name: 'Cosmic Violet (Default)',
    gradient: 'from-purple-900 via-indigo-950 to-[#0c0517]',
    iconBg: 'bg-purple-600',
    accentColor: '#a855f7',
    dataUrl: createSvgAvatarDataUrl('#4c1d95', '#0f051d', '#c084fc', 'M', 'MAYRA AI')
  },
  {
    id: 'cyber_cyan',
    name: 'Cyber Horizon',
    gradient: 'from-cyan-900 via-blue-950 to-slate-950',
    iconBg: 'bg-cyan-600',
    accentColor: '#06b6d4',
    dataUrl: createSvgAvatarDataUrl('#164e63', '#082f49', '#38bdf8', 'C', 'CYBER')
  },
  {
    id: 'solar_amber',
    name: 'Solar Flare',
    gradient: 'from-amber-900 via-orange-950 to-stone-950',
    iconBg: 'bg-amber-600',
    accentColor: '#f59e0b',
    dataUrl: createSvgAvatarDataUrl('#78350f', '#451a03', '#fbbf24', 'S', 'SOLAR')
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Core',
    gradient: 'from-emerald-900 via-teal-950 to-zinc-950',
    iconBg: 'bg-emerald-600',
    accentColor: '#10b981',
    dataUrl: createSvgAvatarDataUrl('#064e3b', '#022c22', '#34d399', 'E', 'NEXUS')
  },
  {
    id: 'crimson_pulse',
    name: 'Crimson Pulse',
    gradient: 'from-rose-900 via-pink-950 to-neutral-950',
    iconBg: 'bg-rose-600',
    accentColor: '#f43f5e',
    dataUrl: createSvgAvatarDataUrl('#881337', '#4c0519', '#fb7185', 'R', 'PULSE')
  },
  {
    id: 'sleek_onyx',
    name: 'Sleek Onyx',
    gradient: 'from-slate-800 via-gray-900 to-black',
    iconBg: 'bg-slate-700',
    accentColor: '#94a3b8',
    dataUrl: createSvgAvatarDataUrl('#334155', '#0f172a', '#e2e8f0', 'O', 'GUARDIAN')
  }
];

export const FALLBACK_DEFAULT_PHOTO = DEFAULT_AVATARS[0].dataUrl;

interface ProfilePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  onPhotoUpdated?: (newPhotoUrl: string) => void;
}

export const ProfilePhotoUploadModal: React.FC<ProfilePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  personalConfig,
  setPersonalConfig,
  onPhotoUpdated
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string>(() => {
    return personalConfig.profilePhoto || personalConfig.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('mayra_user_avatar') : null) || FALLBACK_DEFAULT_PHOTO;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentActivePhoto = personalConfig.profilePhoto || personalConfig.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('mayra_user_avatar') : null) || FALLBACK_DEFAULT_PHOTO;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        applyNewPhoto(dataUrl);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  const applyNewPhoto = (photoUrl: string) => {
    setPreviewPhoto(photoUrl);
    setPersonalConfig(prev => ({
      ...prev,
      profilePhoto: photoUrl,
      avatarUrl: photoUrl
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_user_avatar', photoUrl);
    }
    if (onPhotoUpdated) {
      onPhotoUpdated(photoUrl);
    }
    setToastMessage(t.photoUpdatedToast);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleSelectPreset = (preset: DefaultAvatarPreset) => {
    setSelectedPresetId(preset.id);
    applyNewPhoto(preset.dataUrl);
  };

  const handleResetToDefault = () => {
    applyNewPhoto(FALLBACK_DEFAULT_PHOTO);
    setSelectedPresetId(DEFAULT_AVATARS[0].id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-sm bg-[#120a22] border border-purple-500/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                {t.profilePhoto}
              </h3>
              <p className="text-[11px] text-purple-300/70">
                {t.changePhoto}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20">
          
          {/* Active Photo Preview */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-[#1a1130] flex items-center justify-center">
                <img
                  src={previewPhoto || currentActivePhoto}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg border border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="mt-3 text-xs font-bold text-white font-sans">
              {personalConfig.fullName || 'User Profile'}
            </p>
            <p className="text-[10px] text-purple-300/70">
              {personalConfig.email || 'mindsetzafer@gmail.com'}
            </p>
          </div>

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{t.uploadPhoto}</span>
                </>
              )}
            </button>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Supports PNG, JPG, GIF, WEBP up to 5MB
            </p>
          </div>

          {/* Default / Preset Avatars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {t.chooseDefaultPhoto}
              </span>
              <button
                onClick={handleResetToDefault}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
              >
                {t.removePhoto}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {DEFAULT_AVATARS.map((preset) => {
                const isSelected = previewPhoto === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1.5 border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-purple-400 bg-purple-900/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 relative">
                      <img
                        src={preset.dataUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/50 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-200 truncate w-full text-center">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toast Notice */}
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-purple-500/20 bg-white/[0.02] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
