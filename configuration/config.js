import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const configJSON = JSON.parse(fs.readFileSync('./configuration/config.json', 'utf-8'));


export const config = {
    port: process.env.PORT,
    api_endpoint: process.env.API_ENDPOINT,
    pdf_api_endpoint: process.env.PDF_API_ENDPOINT,
    supermarkets: configJSON.supermarkets,
}