import prisma from './lib/db';

async function test() {
    const task = await prisma.inboundTask.findFirst();
    if (task) {
        // @ts-ignore
        console.log(task.poNo);
        // @ts-ignore
        console.log(task.po);
    }
}
