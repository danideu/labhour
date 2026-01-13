import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        // Get manual entries pending validation
        const stmt = db.prepare(`
            SELECT t.*, p.name as project_name, u.name as user_name, u.email as user_email
            FROM time_entries t
            JOIN projects p ON t.project_id = p.id
            JOIN users u ON t.user_id = u.id
            WHERE t.entry_type = 'MANUAL' AND t.validation_status = ?
            ORDER BY t.created_at DESC
        `);

        const entries = stmt.all(status);
        return NextResponse.json(entries);

    } catch (error) {
        console.error('Error fetching pending entries:', error);
        return NextResponse.json({ error: 'Error al obtener entradas' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { entryId, action, adminComment } = await request.json();

        if (!entryId || !action) {
            return NextResponse.json({ error: 'ID de entrada y acción son requeridos' }, { status: 400 });
        }

        if (!['VALIDATED', 'REJECTED'].includes(action)) {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
        }

        // Get current entry
        const getStmt = db.prepare('SELECT * FROM time_entries WHERE id = ?');
        const entry = getStmt.get(entryId);

        if (!entry) {
            return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 });
        }

        if (entry.entry_type !== 'MANUAL') {
            return NextResponse.json({ error: 'Solo se pueden validar imputaciones manuales' }, { status: 400 });
        }

        // Get request metadata
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

        // Update entry status
        const updateStmt = db.prepare(`
            UPDATE time_entries
            SET validation_status = ?, validated_by = ?, validated_at = DATETIME('now', 'localtime')
            WHERE id = ?
        `);
        updateStmt.run(action, session.id, entryId);

        // Create audit log
        createAuditLog({
            userId: session.id,
            actionType: action === 'VALIDATED' ? AUDIT_ACTIONS.VALIDATE_ENTRY : AUDIT_ACTIONS.REJECT_ENTRY,
            entityType: 'time_entry',
            entityId: entryId,
            oldValues: { validation_status: entry.validation_status },
            newValues: {
                validation_status: action,
                validated_by: session.id,
                admin_comment: adminComment || null
            },
            ipAddress,
            userAgent,
            justification: adminComment || null
        });

        // Notify employee
        const statusText = action === 'VALIDATED' ? 'aprobada' : 'rechazada';
        let message = `Tu imputación manual del ${new Date(entry.start_time).toLocaleDateString('es-ES')} ha sido ${statusText}.`;
        if (adminComment) {
            message += ` Comentario: "${adminComment}"`;
        }

        await createNotification({
            userId: entry.user_id,
            type: 'MANUAL_ENTRY_' + action,
            title: `Imputación ${statusText}`,
            message,
            referenceId: entryId
        });

        return NextResponse.json({
            success: true,
            message: `Imputación ${statusText} correctamente`
        });

    } catch (error) {
        console.error('Error validating entry:', error);
        return NextResponse.json({ error: 'Error al validar la entrada' }, { status: 500 });
    }
}
