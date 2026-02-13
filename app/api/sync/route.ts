import { NextResponse } from 'next/server';
import { syncService } from '@/lib/sync-service';

export async function POST(request: Request) {
    try {
        console.log('🚀 Manual sync triggered via API');

        const result = await syncService.syncFromAPI();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                source: result.source,
                stats: {
                    added: result.added,
                    skipped: result.skipped,
                    errors: result.errors,
                    total: result.total
                }
            });
        } else {
            return NextResponse.json({
                error: result.message,
                source: result.source
            }, { status: 503 });
        }
    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({
            error: 'Failed to sync data',
            details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}
