'use client';

import { useState, useEffect, useRef } from 'react';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({
                    name: data.name,
                    email: data.email
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateProfile(e) {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
                setProfile({ ...profile, ...formData });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al actualizar perfil' });
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cambiar contraseña' });
        } finally {
            setSaving(false);
        }
    }

    async function handleAvatarUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Avatar actualizado' });
                setProfile({ ...profile, avatar_url: data.avatarUrl });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al subir avatar' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando perfil...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Mi Perfil
            </h1>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Avatar Section */}
            <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Foto de Perfil</h2>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                                {profile?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        </button>
                    </div>

                    <div>
                        <p className="text-sm text-slate-400 mb-2">Haz clic en la imagen para cambiar tu avatar</p>
                        <p className="text-xs text-slate-500">Formatos: JPG, PNG, GIF, WebP (máx. 5MB)</p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Profile Info */}
            <form onSubmit={handleUpdateProfile} className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Información Personal</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="glass-card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Cambiar Contraseña</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña Actual</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            {saving ? 'Actualizando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Account Info */}
            <div className="glass-card p-6 mt-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Información de Cuenta</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500">Rol:</span>
                        <span className="ml-2 text-slate-300 capitalize">{profile?.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Miembro desde:</span>
                        <span className="ml-2 text-slate-300">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
