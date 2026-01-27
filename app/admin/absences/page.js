'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';

function AdminAbsencesContent() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || '';

    const [absences, setAbsences] = useState([]);
    const [filteredAbsences, setFilteredAbsences] = useState([]);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [adminComment, setAdminComment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchAbsences();
    }, []);

    useEffect(() => {
        if (statusFilter) {
            setFilteredAbsences(absences.filter(a => a.status === statusFilter));
        } else {
            setFilteredAbsences(absences);
        }
    }, [absences, statusFilter]);

    async function fetchAbsences() {
        try {
            const res = await fetch('/api/admin/absences');
            if (res.ok) {
                const data = await res.json();
                setAbsences(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openActionModal(absence, status) {
        setSelectedAbsence(absence);
        setActionType(status);
        setAdminComment('');
        setModalOpen(true);
    }

    async function handleConfirmAction() {
        if (!selectedAbsence || !actionType) return;
        setProcessing(true);

        try {
            const res = await fetch('/api/admin/absences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedAbsence.id,
                    status: actionType,
                    adminComments: adminComment
                })
            });

            if (!res.ok) throw new Error('Error al actualizar');

            setModalOpen(false);
            fetchAbsences();

        } catch (err) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Control de Ausencias
            </h1>

            {/* Filter Bar */}
            <div className="glass-card p-4 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm text-slate-400">Filtrar por estado:</label>
                    <select
                        className="text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="APPROVED">Aprobadas</option>
                        <option value="REJECTED">Rechazadas</option>
                    </select>
                    <span className="text-xs text-slate-500">({filteredAbsences.length} solicitudes)</span>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                                <th className="p-4 font-medium">Empleado</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium">Fechas</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : filteredAbsences.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay solicitudes con este filtro.</td></tr>
                            ) : (
                                filteredAbsences.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{req.user_name}</td>
                                        <td className="p-4 text-slate-300">
                                            {req.type}
                                            {req.comments && <div className="text-xs text-slate-500 italic mt-1 max-w-xs truncate" title={req.comments}>"{req.comments}"</div>}
                                        </td>
                                        <td className="p-4 text-slate-400 whitespace-nowrap">
                                            {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {req.status === 'PENDING' ? (
                                                <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">PENDIENTE</span>
                                            ) : req.status === 'APPROVED' ? (
                                                <div>
                                                    <span className="text-green-400 font-bold text-xs bg-green-400/10 px-2 py-1 rounded border border-green-400/20">APROBADA</span>
                                                    {req.admin_comments && <div className="text-xs text-slate-500 mt-1">"{req.admin_comments}"</div>}
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-red-400 font-bold text-xs bg-red-400/10 px-2 py-1 rounded border border-red-400/20">RECHAZADA</span>
                                                    {req.admin_comments && <div className="text-xs text-slate-500 mt-1">"{req.admin_comments}"</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openActionModal(req, 'APPROVED')}
                                                        className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors border border-green-500/20"
                                                        title="Aprobar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal(req, 'REJECTED')}
                                                        className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                                        title="Rechazar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={actionType === 'APPROVED' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
            >
                {selectedAbsence && (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-slate-400">Empleado: <span className="text-white font-medium">{selectedAbsence.user_name}</span></p>
                            <p className="text-sm text-slate-400 mt-1">Tipo: <span className="text-white">{selectedAbsence.type}</span></p>
                            <p className="text-sm text-slate-400 mt-1">Fechas: <span className="text-white">{selectedAbsence.start_date} - {selectedAbsence.end_date}</span></p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">
                                Comentario para el empleado (opcional)
                            </label>
                            <textarea
                                rows="3"
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                className="w-full"
                                placeholder={actionType === 'APPROVED' ? 'Ej: Disfruta tus vacaciones...' : 'Ej: No hay cobertura esa semana...'}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="btn btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                disabled={processing}
                                className={`btn flex-1 ${actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                            >
                                {processing ? 'Procesando...' : (actionType === 'APPROVED' ? 'Aprobar' : 'Rechazar')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function AdminAbsencesPage() {
    return (
        <Suspense fallback={<div className="text-slate-400 text-center p-8">Cargando...</div>}>
            <AdminAbsencesContent />
        </Suspense>
    );
}
