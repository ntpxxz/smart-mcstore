import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const tasks = await prisma.inboundTask.findMany({
            where: {
                OR: [
                    { partName: { contains: 'Ramp', mode: 'insensitive' } },
                    { partName: { contains: 'Diverter', mode: 'insensitive' } },
                    { partName: { contains: 'Divertor', mode: 'insensitive' } },
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map database fields to frontend expected fields
        const formattedTasks = tasks.map(task => ({
            id: task.id,
            po: task.poNo || '',
            vendor: task.vendor,
            partNo: task.partNo,
            partName: task.partName || '',
            qty: task.planQty,
            invoiceNo: task.invoiceNo,
            externalDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            status: task.status, // Keep original enum for logic
            displayStatus: task.status.split('_').map(word =>
                word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' '),
            tagNo: task.tagNo,
            createdAt: task.createdAt
        }));

        return NextResponse.json(formattedTasks);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, tagNo } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        // Convert frontend status (Pending/Completed) to Enum (PENDING/COMPLETED)
        const dbStatus = status.trim().toUpperCase();

        const updatedTask = await prisma.inboundTask.update({
            where: { id: id }, // ID is a UUID string, not an integer
            data: {
                status: dbStatus as any,
                tagNo: tagNo || undefined
            }
        });

        return NextResponse.json(updatedTask);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

