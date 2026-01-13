import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');
const ALG = 'HS256';

export async function createSession(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(SECRET_KEY);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60, // 8 hours
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session.value, SECRET_KEY, {
            algorithms: [ALG],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
