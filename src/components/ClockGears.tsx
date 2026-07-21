'use client';

import React from 'react';
import GearBlock from './GearBlock';

interface ClockGearsProps {
  opacity?: number;
  rotate?: number;
  speed?: number;
  speed1?: number;
  speed2?: number;
  speed3?: number;
  reverse?: boolean;
  gearColor?: string;
  innerCircleColor?: string;
  centerRingStroke?: string;
  centerRingFill?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Clean Single-Layer ClockGears component wrapper around GearBlock.
 * Allows setting overall speed (e.g. speed={15}) or individual gear speeds (speed1, speed2, speed3).
 */
export default function ClockGears({
  opacity = 0.85,
  rotate = 0,
  speed = 10,
  speed1,
  speed2,
  speed3,
  reverse = false,
  gearColor = '#545fa9f4',
  innerCircleColor = 'rgba(58, 47, 104, 0.52)',
  centerRingStroke = '#29385263',
  centerRingFill = '#0000000c',
  className = '',
  style,
}: ClockGearsProps) {
  return (
    <GearBlock
      opacity={opacity}
      rotate={rotate}
      speed={speed}
      speed1={speed1}
      speed2={speed2}
      speed3={speed3}
      reverse={reverse}
      gearColor={gearColor}
      innerCircleColor={innerCircleColor}
      centerRingStroke={centerRingStroke}
      centerRingFill={centerRingFill}
      className={className}
      style={style}
    />
  );
}
