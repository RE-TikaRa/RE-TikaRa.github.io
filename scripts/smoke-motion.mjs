import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:4321';

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const results = [];
  const assert = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
  };

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

  await page
    .waitForFunction(() => document.body.classList.contains('is-ready'), { timeout: 8000 })
    .catch(() => {});

  const hasReady = await page.evaluate(() => document.body.classList.contains('is-ready'));
  assert('body.is-ready 已设置', hasReady);

  // weather-card 数据 fetch 完成才整卡挂载(view 为 null 时 return null),
  // 晚于 setStagger 一次性执行,故排除;其余卡片首帧即在 DOM
  const staggerSet = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card:not(#weather-card)');
    if (cards.length === 0) return false;
    return Array.from(cards).every((c) => c.style.getPropertyValue('--stagger') !== '');
  });
  assert('静态卡片 --stagger 已设置', staggerSet);

  const cardsVisible = await page.evaluate(() => {
    const cards = document.querySelectorAll('.main-panel .card, .side-panel .card');
    if (cards.length === 0) return { ok: false, detail: '无卡片' };
    const hidden = Array.from(cards).filter((c) => parseFloat(getComputedStyle(c).opacity) < 0.01);
    return { ok: hidden.length === 0, detail: `${hidden.length}/${cards.length} 隐藏` };
  });
  assert('首屏卡片可见(opacity>0)', cardsVisible.ok, cardsVisible.detail);

  const canvasReady = await page.evaluate(() => {
    const ids = ['starfield-layer1', 'starfield-layer2', 'starfield-layer3', 'shooting-star-canvas', 'raindrop-canvas'];
    return ids.every((id) => document.getElementById(id) instanceof HTMLCanvasElement);
  });
  assert('五层粒子 canvas 就位', canvasReady);

  const welcomeHidden = await page.evaluate(() => {
    const w = document.getElementById('welcome-screen');
    return !w || w.classList.contains('hidden');
  });
  assert('welcome 打字机完成后隐藏', welcomeHidden);

  await page.goto(`${BASE}/projects/`, { waitUntil: 'networkidle' });
  await page
    .waitForFunction(() => document.body.classList.contains('is-ready'), { timeout: 4000 })
    .catch(() => {});
  const projReady = await page.evaluate(() => document.body.classList.contains('is-ready'));
  assert('项目页(无welcome)也设 is-ready', projReady);

  assert('无 console error', errors.length === 0, errors.slice(0, 5).join(' | '));

  await browser.close();

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) failed++;
    console.log(`[${mark}] ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log(`\n${results.length - failed}/${results.length} 通过`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
