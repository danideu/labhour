import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request) {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

        // Check if it's a weekend (0 or 6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return NextResponse.json({ message: 'Weekend - no checks needed' });
        }

        const todayStr = now.toISOString().split('T')[0];

        // 1. Get all active employees
        const employees = await query("SELECT id, name, email FROM users WHERE role = 'employee'");

        // 2. Get users who have clocked in today
        const todaysEntries = await query(`
            SELECT DISTINCT user_id 
            FROM time_entries 
            WHERE date(start_time) = date('now', 'localtime')
        `);

        const clockedInUserIds = new Set(todaysEntries.map(e => e.user_id));

        // 3. Get users with approved absences covering today
        const absentUsers = await query(`
            SELECT DISTINCT user_id 
            FROM absence_requests 
            WHERE status = 'APPROVED'
            AND date(start_date) <= date('now', 'localtime')
            AND date(end_date) >= date('now', 'localtime')
        `);

        const absentUserIds = new Set(absentUsers.map(a => a.user_id));

        // 4. Identify users to notify
        const usersToNotify = employees.filter(user =>
            !clockedInUserIds.has(user.id) && !absentUserIds.has(user.id)
        );

        let notificationsSent = 0;

        for (const user of usersToNotify) {
            // Check if we already sent a reminder today
            const existingNotification = await queryOne(`
                SELECT id FROM notifications 
                WHERE user_id = ? 
                AND type = 'CLOCK_IN_REMINDER' 
                AND date(created_at) = date('now', 'localtime')
            `, [user.id]);

            if (!existingNotification) {
                await createNotification({
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
