import React, { useEffect, useRef } from 'react';
import { AssistantStatus, AppearanceConfig } from '../../types';

interface HomeAtmosphereBackgroundProps {
  status: AssistantStatus;
  appearanceConfig?: AppearanceConfig;
}

interface SilkWave {
  y: number;
  length: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
}

export const HomeAtmosphereBackground: React.FC<HomeAtmosphereBackgroundProps> = ({
  status
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSpeaking = status === 'SPEAKING';
  const isListening = status === 'LISTENING';
  const isThinking = status === 'THINKING';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Flowing velvet violet silk waves matching .mp4 video
    let step = 0;

    const render = () => {
      step += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Deep rich gradient backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0418');
      bgGrad.addColorStop(0.5, '#0f0522');
      bgGrad.addColorStop(1, '#05020c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Central Vertical Flowing Aurora Ribbon with dual-tone split (Hot Magenta on right, Blue-Violet on left)
      ctx.save();
      ctx.filter = 'blur(45px)';
      const ribbonGrad = ctx.createLinearGradient(0, 0, width, height);
      ribbonGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)'); // Electric indigo
      ribbonGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.45)'); // Violet
      ribbonGrad.addColorStop(0.7, 'rgba(217, 70, 239, 0.55)'); // Hot Magenta
      ribbonGrad.addColorStop(1, 'rgba(236, 72, 153, 0.40)'); // Pink

      ctx.beginPath();
      const midX = width * 0.52 + Math.sin(step * 0.8) * (width * 0.14);
      ctx.moveTo(midX - 90, 0);
      ctx.bezierCurveTo(
        midX + 180 + Math.sin(step) * 60,
        height * 0.35,
        midX - 200 + Math.cos(step * 0.7) * 70,
        height * 0.65,
        midX + 80,
        height
      );
      ctx.lineTo(midX - 70, height);
      ctx.bezierCurveTo(
        midX - 240 + Math.cos(step * 0.7) * 70,
        height * 0.65,
        midX + 110 + Math.sin(step) * 60,
        height * 0.35,
        midX - 170,
        0
      );
      ctx.closePath();
      ctx.fillStyle = ribbonGrad;
      ctx.fill();
      ctx.restore();

      // 2. Dynamic Fluid Curved Silk Ribbons
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height * 0.4 + i * 40);

        for (let x = 0; x < width; x += 10) {
          const y =
            height * 0.45 +
            Math.sin(x * 0.004 + step + i * 1.5) * 55 +
            Math.cos(x * 0.002 - step * 0.8) * 35;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, 0, width, height);
        if (i === 0) {
          waveGrad.addColorStop(0, 'rgba(168, 85, 247, 0.20)');
          waveGrad.addColorStop(1, 'rgba(217, 70, 239, 0.04)');
        } else if (i === 1) {
          waveGrad.addColorStop(0, 'rgba(147, 51, 234, 0.14)');
          waveGrad.addColorStop(1, 'rgba(76, 29, 149, 0.03)');
        } else {
          waveGrad.addColorStop(0, 'rgba(192, 132, 252, 0.10)');
          waveGrad.addColorStop(1, 'rgba(15, 5, 29, 0)');
        }

        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Dynamic Velvet Purple Silk Wave Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Deep Central Ambient Aurora Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isSpeaking
            ? 'opacity-85 scale-105'
            : isListening
            ? 'opacity-75 animate-pulse'
            : isThinking
            ? 'opacity-65'
            : 'opacity-50'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 38%, rgba(168, 85, 247, 0.22) 0%, rgba(124, 58, 237, 0.12) 35%, rgba(15, 5, 29, 0) 75%)'
        }}
      />

      {/* Top Specular Violet Glow */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[140%] h-[60%] opacity-35 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(192, 132, 252, 0.25) 0%, rgba(139, 92, 246, 0.10) 50%, transparent 80%)'
        }}
      />
    </div>
  );
};
