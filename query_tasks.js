
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.inboundTask.count();
    console.log('Total tasks in DB:', count);

    const tasks = await prisma.inboundTask.findMany({
        take: 5,
        select: {
            poNo: true,
            invoiceNo: true,
            status: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log('Recent 5 tasks:');
    console.log(JSON.stringify(tasks, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
