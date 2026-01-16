'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';

export default function EmployeeLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const pathname = usePathname();

    useEffect(() => {
        const saved = localStorage.getItem('employee-sidebar-collapsed');
        if (saved === 'true') setCollapsed(true);

        // Fetch user name
        fetchUser();
    }, []);

    async function fetchUser() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user) setUserName(data.user.name);
            }
        } catch (err) {
            console.error(err);
        }
    }
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    function toggleSidebar() {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('employee-sidebar-collapsed', String(newState));
    }

    const navItems = [
        { href: '/dashboard', label: 'Fichar', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
        { href: '/dashboard/history', label: 'Historial', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg> },
        { href: '/dashboard/manual-entry', label: 'Imputar Jornada', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
        { href: '/dashboard/absences', label: 'Ausencias', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg> },
        { href: '/dashboard/profile', label: 'Mi Perfil', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Desktop Layout */}
            <div className={`hidden md:grid ${collapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[250px_1fr]'} min-h-screen transition-all duration-300`}>
                {/* Sidebar */}
                <aside className="border-r border-white/10 bg-black/40 backdrop-blur-xl p-4 flex flex-col">
                    <div className={`mb-6 ${collapsed ? 'text-center' : 'pl-3'}`}>
                        <div className={`flex items-center ${collapsed ? 'justify-center h-8' : 'justify-start h-12'}`}>
                            {collapsed ? (
                                <span className="font-black text-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">LH</span>
                            ) : (
                                <div className="h-12 flex items-center justify-start">
                                    <Logo className="text-3xl" />
                                </div>
                            )}
                        </div>
                        {!collapsed && <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Mi Espacio</p>}
                    </div>

                    <button
                        onClick={toggleSidebar}
                        className="mb-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center"
                        title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
                    >
                        {collapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        )}
                    </button>

                    <nav className="space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${collapsed ? 'justify-center' : ''} ${pathname === item.href ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                                title={item.label}
                            >
                                {item.icon}
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        ))}
                    </nav>

                    <div className={`mt-[100px] pt-4 border-t border-white/10 ${collapsed ? 'text-center' : ''}`}>
                        <LogoutButton collapsed={collapsed} />
                    </div>
                </aside>

                <main className="p-8 overflow-y-auto">
                    <header className="flex justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {userName ? userName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Bienvenido,</p>
                                <p className="font-semibold text-white">{userName || 'Cargando...'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <NotificationBell />
                        </div>
                    </header>
                    {children}
                </main>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex justify-between items-center">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                    </button>
                    <div className="h-8 flex items-center">
                        <Logo className="text-xl" />
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <NotificationBell />
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-8">
                                <div className="h-10 flex items-center">
                                    <Logo className="text-2xl" />
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {navItems.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg ${pathname === item.href ? 'bg-white/10 text-white' : 'text-slate-300'}`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Content */}
                <main className="flex-1 p-4 overflow-y-auto pb-24">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex justify-around items-center z-30">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${pathname === item.href ? 'text-white' : 'text-slate-500'}`}
                        >
                            {item.icon}
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
