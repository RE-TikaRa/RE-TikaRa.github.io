import fs from 'node:fs/promises';

const configUrl = new URL('../config.json', import.meta.url);
const statusUrl = new URL('../status.json', import.meta.url);

const fullConfig = JSON.parse(await fs.readFile(configUrl, 'utf-8'));
const config = fullConfig.status_checks || {};
const historyLength = Number(config.historyLength || 60);

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
    try {
        const response = await fetch(target.url, { method: 'GET', redirect: 'follow' });
        statusCode = response.status;
        ok = response.status >= 200 && response.status < 300;
    } catch (error) {
        ok = false;
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
const results = [];
for (const target of targets) {
    results.push(await checkTarget(target));
}

const output = {
    generatedAt: timestamp,
    intervalSeconds: config.refreshIntervalSeconds || 60,
    historyLength,
    targets: results,
};

await fs.writeFile(statusUrl, JSON.stringify(output, null, 4) + '\n', 'utf-8');
