(() => {
    if (window.TikaAccessGuardState?.blocked) return;

    const statusGrid = document.getElementById('status-grid');
    const okCountEl = document.getElementById('status-ok-count');
    const badCountEl = document.getElementById('status-bad-count');
    const unknownCountEl = document.getElementById('status-unknown-count');
    const updatedEl = document.getElementById('status-updated');
    const ageEl = document.getElementById('status-age');
    const nextEl = document.getElementById('status-next');
    const overallEl = document.getElementById('status-overall');

    const STATUS_URL = '../status.json';
    const isLocal = typeof window.TikaConfigLoader?.isLocalHost === 'function'
        ? window.TikaConfigLoader.isLocalHost()
        : false;

    let cachedConfig = null;

    let refreshInterval = 60;
    let nextTick = refreshInterval;
    let lastGeneratedAt = null;
    let statusTimer = null;
    let currentIntervalSeconds = null;

    const resetStatusTimer = (seconds) => {
        const value = Number(seconds);
        if (!Number.isFinite(value) || value <= 0) return;
        if (currentIntervalSeconds === value && statusTimer) return;
        currentIntervalSeconds = value;
        if (statusTimer) window.clearInterval(statusTimer);
        statusTimer = window.setInterval(loadStatus, currentIntervalSeconds * 1000);
    };

    const formatNumber = (value) => (typeof value === 'number' ? value.toLocaleString() : '--');

    const normalizeExternalUrl = typeof window.TikaShared?.normalizeExternalUrl === 'function'
        ? window.TikaShared.normalizeExternalUrl
        : (value) => {
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
        };

    const buildMetric = (label, value) => {
        const metric = document.createElement('div');
        metric.className = 'status-metric';

        const labelEl = document.createElement('span');
        labelEl.className = 'status-metric-label';
        labelEl.textContent = label;

        const valueEl = document.createElement('span');
        valueEl.className = 'status-metric-value';
        valueEl.textContent = value;

        metric.appendChild(labelEl);
        metric.appendChild(valueEl);
        return metric;
    };

    const formatTimestamp = (iso) => {
        if (!iso) return '更新中...';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '更新中...';
        return `更新于 ${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    };

    const updateAge = () => {
        if (!ageEl) return;
        if (!lastGeneratedAt) {
            ageEl.textContent = '距上次更新 -- 分钟';
            ageEl.className = 'status-pill status-age';
            return;
        }
        const now = Date.now();
        const last = new Date(lastGeneratedAt).getTime();
        if (Number.isNaN(last)) {
            ageEl.textContent = '距上次更新 -- 分钟';
            ageEl.className = 'status-pill status-age';
            return;
        }
        const minutes = Math.max(0, Math.floor((now - last) / 60000));
        ageEl.textContent = `距上次更新 ${formatNumber(minutes)} 分钟`;
        if (minutes <= 30) {
            ageEl.className = 'status-pill status-age is-ok';
        } else if (minutes <= 60) {
            ageEl.className = 'status-pill status-age is-warn';
        } else {
            ageEl.className = 'status-pill status-age is-bad';
        }
    };

    const buildHistoryBars = (history, total) => {
        const bars = document.createElement('div');
        bars.className = 'status-history';
        const items = Array.isArray(history) && history.length ? history.slice(-total) : [];
        const missing = total - items.length;
        for (let i = 0; i < missing; i++) {
            const bar = document.createElement('span');
            bar.className = 'status-bar is-empty';
            bars.appendChild(bar);
        }
        items.forEach((item) => {
            const bar = document.createElement('span');
            if (item && item.ok === true) {
                bar.className = 'status-bar is-ok';
            } else if (item && item.ok === false) {
                bar.className = 'status-bar is-bad';
            } else {
                bar.className = 'status-bar is-empty';
            }
            bars.appendChild(bar);
        });
        return bars;
    };

    const renderStatus = (payload) => {
        if (!payload || !Array.isArray(payload.targets)) return;

        refreshInterval = Number(payload.intervalSeconds || payload.refreshIntervalSeconds || 60);
        nextTick = refreshInterval;
        if (nextEl) nextEl.textContent = `下次刷新 ${formatNumber(nextTick)}s`;
        lastGeneratedAt = payload.generatedAt || null;
        if (updatedEl) updatedEl.textContent = formatTimestamp(payload.generatedAt);
        updateAge();
        resetStatusTimer(refreshInterval);

        let okCount = 0;
        let badCount = 0;
        let unknownCount = 0;

        if (statusGrid) statusGrid.innerHTML = '';

        payload.targets.forEach((target, index) => {
            const isOk = target.status === 'ok';
            const isBad = target.status === 'error';
            const statusText = isOk ? '正常' : isBad ? '异常' : '未知';

            if (isOk) okCount += 1;
            else if (isBad) badCount += 1;
            else unknownCount += 1;

            const card = document.createElement('article');
            card.className = `card glass status-card ${isOk ? 'is-ok' : isBad ? 'is-bad' : 'is-unknown'}`;
            card.style.setProperty('--stagger', String(index));

            const header = document.createElement('div');
            header.className = 'status-card-head';

            const nameWrap = document.createElement('div');
            nameWrap.className = 'status-card-name-wrap';

            const nameEl = document.createElement('a');
            nameEl.className = 'status-card-name';
            nameEl.href = normalizeExternalUrl(target?.url);
            nameEl.target = '_blank';
            nameEl.rel = 'noopener noreferrer';
            nameEl.textContent = target.name || target.id || '未知目标';
            nameEl.style.textDecoration = 'none';
            nameEl.style.color = 'inherit';

            nameWrap.appendChild(nameEl);

            const stateEl = document.createElement('div');
            stateEl.className = `status-state ${isOk ? 'is-ok' : isBad ? 'is-bad' : 'is-unknown'}`;
            stateEl.textContent = statusText;

            const rightWrap = document.createElement('div');
            rightWrap.className = 'status-card-actions';
            rightWrap.appendChild(stateEl);

            header.appendChild(nameWrap);
            header.appendChild(rightWrap);

            const metrics = document.createElement('div');
            metrics.className = 'status-card-metrics';

            const timeItem = buildMetric('响应', `${formatNumber(target.responseTime)} ms`);
            const codeItem = buildMetric('状态', String(target.statusCode ?? '--'));

            metrics.appendChild(timeItem);
            metrics.appendChild(codeItem);

            const history = buildHistoryBars(target.history, payload.historyLength || 60);

            card.appendChild(header);
            card.appendChild(metrics);
            card.appendChild(history);

            if (statusGrid) statusGrid.appendChild(card);
        });

        if (okCountEl) okCountEl.textContent = `${formatNumber(okCount)} 正常`;
        if (badCountEl) badCountEl.textContent = `${formatNumber(badCount)} 异常`;
        if (unknownCountEl) unknownCountEl.textContent = `${formatNumber(unknownCount)} 未知`;

        if (overallEl) {
            if (badCount > 0) {
                overallEl.textContent = 'ISSUES';
                overallEl.className = 'status-overall status-bad';
            } else if (okCount > 0 && badCount === 0) {
                overallEl.textContent = 'OPERATIONAL';
                overallEl.className = 'status-overall status-ok';
            } else {
                overallEl.textContent = 'CHECKING';
                overallEl.className = 'status-overall status-unknown';
            }
        }
    };

    const buildFromConfig = (config) => ({
        generatedAt: '',
        intervalSeconds: config.refreshIntervalSeconds || 60,
        historyLength: config.historyLength || 60,
        targets: Array.isArray(config.targets)
            ? config.targets.map((target) => ({
                ...target,
                status: 'unknown',
                statusCode: null,
                responseTime: null,
                history: [],
            }))
            : [],
    });

    const loadConfig = async () => {
        if (cachedConfig) return cachedConfig;
        try {
            const loader = window.TikaConfigLoader?.fetchConfigJSON;
            if (typeof loader !== 'function') throw new Error('config loader unavailable');
            cachedConfig = await loader();
            return cachedConfig;
        } catch (error) {
            return null;
        }
    };

    const loadStatus = async () => {
        const fullConfig = await loadConfig();
        const config = fullConfig?.status_checks || {};

        const dataUrl = config?.dataUrl ? String(config.dataUrl).trim() : '';
        const statusUrl = isLocal || !dataUrl ? STATUS_URL : dataUrl;

        try {
            const res = await fetch(`${statusUrl}${statusUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('status.json not ready');
            const data = await res.json();
            renderStatus(data);
        } catch (error) {
            if (config && Array.isArray(config.targets)) {
                renderStatus(buildFromConfig(config));
            } else if (updatedEl) {
                updatedEl.textContent = '等待首次检测...';
            }
        }
    };

    const tickCountdown = () => {
        nextTick = Math.max(0, nextTick - 1);
        if (nextEl) nextEl.textContent = `下次刷新 ${formatNumber(nextTick)}s`;
        if (nextTick <= 0) nextTick = refreshInterval;
        updateAge();
    };

    loadStatus().then(() => {
        if (!statusTimer) resetStatusTimer(refreshInterval);
    });
    window.setInterval(tickCountdown, 1000);
})();
