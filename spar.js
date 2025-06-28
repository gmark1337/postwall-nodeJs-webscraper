import puppeteer from 'puppeteer';
import {downloadOutputImages, fetchImages, getNavigationLink, denyCookie} from './index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);




(async () => {

    const sparUrl = 'https://www.spar.hu/ajanlatok';
    const sparSelector = '.flyer-teaser__wrapper ipaper-teaser__wrapper flyer-teaser__wrapper--grouped';
    const sparJson = 'sparDate.json';
    const sparImages = './sparImages'

    const waitForCookieDenySelector = '#cmpbox > div.cmpboxinner';
    const shadowHost = '#cmpwrapper';
    cookieButton = shadowHost.shadowRoot.querySelector(shadowHost);
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
    })

    const page = await browser.newPage();

    const{isURLsame, url} = await getNavigationLink(page, sparUrl, sparSelector, sparJson, sparImages, true, waitForCookieDenySelector, cookieButton);
})();