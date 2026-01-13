import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('database.sqlite', { verbose: console.log });

// Enable Write-Ahead Logging for better concurrency
db.pragma('journal_mode = WAL');

function initDb() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
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

  // Audit Logs table - IMMUTABLE (no updates or deletes allowed via app)
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

  db.exec(createUsersTable);
  db.exec(createProjectsTable);
  db.exec(createTimeEntriesTable);
  db.exec(createAbsencesTable);
  db.exec(createNotificationsTable);
  db.exec(createAuditLogsTable);

  // Migrations for existing databases
  const migrations = [
    'ALTER TABLE absence_requests ADD COLUMN admin_comments TEXT',
    'ALTER TABLE time_entries ADD COLUMN entry_type TEXT DEFAULT "AUTO"',
    'ALTER TABLE time_entries ADD COLUMN validation_status TEXT DEFAULT "VALIDATED"',
    'ALTER TABLE time_entries ADD COLUMN validated_by INTEGER',
    'ALTER TABLE time_entries ADD COLUMN validated_at DATETIME',
    'ALTER TABLE time_entries ADD COLUMN justification TEXT',
    'ALTER TABLE time_entries ADD COLUMN server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP',
  ];

  for (const migration of migrations) {
    try {
      db.exec(migration);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  // Seed default admin if no users exist
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get();

  if (result.count === 0) {
    console.log('Seeding default admin user...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    insertAdmin.run('Administrador', 'admin@empresa.com', hashedPassword, 'admin');
  }
}

// Run migrations on startup
initDb();

export default db;
