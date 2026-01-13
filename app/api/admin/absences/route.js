import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return null;
    }
    return session;
}

// GET: List all absences (with user info)
export async function GET() {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const stmt = db.prepare(`
      SELECT a.*, u.name as user_name 
      FROM absence_requests a
      JOIN users u ON a.user_id = u.id
      ORDER BY 
        CASE WHEN a.status = 'PENDING' THEN 0 ELSE 1 END,
        a.created_at DESC
    `);
        const absences = stmt.all();
        return NextResponse.json(absences);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener listado' }, { status: 500 });
    }
}

// PUT: Update status with optional admin comment
export async function PUT(request) {
    const adminSession = await ensureAdmin();
    if (!adminSession) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id, status, adminComments } = await request.json();

        if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        // Get the absence to find out who to notify
        const absence = db.prepare('SELECT * FROM absence_requests WHERE id = ?').get(id);
        if (!absence) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        // Update the absence
        const stmt = db.prepare('UPDATE absence_requests SET status = ?, admin_comments = ? WHERE id = ?');
        stmt.run(status, adminComments || null, id);

        // Notify the employee
        const statusText = status === 'APPROVED' ? 'aprobada' : 'rechazada';
        let message = `Tu solicitud de ${absence.type} ha sido ${statusText}`;
        if (adminComments) {
            message += `. Comentario: "${adminComments}"`;
        }

        createNotification({
            userId: absence.user_id,
            type: status === 'APPROVED' ? 'ABSENCE_APPROVED' : 'ABSENCE_REJECTED',
            title: `Solicitud ${statusText}`,
            message: message,
            referenceId: id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating absence:', error);
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }
}
