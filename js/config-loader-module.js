(function () {
    const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '::']);
    const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/RE-TikaRa/RE-TikaRa.github.io/rss-data/config.json';
    const SITE_BASE_URL = (() => {
        const currentScriptSrc = document.currentScript?.src;
        if (typeof currentScriptSrc === 'string' && currentScriptSrc) {
            return new URL('../', currentScriptSrc);
        }

        const pathName = window.location.pathname || '/';
        if (/\/(?:ProjectList|status|maintenance)(?:\/index\.html)?\/?$/u.test(pathName)) {
            return new URL('../', window.location.href);
        }
        return new URL('./', window.location.href);
    })();
    const ROOT_CONFIG_URL = new URL('config.json', SITE_BASE_URL).href;
    let cachedConfigPromise = null;

    function isLocalHost() {
        return LOCAL_HOSTS.has(window.location.hostname);
    }

    function getSiteUrl(path = '') {
        const normalizedPath = typeof path === 'string' ? path.replace(/^\/+/, '') : '';
        return new URL(normalizedPath, SITE_BASE_URL).href;
    }

    async function fetchJSON(url, options = {}) {
        const { withCacheBuster = true } = options;
        const target = withCacheBuster
            ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
            : url;
        const response = await fetch(target, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`load failed: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error(`JSON 解析失败: ${error.message}`);
        }
    }

    async function fetchConfigJSON(options = {}) {
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
            } catch (error) {
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

    window.TikaConfigLoader = {
        fetchConfigJSON,
        isLocalHost,
        getSiteUrl,
        ROOT_CONFIG_URL,
        REMOTE_CONFIG_URL,
        SITE_BASE_URL: SITE_BASE_URL.href,
    };
})();
