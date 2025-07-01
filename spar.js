import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {downloadOutputImages, fetchImages, getNavigationLink, denyCookie, sleep, readJsonData} from './index.js';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

puppeteer.use(StealthPlugin());

async function clickNextNumberNthTimes(frame, selector, numberOfClicks){
    for(let i = 0; i < numberOfClicks; i++){
        try {
            console.log(`Clicked the right button ${i+1} times`)
            await frame.waitForSelector(selector, { visible: true });
            await frame.click(selector);
            await sleep(1000);
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



(async () => {

    const sparUrl = 'https://www.spar.hu/ajanlatok';
    const sparSelector = '#filter-5aa56c5e30 > main > div > div.flyer-container.flyer-filter.ipaper-container > section:nth-child(4) > div > div.flyer-teaser__wrapper.ipaper-teaser__wrapper.flyer-teaser__wrapper--grouped';
    const sparJson = 'sparDate.json';
    const sparImages = './sparImages'

    const waitRightSelector = '#navToNext';
    const currentImage = '#img_1';



    
    
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
    const base = 'https://www.spar.hu';
    const{isURLsame, url} = await getNavigationLink(page, sparUrl, sparSelector, sparJson, sparImages);
    const fullURL = new URL(url, base).href;

    await page.goto(fullURL, {waitUntil: "networkidle2"});
    await sleep(2000);
    //await page.waitForSelector('#rightClickableBackground', { timeout: 5000 });
    //await page.waitForSelector('#navToNext', { timeout: 5000 });
    //await page.click('#navToNext');

    /* const frames = await page.frames();
    page.frames().forEach(f => console.log(f.url()));
    const flyerURL = frames[-1];

    console.log(flyerURL);

    if(flyerURL){
        console.log('Navigating to fyler:', flyerURL);
        await page.goto(flyerURL, {waitUntil: 'networkidle2'});
    }else{
        console.log('Flyer iframe not found!');
    } */

    await page.waitForSelector("iframe");

    /* const iframeSrc = await page.$eval("iframe[src*='szorolap.spar.hu']", el => el.src);
    console.log(iframeSrc)
    await page.goto(iframeSrc, {waitUntil: "networkidle2"});
    //await page.waitForNavigation("#navToNext");
    await page.click("#navToNext") */

    //await browser.close();

    const frameElement = await page.waitForSelector("iframe[src*='szorolap.spar.hu']");
    const frame = await frameElement.contentFrame();

    //const images = await fetchImages(frame, 'NULL', waitRightSelector, currentImage, null, null);

    /* for(var image in images){
        console.log(image);
    } */

    // #spread-5 
    /* try{
        const spreads = await page.evaluate('[id="spread-0"',elements => {
            return elements.map(el => el.innerText.trim());
        })

        console.log(spreads);
    }catch(err){
        console.log("Error occurred: ", err.message);
    }
    await browser.close() */

    await sleep(4000);

    let pageCounter = 1;

    const allImagesURL = [];


    while(true){
       
        const spreadSelector = '[id^=spread-]';
        const imagesURL = await frame.evaluate((selector) => {
            const spreads = Array.from(document.querySelectorAll(selector));
            return spreads.flatMap(div => {
                const imgs = div.querySelectorAll('img');
                return Array.from(imgs)
                .map(img => img.src)
                .filter(src => src);
            })
            .filter(src => src !== null);
        }, spreadSelector);
        console.log("Success saving the images");
        if(imagesURL.length ===0){
            console.log("No more images found. Stopping....");
            break;
        }
        allImagesURL.push(imagesURL);

        
        
        const reachedEnd = await clickNextNumberNthTimes(frame, waitRightSelector, 5);
        if(reachedEnd){
            console.log("No more pages to click.");
            break;
        }
    };
    const imagesFlated = allImagesURL.flat();

    for(let i = 0; i < imagesFlated.length; i++){
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
    } 

     

    await browser.close(); 
})();