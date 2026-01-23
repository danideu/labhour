import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET() {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // 1. Active Employees (Count)
        const activeResult = await queryOne('SELECT count(*) as count FROM time_entries WHERE end_time IS NULL');
        const activeCount = activeResult?.count || 0;

        // 2. Pending Absences (Count)
        const pendingResult = await queryOne("SELECT count(*) as count FROM absence_requests WHERE status = 'PENDING'");
        const pendingAbsenceCount = pendingResult?.count || 0;

        // 3. Total Hours This Week (Aggregation)
        const now = new Date();
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        firstDay.setHours(0, 0, 0, 0);
        const firstDayStr = firstDay.toISOString().replace('T', ' ').split('.')[0];

        const hoursResult = await queryOne(`
            SELECT SUM((julianday(IFNULL(end_time, DATETIME('now'))) - julianday(start_time)) * 24) as total_hours 
            FROM time_entries 
            WHERE start_time >= ?
        `, [firstDayStr]);
        const totalHours = hoursResult?.total_hours || 0;

        // 4. Activity Feed / Live Status (List of active workers)
        const liveStatus = await query(`
            SELECT u.name as user_name, p.name as project_name, t.start_time
            FROM time_entries t
            JOIN users u ON t.user_id = u.id
            JOIN projects p ON t.project_id = p.id
            WHERE t.end_time IS NULL
            ORDER BY t.start_time DESC
        `);

        // 5. Users who haven't clocked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().replace('T', ' ').split('.')[0];

        const missingClockInUsers = await query(`
            SELECT id, name, email 
            FROM users 
            WHERE role != 'admin' 
            AND id NOT IN (
                SELECT user_id 
                FROM time_entries 
                WHERE start_time >= ?
            )
        `, [todayStr]);

        return NextResponse.json({
            metrics: {
                activeCount,
                pendingAbsenceCount,
                totalHours: Math.round(totalHours * 10) / 10
            },
            liveStatus,
            missingClockInUsers
        });

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
