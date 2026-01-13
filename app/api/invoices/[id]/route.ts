import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.invoice.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}