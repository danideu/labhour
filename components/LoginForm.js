'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Redirect based on role
            router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
            router.refresh();
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
                <label className="block text-sm font-medium mb-1">Email Corporativo</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full shadow-lg shadow-blue-500/20"
            >
                {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>
        </form>
    );
}
