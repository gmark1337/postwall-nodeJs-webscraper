import express from 'express';
import lidlImages from './lidlImages/lidlImages.json' with {type: 'json'};
import {main as LidlMain} from './lidl.js';
const app = express();
const port = 3000;

app.get('/api/data/', async (req, res) => {
    const supermarketId = req.query.supermarketId;
    try {
        if(supermarketId === '1'){
            await LidlMain();
            res.json({lidlImages});
        }else{
            res.status(400).json({error: "Unknown supermarketId"});
        }
        
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Scraping failed', details: error.message});
    }
});

app.listen(port, () => {
    console.log(`Node.js server running on http://localhost:${port}`);
});