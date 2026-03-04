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

    function formatDurationPDF(hours) {
        const h = Math.floor(hours || 0);
        const m = Math.round(((hours || 0) - h) * 60);
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }

    function exportToPDF() {
        if (!reportData?.entries?.length) return;

        const userLabel = filters.userId
            ? users.find(u => String(u.id) === String(filters.userId))?.name || 'Todos'
            : 'Todos los empleados';
        const projectLabel = filters.projectId
            ? projects.find(p => String(p.id) === String(filters.projectId))?.name || 'Todos'
            : 'Todos los proyectos';

        const rows = reportData.entries.map(entry => `
            <tr>
                <td>${new Date(entry.start_time).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                <td>${entry.user_name}</td>
                <td>${entry.project_name}</td>
                <td class="mono">${new Date(entry.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="mono">${entry.end_time ? new Date(entry.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '<span class="badge-active">Activo</span>'}</td>
                <td class="mono right">${formatDurationPDF(entry.duration)}</td>
            </tr>
        `).join('');

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe LabHour — ${filters.startDate} a ${filters.endDate}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a1a2e; }
  .brand { font-size: 26px; font-weight: 900; letter-spacing: -1px; color: #1a1a2e; }
  .brand span { color: #4f46e5; }
  .meta { text-align: right; color: #555; font-size: 10px; line-height: 1.6; }
  .meta strong { font-size: 11px; color: #1a1a2e; }
  .filters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .filter-box { background: #f5f5fa; border-radius: 6px; padding: 10px 12px; }
  .filter-box .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 3px; }
  .filter-box .value { font-size: 11px; font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead tr { background: #1a1a2e; color: #fff; }
  thead th { padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #ebebf5; }
  tbody tr:nth-child(even) { background: #f9f9fd; }
  tbody tr:hover { background: #f0f0fb; }
  tbody td { padding: 8px 12px; vertical-align: middle; color: #333; }
  .mono { font-family: 'Courier New', monospace; }
  .right { text-align: right; font-weight: 600; }
  .badge-active { background: #d1fae5; color: #065f46; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
  tfoot tr { background: #1a1a2e; color: #fff; }
  tfoot td { padding: 10px 12px; font-weight: 700; font-size: 12px; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
  .summary-box { background: #f5f5fa; border-radius: 6px; padding: 12px 16px; }
  .summary-box .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
  .summary-box .value { font-size: 22px; font-weight: 900; color: #1a1a2e; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 9px; color: #aaa; text-align: center; }
  @media print {
    body { padding: 12px; }
    @page { margin: 1.2cm; size: A4 landscape; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Lab<span>Hour</span></div>
      <div style="font-size:10px; color:#888; margin-top:4px;">Sistema de Control Horario</div>
    </div>
    <div class="meta">
      <strong>Informe de Fichajes</strong><br>
      Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
      a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>

  <div class="filters">
    <div class="filter-box"><div class="label">Período desde</div><div class="value">${new Date(filters.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
    <div class="filter-box"><div class="label">Período hasta</div><div class="value">${new Date(filters.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
    <div class="filter-box"><div class="label">Empleado</div><div class="value">${userLabel}</div></div>
    <div class="filter-box"><div class="label">Proyecto</div><div class="value">${projectLabel}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Empleado</th>
        <th>Proyecto / Obra</th>
        <th>Entrada</th>
        <th>Salida</th>
        <th style="text-align:right;">Duración</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;">TOTAL HORAS:</td>
        <td style="text-align:right;">${formatDurationPDF(reportData.totalHours)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    <div class="summary-box"><div class="label">Total horas registradas</div><div class="value">${formatDurationPDF(reportData.totalHours)}</div></div>
    <div class="summary-box"><div class="label">Total registros</div><div class="value">${reportData.entries.length}</div></div>
  </div>

  <div class="footer">LabHour — Informe generado automáticamente. Documento válido para Inspección de Trabajo según RDL 8/2019.</div>
</body>
</html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();

        iframe.contentWindow.onafterprint = () => document.body.removeChild(iframe);
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 500);
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
                        onClick={exportToPDF}
                        disabled={!reportData?.entries?.length}
                        className="btn btn-outline px-6 flex items-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Exportar PDF
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
