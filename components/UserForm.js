'use client';

import { useState, useEffect } from 'react';

export default function UserForm({ user, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Blank for security, only send if changing
                confirmPassword: '',
                role: user.role,
            });
        }
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validar que las contraseñas coinciden al crear un nuevo usuario
        if (!user && formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const url = user ? `/api/users/${user.id}` : '/api/users';
            const method = user ? 'PUT' : 'POST';

            // Remove password and confirmPassword if empty on edit
            const body = { ...formData };
            delete body.confirmPassword; // Never send confirmPassword to API
            if (user && !body.password) {
                delete body.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar usuario');
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
                <label className="block text-sm font-medium mb-1 text-slate-300">Nombre Completo</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Email (Usuario)</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                    {user ? 'Contraseña (Dejar en blanco para mantener)' : 'Contraseña'}
                </label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!user}
                    placeholder={user ? "••••••••" : ""}
                />
            </div>

            {!user && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                        Confirmar Contraseña
                    </label>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        placeholder="Repite la contraseña"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Rol</label>
                <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                    <option value="employee">Empleado</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>

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
                    {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
                </button>
            </div>
        </form>
    );
}
