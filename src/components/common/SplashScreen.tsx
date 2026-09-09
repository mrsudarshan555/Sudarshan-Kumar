import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  isVisible: boolean;
  isFading: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible, isFading }) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07040D] select-none transition-opacity duration-700 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 45%, #18092B 0%, #0C0517 40%, #06020A 100%)'
      }}
    >
      {/* Background Soft Violet Atmosphere */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[320px] h-[320px] rounded-full bg-purple-600/15 blur-3xl" />
        <div className="w-[200px] h-[200px] rounded-full bg-fuchsia-600/10 blur-2xl -mt-16" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Luminous Purple Butterfly (Exact Symmetrical Match from Screenshot) */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: [0.98, 1.02, 0.98], opacity: 1 }}
          transition={{
            scale: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
            opacity: { duration: 0.6 }
          }}
          className="relative w-44 h-36 flex items-center justify-center drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]"
        >
          <svg
            viewBox="0 0 280 220"
            className="w-full h-full object-contain"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Outer Wing Gradient - Vibrant Purple to Deep Amethyst */}
              <linearGradient id="bfUpperWingLeft" x1="140" y1="110" x2="30" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4C1D95" />
                <stop offset="35%" stopColor="#7E22CE" />
                <stop offset="70%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#D8B4FE" />
              </linearGradient>

              <linearGradient id="bfUpperWingRight" x1="140" y1="110" x2="250" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4C1D95" />
                <stop offset="35%" stopColor="#7E22CE" />
                <stop offset="70%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#D8B4FE" />
              </linearGradient>

              {/* Lower Wings Gradient */}
              <linearGradient id="bfLowerWingLeft" x1="140" y1="110" x2="60" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B0764" />
                <stop offset="40%" stopColor="#6B21A8" />
                <stop offset="75%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>

              <linearGradient id="bfLowerWingRight" x1="140" y1="110" x2="220" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B0764" />
                <stop offset="40%" stopColor="#6B21A8" />
                <stop offset="75%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>

              {/* Veins / Highlight Glow Gradient */}
              <linearGradient id="bfVeinGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5D0FE" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#9333EA" stopOpacity="0.4" />
              </linearGradient>

              {/* Feather Feathered Texture Filter */}
              <radialGradient id="bfCenterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F0ABFC" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#A855F7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B0764" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Central Ethereal Radial Aura */}
            <circle cx="140" cy="110" r="70" fill="url(#bfCenterGlow)" />

            {/* ================= LEFT WINGS ================= */}
            <g id="left-wing">
              {/* Lower Wing Back Base */}
              <path
                d="M138 112 C120 120, 95 138, 76 158 C62 173, 68 190, 88 188 C104 186, 116 174, 126 160 C133 150, 137 135, 138 112 Z"
                fill="url(#bfLowerWingLeft)"
                opacity="0.95"
              />
              {/* Lower Wing Scallops & Feathers */}
              <path
                d="M138 115 C118 126, 92 148, 80 172 C88 178, 102 178, 114 168 C124 158, 134 140, 138 115 Z"
                fill="#A855F7"
                opacity="0.6"
              />
              <path
                d="M138 118 C125 132, 108 152, 98 172 C104 175, 115 172, 122 163 C130 152, 136 135, 138 118 Z"
                fill="#E879F9"
                opacity="0.4"
              />

              {/* Upper Main Wing Silhouette with Feathered Scallops */}
              <path
                d="M138 108 C132 85, 112 52, 85 30 C72 19, 56 18, 48 27 C42 34, 44 48, 52 60 C42 66, 38 78, 44 88 C50 97, 62 102, 60 110 C58 117, 48 126, 54 135 C60 144, 76 142, 92 135 C112 126, 130 116, 138 108 Z"
                fill="url(#bfUpperWingLeft)"
              />

              {/* Upper Wing Interior Feathered Folds & Depth Layers */}
              <path
                d="M136 104 C130 86, 114 62, 92 44 C82 36, 70 36, 65 44 C61 50, 64 60, 72 68 C62 74, 60 84, 66 92 C72 98, 84 100, 85 108 C86 114, 78 120, 84 127 C88 132, 100 128, 112 122 C124 116, 133 110, 136 104 Z"
                fill="#C084FC"
                opacity="0.55"
              />
              <path
                d="M134 100 C128 85, 116 68, 100 54 C92 48, 84 50, 80 56 C78 62, 82 70, 88 76 C80 80, 79 90, 84 96 C90 102, 102 104, 116 110 C126 106, 132 102, 134 100 Z"
                fill="#F0ABFC"
                opacity="0.4"
              />

              {/* Luminous Wing Veins (Radiating gracefully) */}
              <path
                d="M136 105 Q108 75 60 40"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M136 106 Q98 86 52 76"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M136 107 Q95 104 62 105"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M136 109 Q100 120 70 133"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M136 113 Q108 142 85 176"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M136 114 Q122 148 108 178"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Glowing Feather Veinlets */}
              <path d="M96 64 Q80 50 68 45" stroke="#F5D0FE" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
              <path d="M88 78 Q72 70 58 66" stroke="#F5D0FE" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
              <path d="M85 96 Q70 94 56 94" stroke="#F5D0FE" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
            </g>

            {/* ================= RIGHT WINGS (Symmetrical Mirror) ================= */}
            <g id="right-wing">
              {/* Lower Wing Back Base */}
              <path
                d="M142 112 C160 120, 185 138, 204 158 C218 173, 212 190, 192 188 C176 186, 164 174, 154 160 C147 150, 143 135, 142 112 Z"
                fill="url(#bfLowerWingRight)"
                opacity="0.95"
              />
              {/* Lower Wing Scallops & Feathers */}
              <path
                d="M142 115 C162 126, 188 148, 200 172 C192 178, 178 178, 166 168 C156 158, 146 140, 142 115 Z"
                fill="#A855F7"
                opacity="0.6"
              />
              <path
                d="M142 118 C155 132, 172 152, 182 172 C176 175, 165 172, 158 163 C150 152, 144 135, 142 118 Z"
                fill="#E879F9"
                opacity="0.4"
              />

              {/* Upper Main Wing Silhouette with Feathered Scallops */}
              <path
                d="M142 108 C148 85, 168 52, 195 30 C208 19, 224 18, 232 27 C238 34, 236 48, 228 60 C238 66, 242 78, 236 88 C230 97, 218 102, 220 110 C222 117, 232 126, 226 135 C220 144, 204 142, 188 135 C168 126, 150 116, 142 108 Z"
                fill="url(#bfUpperWingRight)"
              />

              {/* Upper Wing Interior Feathered Folds & Depth Layers */}
              <path
                d="M144 104 C150 86, 166 62, 188 44 C198 36, 210 36, 215 44 C219 50, 216 60, 208 68 C218 74, 220 84, 214 92 C208 98, 196 100, 195 108 C194 114, 202 120, 196 127 C192 132, 180 128, 168 122 C156 116, 147 110, 144 104 Z"
                fill="#C084FC"
                opacity="0.55"
              />
              <path
                d="M146 100 C152 85, 164 68, 180 54 C188 48, 196 50, 200 56 C202 62, 198 70, 192 76 C200 80, 201 90, 196 96 C190 102, 178 104, 164 110 C154 106, 148 102, 146 100 Z"
                fill="#F0ABFC"
                opacity="0.4"
              />

              {/* Luminous Wing Veins (Radiating gracefully) */}
              <path
                d="M144 105 Q172 75 220 40"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M144 106 Q182 86 228 76"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M144 107 Q185 104 218 105"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M144 109 Q180 120 210 133"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M144 113 Q172 142 195 176"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M144 114 Q158 148 172 178"
                stroke="url(#bfVeinGlow)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Glowing Feather Veinlets */}
              <path d="M184 64 Q200 50 212 45" stroke="#F5D0FE" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
              <path d="M192 78 Q208 70 222 66" stroke="#F5D0FE" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
              <path d="M195 96 Q210 94 224 94" stroke="#F5D0FE" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
            </g>

            {/* ================= CENTRAL BODY & ANTENNAE ================= */}
            {/* Soft Antennae */}
            <path
              d="M139 96 Q134 82 126 72 Q122 68 118 69"
              stroke="#D8B4FE"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx="117" cy="69" r="1.5" fill="#F0ABFC" />

            <path
              d="M141 96 Q146 82 154 72 Q158 68 162 69"
              stroke="#D8B4FE"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx="163" cy="69" r="1.5" fill="#F0ABFC" />

            {/* Center Thorax / Body */}
            <ellipse cx="140" cy="116" rx="3.2" ry="24" fill="#2E1065" />
            <ellipse cx="140" cy="114" rx="2" ry="20" fill="#9333EA" opacity="0.9" />
            <ellipse cx="140" cy="112" rx="1.1" ry="14" fill="#F0ABFC" opacity="0.75" />
          </svg>
        </motion.div>

        {/* Title: Mayra (Exact font, weight, clean white) */}
        <h1 className="mt-5 text-[28px] font-bold text-white tracking-tight font-sans drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]">
          Mayra
        </h1>

        {/* Subtitle: One moment... loading 💗 (Exact matching screenshot) */}
        <p className="mt-2 text-sm text-[#9CA3AF] font-sans flex items-center justify-center gap-1 font-normal tracking-wide">
          One moment... loading <span className="text-pink-400 select-none text-base">💗</span>
        </p>

        {/* Circular Magenta / Hot Pink Smooth Spinner (Exact matching screenshot) */}
        <div className="mt-7 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-[3.5px] border-pink-500/15 border-t-[#EC4899] border-r-[#EC4899] animate-spin drop-shadow-[0_0_14px_rgba(236,72,153,0.7)]"
            style={{ animationDuration: '0.85s' }}
          />
        </div>
      </div>
    </div>
  );
};
