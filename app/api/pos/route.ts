import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // Seed initial data if table is empty
        const count = await prisma.purchaseOrder.count();

        if (count === 0) {
            await prisma.purchaseOrder.createMany({
                data: [
                    { po: "PO-2024-8801", partNo: "PN-HYD-500", partName: "Hydraulic Pump Valve Assembly", qty: 100, timestamp: new Date().toISOString() },
                    { po: "PO-2024-8802", partNo: "PN-CIR-100", partName: "Control Circuit Board v2", qty: 50, timestamp: new Date().toISOString() },
                    { po: "PO-2024-8803", partNo: "PN-GSK-999", partName: "Safety Gasket Seal (Rubber)", qty: 200, timestamp: new Date().toISOString() },
                    { po: "PO-2024-9005", partNo: "PN-MTL-200", partName: "Aluminum Chassis Frame", qty: 20, timestamp: new Date().toISOString() },
                ]
            });
        }

        const pos = await prisma.purchaseOrder.findMany({
            orderBy: { id: 'asc' }
        });

        return NextResponse.json(pos);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}