'use client';

import { useState, useEffect, useRef } from 'react';

export interface ScrollParallaxOptions {
  /** Waiting buffer in vh before animation starts (default: 0.0) */
  freezeVh?: number;
  /** Speed multiplier after freeze buffer ends (default: 0.2) */
  speed?: number;
  /** Direction of transform movement: 'up' (default) or 'down' */
  direction?: 'up' | 'down';
  /** Start scroll trigger in vh (default: 0.0) */
  triggerStartVh?: number;
  /** Custom track height in vh (auto-calculated if omitted: 100 + freezeVh*100 + 20) */
  trackHeightVh?: number;
  /** Maximum parallax displacement in pixels to prevent infinite scrolling offset */
  maxParallaxPx?: number;
  /** Optional Ref to manipulate DOM directly and bypass React state re-renders */
  targetRef?: React.RefObject<HTMLElement | null>;
}

export interface ScrollParallaxResult {
  /** Parallax Y offset in pixels */
  parallaxY: number;
  /** Ready-to-use CSS style object for the target element */
  style: React.CSSProperties;
  /** Ready-to-use CSS style object for the container track height */
  trackHeightStyle: React.CSSProperties;
  /** True if scroll is currently within the frozen waiting buffer phase */
  isFrozen: boolean;
  /** True if scroll has passed the freeze buffer and is actively moving */
  isSliding: boolean;
  /** Progress of animation from 0.0 to 1.0 */
  progress: number;
  /** Calculated container track height in vh units */
  calculatedTrackHeightVh: number;
}

/**
 * Pure parallax computation — no side effects, no RAF, no listeners.
 * Use this inside a shared RAF loop to avoid multiple competing loops.
 */
export function computeParallax(
  sy: number,
  vh: number,
  options: ScrollParallaxOptions
): { parallaxY: number; isFrozen: boolean; isSliding: boolean; progress: number } {
  const {
    freezeVh = 0.0,
    speed = 0.2,
    direction = 'up',
    triggerStartVh = 0.0,
    maxParallaxPx,
  } = options;

  const scrollVh = sy / (vh || 1);
  const activeScrollVh = scrollVh - triggerStartVh;

  let newParallaxY = 0;
  let newIsFrozen = false;
  let newIsSliding = false;
  let newProgress = 0;

  if (activeScrollVh <= 0) {
    newParallaxY = 0;
    newIsFrozen = true;
  } else if (activeScrollVh <= freezeVh) {
    newParallaxY = 0;
    newIsFrozen = true;
  } else {
    const excessPx = (activeScrollVh - freezeVh) * vh;
    const sign = direction === 'up' ? -1 : 1;
    let calculatedY = sign * excessPx * speed;

    if (maxParallaxPx !== undefined && maxParallaxPx > 0) {
      if (direction === 'up') {
        calculatedY = Math.max(-maxParallaxPx, calculatedY);
      } else {
        calculatedY = Math.min(maxParallaxPx, calculatedY);
      }
    }

    newParallaxY = calculatedY;
    newIsSliding = true;

    const maxDistancePx = vh * 1.5;
    newProgress = Math.min(1, Math.max(0, excessPx / maxDistancePx));
  }

  return {
    parallaxY: newParallaxY,
    isFrozen: newIsFrozen,
    isSliding: newIsSliding,
    progress: newProgress,
  };
}

/**
 * Standard High-Performance Scroll Parallax Hook (Mechanism 1: Native CSS Sticky + GPU Parallax).
 * Pins element using native GPU compositor sticky top-0 during freezeVh, then applies smooth parallax movement.
 *
 * NOTE: For best multi-monitor stability, prefer using computeParallax() inside a single shared RAF loop
 * when multiple parallax instances exist on the same page, to avoid competing RAF loops.
 *
 * @example
 * ```tsx
 * const homeParallax = useScrollParallax({ freezeVh: 1.0, speed: 0.1 });
 * const timelineParallax = useScrollParallax({ freezeVh: 0.0, speed: 0.35, maxParallaxPx: 300 });
 * ```
 */
export function useScrollParallax(options: ScrollParallaxOptions = {}): ScrollParallaxResult {
  const {
    freezeVh = 0.0,
    speed = 0.2,
    direction = 'up',
    triggerStartVh = 0.0,
    trackHeightVh,
    maxParallaxPx,
    targetRef,
  } = options;

  // Keep a stable ref to options so the RAF loop doesn't need to restart on option changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [parallaxY, setParallaxY] = useState(0);
  const [isFrozen, setIsFrozen] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-calculate parent track height so native CSS sticky top-0 has enough room to freeze
  const computedTrackHeightVh = trackHeightVh ?? (100 + freezeVh * 100 + 20);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (typeof window === 'undefined') return;

          const sy = window.scrollY;
          const vh = window.innerHeight || 1;

          const result = computeParallax(sy, vh, optionsRef.current);

          if (targetRef && targetRef.current) {
            // Direct DOM mutation — stays on compositor thread, no React re-render
            targetRef.current.style.transform = `translate3d(0, ${result.parallaxY}px, 0)`;
          } else {
            setParallaxY(result.parallaxY);
            setIsFrozen(result.isFrozen);
            setIsSliding(result.isSliding);
            setProgress(result.progress);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial trigger

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    parallaxY,
    style: {
      transform: `translate3d(0, ${parallaxY}px, 0)`,
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
    },
    trackHeightStyle: {
      height: `${computedTrackHeightVh}vh`,
    },
    isFrozen,
    isSliding,
    progress,
    calculatedTrackHeightVh: computedTrackHeightVh,
  };
}
