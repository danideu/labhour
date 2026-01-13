import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // Find active entry (where end_time is NULL)
        const stmt = db.prepare(`
      SELECT t.*, p.name as project_name 
      FROM time_entries t
      JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ? AND t.end_time IS NULL
    `);

        const activeEntry = stmt.get(session.id);

        return NextResponse.json({
            activeEntry: activeEntry || null
        });

    } catch (error) {
        console.error('Error fetching current status:', error);
        return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 });
    }
}
