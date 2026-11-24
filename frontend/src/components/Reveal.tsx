import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Fades and lifts its content into place the first time it scrolls into view.
 * Renders visible immediately where IntersectionObserver isn't available or motion is reduced.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  sx,
}: {
  children: ReactNode;
  /** Milliseconds before the animation starts (for staggering lists). */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  sx?: SxProps<Theme>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined' || prefersReducedMotion());

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Box
      ref={ref}
      sx={[
        {
          height: '100%',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : `translateY(${y}px)`,
          transition: `opacity .7s ease ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
          willChange: visible ? 'auto' : 'opacity, transform',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
