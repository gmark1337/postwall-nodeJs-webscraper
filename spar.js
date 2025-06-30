import puppeteer from 'puppeteer';
import {downloadOutputImages, fetchImages, getNavigationLink, denyCookie, sleep, readJsonData} from './index.js';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);




(async () => {

    const sparUrl = 'https://www.spar.hu/ajanlatok';
    const sparSelector = '#filter-5aa56c5e30 > main > div > div.flyer-container.flyer-filter.ipaper-container > section:nth-child(4) > div > div.flyer-teaser__wrapper.ipaper-teaser__wrapper.flyer-teaser__wrapper--grouped';
    const sparJson = 'sparDate.json';
    const sparImages = './sparImages'

    const waitRightSelector = '#navToNext';
    const currentImage = '#bookPageText';

    
    
    const browser = await puppeteer.launch({
        headless: false,
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


    if(!isURLsame){
        const images = await fetchImages(page, fullURL, waitRightSelector, currentImage);
        
    }
})();