import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getNavigationLink, sleep, denyCookie } from './app.js';

import {config} from './configuration/config.js';

import fs from 'fs';

puppeteer.use(StealthPlugin());

export async function main(){
    const market = config.supermarkets[5];
    //console.log(market);

    const browser = await puppeteer.launch({
        headless : true,
        defaultViewport: false
    });


    const page = await browser.newPage();


    const {isURLSame, url} = await getNavigationLink(page, market.websiteURL, market.siteSelectorTag, market.jsonDateName, market.outputDIR);
    console.log(isURLSame);

    if(!isURLSame){
    const actualDate = url.split('/')[3];
    console.log(actualDate);

    await page.goto(url);
    await denyCookie(page, market.cookieDenySelectorTag, market.denyCookieTag);

    const fetchedImages = [];
    let pageIndex = 1;
    
    while(true){
        await sleep(500);
        console.log(`Currently on page ${pageIndex}`)
        const fetchImagesResult = await page.evaluate((selector) => {
            const elements = Array.from(document.querySelectorAll(selector));

            return elements.flatMap(div => {
                const imgs = div.querySelectorAll('img');
                return Array.from(imgs)
                .map(img => img.src)
                .filter(src => src);
            }).filter(src => src !== null);
        },market.currentImage);
        //console.log(fetchImagesResult);

        if(fetchImagesResult){
            fetchedImages.push(fetchImagesResult)
        }

        const isDisabledButtonActive = await page.evaluate((selector) =>{
            const element = document.querySelector(selector);
            return element !== null;
        }, market.disabledClick);

        if(isDisabledButtonActive && pageIndex !== 1){
            console.log("The disabled button is active, breaking cycle...");
            break;
        }

        try{
            await page.click(market.clickNextSelectorTag);
            pageIndex++;
            await sleep(500);
        }catch(err){
            console.log("Sudden error  occured: ", err.message);
            break;
        }
        }
        const imagesFlatted = fetchedImages.flat().map((url, index) => ({
            pageIndex: index + 1,
            url
        }))

        const jsonImages = {
            actualDate: actualDate,
            serviceType: "saveToCloudFlare",
            pages: imagesFlatted
        };

        console.log(jsonImages);

        await fs.writeFileSync(market.imagePath, JSON.stringify(jsonImages, null, 2), 'utf-8');
    }else{
        console.log("The images are already fetched!");
    }

    await browser.close();
}

//await main();