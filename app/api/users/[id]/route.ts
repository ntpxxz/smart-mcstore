import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT /api/users/[id] - Update a user
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { email, username, role, password } = body;

        const updateData: any = {
            email,
            username,
            role,
            updatedAt: new Date()
        };

        if (password) {
            // Hash the new password
            updateData.password = await bcrypt.hash(password, 10); // Fixed potential issue with duplicate password declaration in original code if any
        }

        // Ensure password is not in updateData if empty string
        if (!password) {
            delete updateData.password;
        } else {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                email,
                username,
                role,
                updatedAt: new Date(),
                ...(password ? { password: await bcrypt.hash(password, 10) } : {})
            }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.user.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Prisma Error:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
