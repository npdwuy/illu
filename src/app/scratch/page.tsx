'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bodoni_Moda } from 'next/font/google';
import {
  Camera,
  Heart,
  Sparkles,
  Code,
  Eye,
  Palette,
  Layers,
  Settings,
  Sliders,
  ChevronRight,
  Clock,
  Compass,
  LayoutTemplate
} from 'lucide-react';

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-bodoni',
});

interface ColorBadgeProps {
  name: string;
  variable: string;
  hex: string;
}

function ColorBadge({ name, variable, hex }: ColorBadgeProps) {
  return (
    <div className="flex flex-col p-3 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: hex || `var(${variable})` }} />
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <code className="text-xs text-neutral-500">{variable}</code>
        </div>
      </div>
    </div>
  );
}

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const GearIcon = ({ className, size = 100, speed = '20s', reverse = false }: { className?: string; size?: number; speed?: string; reverse?: boolean }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={`${className} animate-spin`} 
    style={{ 
      animationDuration: speed,
      animationDirection: reverse ? 'reverse' : 'normal',
    }}
  >
    <path 
      fill="currentColor" 
      d="M50,32.5 C40.335,32.5 32.5,40.335 32.5,50 C32.5,59.665 40.335,67.5 50,67.5 C59.665,67.5 67.5,59.665 67.5,50 C67.5,40.335 59.665,32.5 50,32.5 Z M50,60 C44.477,60 40,55.523 40,50 C40,44.477 44.477,40 50,40 C55.523,40 60,44.477 60,50 C60,55.523 55.523,60 50,60 Z"
    />
    <path 
      fill="currentColor"
      d="M93.3,46.7 L84.4,45.2 C83.7,42.8 82.7,40.5 81.3,38.4 L87.1,31.6 C87.9,30.7 87.8,29.3 86.9,28.4 L81.6,23.1 C80.7,22.2 79.3,22.1 78.4,22.9 L71.6,28.7 C69.5,27.3 67.2,26.3 64.8,25.6 L63.3,16.7 C63.1,15.5 62,14.6 60.8,14.6 L53.3,14.6 C52.1,14.6 51,15.5 50.8,16.7 L49.3,25.6 C46.9,26.3 44.6,27.3 42.5,28.7 L35.7,22.9 C34.8,22.1 33.4,22.2 32.5,23.1 L27.2,28.4 C26.3,29.3 26.2,30.7 27,31.6 L32.8,38.4 C31.4,40.5 30.4,42.8 29.7,45.2 L20.8,46.7 C19.6,46.9 18.7,48 18.7,49.2 L18.7,56.7 C18.7,57.9 19.6,59 20.8,59.2 L29.7,60.7 C30.4,63.1 31.4,65.4 32.8,67.5 L27,74.3 C26.2,75.2 26.3,76.6 27.2,77.5 L32.5,82.8 C33.4,83.7 34.8,83.8 35.7,83 L42.5,77.2 C44.6,78.6 46.9,79.6 49.3,80.3 L50.8,89.2 C51,90.4 52.1,91.3 53.3,91.3 L60.8,91.3 C62,91.3 63.1,90.4 63.3,89.2 L64.8,80.3 C67.2,79.6 69.5,78.6 71.6,77.2 L78.4,83 C79.3,83.8 80.7,83.7 81.6,82.8 L86.9,77.5 C87.8,76.6 87.9,75.2 87.1,74.3 L81.3,67.5 C82.7,65.4 83.7,63.1 84.4,60.7 L93.3,59.2 C94.5,59 95.4,57.9 95.4,56.7 L95.4,49.2 C95.4,48 94.5,46.9 93.3,46.7 Z"
    />
  </svg>
);

export default function ScratchPage() {
  const [accentColor, setAccentColor] = useState<'blue' | 'cyan' | 'purple'>('blue');
  const [glassStrength, setGlassStrength] = useState<number>(30);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Clock references
  const hourHandRef = useRef<HTMLDivElement>(null);
  const minuteHandRef = useRef<HTMLDivElement>(null);
  const secondHandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let animationFrameId: number;

    function renderClock() {
      const now = new Date();
      const milliseconds = now.getMilliseconds();
      const seconds = now.getSeconds() + milliseconds / 1000;
      const minutes = now.getMinutes() + seconds / 60;
      const hours = (now.getHours() % 12) + minutes / 60;

      if (secondHandRef.current) {
        secondHandRef.current.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
      }
      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `translateX(-50%) rotate(${hours * 30}deg)`;
      }

      animationFrameId = requestAnimationFrame(renderClock);
    }

    renderClock();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMounted]);

  const getAccentClass = () => {
    switch (accentColor) {
      case 'cyan': return 'text-cyan-400';
      case 'purple': return 'text-purple-400';
      default: return 'text-blue-500';
    }
  };

  const getAccentBgClass = () => {
    switch (accentColor) {
      case 'cyan': return 'bg-cyan-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className={`min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto ${bodoniModa.variable}`}>
      {/* Clock Custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --clock-size: min(85vw, 420px);
        }

        .watch-container {
          position: relative;
          width: var(--clock-size);
          aspect-ratio: 1;
          margin-inline: auto;
          border-radius: 50%;
          filter: drop-shadow(0 25px 40px rgba(0,0,0,0.85));
          isolation: isolate;
        }

        .watch-aura::before {
          content: "";
          position: absolute;
          inset: -4%;
          z-index: -2;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
          animation: clock-glow-anim 6s ease-in-out infinite alternate;
        }

        /* Bezel rings matching the white/blue concentric circle design */
        .bezel-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          padding: 2.2%;
          background: #ffffff; /* Outermost white ring */
          box-shadow:
            0 0 0 4px #1e3a8a,  /* Deep blue ring outside */
            0 0 0 8px #3b82f6,  /* Bright blue ring outside */
            0 15px 30px rgba(0,0,0,0.7);
        }

        .dial-face {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 50%;
          background: #ffffff; /* Ivory/White dial face */
          border: 6px solid #1d4ed8; /* Concentric blue ring inside */
          box-shadow:
            inset 0 0 15px rgba(0,0,0,0.15);
        }

        .chapter-ring-inner {
          position: absolute;
          inset: 4%;
          border-radius: 50%;
          border: 1px solid rgba(30,58,138,0.12);
          pointer-events: none;
        }

        .clock-tick {
          position: absolute;
          inset: 2.5%;
          transform: rotate(var(--angle));
          pointer-events: none;
        }

        .clock-tick::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 1px;
          height: 2.2%;
          transform: translateX(-50%);
          background: rgba(30,58,138,0.3);
        }

        .clock-tick.major::before {
          width: 2px;
          height: 4.5%;
          background: #1e3a8a;
        }

        .roman-num {
          position: absolute;
          z-index: 4;
          transform: translate(-50%, -50%);
          color: #0f172a; /* Dark navy Roman numerals */
          font-family: var(--font-bodoni), Georgia, serif;
          font-size: clamp(14px, 4.4vw, 29px);
          font-weight: 700;
          font-style: normal;
          line-height: 0.88;
          letter-spacing: -0.055em;
          user-select: none;
          text-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }

        .clock-hands {
          position: absolute;
          inset: 0;
          z-index: 8;
          pointer-events: none;
        }

        /* Hour and Minute hands using kim.png */
        .clock-hand.hour {
          width: 9%;
          height: 24%;
          background-image: url('/kim.webp');
          background-size: contain;
          background-position: center bottom;
          background-repeat: no-repeat;
          bottom: 50%;
          transform-origin: 50% 90%;
        }

        .clock-hand.minute {
          width: 7.5%;
          height: 35%;
          background-image: url('/kim.webp');
          background-size: contain;
          background-position: center bottom;
          background-repeat: no-repeat;
          bottom: 50%;
          transform-origin: 50% 91%;
        }

        /* Slender royal blue second hand matching the illustration style */
        .clock-hand.second {
          width: 1.5px;
          height: 39%;
          bottom: 49%;
          background: #1d4ed8;
          box-shadow: 0 0 3px rgba(29,78,216,0.3);
        }

        .clock-hand.second::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          width: 8px;
          height: 16%;
          transform: translateX(-50%);
          background: #1d4ed8;
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }

        .clock-center-pin {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 12;
          width: 4.8%;
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle at 36% 30%, #ffffff 0%, #3b82f6 40%, #1e3a8a 85%);
          box-shadow:
            0 0 0 2px #ffffff,
            0 3px 6px rgba(0,0,0,0.3);
        }

        .clock-reflection {
          position: absolute;
          inset: 3%;
          z-index: 20;
          border-radius: 50%;
          pointer-events: none;
          background: linear-gradient(125deg,
            rgba(255,255,255,0.18) 0%,
            rgba(255,255,255,0.04) 15%,
            transparent 35%,
            transparent 72%,
            rgba(255,255,255,0.04) 100%);
          mix-blend-mode: screen;
        }

        @keyframes clock-glow-anim {
          from { transform: scale(0.98); opacity: 0.7; }
          to   { transform: scale(1.03); opacity: 1; }
        }
      ` }} />

      {/* Header */}
      <header className="py-8 mb-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Illustris Theme
            </span>
            <span className="text-neutral-500 text-xs font-mono">/scratch</span>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">
            Illustris Decennium Clock
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Trang thiết kế thử nghiệm đồng hồ kỷ niệm 10 năm hành trình phát triển của CLB Nhiếp ảnh Illustris.
          </p>
        </div>

        {/* Custom Controller */}
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-400 font-mono">Chủ đề nền:</span>
            <div className="flex gap-1.5">
              {(['blue', 'cyan', 'purple'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    color === 'blue' ? 'bg-blue-600' : color === 'cyan' ? 'bg-cyan-500' : 'bg-purple-600'
                  } ${accentColor === color ? 'ring-2 ring-offset-2 ring-offset-black ring-white' : 'opacity-60 hover:opacity-100'}`}
                  title={`Chuyển tone màu sang ${color}`}
                  type="button"
                />
              ))}
            </div>
          </div>
          
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-400 font-mono">Độ mờ kính: {glassStrength}%</span>
            <input
              type="range"
              min="5"
              max="70"
              value={glassStrength}
              onChange={(e) => setGlassStrength(Number(e.target.value))}
              className="w-20 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Roman Luxury Complication Clock */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-white/[0.01] relative overflow-hidden min-h-[500px]">
          {/* Glass background container reacting to settings */}
          <div 
            className="absolute inset-0 transition-all duration-300 -z-10"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${glassStrength / 1200})`,
              backdropFilter: `blur(${glassStrength * 0.3}px)`
            }}
          />

          <div className="absolute top-4 left-4 flex items-center gap-2 text-neutral-500 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>ILLUSTRIS / 10th Anniversary</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2 text-neutral-500 text-xs font-mono">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Dial</span>
          </div>

          {/* Clock Widget */}
          <div className="watch-container watch-aura my-6">
            <div className="bezel-outer">
              <div className="dial-face" id="dial">
                <div className="chapter-ring-inner"></div>

                {/* Rotating Gears in Dial Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 select-none">
                  {/* Large gear at bottom right */}
                  <GearIcon 
                    className="absolute -bottom-8 -right-8 text-purple-900" 
                    size={180} 
                    speed="28s" 
                  />
                  {/* Medium gear at bottom left */}
                  <GearIcon 
                    className="absolute -bottom-4 -left-6 text-blue-900" 
                    size={140} 
                    speed="22s" 
                    reverse 
                  />
                  {/* Small gear at top left */}
                  <GearIcon 
                    className="absolute top-6 left-12 text-purple-900" 
                    size={100} 
                    speed="16s" 
                  />
                </div>

                {/* Ticks rendered by React */}
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className={`clock-tick${i % 5 === 0 ? ' major' : ''}`}
                    style={{ '--angle': `${i * 6}deg` } as React.CSSProperties}
                  />
                ))}

                {/* Roman Numerals rendered by React */}
                {ROMAN_NUMERALS.map((numeral, index) => {
                  const angle = (index * 30 * Math.PI) / 180;
                  const radius = 39.7;
                  const x = (50 + radius * Math.sin(angle)).toFixed(4);
                  const y = (50 - radius * Math.cos(angle)).toFixed(4);
                  return (
                    <span
                      key={numeral}
                      className="roman-num"
                      data-n={numeral}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {numeral}
                    </span>
                  );
                })}

                {/* Hands */}
                <div className="clock-hands">
                  <div className="clock-hand hour" ref={hourHandRef}></div>
                  <div className="clock-hand minute" ref={minuteHandRef}></div>
                  <div className="clock-hand second" ref={secondHandRef}></div>
                  <div className="clock-center-pin"></div>
                </div>

                {/* Glass reflection shine */}
                <div className="clock-reflection"></div>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-4 text-center leading-relaxed max-w-md">
            Đồng hồ được tùy biến với các vòng Bezel đồng tâm màu trắng-xanh, sử dụng ảnh kim `kim.png` quay đồng tâm, kết hợp hiệu ứng bánh răng chuyển động mờ ở nền dial.
          </p>
        </div>

        {/* Right Side: Design Details & Playground Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Theme specifications */}
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Palette className="w-4.5 h-4.5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Chỉ số thiết kế mới</h2>
            </div>
            
            <div className="space-y-3">
              <ColorBadge name="Clean White Dial" variable="--clock-ivory" hex="#ffffff" />
              <ColorBadge name="Illustris Electric Blue" variable="--color-accent-blue" hex="#2563eb" />
              <ColorBadge name="Deep Royal Blue" variable="--clock-blue-2" hex="#1e3a8a" />
              <ColorBadge name="Navy Numerals" variable="--clock-ink" hex="#0f172a" />
            </div>
          </section>

          {/* Typography Grid */}
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Code className="w-4.5 h-4.5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Đặc tả Kim & Layout</h2>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono block mb-1">Mã nguồn kim đồng hồ</span>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                  Kim giờ & Kim phút: url(&apos;/kim.png&apos;)<br />
                  Transform-Origin: 50% 90% (Hour) | 50% 91% (Minute)
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono block mb-1">Thiết kế tối giản</span>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Đã loại bỏ hoàn toàn các thông tin phụ (lịch ngày, vòng tròn 24h, pha mặt trăng) để tạo không gian thoáng đãng cho thiết kế, làm nổi bật chuyển động của bánh răng và bộ kim.
                </p>
              </div>
            </div>
          </section>

          {/* Core features */}
          <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <LayoutTemplate className="w-4.5 h-4.5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Tương tác Sandbox</h2>
            </div>
            
            <ul className="text-xs text-neutral-400 space-y-2 list-disc list-inside">
              <li>Nền kính mờ (Glassmorphism) phía dưới đồng hồ đồng bộ với thanh kéo.</li>
              <li>Bộ kim xoay liên tục theo thời gian thực của thiết bị.</li>
              <li>Hiệu ứng 3 bánh răng hoạt động ở nền dial đại diện cho bộ máy thời gian bền bỉ.</li>
            </ul>
          </section>
        </div>

      </div>

      {/* Floating Action back home */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="/" 
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold shadow-2xl hover:scale-105 hover:bg-neutral-100 transition-all text-sm"
        >
          <span>Quay lại Trang Chủ</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
