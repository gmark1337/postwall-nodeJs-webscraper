import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {getNavigationLink, sleep, downloadOutputImages} from './app.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

import {config} from './configuration/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



//NOTICE
//The website uses cloudflare to detect bot's and hides it's content to iframes
//The stealthPlugin module avoids the detection
//Then, I scrape the safe website which doesn't have that many protection 

//TODO
//
//optimize the clicking mechanism? 
puppeteer.use(StealthPlugin());

async function clickNextNumberNthTimes(frame, selector, numberOfClicks){
    for(let i = 0; i < numberOfClicks; i++){
        try {
            console.log(`Clicked the right button ${i+1} times`)
            await frame.waitForSelector(selector, { visible: true });
            await frame.click(selector);
            await sleep(650);
            if(await frame.$('nav.bookNavWrap.disabled')){
            console.log('Last page!');
            return true;
        }
        } catch (err) {
            console.log('No more pages!', err.message)
            return true
        };
    }
    return false;
}



export async function main(){


    const market = config.supermarkets[2];
    
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: false,
    })

    const page = await browser.newPage();

    //denies the cookie to appear on the screen
    await page.setRequestInterception(true);
    page.on('request', req => {
        if(req.url().includes('cookie') || req.url().includes('consent')){
            req.abort();
        }else{
            req.continue();
        }   
    })
    const base = market.baseURL;
    const{isURLSame, url} = await getNavigationLink(page, market.websiteURL, market.siteSelectorTag, market.jsonDateName, market.outputDIR);

    const actualDate = url.split('/')[3];
    const fullURL = new URL(url, base).href;
    //console.log(isURLSame);
    if(!isURLSame){
        await page.goto(fullURL, {waitUntil: "networkidle2"});
        await sleep(2000);

        await page.waitForSelector(market.iframeTag);

        const frameElement = await page.waitForSelector(market.iframeSelectorTag);
        const frame = await frameElement.contentFrame();

        await sleep(4000);

        let allImagesURL = [];


        while(true){
            const imagesURL = await frame.evaluate((selector) => {
                const spreads = Array.from(document.querySelectorAll(selector));
                return spreads.flatMap(div => {
                    const imgs = div.querySelectorAll('img');
                    return Array.from(imgs)
                    .map(img => img.src)
                    .filter(src => src);
                }).filter(src => src !== null);
            }, market.spreadSelectorTag);

            await sleep(100);
            //console.log("Found images:", imagesURL);
            console.log("Success saving the images");
            allImagesURL.push(imagesURL);

            const reachedEnd = await clickNextNumberNthTimes(frame, market.waitForSelectorTag, 5);
            
            if(reachedEnd){
                console.log("No more pages to click.");
                const finalImages = await frame.evaluate((selector) => {
                const spreads = Array.from(document.querySelectorAll(selector));
                return spreads.flatMap(div => {
                    const imgs = div.querySelectorAll('img');
                    return Array.from(imgs)
                        .map(img => img.src)
                        .filter(src => src);
                    }).filter(src => src !== null);
                }, market.spreadSelectorTag);
                //console.log("Final images found:", finalImages);
                allImagesURL.push(finalImages);
                break;
            }
            
            
        };
        const imagesFlated = allImagesURL.flat();
        const imagesWithIndex = imagesFlated.map((url, index) => ({
            pageIndex: index + 1,
            url
        }));

        //for(var images in allImagesURL){
        //    console.log(images)
            //await downloadImage(images, "test_file_name", './test_files');
        //}

        //await downloadOutputImages(imagesWithIndex, "./test_files");

        //imagesWithIndex.forEach(x => console.log(x));

        const jsonImages = {
            actualDate: actualDate,
            serviceType: "saveToCloudFlare",
            pages: imagesWithIndex
        };

        /* for(let i = 0; i < imagesFlated.length; i++){
                const url = imagesFlated[i];

                const response = await page.goto(url, {timeout: 15000, waitUntil: 'networkidle2'}).catch(() => null);
                if (!response || !response.ok()) {
                    console.log(`Failed to fetch image at ${url}`);
                    continue;
                }
                const buffer = await response.buffer();

                const filePath = `./sparImages/page-${i + 1}.jpg`;
                await fs.promises.writeFile(filePath, buffer);
                console.log(`Saved image ${i + 1} to ${filePath}`);
        } */

        //Forgot about my node-fetch library xD 

       /* const outputDir = path.join(__dirname, market.outputDir);
            if(!fs.existsSync(outputDir)){
                fs.mkdirSync(outputDir);
            }
        //await downloadOutputImages(imagesWithIndex, sparImages);*/
        await fs.writeFileSync(market.imagePath, JSON.stringify(jsonImages, null, 2), 'utf-8');

    } else{
        console.log("The images are already downloaded!")
    }

    await browser.close(); 
};


//await main();