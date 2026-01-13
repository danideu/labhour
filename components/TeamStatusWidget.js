'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function TeamStatusWidget() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [reminderMessage, setReminderMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState([]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    async function fetchStatus() {
        try {
            const res = await fetch('/api/admin/team-status');
            if (res.ok) {
                setData(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function sendReminder() {
        if (!selectedEmployee) return;
        setSending(true);

        try {
            const res = await fetch('/api/admin/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedEmployee.id,
                    message: reminderMessage
                })
            });

            if (res.ok) {
                setSentTo([...sentTo, selectedEmployee.id]);
                setSelectedEmployee(null);
                setReminderMessage('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-white/5 rounded"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                👥 Estado del Equipo
                <span className="text-xs font-normal text-slate-500">
                    ({data.clockedIn}/{data.totalEmployees} fichados)
                </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Not Clocked In */}
                <div>
                    <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        Faltan por fichar ({data.notClockedIn.length})
                    </h3>

                    {data.notClockedIn.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Todos han fichado ✓</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {data.notClockedIn.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">{emp.name}</p>
                                        <p className="text-xs text-slate-500">{emp.email}</p>
                                    </div>
                                    {sentTo.includes(emp.id) ? (
                                        <span className="text-xs text-green-400 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            Enviado
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedEmployee(emp)}
                                            className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                            title="Enviar recordatorio"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Out of Office */}
                <div>
                    <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        Fuera de oficina ({data.outOfOffice.length})
                    </h3>

                    {data.outOfOffice.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Nadie de baja hoy</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {data.outOfOffice.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                                    <div>
                                        <p className="text-sm font-medium text-white">{emp.name}</p>
                                        <p className="text-xs text-slate-500">{emp.email}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                                        {emp.reason}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reminder Modal - Mounted to body via portal */}
            {selectedEmployee && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-[#1a1a2e] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Enviar Recordatorio</h3>
                            <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Enviando recordatorio a <span className="text-white font-medium">{selectedEmployee.name}</span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">Mensaje (opcional)</label>
                            <textarea
                                value={reminderMessage}
                                onChange={(e) => setReminderMessage(e.target.value)}
                                placeholder="Recuerda fichar tu entrada..."
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedEmployee(null)}
                                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={sendReminder}
                                disabled={sending}
                                className="flex-1 py-2 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                                {sending ? 'Enviando...' : 'Enviar Recordatorio'}
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Se enviará como notificación in-app y por email.
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
