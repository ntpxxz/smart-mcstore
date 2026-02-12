import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

/**
 * Health Check Endpoint
 * Used by Docker health checks and monitoring
 */
export async function GET() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'up',
                application: 'up'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'down',
                application: 'up'
            },
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}
