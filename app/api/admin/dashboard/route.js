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

export async function GET() {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // 1. Active Employees (Count)
        const activeCountStmt = db.prepare('SELECT count(*) as count FROM time_entries WHERE end_time IS NULL');
        const activeCount = activeCountStmt.get().count;

        // 2. Pending Absences (Count)
        const pendingAbsenceStmt = db.prepare("SELECT count(*) as count FROM absence_requests WHERE status = 'PENDING'");
        const pendingAbsenceCount = pendingAbsenceStmt.get().count;

        // 3. Total Hours This Week (Aggregation)
        // Get start of week (Monday)
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        const day = startOfWeek.getDay() || 7;
        startOfWeek.setDate(startOfWeek.getDate() + 1 - day + (day === 0 ? -6 : 1) - 7); // Adjust logic for Monday start/Sunday issues if needed, simplification:
        // Actually, SQL 'now' modifiers are easier if we trust DB time
        // Let's do JS calculation for simplicity and control
        const now = new Date();
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        firstDay.setHours(0, 0, 0, 0);
        const firstDayStr = firstDay.toISOString().replace('T', ' ').split('.')[0];

        const hoursStmt = db.prepare(`
        SELECT SUM((julianday(IFNULL(end_time, DATETIME('now'))) - julianday(start_time)) * 24) as total_hours 
        FROM time_entries 
        WHERE start_time >= ?
    `);
        const totalHours = hoursStmt.get(firstDayStr).total_hours || 0;


        // 4. Activity Feed / Live Status (List of active workers)
        const liveStatusStmt = db.prepare(`
      SELECT u.name as user_name, p.name as project_name, t.start_time
      FROM time_entries t
      JOIN users u ON t.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.end_time IS NULL
      ORDER BY t.start_time DESC
    `);
        const liveStatus = liveStatusStmt.all();

        // 5. Recent completed entries (Project Distribution Data - Simplification for now)
        // Let's just return what we have

        return NextResponse.json({
            metrics: {
                activeCount,
                pendingAbsenceCount,
                totalHours: Math.round(totalHours * 10) / 10 // Round to 1 decimal
            },
            liveStatus
        });

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
    }
}
