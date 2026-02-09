import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        console.log('Login attempt for username/email:', username);
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: username },
                    { username: username }
                ]
            }
        });

        if (user) {
            console.log('User found in database:', user.email);
            // Check if password matches (either hashed or plain text for migration)
            let isPasswordValid = false;

            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                // Hashed password
                isPasswordValid = await bcrypt.compare(password, user.password);
                console.log('Hashed password check valid:', isPasswordValid);
            } else {
                // Plain text password (fallback for old users)
                isPasswordValid = (password === user.password);
                console.log('Plain text password check valid:', isPasswordValid);
            }

            if (isPasswordValid) {
                return NextResponse.json({
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    id: user.id
                });
            }
        } else {
            console.log('User not found in database');
        }


        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (err: any) {
        console.error('Auth Error Details:', err.message || err);
        if (err.code) console.error('Prisma Error Code:', err.code);
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}

