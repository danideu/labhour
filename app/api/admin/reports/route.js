import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET(request) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        let query = `
      SELECT t.*, u.name as user_name, p.name as project_name
      FROM time_entries t
      JOIN users u ON t.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
        const params = [];

        if (userId) {
            query += ' AND t.user_id = ?';
            params.push(userId);
        }
        if (projectId) {
            query += ' AND t.project_id = ?';
            params.push(projectId);
        }
        if (startDate) {
            query += ' AND t.start_time >= ?';
            // Ensure specific time or start of day
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            params.push(s.toISOString().replace('T', ' ').split('.')[0]);
        }
        if (endDate) {
            query += ' AND t.start_time <= ?';
            // Ensure end of day
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            params.push(e.toISOString().replace('T', ' ').split('.')[0]);
        }

        query += ' ORDER BY t.start_time DESC';

        const stmt = db.prepare(query);
        const entries = stmt.all(...params);

        // Calculate total hours in JS to handle null end_times (active) if needed or precise diffs
        let totalHours = 0;
        const computedEntries = entries.map(entry => {
            let duration = 0;
            if (entry.end_time) {
                const diff = new Date(entry.end_time) - new Date(entry.start_time);
                duration = diff / (1000 * 60 * 60);
            } else {
                // Option: Calculate until 'now' if active, or count as 0 for report until closed?
                // Usually reports exclude active or calculate up to now. Let's calculate up to now for "Live estimation"
                const diff = new Date() - new Date(entry.start_time);
                duration = diff / (1000 * 60 * 60);
            }
            totalHours += duration;
            return { ...entry, duration };
        });

        return NextResponse.json({
            entries: computedEntries,
            totalHours: Math.round(totalHours * 100) / 100
        });

    } catch (error) {
        console.error('Error in reports:', error);
        return NextResponse.json({ error: 'Error al generar informe' }, { status: 500 });
    }
}
