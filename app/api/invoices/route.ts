import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { timestamp: 'desc' }
        });
        return NextResponse.json(invoices);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { po, vendor, partNo, partName, invoice, invoiceDate, receivedDate, qty, timestamp, user } = body;

        const newInvoice = await prisma.invoice.create({
            data: {
                po,
                vendor,
                partNo,
                partName,
                invoice,
                invoiceDate,
                receivedDate,
                qty: parseInt(qty),
                recordedBy: user,
                timestamp
            }
        });

        // System Function: Update Part Inventory and Create Movement
        try {
            const part = await prisma.part.findUnique({
                where: { sku: partNo }
            });

            if (part) {
                await prisma.part.update({
                    where: { id: part.id },
                    data: { qty: part.qty + parseInt(qty) }
                });

                // Create a movement record
                await prisma.movement.create({
                    data: {
                        id: `MOV-${Date.now()}`,
                        date: new Date(),
                        qty: parseInt(qty),
                        source: vendor || 'Supplier',
                        destination: part.location || 'Warehouse',
                        type: 'INBOUND',
                        partId: part.id
                    }
                });
            }
        } catch (inventoryErr) {
            console.error('Inventory Update Error:', inventoryErr);
        }

        return NextResponse.json(newInvoice);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}