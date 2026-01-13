'use client';

import { useState } from 'react';

export default function AbsenceForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        type: 'Vacaciones',
        startDate: '',
        endDate: '',
        comments: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/absences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Reset form
            setFormData({ type: 'Vacaciones', startDate: '', endDate: '', comments: '' });
            onSuccess();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-950/30 border border-red-900 rounded-md">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Tipo de Ausencia</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full"
                >
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="Asuntos Propios">Asuntos Propios</option>
                    <option value="Baja Médica">Baja Médica</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Fecha Inicio</label>
                    <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Fecha Fin</label>
                    <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Comentarios (Opcional)</label>
                <textarea
                    rows="3"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full"
                    placeholder="Ej: Viaje familiar..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
            >
                {loading ? 'Enviando...' : 'Solicitar Ausencia'}
            </button>
        </form>
    );
}
