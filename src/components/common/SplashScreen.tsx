import React from 'react';
import { motion } from 'motion/react';
import { MayraLogo } from './MayraLogo';

interface SplashScreenProps {
  isVisible: boolean;
  isFading: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible, isFading }) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-300 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0d276b 0%, #173b8a 35%, #0d1a3a 70%, #05060b 100%)'
      }}
    >
      {/* Background Soft Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[340px] h-[340px] rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="w-[200px] h-[200px] rounded-full bg-indigo-500/25 blur-2xl -mt-10" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative flex flex-col items-center gap-3"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/[0.08] border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.35)]">
            <MayraLogo size={46} showGlow={true} />
          </div>

          <div className="text-center mt-1">
            <h1 className="text-xl font-bold text-white tracking-wider">
              MAYRA
            </h1>
            <p className="text-[11px] text-blue-200/80 font-medium tracking-widest uppercase">
              Autonomous AI Companion
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
