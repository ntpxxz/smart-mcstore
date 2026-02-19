import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const rampTasks = await prisma.inboundTask.findMany({
        where: {
            OR: [
                { partName: { contains: 'RAMP', mode: 'insensitive' } },
                { partName: { contains: 'DIVERTER', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Commonly found Ramp/Diverter tasks: ${rampTasks.length}`);
    rampTasks.slice(0, 5).forEach(t => {
        console.log(`- PO: ${t.poNo}, Part: ${t.partNo}, Name: ${t.partName}`);
    });

    const others = await prisma.inboundTask.count({
        where: {
            NOT: {
                OR: [
                    { partName: { contains: 'RAMP', mode: 'insensitive' } },
                    { partName: { contains: 'DIVERTER', mode: 'insensitive' } }
                ]
            }
        }
    });
    console.log(`Other tasks: ${others}`);

    await prisma.$disconnect();
}

check().catch(console.error);
