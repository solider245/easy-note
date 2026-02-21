'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Shield, Database, Cloud, Sparkles, ChevronLeft, Save, Loader2,
    CheckCircle2, AlertCircle, Copy, Link, Wand2, Terminal, Info,
    HardDrive, Download, Upload, Globe, Server, Zap, Settings
} from 'lucide-react';
import CollapsibleSection from '@/components/CollapsibleSection';

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

    // -- State: AI & S3 Config --
    const [aiKey, setAiKey] = useState('');
    const [aiModel, setAiModel] = useState('gpt-4o-mini');
    const [s3Endpoint, setS3Endpoint] = useState('');
    const [s3Region, setS3Region] = useState('');
    const [s3Bucket, setS3Bucket] = useState('');
    const [s3AccessKey, setS3AccessKey] = useState('');
    const [s3SecretKey, setS3SecretKey] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState<string | null>(null);

    // -- Feature Flags (detected from config) --
    const [features, setFeatures] = useState({
        ai: false,
        s3: false,
        sharing: false
    });

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

    // -- State: Editor Settings --
    const [autoSaveInterval, setAutoSaveInterval] = useState<number>(10);
    const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/status/config');
            const data = await res.json();
            setConfigStatus(data);
            // Detect feature flags from config
            setFeatures({
                ai: data.ai?.openai || false,
                s3: data.s3?.connected || false,
                sharing: data.sharing?.enabled || false
            });
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
        // Load editor settings from localStorage
        const savedInterval = localStorage.getItem('autoSaveInterval');
        if (savedInterval) {
            setAutoSaveInterval(parseInt(savedInterval, 10));
        }
    }, []);

    // -- Editor Settings Actions --
    const handleAutoSaveChange = (value: number) => {
        setAutoSaveInterval(value);
        setHasUnsavedSettings(true);
    };

    const saveEditorSettings = () => {
        localStorage.setItem('autoSaveInterval', autoSaveInterval.toString());
        setHasUnsavedSettings(false);
        toast.success('Editor settings saved');
    };

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
                                onClose={() => setShowDbConfig(false)}
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
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            ✅ Database connected
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Configuration is managed via environment variables
                                        </p>
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
                    <div className="lg:col-span-2 space-y-6">
                        {/* Core: Data Management */}
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                                <HardDrive className="h-6 w-6 text-indigo-500" />
                                Data Management
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Backup and restore your notes</p>

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
                                        <div className="text-[10px] text-gray-400">Restore or merge backups</div>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Core: Editor Settings */}
                        <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                                <Settings className="h-6 w-6 text-blue-500" />
                                Editor Settings
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Configure auto-save behavior for offline editing</p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Auto-save Interval
                                    </label>
                                    <p className="text-xs text-gray-400">
                                        How often to automatically sync changes to the server
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 1, label: '1 min' },
                                            { value: 5, label: '5 min' },
                                            { value: 10, label: '10 min' },
                                            { value: 30, label: '30 min' },
                                            { value: 0, label: 'Manual only' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleAutoSaveChange(option.value)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                    autoSaveInterval === option.value
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Changes are always saved locally to your browser. Auto-save controls how often they sync to the server.
                                        You can always use Ctrl+S to save manually.
                                    </p>
                                </div>

                                {hasUnsavedSettings && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={saveEditorSettings}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <Save className="h-4 w-4" />
                                            Save Settings
                                        </button>
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                            Unsaved changes
                                        </span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Advanced: AI Assistant (only if enabled or configured) */}
                        {(features.ai || !isDemo) && (
                            <CollapsibleSection
                                title="AI Writing Assistant"
                                icon={<Sparkles className="w-5 h-5 text-purple-500" />}
                                badge={features.ai ? 'Active' : 'Setup Required'}
                                defaultCollapsed={!features.ai}
                            >
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        AI-powered writing assistance. Requires OpenAI API key.
                                    </p>
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
                                        label="Model"
                                        value={aiModel}
                                        onChange={setAiModel}
                                        placeholder="gpt-4o-mini"
                                        configKey="OPENAI_MODEL"
                                        onSave={saveConfig}
                                    />
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Advanced: S3 Storage (only if enabled or configured) */}
                        {(features.s3 || !isDemo) && (
                            <CollapsibleSection
                                title="External Storage (S3)"
                                icon={<Cloud className="w-5 h-5 text-blue-500" />}
                                badge={features.s3 ? 'Active' : 'Setup Required'}
                                defaultCollapsed={!features.s3}
                            >
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Store media files on S3-compatible storage (AWS, R2, MinIO).
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ConfigInput label="Endpoint" value={s3Endpoint} onChange={setS3Endpoint} placeholder="https://..." configKey="S3_ENDPOINT" onSave={saveConfig} />
                                        <ConfigInput label="Region" value={s3Region} onChange={setS3Region} placeholder="auto" configKey="S3_REGION" onSave={saveConfig} />
                                        <ConfigInput label="Bucket" value={s3Bucket} onChange={setS3Bucket} placeholder="my-notes" configKey="S3_BUCKET" onSave={saveConfig} />
                                        <ConfigInput label="Access Key" value={s3AccessKey} onChange={setS3AccessKey} placeholder="AKIA..." configKey="S3_ACCESS_KEY_ID" onSave={saveConfig} />
                                        <ConfigInput label="Secret Key" value={s3SecretKey} onChange={setS3SecretKey} placeholder="Required" type="password" configKey="S3_SECRET_ACCESS_KEY" onSave={saveConfig} />
                                    </div>
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Advanced: Security */}
                        <CollapsibleSection
                            title="Security Settings"
                            icon={<Shield className="w-5 h-5 text-red-500" />}
                            defaultCollapsed={true}
                        >
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Password</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
                                            <button
                                                type="button"
                                                onClick={generateStrongPassword}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Wand2 className="h-3 w-3" /> Generate
                                            </button>
                                        </div>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {securityMessage && (
                                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${securityStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {securityStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {securityMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={securityStatus === 'loading'}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {securityStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Update Password
                                </button>
                            </form>
                        </CollapsibleSection>
                    </div>
                </div>
            </div>
        </div>
    );
}
