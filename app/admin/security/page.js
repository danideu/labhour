'use client';

import { useState, useEffect } from 'react';

export default function SecurityPage() {
    const [blockedIps, setBlockedIps] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('blocked');
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setLoading(true);
        try {
            const type = activeTab === 'history' ? '?type=history' : '';
            const res = await fetch(`/api/admin/blocked-ips${type}`);
            const data = await res.json();

            if (activeTab === 'history') {
                setHistory(data);
            } else {
                setBlockedIps(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    }

    async function handleUnblock(ipAddress) {
        if (!confirm(`¿Desbloquear la IP ${ipAddress}?`)) return;

        try {
            const res = await fetch('/api/admin/blocked-ips', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al desbloquear IP' });
        }

        setTimeout(() => setMessage(null), 3000);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getMinutesLeft(blockedUntil) {
        if (!blockedUntil) return 0;
        const diff = new Date(blockedUntil) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60)));
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Seguridad - IPs Bloqueadas</h1>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    🔄 Actualizar
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('blocked')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'blocked'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🚫 IPs Bloqueadas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    📜 Historial de Intentos
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : activeTab === 'blocked' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {blockedIps.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="text-4xl mb-4">✅</div>
                            <p>No hay IPs bloqueadas actualmente</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email Intentado</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Intentos</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Bloqueada Hasta</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tiempo Restante</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {blockedIps.map((ip) => (
                                    <tr key={ip.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-sm">{ip.ip_address}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{ip.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                {ip.attempt_count} intentos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(ip.blocked_until)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                {getMinutesLeft(ip.blocked_until)} min
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleUnblock(ip.ip_address)}
                                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                                            >
                                                Desbloquear
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="text-4xl mb-4">📭</div>
                            <p>No hay historial de intentos de login</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Intentos</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Último Intento</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {history.map((item) => {
                                    const isBlocked = item.blocked_until && new Date(item.blocked_until) > new Date();
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-sm">{item.ip_address}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.email || '-'}</td>
                                            <td className="px-6 py-4 text-sm">{item.attempt_count}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.last_attempt)}</td>
                                            <td className="px-6 py-4">
                                                {isBlocked ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        Bloqueada
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Información</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Las IPs se bloquean automáticamente después de <strong>5 intentos fallidos</strong></li>
                    <li>• El bloqueo dura <strong>15 minutos</strong></li>
                    <li>• En el 4º intento fallido, el usuario recibe una advertencia</li>
                    <li>• Un login exitoso limpia el contador de intentos</li>
                </ul>
            </div>
        </div>
    );
}
