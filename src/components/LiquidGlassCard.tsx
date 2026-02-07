import { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
  borderRadius?: number;
  animate?: boolean;
  style?: CSSProperties;
}

export default function LiquidGlassCard({
  children,
  className = '',
  glowColor = '#D4AF37',
  intensity = 1,
  borderRadius = 24,
  animate = true,
  style,
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const glowIntensity = isHovered ? intensity * 1.5 : intensity;

  return (
    <motion.div
      ref={cardRef}
      className={`liquid-glass-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'relative',
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        isolation: 'isolate',
        ...style,
      }}
    >
      {/* Animated gradient border */}
      <div
        className="liquid-glass-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${borderRadius}px`,
          padding: '1px',
          background: `linear-gradient(
            ${mousePosition.x * 3.6}deg,
            ${glowColor}40 0%,
            transparent 40%,
            transparent 60%,
            ${glowColor}30 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Glass reflection layer */}
      <div
        className="liquid-glass-reflection"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            ${glowColor}${Math.round(glowIntensity * 15).toString(16).padStart(2, '0')} 0%,
            transparent 50%
          )`,
          opacity: isHovered ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Liquid distortion effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={`liquid-distort-${Math.random().toString(36).substr(2, 9)}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015;0.02;0.015"
                dur="8s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isHovered ? 3 : 1}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Main glass background */}
      <div
        className="liquid-glass-bg"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.08) 0%,
              rgba(255, 255, 255, 0.02) 50%,
              rgba(255, 255, 255, 0.05) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: `${borderRadius}px`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
            0 0 ${isHovered ? 40 : 20}px ${glowColor}${Math.round(glowIntensity * 20).toString(16).padStart(2, '0')}
          `,
          transition: 'box-shadow 0.4s ease',
        }}
      />

      {/* Shimmer effect */}
      <div
        className="liquid-glass-shimmer"
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          )`,
          animation: isHovered ? 'shimmer 2s infinite' : 'none',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Top highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${glowColor}60, transparent)`,
          opacity: isHovered ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* Content */}
      <div
        className="liquid-glass-content"
        style={{
          position: 'relative',
          zIndex: 4,
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .liquid-glass-card {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .liquid-glass-card:hover {
          transform: translateY(-4px);
        }
        
        .liquid-glass-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(
            45deg,
            transparent 30%,
            ${glowColor}10 50%,
            transparent 70%
          );
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .liquid-glass-card:hover::before {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  );
}
