'use client';

import { useState, useEffect } from 'react';

/**
 * Adaptive scale hook — sets CSS variable --app-scale for desktop scaling.
 * Currently hardcoded to 1 (no scaling) but kept as infrastructure for future use.
 */
export function useAdaptiveScale(baseWidth = 1920, baseHeight = 1080) {
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;

      if (width >= 1024) {
        // Desktop — scale is fixed at 1 for now
        const calculatedScale = 1;
        setScale(calculatedScale);
        document.documentElement.style.setProperty('--app-scale', calculatedScale.toFixed(4));
      } else {
        // Mobile uses standard responsive
        setScale(1);
        document.documentElement.style.setProperty('--app-scale', '1');
      }
    };

    calculateScale();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateScale, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [baseWidth, baseHeight]);

  return scale;
}

