import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Seed initial data if table is empty
        // const count = await prisma.purchaseOrder.count();
        // if (count === 0) { ... } // Removed incompatible seeding logic

        const pos = await prisma.purchaseOrder.findMany({
            orderBy: { id: 'asc' }
        });

        return NextResponse.json(pos);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}