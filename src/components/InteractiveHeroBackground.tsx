/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";

interface InteractiveHeroBackgroundProps {
  className?: string;
}

export function InteractiveHeroBackground({ className = "" }: InteractiveHeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    // Responsive node count based on screen size
    const nodeCount = Math.min(Math.floor((width * height) / 18000), 55);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
      color: string;
    }

    const colors = [
      "rgba(99, 102, 241, ", // indigo
      "rgba(56, 189, 248, ", // sky
      "rgba(129, 140, 248, ", // periwinkle
      "rgba(52, 211, 153, ", // emerald
    ];

    const particles: Particle[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 1,
      baseAlpha: Math.random() * 0.4 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Efficient background processing via IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !animFrameRef.current) {
            loop();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y, active: true };

      // Update CSS custom properties for container spotlight
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      container.style.setProperty("--mouse-x", `${xPercent}%`);
      container.style.setProperty("--mouse-y", `${yPercent}%`);
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    const loop = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Draw subtle interactive lines between nearby nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move particles
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce at boundaries
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse attraction/deflection physics
        if (mouse.active) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 0.03;
            p1.vx += (dx / dist) * force;
            p1.vy += (dy / dist) * force;

            // Draw line to pointer
            const alpha = (1 - dist / maxDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Speed friction damping
        p1.vx *= 0.99;
        p1.vy *= 0.99;

        // Draw connections with neighbor particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxConnDist = 95;

          if (dist < maxConnDist) {
            const alpha = (1 - dist / maxConnDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p1.color}${p1.baseAlpha})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-auto select-none ${className}`}
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as React.CSSProperties
      }
    >
      {/* 1. Base grid lines */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25" 
      />

      {/* 2. Interactive Spotlight that illuminates the grid under the cursor */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-80"
        style={{
          background: `radial-gradient(650px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.05), transparent 70%)`
        }}
      />

      {/* 3. Deep ambient glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 4. Canvas with interactive physics particles */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
