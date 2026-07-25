import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface CountdownCardProps {
  showCard?: boolean;
  title?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: string;
  masterClockRef: React.RefObject<HTMLDivElement | null>;
}

export default function CountdownCard({
  showCard = false,
  title = 'Event',
  x = 1430,
  y = 135,
  scale = 0.75,
  rotation = '7deg',
  masterClockRef,
}: CountdownCardProps) {
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [masterClockScale, setMasterClockScale] = useState<number | null>(null);

  // ResizeObserver for masterClockScale
  useEffect(() => {
    if (!masterClockRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newScale = entry.contentRect.width / 1440;
        setMasterClockScale((prev) => {
          if (prev === null || Math.abs(prev - newScale) > 0.005) return newScale;
          return prev;
        });
      }
    });
    observer.observe(masterClockRef.current);
    return () => observer.disconnect();
  }, [masterClockRef]);

  // Event countdown timer
  useEffect(() => {
    const targetDate = new Date('2026-07-26T16:30:00').getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({
        days: d < 10 ? `0${d}` : `${d}`,
        hours: h < 10 ? `0${h}` : `${h}`,
        minutes: m < 10 ? `0${m}` : `${m}`,
        seconds: s < 10 ? `0${s}` : `${s}`,
      });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  if (!showCard) return null;

  const daysStr = (countdown.days || '00').padStart(2, '0');
  const hoursStr = (countdown.hours || '00').padStart(2, '0');
  const minsStr = (countdown.minutes || '00').padStart(2, '0');

  return (
    <div
      className="absolute pointer-events-auto z-0 select-none transition-opacity duration-300"
      style={{
        opacity: masterClockScale === null ? 0 : 1, // Ẩn hoàn toàn cho đến khi tính xong kích thước
        // Chuyển đổi tọa độ 1440x810 sang % tương đối để đồng bộ tuyệt đối với tỉ lệ thẻ SVG
        right: `${((1440 - x) / 1440) * 100}%`,
        top: `${(y / 810) * 100}%`,
        transform: `scale(${scale * (masterClockScale || 1)}) rotate(${rotation})`,
        transformOrigin: 'top right',
      }}
    >
      <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 flex flex-col gap-3.5 w-fit">
        <div className="flex items-center justify-between px-0.5 gap-4">
          <h4 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight font-sans">
            {title}
          </h4>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300/90 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 stroke-[2]" />
          </div>
        </div>

        <div className="flex items-start justify-center gap-1.5 sm:gap-2 pt-0.5">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {daysStr[0]}
              </div>
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {daysStr[1]}
              </div>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
              days
            </span>
          </div>

          <div className="h-12 sm:h-17 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-900 px-0.5">:</div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {hoursStr[0]}
              </div>
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {hoursStr[1]}
              </div>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
              hours
            </span>
          </div>

          <div className="h-12 sm:h-17 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-900 px-0.5">:</div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {minsStr[0]}
              </div>
              <div className="w-9 sm:w-13 aspect-[3/4] bg-[#f3f4f6] rounded-md border border-slate-200/40 flex items-center justify-center text-2xl sm:text-4xl font-medium text-slate-900 font-sans shadow-inner">
                {minsStr[1]}
              </div>
            </div>
            <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight font-sans mt-0.5">
              minutes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
