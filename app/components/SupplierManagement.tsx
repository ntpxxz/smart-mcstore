import React, { useState, useEffect } from 'react';
import {
    Truck,
    Plus,
    Edit2,
    Trash2,
    Mail,
    User as UserIcon,
    X,
    Check,
    AlertCircle,
    Phone,
    MapPin,
    Globe,
    FileText
} from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    country: string | null;
    taxId: string | null;
    createdAt: string;
}

const SupplierManagement: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [countries, setCountries] = useState<string[]>([]);
    const [isCountriesLoading, setIsCountriesLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        taxId: ''
    });
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/suppliers');
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (err) {
            console.error("Failed to fetch suppliers", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCountries = async () => {
        setIsCountriesLoading(true);
        try {
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
            if (res.ok) {
                const data = await res.json();
                const countryNames = data.map((c: any) => c.name.common).sort();
                setCountries(countryNames);
            }
        } catch (err) {
            console.error("Failed to fetch countries", err);
        } finally {
            setIsCountriesLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchCountries();
    }, []);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactName: supplier.contactName || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                country: supplier.country || '',
                taxId: supplier.taxId || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                country: '',
                taxId: ''
            });
        }
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError("");

        const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
        const method = editingSupplier ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchSuppliers();
                // alert(editingSupplier ? "Supplier updated successfully!" : "Supplier created successfully!");
            } else {
                const data = await res.json();
                setFormError(data.error || "Something went wrong");
            }
        } catch (err) {
            setFormError("Connection error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            try {
                const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchSuppliers();
                    // alert("Supplier deleted successfully!");
                }
            } catch (err) {
                console.error("Delete failed", err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <Truck size={24} />
                    </div>
                    Supplier Management
                </h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Add New Supplier
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Supplier Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Country</th>
                                <th className="px-6 py-4">Tax ID</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No suppliers found.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{supplier.name}</span>
                                                <span className="text-xs text-slate-500">{supplier.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-medium">{supplier.contactName}</span>
                                                <span className="text-xs text-slate-500">{supplier.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">{supplier.country}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-mono text-xs">{supplier.taxId}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(supplier)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {editingSupplier ? <Edit2 size={18} /> : <Plus size={18} />}
                                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Supplier Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Company Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <Truck size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contact Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Contact Person"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        />
                                        <UserIcon size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="email@company.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="+1 234 567 890"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                        <Phone size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Country</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-slate-700 font-medium"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        >
                                            <option value="">Select Country</option>
                                            {isCountriesLoading ? (
                                                <option disabled>Loading countries...</option>
                                            ) : (
                                                countries.map((country) => (
                                                    <option key={country} value={country}>
                                                        {country}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <Globe size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                        <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Address</label>
                                    <div className="relative group">
                                        <textarea
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                                            placeholder="Full Address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                        <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tax ID / Registration No.</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Tax Identification Number"
                                            value={formData.taxId}
                                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                        />
                                        <FileText size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs">
                                    <AlertCircle size={16} />
                                    {formError}
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            {editingSupplier ? "Update Supplier" : "Create Supplier"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierManagement;
