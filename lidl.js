import puppeteer from 'puppeteer';
import {fetchImages, getNavigationLink,} from './app.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

import {config} from './configuration/config.js';

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);


//TODO
// 
//Better quality pictures?
//Optimize the clicking mechanism?(Save 2 at a time not one by one => see {'spar.js'})
export async function main () {
    console.log("Started scraping lidl website....")

    const market = config.supermarkets[1];
    //console.log(market);

    const browser = await puppeteer.launch({
        headless : true,
        defaultViewport : false,
        //userDataDir: './tmp'
    });

     
    const page = await browser.newPage();
    await page.setViewport({
        width: 610,
        height: 840
    });

    const {isURLSame, url} = await getNavigationLink(page,market.websiteURL, market.siteSelectorTag, market.jsonDateName,market.outputDIR);

    const actualDate = url.split("/")[6];
    console.log(actualDate);

    const jsonImages = [];


    if(!isURLSame){

    const images = await fetchImages(page, url,market.waitForSelectorTag, market.currentImage,market.cookieDenySelectorTag, market.denyCookieTag);

    
    //await downloadOutputImages(images, lidlImages);
    
    const imagesWithDate = {
        actualDate: actualDate,
        serviceType: "saveToDb",
        pages: images
    };
    //jsonImages.push(JSON.stringify(images));
    jsonImages.push(imagesWithDate);
    await fs.writeFileSync(market.imagePath, JSON.stringify(imagesWithDate, null, 2), 'utf-8');

    //jsonImages.forEach(x => console.log(x));
;
    }else{
        console.log('The images are already downloaded!');
    }
    console.log("Finished scraping lidl. Closing browser....");
    await browser.close();

}

//await main();