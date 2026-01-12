import React, { useState } from 'react';
import { Package, User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: { username: string; role: string }) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        setTimeout(() => {
            if (username === "admin" && password === "1234") {
                onLogin({ username: "Admin User", role: "Warehouse Manager" });
            } else {
                setError("Invalid credentials. Try admin / 1234");
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50" />
                    <div className="relative z-10">
                        <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner ring-1 ring-white/20">
                            <Package size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse Receiver</h1>
                        <p className="text-slate-400 text-sm mt-1 font-medium">Secure Access Portal</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>Sign In System</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <div className="inline-block px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                            <p className="text-xs text-slate-500">
                                Default: <span className="font-mono font-bold text-slate-700">admin</span> / <span className="font-mono font-bold text-slate-700">1234</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
