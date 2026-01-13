'use client';

import { useState, useEffect } from 'react';
import AbsenceForm from '@/components/AbsenceForm';
import Modal from '@/components/Modal';

export default function AbsencesPage() {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAbsences();
    }, []);

    async function fetchAbsences() {
        try {
            const res = await fetch('/api/absences');
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

    function handleSuccess() {
        setIsModalOpen(false);
        fetchAbsences();
    }

    function getStatusColor(status) {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        }
    }

    function translateStatus(status) {
        switch (status) {
            case 'APPROVED': return 'Aprobada';
            case 'REJECTED': return 'Rechazada';
            default: return 'Pendiente';
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Ausencias y Permisos
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gestiona tus vacaciones y bajas médicas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary"
                >
                    Nueva Solicitud
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p className="text-slate-500">Cargando...</p>
                ) : absences.length === 0 ? (
                    <div className="col-span-full glass-card p-12 text-center text-slate-500">
                        No tienes solicitudes de ausencia registradas.
                    </div>
                ) : (
                    absences.map((absence) => (
                        <div key={absence.id} className="glass-card p-6 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</span>
                                    <p className="font-medium text-white">{absence.type}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(absence.status)}`}>
                                    {translateStatus(absence.status)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-slate-400 mb-4">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Desde:</span>
                                    <span className="text-slate-200">{new Date(absence.start_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Hasta:</span>
                                    <span className="text-slate-200">{new Date(absence.end_date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {absence.comments && (
                                <p className="text-xs text-slate-500 italic">"{absence.comments}"</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Solicitar Ausencia"
            >
                <AbsenceForm onSuccess={handleSuccess} />
            </Modal>
        </div>
    );
}
