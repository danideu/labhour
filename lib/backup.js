import { put, list, del } from '@vercel/blob';
import { query } from '@/lib/db';

// Nombres de los días de la semana para rotación
const DAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/**
 * Genera un backup SQL de todas las tablas
 */
export async function generateBackupSQL() {
    const tables = [
        'users',
        'projects',
        'time_entries',
        'absence_requests',
        'notifications',
        'audit_logs',
        'login_attempts'
    ];

    let sql = `-- LabHour Backup\n`;
    sql += `-- Fecha: ${new Date().toISOString()}\n`;
    sql += `-- Día: ${DAYS[new Date().getDay()]}\n\n`;

    for (const table of tables) {
        try {
            // Obtener todos los registros
            const rows = await query(`SELECT * FROM ${table}`);

            if (rows.length === 0) {
                sql += `-- Tabla ${table}: vacía\n\n`;
                continue;
            }

            sql += `-- Tabla: ${table} (${rows.length} registros)\n`;
            sql += `DELETE FROM ${table};\n`;

            // Obtener nombres de columnas del primer registro
            const columns = Object.keys(rows[0]);

            for (const row of rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'number') return val;
                    // Escapar comillas simples
                    return `'${String(val).replace(/'/g, "''")}'`;
                });

                sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            sql += '\n';
        } catch (error) {
            sql += `-- Error en tabla ${table}: ${error.message}\n\n`;
        }
    }

    return sql;
}

/**
 * Sube el backup a Vercel Blob con nombre del día
 */
export async function uploadBackup(sqlContent) {
    const dayName = DAYS[new Date().getDay()];
    const fileName = `backup_${dayName}.sql`;

    // Primero intentar eliminar el backup anterior del mismo día
    try {
        const { blobs } = await list({ prefix: `backup_${dayName}` });
        for (const blob of blobs) {
            await del(blob.url);
        }
    } catch (error) {
        console.log('No previous backup to delete or error:', error.message);
    }

    // Subir nuevo backup
    const blob = await put(fileName, sqlContent, {
        access: 'public', // Cambia a 'private' si prefieres
        contentType: 'application/sql',
    });

    return {
        url: blob.url,
        fileName,
        size: sqlContent.length,
        createdAt: new Date().toISOString()
    };
}

/**
 * Lista todos los backups disponibles
 */
export async function listBackups() {
    const { blobs } = await list({ prefix: 'backup_' });

    return blobs.map(blob => ({
        name: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt
    })).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

/**
 * Elimina un backup específico
 */
export async function deleteBackup(url) {
    await del(url);
}
