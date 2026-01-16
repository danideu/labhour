import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request) {
    try {
        // Optional: Verify Authorization header (e.g. CRON_SECRET)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

        // Check if it's a weekend (0 or 6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return NextResponse.json({ message: 'Weekend - no checks needed' });
        }

        // Logic runs for Monday (1) through Friday (5)

        // Get start and end of today in local time (server time) as ISO string prefixes or date comparison
        // Better-sqlite3 stores dates as strings usually. We'll use SQLite date functions for reliability.
        const todayStr = now.toISOString().split('T')[0];

        // 1. Get all active employees
        const employees = db.prepare("SELECT id, name, email FROM users WHERE role = 'employee'").all();

        // 2. Get users who have clocked in today
        const todaysEntries = db.prepare(`
            SELECT DISTINCT user_id 
            FROM time_entries 
            WHERE date(start_time) = date('now', 'localtime')
        `).all();

        const clockedInUserIds = new Set(todaysEntries.map(e => e.user_id));

        // 3. Get users with approved absences covering today
        const absentUsers = db.prepare(`
            SELECT DISTINCT user_id 
            FROM absence_requests 
            WHERE status = 'APPROVED'
            AND date(start_date) <= date('now', 'localtime')
            AND date(end_date) >= date('now', 'localtime')
        `).all();

        const absentUserIds = new Set(absentUsers.map(a => a.user_id));

        // 4. Identify users to notify
        // Users who are NOT in clockedInUserIds AND NOT in absentUserIds
        const usersToNotify = employees.filter(user =>
            !clockedInUserIds.has(user.id) && !absentUserIds.has(user.id)
        );

        let notificationsSent = 0;

        for (const user of usersToNotify) {
            // Check if we already sent a reminder today to avoid spamming if cron runs multiple times
            const existingNotification = db.prepare(`
                SELECT id FROM notifications 
                WHERE user_id = ? 
                AND type = 'CLOCK_IN_REMINDER' 
                AND date(created_at) = date('now', 'localtime')
            `).get(user.id);

            if (!existingNotification) {
                createNotification({
                    userId: user.id,
                    type: 'CLOCK_IN_REMINDER',
                    title: '¡No has fichado!',
                    message: `Hola ${user.name}, son más de las 08:00 y no hemos registrado tu entrada de hoy. Por favor, accede para fichar o justificar tu ausencia.`,
                    referenceId: null
                });
                notificationsSent++;
            }
        }

        return NextResponse.json({
            success: true,
            checkedDatabaseDate: todayStr,
            dayOfWeek,
            totalEmployees: employees.length,
            clockedInCount: clockedInUserIds.size,
            absentCount: absentUserIds.size,
            notificationsSent,
            notifyList: usersToNotify.map(u => u.name)
        });

    } catch (error) {
        console.error('Error checking clock-ins:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
