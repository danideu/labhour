'use client';

import { useState, useEffect } from 'react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        actionType: '',
        entityType: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    async function fetchLogs() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.entityType) params.append('entityType', filters.entityType);

            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function exportToCSV() {
        const headers = ['ID', 'Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'Justificación', 'IP', 'Dispositivo'];
        const rows = logs.map(log => [
            log.id,
            new Date(log.timestamp_server).toLocaleString('es-ES'),
            log.user_name,
            log.action_type,
            log.entity_type,
            log.entity_id,
            log.justification || '',
            log.ip_address || '',
            log.device_id || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    function getActionBadgeClass(action) {
        if (action.includes('CREATE')) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (action.includes('VALIDATE')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (action.includes('REJECT')) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (action.includes('EDIT')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }

    function getActionLabel(action) {
        const labels = {
            'CREATE_MANUAL_ENTRY': 'Crear Imputación Manual',
            'VALIDATE_ENTRY': 'Aprobar Imputación',
            'REJECT_ENTRY': 'Rechazar Imputación',
            'EDIT_ENTRY': 'Editar Entrada'
        };
        return labels[action] || action;
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Registro de Auditoría
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Histórico inmutable de todas las acciones sobre imputaciones manuales
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={logs.length === 0}
                    className="btn btn-primary text-sm disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Exportar CSV
                </button>
            </div>

            {/* Legal Notice */}
            <div className="glass-card p-4 mb-6 border-l-4 border-purple-500/50">
                <div className="flex gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <div className="text-sm">
                        <p className="font-medium text-purple-400 mb-1">Registro Inmutable para Inspección</p>
                        <p className="text-xs text-slate-400">
                            Este log de auditoría es inmutable y cumple con los requisitos de la Inspección de Trabajo.
                            Se conserva durante un mínimo de 4 años y está disponible para consulta telemática instantánea.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1 uppercase">Tipo de Acción</label>
                        <select
                            value={filters.actionType}
                            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                            className="w-full text-sm"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="CREATE_MANUAL_ENTRY">Crear Imputación Manual</option>
                            <option value="VALIDATE_ENTRY">Aprobar Imputación</option>
                            <option value="REJECT_ENTRY">Rechazar Imputación</option>
                            <option value="EDIT_ENTRY">Editar Entrada</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1 uppercase">Tipo de Entidad</label>
                        <select
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                            className="w-full text-sm"
                        >
                            <option value="">Todas las entidades</option>
                            <option value="time_entry">Fichajes</option>
                        </select>
                    </div>
                    <div className="self-end">
                        <span className="text-xs text-slate-500">{logs.length} registros</span>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                                <th className="p-4 font-medium">Fecha/Hora Servidor</th>
                                <th className="p-4 font-medium">Usuario</th>
                                <th className="p-4 font-medium">Acción</th>
                                <th className="p-4 font-medium">ID Entidad</th>
                                <th className="p-4 font-medium">Justificación</th>
                                <th className="p-4 font-medium">IP / Dispositivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Cargando logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No hay registros de auditoría
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-white text-xs font-mono">
                                                {new Date(log.timestamp_server).toLocaleDateString('es-ES')}
                                            </div>
                                            <div className="text-slate-500 text-xs">
                                                {new Date(log.timestamp_server).toLocaleTimeString('es-ES')}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {log.user_name}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block text-xs px-2 py-1 rounded border ${getActionBadgeClass(log.action_type)}`}>
                                                {getActionLabel(log.action_type)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 font-mono text-xs">
                                            #{log.entity_id}
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="text-sm text-slate-300 line-clamp-2" title={log.justification}>
                                                {log.justification || <span className="text-slate-600">-</span>}
                                            </p>
                                        </td>
                                        <td className="p-4 text-xs">
                                            <div className="text-slate-400 font-mono truncate max-w-[120px]" title={log.ip_address}>
                                                {log.ip_address || '-'}
                                            </div>
                                            {log.device_id && (
                                                <div className="text-slate-600 truncate max-w-[120px]" title={log.device_id}>
                                                    {log.device_id}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-center">
                <p className="text-xs text-slate-600">
                    Los registros de auditoría son inmutables y no pueden ser modificados o eliminados.
                    Conservación mínima: 4 años según normativa laboral española.
                </p>
            </div>
        </div>
    );
}
