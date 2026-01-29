import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const tasks = await prisma.inboundTask.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tasks);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const updatedTask = await prisma.inboundTask.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        return NextResponse.json(updatedTask);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
