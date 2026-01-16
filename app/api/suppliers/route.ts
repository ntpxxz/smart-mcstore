import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const supplier = await prisma.supplier.create({
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
        console.error('Error creating supplier:', error);
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
}
