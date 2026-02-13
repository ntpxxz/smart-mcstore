import { NextResponse } from 'next/server';

export async function PATCH() {
    return NextResponse.json({ error: 'Route temporarily disabled' }, { status: 501 });
}
