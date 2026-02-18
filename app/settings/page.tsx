'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [configStatus, setConfigStatus] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/status/config')
            .then(res => res.json())
            .then(setConfigStatus)
            .catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus('error');
            setMessage('New passwords do not match.');
            return;
        }
        setStatus('loading');
        try {
            const res = await fetch('/api/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage('Password updated successfully! Please log in again.');
                setTimeout(() => {
                    fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login'));
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to update password.');
            }
        } catch {
            setStatus('error');
            setMessage('An unexpected error occurred.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        ← Back to App
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Storage Info */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Storage & Connectivity</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Active Backend</div>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase">
                                    {configStatus?.activeStorage || 'Loading...'}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: 'database', label: 'Database', info: configStatus?.database },
                                    { key: 'blob', label: 'Vercel Blob', info: configStatus?.blob },
                                    { key: 's3', label: 'S3 Storage', info: configStatus?.s3 }
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            {item.info?.connected ? (
                                                <>
                                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">CONNECTED</span>
                                                    <span className="text-xs text-gray-400">{item.info.type || item.info.provider}</span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-medium">DISCONNECTED</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Security */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Security</h2>

                        {configStatus && configStatus.activeStorage === 'Local Memory (Demo)' && (
                            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">💡</span>
                                    <div className="text-amber-800 dark:text-amber-300">
                                        <p className="font-semibold mb-1">How to enable Permanent Storage & Passwords:</p>
                                        <p className="opacity-80">Database configuration is managed through your host (Vercel). Once connected, this section will unlock automatically.</p>
                                    </div>
                                </div>
                                <a
                                    href="https://vercel.com/dashboard"
                                    target="_blank"
                                    className="block w-full text-center py-2 px-4 bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-lg font-bold transition-colors"
                                >
                                    Go to Vercel Dashboard →
                                </a>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {status === 'success' && (
                                <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>
                            )}
                            {status === 'error' && (
                                <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading' || (configStatus && configStatus.activeStorage === 'Local Memory (Demo)')}
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                            >
                                {status === 'loading' ? 'Saving...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
