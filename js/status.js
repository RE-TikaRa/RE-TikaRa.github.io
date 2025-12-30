(() => {
    const statusGrid = document.getElementById('status-grid');
    const okCountEl = document.getElementById('status-ok-count');
    const badCountEl = document.getElementById('status-bad-count');
    const unknownCountEl = document.getElementById('status-unknown-count');
    const updatedEl = document.getElementById('status-updated');
    const nextEl = document.getElementById('status-next');
    const overallEl = document.getElementById('status-overall');

    const STATUS_URL = 'status.json';
    const CONFIG_URL = 'status.config.json';

    let refreshInterval = 60;
    let nextTick = refreshInterval;

    const formatNumber = (value) => (typeof value === 'number' ? value.toLocaleString() : '--');

    const formatTimestamp = (iso) => {
        if (!iso) return '更新中...';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '更新中...';
        return `更新于 ${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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
        if (updatedEl) updatedEl.textContent = formatTimestamp(payload.generatedAt);

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

            const nameEl = document.createElement('div');
            nameEl.className = 'status-card-name';
            nameEl.textContent = target.name || target.id || '未知目标';

            const urlEl = document.createElement('div');
            urlEl.className = 'status-card-url';
            urlEl.textContent = target.url || '';

            nameWrap.appendChild(nameEl);
            nameWrap.appendChild(urlEl);

            const stateEl = document.createElement('div');
            stateEl.className = `status-state ${isOk ? 'is-ok' : isBad ? 'is-bad' : 'is-unknown'}`;
            stateEl.textContent = statusText;

            const openEl = document.createElement('a');
            openEl.className = 'status-card-link';
            openEl.href = target.url || '#';
            openEl.target = '_blank';
            openEl.rel = 'noopener noreferrer';
            openEl.title = '打开页面';
            openEl.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';

            const rightWrap = document.createElement('div');
            rightWrap.className = 'status-card-actions';
            rightWrap.appendChild(stateEl);
            rightWrap.appendChild(openEl);

            header.appendChild(nameWrap);
            header.appendChild(rightWrap);

            const metrics = document.createElement('div');
            metrics.className = 'status-card-metrics';

            const timeItem = document.createElement('div');
            timeItem.className = 'status-metric';
            timeItem.innerHTML = `<span class="status-metric-label">响应</span><span class="status-metric-value">${formatNumber(target.responseTime)} ms</span>`;

            const codeItem = document.createElement('div');
            codeItem.className = 'status-metric';
            codeItem.innerHTML = `<span class="status-metric-label">状态</span><span class="status-metric-value">${target.statusCode ?? '--'}</span>`;

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

    const loadStatus = async () => {
        try {
            const res = await fetch(STATUS_URL, { cache: 'no-store' });
            if (!res.ok) throw new Error('status.json not ready');
            const data = await res.json();
            renderStatus(data);
        } catch (error) {
            try {
                const res = await fetch(CONFIG_URL, { cache: 'no-store' });
                if (!res.ok) throw new Error('config not ready');
                const config = await res.json();
                renderStatus(buildFromConfig(config));
            } catch (fallbackError) {
                if (updatedEl) updatedEl.textContent = '等待首次检测...';
            }
        }
    };

    const tickCountdown = () => {
        nextTick = Math.max(0, nextTick - 1);
        if (nextEl) nextEl.textContent = `下次刷新 ${formatNumber(nextTick)}s`;
        if (nextTick <= 0) nextTick = refreshInterval;
    };

    loadStatus();
    window.setInterval(loadStatus, refreshInterval * 1000);
    window.setInterval(tickCountdown, 1000);
})();
