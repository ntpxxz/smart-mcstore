
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.inboundTask.findMany({
        take: 5,
        select: {
            poNo: true,
            invoiceNo: true,
            vendor: true,
            partNo: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(tasks, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
