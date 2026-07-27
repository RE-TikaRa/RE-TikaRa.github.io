import { gsap } from './motion';
import { motionLevel } from './motion';

const SESSION_KEY = 'tika-welcome-shown';

function finish(el: HTMLElement): void {
  el.remove();
  document.body.classList.remove('is-welcome-active');
}

export function playWelcome(): Promise<void> {
  const el = document.getElementById('welcome-screen');
  if (!el) return Promise.resolve();

  let seen = false;
  try {
    seen = sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {}

  if (seen || motionLevel() === 'reduced') {
    finish(el);
    return Promise.resolve();
  }

  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {}

  document.body.classList.add('is-welcome-active');

  const frame = el.querySelector('.welcome-mark__frame') as SVGRectElement | null;
  const axes = el.querySelectorAll('.welcome-mark__axis');
  const node = el.querySelector('.welcome-mark__node');
  const brand = el.querySelector('.welcome-brand');
  const line = el.querySelector('.welcome-line');
  const barFill = el.querySelector('#welcome-bar-fill');

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        finish(el);
        resolve();
      },
    });

    if (frame) {
      const len = frame.getTotalLength?.() ?? 700;
      gsap.set(frame, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(frame, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' });
    }
    tl.fromTo(axes, { autoAlpha: 0, scaleX: 0.6, scaleY: 0.6, transformOrigin: 'center' },
      { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.3');
    tl.fromTo(node, { scale: 0, transformOrigin: 'center' },
      { scale: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.15');
    tl.fromTo(brand, { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power1.out' }, '-=0.1');
    tl.fromTo(line, { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3, ease: 'none' }, '-=0.2');
    if (barFill) {
      tl.to(barFill, { width: '100%', duration: 0.6, ease: 'power1.inOut' }, '-=0.2');
    }
    tl.to(el, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, '+=0.15');
  });
}
