import { useEffect, useRef } from 'react';
import { fetchConfigJSON } from '../../lib/config';
import { readVisualSettings } from '../../lib/theme';

const APLAYER_CSS = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css';
const APLAYER_JS = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js';
const METING_JS = 'https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js';

let cdnPromise: Promise<void> | null = null;

function loadStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error(`load failed: ${src}`)));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error(`load failed: ${src}`)));
    document.body.appendChild(script);
  });
}

function ensureMusicCdn(): Promise<void> {
  if (cdnPromise) return cdnPromise;
  loadStylesheet(APLAYER_CSS);
  cdnPromise = loadScript(APLAYER_JS).then(() => loadScript(METING_JS));
  return cdnPromise;
}

interface AudioLike {
  paused: boolean;
  ended: boolean;
  currentTime: number;
  volume: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface APlayerLike {
  audio: AudioLike;
  theme: (color: string, force?: boolean) => void;
}

export default function MusicCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let pulseRafId: number | null = null;
    let pulseCleanup: (() => void) | null = null;
    let observer: MutationObserver | null = null;

    const stopPulse = () => {
      if (pulseRafId) {
        cancelAnimationFrame(pulseRafId);
        pulseRafId = null;
      }
      if (pulseCleanup) {
        pulseCleanup();
        pulseCleanup = null;
      }
      card.classList.remove('is-playing');
      card.style.setProperty('--music-beat', '0');
    };

    const attachPulse = (player: APlayerLike) => {
      stopPulse();
      if (!player || !player.audio) return;
      const audio = player.audio;
      const syncPlayingState = () => {
        const playing = !audio.paused && !audio.ended;
        card.classList.toggle('is-playing', playing);
        if (!playing) card.style.setProperty('--music-beat', '0');
      };
      const tick = () => {
        if (!card.isConnected) {
          stopPulse();
          return;
        }
        if (!audio.paused && !audio.ended) {
          const pulseA = (Math.sin(audio.currentTime * 5.8) + 1) * 0.5;
          const pulseB = (Math.sin(audio.currentTime * 11.2 + 0.9) + 1) * 0.5;
          const blend = pulseA * 0.62 + pulseB * 0.38;
          const beat = 0.09 + blend * (0.24 + audio.volume * 0.26);
          card.style.setProperty('--music-beat', beat.toFixed(3));
        } else {
          card.style.setProperty('--music-beat', '0');
        }
        pulseRafId = requestAnimationFrame(tick);
      };
      audio.addEventListener('play', syncPlayingState);
      audio.addEventListener('pause', syncPlayingState);
      audio.addEventListener('ended', syncPlayingState);
      audio.addEventListener('volumechange', syncPlayingState);
      pulseCleanup = () => {
        audio.removeEventListener('play', syncPlayingState);
        audio.removeEventListener('pause', syncPlayingState);
        audio.removeEventListener('ended', syncPlayingState);
        audio.removeEventListener('volumechange', syncPlayingState);
      };
      syncPlayingState();
      pulseRafId = requestAnimationFrame(tick);
    };

    const renderPlayer = async () => {
      stopPulse();
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      card.classList.remove('card--ghost');
      try {
        await ensureMusicCdn();
        const config = await fetchConfigJSON();
        const allItems = Array.isArray(config?.netease_music_items) ? config.netease_music_items : [];
        const visual = readVisualSettings();
        const playlistType = visual.playlistType || 'song';
        const filtered = allItems.filter((item) => item.type === playlistType);
        if (filtered.length === 0) {
          throw new Error(`未找到类型为 "${playlistType}" 的音乐项目`);
        }
        const item = filtered[Math.floor(Math.random() * filtered.length)];
        card.innerHTML = `
          <div class="card-header music-card-header">
            <div class="card-title">音乐</div>
            <div class="card-meta">网易云</div>
          </div>
          <div class="music-player-shell"></div>
        `;
        const meting = document.createElement('meting-js');
        meting.setAttribute('server', 'netease');
        meting.setAttribute('type', item.type);
        meting.setAttribute('id', item.id);
        meting.setAttribute('fixed', 'false');
        meting.setAttribute('autoplay', visual.musicAutoplay ? 'true' : 'false');
        meting.setAttribute('loop', 'all');
        meting.setAttribute('order', 'random');
        meting.setAttribute('preload', 'auto');
        meting.setAttribute('list-folded', 'true');
        const shell = card.querySelector('.music-player-shell');
        (shell || card).appendChild(meting);

        observer = new MutationObserver((_mutations, obs) => {
          const aplayer = meting.querySelector('.aplayer');
          if (aplayer) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const instance = (meting as unknown as { aplayer?: APlayerLike }).aplayer;
            if (instance) {
              instance.theme(currentTheme === 'dark' ? '#222' : '#fff', true);
              attachPulse(instance);
            }
            obs.disconnect();
          }
        });
        observer.observe(card, { childList: true, subtree: true });
      } catch (error) {
        console.error('初始化音乐播放器失败:', error);
        stopPulse();
        card.classList.remove('card--ghost');
        card.innerHTML = `
          <div class="music-player-container">
            <div class="music-header">
              <i class="fa-solid fa-music"></i>
              <span>音乐</span>
            </div>
            <div class="music-content">
              <span>播放器加载失败</span>
            </div>
          </div>
        `;
      }
    };

    renderPlayer();

    const onSettingsChange = () => renderPlayer();
    window.addEventListener('tika:music-settings-change', onSettingsChange);

    return () => {
      window.removeEventListener('tika:music-settings-change', onSettingsChange);
      if (observer) observer.disconnect();
      stopPulse();
    };
  }, []);

  return <div id="music-card" ref={cardRef} className="card card--tertiary glass tilt-card"></div>;
}
