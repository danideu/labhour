import { NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');
const ALG = 'HS256';

export async function POST(request) {
    const session = await getSession();

    // Solo admins pueden impersonar
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    try {
        const user = await queryOne('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const cookieStore = await cookies();

        // Guardamos la sesión actual del admin en una cookie separada
        const currentSessionCookie = cookieStore.get('session');
        if (currentSessionCookie) {
            cookieStore.set('admin_session', currentSessionCookie.value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 8 * 60 * 60,
            });
        }

        // Creamos un nuevo JWT para el empleado
        const impersonateToken = await new SignJWT({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            impersonatedBy: session.id, // Para auditoría
        })
            .setProtectedHeader({ alg: ALG })
            .setIssuedAt()
            .setExpirationTime('8h')
            .sign(SECRET_KEY);

        cookieStore.set('session', impersonateToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 8 * 60 * 60,
        });

        return NextResponse.json({ success: true, userName: user.name });
    } catch (error) {
        console.error('Error al impersonar usuario:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
