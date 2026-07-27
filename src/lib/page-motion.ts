import { initAccessGuard } from './access-guard';
import { initMotion, motionLevel, registerTicker } from './motion';
import { gsap, ScrollTrigger } from './motion';
import { initWireframe } from './wireframe';

function readWireframeEnabled(): boolean {
  try {
    const raw = localStorage.getItem('visualSettings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.wireframe !== false;
  } catch {
    return true;
  }
}

function readScanlineEnabled(): boolean {
  try {
    const raw = localStorage.getItem('visualSettings');
    if (!raw) return false;
    return Boolean(JSON.parse(raw)?.scanline);
  } catch {
    return false;
  }
}

function initScanline(): void {
  const el = document.getElementById('grid-scanline');
  if (!el) return;
  const level = motionLevel();
  if (!readScanlineEnabled() || level !== 'full') {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  let y = 0;
  const speed = 0.6;
  registerTicker(() => {
    y += speed;
    if (y > window.innerHeight) y = -20;
    el.style.transform = `translateY(${y}px)`;
  });
}

function revealFrames(): void {
  const frames = gsap.utils.toArray<HTMLElement>('.blueprint-frame');
  if (frames.length === 0) return;

  const level = motionLevel();
  if (level === 'reduced') {
    gsap.set(frames, { clearProps: 'all' });
    return;
  }

  const drawIn = (targets: HTMLElement[]) => {
    if (level === 'lite') {
      gsap.fromTo(
        targets,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4, stagger: 0.06, ease: 'none' },
      );
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo(
      targets,
      { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
      {
        autoAlpha: 1,
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.7,
        stagger: 0.09,
        ease: 'power2.inOut',
      },
    );
    tl.fromTo(
      targets.map((f) => f.querySelector('.panel-body')).filter(Boolean) as HTMLElement[],
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.09, ease: 'power1.out' },
      '-=0.4',
    );
  };

  // 首屏面板直接入场,其余交给 ScrollTrigger.batch
  const vh = window.innerHeight;
  const firstScreen: HTMLElement[] = [];
  const rest: HTMLElement[] = [];
  frames.forEach((f) => {
    (f.getBoundingClientRect().top < vh ? firstScreen : rest).push(f);
  });

  if (firstScreen.length) drawIn(firstScreen);

  if (rest.length) {
    gsap.set(rest, { autoAlpha: 0 });
    ScrollTrigger.batch(rest, {
      start: 'top 85%',
      once: true,
      onEnter: (batch) => drawIn(batch as HTMLElement[]),
    });
  }
}

function initViewTransitions(): void {
  if (!document.startViewTransition) return;
  if (window.matchMedia('(max-width: 960px)').matches) return;

  const internalLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[href^="/"], a[href^="./"], a[href^="../"]',
  );

  internalLinks.forEach((link) => {
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.href.includes('#')) return;

    link.addEventListener('click', (e) => {
      const href = link.href;
      if (!href || href === window.location.href) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      document.startViewTransition(() => {
        window.location.href = url.href;
      });
    });
  });
}

export function initPageMotion(): void {
  const guard = initAccessGuard();
  if (guard.blocked) return;

  initMotion();

  if (readWireframeEnabled()) {
    initWireframe();
  }
  initScanline();

  revealFrames();
  initViewTransitions();
}
