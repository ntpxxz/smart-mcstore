const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const keys = Object.keys(prisma).filter(k => k[0] !== '_' && typeof prisma[k] === 'object');
console.log(JSON.stringify(keys));
process.exit(0);
