import db from './lib/db.js';

try {
    const users = db.prepare('SELECT * FROM users').all();
    console.log('Database connection successful.');
    console.log('Users found:', users.length);
    console.log('Admin user:', users.find(u => u.role === 'admin'));
} catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
}
