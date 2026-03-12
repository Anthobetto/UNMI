import React, { useEffect, useRef, ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!cardRef.current) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = cardRef.current.getBoundingClientRect();
      
      // Coordenadas relativas a la tarjeta (esto soluciona el problema del scroll)
      const x = clientX - left;
      const y = clientY - top;
      
      cardRef.current.style.setProperty('--x', x.toFixed(2));
      cardRef.current.style.setProperty('--y', y.toFixed(2));
      cardRef.current.style.setProperty('--xp', (x / width).toFixed(2));
      cardRef.current.style.setProperty('--yp', (y / height).toFixed(2));
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) return '';
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles: any = {
      '--base': base,
      '--spread': spread,
      '--radius': '40', // 2.5rem = 40px
      '--border': '2',
      '--backdrop': 'rgba(255, 255, 255, 0.05)',
      '--size': '400', // Haz de luz más grande para que sea más visible
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 400) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 0) 100% 70% / 0.15), transparent 80%
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      border: 'var(--border-size) solid rgba(255, 255, 255, 0.1)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    };

    if (width !== undefined) baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) baseStyles.height = typeof height === 'number' ? `${height}px` : height;

    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: -2px;
      padding: 2px;
      border-radius: inherit;
      background: radial-gradient(
        200px 200px at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 0) 100% 70% / 0.6), transparent 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      z-index: 10;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-[2.5rem] 
          relative 
          flex flex-col
          shadow-2xl
          backdrop-blur-xl
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
};

export { GlowCard }
