import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const parts = await prisma.part.findMany({
            orderBy: { sku: 'asc' }
        });
        return NextResponse.json(parts);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
