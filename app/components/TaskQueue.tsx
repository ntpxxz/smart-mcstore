import React, { useState } from 'react';
import { ClipboardList, RefreshCw, Printer, CheckCircle2, Clock, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';

interface Task {
    id: number;
    po: string;
    vendor: string;
    partNo: string;
    partName: string;
    qty: number;
    invoiceNo: string;
    externalDate: string;
    status: string;
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
    const itemsPerPage = 5;

    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    // Pagination Logic
    const totalPages = Math.ceil(pendingTasks.length / itemsPerPage);
    const currentTasks = pendingTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header with Sync Button */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between bg-white/40">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-100/80 text-indigo-600 rounded-lg">
                            <ClipboardList size={18} />
                        </div>
                        Inbound Tasks
                    </h2>
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync API'}
                    </button>
                </div>

                <div className="p-6">
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                <Clock size={24} />
                            </div>
                            <p className="text-slate-500 font-medium">No pending tasks</p>
                            <p className="text-slate-400 text-xs mt-1">Click Sync to fetch new data from API</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                            {/* Received Time */}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Received Time</p>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {new Date(task.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {new Date(task.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* PO & Invoice */}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PO / Invoice</p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                        {task.po}
                                                    </span>
                                                    {task.invoiceNo && (
                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                            {task.invoiceNo}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Part Number */}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Part Number</p>
                                                <p className="font-bold text-slate-800 font-mono">{task.partNo}</p>
                                            </div>

                                            {/* Quantity */}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</p>
                                                <p className="font-bold text-slate-900 text-lg">{task.qty} <span className="text-xs text-slate-400 font-normal">PCS</span></p>
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                                                <p className="text-sm text-slate-600 line-clamp-1 italic" title={task.partName}>
                                                    {task.partName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                            <div className="hidden lg:block h-10 w-px bg-slate-100 mx-2" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onProcess(task);
                                                }}
                                                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                            >
                                                <Printer size={18} />
                                                Print Tracking
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="text-xs text-slate-500 font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 transition-all hover:bg-slate-50"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 transition-all hover:bg-slate-50"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
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
                                    <p className="font-bold text-slate-800 text-lg">{selectedTask.qty}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">{selectedTask.partName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">External Date</p>
                                    <p className="text-xs text-slate-500">{selectedTask.externalDate || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created At</p>
                                    <p className="text-xs text-slate-500">{new Date(selectedTask.createdAt).toLocaleString()}</p>
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
                                    Print Tracking
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

            {/* History Section (Optional/Collapsed) */}
            {/*
            {completedTasks.length > 0 && (
                <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden">
                    <div className="px-6 py-3 border-b border-white/20 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            Recently Completed
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                            {completedTasks.length}
                        </span>
                    </div>
                    <div className="divide-y divide-white/20">
                        {completedTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="px-6 py-3 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-slate-500">{task.po}</span>
                                    <span className="text-slate-400">|</span>
                                    <span className="text-slate-600">{task.partNo}</span>
                                </div>
                                <span className="text-slate-400 italic">
                                    {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
                */}
        </div>
    );
};

export default TaskQueue;
