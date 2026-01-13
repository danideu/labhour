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

export async function PUT(request, { params }) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    try {
        const { name, active } = await request.json();

        const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
        const existingProject = projectStmt.get(id);

        if (!existingProject) {
            return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
        }

        if (name && name !== existingProject.name) {
            const checkStmt = db.prepare('SELECT id FROM projects WHERE name = ?');
            if (checkStmt.get(name)) {
                return NextResponse.json({ error: 'Ya existe un proyecto con este nombre' }, { status: 409 });
            }
        }

        const updateStmt = db.prepare('UPDATE projects SET name = ?, active = ? WHERE id = ?');
        updateStmt.run(
            name || existingProject.name,
            active !== undefined ? (active ? 1 : 0) : existingProject.active,
            id
        );

        return NextResponse.json({ success: true, message: 'Proyecto actualizado' });

    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Error al actualizar proyecto' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    if (!await ensureAdmin()) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    try {
        // Check references in time_entries
        const checkStmt = db.prepare('SELECT count(*) as count FROM time_entries WHERE project_id = ?');
        const result = checkStmt.get(id);

        if (result.count > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar el proyecto porque tiene registros de tiempo asociados. Puedes desactivarlo ("Archivar") en su lugar.'
            }, { status: 400 });
        }

        const deleteStmt = db.prepare('DELETE FROM projects WHERE id = ?');
        deleteStmt.run(id);

        return NextResponse.json({ success: true, message: 'Proyecto eliminado' });

    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
    }
}
