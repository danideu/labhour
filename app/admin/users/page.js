'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import UserForm from '@/components/UserForm';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [impersonating, setImpersonating] = useState(null);

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Error al cargar usuarios');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleCreate() {
        setEditingUser(null);
        setIsModalOpen(true);
    }

    function handleEdit(user) {
        setEditingUser(user);
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al eliminar');
            }

            fetchUsers(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    }

    function handleFormSuccess() {
        setIsModalOpen(false);
        fetchUsers();
    }

    async function handleImpersonate(user) {
        if (!confirm(`¿Iniciar sesión como "${user.name}"? Podrás volver a tu cuenta de administrador en cualquier momento.`)) return;

        setImpersonating(user.id);
        try {
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al impersonar');
            }

            router.push('/dashboard');
        } catch (err) {
            alert(err.message);
            setImpersonating(null);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Gestión de Empleados
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Administra el acceso y roles de tu equipo</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary shadow-lg shadow-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nuevo Empleado
                </button>
            </div>

            {error && (
                <div className="bg-red-950/30 border border-red-900 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Search and Filter Bar */}
            <div className="glass-card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="text-sm md:w-48"
                    >
                        <option value="">Todos los roles</option>
                        <option value="admin">Administradores</option>
                        <option value="employee">Empleados</option>
                    </select>
                    <span className="text-xs text-slate-500 self-center">({filteredUsers.length} de {users.length})</span>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400">
                                <th className="p-4 font-medium">Nombre</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Rol</th>
                                <th className="p-4 font-medium">Fecha Alta</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con ese filtro'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{user.name}</td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.role === 'employee' && (
                                                <button
                                                    onClick={() => handleImpersonate(user)}
                                                    disabled={impersonating === user.id}
                                                    className="text-slate-400 hover:text-amber-400 mr-3 transition-colors disabled:opacity-50"
                                                    title="Ver como este empleado"
                                                >
                                                    {impersonating === user.id ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-slate-400 hover:text-white mr-3 transition-colors"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-slate-600 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            >
                <UserForm
                    user={editingUser}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
