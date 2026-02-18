'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield, Database, Cloud, Sparkles, ChevronLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityStatus, setSecurityStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [securityMessage, setSecurityMessage] = useState('');

    // Config States
    const [configStatus, setConfigStatus] = useState<any>(null);
    const [aiKey, setAiKey] = useState('');
    const [aiModel, setAiModel] = useState('gpt-4o-mini');
    const [s3Endpoint, setS3Endpoint] = useState('');
    const [s3Region, setS3Region] = useState('');
    const [s3Bucket, setS3Bucket] = useState('');
    const [s3AccessKey, setS3AccessKey] = useState('');
    const [s3SecretKey, setS3SecretKey] = useState('');

    const [isSavingConfig, setIsSavingConfig] = useState<string | null>(null);

    const router = useRouter();

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/status/config');
            const data = await res.json();
            setConfigStatus(data);
        } catch (e) {
            toast.error('Failed to fetch system status');
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setSecurityStatus('error');
            setSecurityMessage('New passwords do not match.');
            return;
        }
        setSecurityStatus('loading');
        try {
            const res = await fetch('/api/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setSecurityStatus('success');
                setSecurityMessage('Password updated! Logging out...');
                setTimeout(() => {
                    fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login'));
                }, 2000);
            } else {
                setSecurityStatus('error');
                setSecurityMessage(data.error || 'Failed to update password.');
            }
        } catch {
            setSecurityStatus('error');
            setSecurityMessage('An unexpected error occurred.');
        }
    };

    const saveConfig = async (key: string, value: string) => {
        if (!value) return;
        setIsSavingConfig(key);
        try {
            const res = await fetch('/api/status/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
            if (res.ok) {
                toast.success(`${key} saved successfully`);
                fetchConfig(); // Refresh status
            } else {
                toast.error(`Failed to save ${key}`);
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setIsSavingConfig(null);
        }
    };

    const ConfigInput = ({ label, value, onChange, placeholder, type = "text", onSave, configKey }: any) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                    onClick={() => onSave(configKey, value)}
                    disabled={isSavingConfig === configKey || !value}
                    className="p-2 aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                    {isSavingConfig === configKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <h1 className="text-3xl font-bold">System Settings</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        System Operational
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Status Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-500" />
                                Connectivity
                            </h2>
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <div className="text-[10px] uppercase font-bold text-blue-600/60 dark:text-blue-400/60 mb-1">Current Backend</div>
                                    <div className="font-mono text-sm font-bold truncate">
                                        {configStatus?.activeStorage || 'Checking...'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {[
                                        { label: 'Database', connected: configStatus?.database?.connected, info: configStatus?.database?.type },
                                        { label: 'Cloud AI', connected: configStatus?.ai?.openai, info: 'OpenAI' },
                                        { label: 'S3 Sync', connected: configStatus?.s3?.connected, info: 'Compatible' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex items-center justify-between p-2 text-sm">
                                            <span className="text-gray-500">{stat.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${stat.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                <span className={stat.connected ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                                                    {stat.connected ? 'Active' : 'Missing'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Note explaining UI priority */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5 mb-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                HYBRID CONFIGURATION
                            </p>
                            Settings defined in this UI take priority over server environment variables. Sensitive data like API Keys are encrypted before being stored in your database.
                        </div>
                    </div>

                    {/* Main Settings Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section: AI Configuration */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    AI Writing Assistant
                                </h3>
                                {configStatus?.ai?.openai && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </div>
                            <div className="p-6 space-y-4">
                                <ConfigInput
                                    label="OpenAI API Key"
                                    value={aiKey}
                                    onChange={setAiKey}
                                    placeholder="sk-..."
                                    type="password"
                                    configKey="OPENAI_API_KEY"
                                    onSave={saveConfig}
                                />
                                <ConfigInput
                                    label="Preferred Model"
                                    value={aiModel}
                                    onChange={setAiModel}
                                    placeholder="gpt-4o-mini"
                                    configKey="OPENAI_MODEL"
                                    onSave={saveConfig}
                                />
                            </div>
                        </section>

                        {/* Section: Cloud Storage (S3) */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Cloud className="h-4 w-4 text-blue-500" />
                                    External Media Storage (S3)
                                </h3>
                                {configStatus?.s3?.connected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <ConfigInput label="Endpoint URL" value={s3Endpoint} onChange={setS3Endpoint} placeholder="https://..." configKey="S3_ENDPOINT" onSave={saveConfig} />
                                </div>
                                <ConfigInput label="Region" value={s3Region} onChange={setS3Region} placeholder="auto / us-east-1" configKey="S3_REGION" onSave={saveConfig} />
                                <ConfigInput label="Bucket Name" value={s3Bucket} onChange={setS3Bucket} placeholder="my-notes-bucket" configKey="S3_BUCKET" onSave={saveConfig} />
                                <ConfigInput label="Access Key ID" value={s3AccessKey} onChange={setS3AccessKey} placeholder="AKIA..." configKey="S3_ACCESS_KEY_ID" onSave={saveConfig} />
                                <ConfigInput label="Secret Access Key" value={s3SecretKey} onChange={setS3SecretKey} placeholder="Required" type="password" configKey="S3_SECRET_ACCESS_KEY" onSave={saveConfig} />
                            </div>
                        </section>

                        {/* Section: Security */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-red-500" />
                                    Access & Security
                                </h3>
                            </div>
                            <div className="p-6">
                                {configStatus?.activeStorage === 'Local Memory (Demo)' ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                                        ⚠️ You are currently in Demo Mode. Connect a Database or Turso to enable password management and long-term storage.
                                    </div>
                                ) : (
                                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Password</label>
                                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
                                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm New</label>
                                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        </div>

                                        {securityMessage && (
                                            <div className={`p-3 rounded-lg text-xs font-medium ${securityStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {securityMessage}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={securityStatus === 'loading'}
                                            className="w-full md:w-auto px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {securityStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Update System Password
                                        </button>
                                    </form>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
