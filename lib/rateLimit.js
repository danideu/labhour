import { query, queryOne, execute } from './db';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 15;

/**
 * Verifica si una IP está bloqueada
 */
export async function isIpBlocked(ipAddress) {
    const record = await queryOne(
        `SELECT * FROM login_attempts 
         WHERE ip_address = ? 
         AND blocked_until IS NOT NULL 
         AND blocked_until > DATETIME('now')`,
        [ipAddress]
    );

    if (record) {
        const blockedUntil = new Date(record.blocked_until);
        const minutesLeft = Math.ceil((blockedUntil - new Date()) / (1000 * 60));
        return {
            blocked: true,
            minutesLeft,
            blockedUntil: record.blocked_until
        };
    }

    return { blocked: false };
}

/**
 * Registra un intento fallido de login
 */
export async function recordFailedAttempt(ipAddress, email) {
    // Buscar registro existente para esta IP
    const existing = await queryOne(
        `SELECT * FROM login_attempts 
         WHERE ip_address = ? 
         AND (blocked_until IS NULL OR blocked_until < DATETIME('now'))`,
        [ipAddress]
    );

    if (existing) {
        const newCount = existing.attempt_count + 1;

        if (newCount >= MAX_ATTEMPTS) {
            // Bloquear IP
            await execute(
                `UPDATE login_attempts 
                 SET attempt_count = ?, 
                     last_attempt = DATETIME('now'),
                     blocked_until = DATETIME('now', '+${BLOCK_DURATION_MINUTES} minutes'),
                     email = ?
                 WHERE id = ?`,
                [newCount, email, existing.id]
            );
            return {
                blocked: true,
                attemptsLeft: 0,
                message: `IP bloqueada por ${BLOCK_DURATION_MINUTES} minutos debido a demasiados intentos fallidos`
            };
        } else {
            // Incrementar contador
            await execute(
                `UPDATE login_attempts 
                 SET attempt_count = ?, 
                     last_attempt = DATETIME('now'),
                     email = ?
                 WHERE id = ?`,
                [newCount, email, existing.id]
            );

            const attemptsLeft = MAX_ATTEMPTS - newCount;
            return {
                blocked: false,
                attemptsLeft,
                warning: attemptsLeft === 1
                    ? '⚠️ ATENCIÓN: Un intento más y tu IP será bloqueada por 15 minutos'
                    : null
            };
        }
    } else {
        // Crear nuevo registro
        await execute(
            `INSERT INTO login_attempts (ip_address, email, attempt_count) VALUES (?, ?, 1)`,
            [ipAddress, email]
        );
        return {
            blocked: false,
            attemptsLeft: MAX_ATTEMPTS - 1,
            warning: null
        };
    }
}

/**
 * Limpia los intentos después de un login exitoso
 */
export async function clearAttempts(ipAddress) {
    await execute(
        `DELETE FROM login_attempts WHERE ip_address = ?`,
        [ipAddress]
    );
}

/**
 * Obtiene todas las IPs bloqueadas (para panel de admin)
 */
export async function getBlockedIps() {
    const blocked = await query(
        `SELECT * FROM login_attempts 
         WHERE blocked_until IS NOT NULL 
         AND blocked_until > DATETIME('now')
         ORDER BY blocked_until DESC`
    );
    return blocked;
}

/**
 * Desbloquea una IP específica (para admin)
 */
export async function unblockIp(ipAddress) {
    await execute(
        `DELETE FROM login_attempts WHERE ip_address = ?`,
        [ipAddress]
    );
    return { success: true };
}

/**
 * Obtiene historial de intentos de login
 */
export async function getLoginAttemptsHistory() {
    const attempts = await query(
        `SELECT * FROM login_attempts 
         ORDER BY last_attempt DESC
         LIMIT 100`
    );
    return attempts;
}
