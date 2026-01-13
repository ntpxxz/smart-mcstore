import React, { useState, useMemo } from 'react';
import { History, Filter, X, Download, ArrowUpDown, Printer, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryTableProps {
    history: any[];
    isConnected: boolean;
    onDelete: (id: any) => void;
    onPreview: (record: any) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ history, isConnected, onDelete, onPreview }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const processedHistory = useMemo(() => {
        let data = [...history];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(item =>
                (item.po || "").toLowerCase().includes(lower) ||
                (item.vendor || "").toLowerCase().includes(lower) ||
                (item.invoice || "").toLowerCase().includes(lower) ||
                (item.partNo || "").toLowerCase().includes(lower)
            );
        }
        if (sortConfig.key) {
            data.sort((a, b) => {
                const valA = a[sortConfig.key] || "";
                const valB = b[sortConfig.key] || "";
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [history, searchTerm, sortConfig]);

    const totalPages = Math.ceil(processedHistory.length / itemsPerPage);
    const currentTableData = processedHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        if (history.length === 0) return;
        const headers = ["Timestamp", "User", "Received Date", "Vendor", "PO", "Invoice", "Part No", "Qty"];
        const rows = history.map(r => [`"${r.timestamp}"`, `"${r.user}"`, r.receivedDate, `"${r.vendor}"`, r.po, r.invoice, r.partNo, r.qty]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `warehouse_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-200 text-slate-600 rounded-lg">
                        <History size={18} />
                    </div>
                    Received History
                </h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                        <input
                            type="text"
                            placeholder="Filter PO, Vendor, Invoice..."
                            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        <Filter size={14} className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all hover:shadow-sm active:scale-95"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('timestamp')}>
                                Date <ArrowUpDown size={12} className="inline ml-1 text-slate-300" />
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('vendor')}>Vendor</th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('invoice')}>Invoice</th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('po')}>PO #</th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('partNo')}>Part #</th>
                            <th className="px-6 py-4 text-right">Qty</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTableData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <div className="p-3 bg-slate-50 rounded-full">
                                            <History size={24} className="opacity-50" />
                                        </div>
                                        <p className="text-sm font-medium">{!isConnected ? "No local records. Connect Database." : "No records found."}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            currentTableData.map((rec) => (
                                <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs font-medium">{new Date(rec.timestamp).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800 truncate max-w-[150px]" title={rec.vendor}>{rec.vendor || "-"}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 bg-slate-50/50 rounded px-2 py-1 w-fit">{rec.invoice}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-blue-700">{rec.po}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs font-bold text-slate-900">{rec.partNo}</div>
                                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{rec.partName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{rec.qty}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{rec.recordedBy || "-"}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onPreview(rec)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Print Label"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(rec.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {processedHistory.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages || 1}</div>
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
    );
};

export default HistoryTable;
