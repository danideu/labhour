import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notifyAllAdmins } from '@/lib/notifications';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const absences = await query('SELECT * FROM absence_requests WHERE user_id = ? ORDER BY created_at DESC', [session.id]);
        return NextResponse.json(absences);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener ausencias' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { type, startDate, endDate, comments } = await request.json();

        if (!type || !startDate || !endDate) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        // Basic validation: end date >= start date
        if (new Date(endDate) < new Date(startDate)) {
            return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la de inicio' }, { status: 400 });
        }

        const result = await execute(`
            INSERT INTO absence_requests (user_id, type, start_date, end_date, comments, status)
            VALUES (?, ?, ?, ?, ?, 'PENDING')
        `, [session.id, type, startDate, endDate, comments || '']);

        // Notificar a todos los administradores
        await notifyAllAdmins({
            type: 'ABSENCE_REQUESTED',
            title: 'Nueva solicitud de ausencia',
            message: `${session.name} ha solicitado ${type} del ${startDate} al ${endDate}`,
            referenceId: result.lastInsertRowid
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error('Error creating absence:', error);
        return NextResponse.json({ error: 'Error al solicitar ausencia' }, { status: 500 });
    }
}
