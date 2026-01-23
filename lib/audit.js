import { execute, query } from './db';

/**
 * Create an audit log entry - IMMUTABLE record
 * This function should be called whenever a manual entry is created, edited, or validated
 */
export async function createAuditLog({
    userId,
    actionType,
    entityType,
    entityId,
    oldValues = null,
    newValues = null,
    deviceId = null,
    ipAddress = null,
    userAgent = null,
    justification = null
}) {
    const result = await execute(`
        INSERT INTO audit_logs (
            user_id, action_type, entity_type, entity_id,
            old_values, new_values, device_id, ip_address, user_agent, justification
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        userId,
        actionType,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        deviceId,
        ipAddress,
        userAgent,
        justification
    ]);

    return result.lastInsertRowid;
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(entityType, entityId) {
    return await query(`
        SELECT al.*, u.name as user_name
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = ? AND al.entity_id = ?
        ORDER BY al.timestamp_server DESC
    `, [entityType, entityId]);
}

/**
 * Get all audit logs with pagination
 */
export async function getAuditLogs({ userId = null, actionType = null, entityType = null, limit = 100, offset = 0 }) {
    let sql = `
        SELECT al.*, u.name as user_name
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (userId) {
        sql += ' AND al.user_id = ?';
        params.push(userId);
    }
    if (actionType) {
        sql += ' AND al.action_type = ?';
        params.push(actionType);
    }
    if (entityType) {
        sql += ' AND al.entity_type = ?';
        params.push(entityType);
    }

    sql += ' ORDER BY al.timestamp_server DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await query(sql, params);
}

/**
 * Action types for audit logging
 */
export const AUDIT_ACTIONS = {
    CREATE_MANUAL_ENTRY: 'CREATE_MANUAL_ENTRY',
    VALIDATE_ENTRY: 'VALIDATE_ENTRY',
    REJECT_ENTRY: 'REJECT_ENTRY',
    EDIT_ENTRY: 'EDIT_ENTRY',
};
