'use client';

import { useState, useEffect } from 'react';
import ReportsTable from '@/components/ReportsTable';

export default function ReportsPage() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);

    const [filters, setFilters] = useState({
        userId: '',
        projectId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/users').then(res => res.json()),
            fetch('/api/projects').then(res => res.json())
        ]).then(([userData, projectData]) => {
            setUsers(userData);
            setProjects(projectData);
            generateReport();
        });
    }, []);

    async function generateReport() {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            if (!filters.userId) params.delete('userId');
            if (!filters.projectId) params.delete('projectId');

            const res = await fetch(`/api/admin/reports?${params}`);
            const data = await res.json();
            setReportData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function exportToCSV() {
        if (!reportData?.entries?.length) return;

        const headers = ['Fecha', 'Empleado', 'Proyecto', 'Entrada', 'Salida', 'Duración (horas)'];
        const rows = reportData.entries.map(entry => [
            new Date(entry.start_time).toLocaleDateString('es-ES'),
            entry.user_name,
            entry.project_name,
            new Date(entry.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            entry.end_time ? new Date(entry.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'En curso',
            entry.duration ? entry.duration.toFixed(2) : '0.00'
        ]);

        // Add total row
        rows.push(['', '', '', '', 'TOTAL:', reportData.totalHours.toFixed(2)]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `informe_${filters.startDate}_${filters.endDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Informes y Exportación
            </h1>

            {/* Filters Bar */}
            <div className="glass-card p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Empleado</label>
                        <select
                            className="w-full text-sm"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                        >
                            <option value="">Todos los empleados</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

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
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    <button
                        onClick={exportToCSV}
                        disabled={!reportData?.entries?.length}
                        className="btn btn-outline px-6 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        Exportar CSV
                    </button>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="btn btn-primary px-8"
                    >
                        {loading ? 'Generando...' : 'Filtrar Informe'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Procesando datos...</div>
            ) : (
                reportData && <ReportsTable entries={reportData.entries} totalHours={reportData.totalHours} />
            )}
        </div>
    );
}
