const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
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

    console.log({ admin, operator });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
