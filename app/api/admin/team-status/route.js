import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Get all active employees
        const allEmployees = db.prepare(`
            SELECT id, name, email FROM users WHERE role = 'employee'
        `).all();

        // Get employees who are currently clocked in
        const clockedInEmployees = db.prepare(`
            SELECT DISTINCT user_id FROM time_entries WHERE end_time IS NULL
        `).all().map(e => e.user_id);

        // Get employees who have approved absences for today
        const today = new Date().toISOString().split('T')[0];
        const absentEmployees = db.prepare(`
            SELECT ar.user_id, ar.type, u.name, u.email
            FROM absence_requests ar
            JOIN users u ON ar.user_id = u.id
            WHERE ar.status = 'APPROVED'
            AND ar.start_date <= ?
            AND ar.end_date >= ?
        `).all(today, today);

        const absentUserIds = absentEmployees.map(e => e.user_id);

        // Calculate who hasn't clocked in (excluding those who are absent)
        const notClockedIn = allEmployees.filter(
            e => !clockedInEmployees.includes(e.id) && !absentUserIds.includes(e.id)
        );

        // Format absence types for display
        const absenceTypeLabels = {
            'vacation': 'Vacaciones',
            'sick': 'Baja médica',
            'personal': 'Asuntos propios',
            'maternity': 'Maternidad/Paternidad',
            'other': 'Otro'
        };

        const outOfOffice = absentEmployees.map(e => ({
            id: e.user_id,
            name: e.name,
            email: e.email,
            reason: absenceTypeLabels[e.type] || e.type
        }));

        return NextResponse.json({
            notClockedIn,
            outOfOffice,
            totalEmployees: allEmployees.length,
            clockedIn: clockedInEmployees.length
        });

    } catch (error) {
        console.error('Error getting team status:', error);
        return NextResponse.json({ error: 'Error al obtener estado del equipo' }, { status: 500 });
    }
}
