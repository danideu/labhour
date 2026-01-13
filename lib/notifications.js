import db from './db';

/**
 * Crea una notificación para un usuario
 */
export function createNotification({ userId, type, title, message, referenceId = null }) {
    const stmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, reference_id)
    VALUES (?, ?, ?, ?, ?)
  `);
    return stmt.run(userId, type, title, message, referenceId);
}

/**
 * Notifica a todos los administradores
 */
export function notifyAllAdmins({ type, title, message, referenceId = null }) {
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    for (const admin of admins) {
        createNotification({ userId: admin.id, type, title, message, referenceId });
    }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export function getNotifications(userId, limit = 20) {
    const stmt = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
    return stmt.all(userId, limit);
}

/**
 * Cuenta notificaciones no leídas
 */
export function getUnreadCount(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0');
    return stmt.get(userId).count;
}

/**
 * Marca una notificación como leída
 */
export function markAsRead(notificationId, userId) {
    const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?');
    return stmt.run(notificationId, userId);
}

/**
 * Marca todas las notificaciones como leídas
 */
export function markAllAsRead(userId) {
    const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?');
    return stmt.run(userId);
}
