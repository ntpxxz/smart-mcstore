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
    PackageOpen,
    Truck
} from 'lucide-react';

interface SidebarProps {
    currentUser: any;
    currentView: 'invoices' | 'users' | 'suppliers' | 'history';
    setCurrentView: (view: 'invoices' | 'users' | 'suppliers' | 'history') => void;
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
            label: 'Inbound Tasks',
            icon: <FileText size={20} />,
            show: true
        },
        {
            id: 'history',
            label: 'Received History',
            icon: <Database size={20} />,
            show: true
        },
        {
            id: 'suppliers',
            label: 'Suppliers',
            icon: <Truck size={20} />,
            show: isAdmin
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
            className={`fixed left-0 top-0 h-screen bg-white/40 backdrop-blur-xl border-r border-white/60 transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-20' : 'w-72'
                }`}
        >
            {/* Logo Area */}
            <div className="p-6 flex items-center justify-between border-b border-white/40">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                            <PackageOpen className="text-white" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 tracking-tight text-lg">ONEINV</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Warehouse MNG</span>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="mx-auto p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
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
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'hover:bg-white/60 text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <div className={`${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`}>
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
            <div className="p-4 border-t border-white/40 space-y-4">
                {/* Connection Status */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-white/40 border border-white/50 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {isConnected ? 'DB Online' : 'DB Offline'}
                        </span>
                    )}
                </div>

                {/* User Info */}
                {!isCollapsed && (
                    <div className="px-4 py-3 bg-white/40 rounded-2xl border border-white/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-900/10">
                            {currentUser?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-800 truncate">{currentUser?.username}</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate uppercase">{currentUser?.role}</span>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-md"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
