import express from 'express';
//import lidlImages from './lidlImages/lidlImages.json' with {type: 'json'};
import {main as LidlMain} from './lidl.js';
//---------------------------------------------
import {main as SparMain} from './spar.js';
//import sparImages from './sparImages/sparImages.json' with {type: 'json'};
//---------------------------------------------
import { readJsonData } from './index.js';

import {main as PennyMain} from './penny.js';


import {config } from './configuration/config.js';

const app = express();



app.get(config.api_endpoint, async (req, res) => {
    const supermarketId = req.query.supermarketId;

    console.log(supermarketId);

    const market = config.supermarkets[supermarketId];

    if(!market){
        return res.status(404).json({error: "Supermarket not found"});
    }
        
    if(!market.enabled){
        return res.status(403).json({error: "Supermarket is currently disabled"});
    }
    if(market.type != "imageURL"){
        return res.status(400).json({error: "This supermarket only supports URL requests"});
    }

    
    try {      
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

    const market = config.supermarkets[supermarketId];
        if(!market){
            return res.status(404).json({error: "Supermarket not found"});
        }
        if(!market.enabled){
            return res.status(403).json({error: "Supermarket is currently disabled"});
        }
        if(market.type != "imagePDF")
        {
        return res.status(400).json({error: "This supermarket only supports PDF requests"});
        }
    try{
        
        await PennyMain();

        const pennyURL = await readJsonData(market.imagePath);
        res.json(pennyURL);
    }catch(error){
        res.status(500).json({error: 'Scraping failed', details: error.message});
    }
})