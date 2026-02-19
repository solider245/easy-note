'use client';

import { useState } from 'react';
import { Database, Globe, Server, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type Provider = 'turso' | 'supabase';
type SupabaseMode = 'connectionString' | 'manual';

interface DatabaseConfig {
    provider: Provider;
    // Turso
    url?: string;
    token?: string;
    // Supabase Connection String
    connectionString?: string;
    // Supabase Manual
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
}

interface DatabaseConfigFormProps {
    onConnect?: () => void;
    onCancel?: () => void;
}

export default function DatabaseConfigForm({ onConnect, onCancel }: DatabaseConfigFormProps) {
    const [provider, setProvider] = useState<Provider>('turso');
    const [supabaseMode, setSupabaseMode] = useState<SupabaseMode>('connectionString');
    const [config, setConfig] = useState<DatabaseConfig>({
        provider: 'turso',
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
    const [isConnecting, setIsConnecting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
                toast.success('Connection test successful');
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

    const handleConnect = async () => {
        setIsConnecting(true);

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

            const res = await fetch('/api/database/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await res.json();

            if (result.success) {
                toast.success('Database connected successfully');
                onConnect?.();
            } else {
                toast.error('Failed to connect: ' + result.message);
            }
        } catch (error) {
            toast.error('Failed to connect to database');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Provider Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => {
                        setProvider('turso');
                        setConfig({ ...config, provider: 'turso' });
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
                        setConfig({ ...config, provider: 'supabase' });
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

            {/* Turso Form */}
            {provider === 'turso' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Database URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={config.url}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            placeholder="libsql://your-db.turso.io"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Find this in your Turso dashboard
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Auth Token <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={config.token}
                            onChange={(e) => setConfig({ ...config, token: e.target.value })}
                            placeholder="eyJhbGciOiJFZERTQSIs..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Generate a token from Turso dashboard → Settings → Tokens
                        </p>
                    </div>
                </div>
            )}

            {/* Supabase Form */}
            {provider === 'supabase' && (
                <div className="space-y-4">
                    {/* Connection Mode Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            onClick={() => setSupabaseMode('connectionString')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                                supabaseMode === 'connectionString'
                                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            Connection String
                        </button>
                        <button
                            onClick={() => setSupabaseMode('manual')}
                            className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
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
                            <label className="block text-sm font-medium mb-1.5">
                                Connection String <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={config.connectionString}
                                onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
                                placeholder="postgresql://postgres:password@host.supabase.co:5432/postgres"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 font-mono text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Find this in Supabase dashboard → Settings → Database → Connection string
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1.5">Host *</label>
                                    <input
                                        type="text"
                                        value={config.host}
                                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                        placeholder="xxxxxx.supabase.co"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Port</label>
                                    <input
                                        type="number"
                                        value={config.port}
                                        onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Database *</label>
                                <input
                                    type="text"
                                    value={config.database}
                                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                                    placeholder="postgres"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Username *</label>
                                <input
                                    type="text"
                                    value={config.username}
                                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                    placeholder="postgres"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={config.password}
                                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                    placeholder="your-password"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.ssl}
                                    onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
                                    className="w-4 h-4 text-green-600 rounded"
                                />
                                <span className="text-sm">Use SSL (recommended)</span>
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* Test Result */}
            {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    testResult.success 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                    {testResult.success ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleTest}
                    disabled={isTesting || isConnecting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isTesting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Testing...
                        </span>
                    ) : (
                        'Test Connection'
                    )}
                </button>

                <button
                    onClick={handleConnect}
                    disabled={isTesting || isConnecting}
                    className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        provider === 'turso'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isConnecting ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                        </span>
                    ) : (
                        'Save & Connect'
                    )}
                </button>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isTesting || isConnecting}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
