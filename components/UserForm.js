'use client';

import { useState, useEffect } from 'react';

// Iconos de ojo
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        // Validar contraseña si se ha introducido una (obligatorio al crear, opcional al editar)
        if (formData.password) {
            if (formData.password.length < 8) {
                setError('La contraseña debe tener al menos 8 caracteres');
                setLoading(false);
                return;
            }
            const hasUpperCase = /[A-Z]/.test(formData.password);
            const hasLowerCase = /[a-z]/.test(formData.password);
            const hasNumber = /[0-9]/.test(formData.password);
            if (!hasUpperCase || !hasLowerCase || !hasNumber) {
                setError('La contraseña debe incluir al menos una mayúscula, una minúscula y un número');
                setLoading(false);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                setLoading(false);
                return;
            }
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
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!user}
                        placeholder={user ? "••••••••" : ""}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
                {(!user || formData.password) && (
                    <p className="mt-1.5 text-xs text-slate-500">
                        Mínimo 8 caracteres, incluir mayúscula, minúscula y número
                    </p>
                )}
            </div>

            {(!user || formData.password) && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">
                        Confirmar Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required={!user || !!formData.password}
                            placeholder="Repite la contraseña"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
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
