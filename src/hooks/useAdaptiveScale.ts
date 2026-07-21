'use client';

import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useAdaptiveScale(baseWidth = 1920, baseHeight = 1080) {
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Dành cho màn hình máy tính / tablet ngang (>= 1024px)
      if (width >= 1024) {
        const widthScale = width / baseWidth;
        const heightScale = height / baseHeight;

        // Ưu tiên chọn tỷ lệ theo chiều rộng nhưng có cân đối chiều cao
        let calculatedScale = Math.min(widthScale, heightScale);
        calculatedScale = 1;
        // Clamping scale từ 0.75 (màn laptop HD nhỏ) đến 1.35 (màn 2K/4K lớn)
        // calculatedScale = 1.108; //Math.max(0.75, Math.min(1.35, calculatedScale));

        setScale(calculatedScale);
        document.documentElement.style.setProperty('--app-scale', calculatedScale.toFixed(4));
      } else {
        // Màn hình di động dùng responsive chuẩn
        setScale(1);
        document.documentElement.style.setProperty('--app-scale', '1');
      }

      // Kích hoạt GSAP làm mới lại tọa độ ScrollTrigger
      setTimeout(() => {
        if (typeof window !== 'undefined' && ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      }, 100);
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
