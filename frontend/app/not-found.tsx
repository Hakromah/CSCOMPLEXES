"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home, Mail } from "lucide-react";

/* ─────────────────────────── helpers ─────────────────────────── */

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  hue: number;
}

/* ─────────────────────────── components ─────────────────────────── */

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: rand(0, 100),
        y: rand(0, 100),
        size: rand(2, 6),
        duration: rand(8, 20),
        delay: rand(0, 10),
        opacity: rand(0.15, 0.55),
        hue: rand(220, 260),
      }))
    );
  }, []);

  return (
    <div className="not-found__particles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="not-found__particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            background: `hsl(${p.hue}, 80%, 65%)`,
          }}
        />
      ))}
    </div>
  );
}

function Cube3D() {
  return (
    <div className="not-found__cube-scene" aria-hidden="true">
      <div className="not-found__cube">
        <div className="not-found__face not-found__face--front">404</div>
        <div className="not-found__face not-found__face--back">404</div>
        <div className="not-found__face not-found__face--right">404</div>
        <div className="not-found__face not-found__face--left">404</div>
        <div className="not-found__face not-found__face--top">404</div>
        <div className="not-found__face not-found__face--bottom">404</div>
      </div>
    </div>
  );
}

function GridLines() {
  return (
    <div className="not-found__grid" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`h${i}`} className="not-found__grid-line not-found__grid-line--h" style={{ top: `${i * 10}%` }} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`v${i}`} className="not-found__grid-line not-found__grid-line--v" style={{ left: `${i * 10}%` }} />
      ))}
    </div>
  );
}

function GlowOrb({ className }: { className?: string }) {
  return <div className={`not-found__orb ${className ?? ""}`} aria-hidden="true" />;
}

/* ─────────────────────────── main page ─────────────────────────── */

export default function NotFound() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  /* subtle mouse-parallax on the big "404" text */
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const rx = ((e.clientY / h) - 0.5) * 20;
      const ry = ((e.clientX / w) - 0.5) * -20;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <>
      <style>{`
        /* ── Reset / scope ── */
        .not-found {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #04060f;
          font-family: var(--font-sans, 'Inter', sans-serif);
          padding: 2rem;
        }

        /* ── Background grid ── */
        .not-found__grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .not-found__grid-line {
          position: absolute;
          background: rgba(57, 73, 149, 0.12);
        }
        .not-found__grid-line--h {
          left: 0; right: 0; height: 1px;
        }
        .not-found__grid-line--v {
          top: 0; bottom: 0; width: 1px;
        }

        /* ── Glow orbs ── */
        .not-found__orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: not-found-pulse 6s ease-in-out infinite;
        }
        .not-found__orb--blue {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(57,73,149,0.45) 0%, transparent 70%);
          top: -120px; left: -120px;
        }
        .not-found__orb--purple {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(120,60,200,0.30) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation-delay: -3s;
        }
        .not-found__orb--cyan {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(0,200,230,0.18) 0%, transparent 70%);
          top: 40%; left: 60%;
          animation-delay: -1.5s;
        }

        @keyframes not-found-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.12); opacity: 0.75; }
        }

        /* ── Floating particles ── */
        .not-found__particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .not-found__particle {
          position: absolute;
          border-radius: 50%;
          animation: not-found-float linear infinite;
        }
        @keyframes not-found-float {
          0%   { transform: translateY(0) scale(1); opacity: inherit; }
          50%  { transform: translateY(-40px) scale(1.3); }
          100% { transform: translateY(0) scale(1); opacity: inherit; }
        }

        /* ── 3-D Cube ── */
        .not-found__cube-scene {
          position: absolute;
          top: 10%;
          right: 6%;
          perspective: 600px;
          width: 120px;
          height: 120px;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .not-found__cube-scene { display: none; }
        }
        .not-found__cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: not-found-cube-spin 12s linear infinite;
        }
        @keyframes not-found-cube-spin {
          from { transform: rotateX(20deg) rotateY(0deg); }
          to   { transform: rotateX(20deg) rotateY(360deg); }
        }
        .not-found__face {
          position: absolute;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(57,73,149,0.5);
          background: rgba(57,73,149,0.12);
          backdrop-filter: blur(6px);
        }
        .not-found__face--front  { transform: translateZ(60px); }
        .not-found__face--back   { transform: rotateY(180deg) translateZ(60px); }
        .not-found__face--right  { transform: rotateY(90deg)  translateZ(60px); }
        .not-found__face--left   { transform: rotateY(-90deg) translateZ(60px); }
        .not-found__face--top    { transform: rotateX(90deg)  translateZ(60px); }
        .not-found__face--bottom { transform: rotateX(-90deg) translateZ(60px); }

        /* ── Secondary cube (bottom-left) ── */
        .not-found__cube-scene--sm {
          width: 70px; height: 70px;
          top: auto; right: auto;
          bottom: 12%; left: 5%;
          animation-delay: -6s;
        }
        .not-found__cube-scene--sm .not-found__face {
          width: 70px; height: 70px;
          font-size: 0.6rem;
        }
        .not-found__cube-scene--sm .not-found__face--front  { transform: translateZ(35px); }
        .not-found__cube-scene--sm .not-found__face--back   { transform: rotateY(180deg) translateZ(35px); }
        .not-found__cube-scene--sm .not-found__face--right  { transform: rotateY(90deg)  translateZ(35px); }
        .not-found__cube-scene--sm .not-found__face--left   { transform: rotateY(-90deg) translateZ(35px); }
        .not-found__cube-scene--sm .not-found__face--top    { transform: rotateX(90deg)  translateZ(35px); }
        .not-found__cube-scene--sm .not-found__face--bottom { transform: rotateX(-90deg) translateZ(35px); }

        /* ── Content card ── */
        .not-found__card {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 640px;
          width: 100%;
          padding: 3rem 2.5rem;
          border-radius: 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(57,73,149,0.30);
          backdrop-filter: blur(16px);
          box-shadow:
            0 0 60px rgba(57,73,149,0.25),
            0 0 0 1px rgba(255,255,255,0.05) inset;
          animation: not-found-card-in 0.9s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes not-found-card-in {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* ── Big 404 heading ── */
        .not-found__headline {
          font-size: clamp(5rem, 18vw, 11rem);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #7eb3ff 0%, #394995 40%, #a78bfa 80%, #60d5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
          text-shadow: none;
          display: block;
          will-change: transform;
          animation: not-found-headline-in 1s cubic-bezier(0.22,1,0.36,1) 0.2s both;
        }
        @keyframes not-found-headline-in {
          from { opacity: 0; transform: rotateX(40deg) translateY(-30px); }
          to   { opacity: 1; transform: rotateX(0deg)  translateY(0); }
        }

        /* ── Glowing underline ── */
        .not-found__line {
          margin: 1.25rem auto 1.5rem;
          width: 80px;
          height: 3px;
          border-radius: 99px;
          background: linear-gradient(90deg, #394995, #a78bfa, #60d5fa);
          animation: not-found-line-in 1s ease 0.5s both;
          box-shadow: 0 0 16px rgba(57,73,149,0.7);
        }
        @keyframes not-found-line-in {
          from { width: 0; opacity: 0; }
          to   { width: 80px; opacity: 1; }
        }

        /* ── Sub-text ── */
        .not-found__subtitle {
          font-size: clamp(1rem, 2.5vw, 1.35rem);
          color: rgba(255,255,255,0.70);
          margin-bottom: 0.75rem;
          animation: not-found-fade-up 0.9s ease 0.6s both;
        }
        .not-found__description {
          font-size: clamp(0.85rem, 1.8vw, 1rem);
          color: rgba(255,255,255,0.42);
          margin-bottom: 2.5rem;
          animation: not-found-fade-up 0.9s ease 0.75s both;
        }
        @keyframes not-found-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── CTA buttons ── */
        .not-found__actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          animation: not-found-fade-up 0.9s ease 0.9s both;
        }

        .not-found__btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .not-found__btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .not-found__btn:hover::before { opacity: 1; }
        .not-found__btn:hover { transform: translateY(-3px); }
        .not-found__btn:active { transform: translateY(0); }

        /* Primary — Home */
        .not-found__btn--primary {
          background: linear-gradient(135deg, #394995 0%, #5766cc 100%);
          color: #fff;
          box-shadow:
            0 4px 24px rgba(57,73,149,0.50),
            0 0 0 1px rgba(255,255,255,0.1) inset;
        }
        .not-found__btn--primary:hover {
          box-shadow:
            0 8px 36px rgba(57,73,149,0.70),
            0 0 0 1px rgba(255,255,255,0.15) inset;
        }

        /* Secondary — Contact */
        .not-found__btn--secondary {
          background: transparent;
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(57,73,149,0.55);
          box-shadow: 0 0 20px rgba(57,73,149,0.15);
        }
        .not-found__btn--secondary:hover {
          background: rgba(57,73,149,0.18);
          border-color: rgba(87,102,204,0.7);
          box-shadow: 0 8px 28px rgba(57,73,149,0.30);
        }

        /* ── Ring decorations ── */
        .not-found__ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(57,73,149,0.20);
          pointer-events: none;
          animation: not-found-ring-spin linear infinite;
        }
        .not-found__ring--1 {
          width: 600px; height: 600px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-duration: 30s;
        }
        .not-found__ring--2 {
          width: 850px; height: 850px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-duration: 50s;
          animation-direction: reverse;
          border-color: rgba(120,60,200,0.12);
        }
        @keyframes not-found-ring-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        .not-found__ring--1::after,
        .not-found__ring--2::after {
          content: '';
          position: absolute;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(87,102,204,0.8);
          top: -4px; left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px rgba(87,102,204,0.9);
        }
      `}</style>

      <section className="not-found">
        {/* Background layers */}
        <GridLines />
        <GlowOrb className="not-found__orb--blue" />
        <GlowOrb className="not-found__orb--purple" />
        <GlowOrb className="not-found__orb--cyan" />
        <FloatingParticles />

        {/* Rotating rings */}
        <div className="not-found__ring not-found__ring--1" aria-hidden="true" />
        <div className="not-found__ring not-found__ring--2" aria-hidden="true" />

        {/* 3-D spinning cubes */}
        <Cube3D />
        <div className="not-found__cube-scene not-found__cube-scene--sm" aria-hidden="true">
          <div className="not-found__cube">
            {(["front","back","right","left","top","bottom"] as const).map((f) => (
              <div key={f} className={`not-found__face not-found__face--${f}`}>404</div>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div className="not-found__card">
          {/* Mouse-parallax headline */}
          <h1 ref={titleRef} className="not-found__headline" style={{ perspective: "600px" }}>
            404
          </h1>

          {/* Glowing accent line */}
          <div className="not-found__line" aria-hidden="true" />

          <p className="not-found__subtitle">Oups&nbsp;! Page introuvable</p>
          <p className="not-found__description">
            Cette page est introuvable.<br />
            Elle a peut-être été déplacée, supprimée ou n'a jamais existé.
          </p>

          {/* CTA buttons */}
          <div className="not-found__actions">
            <Link href="/" className="not-found__btn not-found__btn--primary" id="not-found-accueil">
              <Home size={18} />
              Accueil
            </Link>
            <Link href="/contact" className="not-found__btn not-found__btn--secondary" id="not-found-nous-contacter">
              <Mail size={18} />
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
