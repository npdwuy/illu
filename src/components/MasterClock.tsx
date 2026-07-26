import React, { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import ClockGears from '@/components/ClockGears';
import GradientClock from '@/components/GradientClock';
import CountdownCard from '@/components/CountdownCard';

// ============================================================================
// BỘ ĐIỀU CHỈNH CẤU HÌNH INTRO ANIMATION
// ============================================================================

const INTRO_START_DELAY_SEC = 0.0;
const TOTAL_INTRO_DURATION_SEC = 8;
const NUMBERS_START_DELAY_SEC = 1.25;
const TENS_SLIDE_START_RATIO = 0.4;
const REEL_FADE_DISTANCE = 180;
const NUMBERS_BEZIER_CURVE: [number, number, number, number] = [0.5, 0.0, 0.38, 1.0];
const STAR_BEZIER_CURVE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

interface StarAnimConfig {
  id: string;
  x: number;
  y: number;
  baseScale: number;
  fill: string;
  turns: number;
  spinSpeed: number;
  endRotation: number;
  delaySec: number;
  bezierCurve?: [number, number, number, number];
}

const STAR_ANIM_CONFIG: StarAnimConfig[] = [
  { id: 'star-w1', x: 640, y: 155, baseScale: 0.35, fill: 'white', turns: 1, spinSpeed: 1.0, endRotation: 15, delaySec: 4.2 },
  { id: 'star-w2', x: 1100, y: 280, baseScale: 0.6, fill: 'white', turns: 0.5, spinSpeed: 1.2, endRotation: -20, delaySec: 4.4 },
  { id: 'star-w3', x: 580, y: 440, baseScale: 0.6, fill: 'white', turns: 1, spinSpeed: 1.5, endRotation: 45, delaySec: 4.6 },
  { id: 'star-b1', x: 1050, y: 120, baseScale: 0.33, fill: 'url(#starBlueGradient)', turns: 0.8, spinSpeed: 2.0, endRotation: 90, delaySec: 4.8 },
  { id: 'star-b2', x: 650, y: 480, baseScale: 0.35, fill: 'url(#starBlueGradient)', turns: 0.67, spinSpeed: 1.1, endRotation: -45, delaySec: 4.5 },
];

const CLOCK_START_MINUTES_BEFORE_10 = 8;
const CLOCK_STEPS_PER_SEC = 1;

// Cấu hình thẻ đếm ngược
const SHOW_CLOCK_COUNTDOWN_CARD = false; // Bật tắt ở đây nếu muốn hiển thị
const CLOCK_COUNTDOWN_TITLE = 'Event';
const CLOCK_COUNTDOWN_X = 1430;
const CLOCK_COUNTDOWN_Y = 135;
const CLOCK_COUNTDOWN_SCALE = 0.75;
const CLOCK_COUNTDOWN_ROTATION = '7deg';

function solveCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u;
    const dx = 3 * (1 - u) * (1 - u) * p1x + 6 * (1 - u) * u * (p2x - p1x) + 3 * u * u * (1 - p2x);
    if (Math.abs(dx) < 1e-6) break;
    u -= (x - t) / dx;
  }

  return 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
}

export default function MasterClock() {
  const masterClockRef = useRef<HTMLDivElement>(null);
  const [introElapsedSec, setIntroElapsedSec] = useState(0);
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      setIntroElapsedSec(TOTAL_INTRO_DURATION_SEC);
      setIsIntroFinished(true);
      return;
    }

    let startTime: number | null = null;
    let lastRenderTime = 0;
    let animFrame: number;
    const TARGET_FPS = 30; // Giới hạn 30 FPS cho dải số intro
    const frameInterval = 1000 / TARGET_FPS;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const totalRequired = INTRO_START_DELAY_SEC + TOTAL_INTRO_DURATION_SEC;

      if (elapsed >= totalRequired) {
        setIntroElapsedSec(TOTAL_INTRO_DURATION_SEC);
        setIsIntroFinished(true);
      } else {
        if (timestamp - lastRenderTime >= frameInterval) {
          lastRenderTime = timestamp;
          const activeElapsed = Math.max(0, elapsed - INTRO_START_DELAY_SEC);
          setIntroElapsedSec(activeElapsed);
        }
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Tiến trình trượt số sau độ trễ NUMBERS_START_DELAY_SEC
  const activeNumbersElapsed = Math.max(0, introElapsedSec - NUMBERS_START_DELAY_SEC);
  const numbersDuration = Math.max(0.2, TOTAL_INTRO_DURATION_SEC - NUMBERS_START_DELAY_SEC);
  const rawNumbersProgress = Math.min(1, activeNumbersElapsed / numbersDuration);

  // 1. Tiến trình Hàng đơn vị (Số 9 -> 0): Bắt đầu chạy ngay từ đầu
  const easedUnitsProgress = solveCubicBezier(
    NUMBERS_BEZIER_CURVE[0], NUMBERS_BEZIER_CURVE[1], NUMBERS_BEZIER_CURVE[2], NUMBERS_BEZIER_CURVE[3],
    rawNumbersProgress
  );

  // 2. Tiến trình Hàng chục (0 -> 1): Chờ Số 9 trượt qua tỷ lệ TENS_SLIDE_START_RATIO rồi mới trượt bứt tốc
  const rawTensProgress = rawNumbersProgress < TENS_SLIDE_START_RATIO
    ? 0
    : Math.min(1, (rawNumbersProgress - TENS_SLIDE_START_RATIO) / (1 - TENS_SLIDE_START_RATIO));

  const easedTensProgress = solveCubicBezier(
    NUMBERS_BEZIER_CURVE[0], NUMBERS_BEZIER_CURVE[1], NUMBERS_BEZIER_CURVE[2], NUMBERS_BEZIER_CURVE[3],
    rawTensProgress
  );

  // Tính toán nấc giật hiện tại của kim đồng hồ
  const maxClockSteps = CLOCK_START_MINUTES_BEFORE_10;
  const calculatedStep = isIntroFinished
    ? maxClockSteps
    : Math.floor(introElapsedSec * CLOCK_STEPS_PER_SEC);
  const currentStep = Math.min(maxClockSteps, calculatedStep);

  const introMinuteCount = (60 - CLOCK_START_MINUTES_BEFORE_10) + currentStep;
  const currentMinAngle = (introMinuteCount * 6 - 90) % 360;
  const currentHourAngle = ((9 + introMinuteCount / 60) * 30 - 90) % 360;

  return (
    <div className="absolute bottom-0 right-0 md:left-auto md:top-0 md:right-0 h-[43dvh] sm:h-[52dvh] md:h-full w-[100vw] sm:w-[100vw] md:w-auto pointer-events-none z-0 opacity-100 select-none overflow-visible md:overflow-hidden flex items-end justify-end">
      <div ref={masterClockRef} className="relative h-full aspect-[1440/810] flex items-end justify-end overflow-visible">
        {/* Layer 1: Nền SVG Clock chính */}
        <NextImage
          src="/clock.svg"
          alt="Clock Graphic Base"
          width={1440}
          height={810}
          className="w-full h-full object-contain object-right-bottom relative z-1"
          priority
        />

        {/* Layer 0.5: Thẻ đếm ngược màu trắng */}
        <CountdownCard
          showCard={SHOW_CLOCK_COUNTDOWN_CARD}
          title={CLOCK_COUNTDOWN_TITLE}
          x={CLOCK_COUNTDOWN_X}
          y={CLOCK_COUNTDOWN_Y}
          scale={CLOCK_COUNTDOWN_SCALE}
          rotation={CLOCK_COUNTDOWN_ROTATION}
          masterClockRef={masterClockRef}
        />

        {/* Layer 2: Bánh răng phụ 1 (Bên phải) */}
        <div className="absolute top-[80%] left-[93%] -translate-x-1/2 -translate-y-1/2 w-[30%] opacity-80 rotate-10 z-1">
          <ClockGears speed={5} reverse className="w-full h-auto" />
        </div>

        {/* Layer 2: Bánh răng phụ 2 (Bên phải) */}
        <div className="absolute top-[73%] left-[95%] -translate-x-1/2 -translate-y-1/2 w-[25%] opacity-40 rotate-280 z-1">
          <ClockGears speed={10} className="w-full h-auto" />
        </div>

        {/* Layer 2: Ngôi sao riêng biệt */}
        <svg
          viewBox="0 0 1440 810"
          className="absolute inset-0 w-full h-full pointer-events-none z-2 select-none"
        >
          <defs>
            <linearGradient id="starBlueGradIsolated" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a086b" />
              <stop offset="20%" stopColor="#211cdb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <g id="star10ShapeIsolated">
              <polygon
                points="150,10 162.4,112.0 232.3,36.7 182.4,126.5 283.1,106.7 190,150 283.1,193.3 182.4,173.5 232.3,263.3 162.4,188.0 150,290 137.6,188.0 67.7,263.3 117.6,173.5 16.9,193.3 110,150 16.9,106.7 117.6,126.5 67.7,36.7 137.6,112.0"
                transform="translate(-150, -150)"
              />
            </g>
          </defs>
          <g transform="translate(1200, 405) scale(0.45)">
            <use href="#star10ShapeIsolated" fill="url(#starBlueGradIsolated)" />
          </g>
        </svg>

        {/* Layer 3: Đồng hồ 2 Kim xoay bên phải */}
        <div className="absolute top-[78.5%] left-[93.5%] -translate-x-1/2 -translate-y-1/2 w-[47%] aspect-square flex items-center justify-center pointer-events-auto flex z-3 rotate-[-5]">
          <GradientClock
            size="100%"
            showDialBackground={false}
            hourPivotX={7.7}
            hourPivotY={50}
            minPivotX={4.8}
            minPivotY={50}
            smooth={false}
            manualHourDeg={currentHourAngle}
            manualMinDeg={currentMinAngle}
            centerCapSize="3.8%"
            centerCapOffsetX={1}
            centerCapOffsetY={0}
            className="w-full h-full"
          />
        </div>

        {/* Layer 3: Overlay SVG Clock Layer 2 */}
        <div className="absolute inset-0 pointer-events-none z-3 flex justify-end items-end">
          <NextImage
            src="/clock-layer2.svg"
            alt="Clock Graphic Layer 2"
            width={1440}
            height={810}
            className="w-full h-full object-contain object-right-bottom"
            priority
          />
        </div>

        {/* Layer 4: Khối bánh răng chính bên trái */}
        <div className="absolute bottom-[-76%] left-[61%] -translate-x-1/2 -translate-y-1/2 w-[33%] pointer-events-none rotate-[-10deg] z-4">
          <ClockGears speed={12} className="w-full h-auto" />
        </div>

        {/* Layer 5: Đồng hồ 2 Kim xoay bên trái */}
        <div className="absolute top-[103.5%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[45%] aspect-square flex items-center justify-center pointer-events-auto flex z-5 rotate-96">
          <GradientClock
            size="100%"
            showDialBackground={false}
            hourPivotX={7.7}
            hourPivotY={50}
            minPivotX={4.8}
            minPivotY={50}
            smooth={false}
            manualHourDeg={currentHourAngle}
            manualMinDeg={currentMinAngle}
            centerCapSize="3.8%"
            centerCapOffsetX={-1}
            centerCapOffsetY={-1}
            className="w-full h-full"
          />
        </div>

        {/* Layer 4: Số 10 & 5 Ngôi sao xoay hiện ra */}
        <svg
          viewBox="0 0 1440 810"
          className="absolute inset-0 w-full h-full pointer-events-none z-4 select-none"
        >
          <defs>
            <linearGradient id="num10Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0e0baeff" />
              <stop offset="20%" stopColor="#211cdb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="starBlueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a086b" />
              <stop offset="20%" stopColor="#211cdb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <g id="star10Shape">
              <polygon
                points="150,10 162.4,112.0 232.3,36.7 182.4,126.5 283.1,106.7 190,150 283.1,193.3 182.4,173.5 232.3,263.3 162.4,188.0 150,290 137.6,188.0 67.7,263.3 117.6,173.5 16.9,193.3 110,150 16.9,106.7 117.6,126.5 67.7,36.7 137.6,112.0"
                transform="translate(-150, -150)"
              />
            </g>

            <clipPath id="numberReelWindow">
              <rect x="500" y="0" width="600" height="740" />
            </clipPath>
          </defs>

          <g className="hidden md:inline" clipPath="url(#numberReelWindow)" fontFamily="Perandory" fontSize="480" fill="url(#num10Gradient)" dominantBaseline="central">
            {/* Hàng chục (x=730) */}
            <g transform={`translate(0, -${easedTensProgress * 9 * 360})`}>
              {[0, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((digit, idx) => {
                const yCurrent = (370 + idx * 360) - (easedTensProgress * 9 * 360);
                const dist = Math.abs(yCurrent - 370);
                const digitOpacity = Math.max(0, 1 - dist / REEL_FADE_DISTANCE);

                return (
                  <text
                    key={`tens-${idx}`}
                    x="730"
                    y={370 + idx * 360}
                    opacity={digitOpacity}
                    textAnchor="middle"
                  >
                    {digit}
                  </text>
                );
              })}
            </g>

            {/* Hàng đơn vị (x=940) */}
            <g transform={`translate(0, ${easedUnitsProgress * 360})`}>
              {(() => {
                const y9 = 370 + easedUnitsProgress * 360;
                const opacity9 = Math.max(0, 1 - Math.abs(y9 - 370) / REEL_FADE_DISTANCE);

                const y0 = (370 - 360) + easedUnitsProgress * 360;
                const opacity0 = Math.max(0, 1 - Math.abs(y0 - 370) / REEL_FADE_DISTANCE);

                return (
                  <>
                    <text x="940" y={370} opacity={opacity9} textAnchor="middle">
                      9
                    </text>
                    <text x="940" y={370 - 360} opacity={opacity0} textAnchor="middle">
                      0
                    </text>
                  </>
                );
              })()}
            </g>
          </g>

          {/* Bản tĩnh số 10 dành riêng cho Mobile (loại bỏ ghost 09) */}
          <g className="inline md:hidden" clipPath="url(#numberReelWindow)" fontFamily="Perandory" fontSize="480" fill="url(#num10Gradient)" dominantBaseline="central">
            <text x="730" y="370" textAnchor="middle">
              1
            </text>
            <text x="940" y="370" textAnchor="middle">
              0
            </text>
          </g>

          {/* ANIMATION 5 NGÔI SAO XUẤT HIỆN */}
          <g className="hidden md:inline">
            {STAR_ANIM_CONFIG.map((star) => {
              const activeDelay = star.delaySec;
              const ageSec = Math.max(0, introElapsedSec - activeDelay);
              const durationSec = Math.max(0.2, TOTAL_INTRO_DURATION_SEC - activeDelay);
              const starRawProgress = Math.min(1, ageSec / durationSec);

              const curve = star.bezierCurve ?? STAR_BEZIER_CURVE;
              const starEasedP = solveCubicBezier(curve[0], curve[1], curve[2], curve[3], starRawProgress);

              const starOpacity = starEasedP;
              const starScale = starEasedP * star.baseScale;
              const starRotation = (1 - starEasedP) * (star.turns * star.spinSpeed * 360) + star.endRotation;

              if (starOpacity <= 0) return null;

              return (
                <g
                  key={star.id}
                  transform={`translate(${star.x}, ${star.y}) scale(${starScale}) rotate(${starRotation})`}
                  opacity={starOpacity}
                >
                  <use href="#star10Shape" fill={star.fill} />
                </g>
              );
            })}
          </g>

          {/* Bản tĩnh 5 Ngôi sao dành riêng cho Mobile */}
          <g className="inline md:hidden">
            {STAR_ANIM_CONFIG.map((star) => (
              <g
                key={`m-${star.id}`}
                transform={`translate(${star.x}, ${star.y}) scale(${star.baseScale}) rotate(${star.endRotation})`}
              >
                <use href="#star10Shape" fill={star.fill} />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
