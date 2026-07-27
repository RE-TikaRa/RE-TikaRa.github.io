import { initAccessGuard } from './access-guard';
import { initMotion } from './motion';
import { initInteractiveEffects, type PageType } from './interactive-effects';

const WELCOME_TEXT = '正在唤醒情绪体接口…';
const WELCOME_TYPE_SPEED = 120;
const WELCOME_FADE_DELAY = 1000;

function resolvePageType(): PageType {
  return document.body.classList.contains('status-page') ? 'status' : 'home';
}

function setStagger(): void {
  document.querySelectorAll<HTMLElement>('.card').forEach((card, index) => {
    card.style.setProperty('--stagger', String(index));
  });
}

function markPageReady(): void {
  if (document.body.classList.contains('is-ready')) return;
  document.body.classList.add('is-ready');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('is-main-reveal');
    window.setTimeout(() => {
      document.body.classList.remove('is-main-reveal');
    }, 1300);
  }
  window.dispatchEvent(new Event('welcome-ready'));
}

function initWelcome(): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 960px)').matches;
  const isLiteMode = document.documentElement.getAttribute('data-lite') === 'true';

  const welcomeScreen = document.getElementById('welcome-screen');
  const welcomeTextEl = document.getElementById('welcome-text');
  if (!welcomeScreen || !welcomeTextEl) {
    markPageReady();
    return;
  }

  let charIndex = 0;
  const typeSpeed = isMobile ? Math.min(WELCOME_TYPE_SPEED, 70) : WELCOME_TYPE_SPEED;

  const finish = () => {
    welcomeScreen.classList.add('is-revealing-main');
    markPageReady();
    window.setTimeout(() => {
      welcomeScreen.style.transition = prefersReducedMotion || isMobile || isLiteMode ? 'none' : '';
      welcomeScreen.classList.add('hidden');
    }, prefersReducedMotion || isMobile || isLiteMode ? 0 : 60);
  };

  const typeChar = () => {
    if (charIndex < WELCOME_TEXT.length) {
      welcomeTextEl.textContent += WELCOME_TEXT.charAt(charIndex);
      charIndex++;
      window.setTimeout(typeChar, typeSpeed);
    } else {
      window.setTimeout(finish, isMobile ? 80 : WELCOME_FADE_DELAY);
    }
  };

  window.setTimeout(typeChar, isMobile ? 120 : 500);
}

function initScrollReveal(): void {
  if (window.matchMedia('(max-width: 960px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.body.classList.contains('is-ready')) {
    window.addEventListener('welcome-ready', initScrollReveal, { once: true });
    return;
  }

  const cards = document.querySelectorAll<HTMLElement>(
    '.side-panel .card, .hitokoto-panel .card, #latest-articles-card',
  );
  if (cards.length === 0) return;

  cards.forEach((card) => card.classList.add('scroll-reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
  );

  cards.forEach((card) => observer.observe(card));
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

  setStagger();
  initMotion();
  initWelcome();

  const isErrorPage = document.body.classList.contains('error-page');
  if (window.matchMedia('(min-width: 961px)').matches && !isErrorPage) {
    initInteractiveEffects(resolvePageType());
  }

  initViewTransitions();
  initScrollReveal();
}
