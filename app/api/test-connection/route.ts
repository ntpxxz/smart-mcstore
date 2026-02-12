import { NextResponse } from 'next/server';
import { pbassClient } from '@/lib/pbass-client';

/**
 * Test PBASS API Connection
 * GET /api/test-connection
 */
export async function GET() {
    try {
        console.log('🔍 Testing PBASS API connection...');

        const result = await pbassClient.testConnection();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                latency: result.latency,
                timestamp: new Date().toISOString(),
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.message,
                latency: result.latency,
                timestamp: new Date().toISOString(),
            }, { status: 503 });
        }
    } catch (error: any) {
        console.error('❌ Connection test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
