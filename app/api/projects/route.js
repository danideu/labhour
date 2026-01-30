import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const projects = await query('SELECT * FROM projects ORDER BY active DESC, name ASC');
        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Error al obtener proyectos' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name } = await request.json();

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'El nombre del proyecto es requerido' }, { status: 400 });
        }

        const trimmedName = name.trim();

        const existingProject = await queryOne('SELECT id FROM projects WHERE name = ?', [trimmedName]);
        if (existingProject) {
            return NextResponse.json({ error: 'Ya existe un proyecto con este nombre' }, { status: 409 });
        }

        const result = await execute('INSERT INTO projects (name) VALUES (?)', [trimmedName]);

        return NextResponse.json({
            success: true,
            project: { id: Number(result.lastInsertRowid), name: trimmedName, active: 1 }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: `Error al crear proyecto: ${error.message}` }, { status: 500 });
    }
}
