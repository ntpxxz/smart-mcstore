import React from 'react';
import { CheckCircle, X, Printer } from 'lucide-react';

interface LabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
    autoCloseMs?: number;
}

const LabelModal: React.FC<LabelModalProps> = ({ isOpen, onClose, record, autoCloseMs }) => {
    React.useEffect(() => {
        if (isOpen && autoCloseMs) {
            const timer = setTimeout(onClose, autoCloseMs);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseMs, onClose]);

    if (!isOpen || !record) return null;

    const handlePrint = () => window.print();

    const getQrUrl = (r: any) => {
        if (!r) return "";
        const data = JSON.stringify({ t: "INB", po: r.po, ven: r.vendor, pn: r.partNo, inv: r.invoice, qty: r.qty });
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 animate-in fade-in duration-200">
            <style>{`
        @media print {
          @page { size: 4in 6in; margin: 0; }
          body * { visibility: hidden; }
          #printable-label, #printable-label * { visibility: visible; }
          #printable-label { position: fixed; left: 0; top: 0; width: 4in; height: 6in; margin: 0; padding: 0.2in; background: white; display: flex; flex-direction: column; justify-content: space-between; align-items: center; z-index: 9999; }
          .print-black { color: black !important; }
          .print-border { border-color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>

            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:w-auto print:max-w-none print:max-h-none print:block animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md no-print">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded-full">
                            <CheckCircle className="text-green-600" size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800">Ready to Print</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 bg-slate-100/50 flex justify-center overflow-auto print:p-0 print:bg-white custom-scrollbar">
                    <div id="printable-label" className="bg-white text-black shadow-xl ring-1 ring-black/5 flex flex-col relative print:shadow-none print:ring-0" style={{ width: '300px', height: '450px', padding: '16px' }}>
                        <div className="w-full flex justify-between items-end border-b-2 border-black pb-2 mb-2 print-border">
                            <div className="text-left">
                                <div className="text-[10px] uppercase font-bold text-slate-500">Received</div>
                                <div className="text-sm font-bold print-black">{record.receivedDate}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase font-bold text-slate-500">Vendor</div>
                                <div className="text-sm font-bold print-black truncate max-w-[150px]">{record.vendor || "Unknown"}</div>
                            </div>
                        </div>

                        <div className="w-full text-center py-1 flex-grow-0">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-0">Part Number</div>
                            <div className="text-xl font-black uppercase font-mono break-all leading-tight print-black">{record.partNo}</div>
                            <div className="text-xs font-medium text-slate-600 mt-1 line-clamp-2 px-1 leading-tight">{record.partName}</div>
                        </div>

                        <div className="flex-grow flex items-center justify-center py-2">
                            <div className="p-1 bg-white">
                                <img src={getQrUrl(record)} alt="QR Code" className="w-[160px] h-[160px] mix-blend-multiply" />
                            </div>
                        </div>

                        <div className="w-full border-t-2 border-black pt-2 grid grid-cols-2 gap-2 text-left print-border">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500">PO Number</div>
                                <div className="text-sm font-bold font-mono print-black truncate">{record.po}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500">Invoice No</div>
                                <div className="text-sm font-bold font-mono print-black truncate">{record.invoice}</div>
                            </div>

                            <div className="col-span-2 mt-1 border-2 border-black rounded p-2 flex justify-between items-center print-border bg-slate-50 print:bg-transparent">
                                <span className="font-bold text-sm uppercase">Quantity</span>
                                <span className="text-2xl font-black leading-none print-black">{record.qty}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white no-print">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98]"
                    >
                        <Printer size={18} />
                        Print Label
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelModal;
