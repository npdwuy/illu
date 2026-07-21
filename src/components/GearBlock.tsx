'use client';

import React from 'react';

interface GearBlockProps {
  /** Opacity level from 0 to 1 (e.g. 0.85) */
  opacity?: number;
  /** Static rotation angle for the entire block in degrees (default: 0) */
  rotate?: number;
  /** Base rotation duration/speed in seconds for the block (default: 10s) */
  speed?: number;
  /** Specific rotation speed in seconds for Gear 1 (Bottom Small Gear) */
  speed1?: number;
  /** Specific rotation speed in seconds for Gear 2 (Middle Large Gear) */
  speed2?: number;
  /** Specific rotation speed in seconds for Gear 3 (Top Left Gear) */
  speed3?: number;
  /** If true, reverses rotation direction for all gears (default: false) */
  reverse?: boolean;
  /** Primary color for gear body and teeth (default: "#525da8") */
  gearColor?: string;
  /** Color for inner filled circles (default: "#ffffff") */
  innerCircleColor?: string;
  /** Stroke color for center ring outlines (default: "#1e293b") */
  centerRingStroke?: string;
  /** Fill color for center hub circles (default: "#38bdf8") */
  centerRingFill?: string;
  /** CSS classes for positioning, sizing, z-index (e.g. "absolute top-10 right-10 w-64") */
  className?: string;
  /** Additional inline CSS styles */
  style?: React.CSSProperties;
}

/**
 * 1-Layer 3-Gear Block Component based strictly on the user's template SVG.
 * Supports individual gear speeds (`speed1`, `speed2`, `speed3`) or base `speed`,
 * rotation angle `rotate`, `reverse`, `opacity`, and custom colors.
 */
export default function GearBlock({
  opacity = 1.0,
  rotate = 0,
  speed = 10,
  speed1,
  speed2,
  speed3,
  reverse = false,
  gearColor = '#525da8',
  innerCircleColor = '#ffffff',
  centerRingStroke = '#1e293b',
  centerRingFill = '#38bdf8',
  className = '',
  style = {},
}: GearBlockProps) {
  // Compute individual gear speeds
  const dur1 = speed1 ?? Math.max(0.2, speed * 0.5);
  const dur2 = speed2 ?? Math.max(0.2, speed);
  const dur3 = speed3 ?? Math.max(0.2, speed * 1.0);

  // Exact rotation centers matching circle definitions
  const c1 = '446.39 943.12';
  const c2 = '637.25 611.26';
  const c3 = '230.003 381.364';

  // Rotation directions
  const g1From = reverse ? `360 ${c1}` : `0 ${c1}`;
  const g1To = reverse ? `0 ${c1}` : `360 ${c1}`;

  const g2From = reverse ? `0 ${c2}` : `360 ${c2}`;
  const g2To = reverse ? `360 ${c2}` : `0 ${c2}`;

  const g3From = reverse ? `360 ${c3}` : `0 ${c3}`;
  const g3To = reverse ? `0 ${c3}` : `360 ${c3}`;

  return (
    <div
      className={`pointer-events-none select-none overflow-visible ${className}`}
      style={{
        opacity,
        ...style,
      }}
    >
      <svg
        viewBox="-150 -150 1200 1500"
        className="w-full h-full object-contain overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={rotate ? `rotate(${rotate}, 450, 600)` : undefined}>
          {/* ==================== GEAR 1 (Bottom Small Gear) ==================== */}
          <g>
            <circle cx="446.39" cy="943.119" r="111.367" fill={gearColor} />
            <circle cx="446.39" cy="943.12" r="78.062" fill={innerCircleColor} />
            <circle
              cx="446.39"
              cy="943.12"
              r="30.407"
              fill={centerRingFill}
              stroke={centerRingStroke}
              strokeWidth="25"
              strokeMiterlimit="10"
            />
            <polygon fill={gearColor} points="395.559,862.793 450.224,848.169 422.359,801.246 396.271,808.225" />
            <polygon fill={gearColor} points="351.454,939.176 366.078,993.841 311.509,993.128 304.53,967.04" />
            <polygon fill={gearColor} points="497.173,1023.266 442.508,1037.89 470.372,1084.812 496.46,1077.834" />
            <polygon fill={gearColor} points="541.227,947.09 526.603,892.426 581.171,893.138 588.15,919.226" />
            <polygon fill={gearColor} points="353.681,922.188 381.993,873.194 329.11,859.718 315.599,883.099" />
            <polygon fill={gearColor} points="376.504,1007.387 425.498,1035.699 386.409,1073.781 363.027,1060.27" />
            <polygon fill={gearColor} points="539.003,963.808 510.69,1012.803 563.573,1026.279 577.085,1002.897" />
            <polygon fill={gearColor} points="516.29,878.792 467.296,850.479 506.386,812.397 529.767,825.909" />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={g1From}
              to={g1To}
              dur={`${dur1}s`}
              repeatCount="indefinite"
            />
          </g>

          {/* ==================== GEAR 2 (Middle Main Large Gear) ==================== */}
          <g>
            <circle cx="637.25" cy="611.257" r="221.065" fill={gearColor} />
            <circle cx="637.25" cy="611.258" r="170.05" fill={innerCircleColor} />
            <circle
              cx="637.25"
              cy="611.26"
              r="51.823"
              fill={centerRingFill}
              stroke={centerRingStroke}
              strokeWidth="40"
              strokeMiterlimit="10"
            />
            <polygon fill={gearColor} points="520.69,453.546 583.968,422.525 535.886,366.294 505.688,381.098" />
            <polygon fill={gearColor} points="448.518,664.54 479.539,727.817 407.091,742.819 392.287,712.622" />
            <polygon fill={gearColor} points="753.81,768.969 690.533,799.99 738.614,856.221 768.812,841.417" />
            <polygon fill={gearColor} points="825.982,557.975 794.962,494.698 867.409,479.696 882.214,509.893" />
            <polygon fill={gearColor} points="442.931,582.028 465.739,515.35 392.878,509.895 381.994,541.716" />
            <polygon fill={gearColor} points="541.343,782.769 608.021,805.577 567.709,866.515 535.888,855.63" />
            <polygon fill={gearColor} points="831.569,640.486 808.761,707.165 881.622,712.62 892.507,680.8" />
            <polygon fill={gearColor} points="733.158,439.747 666.479,416.938 706.792,356.001 738.612,366.886" />
            <polygon fill={gearColor} points="468.256,510.983 514.501,457.808 449.062,425.308 426.992,450.685" />
            <polygon fill={gearColor} points="483.8,734.007 536.976,780.252 476.678,821.516 451.301,799.446" />
            <polygon fill={gearColor} points="806.245,711.532 759.999,764.708 825.438,797.207 847.509,771.83" />
            <polygon fill={gearColor} points="790.7,488.508 737.525,442.263 797.823,401 823.2,423.069" />
            <polygon fill={gearColor} points="446.848,659.851 441.948,589.549 372.695,612.841 375.033,646.391" />
            <polygon fill={gearColor} points="615.542,806.56 685.843,801.66 672.383,873.475 638.834,875.813" />
            <polygon fill={gearColor} points="827.652,562.665 832.553,632.966 901.806,609.675 899.468,576.125" />
            <polygon fill={gearColor} points="658.959,415.956 588.658,420.855 602.117,349.041 635.667,346.702" />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={g2From}
              to={g2To}
              dur={`${dur2}s`}
              repeatCount="indefinite"
            />
          </g>

          {/* ==================== GEAR 3 (Top Left Gear) ==================== */}
          <g>
            <circle cx="230.003" cy="381.364" r="192.407" fill={gearColor} />
            <circle cx="230.003" cy="381.364" r="148.005" fill={innerCircleColor} />
            <polygon fill={gearColor} points="154.936,228.312 213.965,211.651 181.466,155.533 153.296,163.484" />
            <polygon fill={gearColor} points="60.29,397.402 76.952,456.431 12.123,458.071 4.172,429.901" />
            <polygon fill={gearColor} points="305.002,534.175 245.973,550.837 278.472,606.954 306.642,599.003" />
            <polygon fill={gearColor} points="399.476,365.394 382.814,306.365 447.643,304.725 455.594,332.895" />
            <polygon fill={gearColor} points="68.201,325.942 98.159,272.42 36.63,256.353 22.333,281.895" />
            <polygon fill={gearColor} points="121.06,513.208 174.581,543.166 130.534,589.034 104.992,574.737" />
            <polygon fill={gearColor} points="391.805,436.786 361.847,490.308 423.376,506.375 437.673,480.833" />
            <polygon fill={gearColor} points="338.946,249.521 285.425,219.562 329.472,173.694 355.014,187.991" />
            <polygon fill={gearColor} points="100.997,269.075 148.91,230.781 97.965,192.719 75.1,210.994" />
            <polygon fill={gearColor} points="79.42,462.457 117.714,510.37 59.633,536.267 41.358,513.402" />
            <polygon fill={gearColor} points="359.009,493.653 311.096,531.947 362.041,570.009 384.906,551.734" />
            <polygon fill={gearColor} points="380.586,300.271 342.292,252.358 400.373,226.461 418.648,249.326" />
            <polygon fill={gearColor} points="59.382,393.185 66.183,332.228 3.246,341.337 0,370.427" />
            <polygon fill={gearColor} points="180.866,545.184 241.824,551.985 219.066,611.367 189.976,608.121" />
            <polygon fill={gearColor} points="400.625,369.543 393.823,430.5 456.761,421.391 460.006,392.301" />
            <polygon fill={gearColor} points="279.14,217.544 218.182,210.743 240.939,151.361 270.03,154.607" />
            <circle
              cx="230.003"
              cy="381.364"
              r="44.931"
              fill={centerRingFill}
              stroke={centerRingStroke}
              strokeWidth="35"
              strokeMiterlimit="10"
            />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={g3From}
              to={g3To}
              dur={`${dur3}s`}
              repeatCount="indefinite"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
