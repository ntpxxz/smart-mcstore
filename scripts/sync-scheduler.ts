/**
 * PBASS API Sync Scheduler
 * Runs every 5 minutes to fetch data from PBASS API
 */

import { syncService } from '../lib/sync-service.ts';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function runSync() {
    console.log(`\n[${new Date().toISOString()}] 🕒 Starting scheduled sync...`);
    try {
        const result = await syncService.syncFromAPI();
        if (result.success) {
            console.log(`[${new Date().toISOString()}] ✅ Sync completed: ${result.message}`);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ Sync failed: ${result.message}`);
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 💥 Fatal error during sync:`, error);
    }
}

async function startScheduler() {
    console.log('='.repeat(60));
    console.log('🚀 PBASS API Sync Scheduler Started');
    console.log(`🕒 Interval: ${SYNC_INTERVAL_MS / 1000 / 60} minutes`);
    console.log(`📍 API URL: ${process.env.PBASS_API_URL}`);
    console.log('='.repeat(60));

    // Run once immediately on start
    await runSync();

    // Schedule subsequent runs
    setInterval(async () => {
        await runSync();
    }, SYNC_INTERVAL_MS);
}

// Handle termination signals
process.on('SIGINT', () => {
    console.log('\n🛑 Scheduler stopping...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Scheduler stopping...');
    process.exit(0);
});

// Start the scheduler
startScheduler().catch(console.error);
