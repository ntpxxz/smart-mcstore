import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // In the warehouse schema, it's 'email' and 'password'
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: username },
                    { name: username }
                ]
            }
        });

        if (user) {
            // Check if password matches (either hashed or plain text for migration)
            let isPasswordValid = false;

            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                // Hashed password
                isPasswordValid = await bcrypt.compare(password, user.password);
            } else {
                // Plain text password (fallback for old users)
                isPasswordValid = (password === user.password);
            }

            if (isPasswordValid) {
                return NextResponse.json({
                    username: user.name,
                    email: user.email,
                    role: user.role,
                    id: user.id
                });
            }
        }


        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (err) {
        console.error('Auth Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
