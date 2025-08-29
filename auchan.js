import puppeteer, { ConsoleMessage } from 'puppeteer';
import {sleep, getNavigationLink, denyCookie} from './app.js';

import {config} from './configuration/config.js';
import fs from 'fs';
import { getFirstImageLink, getPdfURL } from './imageFetchLib.js';


//The cookie is embedded within the HTML, so it's easier to block it then accept it
async function denyCookieToAppear(page, sel){
    await page.evaluate((selector) => {
        const banner = document.querySelector(selector);
        if(banner){
            banner.remove();
        }
    }, sel);
}

export async function main() {
    const market = config.supermarkets[6];
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: false
    });


    const page = await browser.newPage();

    const {isURLSame, url}= await getNavigationLink(page, market.websiteURL, market.siteSelectorTag, market.jsonDateName, market.outputDIR);

    if(!isURLSame){
    await sleep(1000);
    const firstPageURL = await getFirstImageLink(page, market.firstPageURLSelectorTag);
    console.log(firstPageURL);
    
    //console.log(url);
    const actualDate = url.split('/')[2];
    //console.log(actualDate);
    await sleep(1000);
    const fullURL = new URL(url, market.baseURL).href;
    await page.goto(fullURL);
    await denyCookieToAppear(page, market.cookieDenySelectorTag);


    //Blocks annoying popup ads
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if(url.includes('popup') || url.includes('ads') || url.includes('tracking')){
            req.abort();
        }else{
            req.continue();
        }
    });

    const pdfURL = await getPdfURL(page, market.pdfSelectorTag);

    const jsonPDF = ({ 
        SupermarketId: "6",
        ActualDate: actualDate,
        FirstPageURL: firstPageURL,
        URL: pdfURL
    });

    await fs.writeFileSync(market.imagePath, JSON.stringify(jsonPDF, null, 2), 'utf-8');

    console.log(jsonPDF);

    }else{
        console.log("Auchan website is already fetched!");
    }
    
    await browser.close();
    
}

//await main();
