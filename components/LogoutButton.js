'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ className, collapsed }) {
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''} ${className || ''}`}
            title="Cerrar Sesión"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            {!collapsed && <span>Cerrar Sesión</span>}
        </button>
    );
}
