'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  gravity: number;
}

export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const count = 80;

    const makeParticle = (): Particle => ({
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height + 20,
      size: 5 + Math.random() * 12,
      // Launch upwards!
      speedY: -6 - Math.random() * 8,
      speedX: (Math.random() - 0.5) * 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      opacity: 1,
      gravity: 0.2 + Math.random() * 0.15,
    });

    // Populate active burst particles
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle());
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.6, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.5, -p.size * 0.6, -p.size * 0.5, 0, -p.size);

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(244, 179, 194, 0.95)' : 'rgba(232, 140, 170, 0.9)';
      ctx.fill();

      ctx.restore();
    };

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2500) {
        // Stop animation after 2.5 seconds
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Apply physics
        p.speedY += p.gravity;
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        // Slowly fade out over time
        if (elapsed > 1500) {
          p.opacity = Math.max(0, 1 - (elapsed - 1500) / 1000);
        }

        drawPetal(p);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      aria-hidden="true"
    />
  );
}
