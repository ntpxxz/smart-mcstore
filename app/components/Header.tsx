import React from 'react';
import { Package, Database, ServerOff, User, LogOut } from 'lucide-react';

interface HeaderProps {
    currentUser: { username: string; role: string };
    isConnected: boolean;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, isConnected, onLogout }) => {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 transition-all duration-500 ${isConnected ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
                        <Package size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Invoice Receiver</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {/*<span className="text-xs text-slate-500 font-medium">Inbound Logistics</span>*/}
                            {isConnected ? (
                                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-green-100">
                                    <Database size={10} />DB ONLINE
                                </span>
                            ) : (
                                <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-orange-100">
                                    <ServerOff size={10} /> DB DISCONNECTED
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 text-sm text-slate-600 bg-slate-50/50 px-4 py-1.5 rounded-full border border-slate-200/60 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <User size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{currentUser.username}</span>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-red-500/10 active:scale-95"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
