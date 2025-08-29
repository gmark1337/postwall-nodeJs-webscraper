import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {getNavigationLink, fetchImages, sleep} from './app.js'
import fs from 'fs';

import {config} from './configuration/config.js';
import { clickNextButtonNthTimes, getImageURL, getMultipleImagesIntoArrays, isDisabledButtonActive } from "./imageFetchLib.js";


puppeteer.use(StealthPlugin());

export async function main(){
    const market = config.supermarkets[4];

    const browser =  await puppeteer.launch({
      headless: true,
      defaultViewport: false 
    });

    const page = await browser.newPage()

    const {isURLSame, url} = await getNavigationLink(page,market.websiteURL, market.siteSelectorTag, market.jsonDateName, market.outputDIR);
    
    if(!isURLSame){

    const actualDate = url.split("/")[6];
    console.log(actualDate)

    await sleep(5);

    await page.setRequestInterception(true);
    page.on('request', req => {
        if(req.url().includes('cookie') || req.url().includes('consent')){
            req.abort();
        }else{
            req.continue();
        }   
    })

    await page.goto(url);
    await sleep(1500);
    let pageIndex = 1;

    const tempURLs = [];
    
    while(true){
            tempURLs.push(await getMultipleImagesIntoArrays(page, market.currentImage));

            await sleep(500);
        try{
            
            const isDisabled = await isDisabledButtonActive(page, market.disabledClick);
            //await page.click(market.clickNextSelectorTag);
            const reachedEnd = await clickNextButtonNthTimes(page, market.clickNextSelectorTag, 3, isDisabled);
            if(reachedEnd){
                console.log('No more pages!Breaking loop....');
                break;
            }
            pageIndex++;
            
            await sleep(500);
            
        }catch(err){
            console.log("Sudden error occurred: ", err.message);
            break;
        }
    }

    const imagesFlatted = tempURLs.flat().map((url, index) => [{
        pageIndex: index + 1,
        url
    }]);
    //imagesFlatted.forEach(x => console.log(x));
    const validation = /\.(\d+)\.jpeg/;
    const filtered = imagesFlatted.flat().filter((({pageIndex, url}) => {
        const match = url.match(validation)
        if(!match){
            return false;
        }
        const numberInMatch = parseInt(match[1],10);
        return pageIndex === numberInMatch;
    }));

    const imagesWithDate = {
        actualDate: actualDate,
        serviceType: "saveToCloudFlare",
        pages: filtered
    };

    await fs.writeFileSync(market.imagePath, JSON.stringify(imagesWithDate, null, 2), 'utf-8');
    }else{
        console.log("The images are already fetched!");
    }
    await browser.close();

}

//await main();