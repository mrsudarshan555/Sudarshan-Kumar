/**
 * Edge Glow Ambient Ring (Phase I)
 * 
 * An elegant animated gradient perimeter glow that illuminates along the 4 edges
 * of the phone display when MAYRA is in an ACTIVE or LISTENING state.
 * 
 * Automatically respects the "Battery Saver" toggle:
 * When Battery Saver is enabled, the glow is completely disabled to conserve device power.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EdgeGlowRingProps {
  status: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | string;
  isBatterySaver?: boolean;
}

export const EdgeGlowRing: React.FC<EdgeGlowRingProps> = ({
  status,
  isBatterySaver = false
}) => {
  const [internalBatterySaver, setInternalBatterySaver] = useState<boolean>(() => {
    return localStorage.getItem('mayra_battery_saver') === 'true';
  });

  const [edgeGlowEnabled, setEdgeGlowEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mayra_edge_glow_enabled') !== 'false';
  });

  // Listen for storage changes
  useEffect(() => {
    const handleStorage = () => {
      setInternalBatterySaver(localStorage.getItem('mayra_battery_saver') === 'true');
      setEdgeGlowEnabled(localStorage.getItem('mayra_edge_glow_enabled') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('mayra-settings-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mayra-settings-changed', handleStorage);
    };
  }, []);

  const shouldShowGlow =
    edgeGlowEnabled &&
    !isBatterySaver &&
    !internalBatterySaver &&
    (status === 'LISTENING' || status === 'SPEAKING');

  const glowColor =
    status === 'LISTENING'
      ? 'from-cyan-500/35 via-fuchsia-500/25 to-purple-500/35'
      : status === 'SPEAKING'
      ? 'from-purple-500/30 via-pink-500/20 to-cyan-500/30'
      : 'from-cyan-500/20 via-purple-500/15 to-transparent';

  return (
    <AnimatePresence>
      {shouldShowGlow && (
        <motion.div
          key="edge-glow-ring"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute inset-0 z-40 rounded-[32px] overflow-hidden"
        >
          {/* Top Edge Glow */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${glowColor} blur-[2px] shadow-[0_0_16px_rgba(6,182,212,0.85)]`}
          />

          {/* Bottom Edge Glow */}
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${glowColor} blur-[2px] shadow-[0_0_16px_rgba(217,70,239,0.85)]`}
          />

          {/* Left Edge Glow */}
          <motion.div
            animate={{ opacity: [0.5, 0.95, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className={`absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b ${glowColor} blur-[2px] shadow-[0_0_16px_rgba(6,182,212,0.85)]`}
          />

          {/* Right Edge Glow */}
          <motion.div
            animate={{ opacity: [0.5, 0.95, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
            className={`absolute top-0 bottom-0 right-0 w-[3px] bg-gradient-to-b ${glowColor} blur-[2px] shadow-[0_0_16px_rgba(217,70,239,0.85)]`}
          />

          {/* Subtle perimeter corner halo */}
          <div className="absolute inset-0 rounded-[32px] border border-cyan-400/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.12)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
