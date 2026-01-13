import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const notifications = getNotifications(session.id);
        const unreadCount = getUnreadCount(session.id);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id, markAll } = await request.json();

        if (markAll) {
            markAllAsRead(session.id);
        } else if (id) {
            markAsRead(id, session.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }
}
