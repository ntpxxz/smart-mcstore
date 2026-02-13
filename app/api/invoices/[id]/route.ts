import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        // The frontend sends { iqcstatus: status } or similar
        const { iqcstatus } = body;

        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                iqcstatus: iqcstatus
            }
        });

        return NextResponse.json(updatedInvoice);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        await prisma.invoice.delete({
            where: { id: invoiceId }
        });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}