import React, { useState } from 'react';
import { Package, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User as UserIcon, PackageOpen } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: { username: string; role: string }) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                onLogin(data);
            } else {
                setError(data.error || "Invalid credentials");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#AECBEB] relative overflow-hidden flex items-center justify-center p-4 font-sans">
            {/* Background effects to mimic clouds/sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#BFE0F5] via-[#D6EAF8] to-[#EBF5FB]" />

            {/* Cloud-like blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/40 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/40 rounded-full blur-[100px] opacity-60" />
            <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-white/30 rounded-full blur-[80px] opacity-40" />

            {/* Top Left Logo */}
            <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
                <div className="bg-slate-900 text-white p-1.5 rounded-lg shadow-md">
                    <PackageOpen size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">One Invoice</span>
            </div>

            {/* Main Card */}
            <div className="bg-white/60 backdrop-blur-2xl max-w-[420px] w-full rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-10 relative z-10 border border-white/60">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5 border border-white/50">
                        <ArrowRight size={24} className="text-slate-900" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Login With Username</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserIcon className="text-slate-400" size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full pl-11 pr-4 py-3.5 bg-[#F0F2F5]/80 hover:bg-[#F0F2F5] focus:bg-white border border-transparent focus:border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-slate-400" size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-11 pr-12 py-3.5 bg-[#F0F2F5]/80 hover:bg-[#F0F2F5] focus:bg-white border border-transparent focus:border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>



                    {error && (
                        <div className="p-3 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={16} className="shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#1A1A1A] hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Get Started"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
