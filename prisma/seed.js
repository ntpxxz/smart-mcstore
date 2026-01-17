const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // 1. Seed Users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const operatorPassword = await bcrypt.hash('operator123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            id: 'user-admin',
            email: 'admin@example.com',
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN',
            updatedAt: new Date(),
        },
    });

    const operator = await prisma.user.upsert({
        where: { email: 'operator@example.com' },
        update: {},
        create: {
            id: 'user-operator',
            email: 'operator@example.com',
            name: 'Operator',
            password: operatorPassword,
            role: 'OPERATOR',
            updatedAt: new Date(),
        },
    });

    console.log('Users seeded:', { admin, operator });

    // 2. Seed Suppliers
    const suppliersData = [
        { name: 'TechComponents Ltd', contactName: 'John Doe', email: 'john@techcomp.com', country: 'USA', phone: '+1-555-0101' },
        { name: 'Global Parts Inc', contactName: 'Jane Smith', email: 'jane@globalparts.com', country: 'Germany', phone: '+49-123-456789' },
        { name: 'Asian Electronics', contactName: 'Li Wei', email: 'li@asianelec.com', country: 'China', phone: '+86-139-0000-0000' },
    ];

    for (const s of suppliersData) {
        await prisma.supplier.upsert({
            where: { name: s.name },
            update: {},
            create: s,
        });
    }
    console.log('Suppliers seeded');

    // 3. Seed Parts
    const partsData = [
        { id: 'part-1', name: 'Resistor 10k', sku: 'RES-10K', qty: 1000, unit: 'pcs', status: 'In Stock', location: 'A-01-01', icon: 'resistor' },
        { id: 'part-2', name: 'Capacitor 100uF', sku: 'CAP-100UF', qty: 500, unit: 'pcs', status: 'In Stock', location: 'A-01-02', icon: 'capacitor' },
        { id: 'part-3', name: 'Microcontroller', sku: 'MCU-328P', qty: 200, unit: 'pcs', status: 'Low Stock', location: 'B-02-01', icon: 'chip' },
        { id: 'part-4', name: 'LED Red', sku: 'LED-RED', qty: 5000, unit: 'pcs', status: 'In Stock', location: 'A-02-01', icon: 'led' },
    ];

    for (const p of partsData) {
        await prisma.part.upsert({
            where: { sku: p.sku },
            update: {},
            create: {
                ...p,
                updatedAt: new Date(),
            },
        });
    }
    console.log('Parts seeded');

    // 4. Seed Purchase Orders
    const poData = [
        { po: 'PO-2024-001', partNo: 'RES-10K', partName: 'Resistor 10k', qty: 5000, timestamp: new Date().toISOString() },
        { po: 'PO-2024-002', partNo: 'MCU-328P', partName: 'Microcontroller', qty: 100, timestamp: new Date().toISOString() },
    ];

    for (const po of poData) {
        await prisma.purchaseOrder.upsert({
            where: { po: po.po },
            update: {},
            create: po,
        });
    }
    console.log('Purchase Orders seeded');

    // 5. Seed Invoices
    const invoiceData = [
        { invoice: 'INV-001', po: 'PO-2024-001', vendor: 'TechComponents Ltd', partNo: 'RES-10K', partName: 'Resistor 10k', qty: 5000, timestamp: new Date().toISOString(), iqcstatus: 'Passed' },
        { invoice: 'INV-002', po: 'PO-2024-002', vendor: 'Asian Electronics', partNo: 'MCU-328P', partName: 'Microcontroller', qty: 100, timestamp: new Date().toISOString(), iqcstatus: 'Pending' },
    ];

    // Invoices don't have a unique field other than ID, so we might skip upsert or just create if empty.
    // For simplicity in this seed script, we'll check if any exist first or just create them.
    // Since we want to be idempotent, let's check by invoice number if possible, but schema doesn't enforce unique invoice number.
    // We'll just create them if the count is low.
    const invoiceCount = await prisma.invoice.count();
    if (invoiceCount === 0) {
        for (const inv of invoiceData) {
            await prisma.invoice.create({
                data: inv,
            });
        }
        console.log('Invoices seeded');
    }

    // 6. Seed Production Orders
    const moData = [
        { id: 'MO-1001', status: 'In Progress', line: 'Line 1', description: 'Batch 1 of IoT Devices', dueTime: '2024-02-01', progress: 30 },
        { id: 'MO-1002', status: 'Planned', line: 'Line 2', description: 'Batch 2 of IoT Devices', dueTime: '2024-02-15', progress: 0 },
    ];

    for (const mo of moData) {
        await prisma.productionOrder.upsert({
            where: { id: mo.id },
            update: {},
            create: {
                ...mo,
                updatedAt: new Date(),
            },
        });
    }
    console.log('Production Orders seeded');

    // 7. Seed BOM Items for MO-1001
    const bomData = [
        { id: 'bom-1', name: 'Resistor 10k', requiredQty: 10, unit: 'pcs', moId: 'MO-1001' },
        { id: 'bom-2', name: 'Capacitor 100uF', requiredQty: 5, unit: 'pcs', moId: 'MO-1001' },
        { id: 'bom-3', name: 'Microcontroller', requiredQty: 1, unit: 'pcs', moId: 'MO-1001' },
    ];

    for (const bom of bomData) {
        await prisma.bOMItem.upsert({
            where: { id: bom.id },
            update: {},
            create: {
                ...bom,
                updatedAt: new Date(),
            },
        });
    }
    console.log('BOM Items seeded');

    // 8. Seed Inbound Invoices
    const inboundInvoiceData = [
        { id: 'IB-INV-001', vendor: 'TechComponents Ltd', po: 'PO-2024-001', status: 'pending' },
    ];

    for (const inv of inboundInvoiceData) {
        await prisma.inboundInvoice.upsert({
            where: { id: inv.id },
            update: {},
            create: {
                ...inv,
                updatedAt: new Date(),
            },
        });
    }
    console.log('Inbound Invoices seeded');

    // 9. Seed Inbound Items
    const inboundItemData = [
        { id: 'ib-item-1', name: 'Resistor 10k', sku: 'RES-10K', qty: 5000, unit: 'pcs', invoiceId: 'IB-INV-001' },
    ];

    for (const item of inboundItemData) {
        await prisma.inboundItem.upsert({
            where: { id: item.id },
            update: {},
            create: {
                ...item,
                updatedAt: new Date(),
            },
        });
    }
    console.log('Inbound Items seeded');

    // 10. Seed Movements
    const movementData = [
        { id: 'mov-1', qty: 100, source: 'Supplier', destination: 'A-01-01', type: 'IN', partId: 'part-1' },
        { id: 'mov-2', qty: 50, source: 'A-01-01', destination: 'Line 1', type: 'OUT', partId: 'part-1' },
    ];

    for (const mov of movementData) {
        await prisma.movement.upsert({
            where: { id: mov.id },
            update: {},
            create: {
                ...mov,
            },
        });
    }
    console.log('Movements seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
