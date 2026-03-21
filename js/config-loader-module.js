(function () {
    const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '::']);
    const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/RE-TikaRa/RE-TikaRa.github.io/rss-data/config.json';
    const ROOT_CONFIG_URL = '/config.json';

    function isLocalHost() {
        return LOCAL_HOSTS.has(window.location.hostname);
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

    async function fetchConfigJSON() {
        if (isLocalHost()) {
            return fetchJSON(ROOT_CONFIG_URL);
        }

        try {
            return await fetchJSON(REMOTE_CONFIG_URL);
        } catch (error) {
            return fetchJSON(ROOT_CONFIG_URL);
        }
    }

    window.TikaConfigLoader = {
        fetchConfigJSON,
        isLocalHost,
        ROOT_CONFIG_URL,
        REMOTE_CONFIG_URL,
    };
})();
