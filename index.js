import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { json } from 'stream/consumers';
import fs1 from 'fs/promises';
import { brotliCompress } from 'zlib';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export async function getNavigationLink(page,websiteLink,selector,jsonFile,imageFolder, cookieOptional = false, waitForCookieDenySelector = null, denyCookieSelector = null){
    
    await page.goto(websiteLink);

    if(cookieOptional == true){
        console.log(cookieOptional);
        console.log(waitForCookieDenySelector);
        console.log(denyCookieSelector);
        denyCookie(waitForCookieDenySelector, denyCookieSelector);
    }

    const valid = await page.evaluate((sel) => {
        const flyers = document.querySelectorAll(sel);
        const element = flyers[0];

        if(!element){
            return {
                date: 'NULL',
                URL: 'NULL'
            };
        };
        return {
            date: element.querySelector('.flyer')?.innerText.trim() || 'NULL',
            URL: element.querySelector('a')?.getAttribute('href') || 'NULL'
        };

        
    }, selector);

    const previousURL = await readJsonData(jsonFile);

    if(previousURL === null){
        console.log("No previous URL found, saving URL..."),
        await writeCurrentDateJson(valid.URL, jsonFile);
        await clearFolder(imageFolder);
        return {isURLSame: false, url:valid.URL};
    }

    if(previousURL === valid.URL){
        console.log("URL hasn't changed , skipping...");
        return {isURLSame: true, url:previousURL};
    }
    
    await writeCurrentDateJson(valid.URL,jsonFile);
    return {isURLSame: false, url: valid.URL};

}

export async function fetchImages(page,relativeURL,waitRightSelector, currentImage, waitForCookieDenySelector=null, denyCookieSelector=null){

    if (relativeURL === 'NULL'){
        console.log("URL not found!");
        await browser.close();
        return [];
    }
    await page.goto(relativeURL, {
        waitUntil: 'networkidle0'
    });
    await sleep(400);
    await denyCookie(page, waitForCookieDenySelector, denyCookieSelector);
    await sleep(400);


    const imagesURL = [];
    let pageIndex = 1;

    console.log('Starting paging loop...');
    while (true) {
        
        await page.waitForSelector(currentImage);
        console.log(`Currently on page ${pageIndex}`)
        const result = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if(!element){
                return null;
            }
            const img = element.querySelector('img');
            const image = img? img.src : null;
            return image;
        }, currentImage);
        if(result){
            imagesURL.push({pageIndex, url: result});
        }else{
            console.log(`Image not found on ${pageIndex}. page.`);
        }
        
        if(!await page.$(waitRightSelector)){
            console.log('No more pages!');
            break;
        }

        try {
            await page.waitForSelector(waitRightSelector, { visible: true });
            await page.click(waitRightSelector);
            await sleep(100);
            pageIndex++;
        } catch (err) {
            console.log('No more pages!', err.message)
            break;
        
    }
}
console.log('Exiting the loop');
    return imagesURL;
}

async function downloadImage(url, filename, imageFolder){
    const res = await fetch(url);
    if(!res.ok){
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    }

    const dest = fs.createWriteStream(path.join(__dirname, imageFolder,filename));
    await new Promise((resolve, reject) => {
        res.body.pipe(dest);
        res.body.on('error',reject);
        res.body.on('finish',resolve);
    });
}

export async function downloadOutputImages(images, outputDir){
    
    for(const {pageIndex, url} of images){
        if(!url || url === 'URL not found') {
            continue;
        }
        const filename = `page-${pageIndex}.jpg`;
        console.log(`Downloading ${filename}...`);
        try{
            await downloadImage(url, filename,outputDir);
        }catch(err){
            console.error(`Failed to download page ${pageIndex}:`, err.message);
        }
    }
        console.log('All downloads finished!')
}

 async function writeCurrentDateJson(date,fileName){
    const jsonData = JSON.stringify(date, null, 2);

    await fs1.writeFile(fileName, jsonData, (err) => {
        if(err){
            console.log('Error writing file', err.message);
        }
        else{
            console.log('Date writing successfully!');
        }
    })
}

 async function readJsonData(file){
    try {
        const jsonString = await fs1.readFile(file, 'utf-8');
        if(!jsonString.trim()){
            console.warn("The json file is empty.");
            return null;
        }
        const data = JSON.parse(jsonString);
        return data;
    }catch(err){
        console.log('Failed to read or parse JSON file', err.message);
        return null;
    }
}

 async function clearFolder(folderPath){
    try {
        const files = await fs1.readdir(folderPath);

        for(const file of files){
            const filePath = path.join(folderPath, file);
            const stat = await fs1.lstat(filePath);

            if(stat.isFile()){
                await fs1.unlink(filePath);
            }
        }
        
        console.log('Folder successfully cleared.');
    }
    catch(err){
        console.error('Error clearing folder:', err);
    }
}

//we hate cookies >:(
 export async function denyCookie(page, waitForCookieDenySelector, denyCookieSelector){
   try {
     await page.waitForSelector(waitForCookieDenySelector);
        await page.click(denyCookieSelector);
       console.log('Cookies denied');
   }catch(err){
      console.log('No cookie banner found!');
    }
}


export async function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
