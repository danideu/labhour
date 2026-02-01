import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateBackupSQL, uploadBackup, listBackups, deleteBackup } from '@/lib/backup';

// GET - Listar backups o crear uno nuevo
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // Crear backup manual
        if (action === 'create') {
            console.log('Creando backup manual...');
            const sql = await generateBackupSQL();
            const result = await uploadBackup(sql);

            return NextResponse.json({
                success: true,
                message: 'Backup creado correctamente',
                backup: result
            });
        }

        // Listar backups
        const backups = await listBackups();
        return NextResponse.json(backups);

    } catch (error) {
        console.error('Error en backup:', error);
        return NextResponse.json({
            error: `Error: ${error.message}`
        }, { status: 500 });
    }
}

// DELETE - Eliminar un backup
export async function DELETE(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        await deleteBackup(url);

        return NextResponse.json({
            success: true,
            message: 'Backup eliminado correctamente'
        });

    } catch (error) {
        console.error('Error eliminando backup:', error);
        return NextResponse.json({
            error: `Error: ${error.message}`
        }, { status: 500 });
    }
}
