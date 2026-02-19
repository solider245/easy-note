'use client';

import { useState } from 'react';
import { Database, Globe, Server, Check, AlertCircle, Loader2, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

type Provider = 'turso' | 'supabase';
type SupabaseMode = 'connectionString' | 'manual';

interface DatabaseConfigFormProps {
    onClose?: () => void;
}

export default function DatabaseConfigForm({ onClose }: DatabaseConfigFormProps) {
    const [provider, setProvider] = useState<Provider>('turso');
    const [supabaseMode, setSupabaseMode] = useState<SupabaseMode>('connectionString');
    const [config, setConfig] = useState({
        url: '',
        token: '',
        connectionString: '',
        host: '',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: '',
        ssl: true,
    });
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const body: any = { provider };

            if (provider === 'turso') {
                body.url = config.url;
                body.token = config.token;
            } else {
                if (supabaseMode === 'connectionString') {
                    body.connectionString = config.connectionString;
                } else {
                    body.host = config.host;
                    body.port = config.port;
                    body.database = config.database;
                    body.username = config.username;
                    body.password = config.password;
                    body.ssl = config.ssl;
                }
            }

            const res = await fetch('/api/database/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            setTestResult(result);

            if (result.success) {
                toast.success('Connection test successful!');
            } else {
                toast.error('Connection test failed: ' + result.message);
            }
        } catch (error) {
            toast.error('Failed to test connection');
            setTestResult({ success: false, message: 'Failed to test connection' });
        } finally {
            setIsTesting(false);
        }
    };

    const getEnvVariables = () => {
        if (provider === 'turso') {
            return `TURSO_DATABASE_URL=${config.url}
TURSO_AUTH_TOKEN=${config.token}`;
        } else {
            if (supabaseMode === 'connectionString') {
                return `DATABASE_URL=${config.connectionString}`;
            } else {
                const ssl = config.ssl ? '?sslmode=require' : '';
                const url = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
                return `DATABASE_URL=${url}`;
            }
        }
    };

    const copyEnvVariables = () => {
        navigator.clipboard.writeText(getEnvVariables());
        setCopied(true);
        toast.success('Environment variables copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Provider Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => {
                        setProvider('turso');
                        setTestResult(null);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        provider === 'turso'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Globe className={`w-5 h-5 ${provider === 'turso' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="text-left">
                        <div className="font-medium">Turso</div>
                        <div className="text-xs text-gray-500">SQLite Database</div>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setProvider('supabase');
                        setTestResult(null);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        provider === 'supabase'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Server className={`w-5 h-5 ${provider === 'supabase' ? 'text-green-500' : 'text-gray-400'}`} />
                    <div className="text-left">
                        <div className="font-medium">Supabase</div>
                        <div className="text-xs text-gray-500">PostgreSQL Database</div>
                    </div>
                </button>
            </div>

            {/* Configuration Form */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Test Your Configuration
                </h3>

                {provider === 'turso' ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Database URL</label>
                            <input
                                type="text"
                                value={config.url}
                                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                                placeholder="libsql://your-db.turso.io"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Auth Token</label>
                            <input
                                type="password"
                                value={config.token}
                                onChange={(e) => setConfig({ ...config, token: e.target.value })}
                                placeholder="eyJhbGciOiJFZERTQSIs..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                            <button
                                onClick={() => setSupabaseMode('connectionString')}
                                className={`flex-1 py-1.5 px-2 text-sm rounded-md transition-colors ${
                                    supabaseMode === 'connectionString'
                                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                Connection String
                            </button>
                            <button
                                onClick={() => setSupabaseMode('manual')}
                                className={`flex-1 py-1.5 px-2 text-sm rounded-md transition-colors ${
                                    supabaseMode === 'manual'
                                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                Manual Settings
                            </button>
                        </div>

                        {supabaseMode === 'connectionString' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">Connection String</label>
                                <input
                                    type="text"
                                    value={config.connectionString}
                                    onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
                                    placeholder="postgresql://user:pass@host:5432/db"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Host</label>
                                        <input
                                            type="text"
                                            value={config.host}
                                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                            placeholder="xxxxxx.supabase.co"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Port</label>
                                        <input
                                            type="number"
                                            value={config.port}
                                            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={config.database}
                                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                                    placeholder="Database name"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    value={config.username}
                                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                    placeholder="Username"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                                <input
                                    type="password"
                                    value={config.password}
                                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                    placeholder="Password"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Test Button */}
                <button
                    onClick={handleTest}
                    disabled={isTesting}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isTesting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Testing...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            Test Connection
                        </>
                    )}
                </button>

                {/* Test Result */}
                {testResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                        testResult.success 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                        {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span className="text-sm">{testResult.message}</span>
                    </div>
                )}
            </div>

            {/* Environment Variables Section */}
            {testResult?.success && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 space-y-3">
                    <h3 className="font-medium text-blue-900 dark:text-blue-300 flex items-center gap-2">
                        <CheckCheck className="w-4 h-4" />
                        Configuration Verified
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Copy these environment variables to your Vercel project:
                    </p>
                    <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                            {getEnvVariables()}
                        </pre>
                        <button
                            onClick={copyEnvVariables}
                            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            title="Copy to clipboard"
                        >
                            {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href="https://vercel.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Open Vercel Dashboard
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-200">How to configure:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Fill in your database credentials above</li>
                    <li>Click "Test Connection" to verify</li>
                    <li>Copy the environment variables</li>
                    <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                    <li>Paste the variables and save</li>
                    <li>Redeploy your project</li>
                </ol>
            </div>

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Close
                </button>
            )}
        </div>
    );
}
