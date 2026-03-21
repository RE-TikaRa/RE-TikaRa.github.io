(function () {
    function safeParseObjectJSON(rawValue, fallback) {
        if (typeof rawValue !== 'string' || rawValue.trim() === '') return fallback;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    function normalizeExternalUrl(value) {
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

    window.TikaShared = window.TikaShared || {};
    window.TikaShared.safeParseObjectJSON = safeParseObjectJSON;
    window.TikaShared.normalizeExternalUrl = normalizeExternalUrl;

    let savedTheme = null;
    let visualSettings = {};
    try {
        savedTheme = localStorage.getItem('theme');
        visualSettings = safeParseObjectJSON(localStorage.getItem('visualSettings'), {});
    } catch {
        savedTheme = null;
        visualSettings = {};
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);

    if (visualSettings.highContrast) {
        document.documentElement.setAttribute('data-contrast', 'high');
    } else {
        document.documentElement.removeAttribute('data-contrast');
    }

    if (visualSettings.liteMode) {
        document.documentElement.setAttribute('data-lite', 'true');
    } else {
        document.documentElement.removeAttribute('data-lite');
    }
})();
