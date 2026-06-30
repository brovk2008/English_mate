'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  sway: number;
  swayOffset: number;
}

export default function SakuraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const petalsRef = useRef<Petal[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) return; // respect accessibility preference

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Petal count scales with screen width — fewer on mobile
    const COUNT = Math.floor(width / 20);

    const makePetal = (startY = -20): Petal => ({
      x: Math.random() * width,
      y: startY,
      size: 6 + Math.random() * 10,
      speedY: 0.6 + Math.random() * 1.2,
      speedX: -0.3 + Math.random() * 0.6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      opacity: 0.4 + Math.random() * 0.5,
      sway: 0.8 + Math.random() * 1.5,
      swayOffset: Math.random() * Math.PI * 2,
    });

    // Initialise petals spread across the full screen height so they
    // don't all appear at once on load
    petalsRef.current = Array.from({ length: COUNT }, () =>
      makePetal(Math.random() * height)
    );

    // Draw a single sakura petal shape (5-petal flower petal, elongated oval)
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // Petal shape: two bezier curves forming an almond/teardrop
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.6, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.5, -p.size * 0.6, -p.size * 0.5, 0, -p.size);

      // Light mode petal color — CSS var read from root
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(232, 166, 184, 0.7)' : 'rgba(232, 140, 170, 0.6)';
      ctx.fill();

      // Subtle vein line down the centre
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.8);
      ctx.lineTo(0, p.size * 0.8);
      ctx.strokeStyle = isDark ? 'rgba(255,200,220,0.25)' : 'rgba(180,80,120,0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.01;

      petalsRef.current.forEach((p) => {
        // Sinusoidal sideways sway
        p.x += p.speedX + Math.sin(t + p.swayOffset) * p.sway * 0.04;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        drawPetal(p);

        // Reset petal to top when it falls off screen
        if (p.y > height + 20) {
          Object.assign(p, makePetal());
          p.y = -20;
        }
        // Wrap horizontal overflow
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
