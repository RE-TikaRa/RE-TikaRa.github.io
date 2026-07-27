export interface MusicItem {
  id: string;
  type: 'song' | 'album';
}

export interface ArticleItem {
  title: string;
  link: string;
  date: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  link: string;
  tags: string[];
}

export interface StatusTarget {
  id: string;
  name: string;
  url: string;
}

export interface SiteConfig {
  netease_music_items: MusicItem[];
  rss: { url: string; max_items: number };
  latest_articles: ArticleItem[];
  projects: ProjectItem[];
  status_checks: {
    refreshIntervalSeconds: number;
    historyLength: number;
    dataUrl: string;
    targets: StatusTarget[];
  };
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '::']);
const REMOTE_CONFIG_URL =
  'https://raw.githubusercontent.com/RE-TikaRa/RE-TikaRa.github.io/rss-data/config.json';
const ROOT_CONFIG_URL = `${import.meta.env.BASE_URL}config.json`.replace(/\/{2,}/g, '/');

let cachedConfigPromise: Promise<SiteConfig> | null = null;

export function isLocalHost(): boolean {
  return LOCAL_HOSTS.has(window.location.hostname);
}

async function fetchJSON(url: string, withCacheBuster = true): Promise<SiteConfig> {
  const target = withCacheBuster
    ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
    : url;
  const response = await fetch(target, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`load failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as SiteConfig;
}

export async function fetchConfigJSON(
  options: { forceRefresh?: boolean } = {},
): Promise<SiteConfig> {
  const { forceRefresh = false } = options;
  if (!forceRefresh && cachedConfigPromise) {
    return cachedConfigPromise;
  }

  cachedConfigPromise = (async () => {
    if (isLocalHost()) {
      return fetchJSON(ROOT_CONFIG_URL);
    }
    try {
      return await fetchJSON(REMOTE_CONFIG_URL);
    } catch {
      return fetchJSON(ROOT_CONFIG_URL);
    }
  })();

  try {
    return await cachedConfigPromise;
  } catch (error) {
    cachedConfigPromise = null;
    throw error;
  }
}
