import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { isIpBlocked, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit';

export async function POST(request) {
    try {
        // Obtener IP del cliente
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        // Verificar si la IP está bloqueada
        const blockStatus = await isIpBlocked(ipAddress);
        if (blockStatus.blocked) {
            return NextResponse.json({
                error: `Tu IP está bloqueada. Inténtalo de nuevo en ${blockStatus.minutesLeft} minutos.`,
                blocked: true,
                minutesLeft: blockStatus.minutesLeft
            }, { status: 429 });
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }

        const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

        if (user && !user.active && user.active !== undefined) {
            return NextResponse.json({
                error: 'Esta cuenta ha sido desactivada. Contacta con un administrador.',
                blocked: true
            }, { status: 403 });
        }

        if (!user) {
            // Registrar intento fallido
            const attemptResult = await recordFailedAttempt(ipAddress, email);

            let errorMessage = 'Credenciales inválidas';
            if (attemptResult.warning) {
                errorMessage = attemptResult.warning;
            } else if (attemptResult.blocked) {
                errorMessage = attemptResult.message;
            }

            return NextResponse.json({
                error: errorMessage,
                attemptsLeft: attemptResult.attemptsLeft,
                blocked: attemptResult.blocked
            }, { status: attemptResult.blocked ? 429 : 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            // Registrar intento fallido
            const attemptResult = await recordFailedAttempt(ipAddress, email);

            let errorMessage = 'Credenciales inválidas';
            if (attemptResult.warning) {
                errorMessage = attemptResult.warning;
            } else if (attemptResult.blocked) {
                errorMessage = attemptResult.message;
            }

            return NextResponse.json({
                error: errorMessage,
                attemptsLeft: attemptResult.attemptsLeft,
                blocked: attemptResult.blocked
            }, { status: attemptResult.blocked ? 429 : 401 });
        }

        // Login exitoso - limpiar intentos fallidos
        await clearAttempts(ipAddress);

        // Create session
        await createSession({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
