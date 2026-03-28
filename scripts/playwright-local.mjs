import { chromium } from 'playwright';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const headless = checkOnly || args.includes('--headless');
const targetUrl = args.find((arg) => !arg.startsWith('--')) || process.env.PLAYWRIGHT_URL || 'about:blank';

const main = async () => {
    const browser = await chromium.launch({ headless });
    const page = await browser.newPage();

    if (checkOnly) {
        try {
            if (targetUrl !== 'about:blank') {
                await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
            }
            console.log(`Playwright launched with bundled Chromium: ${targetUrl}`);
            await browser.close();
            return 0;
        } catch (error) {
            console.error(`Playwright launched, but failed to open ${targetUrl}: ${error.message}`);
            await browser.close();
            return 1;
        }
    }

    try {
        if (targetUrl !== 'about:blank') {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        }
        console.log(`Playwright launched with bundled Chromium: ${targetUrl}`);
    } catch (error) {
        console.error(`Playwright launched, but failed to open ${targetUrl}: ${error.message}`);
    }

    console.log('Close the browser window or press Ctrl+C to exit.');

    await new Promise((resolve) => {
        browser.on('disconnected', resolve);
        process.once('SIGINT', async () => {
            await browser.close();
            resolve();
        });
        process.once('SIGTERM', async () => {
            await browser.close();
            resolve();
        });
    });

    return 0;
};

const exitCode = await main();
if (exitCode !== 0) {
    process.exitCode = exitCode;
}
