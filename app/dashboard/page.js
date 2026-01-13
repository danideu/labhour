'use client';

import TimeTracker from '@/components/TimeTracker';

export default function EmployeeDashboard() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Panel de Control
                </h1>
                <p className="text-slate-400">Gestiona tu actividad diaria</p>
            </div>

            <div className="grid gap-6">
                {/* Main Clock Widget */}
                <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <TimeTracker />
                </div>

                {/* Info Cards Row */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">Mi Historial Reciente</h3>
                        <p className="text-sm text-slate-500 mb-4">Consulta tus últimos fichajes registrados.</p>
                        <a href="/dashboard/history" className="text-blue-400 text-sm hover:underline">Ver historial completo →</a>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">Ausencias</h3>
                        <p className="text-sm text-slate-500 mb-4">Solicita vacaciones o notifica bajas.</p>
                        <a href="/dashboard/absences" className="text-blue-400 text-sm hover:underline">Gestionar ausencias →</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
