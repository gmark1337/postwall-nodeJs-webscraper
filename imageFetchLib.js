import {sleep} from './app.js';


export async function getFirstImageLink(page, selector){
    return await page.evaluate((selector) => {
        const container = document.querySelector(selector);
        if(!container){
            console.log(`Selector ${selector} not found! `);
            return null;
        }

        if(container.tagName.toLowerCase() === 'img'){
            return container.src || null;
        }

        const img = container.querySelector('img');
        return img ? img.src : null;
    }, selector);
}

export async function getMultipleImagesIntoArrays(page, selector){
    return  await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));

        if(!elements){
            console.log("Failed to fetch image box!");
            return null;
        }

        return elements.flatMap(div => {
            const imgs = div.querySelectorAll('img');
            return Array.from(imgs)
            .map(img => img.src)
            .filter(src => src);
        }).filter(src => src !== null);
    }, selector);
}

export async function getImageURL(page, selector){
    return await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if(!element){
            //console.log(`Selector for ${selector} not found !`);
            return null;
        }
        const img = element.querySelector('img');
        return img ? img.src : null;
    }, selector);
}

export async function isDisabledButtonActive(page, selector){
    return await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element !== null;
    }, selector);
}

export async function getPdfURL(page, selector){
    return await page.evaluate((selector) => {
        const element = document.querySelector(selector).querySelector('a').href;
        if(element !== null){
            return element;
        }else{
            console.log("Failed to fetch pdf URL");
            return null;
        }
    }, selector);
}

export async function clickNextButtonNthTimes(page, selector, numberOfClicks, isDisabledActive){
    for(let i = 0; i < numberOfClicks; i++){
        try{
            console.log(`Clicked the right button ${i+1} times`);
            await page.click(selector);
            await sleep(400);
            if(isDisabledActive){
                console.log('Last page!');
                return true;
            }
        }catch(err){
            console.log('Sudden error occurred!', err.message);
            return true;
        };
    }
    return false;
}
