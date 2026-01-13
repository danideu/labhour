import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/entries/clock-in
export async function POST(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Debes seleccionar un proyecto' }, { status: 400 });
        }

        // Check if already working
        const checkStmt = db.prepare('SELECT id FROM time_entries WHERE user_id = ? AND end_time IS NULL');
        if (checkStmt.get(session.id)) {
            return NextResponse.json({ error: 'Ya tienes una jornada iniciada' }, { status: 409 });
        }

        const insertStmt = db.prepare(`
      INSERT INTO time_entries (user_id, project_id, start_time)
      VALUES (?, ?, DATETIME('now', 'localtime'))
    `); // Use localtime for simplicity in this demo, usually stick to UTC

        insertStmt.run(session.id, projectId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Clock-in error:', error);
        return NextResponse.json({ error: 'Error al iniciar jornada' }, { status: 500 });
    }
}

// PUT /api/entries/clock-out
export async function PUT(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // Check if working
        const checkStmt = db.prepare('SELECT id FROM time_entries WHERE user_id = ? AND end_time IS NULL');
        const entry = checkStmt.get(session.id);

        if (!entry) {
            return NextResponse.json({ error: 'No tienes ninguna jornada activa' }, { status: 404 });
        }

        const updateStmt = db.prepare(`
      UPDATE time_entries 
      SET end_time = DATETIME('now', 'localtime')
      WHERE id = ?
    `);

        updateStmt.run(entry.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Clock-out error:', error);
        return NextResponse.json({ error: 'Error al finalizar jornada' }, { status: 500 });
    }
}
