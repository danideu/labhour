'use client';

// Convierte strings de Turso (UTC sin Z) a Date correctos
function parseUTC(str) {
    if (!str) return new Date(NaN);
    return new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T') + 'Z');
}

function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export default function ReportsTable({ entries, totalHours }) {
    if (!entries || entries.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-slate-500">
                <p>No se encontraron registros con los filtros seleccionados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Horas</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatDuration(totalHours)}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Registros</p>
                    <p className="text-3xl font-bold text-slate-300 mt-1">{entries.length}</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Empleado</th>
                                <th className="p-4 font-medium">Proyecto</th>
                                <th className="p-4 font-medium">Entrada</th>
                                <th className="p-4 font-medium">Salida</th>
                                <th className="p-4 font-medium text-right">Duración</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-slate-300 whitespace-nowrap">
                                        {parseUTC(entry.start_time).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="p-4 font-medium text-white">{entry.user_name}</td>
                                    <td className="p-4 text-slate-300">{entry.project_name}</td>
                                    <td className="p-4 text-slate-400 font-mono">
                                        {parseUTC(entry.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-slate-400 font-mono">
                                        {entry.end_time ? parseUTC(entry.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) :
                                            <span className="text-green-500 text-xs px-2 py-1 bg-green-500/10 rounded-full">Activo</span>
                                        }
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-300">
                                        {formatDuration(entry.duration)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
