import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Page-wide inertial ("smooth") scrolling via Lenis.
 * One instance for the whole app; helpers below fall back to native scrolling when it isn't running.
 */
let lenis: Lenis | null = null;

/** Elements that keep their own native wheel/touch scrolling. */
const NATIVE_SCROLL_SELECTOR = [
  '.MuiModal-root', // dialogs, menus, drawers, select popovers
  '.MuiPopover-root',
  '.leaflet-container', // maps zoom with the wheel
  '[data-lenis-prevent]',
].join(',');

export function startSmoothScroll(): () => void {
  if (lenis) return () => {};
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.09, // lower = floatier
    wheelMultiplier: 0.9,
    smoothWheel: true,
    allowNestedScroll: true,
    prevent: (node) => !!node.closest?.(NATIVE_SCROLL_SELECTOR),
  });
  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

/** Scroll to the top of the page (instantly by default, e.g. on route change). */
export function scrollToTop(smooth = false) {
  if (lenis) lenis.scrollTo(0, { immediate: !smooth, force: true });
  else window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

/**
 * Smoothly bring an element into view. Room for the sticky header comes from the
 * element's own `scroll-margin-top`, which both Lenis and the native fallback honour.
 */
export function scrollToElement(el: HTMLElement | null, offset = 0) {
  if (!el) return;
  if (lenis) {
    // Lenis clamps targets to the page height it last measured; after a route change from a
    // shorter page that value is stale, so re-measure before scrolling.
    lenis.resize();
    lenis.scrollTo(el, { offset, duration: 1.2 });
  }
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
