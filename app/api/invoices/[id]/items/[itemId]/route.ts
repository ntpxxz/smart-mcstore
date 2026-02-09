import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    const { id, itemId } = await params;
    try {
        const body = await request.json();
        const { receivedQty, iqcStatus } = body;

        const updatedItem = await prisma.inboundItem.update({
            where: { id: itemId },
            data: {
                receivedQty: receivedQty !== undefined ? parseInt(receivedQty) : undefined,
                iqcStatus: iqcStatus || undefined
            }
        });

        // Check if all items are received, update invoice status
        const invoice = await prisma.inboundInvoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (invoice) {
            const allReceived = invoice.items.every(item => item.receivedQty >= item.qty);
            if (allReceived && invoice.status === 'pending') {
                await prisma.inboundInvoice.update({
                    where: { id },
                    data: { status: 'completed' }
                });
            }
        }

        return NextResponse.json(updatedItem);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
