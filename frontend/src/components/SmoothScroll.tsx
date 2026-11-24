import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop, startSmoothScroll } from '../lib/smoothScroll';

/** Turns on inertial page scrolling and resets to the top when the route changes. */
export function SmoothScroll() {
  const { pathname } = useLocation();

  useEffect(() => startSmoothScroll(), []);

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
}
