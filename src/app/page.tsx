'use client';

import NextImage from 'next/image';
import Typewriter from '@/components/Typewriter';
import MasterClock from '@/components/MasterClock';
import MarqueePhotoGallery from '@/components/MarqueePhotoGallery';
import MarqueeAdminPanel from '@/components/MarqueeAdminPanel';
import PartyCanvas from '@/components/PartyCanvas';
import type { MarqueeImage } from '@/data/marqueeGalleryData';
import React, { useState, useEffect, useRef } from 'react';
import { computeParallax } from '@/hooks/useScrollParallax';
import { Camera, Settings, X } from 'lucide-react';



// Intro config moved to MasterClock

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Marquee Gallery: server rows state + admin panel visibility
  const [marqueeRows, setMarqueeRows] = useState<MarqueeImage[][]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const fetchMarqueeData = async () => {
    try {
      const res = await fetch('/api/marquee');
      if (res.ok) {
        const data = await res.json();
        if (data.rows) setMarqueeRows(data.rows);
      }
    } catch (err) {
      console.warn('[marquee] fetch error:', err instanceof Error ? err.message : err);
    }
  };

  // Intro animation states moved to MasterClock component
  // ============================================================================
  // SETTING TRỰC TIẾP: Cấu hình Đệm Buffer & Vận tốc (Cơ chế 1: Native CSS Sticky + GPU Parallax)
  // ============================================================================
  const timelineRef = useRef<HTMLElement>(null);
  const homeSectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const timeBlockRef = useRef<HTMLDivElement>(null);
  const locationBlockRef = useRef<HTMLAnchorElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRowRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);
  const galleryElRef = useRef<HTMLElement | null>(null);

  // Parallax config — static constants, never change at runtime
  // Track height formula: 100 + freezeVh*100 + 20  (from useScrollParallax default)
  const HOME_FREEZE_VH = 1.2;
  const TIMELINE_FREEZE_VH = 1.3;
  const TIMELINE_MAX_PARALLAX_PX = 320; // Shared between config & CSS marginBottom
  const HOME_TRACK_HEIGHT_VH = 100 + HOME_FREEZE_VH * 100 + 20; // = 220vh
  const HOME_TRACK_HEIGHT_STYLE = { height: `${HOME_TRACK_HEIGHT_VH}vh` };

  // Home parallax: DISABLED — hero stays sticky, timeline slides up over it
  const timelineParallaxConfig = { freezeVh: TIMELINE_FREEZE_VH, speed: 0.5, direction: 'up' as const, maxParallaxPx: TIMELINE_MAX_PARALLAX_PX };

  // Smooth lerp factor for timeline parallax (0.08 = cinematic smooth)
  const PARALLAX_LERP = 0.08;
  const PARALLAX_SETTLE_THRESHOLD = 0.5; // Stop rAF loop when delta < 0.5px

  // Thresholds for home section visibility (in vh units)
  // Hide earlier to stop painting heavy SVGs & animations when timeline covers the screen
  const HOME_HIDE_THRESHOLD = 1.85; 
  const HOME_SHOW_THRESHOLD = 1.80; 

  // Scroll animation: use refs + direct DOM mutations to avoid React re-render on every scroll frame
  const homeVisibleRef = useRef(true);
  const showTaglineRef = useRef(false);
  const showButtonsRef = useRef(false);
  const showTimeRef = useRef(false);
  const showLocationRef = useRef(false);

  const activeTabRef = useRef(activeTab);
  // Lerp state refs (mutable, no re-render)
  const timelineCurrentY = useRef(0);
  const timelineTargetY = useRef(0);
  const lerpRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasLoadedBefore = sessionStorage.getItem('has_loaded_before');
      if (!hasLoadedBefore) {
        window.scrollTo(0, 0);
        sessionStorage.setItem('has_loaded_before', 'true');
      }
    }

    // Cache gallery element once to avoid getElementById every scroll frame
    galleryElRef.current = document.getElementById('gallery');

    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const applyClass = (el: HTMLElement | null, add: boolean, shown: string, hidden: string) => {
      if (!el) return;
      if (add) { el.classList.add(...shown.split(' ')); el.classList.remove(...hidden.split(' ')); }
      else { el.classList.add(...hidden.split(' ')); el.classList.remove(...shown.split(' ')); }
    };

    // --- CSS transition for home section opacity (sync fade instead of setTimeout hack) ---
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'opacity' && !homeVisibleRef.current && homeSectionRef.current) {
        homeSectionRef.current.style.visibility = 'hidden';
      }
    };
    if (homeSectionRef.current) {
      homeSectionRef.current.addEventListener('transitionend', handleTransitionEnd);
    }

    // --- Lerp rAF loop: smoothly interpolates timeline parallax toward target ---
    const lerpLoop = () => {
      const delta = timelineTargetY.current - timelineCurrentY.current;

      if (Math.abs(delta) > PARALLAX_SETTLE_THRESHOLD) {
        // Lerp toward target
        timelineCurrentY.current += delta * PARALLAX_LERP;

        if (timelineRef.current) {
          timelineRef.current.style.transform = `translate3d(0, ${timelineCurrentY.current}px, 0)`;
        }

        lerpRafRef.current = requestAnimationFrame(lerpLoop);
      } else {
        // Settled — snap to exact target and stop loop
        timelineCurrentY.current = timelineTargetY.current;
        if (timelineRef.current) {
          timelineRef.current.style.transform = `translate3d(0, ${timelineCurrentY.current}px, 0)`;
          // Release GPU layer when parallax settled
          timelineRef.current.style.willChange = 'auto';
        }
        lerpRafRef.current = null;
      }
    };

    const startLerp = () => {
      // Promote to GPU layer when animating
      if (timelineRef.current) {
        timelineRef.current.style.willChange = 'transform';
      }
      if (lerpRafRef.current === null) {
        lerpRafRef.current = requestAnimationFrame(lerpLoop);
      }
    };

    // MASTER SCROLL HANDLER: compute targets + trigger lerp + manage visibility
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = window.scrollY;
          const vh = window.innerHeight || 1;
          const scrollVh = sy / vh;
          const isMobile = isMobileRef.current;

          // --- Timeline parallax target (lerp loop will smooth it) ---
          const timelineResult = computeParallax(sy, vh, timelineParallaxConfig);
          timelineTargetY.current = timelineResult.parallaxY;
          startLerp();

          // --- Home section opacity: CSS transition handles the fade ---
          const currentHideThreshold = isMobile ? HOME_HIDE_THRESHOLD + 0.4 : HOME_HIDE_THRESHOLD;
          const currentShowThreshold = isMobile ? HOME_SHOW_THRESHOLD + 0.4 : HOME_SHOW_THRESHOLD;

          if (scrollVh > currentHideThreshold && homeVisibleRef.current) {
            homeVisibleRef.current = false;
            if (homeSectionRef.current) {
              homeSectionRef.current.style.opacity = '0';
              homeSectionRef.current.style.pointerEvents = 'none';
              // visibility: hidden is set by transitionend listener (synced with CSS fade)
            }
          } else if (scrollVh < currentShowThreshold && !homeVisibleRef.current) {
            homeVisibleRef.current = true;
            if (homeSectionRef.current) {
              homeSectionRef.current.style.visibility = 'visible';
              homeSectionRef.current.style.opacity = '1';
              homeSectionRef.current.style.pointerEvents = 'auto';
            }
          }

          // Mobile Title translation (removed as per user request to keep title static)
          if (titleContainerRef.current) {
            titleContainerRef.current.style.transform = 'none';
          }

          // --- Stagger reveal: direct classList toggle (no React re-render) ---
          const taglineThreshold = isMobile ? 45 : 40;
          const buttonsThreshold = isMobile ? 45 : 40;
          const timeThreshold = isMobile ? 120 : 120;
          const locationThreshold = isMobile ? 120 : 200;

          const newTagline = sy > taglineThreshold;
          const newButtons = sy > buttonsThreshold;
          const newTime = sy > timeThreshold;
          const newLocation = sy > locationThreshold;

          if (newTagline !== showTaglineRef.current) {
            showTaglineRef.current = newTagline;
            applyClass(taglineRef.current, newTagline, 'opacity-100 translate-y-0', 'opacity-0 translate-y-7');
          }
          if (newButtons !== showButtonsRef.current) {
            showButtonsRef.current = newButtons;
            applyClass(buttonsRowRef.current, newButtons, 'opacity-100 translate-y-0', 'opacity-0 translate-y-7');
          }
          if (newTime !== showTimeRef.current) {
            showTimeRef.current = newTime;
            applyClass(timeBlockRef.current, newTime, 'opacity-100 translate-y-0', 'opacity-0 translate-y-7');
          }
          if (newLocation !== showLocationRef.current) {
            showLocationRef.current = newLocation;
            applyClass(locationBlockRef.current, newLocation, 'opacity-100 translate-y-0', 'opacity-0 translate-y-7');
          }

          // --- Active Tab: dynamically determined based on scroll position & gallery top ---
          const galleryTop = galleryElRef.current ? galleryElRef.current.getBoundingClientRect().top : Infinity;

          let newTab: string;
          if (sy < vh * 1.2) {
            newTab = 'home';
          } else if (galleryTop <= vh * 0.5) {
            newTab = 'gallery';
          } else {
            newTab = 'timeline';
          }

          if (activeTabRef.current !== newTab) {
            activeTabRef.current = newTab;
            setActiveTab(newTab);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial trigger

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (lerpRafRef.current) cancelAnimationFrame(lerpRafRef.current);
      if (homeSectionRef.current) {
        homeSectionRef.current.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Disable Zoom in/out via Keyboard Shortcuts, Mouse Wheel, and Touch Gestures
  useEffect(() => {
    // 1. Chặn Zoom bằng Phím tắt (Ctrl/Cmd + +, -, =, 0) & Ctrl + Wheel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    // Note: wheel listener uses {passive: false} only because preventDefault() is called for zoom blocking.

    // 2. Chặn Pinch-to-zoom 2 ngón tay trên Mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 3. Chặn Double-tap zoom trên iOS
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Smooth Navigation Handler compatible with Native Scroll & Parallax
  const handleNavClick = (targetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(targetId);

    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetId === 'timeline' || targetId === 'gallery') {
      const el = document.getElementById(targetId);
      if (el) {
        const vh = window.innerHeight;
        const headerOffset = 56;
        const docTop = vh * (HOME_TRACK_HEIGHT_VH / 100);
        const freezeStart = TIMELINE_FREEZE_VH * vh;
        const speed = 0.5;
        const maxParallax = TIMELINE_MAX_PARALLAX_PX;

        const timelineEl = timelineRef.current;
        let relativeOffsetTop = 0;
        if (timelineEl) {
          let current: HTMLElement | null = el;
          while (current && current !== timelineEl) {
            relativeOffsetTop += current.offsetTop;
            current = current.offsetParent as HTMLElement | null;
          }
        }

        const staticOffsetTop = docTop + relativeOffsetTop;

        const syCapped = staticOffsetTop - maxParallax - headerOffset;
        const syUncapped = (staticOffsetTop + speed * freezeStart - headerOffset) / (1 + speed);

        const timelineTargetParallax = (syUncapped - freezeStart) * speed;
        const targetScroll = timelineTargetParallax > maxParallax ? syCapped : syUncapped;

        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  };

  // Component states
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load marquee rows from server on mount
    fetchMarqueeData();
  }, []);








  return (
    <div className="min-h-screen bg-black text-white relative font-sans adaptive-scale-wrapper">
      {/* Background radial glowing effects */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-blue-950/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/[0.04]">
        <div className="w-full px-4 sm:pl-6 sm:pr-12 lg:pl-8 lg:pr-20 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NextImage
              src="/illu-logo.webp"
              alt="Illustris Logo"
              width={64}
              height={45}
              className="h-[22px] sm:h-9 w-auto object-contain -translate-y-[3px]"
              priority
            />
            <div>
              <span className="font-perandory text-lg sm:text-xl tracking-[0.15em] text-white block leading-none">ILLUSTRIS</span>
              <span className="text-[7px] sm:text-[8px] text-slate-400 tracking-[0.25em] sm:tracking-[0.3em] uppercase font-light block mt-0.5 sm:mt-1 font-condensed">Photography Club</span>
            </div>
          </div>

          {/* Navigation with smooth anchors */}
          <nav className="flex items-center gap-3 sm:gap-8 md:gap-12 text-[10px] sm:text-[17px] tracking-[0.08em] sm:tracking-[0.12em] uppercase font-semibold text-slate-400 font-condensed">
            <a
              href="#home"
              onClick={(e) => handleNavClick('home', e)}
              className={`hover:text-white transition-colors relative py-1 ${activeTab === 'home' ? 'text-white font-bold' : ''}`}
            >
              Trang chủ
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
            <a
              href="#timeline"
              onClick={(e) => handleNavClick('timeline', e)}
              className={`hover:text-white transition-colors relative py-1 ${activeTab === 'timeline' ? 'text-white font-bold' : ''}`}
            >
              Timeline
              {activeTab === 'timeline' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
            <a
              href="#gallery"
              onClick={(e) => handleNavClick('gallery', e)}
              className={`hover:text-white transition-colors relative py-1 ${activeTab === 'gallery' ? 'text-white font-bold' : ''}`}
            >
              Thư viện
              {activeTab === 'gallery' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
              )}
            </a>
          </nav>
        </div>
      </header>

      {/* NATIVE SCROLL PINNING CONTAINER FOR HOME */}
      <div className="relative w-full" style={HOME_TRACK_HEIGHT_STYLE}>
        {/* 1. HERO SECTION (ID: home) */}
        <div className="w-full h-[100dvh] sticky top-0 z-10 pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto">
            <section
              id="home"
              ref={homeSectionRef}
              className="w-full h-full flex flex-col justify-start md:justify-center overflow-hidden pt-16 md:pt-20"
              style={{ opacity: '1', pointerEvents: 'auto', transition: 'opacity 0.4s ease-out' }}
            >
              <div
                className="w-full h-full flex flex-col justify-start md:justify-center relative"
              >
                {/* Expanded Hero Content Box */}
                <div className="w-full px-[20px] z-10 pt-4 md:py-12 translate-y-0 md:-translate-y-16">
                  {/* TÙY CHỈNH KHOẢNG CÁCH GAP TRÊN/DƯỚI CHÍNH: Thay space-y-6 thành space-y-8, space-y-10, space-y-12,... */}
                  <div className="max-w-4xl mx-auto md:mx-0 space-y-4 md:space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
                    {/* TÙY CHỈNH KHOẢNG CÁCH GIỮA CÁC DÒNG TIÊU ĐỀ & CÂU KHẨU HIỆU: Thay space-y-2 thành space-y-3, space-y-4,... */}
                    <div ref={titleContainerRef} className="space-y-1.5 md:space-y-2 flex flex-col items-center md:items-start w-full">
                      <span className="text-xs sm:text-base md:text-lg font-semibold tracking-[0.25em] md:tracking-[0.35em] text-white/80 uppercase block font-condensed mb-1 md:mb-2 text-center md:text-left w-full">
                        KỶ NIỆM 10 NĂM THÀNH LẬP
                      </span>
                      <h1 className="text-7xl sm:text-[108px] md:text-[120px] xl:text-[140px] font-perandory tracking-wide leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#0a08b6] via-[#46c2ff] to-white drop-shadow-[0_10px_25px_rgba(10,8,182,0.35)] -mb-1 text-center md:text-left w-full">
                        ILLUSTRIS
                      </h1>
                      <h2 className="text-xs sm:text-sm md:text-base font-medium tracking-[0.2em] md:tracking-[0.25em] text-white/75 uppercase leading-none font-condensed flex items-center justify-center md:justify-start pt-0.5 md:pt-1 w-full pl-[5px]">
                        <Typewriter
                          texts={[
                            "  10 NĂM",
                            "  MỘT HÀNH TRÌNH",
                            "  TRIỆU KHOẢNH KHẮC",
                            " 10 NĂM – MỘT HÀNH TRÌNH – TRIỆU KHOẢNH KHẮC"
                          ]}
                          ease={{ duration: 0.07, delay: 1.5 }}
                          deleteSpeed={0.04}
                          showCursor={true}
                          cursorChar="_"
                          typedColor="rgba(255, 255, 255, 0.85)"
                          cursorColor="rgba(255, 255, 255, 0.85)"
                        />
                      </h2>
                    </div>
                    {/* NHIẾP ẢNH CHỨ? */}
                    <p
                      ref={taglineRef}
                      className="font-serif text-lg sm:text-xl md:text-2xl italic font-normal text-white/80 tracking-wide pt-1 transition-all duration-700 ease-out opacity-0 translate-y-7 text-center md:text-left w-full"
                    >
                      NHIẾP ẢNH CHỨ?
                    </p>

                    {/* Event Info */}
                    <div className="flex flex-row md:flex-row items-start justify-between md:justify-start w-full max-w-lg md:max-w-none gap-4 sm:gap-12 md:gap-16 pt-4 md:pt-6 mt-2 md:mt-6 select-none text-left">
                      {/* Time */}
                      <div
                        ref={timeBlockRef}
                        className="flex gap-2.5 sm:gap-4.5 items-start transition-all duration-700 delay-100 ease-out opacity-0 translate-y-7 shrink-0 pl-6 sm:pl-0"
                      >
                        <svg viewBox="0 0 32 32" className="w-[28px] h-[28px] sm:w-[38px] sm:h-[38px] md:w-[44px] md:h-[44px] text-[#5d66d0] shrink-0 mt-0.5" fill="none" stroke="currentColor">
                          <rect x="3" y="6" width="26" height="22" rx="4" strokeWidth="1.8" />
                          <path d="M8 3v4M16 3v4M24 3v4" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M3 12h26" strokeWidth="1.5" />
                          <rect x="7" y="16" width="4" height="4" strokeWidth="1.5" />
                          <circle cx="16" cy="18" r="1" fill="currentColor" />
                          <circle cx="21" cy="18" r="1" fill="currentColor" />
                          <circle cx="26" cy="18" r="1" fill="currentColor" opacity="0.6" />
                          <circle cx="16" cy="23" r="1" fill="currentColor" />
                          <circle cx="21" cy="23" r="1" fill="currentColor" />
                          <circle cx="26" cy="23" r="1" fill="currentColor" opacity="0.6" />
                        </svg>
                        <div className="space-y-0.5 sm:space-y-1.5 min-w-0 font-condensed">
                          <span className="text-[10px] sm:text-[14.5px] text-white tracking-[0.2em] sm:tracking-[0.25em] font-medium uppercase block">THỜI GIAN</span>
                          <p className="text-sm sm:text-lg md:text-xl font-medium text-[#5d66d0] leading-tight font-sans">26.07.2026</p>
                          <p className="text-[11px] sm:text-sm md:text-base text-[#5d66d0] font-normal font-sans">16:30 - 19:45</p>
                        </div>
                      </div>

                      {/* Location (Clickable Google Maps link with max-w-[265px]) */}
                      <a
                        ref={locationBlockRef}
                        href="https://www.google.com/maps/search/?api=1&query=Bamos+Tr%E1%BA%A7n+N%C3%A3o+9%2F8+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+10+B%C3%ACnh+Kh%C3%A1nh+An+Kh%C3%A1nh+H%E1%BB%93+Ch%C3%AD+Minh"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Mở vị trí Bamos Trần Não trên Google Maps"
                        className="group flex gap-2.5 sm:gap-4.5 items-start max-w-[170px] sm:max-w-[265px] transition-all duration-700 delay-200 ease-out cursor-pointer pointer-events-auto opacity-0 translate-y-7 text-left"
                      >
                        <svg viewBox="0 0 36 36" className="w-[36px] h-[36px] sm:w-[44px] sm:h-[44px] md:w-[48px] md:h-[48px] text-[#5d66d0] group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor">
                          <path
                            d="M18 3C12.5 3 8 7.5 8 13C8 20 18 27.5 18 27.5C18 27.5 28 20 28 13C28 7.5 23.5 3 18 3Z"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <circle cx="18" cy="12" r="3.5" strokeWidth="1.8" />
                          <ellipse cx="18" cy="29" rx="12" ry="4" strokeWidth="1.8" />
                        </svg>
                        <div className="space-y-1 sm:space-y-1.5 min-w-0 font-condensed">
                          <span className="text-xs sm:text-[14.5px] text-white tracking-[0.2em] sm:tracking-[0.25em] font-medium uppercase block">ĐỊA ĐIỂM</span>
                          <p className="text-base sm:text-lg md:text-xl font-medium text-[#5d66d0] group-hover:text-blue-400 group-hover:underline leading-tight font-sans transition-colors flex items-center gap-1">
                            <span>Bamos Trần Não</span>
                          </p>
                          <p className="text-xs sm:text-sm md:text-base text-white/90 font-light leading-relaxed font-sans">
                            9/8 Đường số 10, Bình Khánh, An Khánh, Hồ Chí Minh
                          </p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                <MasterClock />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 2. TIMELINE SECTION (OVERLAPPING PINNED HERO WITH CURVED EDGES & DEPTH SHADOW) */}
      <section
        id="timeline"
        ref={timelineRef}
        className="relative w-full z-20 bg-[#0a0a0c]/98 transform-gpu rounded-t-2xl md:rounded-t-3xl border-t border-white/10 shadow-[0_-50px_100px_rgba(0,0,0,0.95)] pt-8 md:pt-12 pb-4 overflow-hidden border-b border-white/[0.03]"
        style={{ marginBottom: `${-TIMELINE_MAX_PARALLAX_PX}px` }}
      >
        {/* Glow Accent Line & Cosmic Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-purple-950/10 to-transparent pointer-events-none z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none z-10" />

        <div className="w-[90%] lg:w-[80%] mx-auto relative z-10 space-y-10">
          {/* INTERACTIVE MARQUEE PHOTO GALLERY WITH LEFT DETAIL PANEL */}
          <MarqueePhotoGallery externalRows={marqueeRows} />

          {/* 3. GALLERY SECTION (ID: gallery - KHOẢNH KHẮC ĐÊM TIỆC) */}
          <div id="gallery" className="pt-8 border-t border-white/[0.06] relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.25em] text-blue-400/95 uppercase block">
                  ẢNH KỈ NIỆM ĐÊM TIỆC
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-light text-white">Khoảnh Khắc Đêm Tiệc</h2>
              </div>
            </div>

            {/* Embedded Interactive WebGL Party Canvas */}
            <PartyCanvas className="w-full min-h-[500px] bg-black text-slate-100 flex flex-col overflow-hidden font-sans border border-dashed border-white/10 rounded-none relative transition-all duration-300" />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 py-6 border-t border-white/[0.04] bg-zinc-950/40 relative z-10">
          <div className="w-[90%] lg:w-[80%] mx-auto text-center space-y-3">
            <div className="flex justify-center items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              <span className="font-serif text-sm tracking-[0.2em] font-light">ILLUSTRIS</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              A DECADE OF LIGHT — A JOURNEY OF MOMENTS
            </p>
            <div className="font-serif italic text-3xl text-slate-800 tracking-wider">
              fin<span className="text-blue-500">.</span>
            </div>
          </div>
        </footer>
      </section>

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="Zoomed view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* LIBRARY ADMIN TRIGGER — hidden button bottom-right (hover to reveal) */}
      <button
        id="library-admin-trigger"
        onClick={() => setIsAdminOpen(true)}
        title="Mở Library Editor"
        className="fixed bottom-6 right-6 z-[90] p-2.5 rounded-full bg-black/60 border border-white/10 text-slate-600 hover:text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 opacity-30 hover:opacity-100 backdrop-blur-sm"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* MARQUEE LIBRARY ADMIN PANEL */}
      <MarqueeAdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        rows={marqueeRows}
        onRowsChange={fetchMarqueeData}
      />

      {/* Custom scrollbar styles are defined in globals.css */}
    </div>
  );
}
