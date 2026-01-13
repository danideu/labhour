'use client';

import { useState, useEffect } from 'react';

export default function ProjectForm({ project, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        active: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                active: project.active === 1 || project.active === true,
            });
        }
    }, [project]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = project ? `/api/projects/${project.id}` : '/api/projects';
            const method = project ? 'PUT' : 'POST';

            const body = {
                name: formData.name,
                active: formData.active // Send boolean, backend handles conversion
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar proyecto');
            }

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
                <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Nombre del Proyecto / Obra</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Reforma C/ Mayor 12"
                    required
                />
            </div>

            {project && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                        style={{ width: 'auto' }}
                    />
                    <label htmlFor="active" className="text-sm font-medium text-slate-300">Proyecto Activo</label>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-outline"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Guardando...' : (project ? 'Actualizar' : 'Crear Proyecto')}
                </button>
            </div>
        </form>
    );
}
