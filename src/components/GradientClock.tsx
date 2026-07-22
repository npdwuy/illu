'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface GradientClockProps {
  className?: string;
  size?: number | string; // Đường kính/Kích thước khung đồng hồ (px hoặc %), mặc định 350
  
  // Tùy chỉnh Kim Giờ (ảnh nằm ngang, vị trí neo ở phía bên trái)
  hourHandSrc?: string;
  hourLength?: number | string; // Chiều dài kim giờ (px hoặc %)
  hourHeight?: number | string; // Chiều cao/dày kim giờ (px hoặc %)
  hourPivotX?: number; // Tâm xoay X (% tính từ mép trái ảnh kim giờ, mặc định 7.7%)
  hourPivotY?: number; // Tâm xoay Y (% tính từ mép trên ảnh kim giờ, mặc định 50%)
  hourOffsetDeg?: number; // Góc hiệu chỉnh phụ cho kim giờ (độ)

  // Tùy chỉnh Kim Phút (ảnh nằm ngang, vị trí neo ở phía bên trái)
  minHandSrc?: string;
  minLength?: number | string; // Chiều dài kim phút (px hoặc %)
  minHeight?: number | string; // Chiều cao/dày kim phút (px hoặc %)
  minPivotX?: number; // Tâm xoay X (% tính từ mép trái ảnh kim phút, mặc định 4.8%)
  minPivotY?: number; // Tâm xoay Y (% tính từ mép trên ảnh kim phút, mặc định 50%)
  minOffsetDeg?: number; // Góc hiệu chỉnh phụ cho kim phút (độ)

  // Chế độ xoay
  smooth?: boolean; // True: trôi mượt 60fps, False: giật từng nấc (1 nấc = 1/60 vòng = 6 độ)
  autoSpin?: boolean; // Xoay tự động liên tục (mặc định false)
  spinSpeed?: number; // Tốc độ nấc/giây khi autoSpin (mặc định 1 nấc/giây)
  tickIntervalMs?: number; // Khoảng thời gian cơ bản giữa các nấc (ms, mặc định 1000ms)

  // Tùy chỉnh màu & hiển thị
  gradient?: string; // Dải màu Gradient tô cho 2 kim
  showDialBackground?: boolean; // Hiển thị mặt nền đồng hồ (mặc định false - chỉ hiện 2 kim xoay)
  showCenterCap?: boolean; // Hiển thị hình tròn che phần gốc kim (mặc định true)
  centerCapGradient?: string; // Dải màu Gradient cho hình tròn che tâm (mặc định trùng màu kim)
  centerCapSize?: number | string; // Kích thước hình tròn chốt giữa (px hoặc %)
  centerCapOffsetX?: number; // Độ dời vị trí X của nắp chốt giữa (px, mặc định 0)
  centerCapOffsetY?: number; // Độ dời vị trí Y của nắp chốt giữa (px, mặc định 0)

  // Tùy chỉnh trực tiếp góc xoay cho Intro Animation
  manualHourDeg?: number;
  manualMinDeg?: number;

  style?: React.CSSProperties;
}

export default function GradientClock({
  className = '',
  size = 350,
  
  hourHandSrc = '/hour.webp',
  hourLength,
  hourHeight,
  hourPivotX = 7.7,
  hourPivotY = 50,
  hourOffsetDeg = 0,

  minHandSrc = '/min.webp',
  minLength,
  minHeight,
  minPivotX = 4.8,
  minPivotY = 50,
  minOffsetDeg = 0,

  smooth = true,
  autoSpin = false,
  spinSpeed = 1,
  tickIntervalMs = 1000,

  gradient = 'linear-gradient(90deg, #a855f7 0%, #06b6d4 50%, #3b82f6 100%)',
  showDialBackground = false,
  showCenterCap = true,
  centerCapGradient,
  centerCapSize,
  centerCapOffsetX = 0,
  centerCapOffsetY = 0,

  manualHourDeg,
  manualMinDeg,

  style,
}: GradientClockProps) {
  const [angles, setAngles] = useState({ hourDeg: 0, minDeg: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const isPercent = typeof size === 'string';

  // Tính chiều dài & cao mặc định dựa theo kích thước size và tỷ lệ ảnh thực tế (hour: 468x93, min: 647x64)
  const actualHourLength = hourLength ?? (isPercent ? '38%' : Math.round((size as number) * 0.38));
  const actualHourHeight = hourHeight ?? (isPercent ? '7.55%' : Math.round((actualHourLength as number) * (93 / 468)));

  const actualMinLength = minLength ?? (isPercent ? '46%' : Math.round((size as number) * 0.46));
  const actualMinHeight = minHeight ?? (isPercent ? '4.55%' : Math.round((actualMinLength as number) * (64 / 647)));

  // Kích thước chốt tròn che gốc 2 kim (mặc định khoảng 14% kích thước mặt đồng hồ)
  const actualCapSize = centerCapSize ?? (isPercent ? '4%' : Math.max(20, Math.round((size as number) * 0.14)));

  // Màu gradient nắp chốt giữa (mặc định lấy theo màu gradient của kim)
  const actualCapGradient = centerCapGradient ?? gradient;

  useEffect(() => {
    setIsMounted(true);

    if (manualHourDeg !== undefined && manualMinDeg !== undefined) {
      setAngles({
        hourDeg: manualHourDeg + hourOffsetDeg,
        minDeg: manualMinDeg + minOffsetDeg,
      });
      return;
    }

    let startTimestamp: number | null = null;
    let stepCount = 0;

    if (smooth) {
      // Chế độ xoay mượt 60fps
      const tick = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;

        if (autoSpin) {
          const elapsedSec = ((timestamp - startTimestamp) / 1000) * spinSpeed;
          const minDeg = (elapsedSec * 30 - 90 + minOffsetDeg) % 360;
          const hourDeg = (elapsedSec * 5 - 90 + hourOffsetDeg) % 360;
          setAngles({ hourDeg, minDeg });
        } else {
          const now = new Date();
          const ms = now.getMilliseconds();
          const seconds = now.getSeconds() + ms / 1000;
          const minutes = now.getMinutes() + seconds / 60;
          const hours = (now.getHours() % 12) + minutes / 60;

          const minDeg = minutes * 6 - 90 + minOffsetDeg;
          const hourDeg = hours * 30 - 90 + hourOffsetDeg;
          setAngles({ hourDeg, minDeg });
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    } else {
      // Chế độ giật từng nấc (1 nấc chuẩn = 1/60 vòng = 6° cho kim phút, 0.5° cho kim giờ)
      const intervalMs = Math.max(30, Math.round(tickIntervalMs / Math.max(0.1, spinSpeed)));

      const updateClock = () => {
        if (autoSpin) {
          stepCount += 1;
          const minDeg = (stepCount * 6 - 90 + minOffsetDeg) % 360;
          const hourDeg = (stepCount * 0.5 - 90 + hourOffsetDeg) % 360;
          setAngles({ hourDeg, minDeg });
        } else {
          const now = new Date();
          const seconds = now.getSeconds();
          const minutes = now.getMinutes() + seconds / 60;
          const hours = (now.getHours() % 12) + minutes / 60;

          const minDeg = minutes * 6 - 90 + minOffsetDeg;
          const hourDeg = hours * 30 - 90 + hourOffsetDeg;
          setAngles({ hourDeg, minDeg });
        }
      };

      updateClock();
      const updateInterval = setInterval(updateClock, intervalMs);

      return () => clearInterval(updateInterval);
    }
  }, [smooth, autoSpin, spinSpeed, tickIntervalMs, hourOffsetDeg, minOffsetDeg, manualHourDeg, manualMinDeg]);

  if (!isMounted) {
    return (
      <div
        className={`relative ${className}`}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          ...style,
        }}
      />
    );
  }

  const formatDimension = (val: number | string) => (typeof val === 'number' ? `${val}px` : val);

  return (
    <div
      className={`relative rounded-full select-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        background: showDialBackground ? '#1e293b' : 'transparent',
        boxShadow: showDialBackground
          ? '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.05)'
          : 'none',
        border: showDialBackground ? '6px solid #334155' : 'none',
        ...style,
      }}
    >
      {/* Kim Giờ (Pivot ở vị trí bên trái) */}
      <div
        className={`absolute top-1/2 left-1/2 pointer-events-none ${
          !smooth ? 'transition-transform duration-100 ease-out' : ''
        }`}
        style={{
          width: formatDimension(actualHourLength),
          height: formatDimension(actualHourHeight),
          transformOrigin: `${hourPivotX}% ${hourPivotY}%`,
          transform: `translate(-${hourPivotX}%, -${hourPivotY}%) rotate(${angles.hourDeg}deg)`,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: gradient,
            WebkitMaskImage: `url('${hourHandSrc}')`,
            maskImage: `url('${hourHandSrc}')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'left center',
            maskPosition: 'left center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>

      {/* Kim Phút (Pivot ở vị trí bên trái) */}
      <div
        className={`absolute top-1/2 left-1/2 pointer-events-none ${
          !smooth ? 'transition-transform duration-100 ease-out' : ''
        }`}
        style={{
          width: formatDimension(actualMinLength),
          height: formatDimension(actualMinHeight),
          transformOrigin: `${minPivotX}% ${minPivotY}%`,
          transform: `translate(-${minPivotX}%, -${minPivotY}%) rotate(${angles.minDeg}deg)`,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: gradient,
            WebkitMaskImage: `url('${minHandSrc}')`,
            maskImage: `url('${minHandSrc}')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'left center',
            maskPosition: 'left center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>

      {/* Hình tròn che phần gốc của 2 kim (Màu Gradient đồng nhất với kim) */}
      {showCenterCap && (
        <div
          className="absolute top-1/2 left-1/2 rounded-full z-10 pointer-events-none"
          style={{
            width: formatDimension(actualCapSize),
            height: formatDimension(actualCapSize),
            background: actualCapGradient,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
            transform: `translate(calc(-50% + ${centerCapOffsetX}px), calc(-50% + ${centerCapOffsetY}px))`,
          }}
        />
      )}
    </div>
  );
}
