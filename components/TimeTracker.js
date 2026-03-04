'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TimeTracker() {
    const [loading, setLoading] = useState(true);
    const [activeEntry, setActiveEntry] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [now, setNow] = useState(new Date());
    const [error, setError] = useState('');
    const router = useRouter();

    // Clock tick
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Periodic refresh to sync state across devices (every 5 seconds)
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            try {
                const statusRes = await fetch('/api/entries/current');
                const statusData = await statusRes.json();
                setActiveEntry(statusData.activeEntry);
            } catch (err) {
                // Silent fail on background refresh
            }
        }, 5000);
        return () => clearInterval(refreshInterval);
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            // Fetch projects
            const projRes = await fetch('/api/projects');
            const projData = await projRes.json();
            const activeProjects = projData.filter(p => p.active); // Filter backend side better in future
            setProjects(activeProjects);

            // Fetch status
            const statusRes = await fetch('/api/entries/current');
            const statusData = await statusRes.json();
            setActiveEntry(statusData.activeEntry);

            if (activeProjects.length > 0 && !statusData.activeEntry) {
                setSelectedProject(activeProjects[0].id);
            }

        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }

    async function handleClockIn() {
        if (!selectedProject) return;
        try {
            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: selectedProject }),
            });

            if (!res.ok) throw new Error('Error al fichar');

            await fetchData(); // Refresh state
            router.refresh();

        } catch (err) {
            alert('Hubo un error al iniciar la jornada');
        }
    }

    async function handleClockOut() {
        try {
            const res = await fetch('/api/entries', {
                method: 'PUT',
            });

            if (!res.ok) throw new Error('Error al salir');

            await fetchData(); // Refresh state
            router.refresh();

        } catch (err) {
            alert('Hubo un error al finalizar la jornada');
        }
    }

    // Calculate elapsed time if working
    const getElapsed = () => {
        if (!activeEntry) return '00:00:00';

        // La BD guarda el start_time en UTC sin sufijo 'Z'.
        // Si lo parseamos directamente con new Date(), el navegador lo interpreta
        // como hora LOCAL, causando un desfase de +1h en España (UTC+1).
        // Añadimos 'Z' para forzar la interpretación como UTC.
        const rawStart = activeEntry.start_time;
        const startStr = rawStart.endsWith('Z') || rawStart.includes('+') ? rawStart : rawStart + 'Z';
        const start = new Date(startStr).getTime();
        const current = now.getTime();
        const diff = current - start;

        if (diff < 0) return '00:00:00';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando panel...</div>;

    return (
        <div className="flex flex-col items-center justify-center p-2">

            {/* Digital Clock Display */}
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-tighter mb-8 tabular-nums bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent drop-shadow-2xl">
                {activeEntry ? getElapsed() : now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <div className="w-full max-w-sm space-y-6">
                {activeEntry ? (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass px-6 py-3 rounded-full inline-block border-green-500/30 bg-green-500/10">
                            <span className="text-green-400 font-medium flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Trabajando en: {activeEntry.project_name}
                            </span>
                        </div>

                        <button
                            onClick={handleClockOut}
                            className="w-full py-6 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xl font-bold shadow-xl shadow-red-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            FINALIZAR JORNADA
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-slate-400 font-medium mb-2">Selecciona Obra / Proyecto</div>

                        <div className="relative">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                                disabled={projects.length === 0}
                            >
                                {projects.length === 0 && <option>No hay proyectos activos</option>}
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        <button
                            onClick={handleClockIn}
                            disabled={!selectedProject || projects.length === 0}
                            className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold shadow-xl shadow-blue-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            INICIAR JORNADA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
