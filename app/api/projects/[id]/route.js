import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
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

    const { id } = await params;

    try {
        const { name, active } = await request.json();

        const existingProject = await queryOne('SELECT * FROM projects WHERE id = ?', [id]);

        if (!existingProject) {
            return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
        }

        if (name && name !== existingProject.name) {
            const duplicateName = await queryOne('SELECT id FROM projects WHERE name = ?', [name]);
            if (duplicateName) {
                return NextResponse.json({ error: 'Ya existe un proyecto con este nombre' }, { status: 409 });
            }
        }

        await execute('UPDATE projects SET name = ?, active = ? WHERE id = ?', [
            name || existingProject.name,
            active !== undefined ? (active ? 1 : 0) : existingProject.active,
            id
        ]);

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

    const { id } = await params;

    try {
        // Check references in time_entries
        const result = await queryOne('SELECT count(*) as count FROM time_entries WHERE project_id = ?', [id]);

        if (result.count > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar el proyecto porque tiene registros de tiempo asociados. Puedes desactivarlo ("Archivar") en su lugar.'
            }, { status: 400 });
        }

        await execute('DELETE FROM projects WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Proyecto eliminado' });

    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Error al eliminar proyecto' }, { status: 500 });
    }
}
