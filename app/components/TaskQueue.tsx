import React, { useState, useMemo } from 'react';
import { ClipboardList, RefreshCw, Printer, CheckCircle2, Clock, ChevronLeft, ChevronRight, X, Info, ArrowUpDown } from 'lucide-react';

interface Task {
    id: string;
    po: string;
    vendor: string;
    partNo: string;
    partName: string;
    qty: number;
    invoiceNo: string;
    externalDate: string;
    status: string;
    displayStatus?: string;
    tagNo?: string | null;
    spec?: string;
    drawingNo?: string;
    unit?: string;
    remark?: string;
    taxInvoice?: string;
    createdAt: string;
}

interface TaskQueueProps {
    tasks: Task[];
    onSync: () => Promise<void>;
    onProcess: (task: Task) => Promise<void>;
    isSyncing: boolean;
}

const TaskQueue: React.FC<TaskQueueProps> = ({ tasks, onSync, onProcess, isSyncing }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'externalDate', direction: 'desc' });
    const itemsPerPage = 10;

    const processedTasks = useMemo(() => {
        let data = tasks.filter(t => t.status.toUpperCase() === 'ARRIVED');

        if (sortConfig.key) {
            data.sort((a: any, b: any) => {
                const valA = a[sortConfig.key] || "";
                const valB = b[sortConfig.key] || "";
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [tasks, sortConfig]);

    const totalPages = Math.ceil(processedTasks.length / itemsPerPage);
    const currentTasks = processedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-4 border-b border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-100/80 text-indigo-600 rounded-lg">
                            <ClipboardList size={18} />
                        </div>
                        Inbound Tasks (ARRIVED)
                    </h3>
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync API'}
                    </button>
                </div>

                <div className="p-6 pt-2">
                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full text-left text-sm min-w-[1000px]">
                            <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('externalDate')}>
                                        Received Date <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('vendor')}>
                                        Vendor <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('po')}>
                                        PO / Invoice <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('partNo')}>
                                        Part # <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('qty')}>
                                        Qty <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                                    </th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processedTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <div className="p-3 bg-slate-50 rounded-full">
                                                    <Clock size={24} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-medium">No arrived tasks found</p>
                                                <p className="text-xs">Tasks will appear here once they are received</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedTask(task)}>
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs font-medium">
                                                {formatDate(task.externalDate || task.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800 truncate max-w-[200px]" title={task.vendor}>
                                                {task.vendor || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">
                                                        {task.po}
                                                    </span>
                                                    {task.invoiceNo && (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                                                            {task.invoiceNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs font-bold text-slate-900">{task.partNo}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{task.partName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">{task.qty}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => onProcess(task)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Printer size={14} />
                                                        Print
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-6 -mb-6">
                            <div className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 rounded-lg text-xs bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-200 rounded-lg text-xs bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Info size={18} className="text-indigo-600" />
                                Task Details
                            </h3>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PO Number</p>
                                    <p className="font-mono font-bold text-indigo-600">{selectedTask.po}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Number</p>
                                    <p className="font-mono font-bold text-slate-700">{selectedTask.invoiceNo || '-'}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor</p>
                                    <p className="font-medium text-slate-800">{selectedTask.vendor || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Part Number</p>
                                    <p className="font-mono font-bold text-slate-800">{selectedTask.partNo}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="font-bold text-slate-800 text-lg">{selectedTask.qty}</p>
                                        <p className="text-xs text-slate-500">{selectedTask.unit || ''}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">{selectedTask.partName}</p>
                                </div>

                                {selectedTask.spec && (
                                    <div className="col-span-1 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spec</p>
                                        <p className="text-sm text-slate-700 font-medium">{selectedTask.spec}</p>
                                    </div>
                                )}
                                {selectedTask.drawingNo && (
                                    <div className="col-span-1 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drawing No.</p>
                                        <p className="text-sm text-slate-700 font-medium">{selectedTask.drawingNo}</p>
                                    </div>
                                )}
                                {selectedTask.remark && (
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remark</p>
                                        <p className="text-xs text-slate-600 italic bg-amber-50 p-2 rounded border border-amber-100">{selectedTask.remark}</p>
                                    </div>
                                )}
                                {selectedTask.taxInvoice && (
                                    <div className="col-span-1 space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Invoice</p>
                                        <p className="text-sm text-emerald-700 font-bold">{selectedTask.taxInvoice}</p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">External Date</p>
                                    <p className="text-xs text-slate-500">{selectedTask.externalDate || '-'}</p>
                                </div>
                                <div className="col-span-2 space-y-1 pt-2 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created At</p>
                                    <p className="text-xs text-slate-400">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => {
                                        onProcess(selectedTask);
                                        setSelectedTask(null);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    <Printer size={18} />
                                    Print Label
                                </button>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskQueue;
