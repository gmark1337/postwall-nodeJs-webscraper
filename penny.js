import puppeteer from "puppeteer";
import {downloadOutputImages, fetchImages, getNavigationLink, denyCookie, sleep} from './index.js';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
    const pennyURL = "https://www.penny.hu/reklamujsag";
    const pennySelector = "#main > div > div.ws-cms-components > section > div";
    const pennyJson = "pennyDates";
    const pennyImages = "./pennyImages";
    const waitRightSelector = '#book-holder > div:nth-child(3)';
    const currentImage = ''
    const waitForCookieDenySelector = "#onetrust-banner-sdk > div > div";
    const denyCookieSelector = "#onetrust-reject-all-handler";


    //it gets the path to the download folder HOME is used in linux, USERPROFILE is windows, sucks to be on mac 
    const downloadPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
    const fileName = 'PENNY 26. heti reklámújság.pdf';
    //combines the path to get full path to the downloaded file
    const sourcePath = path.join(downloadPath, fileName);
    //combining the current script folder __dirname, to the movable folder!
    const destinationPath = path.join(__dirname, './pennyImages', fileName);

    const browser = await puppeteer.launch({
        headless:true,
        defaultViewport:false,
    });

    const page = await browser.newPage();

    /* await page.setViewport({
        width: 1920,
        height: 1080
    }); */
    
    
    await page.setRequestInterception(true);
    page.on('request', req => {
        if(req.url().includes('cookie') || req.url().includes('consent')){
            req.abort();
        }else{
            req.continue();
        }   
    })


    const {isURLSame, url} = await getNavigationLink(page,pennyURL, pennySelector, pennyJson, pennyImages, true, waitForCookieDenySelector, denyCookieSelector);
    await page.goto(url, {waitUntil:"networkidle2"} );
    
    await sleep(2000);

    await page.waitForSelector("#publication .bottom-toolbar-frame", {timeout: 5000});

    await page.click("#publication .bottom-toolbar-frame button[title='Download']");



    let attempt = 1;
    const maxRetries = 5;

    //TODO
    //check if it left any garbage like duplicate in the download folder and delete it

    while(attempt <= maxRetries){
        const delay = 3000 + attempt * 2000;
        await sleep(1000);

        if(fs.existsSync(sourcePath)){
            fs.unlinkSync(sourcePath);
        }
        console.log(`Attempting to download on the ${attempt}th try...`)


        await page.waitForSelector("a.download-full-button[title='Download the publication as a PDF file']", {timeout: 5000});
        await page.click('a.download-full-button');

        await sleep(3000+delay);
        
        if(fs.existsSync(sourcePath)){
            let sizeBefore = fs.statSync(sourcePath).size;
            await sleep(1000);
            let sizeAfter = fs.statSync(sourcePath).size;
            if(sizeBefore === sizeAfter){
                fs.renameSync(sourcePath, destinationPath);
                console.log('File moved succesfully!');
                break;
            }else{
                console.log('File is still downlading, will retry...');
            }
        }else{
            console.log(`Download failed, retry ${attempt + 1}`)
        }
            
            attempt++;

        };
        if(attempt > maxRetries){
            console.log('Max retries reached. Download failed.');
    };

    await browser.close();
})();