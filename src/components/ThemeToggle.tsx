import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme);
  } catch {}
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meting = document.querySelector('meting-js') as (HTMLElement & { aplayer?: { theme: (c: string, s: boolean) => void } }) | null;
  if (meting?.aplayer) {
    meting.aplayer.theme(theme === 'dark' ? '#222' : '#fff', true);
  }
}

function spawnRipple(x: number, y: number, theme: Theme): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ripple = document.createElement('span');
  ripple.className = 'theme-switch-ripple';
  if (theme === 'dark') ripple.classList.add('is-dark');
  ripple.style.setProperty('--tx', `${x}px`);
  ripple.style.setProperty('--ty', `${y}px`);
  const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  ripple.style.setProperty('--tr', `${Math.ceil(endRadius)}px`);
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState((document.documentElement.getAttribute('data-theme') as Theme) || 'light');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem('theme');
      } catch {}
      if (stored) return;
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    const rect = event.currentTarget.getBoundingClientRect();
    const hasPos = Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
    const x = hasPos ? event.clientX : rect.left + rect.width / 2;
    const y = hasPos ? event.clientY : rect.top + rect.height / 2;
    if (!isMobile) spawnRipple(x, y, next);

    const commit = () => {
      applyTheme(next);
      persistTheme(next);
      setThemeState(next);
    };

    const startVT = (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition;
    if (!startVT || isMobile) {
      commit();
      return;
    }
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = startVT.call(document, commit);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      });
    }
  };

  const isDark = theme === 'dark';
  return (
    <div className="theme-switch-wrapper">
      <button
        id="theme-toggle"
        type="button"
        aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        aria-pressed={isDark}
        onClick={handleClick}
      >
        <i className={isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'} aria-hidden="true"></i>
        <span className="theme-toggle-text">{isDark ? '深色' : '浅色'}</span>
      </button>
    </div>
  );
}
