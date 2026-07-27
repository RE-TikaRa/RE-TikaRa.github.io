export function safeParseObjectJSON<T extends Record<string, unknown>>(
  rawValue: string | null,
  fallback: T,
): T {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeExternalUrl(value: unknown): string {
  if (typeof value !== 'string') return '#';
  try {
    const url = new URL(value, window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return '#';
  } catch {
    return '#';
  }
}
