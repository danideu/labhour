import { execute, query, queryOne } from './db';

/**
 * Crea una notificación para un usuario
 */
export async function createNotification({ userId, type, title, message, referenceId = null }) {
    return await execute(`
        INSERT INTO notifications (user_id, type, title, message, reference_id)
        VALUES (?, ?, ?, ?, ?)
    `, [userId, type, title, message, referenceId]);
}

/**
 * Notifica a todos los administradores
 */
export async function notifyAllAdmins({ type, title, message, referenceId = null }) {
    const admins = await query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
        await createNotification({ userId: admin.id, type, title, message, referenceId });
    }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getNotifications(userId, limit = 20) {
    return await query(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    `, [userId, limit]);
}

/**
 * Cuenta notificaciones no leídas
 */
export async function getUnreadCount(userId) {
    const result = await queryOne('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0', [userId]);
    return result?.count || 0;
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(notificationId, userId) {
    return await execute('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllAsRead(userId) {
    return await execute('UPDATE notifications SET read = 1 WHERE user_id = ?', [userId]);
}
