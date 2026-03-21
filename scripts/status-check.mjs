import fs from 'node:fs/promises';

const configUrl = new URL('../config.json', import.meta.url);
const statusUrl = new URL('../status.json', import.meta.url);

const fullConfig = JSON.parse(await fs.readFile(configUrl, 'utf-8'));
const config = fullConfig.status_checks || {};
const historyLength = Number(config.historyLength || 60);
const timeoutMs = Number(config.timeoutMs || 10000);
const concurrency = Math.max(1, Number(config.concurrency || 4));

let previous = null;
try {
    const raw = await fs.readFile(statusUrl, 'utf-8');
    previous = JSON.parse(raw);
} catch (error) {
    previous = null;
}

const timestamp = new Date().toISOString();

const checkTarget = async (target) => {
    const start = Date.now();
    let statusCode = null;
    let ok = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(target.url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
        });
        statusCode = response.status;
        ok = response.status >= 200 && response.status < 300;
    } catch (error) {
        ok = false;
    } finally {
        clearTimeout(timer);
    }
    const responseTime = Date.now() - start;
    const previousTarget = previous?.targets?.find((item) => item.id === target.id);
    const history = Array.isArray(previousTarget?.history) ? [...previousTarget.history] : [];
    history.push({ ok, statusCode, responseTime, timestamp });
    if (history.length > historyLength) {
        history.splice(0, history.length - historyLength);
    }
    return {
        ...target,
        status: ok ? 'ok' : 'error',
        statusCode,
        responseTime,
        history,
    };
};

const targets = Array.isArray(config.targets) ? config.targets : [];
const runWithConcurrency = async (items, limit, runner) => {
    if (items.length === 0) return [];
    const results = new Array(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(limit, items.length);
    const workers = Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
            const current = nextIndex;
            nextIndex += 1;
            results[current] = await runner(items[current]);
        }
    });
    await Promise.all(workers);
    return results;
};

const results = await runWithConcurrency(targets, concurrency, checkTarget);

const output = {
    generatedAt: timestamp,
    intervalSeconds: config.refreshIntervalSeconds || 60,
    historyLength,
    targets: results,
};

await fs.writeFile(statusUrl, JSON.stringify(output, null, 4) + '\n', 'utf-8');
