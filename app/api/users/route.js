import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

// Middleware helper to ensure admin
async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET() {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const users = await query('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC');
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
        }

        // Validar longitud de contraseña
        if (password.length < 8) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
        }

        // Validar complejidad de contraseña
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            return NextResponse.json({
                error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
            }, { status: 400 });
        }

        // Validar rol
        if (!['admin', 'employee'].includes(role)) {
            return NextResponse.json({ error: 'El rol debe ser "admin" o "employee"' }, { status: 400 });
        }

        // Check unique email
        const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);

        return NextResponse.json({
            success: true,
            user: { id: Number(result.lastInsertRowid), name, email, role }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: `Error al crear usuario: ${error.message}` }, { status: 500 });
    }
}
