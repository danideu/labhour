'use client';

import { useState, useEffect } from 'react';

export default function BackupsPage() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    async function fetchBackups() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/backup');
            if (res.ok) {
                const data = await res.json();
                setBackups(data);
            }
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
        setLoading(false);
    }

    async function createBackup() {
        setCreating(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/backup?action=create');
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchBackups();
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al crear backup' });
        }
        setCreating(false);
        setTimeout(() => setMessage(null), 5000);
    }

    async function deleteBackup(url, name) {
        if (!confirm(`¿Eliminar ${name}?`)) return;

        try {
            const res = await fetch('/api/admin/backup', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchBackups();
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar backup' });
        }
        setTimeout(() => setMessage(null), 5000);
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function getDayFromName(name) {
        const match = name.match(/backup_(\w+)\.sql/);
        if (match) {
            const days = {
                'domingo': 'Domingo',
                'lunes': 'Lunes',
                'martes': 'Martes',
                'miercoles': 'Miércoles',
                'jueves': 'Jueves',
                'viernes': 'Viernes',
                'sabado': 'Sábado'
            };
            return days[match[1]] || match[1];
        }
        return name;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                        Backups de Base de Datos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Sistema de backups automático con rotación de 7 días
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchBackups}
                        className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                    >
                        🔄 Actualizar
                    </button>
                    <button
                        onClick={createBackup}
                        disabled={creating}
                        className="btn btn-primary"
                    >
                        {creating ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Creando...
                            </>
                        ) : (
                            <>💾 Crear Backup Ahora</>
                        )}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-950/50 border border-green-900 text-green-400'
                        : 'bg-red-950/50 border border-red-900 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Info box */}
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-2">ℹ️ Información</h3>
                <ul className="text-sm text-blue-300/80 space-y-1">
                    <li>• Los backups se crean <strong>automáticamente cada día a las 3:00 AM</strong></li>
                    <li>• Se mantienen <strong>7 backups</strong> (uno por día de la semana)</li>
                    <li>• Cada nuevo backup del mismo día sobrescribe el anterior</li>
                    <li>• Puedes crear un backup manual en cualquier momento</li>
                </ul>
            </div>

            {/* Backups list */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-slate-500 mt-4">Cargando backups...</p>
                    </div>
                ) : backups.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="text-4xl mb-4">📭</div>
                        <p>No hay backups disponibles</p>
                        <p className="text-sm mt-2">Crea el primer backup manualmente o espera a la ejecución automática</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="border-b border-white/10">
                            <tr className="text-slate-400 text-sm">
                                <th className="p-4 text-left font-medium">Día</th>
                                <th className="p-4 text-left font-medium">Archivo</th>
                                <th className="p-4 text-left font-medium">Tamaño</th>
                                <th className="p-4 text-left font-medium">Fecha</th>
                                <th className="p-4 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {backups.map((backup) => (
                                <tr key={backup.url} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
                                            {getDayFromName(backup.name)}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-slate-300">
                                        {backup.name}
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {formatSize(backup.size)}
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {formatDate(backup.uploadedAt)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <a
                                            href={backup.url}
                                            download
                                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors mr-2"
                                        >
                                            ⬇️ Descargar
                                        </a>
                                        <button
                                            onClick={() => deleteBackup(backup.url, backup.name)}
                                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
