import express from 'express';
//import lidlImages from './lidlImages/lidlImages.json' with {type: 'json'};
import {main as LidlMain} from './lidl.js';
//---------------------------------------------
import {main as SparMain} from './spar.js';
//import sparImages from './sparImages/sparImages.json' with {type: 'json'};
//---------------------------------------------
import { readJsonData, getPdfFileName } from './index.js';

import {main as PennyMain} from './penny.js';


import {config } from './configuration/config.js';

import fs from 'fs';
import path from 'path';
const app = express();




app.get(config.api_endpoint, async (req, res) => {
    const supermarketId = req.query.supermarketId;
    try {
        const market = config.supermarkets[supermarketId];
        
        if(!market.enabled){
            return res.status(403).json({error: "Supermarket is currently disabled"});
        }
        if(!market){
            return res.status(404).json({error: "Supermarket not found"});
        }

        if(market && market.enabled){
            switch(supermarketId){
                case '1':
                    await LidlMain();
                    break;
                case '2':
                    await SparMain();
                    break;
            }

            const images = await readJsonData(market.imagePath)

            res.json({images});
        }else{
            res.status(400).json({error: "Unknown supermarketID"});
        }

        
        /*if(supermarketId === '1'){
            await LidlMain();
            
            const lidlImages = await readJsonData('./lidlImages/lidlImages.json');
            //console.log("Sending lidl images...", lidlImages)
            res.json({lidlImages});
        
        }else if(supermarketId === '2') {
            await SparMain();
            const sparImages = await readJsonData('./sparImages/sparImages.json');
            //console.log("Sending spar images...", sparImages)
            res.json({sparImages});
        }//TODO
        else{
            res.status(400).json({error: "Unknown supermarketId"});
        }*/
        
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Scraping failed', details: error.message});
    }
});

app.listen(config.port, () => {
    console.log(`Node.js server running on http://localhost:${config.port}`);
});


app.get(config.pdf_api_endpoint, async(req,res) => {
    const supermarketId = req.query.supermarketId;
    try{
        const market = config.supermarkets[supermarketId];
        if(!market.enabled){
            return res.status(403).json({error: "Supermarket is currently disabled"});
        }
        if(!market){
            return res.status(404).json({error: "Supermarket not found"});
        }
        
        if(market && market.enabled){
        await PennyMain();

        const pennyURL = await readJsonData(market.imagePath);
        res.json(pennyURL);
    }else{
        res.status(400).json({error: 'Unknown Id!'});
    }
    
    }catch(error){
        res.status(500).json({error: 'Scraping failed', details: error.message});
    }
})