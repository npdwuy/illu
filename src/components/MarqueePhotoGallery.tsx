"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MARQUEE_ROWS, MarqueeImage } from "@/data/marqueeGalleryData";
import {
  X,
  Calendar,
  MapPin,
  Sparkles,
  MoveHorizontal,
  GripVertical
} from "lucide-react";

// SUB-COMPONENT: A single mathematically perfect infinite cyclic marquee row
interface MarqueeRowProps {
  rowItems: MarqueeImage[];
  isEven: boolean;
  onItemClick: (item: MarqueeImage) => void;
}

const MarqueeRow = React.memo(function MarqueeRow({ rowItems, isEven, onItemClick }: MarqueeRowProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  const xRef = useRef<number>(isEven ? 0 : -600); // initial offset spacing offset
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startOffsetXRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Momentum & Inertia references
  const velocityRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Cache group width via ResizeObserver to prevent layout thrashing in rAF loop
  const groupWidthRef = useRef<number>(0);
  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;

    const updateWidth = () => {
      groupWidthRef.current = el.getBoundingClientRect().width;
    };
    updateWidth();

    const ro = new ResizeObserver(() => {
      updateWidth();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [rowItems]);

  // Stop momentum on filter change but PRESERVE position — avoids visual jump when switching years.
  // The wrap logic in the rAF loop normalizes xRef to the new cycleWidth within the first frame.
  useEffect(() => {
    velocityRef.current = 0;
  }, [rowItems, isEven]);

  // hasItems as boolean so rAF loop only restarts on empty↔non-empty transitions,
  // NOT on every year filter switch (which would cause 1–2 frame drop per switch).
  const hasItems = rowItems.length > 0;
  useEffect(() => {
    if (!hasItems) return;

    let animationId: number;
    let lastTime = performance.now();
    const baseSpeed = 0.4; // pixels per frame at 60fps baseline
    const friction = 0.95; // dampening factor for momentum decay
    let isPaused = false;

    // Pause rAF when row is not visible (saves CPU/battery on mobile)
    const observer = new IntersectionObserver(
      ([entry]) => {
        isPaused = !entry.isIntersecting;
        if (!isPaused) {
          lastTime = performance.now();
          animationId = requestAnimationFrame(loop);
        }
      },
      { threshold: 0 }
    );
    if (trackRef.current?.parentElement) {
      observer.observe(trackRef.current.parentElement);
    }

    const loop = (now: number) => {
      if (isPaused) return; // Don't schedule next frame when off-screen

      // Calculate Delta-Time normalized to 60fps baseline (1.0 at 60Hz, 0.416 at 144Hz)
      const delta = Math.min((now - lastTime) / 16.667, 2.5);
      lastTime = now;

      if (trackRef.current) {
        const groupWidth = groupWidthRef.current;
        const gap = 8; // gap-2 is 8px
        const cycleWidth = groupWidth + gap;

        // 1. If not dragging, apply inertia decay or standard automatic scroll
        if (!isDraggingRef.current) {
          if (Math.abs(velocityRef.current) > 0.1) {
            xRef.current += velocityRef.current * delta;
            velocityRef.current *= Math.pow(friction, delta); // gradually decay momentum normalized to refresh rate

            // As inertia approaches basic auto-scroll speed, smoothly merge it back to standard crawl
            if (Math.abs(velocityRef.current) < baseSpeed) {
              velocityRef.current = 0;
            }
          } else {
            // Standard continuous auto scroll normalized to refresh rate
            const step = baseSpeed * delta;
            if (isEven) {
              xRef.current -= step;
            } else {
              xRef.current += step;
            }
          }
        }

        // Normalize to (-cycleWidth, 0] via modulo — O(1), no jitter when cycleWidth changes
        if (cycleWidth > 0) {
          xRef.current = ((xRef.current % cycleWidth) - cycleWidth) % cycleWidth;
        }

        // 3. Render position via GPU hardware acceleration translate3d
        trackRef.current.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [isEven, hasItems]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    velocityRef.current = 0; // stop existing momentum on new touch
    startXRef.current = e.clientX;
    startOffsetXRef.current = xRef.current;

    // Initialize velocity calculation reference points
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();

    // NOTE: Deferred Pointer Capture: Do NOT call setPointerCapture immediately on pointerdown!
    // Immediate capture hijacks all event targeting and blocks native child onClick events.
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const currentX = e.clientX;
    const currentTime = performance.now();
    const deltaX = currentX - startXRef.current;

    // Check if user is actually dragging or just clicking
    if (Math.abs(deltaX) > 5) {
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        // ONLY activate pointer capture once actual dragging beyond the threshold begins
        if (e.currentTarget && e.currentTarget.setPointerCapture && !e.currentTarget.hasPointerCapture(e.pointerId)) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (err) {
            // Ignore capture failures
          }
        }
      }
    }

    // Calculate instantaneous drag speed in px per animation frame (~16.67ms)
    const dt = currentTime - lastTimeRef.current;
    if (dt > 0) {
      const dx = currentX - lastXRef.current;
      const instantVelocity = (dx / dt) * 16.67;
      // Exponential moving average smoothing to eliminate touch/mouse sensor noise
      velocityRef.current = velocityRef.current * 0.4 + instantVelocity * 0.6;
    }
    lastXRef.current = currentX;
    lastTimeRef.current = currentTime;

    // Set new raw offset from dragging drag delta
    xRef.current = startOffsetXRef.current + deltaX;

    // Apply immediate cyclic shift wrap while dragging
    if (trackRef.current) {
      const groupWidth = groupWidthRef.current;
      const gap = 8;
      const cycleWidth = groupWidth + gap;

      if (cycleWidth > 0) {
        while (xRef.current <= -cycleWidth) {
          xRef.current += cycleWidth;
        }
        while (xRef.current >= 0) {
          xRef.current -= cycleWidth;
        }
      }
      trackRef.current.style.transform = `translate3d(${xRef.current}px, 0, 0)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;

      // If user paused holding stationary before releasing (>60ms), cancel inertial glide
      if (performance.now() - lastTimeRef.current > 60) {
        velocityRef.current = 0;
      }

      if (e.currentTarget && e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Ignore release failures
        }
      }
    }
  };

  if (rowItems.length === 0) {
    return (
      <div className="relative w-full h-[calc(17.6vh+12px)] min-h-[140px] lg:h-[calc(22vh+15px)] lg:min-h-[175px] bg-slate-950/20 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center p-4">
        <p className="text-xs text-slate-500 font-mono">Hàng trống (Row {isEven ? 'chẵn' : 'lẻ'})</p>
        <p className="text-[10px] text-slate-600 font-mono mt-1">Sử dụng Library Editor ở góc phải để tải ảnh lên hàng này</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden h-[calc(17.6vh+12px)] min-h-[140px] lg:h-[calc(22vh+15px)] lg:min-h-[175px] bg-slate-950/40">
      <div
        ref={trackRef}
        className="flex gap-2 items-center h-full w-max cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Render 2 identical groups for seamless cyclic scroll loop */}
        <div ref={groupRef} className="flex gap-2 shrink-0 h-full">
          {rowItems.map((item) => (
            <div
              key={`${item.id}-g1`}
              onClick={(e) => {
                if (hasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                } else {
                  onItemClick(item);
                }
              }}
              className="relative h-full shrink-0 overflow-hidden cursor-pointer border border-slate-800 hover:border-slate-500 transition-all duration-300 transform-gpu"
              style={{ aspectRatio: item.aspectRatio || "4/3", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <Image
                src={item.url}
                alt={item.title}
                fill
                unoptimized
                className="object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 pointer-events-none">
                <span className="self-end bg-black/80 px-2 py-0.5 border border-slate-800 font-mono text-[13.5px] text-blue-400 mb-2">
                  {item.category}
                </span>
                <h4 className="text-[13.5px] font-bold text-white truncate">{item.title}</h4>
                <p className="text-[13.5px] font-mono text-slate-300 flex items-center gap-1 truncate mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {item.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 shrink-0 h-full">
          {rowItems.map((item) => (
            <div
              key={`${item.id}-g2`}
              onClick={(e) => {
                if (hasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                } else {
                  onItemClick(item);
                }
              }}
              className="relative h-full shrink-0 overflow-hidden cursor-pointer border border-slate-800 hover:border-slate-500 transition-all duration-300 transform-gpu"
              style={{ aspectRatio: item.aspectRatio || "4/3", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <Image
                src={item.url}
                alt={item.title}
                fill
                unoptimized
                className="object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 pointer-events-none">
                <span className="self-end bg-black/80 px-2 py-0.5 border border-slate-800 font-mono text-[13.5px] text-blue-400 mb-2">
                  {item.category}
                </span>
                <h4 className="text-[13.5px] font-bold text-white truncate">{item.title}</h4>
                <p className="text-[13.5px] font-mono text-slate-300 flex items-center gap-1 truncate mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {item.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

interface YearItem {
  year: number | 'all';
  label: string;
  title: string;
  tagline: string;
}

const TIMELINE_YEARS: YearItem[] = [
  { year: 'all', label: 'Tất cả', title: 'Hành trình 10 năm Illustris (2016 – 2026)', tagline: '10 Năm – Một Hành Trình – Triệu Khoảnh Khắc' },
  { year: 2016, label: '2016', title: 'Những Bước Chân Đầu Tiên', tagline: 'Khởi đầu của những người mộng mơ' },
  { year: 2017, label: '2017', title: 'Định Hình Phong Cách', tagline: 'Đi tìm bản sắc riêng biệt' },
  { year: 2018, label: '2018', title: 'Chuyên Nghiệp Hóa Studio', tagline: 'Chinh phục ánh sáng nhân tạo' },
  { year: 2019, label: '2019', title: 'Vươn Mình Ra Biển Lớn', tagline: 'Đồng hành cùng các sự kiện quy mô' },
  { year: 2020, label: '2020', title: 'Thử Thách & Chuyển Đổi Số', tagline: 'Sáng tạo không ranh giới' },
  { year: 2021, label: '2021', title: 'Trở Lại Mạnh Mẽ', tagline: 'Bùng nổ năng lượng nghệ thuật' },
  { year: 2022, label: '2022', title: 'Mở Rộng Không Gian Thị Giác', tagline: 'Tích hợp đồ họa và nhiếp ảnh' },
  { year: 2023, label: '2023', title: 'Kết Nối Các Thế Hệ', tagline: 'Văn hóa gia đình bền chặt' },
  { year: 2024, label: '2024', title: 'Tiệm Cận Tiêu Chuẩn Quốc Tế', tagline: 'Nâng tầm tư duy nhiếp ảnh thương mại' },
  { year: 2025, label: '2025', title: 'Cột Mốc Vàng Son', tagline: 'Thập kỷ ánh sáng - Vạn dấu ấn khắc sâu' },
  { year: 2026, label: '2026', title: 'Chương Mới - Tương Lai Xanh', tagline: 'Nhiếp ảnh bền vững, nhân văn hơn' },
];

export default function MarqueePhotoGallery({ externalRows }: { externalRows?: MarqueeImage[][] }) {
  const [selectedImage, setSelectedImageState] = useState<MarqueeImage | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [panelWidthRatio, setPanelWidthRatio] = useState<number>(0.32); // Default 32% (between 0.25 and 0.45)
  const isResizingRef = useRef<boolean>(false);
  const startResizeXRef = useRef<number>(0);
  const startResizeRatioRef = useRef<number>(0.32);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Drag-to-scroll references for timeline year navigation
  const timelineNavRef = useRef<HTMLDivElement | null>(null);
  const isTimelineDraggingRef = useRef<boolean>(false);
  const timelineStartXRef = useRef<number>(0);
  const timelineScrollLeftRef = useRef<number>(0);
  const timelineHasDraggedRef = useRef<boolean>(false);

  // Use server-provided rows strictly as the single source of truth, fallback to 3 empty rows to prevent layout collapse
  const sourceRows: MarqueeImage[][] = (externalRows && externalRows.length > 0) ? externalRows : [[], [], []];

  // Lazy preload: only first 6 images on mount, rest deferred to IntersectionObserver
  useEffect(() => {
    if (!sourceRows || sourceRows.length === 0) return;
    const timer = setTimeout(() => {
      const allImages = sourceRows.flat();
      // Preload only the first 6 visible images immediately
      allImages.slice(0, 6).forEach((item) => {
        if (item && item.url) {
          const img = new window.Image();
          img.src = item.url;
        }
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [sourceRows]);

  const handleTimelinePointerDown = (e: React.PointerEvent) => {
    if (!timelineNavRef.current) return;
    isTimelineDraggingRef.current = true;
    timelineHasDraggedRef.current = false;
    timelineStartXRef.current = e.clientX;
    timelineScrollLeftRef.current = timelineNavRef.current.scrollLeft;
  };

  const handleTimelinePointerMove = (e: React.PointerEvent) => {
    if (!isTimelineDraggingRef.current || !timelineNavRef.current) return;
    const deltaX = e.clientX - timelineStartXRef.current;
    if (Math.abs(deltaX) > 4) {
      timelineHasDraggedRef.current = true;
    }
    timelineNavRef.current.scrollLeft = timelineScrollLeftRef.current - deltaX;
  };

  const handleTimelinePointerUp = () => {
    isTimelineDraggingRef.current = false;
  };

  // Filter rows based on selectedYear and distribute matches evenly
  const filteredMarqueeRows = React.useMemo(() => {
    if (selectedYear === 'all') return sourceRows;
    const yearStr = selectedYear.toString();

    // 1. Flatten all images and filter strictly by the selected year
    const allMatchingImages = sourceRows.flat().filter((img) => img.date && img.date.includes(yearStr));

    // 2. Distribute the matching images evenly across the active number of rows to maintain balance
    const numRows = Math.max(1, sourceRows.length);
    const distributedRows: MarqueeImage[][] = Array.from({ length: numRows }, () => []);

    allMatchingImages.forEach((img, index) => {
      const targetRowIndex = index % numRows;
      distributedRows[targetRowIndex].push(img);
    });

    return distributedRows;
  }, [selectedYear, sourceRows]);

  // Intelligent aspect-ratio based initial ratio adaptation (clamped 0.25 -> 0.45)
  const handleItemSelect = (item: MarqueeImage) => {
    let targetRatio = 0.32;
    if (item.aspectRatio) {
      if (item.aspectRatio === "16/9" || item.aspectRatio === "16/10") {
        targetRatio = 0.42;
      } else if (item.aspectRatio === "1/1" || item.aspectRatio === "3/4") {
        targetRatio = 0.28;
      } else if (item.aspectRatio === "4/3") {
        targetRatio = 0.34;
      }
    }
    targetRatio = Math.max(0.25, Math.min(0.45, targetRatio));
    setPanelWidthRatio(targetRatio);
    setSelectedImageState(item);
  };

  // Keyboard shortcut Esc listener to close detail panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageState(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSplitterDown = (e: React.PointerEvent) => {
    isResizingRef.current = true;
    startResizeXRef.current = e.clientX;
    startResizeRatioRef.current = panelWidthRatio;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "ew-resize";
  };

  const handleSplitterMove = (e: React.PointerEvent) => {
    if (!isResizingRef.current || !containerRef.current) return;

    const deltaX = e.clientX - startResizeXRef.current;
    const containerWidth = containerRef.current.getBoundingClientRect().width;

    if (containerWidth > 0) {
      const deltaRatio = deltaX / containerWidth;
      const newRatio = Math.max(0.25, Math.min(0.45, startResizeRatioRef.current + deltaRatio));
      setPanelWidthRatio(newRatio);
    }
  };

  const handleSplitterUp = (e: React.PointerEvent) => {
    if (isResizingRef.current) {
      isResizingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      document.body.style.cursor = "default";
    }
  };

  return (
    <div className="w-full font-sans text-slate-100 bg-transparent overflow-hidden select-none pt-[10px] pb-[10px]">
      {/* SECTION HEADER & MINIMALIST INLINE TIMELINE */}
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-[24px] pb-2 border-b border-white/10 mb-3 shrink-0">

        {/* Stacking Title and Timeline horizontally on desktop but stacked on mobile or everywhere */}
        <div className="flex flex-col items-start gap-3 w-full">
          {/* Left Title */}
          <h2 className="text-xl md:text-[24px] lg:text-[29px] font-serif text-white tracking-tight font-bold shrink-0">
            Hành trình 10 năm
          </h2>

          {/* Horizontal Minimalist Timeline (Line + Text, No Boxes) - Drag to Scroll, Hidden Scrollbar */}
          <div className="w-full overflow-hidden">
            <div
              ref={timelineNavRef}
              onPointerDown={handleTimelinePointerDown}
              onPointerMove={handleTimelinePointerMove}
              onPointerUp={handleTimelinePointerUp}
              onPointerLeave={handleTimelinePointerUp}
              className="flex items-center gap-5 sm:gap-7 overflow-x-auto py-1 px-1 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {TIMELINE_YEARS.map((y) => {
                const isSelected = selectedYear === y.year;
                return (
                  <button
                    key={String(y.year)}
                    onClick={() => {
                      if (!timelineHasDraggedRef.current) {
                        setSelectedYear(y.year);
                      }
                    }}
                    className={`transition-all duration-200 whitespace-nowrap cursor-pointer relative py-1 font-mono text-sm sm:text-base ${isSelected
                      ? "text-white font-bold scale-115 text-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                      : "text-slate-500 hover:text-slate-300 scale-95 font-medium"
                      }`}
                  >
                    <span>{y.label}</span>
                    {isSelected && (
                      <motion.span
                        layoutId="activeTimelineUnderline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>


      </div>

      {/* DYNAMIC REFLOW CONTAINER (Left Panel + Right Gallery) */}
      <div
        ref={containerRef}
        className={`relative flex-1 flex flex-col lg:flex-row w-full items-stretch mb-3 ${
          isMobile ? "h-auto overflow-visible" : "overflow-hidden"
        }`}
        style={
          isMobile
            ? {}
            : {
                height: "calc(66vh + 61px)",
                minHeight: "541px",
                maxHeight: "calc(66vh + 61px)",
              }
        }
      >

        {/* ================= LEFT DETAIL PANEL (Dynamic Smooth Scaling 0.25 to 0.45 Width) ================= */}
        <AnimatePresence>
          {selectedImage && (
            <motion.aside
              key="detail-panel-container"
              initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={
                isMobile
                  ? { height: "auto", width: "100%", opacity: 1 }
                  : { width: `${panelWidthRatio * 100}%`, height: "100%", opacity: 1 }
              }
              exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{
                width: { duration: (!isMobile && isResizingRef.current) ? 0 : 0.2, ease: "easeOut" },
                height: { duration: 0.2, ease: "easeOut" },
                opacity: { duration: 0.15 }
              }}
              className="shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 flex flex-col justify-between relative overflow-hidden z-30 shadow-2xl min-w-0 h-auto lg:h-full max-h-full"
            >
              {/* Refined Minimalist Splitter Grip Bar (25% <-> 45% Page Width) */}
              <div
                onPointerDown={handleSplitterDown}
                onPointerMove={handleSplitterMove}
                onPointerUp={handleSplitterUp}
                onPointerCancel={handleSplitterUp}
                title="Kéo ngang để thay đổi kích thước"
                className="absolute right-0 top-0 bottom-0 w-2.5 bg-slate-950/60 hover:bg-blue-600/20 active:bg-blue-500/30 border-l border-white/10 hover:border-blue-500/40 cursor-ew-resize hidden lg:flex items-center justify-center group z-40 transition-all backdrop-blur-sm"
              >
                {/* Minimalist Drag Pill Handle */}
                <div className="w-1 h-12 bg-slate-700/80 group-hover:bg-blue-400 group-active:bg-white rounded-full transition-all duration-300 group-hover:h-16 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
              </div>

              {/* Panel Inside Content Container (padded away from splitter bar on right) */}
              <div className="p-3.5 pr-5 pb-3 h-full min-h-0 flex-1 flex flex-col justify-start overflow-y-auto custom-scrollbar">
                {/* Top Bar: Minimalist Close Button */}
                <div className="flex items-center justify-end pb-1 border-b border-slate-800/80 shrink-0 mb-2">
                  <button
                    onClick={() => setSelectedImageState(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                    title="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Inner Animated Contents when switching between images (Top to Bottom Layout) */}
                <motion.div
                  key={selectedImage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="flex-1 min-h-0 flex flex-col justify-start items-start gap-2.5"
                >
                  {/* High Resolution Image Preview (Aligned top, fit image size with aspect-ratio) */}
                  <div
                    className="relative w-full overflow-hidden border border-slate-800/80 bg-slate-950/90 rounded-lg group shadow-xl transition-[aspect-ratio] duration-300 max-h-[395px] sm:max-h-[435px] shrink-0"
                    style={{ aspectRatio: (selectedImage.aspectRatio || "16/9").replace('/', ' / ') }}
                  >
                    {/* Ambient Blur Backdrop */}
                    <Image
                      src={selectedImage.url}
                      alt=""
                      fill
                      unoptimized
                      priority
                      className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none select-none"
                    />
                    {/* Foreground Image */}
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      fill
                      unoptimized
                      priority
                      className="object-cover rounded-lg drop-shadow-xl block z-10"
                    />
                  </div>

                  {/* Metadata Section stacked directly below image (Top to Bottom, takes minimum required height) */}
                  <div className="w-full space-y-1.5 shrink-0">
                    <h3 className="text-lg md:text-xl font-serif text-white font-bold leading-snug">
                      {selectedImage.title}
                    </h3>

                    {/* Date, Location & Category */}
                    <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>{selectedImage.date}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>{selectedImage.location}</span>
                      </div>

                      <span className="text-blue-400 font-semibold">• {selectedImage.category}</span>
                    </div>

                    {/* Raw Minimalist Description (Hiển thị đầy đủ 100% mô tả) */}
                    <p className="text-[16px] text-slate-300 leading-relaxed font-sans">
                      {selectedImage.description}
                    </p>

                    {/* Raw Minimalist Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[12px] font-mono text-slate-400 pt-0.5">
                      {selectedImage.tags.map((tag, idx) => (
                        <span key={idx} className="hover:text-blue-400 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ================= RIGHT MAIN GALLERY SECTION (ALWAYS RUNNING MARQUEE) ================= */}
        {/* Uniform GAP Y = GAP X = gap-2 (8px) across rows and columns */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-2 py-0 overflow-hidden h-full max-h-full">
          {filteredMarqueeRows.map((rowItems, rowIndex) => (
            <MarqueeRow
              key={rowIndex}
              rowItems={rowItems}
              isEven={rowIndex % 2 === 0}
              onItemClick={handleItemSelect}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
