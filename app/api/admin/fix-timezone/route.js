import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, execute } from '@/lib/db';

// Endpoint temporal para corregir el desfase de +2h en imputaciones manuales PENDING.
// GET  → preview de qué cambiará (no modifica nada)
// POST → aplica la corrección
// ELIMINAR este archivo tras usarlo.

export async function GET(request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const entries = await query(`
        SELECT id, user_id, start_time, end_time, justification
        FROM time_entries
        WHERE entry_type = 'MANUAL' AND validation_status = 'PENDING'
        ORDER BY id
    `);

    const preview = entries.map(e => ({
        id: e.id,
        justification: e.justification?.slice(0, 50),
        start_actual: e.start_time,
        start_fixed: new Date(new Date(e.start_time.replace(' ', 'T') + 'Z').getTime() - 2 * 60 * 60 * 1000)
            .toISOString().replace('T', ' ').slice(0, 19),
        end_actual: e.end_time,
        end_fixed: new Date(new Date(e.end_time.replace(' ', 'T') + 'Z').getTime() - 2 * 60 * 60 * 1000)
            .toISOString().replace('T', ' ').slice(0, 19),
    }));

    return NextResponse.json({ total: entries.length, preview });
}

export async function POST(request) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await execute(`
        UPDATE time_entries
        SET
            start_time = datetime(start_time, '-2 hours'),
            end_time   = datetime(end_time,   '-2 hours')
        WHERE entry_type = 'MANUAL' AND validation_status = 'PENDING'
    `);

    const updated = await query(`
        SELECT id, start_time, end_time
        FROM time_entries
        WHERE entry_type = 'MANUAL' AND validation_status = 'PENDING'
        ORDER BY id
    `);

    return NextResponse.json({ success: true, updated });
}
