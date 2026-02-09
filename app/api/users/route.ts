import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users - List all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

// POST /api/users - Create a new user with hashed password
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, username, role } = body;

        if (!email || !password || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                id: `USER-${Date.now()}`,
                email,
                password: hashedPassword,
                username,
                role: role || 'USER',
                updatedAt: new Date()
            }
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword);
    } catch (err: any) {
        console.error('Prisma Error:', err);
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'Email or Username already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
