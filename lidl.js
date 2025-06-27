import puppeteer from 'puppeteer';
import {downloadOutputImages, fetchImages, getNavigationLink,} from './index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {

    //lidl
    const lidlURL = "https://www.lidl.hu/c/szorolap/s10013623?flyx=019720a1-a92a-727e-bc6c-6241291ac69d";
    const lidlSelector = '.subcategory';
    const lidlJson = 'lidlDate.json';
    const lidlImages = './lidlImages';
    const waitRightSelector = '#root > main > section > div.content_navigation--right';
    const currentImage = 'li.page.page--current.page--current-1';

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

    const {isURLSame, url} = await getNavigationLink(page,lidlURL, lidlSelector, lidlJson,lidlImages);



    if(!isURLSame){

    const images = await fetchImages(page, url,waitRightSelector, currentImage);


    const outputDir = path.join(__dirname, lidlImages);
    if(!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    downloadOutputImages(images, lidlImages);

    console.log('All downloads finished!');
    }else{
        console.log('The images are already downloaded!');
    }
    await browser.close();
})();