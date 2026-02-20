import { pbassClient } from './lib/pbass-client.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing PBASS API Connection...');
    const result = await pbassClient.fetchInvoices();
    if (result.success) {
        console.log(`Success! Found ${result.data.length} records.`);
        if (result.data.length > 0) {
            console.log('Sample Record:', result.data[0]);
            const samples = result.data.slice(0, 10).map(r => r.ITEM_NAME || r.itemName);
            console.log('Recent Item Names:', samples);
        }
    } else {
        console.error('Failed:', result.error);
    }
}

test();
