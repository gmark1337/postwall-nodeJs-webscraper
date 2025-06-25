import puppeteer from "puppeteer";
async function test() {
    const browser = await puppeteer.launch({
            headless : false,
            defaultViewport : false,
            userDataDir : './tmp1'
        });
    
         
        const page = await browser.newPage();
        await page.setViewport({
            width: 610,
            height: 840
        });

        await page.goto('https://www.lidl.hu/l/hu/ujsag/akcios-ujsag-24-het-2025/view/flyer/page/1?lf=HHZ');


        await page.waitForNetworkIdle(2000);
        const test = await page.evaluate(() => {
            const element = document.querySelector('li.page.page--current.page--current-1');
            if (!element){
                return null;
            }
            const img = element.querySelector('img');
            return img ? img.src : null;
        });
        console.log(test);
        //await browser.close();
}

test();