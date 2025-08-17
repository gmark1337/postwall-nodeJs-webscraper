import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {getNavigationLink, sleep, readJsonData} from './app.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';


import {config} from './configuration/config.js';

const __filename = fileURLToPath(import.meta.url);
puppeteer.use(StealthPlugin());

export async function main() {

    const market = config.supermarkets[3];
    //console.log(market);

    const browser = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH ||undefined,
        headless:true,
        defaultViewport:false,
    });

    const page = await browser.newPage();
  
    await page.setRequestInterception(true);
    page.on('request', req => {
        if(req.url().includes('cookie') || req.url().includes('consent')){
            req.abort();
        }else{
            req.continue();
        }   
    })


    const {isURLSame, url} = await getNavigationLink(page,market.websiteURL, market.siteSelectorTag, market.jsonDateName, market.outputDIR);

    const firstPageURL = await page.evaluate((selector) => {
        const imagedata = document.querySelector(selector);
        return imagedata.src
    }, market.firstPageSelectorTag)

    //console.log(firstPageURL);

    let file = await readJsonData(market.jsonDateName);
    const actualDate = file.split("/")[5];
    
    if(!isURLSame){
        
        await page.goto(url, {waitUntil:"networkidle2"} );
        await sleep(4000);

        
        await page.waitForSelector(market.waitForSelectorTag, {timeout: 5000});
        await page.click(market.clickToDownloadTag);


        await page.waitForSelector(market.downloadSelectorTag, {timeout: 5000});
        await page.click(market.downloadImageTag);
        const pdfURL = await page.$eval(market.downloadImageTag, el => el.href);
        console.log("PDF URL:", pdfURL);


        const pennyJsonImages=  ({
            SupermarketId: "3",
            ActualDate: actualDate,
            FirstPageURL: firstPageURL,
            URL: pdfURL
        });

        //console.log(pennyJsonImages);

         await fs.writeFileSync(market.imagePath, JSON.stringify(pennyJsonImages, null, 2), 'utf-8');
    }else{
        console.log("Penny website is already fetched!");
    };
    await browser.close();
};
//await main();