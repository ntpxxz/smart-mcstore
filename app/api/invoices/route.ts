import { NextResponse } from 'next/server';
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

export async function POST(request) {
    try {
        const body = await request.json();
        const { po, vendor, partNo, partName, invoice, invoiceDate, receivedDate, qty, timestamp } = body;

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
                timestamp
            }
        });

        return NextResponse.json(newInvoice);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}