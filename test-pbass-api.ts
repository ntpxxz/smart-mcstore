/**
 * Test script to verify PBASS API connection
 * Run with: node --loader ts-node/esm test-pbass-api.ts
 * Or: npx tsx test-pbass-api.ts
 */

import { pbassClient } from './lib/pbass-client';

async function testPBASSConnection() {
    console.log('='.repeat(60));
    console.log('🧪 Testing PBASS API Connection');
    console.log('='.repeat(60));
    console.log('');

    // Check environment variables
    console.log('📋 Environment Configuration:');
    console.log('  PBASS_API_URL:', process.env.PBASS_API_URL || '❌ NOT SET');
    console.log('  PBASS_API_TOKEN:', process.env.PBASS_API_TOKEN ? '✅ SET (hidden)' : '❌ NOT SET');
    console.log('  PBASS_API_TIMEOUT:', process.env.PBASS_API_TIMEOUT || '30000 (default)');
    console.log('  PBASS_API_IGNORE_SSL:', process.env.PBASS_API_IGNORE_SSL || 'false (default)');
    console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY ? '✅ SET (hidden)' : '❌ NOT SET');
    console.log('');

    // Test connection
    console.log('🔌 Testing Connection...');
    const connectionTest = await pbassClient.testConnection();

    if (connectionTest.success) {
        console.log('✅ Connection successful!');
        console.log(`   Latency: ${connectionTest.latency}ms`);
        console.log(`   Message: ${connectionTest.message}`);
    } else {
        console.log('❌ Connection failed!');
        console.log(`   Error: ${connectionTest.message}`);
        console.log(`   Latency: ${connectionTest.latency}ms`);
    }
    console.log('');

    // Fetch invoices
    console.log('📥 Fetching Invoices...');
    const result = await pbassClient.fetchInvoices();

    if (result.success) {
        console.log(`✅ Successfully fetched ${result.count} records`);

        if (result.data && result.data.length > 0) {
            console.log('');
            console.log('📄 Sample Record (first item):');
            const sample = result.data[0];
            console.log('  PO_NO:', sample.PO_NO);
            console.log('  VENDOR_NAME:', sample.VENDOR_NAME);
            console.log('  ITEM_NO:', sample.ITEM_NO);
            console.log('  ITEM_NAME:', sample.ITEM_NAME);
            console.log('  INV_NO:', sample.INV_NO);
            console.log('  INV_DATE:', sample.INV_DATE);
            console.log('  REPLY_QTY:', sample.REPLY_QTY);
            console.log('  STATUS:', sample.STATUS);
        }
    } else {
        console.log('❌ Failed to fetch invoices');
        console.log(`   Error: ${result.error}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('🏁 Test Complete');
    console.log('='.repeat(60));
}

// Run the test
testPBASSConnection().catch(console.error);
