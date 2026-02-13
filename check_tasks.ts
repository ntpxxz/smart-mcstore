import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.inboundTask.count();
    console.log(`Total Inbound Tasks: ${count}`);
    const tasks = await prisma.inboundTask.findMany({ take: 5 });
    console.log('Latest 5 Tasks:', JSON.stringify(tasks, null, 2));
    await prisma.$disconnect();
}

check().catch(console.error);
