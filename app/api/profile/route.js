import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET current user profile
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const user = db.prepare(`
            SELECT id, name, email, role, avatar_url, created_at 
            FROM users WHERE id = ?
        `).get(session.id);

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
    }
}

// PUT update profile (name, email)
export async function PUT(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { name, email } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 });
        }

        // Check if email is already taken by another user
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, session.id);
        if (existingUser) {
            return NextResponse.json({ error: 'El email ya está en uso por otro usuario' }, { status: 400 });
        }

        db.prepare(`
            UPDATE users SET name = ?, email = ? WHERE id = ?
        `).run(name.trim(), email.toLowerCase().trim(), session.id);

        return NextResponse.json({ success: true, message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }
}
