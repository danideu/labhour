'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

// Convierte strings de Turso (UTC sin Z) a Date correctos
function parseUTC(str) {
    if (!str) return new Date(NaN);
    return new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T') + 'Z');
}

export default function PendingEntriesPage() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [action, setAction] = useState(null);
    const [adminComment, setAdminComment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, [filter]);

    async function fetchEntries() {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/entries/validate?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(entry, actionType) {
        setSelectedEntry(entry);
        setAction(actionType);
        setAdminComment('');
        setModalOpen(true);
    }

    async function handleConfirm() {
        if (!selectedEntry || !action) return;
        setProcessing(true);

        try {
            const res = await fetch('/api/admin/entries/validate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entryId: selectedEntry.id,
                    action,
                    adminComment: adminComment.trim() || null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setModalOpen(false);
            fetchEntries();

        } catch (err) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    }

    function formatDate(dateStr) {
        return parseUTC(dateStr).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    function formatTime(dateStr) {
        return parseUTC(dateStr).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function calculateDuration(start, end) {
        const diff = parseUTC(end) - parseUTC(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m`;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">
                Validación de Imputaciones Manuales
            </h1>
            <p className="text-slate-400 text-sm mb-6">
                Revisa y aprueba o rechaza las jornadas registradas manualmente por los empleados.
            </p>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {['PENDING', 'VALIDATED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                            ? status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : status === 'VALIDATED' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {status === 'PENDING' ? 'Pendientes' : status === 'VALIDATED' ? 'Aprobadas' : 'Rechazadas'}
                    </button>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando...</div>
                ) : entries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No hay imputaciones {filter === 'PENDING' ? 'pendientes' : filter === 'VALIDATED' ? 'aprobadas' : 'rechazadas'}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {entries.map(entry => (
                            <div key={entry.id} className="p-4 hover:bg-white/5 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Employee & Project */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white">{entry.user_name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                                MANUAL
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{entry.project_name}</p>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="text-sm">
                                        <div className="text-slate-300">{formatDate(entry.start_time)}</div>
                                        <div className="text-slate-500">
                                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                            <span className="text-slate-600 ml-2">({calculateDuration(entry.start_time, entry.end_time)})</span>
                                        </div>
                                    </div>

                                    {/* Justification */}
                                    <div className="flex-1 max-w-xs">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Justificación:</p>
                                        <p className="text-sm text-slate-300 line-clamp-2" title={entry.justification}>
                                            "{entry.justification}"
                                        </p>
                                    </div>

                                    {/* Server Timestamp */}
                                    <div className="text-xs text-slate-600">
                                        <p>Registrado:</p>
                                        <p>{parseUTC(entry.server_timestamp || entry.created_at).toLocaleString('es-ES')}</p>
                                    </div>

                                    {/* Actions */}
                                    {filter === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(entry, 'VALIDATED')}
                                                className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => openModal(entry, 'REJECTED')}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={action === 'VALIDATED' ? 'Aprobar Imputación' : 'Rechazar Imputación'}
            >
                <div className="space-y-4">
                    {selectedEntry && (
                        <div className="bg-white/5 rounded-lg p-3 text-sm">
                            <p className="text-white font-medium">{selectedEntry.user_name}</p>
                            <p className="text-slate-400">{selectedEntry.project_name}</p>
                            <p className="text-slate-500 mt-1">
                                {formatDate(selectedEntry.start_time)}: {formatTime(selectedEntry.start_time)} - {formatTime(selectedEntry.end_time)}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Comentario {action === 'REJECTED' ? '(recomendado)' : '(opcional)'}
                        </label>
                        <textarea
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            placeholder={action === 'REJECTED' ? 'Indica el motivo del rechazo...' : 'Añade un comentario si lo deseas...'}
                            rows={3}
                            className="w-full"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setModalOpen(false)}
                            className="flex-1 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={processing}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${action === 'VALIDATED'
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                                } disabled:opacity-50`}
                        >
                            {processing ? 'Procesando...' : action === 'VALIDATED' ? 'Aprobar' : 'Rechazar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
