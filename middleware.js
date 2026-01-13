import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

export async function middleware(request) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // 1. Redirect to dashboard if logged in and visiting login page
    if (pathname === '/' && session) {
        try {
            const { payload } = await jwtVerify(session.value, SECRET_KEY, { algorithms: ['HS256'] });
            // Redirect based on role
            return NextResponse.redirect(new URL(payload.role === 'admin' ? '/admin' : '/dashboard', request.url));
        } catch (e) {
            // Invalid token, ignore and let them login
        }
    }

    // 2. Protect /admin routes
    if (pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        try {
            const { payload } = await jwtVerify(session.value, SECRET_KEY, { algorithms: ['HS256'] });
            if (payload.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect to user dashboard if not admin
            }
        } catch (e) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 3. Protect /dashboard routes (User)
    if (pathname.startsWith('/dashboard')) {
        if (!session) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        try {
            await jwtVerify(session.value, SECRET_KEY, { algorithms: ['HS256'] });
        } catch (e) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/admin/:path*', '/dashboard/:path*'],
};
