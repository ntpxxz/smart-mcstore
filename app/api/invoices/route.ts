import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
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
        // The frontend passes fields that match model invoice: 
        // po, vendor, partNo, partName, invoice, qty, etc.

        const newInvoice = await prisma.invoice.create({
            data: {
                po: body.po,
                vendor: body.vendor,
                partNo: body.partNo,
                partName: body.partName,
                invoice: body.invoice,
                invoiceDate: body.invoiceDate,
                receivedDate: body.receivedDate,
                qty: parseInt(body.qty) || 0,
                recordedBy: body.recordedBy || body.user,
                timestamp: body.timestamp || new Date().toISOString(),
                iqcstatus: body.iqcstatus || 'Pending'
            }
        });

        return NextResponse.json(newInvoice);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
