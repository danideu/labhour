import { NextResponse } from 'next/server';
import { generateBackupSQL, uploadBackup } from '@/lib/backup';

// Esta ruta se ejecuta automáticamente por Vercel Cron
// Configurado en vercel.json para ejecutarse diariamente a las 3:00 AM

export async function GET(request) {
    try {
        // Verificar que la petición viene del cron de Vercel
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // En desarrollo permitir sin auth, en producción rechazar
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }
        }

        console.log('Iniciando backup automático...');

        // Generar SQL
        const sql = await generateBackupSQL();

        // Subir a Vercel Blob
        const result = await uploadBackup(sql);

        console.log('Backup completado:', result);

        return NextResponse.json({
            success: true,
            message: 'Backup completado correctamente',
            backup: result
        });

    } catch (error) {
        console.error('Error en backup:', error);
        return NextResponse.json({
            error: `Error al crear backup: ${error.message}`
        }, { status: 500 });
    }
}
