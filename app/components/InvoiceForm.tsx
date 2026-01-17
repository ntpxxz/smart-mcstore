import React, { useState, useEffect } from 'react';
import { FileText, User, Search, Calendar, Plus } from 'lucide-react';

interface InvoiceFormProps {
    currentUser: { username: string };
    poDatabase: any[];
    partsDatabase: any[];
    suppliersDatabase: any[];
    isConnected: boolean;
    onSave: (record: any) => Promise<void>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ currentUser, poDatabase, partsDatabase, suppliersDatabase, isConnected, onSave }) => {
    const [selectedPO, setSelectedPO] = useState("");
    const [vendor, setVendor] = useState("");
    const [partNo, setPartNo] = useState("");
    const [partName, setPartName] = useState("");
    const [isKnownPO, setIsKnownPO] = useState(false);
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
    const [qty, setQty] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);

    // PO Matching Logic
    useEffect(() => {
        const match = poDatabase.find(item => item.po.toLowerCase() === selectedPO.trim().toLowerCase());
        if (match) {
            setPartNo(match.partNo);
            setPartName(match.partName);
            setIsKnownPO(true);
        } else {
            setIsKnownPO(false);
        }
    }, [selectedPO, poDatabase]);

    // Part Number Auto-fill Logic (from PO Database)
    useEffect(() => {
        if (!isKnownPO && partNo.trim()) {
            const match = poDatabase.find(item => item.partNo.toLowerCase() === partNo.trim().toLowerCase());
            if (match) {
                setPartName(match.partName);
            }
        }
    }, [partNo, poDatabase, isKnownPO]);

    // System Part Auto-fill Logic (from System Parts Database)
    useEffect(() => {
        if (!isKnownPO && partNo.trim()) {
            const match = partsDatabase.find(item => item.sku.toLowerCase() === partNo.trim().toLowerCase());
            if (match) {
                setPartName(match.name);
            }
        }
    }, [partNo, partsDatabase, isKnownPO]);

    // Vendor Suggestions Logic
    useEffect(() => {
        const filtered = suppliersDatabase.filter(s =>
            s.name.toLowerCase().includes(vendor.toLowerCase())
        );
        setFilteredSuppliers(filtered);
    }, [vendor, suppliersDatabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPO || !partNo || !invoiceNo) return;

        setIsSubmitting(true);

        const newRecord = {
            po: selectedPO,
            vendor,
            partNo,
            partName,
            invoice: invoiceNo,
            invoiceDate,
            receivedDate,
            qty,
            user: currentUser.username,
            iqcstatus: 'Pending',
            timestamp: new Date().toISOString()
        };

        try {
            await onSave(newRecord);
            // Reset fields on success
            setInvoiceNo("");
            setQty("");
            // Optional: reset others if needed, but usually vendor/PO might be same for next item
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-white/50 flex items-center justify-between bg-white/40">
                <h2 className="font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100/80 text-blue-600 rounded-lg">
                        <FileText size={18} />
                    </div>
                    New Invoice Record
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Purchase Order (PO)</label>
                        <div className="relative group">
                            <input
                                type="text"
                                list="po-list"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none uppercase font-mono font-medium transition-all ${isKnownPO
                                    ? 'border-green-500/50 ring-4 ring-green-500/10 bg-green-50/50 text-green-700'
                                    : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                    }`}
                                placeholder="PO NUMBER"
                                value={selectedPO}
                                onChange={(e) => setSelectedPO(e.target.value)}
                                required
                            />
                            <Search size={16} className={`absolute left-3.5 top-3.5 pointer-events-none transition-colors ${isKnownPO ? 'text-green-600' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                            <datalist id="po-list">
                                {poDatabase.map((item) => (
                                    <option key={item.id} value={item.po}>{item.partNo}</option>
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Vendor Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                placeholder="Vendor Co., Ltd."
                                value={vendor}
                                onChange={(e) => {
                                    setVendor(e.target.value);
                                    setShowVendorSuggestions(true);
                                }}
                                onFocus={() => setShowVendorSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)}
                            />
                            <User size={16} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />

                            {showVendorSuggestions && (
                                <div className="absolute z-50 w-full top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredSuppliers.length > 0 ? (
                                        filteredSuppliers.map((supplier) => (
                                            <button
                                                key={supplier.id}
                                                type="button"
                                                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex flex-col border-b border-slate-50 last:border-0"
                                                onClick={() => {
                                                    setVendor(supplier.name);
                                                    setShowVendorSuggestions(false);
                                                }}
                                            >
                                                <span className="font-bold text-slate-800 text-sm">{supplier.name}</span>
                                                {supplier.country && <span className="text-[10px] text-slate-500 uppercase font-medium">{supplier.country}</span>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 italic">
                                            No matching suppliers found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl p-5 border transition-all duration-300 flex flex-col gap-4 ${isKnownPO
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-inner'
                    : 'bg-slate-50 border-slate-100'
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            Part Details
                            {isKnownPO ? (
                                <span className="text-[10px] bg-blue-200/50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">AUTO-FILLED</span>
                            ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">MANUAL ENTRY</span>
                            )}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-3 space-y-1.5">
                            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Part Number</label>
                            <input
                                type="text"
                                list="part-list"
                                value={partNo}
                                onChange={(e) => setPartNo(e.target.value)}
                                readOnly={isKnownPO}
                                className={`w-full p-3 text-sm font-mono font-bold rounded-lg border transition-all ${isKnownPO
                                    ? 'bg-white/50 border-transparent shadow-sm text-slate-700'
                                    : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    }`}
                                placeholder="Enter Part No"
                                required
                            />
                            <datalist id="part-list">
                                {poDatabase.map((item) => (
                                    <option key={`po-${item.id}`} value={item.partNo}>{item.partName}</option>
                                ))}
                                {partsDatabase.map((item) => (
                                    <option key={`part-${item.id}`} value={item.sku}>{item.name}</option>
                                ))}
                            </datalist>
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Description</label>
                            <input
                                type="text"
                                value={partName}
                                onChange={(e) => setPartName(e.target.value)}
                                readOnly={isKnownPO}
                                className={`w-full p-3 text-sm font-medium rounded-lg border transition-all ${isKnownPO
                                    ? 'bg-white/50 border-transparent shadow-sm text-slate-700'
                                    : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    }`}
                                placeholder="Enter Part Name"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Received Date</label>
                        <div className="relative group">
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                value={receivedDate}
                                onChange={(e) => setReceivedDate(e.target.value)}
                                required
                            />
                            <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Invoice Date</label>
                        <div className="relative group">
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                            <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Invoice Number</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono font-medium text-slate-700 placeholder:text-slate-400"
                            placeholder="INV-..."
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide ml-1">Qty Received</label>
                        <input
                            type="number"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono font-medium text-slate-700 placeholder:text-slate-400"
                            placeholder="0"
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={!selectedPO || !partNo || isSubmitting}
                        className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus size={20} className="stroke-[3]" />
                                Record Invoice
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
