import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(stealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        slowMo: 100
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', req => {
        if (req.url().includes('cookie') || req.url().includes('consent')) {
            req.abort();
        } else {
            req.continue();
        }
    });


    await page.goto("https://bot.sannysoft.com");
    await page.screenshot({path: 'testresult.png',fullPage: true} );
    await browser.close();

})();