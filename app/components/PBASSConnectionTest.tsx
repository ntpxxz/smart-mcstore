import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

const PBASSConnectionTest: React.FC = () => {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const testConnection = async () => {
        setTesting(true);
        setResult(null);

        try {
            const res = await fetch('/api/test-connection');
            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message || 'Failed to test connection',
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/50 bg-white/40">
                <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100/80 text-blue-600 rounded-lg">
                        <Activity size={18} />
                    </div>
                    PBASS API Connection Test
                </h3>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={testConnection}
                        disabled={testing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                        {testing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                Test Connection
                            </>
                        )}
                    </button>
                </div>

                {result && (
                    <div className={`p-4 rounded-xl border-2 ${result.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-2">
                                <p className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {result.success ? '✅ Connection Successful' : '❌ Connection Failed'}
                                </p>
                                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    {result.message || result.error}
                                </p>
                                {result.latency && (
                                    <p className="text-xs text-slate-600">
                                        Latency: <span className="font-mono font-bold">{result.latency}ms</span>
                                    </p>
                                )}
                                {result.timestamp && (
                                    <p className="text-xs text-slate-500">
                                        Tested at: {new Date(result.timestamp).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                        Configuration
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">API URL:</span>
                            <span className="font-mono text-xs text-slate-700">
                                {process.env.NEXT_PUBLIC_PBASS_API_URL || 'Not configured'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Timeout:</span>
                            <span className="font-mono text-xs text-slate-700">30000ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">SSL Ignore:</span>
                            <span className="font-mono text-xs text-slate-700">true</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>💡 Tip:</strong> If the connection fails, check:
                    </p>
                    <ul className="mt-2 text-xs text-blue-700 space-y-1 ml-4 list-disc">
                        <li>Network connectivity to <code className="bg-blue-100 px-1 rounded">10.120.10.72</code></li>
                        <li>Firewall settings</li>
                        <li>Proxy configuration (if required)</li>
                        <li>API token expiration</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PBASSConnectionTest;
