import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export type MotionLevel = 'reduced' | 'lite' | 'full';

const mqReduced = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
const mqMobile = typeof window !== 'undefined'
  ? window.matchMedia('(max-width: 960px)')
  : null;

let lenis: Lenis | null = null;
let lenisTicker: ((time: number) => void) | null = null;
let initialized = false;

export function isMobile(): boolean {
  return mqMobile?.matches ?? false;
}

export function motionLevel(): MotionLevel {
  if (mqReduced?.matches) return 'reduced';
  if (document.documentElement.getAttribute('data-lite') === 'true') return 'lite';
  return 'full';
}

export function registerTicker(fn: (time: number) => void): () => void {
  gsap.ticker.add(fn);
  return () => gsap.ticker.remove(fn);
}

export function unregisterTicker(fn: (time: number) => void): void {
  gsap.ticker.remove(fn);
}

export function scrollTo(target: number | Element, options: Record<string, unknown> = {}): void {
  if (lenis) {
    lenis.scrollTo(target as never, options);
    return;
  }
  let top = 0;
  if (typeof target === 'number') top = target;
  else if (target instanceof Element) top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: 'smooth' });
}

function createLenis(): void {
  if (motionLevel() !== 'full' || isMobile()) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  lenisTicker = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTicker);
  gsap.ticker.lagSmoothing(0);
}

export function destroyLenis(): void {
  if (!lenis) return;
  if (lenisTicker) gsap.ticker.remove(lenisTicker);
  lenisTicker = null;
  lenis.destroy();
  lenis = null;
}

export function initMotion(): void {
  if (initialized) return;
  initialized = true;
  gsap.registerPlugin(ScrollTrigger);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gsap.ticker.sleep();
    else gsap.ticker.wake();
  });
  createLenis();
}

export function getLenis(): Lenis | null {
  return lenis;
}

export { gsap, ScrollTrigger };
