'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Shield, Database, Cloud, Sparkles, ChevronLeft, Save, Loader2,
    CheckCircle2, AlertCircle, Copy, Link, Wand2, Terminal, Info,
    HardDrive, Download, Upload, Globe, Server, Unlink
} from 'lucide-react';

// Lazy load DatabaseConfigForm to reduce initial bundle size
const DatabaseConfigForm = lazy(() => import('@/components/DatabaseConfigForm'));

export default function SettingsPage() {
    const router = useRouter();

    // -- State: Config Status --
    const [configStatus, setConfigStatus] = useState<any>(null);
    const [dbStatus, setDbStatus] = useState<{ storageType: string; provider: string | null; isConfigured: boolean; isDemoMode: boolean } | null>(null);
    const isDemo = configStatus?.activeStorage === 'Local Memory (Demo)' || dbStatus?.isDemoMode;

    // -- State: Database Setup Wizard --
    const [showDbConfig, setShowDbConfig] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // -- State: AI & S3 Config --
    const [aiKey, setAiKey] = useState('');
    const [aiModel, setAiModel] = useState('gpt-4o-mini');
    const [s3Endpoint, setS3Endpoint] = useState('');
    const [s3Region, setS3Region] = useState('');
    const [s3Bucket, setS3Bucket] = useState('');
    const [s3AccessKey, setS3AccessKey] = useState('');
    const [s3SecretKey, setS3SecretKey] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState<string | null>(null);

    // -- State: Security --
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityStatus, setSecurityStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [securityMessage, setSecurityMessage] = useState('');

    // -- State: Stats --
    const [stats, setStats] = useState<{ noteCount: number; totalWords: number; tagCount: number; sharedCount: number } | null>(null);

    // -- State: Data Management --
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/status/config');
            const data = await res.json();
            setConfigStatus(data);
        } catch (e) {
            toast.error('Failed to fetch system status');
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/notes');
            if (res.ok) {
                const notes = await res.json();
                const totalWords = notes.reduce((sum: number, n: any) => sum + (n.wordCount || 0), 0);
                const allTags = new Set<string>();
                notes.forEach((n: any) => (n.tags || []).forEach((t: string) => allTags.add(t)));
                const sharedCount = notes.filter((n: any) => n.shareToken).length;
                setStats({ noteCount: notes.length, totalWords, tagCount: allTags.size, sharedCount });
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchConfig();
        fetchStats();
        fetchDbStatus();
    }, []);

    // -- Database Actions --
    const fetchDbStatus = async () => {
        try {
            const res = await fetch('/api/database/status');
            const data = await res.json();
            setDbStatus(data);
        } catch (e) {
            console.error('Failed to fetch database status:', e);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect from the database? This will switch to demo mode and any unsaved data may be lost.')) {
            return;
        }
        
        setIsDisconnecting(true);
        try {
            const res = await fetch('/api/database/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: true }),
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('Disconnected from database');
                fetchDbStatus();
                fetchConfig();
            } else {
                toast.error(data.message || 'Failed to disconnect');
            }
        } catch (e) {
            toast.error('Failed to disconnect from database');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleDbConnect = () => {
        setShowDbConfig(false);
        fetchDbStatus();
        fetchConfig();
        toast.success('Database configuration updated');
    };

    // -- Config Actions --
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
                fetchConfig();
            } else {
                toast.error(`Failed to save ${key}`);
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setIsSavingConfig(null);
        }
    };

    // -- Data Actions --
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await fetch('/api/export');
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `easy-note-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success('Export successful');
        } catch (e) {
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const notes = JSON.parse(text);

            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notes),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Import failed');
            }
        } catch (e) {
            toast.error('Failed to parse import file');
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    // -- Security Actions --
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
                setSecurityMessage('Password updated successfully! Logging out...');
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

    const generateStrongPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0; i < 16; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setNewPassword(retVal);
        setConfirmPassword(retVal);
        toast.info('Generated strong password');
    };

    // -- UI Components --
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
            <div className="max-w-6xl mx-auto space-y-8">
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
                </div>

                {/* Database Setup Wizard (Only in Demo Mode) */}
                {isDemo && !showDbConfig && (
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl overflow-hidden text-white">
                        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
                                    <Sparkles className="h-3 w-3" />
                                    Initial Setup
                                </div>
                                <h2 className="text-3xl font-bold">Activate Permanent Storage</h2>
                                <p className="text-blue-100 max-w-lg">
                                    You are currently in Demo mode. Connect a Database (Turso or Supabase) to unlock permanent storage, custom passwords, and AI persistence.
                                </p>
                            </div>

                            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setShowDbConfig(true)}
                                    className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Database className="h-5 w-5" />
                                    Configure Database
                                </button>
                                <a
                                    href="https://vercel.com/dashboard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Link className="h-5 w-5" />
                                    Vercel Integration
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Database Configuration Form */}
                {showDbConfig && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Database className="h-6 w-6 text-blue-500" />
                                    Database Connection
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Connect to Turso (SQLite) or Supabase (PostgreSQL) for persistent storage
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDbConfig(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <Suspense fallback={
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        }>
                            <DatabaseConfigForm 
                                onConnect={handleDbConnect}
                                onCancel={() => setShowDbConfig(false)}
                            />
                        </Suspense>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Status & Overview Column */}
                    <div className="space-y-6">
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Device Status</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${!isDemo ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <Database className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Storage</div>
                                            <div className="text-[10px] text-gray-400">{configStatus?.activeStorage || 'Unknown'}</div>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${!isDemo ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>
                                        {!isDemo ? 'PERSISTENT' : 'DEMO'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${configStatus?.ai?.openai ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">AI Assistant</div>
                                            <div className="text-[10px] text-gray-400">{configStatus?.ai?.openai ? 'Active' : 'Unconfigured'}</div>
                                        </div>
                                    </div>
                                    {configStatus?.ai?.openai && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                </div>
                            </div>
                        </section>

                        {/* Stats Card */}
                        {stats && (
                            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Your Notes</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.noteCount}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Notes</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalWords.toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Words</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.tagCount}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Tags</div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.sharedCount}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Shared</div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Database Status Card */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Database</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${dbStatus?.isConfigured ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {dbStatus?.provider === 'turso' ? <Globe className="h-5 w-5" /> : 
                                             dbStatus?.provider === 'supabase' ? <Server className="h-5 w-5" /> : 
                                             <Database className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">
                                                {dbStatus?.isConfigured 
                                                    ? (dbStatus.provider === 'turso' ? 'Turso' : 'Supabase')
                                                    : 'Not Connected'}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {dbStatus?.isConfigured ? 'Persistent Storage' : 'Demo Mode'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dbStatus?.isConfigured ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-400'}`}>
                                        {dbStatus?.isConfigured ? 'ACTIVE' : 'OFFLINE'}
                                    </div>
                                </div>

                                {!dbStatus?.isConfigured ? (
                                    <button
                                        onClick={() => setShowDbConfig(true)}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Database className="h-4 w-4" />
                                        Connect Database
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setShowDbConfig(true)}
                                            className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                                        >
                                            Reconfigure
                                        </button>
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={isDisconnecting}
                                            className="w-full py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed space-y-2">
                            <div className="font-bold flex items-center gap-2">
                                <Info className="h-4 w-4" /> Hybrid Logic
                            </div>
                            <p>Settings saved here are encrypted and priority-loaded over environment variables.</p>
                        </div>
                    </div>

                    {/* Main Settings Body */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section: AI */}
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                            {isDemo && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="text-center p-6 space-y-3">
                                        <Terminal className="h-8 w-8 mx-auto text-blue-500" />
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Connect DB to Unlock AI Persistence</p>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Sparkles className="h-6 w-6 text-purple-500" />
                                Writing Assistant
                            </h3>
                            <div className="space-y-5">
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
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            {isDemo && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="text-center p-6 space-y-3">
                                        <Cloud className="h-8 w-8 mx-auto text-blue-500" />
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Connect DB to Unlock Storage Sync</p>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Cloud className="h-6 w-6 text-blue-500" />
                                External Media Sync (S3)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <ConfigInput label="Endpoint URL" value={s3Endpoint} onChange={setS3Endpoint} placeholder="https://..." configKey="S3_ENDPOINT" onSave={saveConfig} />
                                </div>
                                <ConfigInput label="Region" value={s3Region} onChange={setS3Region} placeholder="auto" configKey="S3_REGION" onSave={saveConfig} />
                                <ConfigInput label="Bucket Name" value={s3Bucket} onChange={setS3Bucket} placeholder="my-notes" configKey="S3_BUCKET" onSave={saveConfig} />
                                <ConfigInput label="Access Key ID" value={s3AccessKey} onChange={setS3AccessKey} placeholder="AKIA..." configKey="S3_ACCESS_KEY_ID" onSave={saveConfig} />
                                <ConfigInput label="Secret Key" value={s3SecretKey} onChange={setS3SecretKey} placeholder="Required" type="password" configKey="S3_SECRET_ACCESS_KEY" onSave={saveConfig} />
                            </div>
                        </section>

                        {/* Section: Data Management */}
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            {isDemo && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <div className="text-center p-6 space-y-3">
                                        <HardDrive className="h-8 w-8 mx-auto text-blue-500" />
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Connect DB to Unlock Migration</p>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                                <HardDrive className="h-6 w-6 text-indigo-500" />
                                Data Portability
                            </h3>
                            <p className="text-sm text-gray-500 mb-8">Export your data for backup or migrate from another instance.</p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                >
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                        {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Export Backup</div>
                                        <div className="text-[10px] text-gray-400">Download all notes as .json</div>
                                    </div>
                                </button>

                                <label className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        disabled={isImporting}
                                        className="hidden"
                                    />
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                        {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Import from JSON</div>
                                        <div className="text-[10px] text-gray-400">Restore or merge previous backups</div>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Section: Security */}
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            {isDemo && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center text-center">
                                    <div className="p-6 space-y-3">
                                        <Shield className="h-8 w-8 mx-auto text-red-500" />
                                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300 transition-all group-hover:scale-105">Connect DB to Manage Access</p>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Shield className="h-6 w-6 text-red-500" />
                                System Security
                            </h3>
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Admin Password</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
                                            <button
                                                type="button"
                                                onClick={generateStrongPassword}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Wand2 className="h-3 w-3" /> Auto-suggest
                                            </button>
                                        </div>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {securityMessage && (
                                    <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${securityStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {securityStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {securityMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={securityStatus === 'loading'}
                                    className="w-full md:w-auto px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {securityStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Apply Password Update
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
