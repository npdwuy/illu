"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TIMELINE_ITEMS, TimelineItem } from "@/data/timelineData";
import { X, Tag, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import Image from "next/image";

export default function SquareTimeline() {
  // Selected year filter (null = all years active)
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  // Selected item for left side preview album
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Album slideshow state for the active selected item
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Years array from 2016 to 2026
  const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  // Filter items based on active year filter
  const isItemActive = (year: number) => {
    if (selectedYear === null) return true;
    return year === selectedYear;
  };

  // Automatically cycle album slideshow images when an item is selected
  useEffect(() => {
    setCurrentImageIndex(0); // Reset index on item change
  }, [selectedItem?.id]);

  useEffect(() => {
    if (!selectedItem || !selectedItem.images.length || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % selectedItem.images.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [selectedItem, isPlaying]);

  // Lazy preload: only cover images of first row (visible on mount), defer album images
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only preload the first 4 cover images (row 1, visible immediately)
      TIMELINE_ITEMS.slice(0, 4).forEach((item) => {
        if (item.imageUrl) {
          const img = new window.Image();
          img.src = item.imageUrl;
        }
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Row 1: 4 items (Index 0, 1, 2, 3) -> 2016, 2017, 2018, 2019
  const row1Items = TIMELINE_ITEMS.slice(0, 4);
  // Row 2: 3 items (Index 4, 5, 6) -> 2020, 2021, 2022
  const row2Items = TIMELINE_ITEMS.slice(4, 7);
  // Row 3: 3 items (Index 7, 8, 9) -> 2023, 2024, 2026
  const row3Items = TIMELINE_ITEMS.slice(7, 10);

  // Height constants — keep in sync with image row heights below
  // Each row: border-2 (2px top + 2px bottom) + h-[155px] = 159px
  // 3 rows × 159px + 2 spacers × 20px = 477 + 40 = 517px
  const PANEL_H = 517;
  const PANEL_PADDING = 20; // p-5 = 20px each side, 40px total
  const SLIDESHOW_H = 255; // fixed slideshow height; remaining space fills info section via flex

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-8 font-sans text-slate-100 select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
        {/* Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-white lowercase">
            dòng thời gian
          </h1>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
            2016 – 2026
          </span>
        </div>

        {/* YEAR SELECTION LIST (Liệt kê các năm từ 2016 - 2026, Phóng to năm đang chọn) */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
          {/* Option: Tất cả */}
          <button
            onClick={() => setSelectedYear(null)}
            className={`transition-all duration-300 font-mono text-sm px-2 py-1 ${
              selectedYear === null
                ? "text-amber-400 font-bold scale-110 border-b-2 border-amber-400"
                : "text-slate-400 hover:text-slate-200 opacity-70"
            }`}
          >
            Tất cả
          </button>

          <span className="text-slate-700 font-mono">|</span>

          {/* List of Years */}
          {YEARS.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(isSelected ? null : yr)}
                className={`relative transition-all duration-300 font-mono tracking-tight cursor-pointer ${
                  isSelected
                    ? "text-amber-400 font-extrabold text-2xl md:text-3xl scale-125 mx-1.5 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : "text-slate-400 hover:text-slate-100 text-sm md:text-base opacity-60 hover:opacity-100"
                }`}
              >
                {yr}
                {isSelected && (
                  <motion.span
                    layoutId="activeYearIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      {/* Total image rows height: 3×155px + 2×20px gap + borders ≈ 515px */}
      <div className="relative flex flex-col lg:flex-row gap-6" style={{ minHeight: PANEL_H }}>
        {/* LEFT SIDE PREVIEW PANEL (CHỈ HIỂN THỊ KHI ĐÃ CHỌN Ô TIMELINE, CHẠY SLIDESHOW ALBUM MƯỢT MÀ) */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              key={selectedItem.id}
              initial={{ opacity: 0, width: 0, x: -15 }}
              animate={{ opacity: 1, width: "100%", x: 0 }}
              exit={{ opacity: 0, width: 0, x: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:w-[440px] shrink-0 bg-slate-900 border border-amber-500/50 shadow-2xl flex flex-col relative"
              style={{
                height: PANEL_H,
                maxHeight: PANEL_H,
                padding: PANEL_PADDING,
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Close Button (Loại bỏ xem ảnh) */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 z-20 p-2 bg-black/70 hover:bg-black text-slate-300 hover:text-white rounded-full transition-all border border-slate-700 shadow-md"
                title="Đóng xem album"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ALBUM SLIDESHOW CONTAINER — chiều cao cố định, phần còn lại dành cho text */}
              <div
                className="relative w-full overflow-hidden border border-slate-800 group bg-slate-950 flex items-center justify-center shrink-0"
                style={{ height: SLIDESHOW_H }}
              >
                {/* Ambient Blur Backdrop — Static crossfade to avoid slider repaints in filter */}
                <div
                  className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
                  style={{ contain: "strict" }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.35 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 w-full h-full"
                      style={{ filter: "blur(24px)", transform: "scale(1.15)" }}
                    >
                      <Image
                        src={selectedItem.images[currentImageIndex]}
                        alt=""
                        fill
                        unoptimized
                        priority
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Foreground Slider — Dùng translateX để tối ưu GPU thay vì opacity crossfade */}
                <div 
                  className="relative z-10 flex w-full h-full"
                  style={{
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "transform",
                  }}
                >
                  {selectedItem.images.map((src, idx) => (
                    <div key={idx} className="relative w-full h-full shrink-0 flex items-center justify-center p-2">
                      <Image
                        src={src}
                        alt={`${selectedItem.title} - photo ${idx + 1}`}
                        fill
                        unoptimized
                        priority={idx === 0}
                        className="object-contain drop-shadow-xl"
                      />
                    </div>
                  ))}
                </div>

                {/* Top Badge: Year & Photo Count */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="bg-black/80 backdrop-blur-md px-3 py-1 border border-amber-500/60 text-amber-400 font-mono text-xs font-bold">
                    {selectedItem.year}
                  </span>
                  <span className="bg-black/70 text-slate-300 font-mono text-[11px] px-2 py-0.5 border border-slate-700">
                    Ảnh {currentImageIndex + 1} / {selectedItem.images.length}
                  </span>
                </div>

                {/* Slideshow Controls (Next / Prev / Pause) */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (prev) => (prev - 1 + selectedItem.images.length) % selectedItem.images.length
                      )
                    }
                    className="p-1.5 bg-black/70 text-white hover:bg-amber-500 rounded-md transition-colors border border-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 bg-black/70 text-amber-400 hover:bg-slate-800 rounded-md transition-colors border border-slate-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev + 1) % selectedItem.images.length)
                    }
                    className="p-1.5 bg-black/70 text-white hover:bg-amber-500 rounded-md transition-colors border border-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {selectedItem.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? "w-5 bg-amber-400" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Information Metadata
                  flex: 1 1 0 + min-height: 0 = fill exact remaining space, never overflow panel.
                  Text scrolls inside; panel height stays locked at PANEL_H.
              */}
              <div
                className="mt-4 flex flex-col"
                style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
              >
                {/* Scrollable text — grows freely, scrolls when content exceeds space */}
                <div
                  className="flex-1 overflow-y-auto pr-1"
                  style={{
                    minHeight: 0,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(251,191,36,0.4) transparent",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-xs text-amber-400 font-mono uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Album: {selectedItem.category}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.subtitle && (
                    <p className="text-xs font-medium text-slate-400 mb-2.5 italic">
                      {selectedItem.subtitle}
                    </p>
                  )}
                  <p
                    className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 border-l-2 border-amber-500"
                    style={{ fontSize: "14.3px" }}
                  >
                    {selectedItem.description}
                  </p>
                </div>

                {/* Footer — pinned below text, never scrolls */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
                  <span>Album tự động chạy slideshow</span>
                  <span className="text-amber-400">Click ô khác để xem album năm tương ứng</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT SIDE: RECTANGULAR SERPENTINE TIMELINE TRACK */}
        <div className="flex-1 flex flex-col gap-0 relative">
          
          {/* ================= ROW 1 (4 COLUMNS: Left -> Right) ================= */}
          <div className="relative border-2 border-slate-600 bg-slate-950">
            <div className="grid grid-cols-4 divide-x-2 divide-slate-600">
              {row1Items.map((item) => {
                const active = isItemActive(item.year);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative h-[155px] cursor-pointer overflow-hidden group ${
                      !active ? "opacity-25 grayscale saturate-0" : "opacity-100"
                    } ${isSelected ? "ring-2 ring-amber-400 z-10" : ""}`}
                    style={{ transition: "opacity 0.3s ease, filter 0.3s ease" }}
                  >
                    {/* ONLY IMAGE INSIDE THE BLOCK — GPU-accelerated scale via transform3d */}
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 25vw, 250px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 transform-gpu"
                      style={{ willChange: "transform", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end p-2" style={{ transition: "opacity 0.3s ease" }}>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-black/80 px-2 py-0.5 border border-amber-500/40">
                        {item.year} • Xem Album
                      </span>
                    </div>

                    {/* Year tag */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-slate-200 font-mono text-[11px] px-1.5 py-0.5 border border-slate-700">
                      {item.year}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sharp 90-degree Vertical Connection (Right edge) */}
            <div className="absolute -bottom-[24px] right-[-2px] w-[24px] h-[26px] border-r-2 border-b-2 border-slate-600 pointer-events-none z-20" />
          </div>

          <div className="h-[20px]" />

          {/* ================= ROW 2 (3 COLUMNS: Right -> Left) ================= */}
          <div className="relative border-2 border-slate-600 bg-slate-950">
            <div className="grid grid-cols-3 divide-x-2 divide-slate-600">
              {row2Items.map((item) => {
                const active = isItemActive(item.year);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative h-[155px] cursor-pointer overflow-hidden group ${
                      !active ? "opacity-25 grayscale saturate-0" : "opacity-100"
                    } ${isSelected ? "ring-2 ring-amber-400 z-10" : ""}`}
                    style={{ transition: "opacity 0.3s ease, filter 0.3s ease" }}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 25vw, 250px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 transform-gpu"
                      style={{ willChange: "transform", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end p-2" style={{ transition: "opacity 0.3s ease" }}>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-black/80 px-2 py-0.5 border border-amber-500/40">
                        {item.year} • Xem Album
                      </span>
                    </div>

                    {/* Year tag */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-slate-200 font-mono text-[11px] px-1.5 py-0.5 border border-slate-700">
                      {item.year}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sharp 90-degree Vertical Connection (Left edge) */}
            <div className="absolute -bottom-[24px] left-[-2px] w-[24px] h-[26px] border-l-2 border-b-2 border-slate-600 pointer-events-none z-20" />
          </div>

          <div className="h-[20px]" />

          {/* ================= ROW 3 (3 COLUMNS: Left -> Right) ================= */}
          <div className="relative border-2 border-slate-600 bg-slate-950">
            <div className="grid grid-cols-3 divide-x-2 divide-slate-600">
              {row3Items.map((item) => {
                const active = isItemActive(item.year);
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative h-[155px] cursor-pointer overflow-hidden group ${
                      !active ? "opacity-25 grayscale saturate-0" : "opacity-100"
                    } ${isSelected ? "ring-2 ring-amber-400 z-10" : ""}`}
                    style={{ transition: "opacity 0.3s ease, filter 0.3s ease" }}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 25vw, 250px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 transform-gpu"
                      style={{ willChange: "transform", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end p-2" style={{ transition: "opacity 0.3s ease" }}>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-black/80 px-2 py-0.5 border border-amber-500/40">
                        {item.year} • Xem Album
                      </span>
                    </div>

                    {/* Year tag */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-slate-200 font-mono text-[11px] px-1.5 py-0.5 border border-slate-700">
                      {item.year}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
