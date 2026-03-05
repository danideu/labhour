'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TeamStatusWidget from '@/components/TeamStatusWidget';

// Convierte strings de Turso (UTC sin Z) a Date correctos
function parseUTC(str) {
    if (!str) return new Date(NaN);
    return new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T') + 'Z');
}

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            const [dashRes, chartRes] = await Promise.all([
                fetch('/api/admin/dashboard'),
                fetch('/api/admin/charts')
            ]);
            if (dashRes.ok) setData(await dashRes.json());
            if (chartRes.ok) setCharts(await chartRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando métricas...</div>;
    }

    if (!data) return <div className="p-8 text-center text-red-400">Error al cargar datos</div>;

    const maxProjectHours = charts?.hoursPerProject?.length > 0
        ? Math.max(...charts.hoursPerProject.map(p => p.total_hours || 0))
        : 1;

    const maxDayHours = charts?.hoursPerDay?.length > 0
        ? Math.max(...charts.hoursPerDay.map(d => d.total_hours || 0))
        : 1;

    function formatHoursMinutes(hours) {
        const h = Math.floor(hours || 0);
        const m = Math.round(((hours || 0) - h) * 60);
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Visión General
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Empleados Activos</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-4xl font-bold text-white">{data.metrics.activeCount}</p>
                        <span className="text-xs text-green-400 font-medium">En este momento</span>
                    </div>
                </div>

                <Link href="/admin/absences" className="glass-card p-6 relative overflow-hidden hover:border-yellow-500/30 transition-colors cursor-pointer group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider group-hover:text-yellow-400 transition-colors">Solicitudes Pendientes</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-4xl font-bold text-white">{data.metrics.pendingAbsenceCount}</p>
                        <span className="text-xs text-slate-500 font-medium">Requieren revisión →</span>
                    </div>
                </Link>

                <Link href="/admin/reports" className="glass-card p-6 relative overflow-hidden hover:border-blue-500/30 transition-colors cursor-pointer group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider group-hover:text-blue-400 transition-colors">Horas (Esta Semana)</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-4xl font-bold text-blue-400">{data.metrics.totalHours}</p>
                        <span className="text-xs text-slate-500 font-medium">Ver informes →</span>
                    </div>
                </Link>
            </div>

            {/* Live Activity - MOVED UP */}
            <div className="glass-card p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Actividad en Tiempo Real
                    </h2>
                    <span className="text-xs text-slate-500">Actualizado automáticamente</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-500 border-b border-white/5">
                                <th className="pb-3 font-medium">Empleado</th>
                                <th className="pb-3 font-medium">Proyecto / Obra</th>
                                <th className="pb-3 font-medium">Entrada</th>
                                <th className="pb-3 font-medium text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.liveStatus.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-6 text-center text-slate-500 italic">
                                        No hay empleados trabajando en este momento.
                                    </td>
                                </tr>
                            ) : (
                                data.liveStatus.map((item, i) => (
                                    <tr key={i} className="group">
                                        <td className="py-3 font-medium text-white">{item.user_name}</td>
                                        <td className="py-3 text-slate-300">{item.project_name}</td>
                                        <td className="py-3 text-slate-500">
                                            {parseUTC(item.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-3 text-right font-mono text-green-400">
                                            En curso
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Missing Clock-Ins */}
            <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Empleados Sin Fichar Hoy
                </h2>

                {data.missingClockInUsers?.length === 0 ? (
                    <p className="text-slate-500 italic">Todos los empleados han fichado hoy.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {data.missingClockInUsers?.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Team Status Widget */}
            <div className="mb-6">
                <TeamStatusWidget />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Hours per Project */}
                <Link href="/admin/projects" className="glass-card p-6 hover:border-purple-500/30 transition-colors cursor-pointer">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">📊 Horas por Proyecto (30 días)</h2>
                    {charts?.hoursPerProject?.length === 0 ? (
                        <p className="text-slate-500 text-sm">No hay datos</p>
                    ) : (
                        <div className="space-y-3">
                            {charts?.hoursPerProject?.map((project, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300 truncate max-w-[60%]">{project.project_name}</span>
                                        <span className="text-slate-400 font-mono">{formatHoursMinutes(project.total_hours)}</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${((project.total_hours || 0) / maxProjectHours) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Link>

                {/* Hours per Day */}
                <Link href="/admin/reports" className="glass-card p-6 hover:border-green-500/30 transition-colors cursor-pointer">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">📈 Horas por Día (7 días)</h2>
                    {charts?.hoursPerDay?.length === 0 ? (
                        <p className="text-slate-500 text-sm">No hay datos</p>
                    ) : (
                        <div className="flex items-end gap-2 h-32">
                            {charts?.hoursPerDay?.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <span className="text-xs text-slate-400 font-mono mb-1">
                                        {formatHoursMinutes(day.total_hours)}
                                    </span>
                                    <div
                                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all"
                                        style={{ height: `${Math.max(((day.total_hours || 0) / maxDayHours) * 100, 5)}%`, minHeight: '8px' }}
                                    />
                                    <span className="text-xs text-slate-500 mt-2">
                                        {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Link>
            </div>

            {/* Third Row */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Absences by Status */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">🗓️ Ausencias por Estado</h2>
                    <div className="space-y-2">
                        {charts?.absencesByStatus?.map((item, i) => (
                            <Link
                                key={i}
                                href={`/admin/absences?status=${item.status}`}
                                className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <span className={`text-sm font-medium ${item.status === 'APPROVED' ? 'text-green-400' :
                                    item.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                    {item.status === 'APPROVED' ? 'Aprobadas' : item.status === 'REJECTED' ? 'Rechazadas' : 'Pendientes'} →
                                </span>
                                <span className="text-xl font-bold text-white">{item.count}</span>
                            </Link>
                        ))}
                        {(!charts?.absencesByStatus || charts.absencesByStatus.length === 0) && (
                            <p className="text-slate-500 text-sm">Sin solicitudes</p>
                        )}
                    </div>
                </div>

                {/* Absences by Type */}
                <Link href="/admin/absences" className="glass-card p-6 hover:border-slate-500/30 transition-colors cursor-pointer">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">📋 Tipos de Ausencia (90 días)</h2>
                    <div className="space-y-2">
                        {charts?.absencesByType?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded bg-white/5">
                                <span className="text-sm text-slate-300">{item.type}</span>
                                <span className="text-lg font-bold text-white">{item.count}</span>
                            </div>
                        ))}
                        {(!charts?.absencesByType || charts.absencesByType.length === 0) && (
                            <p className="text-slate-500 text-sm">Sin datos</p>
                        )}
                    </div>
                </Link>

                {/* Top Employees */}
                <Link href="/admin/users" className="glass-card p-6 hover:border-yellow-500/30 transition-colors cursor-pointer">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">🏆 Top Empleados (Este Mes)</h2>
                    <div className="space-y-2">
                        {charts?.topEmployees?.map((emp, i) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded bg-white/5">
                                <span className="text-sm text-slate-300 flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' :
                                        i === 1 ? 'bg-slate-400 text-black' :
                                            i === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-slate-400'
                                        }`}>{i + 1}</span>
                                    {emp.user_name}
                                </span>
                                <span className="text-sm font-mono text-blue-400">{formatHoursMinutes(emp.total_hours)}</span>
                            </div>
                        ))}
                        {(!charts?.topEmployees || charts.topEmployees.length === 0) && (
                            <p className="text-slate-500 text-sm">Sin datos</p>
                        )}
                    </div>
                </Link>
            </div>
        </div>
    );
}
