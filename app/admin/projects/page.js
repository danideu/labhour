'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Error al cargar proyectos');
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleCreate() {
        setEditingProject(null);
        setIsModalOpen(true);
    }

    function handleEdit(project) {
        setEditingProject(project);
        setIsModalOpen(true);
    }

    async function handleDelete(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Si tiene horas registradas no se podrá eliminar.')) return;

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al eliminar');
            }

            fetchProjects();
        } catch (err) {
            alert(err.message);
        }
    }

    function handleFormSuccess() {
        setIsModalOpen(false);
        fetchProjects();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Proyectos y Obras
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gestiona las ubicaciones donde trabajan tus empleados</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nueva Obra
                </button>
            </div>

            {error && (
                <div className="bg-red-950/30 border border-red-900 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400">
                                <th className="p-4 font-medium">Nombre del Proyecto</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Fecha Creación</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">Cargando proyectos...</td>
                                </tr>
                            ) : projects.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">No hay proyectos registrados</td>
                                </tr>
                            ) : (
                                projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{project.name}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.active
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                {project.active ? 'Activo' : 'Archivado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {new Date(project.created_at).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleEdit(project)}
                                                className="text-slate-400 hover:text-white mr-3 transition-colors"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id)}
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
                title={editingProject ? 'Editar Obra' : 'Nueva Obra'}
            >
                <ProjectForm
                    project={editingProject}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
