import { useEffect, useRef, useState } from 'react';
import { safeParseObjectJSON } from '../lib/shared';
import type { VisualSettings } from '../lib/theme';

const LITE_DEPENDENT: (keyof VisualSettings)[] = ['starfield', 'shootingStars', 'raindrops', 'cardFloat'];

const EFFECT_CANVAS: Record<string, string[]> = {
  starfield: ['starfield-layer1', 'starfield-layer2', 'starfield-layer3'],
  shootingStars: ['shooting-star-canvas'],
  raindrops: ['raindrop-canvas'],
};

function buildDefaults(): VisualSettings {
  const d: VisualSettings = {
    highContrast: false,
    liteMode: false,
    starfield: true,
    shootingStars: true,
    raindrops: true,
    cardFloat: true,
    musicAutoplay: true,
    playlistType: 'song',
  };
  const isMobile = window.matchMedia('(max-width: 960px)').matches;
  if (isMobile) {
    d.starfield = false;
    d.shootingStars = false;
    d.raindrops = false;
    d.cardFloat = false;
  }
  const isStatus = document.body.classList.contains('status-page');
  if (isStatus) {
    d.shootingStars = false;
    d.raindrops = false;
    d.cardFloat = false;
  }
  return d;
}

function setEffectVisibility(key: string, enabled: boolean): void {
  (EFFECT_CANVAS[key] || []).forEach((id) => {
    const el = document.getElementById(id) as HTMLElement | null;
    if (el) el.hidden = !enabled;
  });
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<VisualSettings>({});
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

    Object.keys(EFFECT_CANVAS).forEach((key) => {
      const effective = merged.liteMode && LITE_DEPENDENT.includes(key as keyof VisualSettings)
        ? false
        : Boolean(merged[key as keyof VisualSettings]);
      setEffectVisibility(key, effective);
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
        Object.keys(EFFECT_CANVAS).forEach((k) => {
          const effective = next.liteMode && LITE_DEPENDENT.includes(k as keyof VisualSettings)
            ? false
            : Boolean(next[k as keyof VisualSettings]);
          setEffectVisibility(k, effective);
        });
      }
      if (key in EFFECT_CANVAS) {
        const effective = next.liteMode && LITE_DEPENDENT.includes(key)
          ? false
          : Boolean(value);
        setEffectVisibility(key as string, effective);
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
    <div id="settings-panel" ref={panelRef} className="card card--tertiary glass" hidden={!open}>
      <div className="settings-header">
        <h3>显示设置</h3>
        <button id="settings-close" type="button" aria-label="关闭设置" onClick={() => setOpen(false)}>
          &times;
        </button>
      </div>
      <div className="settings-content">
        <div className="setting-item">
          <label htmlFor="toggle-high-contrast">高对比模式</label>
          <input type="checkbox" id="toggle-high-contrast" className="toggle-switch" checked={check('highContrast')} onChange={(e) => apply('highContrast', e.target.checked)} />
        </div>
        <div className="setting-item">
          <label htmlFor="toggle-lite-mode">轻量模式</label>
          <input type="checkbox" id="toggle-lite-mode" className="toggle-switch" checked={check('liteMode')} onChange={(e) => apply('liteMode', e.target.checked)} />
        </div>
        <div className={`setting-item${locked('starfield') ? ' is-disabled' : ''}`}>
          <label htmlFor="toggle-starfield">星空背景</label>
          <input type="checkbox" id="toggle-starfield" className="toggle-switch" checked={check('starfield')} disabled={locked('starfield')} onChange={(e) => apply('starfield', e.target.checked)} />
        </div>
        <div className={`setting-item${locked('shootingStars') ? ' is-disabled' : ''}`}>
          <label htmlFor="toggle-shooting-stars">流星效果</label>
          <input type="checkbox" id="toggle-shooting-stars" className="toggle-switch" checked={check('shootingStars')} disabled={locked('shootingStars')} onChange={(e) => apply('shootingStars', e.target.checked)} />
        </div>
        <div className={`setting-item${locked('raindrops') ? ' is-disabled' : ''}`}>
          <label htmlFor="toggle-raindrops">雨滴效果</label>
          <input type="checkbox" id="toggle-raindrops" className="toggle-switch" checked={check('raindrops')} disabled={locked('raindrops')} onChange={(e) => apply('raindrops', e.target.checked)} />
        </div>
        <div className={`setting-item${locked('cardFloat') ? ' is-disabled' : ''}`}>
          <label htmlFor="toggle-card-float">卡片浮动</label>
          <input type="checkbox" id="toggle-card-float" className="toggle-switch" checked={check('cardFloat')} disabled={locked('cardFloat')} onChange={(e) => apply('cardFloat', e.target.checked)} />
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
  );
}
