import { createClient } from '@libsql/client';

// Configuración de Turso
const db = createClient({
    url: 'libsql://labhour-danideu.aws-eu-west-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanDatabase() {
    console.log('🧹 Limpiando base de datos Turso...\n');

    try {
        // Eliminar datos en orden correcto (por foreign keys)
        const tables = [
            'audit_logs',
            'notifications',
            'absence_requests',
            'time_entries',
            'projects',
            'users'
        ];

        for (const table of tables) {
            const result = await db.execute(`DELETE FROM ${table}`);
            console.log(`✅ Tabla ${table} limpiada (${result.rowsAffected} registros eliminados)`);
        }

        console.log('\n🎉 ¡Base de datos limpiada correctamente!');
        console.log('📝 Nota: Las tablas siguen existiendo, solo se eliminaron los datos.');
        console.log('🔐 Al iniciar la app, se creará automáticamente el usuario admin por defecto.');

    } catch (error) {
        console.error('❌ Error al limpiar la base de datos:', error.message);
    }
}

cleanDatabase();
