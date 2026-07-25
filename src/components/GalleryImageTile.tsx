'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GalleryImageTileProps {
  src: string;
  caption: string;
  onClick?: () => void;
  className?: string;
  height?: number | string;
  aspectRatio?: string;
  variant?: 'hero' | 'standard';
  badge?: string;
}

function GalleryImageTile({
  src,
  caption,
  onClick,
  className = '',
  height,
  aspectRatio,
  variant = 'standard',
  badge,
}: GalleryImageTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  const defaultHeight = height ?? (variant === 'hero' ? '22rem' : '340px');

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-[6px] border border-white/[0.08] bg-slate-950 cursor-zoom-in select-none will-change-transform transform-gpu shadow-lg ${className}`}
      style={{
        height: height || !aspectRatio ? (typeof defaultHeight === 'number' ? `${defaultHeight}px` : defaultHeight) : undefined,
        aspectRatio: aspectRatio || undefined,
      }}
    >
      {/* Optional Top Badge */}
      {badge && (
        <span className="absolute top-2.5 left-2.5 z-20 bg-black/60 backdrop-blur-md text-[10px] font-mono tracking-wider font-semibold text-white/90 px-2 py-0.5 rounded border border-white/10 uppercase">
          {badge}
        </span>
      )}

      {/* Background Image */}
      <img
        src={src}
        alt={caption}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />

      {/* Hover Overlay with Framer Motion */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.44, 0, 0.56, 1] }}
            className="absolute inset-x-0 bottom-0 p-3.5 flex items-center justify-start pointer-events-none z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.76) 100%)',
            }}
          >
            <p className="text-[13px] font-medium text-white leading-snug font-sans drop-shadow-md">
              {caption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(GalleryImageTile);
