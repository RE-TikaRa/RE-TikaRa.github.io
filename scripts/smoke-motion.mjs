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
  // client:idle 岛(ThemeToggle/SettingsPanel)需等水合完成再交互
  await page.waitForTimeout(1200);

  const wireframeReady = await page.evaluate(() => {
    const c = document.getElementById('blueprint-wireframe-canvas');
    return c instanceof HTMLCanvasElement;
  });
  assert('3D 线框 canvas 就位', wireframeReady);

  const wireframeDrawn = await page.evaluate(() => {
    const c = document.getElementById('blueprint-wireframe-canvas');
    if (!(c instanceof HTMLCanvasElement)) return false;
    return c.width > 0 && c.height > 0;
  });
  assert('线框 canvas 已按 DPR 尺寸初始化', wireframeDrawn);

  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.click('#theme-toggle');
  await page.waitForTimeout(400);
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert('theme toggle 翻转 data-theme', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

  const hiddenBefore = await page.evaluate(() => document.getElementById('settings-panel')?.hidden);
  await page.click('#settings-toggle');
  await page.waitForTimeout(300);
  const hiddenAfter = await page.evaluate(() => document.getElementById('settings-panel')?.hidden);
  assert('设置面板可开合', hiddenBefore !== hiddenAfter, `hidden ${hiddenBefore} → ${hiddenAfter}`);

  await page.goto(`${BASE}/projects/`, { waitUntil: 'networkidle' });
  const projLoaded = await page.evaluate(() => document.body != null && !document.body.classList.contains('is-access-guard-blocked'));
  assert('项目页正常加载', projLoaded);

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
