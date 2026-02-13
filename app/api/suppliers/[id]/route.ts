import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: body.name,
                contactName: body.contactName,
                email: body.email,
                phone: body.phone,
                address: body.address,
                country: body.country,
                taxId: body.taxId,
            },
        });
        return NextResponse.json(supplier);
    } catch (error) {
        console.error('Error updating supplier:', error);
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.supplier.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}
