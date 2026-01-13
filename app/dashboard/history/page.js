'use client';

import { useState, useEffect } from 'react';

export default function HistoryPage() {
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);

    const [filters, setFilters] = useState({
        projectId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        // Load projects for filter dropdown
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(console.error);

        fetchHistory();
    }, []);

    async function fetchHistory() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.projectId) params.append('projectId', filters.projectId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await fetch(`/api/entries/history?${params}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries);
                setTotalHours(data.totalHours);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function formatDuration(start, end) {
        if (!end) return 'En curso';
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    function formatTotalHours(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Mi Historial
                </h1>
                <p className="text-slate-400 text-sm mt-1">Registro detallado de tus jornadas laborales</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Proyecto</label>
                        <select
                            className="w-full text-sm"
                            value={filters.projectId}
                            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                        >
                            <option value="">Todos los proyectos</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Desde</label>
                        <input
                            type="date"
                            className="w-full text-sm"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Hasta</label>
                        <input
                            type="date"
                            className="w-full text-sm"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? 'Buscando...' : 'Filtrar'}
                    </button>
                </div>
            </div>

            {/* Summary */}
            {totalHours > 0 && (
                <div className="glass-card p-4 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-sm font-medium uppercase">Total Horas Filtradas</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatTotalHours(totalHours)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm font-medium uppercase">Registros</p>
                            <p className="text-2xl font-bold text-slate-300 mt-1">{entries.length}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Proyecto</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium">Entrada</th>
                                <th className="p-4 font-medium">Salida</th>
                                <th className="p-4 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Cargando registros...</td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No tienes registros con estos filtros.</td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-slate-300">
                                            {new Date(entry.start_time).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </td>
                                        <td className="p-4 font-medium text-white">{entry.project_name}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-block text-xs px-2 py-0.5 rounded ${entry.entry_type === 'MANUAL'
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    }`}>
                                                    {entry.entry_type === 'MANUAL' ? 'MANUAL' : 'AUTO'}
                                                </span>
                                                {entry.entry_type === 'MANUAL' && entry.validation_status && (
                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded ${entry.validation_status === 'VALIDATED'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : entry.validation_status === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {entry.validation_status === 'VALIDATED' ? '✓ Aprobado' : entry.validation_status === 'PENDING' ? '⏳ Pendiente' : '✕ Rechazado'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {new Date(entry.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {entry.end_time ? new Date(entry.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-300">
                                            <span className={!entry.end_time ? "text-green-400 font-bold" : ""}>
                                                {formatDuration(entry.start_time, entry.end_time)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
