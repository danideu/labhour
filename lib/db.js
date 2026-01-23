import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Create Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Track if db is initialized
let dbInitialized = false;
let initPromise = null;

// Initialize database tables
async function initDb() {
  if (dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log('Initializing Turso database tables...');

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTimeEntriesTable = `
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        original_entry_id INTEGER,
        correction_reason TEXT,
        entry_type TEXT CHECK(entry_type IN ('AUTO', 'MANUAL')) NOT NULL DEFAULT 'AUTO',
        validation_status TEXT CHECK(validation_status IN ('VALIDATED', 'PENDING', 'REJECTED')) NOT NULL DEFAULT 'VALIDATED',
        validated_by INTEGER,
        validated_at DATETIME,
        justification TEXT,
        server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (original_entry_id) REFERENCES time_entries(id),
        FOREIGN KEY (validated_by) REFERENCES users(id)
      );
    `;

    const createAbsencesTable = `
      CREATE TABLE IF NOT EXISTS absence_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        comments TEXT,
        admin_comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT 0,
        reference_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp_server DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        device_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        justification TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    await db.execute(createUsersTable);
    await db.execute(createProjectsTable);
    await db.execute(createTimeEntriesTable);
    await db.execute(createAbsencesTable);
    await db.execute(createNotificationsTable);
    await db.execute(createAuditLogsTable);

    // Seed default admin if no users exist
    const result = await db.execute('SELECT count(*) as count FROM users');
    const count = result.rows[0]?.count || 0;

    if (count === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.execute({
        sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        args: ['Administrador', 'admin@empresa.com', hashedPassword, 'admin']
      });
    }

    dbInitialized = true;
    console.log('Database initialized successfully!');
  })();

  return initPromise;
}

// Helper function to execute queries (maintains similar API to better-sqlite3)
export async function query(sql, args = []) {
  await initDb();
  const result = await db.execute({ sql, args });
  return result.rows;
}

export async function queryOne(sql, args = []) {
  await initDb();
  const result = await db.execute({ sql, args });
  return result.rows[0] || null;
}

export async function execute(sql, args = []) {
  await initDb();
  const result = await db.execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid,
    changes: result.rowsAffected
  };
}

export async function getDb() {
  await initDb();
  return { query, queryOne, execute };
}

// For backward compatibility
export default db;
