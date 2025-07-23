import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {downloadOutputImages, fetchImages, getNavigationLink, denyCookie, sleep, readJsonData} from './index.js';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

puppeteer.use(StealthPlugin());

export async function main() {

    //TODO
    //CHECK NEXT WEEK IF IT WORKS :))))


    const pennyURL = "https://www.penny.hu/reklamujsag";
    const pennySelector = "#main > div > div.ws-cms-components > section > div";
    const pennyJson = "pennyDates.json";
    const pennyImages = "./pennyImages";

   


    const downloadSelector = "a.download-full-button[title='Download the publication as a PDF file']";
    const downloadImageTag = 'a.download-full-button';

    const browser = await puppeteer.launch({
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


    const {isURLSame, url} = await getNavigationLink(page,pennyURL, pennySelector, pennyJson, pennyImages);

    let file = await readJsonData("pennyDates.json");
    const actualDate = file.split("/")[5];
    const currentFlyerDate = actualDate.slice(-2); 

    
    //it gets the path to the download folder HOME is used in linux, USERPROFILE is windows, sucks to be on mac 
    //const downloadPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
    //const fileName = `PENNY ${currentFlyerDate}. heti reklámújság.pdf`;
    
    if(!isURLSame){
        
        await page.goto(url, {waitUntil:"networkidle2"} );
        await sleep(4000);
        
        await page.waitForSelector("#publication .bottom-toolbar-frame", {timeout: 5000});
        await page.click("#publication .bottom-toolbar-frame button[title='Download']");


        await page.waitForSelector(downloadSelector, {timeout: 5000});
        await page.click(downloadImageTag);
        const pdfURL = await page.$eval(downloadImageTag, el => el.href);
        console.log("PDF URL:", pdfURL);


        const pennyJsonImages=  ({
            actualDate: actualDate,
            URL: pdfURL
        });

        //console.log(pennyJsonImages);

         await fs.writeFileSync('./pennyImages/pennyPDF.json', JSON.stringify(pennyJsonImages, null, 2), 'utf-8');

}
    await browser.close();
};
//await main();