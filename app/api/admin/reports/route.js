import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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
        let sql = `
            SELECT t.*, u.name as user_name, p.name as project_name
            FROM time_entries t
            JOIN users u ON t.user_id = u.id
            JOIN projects p ON t.project_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            sql += ' AND t.user_id = ?';
            params.push(userId);
        }
        if (projectId) {
            sql += ' AND t.project_id = ?';
            params.push(projectId);
        }
        if (startDate) {
            sql += ' AND t.start_time >= ?';
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            params.push(s.toISOString().replace('T', ' ').split('.')[0]);
        }
        if (endDate) {
            sql += ' AND t.start_time <= ?';
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            params.push(e.toISOString().replace('T', ' ').split('.')[0]);
        }

        sql += ' ORDER BY t.start_time DESC';

        const entries = await query(sql, params);

        // Calculate total hours
        let totalHours = 0;
        const computedEntries = entries.map(entry => {
            let duration = 0;
            if (entry.end_time) {
                const diff = new Date(entry.end_time) - new Date(entry.start_time);
                duration = diff / (1000 * 60 * 60);
            } else {
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
