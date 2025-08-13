import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {getNavigationLink, fetchImages, sleep} from './app.js'
import fs from 'fs';

import {config} from './configuration/config.js';


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
        //await page.waitForSelector(market.clickNextSelectorTag);
        console.log(`Currently on page ${pageIndex}`)
        const images = await page.evaluate((image) => {
                    const element = document.querySelector(image);

                    if(!element){
                        return null;
                    }

                    const img = element.querySelector('img');
                    const result = img? img.src : 'NoImageFound';
                    return result;
            }, market.currentImage);

            if(images){
                tempURLs.push({pageIndex, url: images});
            }else{
                 console.log(`Image not found on ${pageIndex}. page.`);
            }

            const isDisabledAlive = await page.evaluate((selector) => {
                const el = document.querySelector(selector);
                return el !== null;
                }, market.disabledClick);
            if(isDisabledAlive){
                console.log('No more pages!');
                break;
            }
        try{
            

            await page.click(market.clickNextSelectorTag);
            pageIndex++;
            
            await sleep(200);
            
        }catch(err){
            console.log("Sudden error occurred: ", err.message);
            break;
        }
    }

    const imagesWithDate = {
        actualDate: actualDate,
        serviceType: "saveToCloudFlare",
        pages: tempURLs
    };

    console.log(imagesWithDate);

    await fs.writeFileSync(market.imagePath, JSON.stringify(imagesWithDate, null, 2), 'utf-8');
    }else{
        console.log("The images are already fetched!");
    }
    await browser.close();

}

//await main();