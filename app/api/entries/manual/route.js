import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { execute, query } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { notifyAllAdmins } from '@/lib/notifications';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { projectId, date, startTime, endTime, justification } = await request.json();

        // Validate required fields
        if (!projectId || !date || !startTime || !endTime || !justification) {
            return NextResponse.json({
                error: 'Todos los campos son obligatorios: proyecto, fecha, hora inicio, hora fin y justificación'
            }, { status: 400 });
        }

        // Validate justification length
        if (justification.trim().length < 10) {
            return NextResponse.json({
                error: 'La justificación debe tener al menos 10 caracteres'
            }, { status: 400 });
        }

        // Build datetime strings
        const startDateTime = `${date} ${startTime}`;
        const endDateTime = `${date} ${endTime}`;

        // Validate that end is after start
        if (new Date(endDateTime) <= new Date(startDateTime)) {
            return NextResponse.json({
                error: 'La hora de fin debe ser posterior a la hora de inicio'
            }, { status: 400 });
        }

        // Get request metadata for audit
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
        const deviceId = request.headers.get('x-device-id') || null;

        // Create the manual entry with PENDING status
        const result = await execute(`
            INSERT INTO time_entries (
                user_id, project_id, start_time, end_time, 
                entry_type, validation_status, justification, server_timestamp
            ) VALUES (?, ?, ?, ?, 'MANUAL', 'PENDING', ?, DATETIME('now', 'localtime'))
        `, [
            session.id,
            projectId,
            startDateTime,
            endDateTime,
            justification.trim()
        ]);

        const entryId = result.lastInsertRowid;

        // Create audit log
        await createAuditLog({
            userId: session.id,
            actionType: AUDIT_ACTIONS.CREATE_MANUAL_ENTRY,
            entityType: 'time_entry',
            entityId: entryId,
            oldValues: null,
            newValues: {
                project_id: projectId,
                start_time: startDateTime,
                end_time: endDateTime,
                entry_type: 'MANUAL',
                validation_status: 'PENDING'
            },
            deviceId,
            ipAddress,
            userAgent,
            justification: justification.trim()
        });

        // Notify admins
        await notifyAllAdmins({
            type: 'MANUAL_ENTRY_REQUEST',
            title: 'Nueva imputación manual',
            message: `${session.name} ha solicitado registrar una jornada manual para el ${date}`,
            referenceId: entryId
        });

        return NextResponse.json({
            success: true,
            id: entryId,
            message: 'Imputación manual creada. Pendiente de validación por un administrador.'
        });

    } catch (error) {
        console.error('Error creating manual entry:', error);
        return NextResponse.json({ error: 'Error al crear la imputación manual' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Get user's manual entries
        const entries = await query(`
            SELECT t.*, p.name as project_name
            FROM time_entries t
            JOIN projects p ON t.project_id = p.id
            WHERE t.user_id = ? AND t.entry_type = 'MANUAL'
            ORDER BY t.created_at DESC
            LIMIT 50
        `, [session.id]);

        return NextResponse.json(entries);

    } catch (error) {
        console.error('Error fetching manual entries:', error);
        return NextResponse.json({ error: 'Error al obtener imputaciones' }, { status: 500 });
    }
}
