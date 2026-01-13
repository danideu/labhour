'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ManualEntryPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        projectId: '',
        date: '',
        startTime: '',
        endTime: '',
        justification: ''
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.filter(p => p.active));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/entries/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear la imputación');
            }

            setSuccess(data.message);
            setFormData({
                projectId: '',
                date: '',
                startTime: '',
                endTime: '',
                justification: ''
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    Volver al panel
                </Link>
            </div>

            <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">
                Imputación Manual de Jornada
            </h1>
            <p className="text-slate-400 text-sm mb-6">
                Introduce una jornada que no pudiste registrar en tiempo real. Requiere aprobación de un administrador.
            </p>

            {/* Legal Notice */}
            <div className="glass-card p-4 mb-6 border-l-4 border-amber-500/50">
                <div className="flex gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    <div className="text-sm text-slate-300">
                        <p className="font-medium text-amber-400 mb-1">Fichaje Extraordinario</p>
                        <p className="text-xs text-slate-400">
                            Esta imputación quedará registrada como "Manual" y será visible para la Inspección de Trabajo.
                            Incluye una justificación clara del motivo (olvido de fichaje, emergencia técnica, trabajo fuera del horario, etc.).
                        </p>
                    </div>
                </div>
            </div>

            {success && (
                <div className="glass-card p-4 mb-6 border border-green-500/30 bg-green-500/10">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        {success}
                    </p>
                </div>
            )}

            {error && (
                <div className="glass-card p-4 mb-6 border border-red-500/30 bg-red-500/10">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                {/* Project */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Obra / Proyecto *
                    </label>
                    <select
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        required
                        className="w-full"
                    >
                        <option value="">Selecciona un proyecto</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fecha de la Jornada *
                    </label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full"
                    />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Hora de Inicio *
                        </label>
                        <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Hora de Fin *
                        </label>
                        <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Justification */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Justificación * <span className="text-slate-500 font-normal">(mínimo 10 caracteres)</span>
                    </label>
                    <textarea
                        value={formData.justification}
                        onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                        placeholder="Ej: Olvido de fichaje al salir por urgencia familiar, trabajo en obra sin cobertura móvil, etc."
                        rows={4}
                        minLength={10}
                        required
                        className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {formData.justification.length}/10 caracteres mínimo
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={submitting || formData.justification.length < 10}
                    className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Enviando...' : 'Enviar Imputación para Validación'}
                </button>

                <p className="text-xs text-center text-slate-500">
                    Tu solicitud será revisada por un administrador antes de ser aprobada.
                </p>
            </form>
        </div>
    );
}
