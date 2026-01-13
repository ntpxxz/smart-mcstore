import React from 'react';
import {
    FileText,
    Users,
    LogOut,
    Database,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Settings,
    Package,
    PackageOpen
} from 'lucide-react';

interface SidebarProps {
    currentUser: any;
    currentView: 'invoices' | 'users';
    setCurrentView: (view: 'invoices' | 'users') => void;
    onLogout: () => void;
    isConnected: boolean;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentUser,
    currentView,
    setCurrentView,
    onLogout,
    isConnected,
    isCollapsed,
    setIsCollapsed
}) => {
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Warehouse Manager';

    const menuItems = [
        {
            id: 'invoices',
            label: 'Invoice System',
            icon: <FileText size={20} />,
            show: true
        },
        {
            id: 'users',
            label: 'User Management',
            icon: <Users size={20} />,
            show: isAdmin
        }
    ];

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 transition-all duration-300 z-50 flex flex-col border-r border-slate-800 ${isCollapsed ? 'w-20' : 'w-72'
                }`}
        >
            {/* Logo Area */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                            <PackageOpen className="text-white" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight text-lg">ONEINV</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Warehouse MNG</span>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="mx-auto p-2 bg-blue-600 rounded-xl">
                        <PackageOpen className="text-white" size={24} />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                {menuItems.filter(item => item.show).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as any)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${currentView === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className={`${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`}>
                            {item.icon}
                        </div>
                        {!isCollapsed && (
                            <span className="font-semibold text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                {item.label}
                            </span>
                        )}
                        {!isCollapsed && currentView === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800/50 space-y-4">
                {/* Connection Status */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isConnected ? 'DB Online' : 'DB Offline'}
                        </span>
                    )}
                </div>

                {/* User Info */}
                {!isCollapsed && (
                    <div className="px-4 py-3 bg-slate-800/30 rounded-2xl border border-slate-700/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-slate-600/50">
                            {currentUser?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">{currentUser?.username}</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate uppercase">{currentUser?.role}</span>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
