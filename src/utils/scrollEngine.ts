export interface ScrollBufferStageConfig {
  /** Starting scroll position (in px, or in vh units if `isVh` is true) */
  start: number;
  /** Length of the freeze/buffer zone where progress remains 0.0 (in px or vh units) */
  buffer: number;
  /** Distance of movement/animation phase after buffer ends (in px or vh units) */
  slide: number;
  /** Set to true if start, buffer, slide are in vh units (multiplied by window.innerHeight) */
  isVh?: boolean;
}

export interface ScrollStageState {
  /** True if scroll position is before the stage starts */
  isBefore: boolean;
  /** True if current scroll position is in the frozen buffer zone */
  isFrozen: boolean;
  /** True if current scroll position is in the active sliding phase */
  isSliding: boolean;
  /** True if the stage has completely finished sliding */
  isFinished: boolean;
  /** Progress from 0.0 to 1.0 during sliding phase (0 while frozen, 1 when finished) */
  progress: number;
}

/**
 * Pure function to calculate exact scroll buffer states and parallax progress for any checkpoint
 */
export function calculateScrollStage(
  scrollY: number,
  config: ScrollBufferStageConfig,
  vh: number = typeof window !== 'undefined' ? window.innerHeight : 1000
): ScrollStageState {
  const scale = config.isVh ? vh : 1;
  const startPx = config.start * scale;
  const bufferPx = config.buffer * scale;
  const slidePx = config.slide * scale;

  const bufferEndPx = startPx + bufferPx;
  const fullEndPx = bufferEndPx + slidePx;

  if (scrollY < startPx) {
    return { isBefore: true, isFrozen: false, isSliding: false, isFinished: false, progress: 0 };
  }

  if (scrollY >= startPx && scrollY < bufferEndPx) {
    return { isBefore: false, isFrozen: true, isSliding: false, isFinished: false, progress: 0 };
  }

  if (scrollY >= bufferEndPx && scrollY < fullEndPx) {
    const progress = (scrollY - bufferEndPx) / (slidePx || 1);
    return { isBefore: false, isFrozen: false, isSliding: true, isFinished: false, progress: Math.min(1, Math.max(0, progress)) };
  }

  return { isBefore: false, isFrozen: false, isSliding: false, isFinished: true, progress: 1 };
}
