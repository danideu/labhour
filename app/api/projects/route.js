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
    // Projects might be needed by employees too (to select one), so we might loosen auth here later
    // or create a separate public/employee endpoint. For now, let's allow authenticated users to view active projects
    // but let's stick to the Admin Management context first.

    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // If admin, return all. If employee, maybe only active ones?
        // For this specific management route, let's assume it's for the admin table.
        // We will create a robust query.

        const stmt = db.prepare('SELECT * FROM projects ORDER BY active DESC, name ASC');
        const projects = stmt.all();
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'El nombre del proyecto es requerido' }, { status: 400 });
        }

        const checkStmt = db.prepare('SELECT id FROM projects WHERE name = ?');
        if (checkStmt.get(name)) {
            return NextResponse.json({ error: 'Ya existe un proyecto con este nombre' }, { status: 409 });
        }

        const insertStmt = db.prepare('INSERT INTO projects (name) VALUES (?)');
        const result = insertStmt.run(name);

        return NextResponse.json({
            success: true,
            project: { id: result.lastInsertRowid, name, active: 1 }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 });
    }
}
