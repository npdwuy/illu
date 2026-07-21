'use client';

import React from 'react';

export interface Star10PointsProps {
  className?: string;
  gradientId?: string;
  fillColor?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export default function Star10Points({
  className = '',
  gradientId,
  fillColor = 'white',
  size = '100%',
  style,
}: Star10PointsProps) {
  // Use exact user-provided 10-pointed star polygon (300x300 viewBox, r1=140, r2=40)
  const polygonPoints = `
    150,10 162.4,112.0 232.3,36.7 182.4,126.5 283.1,106.7 
    190,150 283.1,193.3 182.4,173.5 232.3,263.3 162.4,188.0 
    150,290 137.6,188.0 67.7,263.3 117.6,173.5 16.9,193.3 
    110,150 16.9,106.7 117.6,126.5 67.7,36.7 137.6,112.0
  `;

  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        ...style,
      }}
    >
      {gradientId && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#211cdb" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0a086b" />
          </linearGradient>
        </defs>
      )}
      <polygon
        points={polygonPoints}
        fill={gradientId ? `url(#${gradientId})` : fillColor}
      />
    </svg>
  );
}
