import { useEffect, useRef } from 'react';

interface LiquidEtherProps {
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  colors?: string[];
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  isBounce?: boolean;
  resolution?: number;
  className?: string;
  opacity?: number;
}

const LiquidEther = ({
  mouseForce = 15,
  cursorSize = 150,
  isViscous = true,
  viscous = 40,
  colors = ["#8B7355", "#D4AF37", "#C9A961", "#2C1810"],
  autoDemo = true,
  autoSpeed = 0.2,
  autoIntensity = 1.2,
  isBounce = false,
  resolution = 0.5,
  className = '',
  opacity = 0.3,
}: LiquidEtherProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth * resolution;
    let height = canvas.offsetHeight * resolution;
    canvas.width = width;
    canvas.height = height;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    const numParticles = 80;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * autoSpeed * autoIntensity * 0.5,
        vy: (Math.random() - 0.5) * autoSpeed * autoIntensity * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * cursorSize * 0.8 + cursorSize * 0.4,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 100,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * resolution;
      mouseY = (e.clientY - rect.top) * resolution;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      time += 0.005;
      
      // Smoother fade for more fluid effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, i) => {
        // Subtle wave motion
        if (autoDemo) {
          const waveX = Math.sin(time * 0.5 + i * 0.05) * autoSpeed * 0.05;
          const waveY = Math.cos(time * 0.3 + i * 0.07) * autoSpeed * 0.05;
          p.vx += waveX;
          p.vy += waveY;
        }

        // Gentle mouse attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cursorSize * 3) {
          const force = (1 - dist / (cursorSize * 3)) * mouseForce * 0.003;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        // Viscosity
        if (isViscous) {
          p.vx *= 1 - viscous * 0.0008;
          p.vy *= 1 - viscous * 0.0008;
        } else {
          p.vx *= 0.995;
          p.vy *= 0.995;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (isBounce) {
          if (p.x < 0 || p.x > width) p.vx *= -0.5;
          if (p.y < 0 || p.y > height) p.vy *= -0.5;
        } else {
          if (p.x < -p.size) p.x = width + p.size;
          if (p.x > width + p.size) p.x = -p.size;
          if (p.y < -p.size) p.y = height + p.size;
          if (p.y > height + p.size) p.y = -p.size;
        }

        // Breathing effect
        p.life += 0.5;
        const breathe = Math.sin(p.life * 0.02) * 0.3 + 0.7;
        const currentSize = p.size * breathe;

        // Draw with softer gradients
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        gradient.addColorStop(0, p.color + '40');
        gradient.addColorStop(0.3, p.color + '25');
        gradient.addColorStop(0.6, p.color + '10');
        gradient.addColorStop(1, p.color + '00');

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.offsetWidth * resolution;
      height = canvas.offsetHeight * resolution;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mouseForce, cursorSize, isViscous, viscous, colors, autoDemo, autoSpeed, autoIntensity, isBounce, resolution]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        opacity: opacity,
      }}
    />
  );
};

export default LiquidEther;
