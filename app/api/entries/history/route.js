import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        let sql = `
            SELECT t.*, p.name as project_name 
            FROM time_entries t
            JOIN projects p ON t.project_id = p.id
            WHERE t.user_id = ?
        `;
        const params = [session.id];

        if (projectId) {
            sql += ' AND t.project_id = ?';
            params.push(projectId);
        }

        if (startDate) {
            sql += ' AND DATE(t.start_time) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND DATE(t.start_time) <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY t.start_time DESC LIMIT 200';

        const entries = await query(sql, params);

        // Calculate total hours
        let totalHours = 0;
        entries.forEach(entry => {
            if (entry.end_time) {
                const diff = new Date(entry.end_time) - new Date(entry.start_time);
                totalHours += diff / (1000 * 60 * 60);
            }
        });

        return NextResponse.json({
            entries,
            totalHours: Math.round(totalHours * 100) / 100
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
    }
}
