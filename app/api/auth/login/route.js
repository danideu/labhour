import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }

        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);

        if (!user) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        // Create session
        await createSession({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
