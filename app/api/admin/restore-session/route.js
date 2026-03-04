import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const adminSession = cookieStore.get('admin_session');

        if (!adminSession) {
            return NextResponse.json({ error: 'No hay sesión de admin guardada' }, { status: 400 });
        }

        // Restaurar la sesión original del admin
        cookieStore.set('session', adminSession.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 8 * 60 * 60,
        });

        // Eliminar la cookie temporal de impersonación
        cookieStore.delete('admin_session');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al restaurar sesión:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const adminSession = cookieStore.get('admin_session');
        return NextResponse.json({ isImpersonating: !!adminSession });
    } catch {
        return NextResponse.json({ isImpersonating: false });
    }
}
