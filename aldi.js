import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getNavigationLink, sleep, denyCookie } from './app.js';

import {config} from './configuration/config.js';

import fs from 'fs';
import { getMultipleImagesIntoArrays, isDisabledButtonActive } from './imageFetchLib.js';

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
        
        fetchedImages.push(await getMultipleImagesIntoArrays(page, market.currentImage)); 

        if(await isDisabledButtonActive(page, market.disabledClick) && pageIndex !== 1){
            console.log("The disabled button is active, breaking cycle...");
            break;
        }

        try{
            await page.click(market.clickNextSelectorTag);
            pageIndex++;
            await sleep(500);
        }catch(err){
            console.log("Sudden error  occurred: ", err.message);
            break;
        }
        }

        //fetchedImages.forEach(x => console.log(x));
        //const filteredImages = fetchedImages.flat().filter(page => !page.includes("data:image"));
        //console.log(filteredImages);
        const imagesFlatted = fetchedImages.flat().filter(page => !page.includes("data:image")).map((url, index) => ({
            pageIndex: index + 1,
            url
        }))

        const jsonImages = {
            actualDate: actualDate,
            serviceType: "saveToCloudFlare",
            pages: imagesFlatted
        };

        //jsonImages.pages = jsonImages.pages.filter((page) => !page.url.includes("data:image"));

        //console.log(jsonImages);

        await fs.writeFileSync(market.imagePath, JSON.stringify(jsonImages, null, 2), 'utf-8');
    }else{
        console.log("The images are already fetched!");
    }

    await browser.close();
}

//await main();