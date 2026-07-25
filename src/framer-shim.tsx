'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const addFonts = (component: any, fonts: any) => component;

export const addPropertyControls = (component: any, controls: any) => component;

export const ControlType = {
  EventHandler: 'EventHandler',
  ResponsiveImage: 'ResponsiveImage',
  String: 'String',
  ChangeHandler: 'ChangeHandler',
};

export const cx = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const getLoadingLazyAtYPosition = (y?: number) => 'lazy';

export const useLocaleInfo = () => ({
  activeLocale: 'vi',
  setLocale: () => {},
});

export const useComponentViewport = () => ({
  x: 0,
  y: 0,
  width: '100%',
  height: '100%',
});

export const useVariantState = (options: any) => {
  const [gestureState, setGestureState] = useState({ isPressed: false });
  const [variant, setVariant] = useState(options?.defaultVariant || 'pN3gJKX5A');

  return {
    baseVariant: variant,
    classNames: '',
    clearLoadingGesture: () => {},
    gestureHandlers: {
      onMouseEnter: () => setVariant(`${variant}-hover`),
      onMouseLeave: () => setVariant(variant.replace('-hover', '')),
    },
    gestureVariant: variant,
    isLoading: false,
    setGestureState,
    setVariant,
    variants: {},
  };
};

export const useActiveVariantCallback = (baseVariant: any) => {
  return (callback: any) => async (...args: any[]) => {
    if (callback) return await callback(...args);
  };
};

export const withCSS = (component: any, css: any, className: string) => {
  if (typeof window !== 'undefined' && css) {
    const styleId = `framer-style-${className}`;
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = Array.isArray(css) ? css.join('\n') : css;
      document.head.appendChild(styleEl);
    }
  }
  return component;
};

export const Image = React.forwardRef(function ImageShim(props: any, ref: any) {
  const { background, className, style, children, onTap, lightbox, ...rest } = props;
  const src = background?.src || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80';

  return (
    <motion.div
      ref={ref}
      onClick={onTap}
      className={`group relative overflow-hidden bg-cover bg-center ${className || ''}`}
      style={{
        backgroundImage: `url(${src})`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

export const RichText = ({ text, style, className, children }: any) => {
  return (
    <div className={className} style={style}>
      {text || children}
    </div>
  );
};
