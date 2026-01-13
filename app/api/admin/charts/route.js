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
    // Hours per project (last 30 days) - using localtime and MAX to avoid negatives
    const hoursPerProject = db.prepare(`
      SELECT p.name as project_name, 
             SUM(MAX(0, (julianday(IFNULL(t.end_time, datetime('now', 'localtime'))) - julianday(t.start_time)) * 24)) as total_hours
      FROM time_entries t
      JOIN projects p ON t.project_id = p.id
      WHERE t.start_time >= datetime('now', 'localtime', '-30 days')
      GROUP BY t.project_id
      ORDER BY total_hours DESC
      LIMIT 10
    `).all();

    // Hours per day (last 7 days)
    const hoursPerDay = db.prepare(`
      SELECT DATE(start_time) as date,
             SUM(MAX(0, (julianday(IFNULL(end_time, datetime('now', 'localtime'))) - julianday(start_time)) * 24)) as total_hours
      FROM time_entries
      WHERE start_time >= datetime('now', 'localtime', '-7 days')
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `).all();

    // Absences by status
    const absencesByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM absence_requests
      GROUP BY status
    `).all();

    // Absences by type (last 90 days)
    const absencesByType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM absence_requests
      WHERE created_at >= datetime('now', 'localtime', '-90 days')
      GROUP BY type
      ORDER BY count DESC
    `).all();

    // Top employees by hours (this month)
    const topEmployees = db.prepare(`
      SELECT u.name as user_name,
             SUM(MAX(0, (julianday(IFNULL(t.end_time, datetime('now', 'localtime'))) - julianday(t.start_time)) * 24)) as total_hours
      FROM time_entries t
      JOIN users u ON t.user_id = u.id
      WHERE t.start_time >= datetime('now', 'localtime', 'start of month')
      GROUP BY t.user_id
      ORDER BY total_hours DESC
      LIMIT 5
    `).all();

    return NextResponse.json({
      hoursPerProject,
      hoursPerDay,
      absencesByStatus,
      absencesByType,
      topEmployees
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
