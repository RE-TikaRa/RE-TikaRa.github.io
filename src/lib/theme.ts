import { safeParseObjectJSON } from './shared';

export interface VisualSettings {
  highContrast?: boolean;
  liteMode?: boolean;
  wireframe?: boolean;
  scanline?: boolean;
  musicAutoplay?: boolean;
  playlistType?: 'song' | 'album';
}

export function readVisualSettings(): VisualSettings {
  try {
    return safeParseObjectJSON<VisualSettings>(localStorage.getItem('visualSettings'), {});
  } catch {
    return {};
  }
}

export function writeVisualSettings(settings: VisualSettings): void {
  try {
    localStorage.setItem('visualSettings', JSON.stringify(settings));
  } catch {}
}

export function getTheme(): 'dark' | 'light' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {}
}

export function toggleTheme(): 'dark' | 'light' {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function applyVisualAttributes(settings: VisualSettings): void {
  const root = document.documentElement;
  if (settings.highContrast) root.setAttribute('data-contrast', 'high');
  else root.removeAttribute('data-contrast');
  if (settings.liteMode) root.setAttribute('data-lite', 'true');
  else root.removeAttribute('data-lite');
}
