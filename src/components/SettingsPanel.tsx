import { useEffect, useRef, useState } from 'react';
import { safeParseObjectJSON } from '../lib/shared';
import type { VisualSettings } from '../lib/theme';

const LITE_DEPENDENT: (keyof VisualSettings)[] = ['wireframe'];

function buildDefaults(): VisualSettings {
  const d: VisualSettings = {
    highContrast: false,
    liteMode: false,
    wireframe: true,
    musicAutoplay: true,
    playlistType: 'song',
  };
  const isMobile = window.matchMedia('(max-width: 960px)').matches;
  if (isMobile || document.body.classList.contains('status-page')) {
    d.wireframe = false;
  }
  return d;
}

function setWireframeVisibility(enabled: boolean): void {
  const canvas = document.getElementById('blueprint-wireframe-canvas') as HTMLElement | null;
  if (canvas) canvas.style.display = enabled ? '' : 'none';
}

function applyEffect(key: keyof VisualSettings, enabled: boolean): void {
  if (key === 'wireframe') setWireframeVisibility(enabled);
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<VisualSettings>({});
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.getAttribute('data-theme') === 'dark');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const defaults = buildDefaults();
    let raw: string | null = null;
    try {
      raw = localStorage.getItem('visualSettings');
    } catch {}
    const parsed = safeParseObjectJSON<VisualSettings>(raw, {});
    const merged = raw ? { ...defaults, ...parsed } : { ...defaults };
    setSettings(merged);

    const root = document.documentElement;
    if (merged.highContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    if (merged.liteMode) root.setAttribute('data-lite', 'true');
    else root.removeAttribute('data-lite');

    (['wireframe'] as const).forEach((key) => {
      const effective = merged.liteMode ? false : Boolean(merged[key]);
      applyEffect(key, effective);
    });
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const toggle = document.getElementById('settings-toggle');
      if (panelRef.current?.contains(e.target as Node) || toggle?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const toggle = document.getElementById('settings-toggle');
    const onToggle = () => setOpen((v) => !v);
    toggle?.addEventListener('click', onToggle);
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      toggle?.removeEventListener('click', onToggle);
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const toggle = document.getElementById('settings-toggle');
    toggle?.setAttribute('aria-expanded', String(open));
  }, [open]);

  useEffect(() => {
    const body = document.body;
    if (open) body.setAttribute('data-settings-open', '');
    else body.removeAttribute('data-settings-open');
    return () => body.removeAttribute('data-settings-open');
  }, [open]);

  const apply = <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('visualSettings', JSON.stringify(next));
      } catch {}
      const root = document.documentElement;
      if (key === 'highContrast') {
        if (value) root.setAttribute('data-contrast', 'high');
        else root.removeAttribute('data-contrast');
      }
      if (key === 'liteMode') {
        if (value) root.setAttribute('data-lite', 'true');
        else root.removeAttribute('data-lite');
        (['wireframe'] as const).forEach((k) => {
          const effective = next.liteMode ? false : Boolean(next[k]);
          applyEffect(k, effective);
        });
      }
      if (key === 'wireframe') {
        const effective = next.liteMode ? false : Boolean(value);
        applyEffect(key, effective);
      }
      if (key === 'playlistType' || key === 'musicAutoplay') {
        window.dispatchEvent(new CustomEvent('tika:music-settings-change', { detail: next }));
      }
      return next;
    });
  };

  const liteLocked = Boolean(settings.liteMode);
  const check = (key: keyof VisualSettings) => Boolean(settings[key]);
  const locked = (key: keyof VisualSettings) => liteLocked && LITE_DEPENDENT.includes(key);

  return (
    <div id="settings-overlay" hidden={!open}>
      <div id="settings-panel" ref={panelRef} className="blueprint-frame settings-modal">
        <div className="settings-header">
          <h3>显示设置</h3>
          <button id="settings-close" type="button" aria-label="关闭设置" onClick={() => setOpen(false)}>
            &times;
          </button>
        </div>
        <div className="settings-content">
          <div className="setting-item">
            <label htmlFor="toggle-theme-mode">深色模式</label>
            <input type="checkbox" id="toggle-theme-mode" className="toggle-switch" checked={isDark} onChange={() => document.getElementById('theme-toggle')?.click()} />
          </div>
          <div className="setting-item">
            <label htmlFor="toggle-high-contrast">高对比模式</label>
            <input type="checkbox" id="toggle-high-contrast" className="toggle-switch" checked={check('highContrast')} onChange={(e) => apply('highContrast', e.target.checked)} />
          </div>
          <div className="setting-item">
            <label htmlFor="toggle-lite-mode">轻量模式</label>
            <input type="checkbox" id="toggle-lite-mode" className="toggle-switch" checked={check('liteMode')} onChange={(e) => apply('liteMode', e.target.checked)} />
          </div>
          <div className={`setting-item${locked('wireframe') ? ' is-disabled' : ''}`}>
            <label htmlFor="toggle-wireframe">背景线框</label>
            <input type="checkbox" id="toggle-wireframe" className="toggle-switch" checked={check('wireframe')} disabled={locked('wireframe')} onChange={(e) => apply('wireframe', e.target.checked)} />
          </div>
          <div className="setting-item">
            <label htmlFor="toggle-autoplay">音乐自动播放</label>
            <input type="checkbox" id="toggle-autoplay" className="toggle-switch" checked={check('musicAutoplay')} onChange={(e) => apply('musicAutoplay', e.target.checked)} />
          </div>
          <div className="setting-item">
            <label htmlFor="toggle-playlist-type">播放列表</label>
            <select id="toggle-playlist-type" className="select-switch" value={settings.playlistType || 'song'} onChange={(e) => apply('playlistType', e.target.value as 'song' | 'album')}>
              <option value="song">单曲</option>
              <option value="album">专辑</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
