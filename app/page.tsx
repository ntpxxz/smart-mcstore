'use client';

import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import InvoiceForm from './components/InvoiceForm';
import HistoryTable from './components/HistoryTable';
import LabelModal from './components/LabelModal';
import UserManagement from './components/UserManagement';
import SupplierManagement from './components/SupplierManagement';
import TaskQueue from './components/TaskQueue';
import Toast, { ToastType } from './components/Toast';

const API_BASE_URL = '/api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentView, setCurrentView] = useState<'invoices' | 'users' | 'suppliers' | 'history'>('invoices');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data State
  const [history, setHistory] = useState<any[]>([]);
  const [poDatabase, setPoDatabase] = useState<any[]>([]);
  const [partsDatabase, setPartsDatabase] = useState<any[]>([]);
  const [suppliersDatabase, setSuppliersDatabase] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<any>(null);
  const [canPrintLabel, setCanPrintLabel] = useState(true);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const storedUser = localStorage.getItem('warehouse_user_session');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  // --- API: FETCH DATA ---
  const fetchData = async () => {
    try {
      const invRes = await fetch(`${API_BASE_URL}/invoices`);
      if (!invRes.ok) throw new Error("API Error");
      const invData = await invRes.json();
      setHistory(invData);

      const poRes = await fetch(`${API_BASE_URL}/pos`);
      if (!poRes.ok) throw new Error("API Error");
      const poData = await poRes.json();
      setPoDatabase(poData);

      const partsRes = await fetch(`${API_BASE_URL}/parts`);
      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setPartsDatabase(partsData);
      }

      const suppliersRes = await fetch(`${API_BASE_URL}/suppliers`);
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliersDatabase(suppliersData);
      }

      const tasksRes = await fetch(`${API_BASE_URL}/tasks`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      setIsConnected(true);
    } catch (err) {
      console.warn("Backend not detected.", err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // --- HANDLERS ---
  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('warehouse_user_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('invoices');
    localStorage.removeItem('warehouse_user_session');
  };

  const handleSave = async (newRecord: any) => {
    if (isConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        });
        if (res.ok) {
          showToast("Invoice saved successfully!");
          fetchData(); // Refresh list
        } else {
          throw new Error("Failed to save");
        }
      } catch (err) {
        console.error("Save failed", err);
        showToast("Error saving to database", "error");
        throw err; // Propagate to form
      }
    } else {
      // Simple fallback if DB is down just to show UI works
      const offlineRecord = { ...newRecord, id: Date.now() };
      setHistory([offlineRecord, ...history]);
    }

    setPreviewRecord(newRecord);
    setCanPrintLabel(true);
    setIsModalOpen(true);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sync`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        if (data.stats && data.stats.added > 0) {
          showToast(`✅ Successfully added ${data.stats.added} new tasks! (Filtered: ${data.stats.skipped} unrelated items)`, "success");
        } else {
          showToast(`ℹ️ No new Ramp/Diverter tasks found. (Filtered: ${data.stats.skipped} other items)`, "info");
        }
        fetchData();
      } else {
        const errorMessage = data.error || data.details || "Sync failed";
        showToast(`❌ Sync Error: ${errorMessage}`, "error");
      }
    } catch (err) {
      console.error("Sync failed", err);
      showToast("❌ Connection error: Could not reach the API.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProcessTask = async (task: any) => {
    // Prepare invoice record from task
    const newRecord = {
      po: task.po,
      vendor: task.vendor,
      partNo: task.partNo,
      partName: task.partName,
      invoice: task.invoiceNo || `INV-${task.po.split('-').pop()}-${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
      qty: task.qty.toString(),
      user: currentUser.username,
      iqcstatus: 'Pending',
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Generate Tag Number if not exists
      const tagNo = task.tagNo || `TAG-${Date.now().toString().slice(-8)}`;

      // 2. Save as Invoice (Mark as documented in history)
      await handleSave({ ...newRecord, tagNo });

      // 3. Update Task Status to PENDING
      await fetch(`${API_BASE_URL}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: 'PENDING',
          tagNo: tagNo
        })
      });

      // 4. Notify Warehouse Mobile System
      try {
        const notifyRes = await fetch(`${API_BASE_URL}/notify-warehouse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task,
            invoice: newRecord.invoice,
            user: currentUser.username
          })
        });

        if (notifyRes.ok) {
          const notifyData = await notifyRes.json();
          console.log('✅ Warehouse Mobile Notified:', notifyData);
          showToast('📱 Notification sent to warehouse mobile', 'success');
        } else {
          console.warn('⚠️ Failed to notify warehouse mobile');
          showToast('Warning: Warehouse mobile notification failed', 'warning');
        }
      } catch (notifyErr) {
        console.error('Notify error:', notifyErr);
      }

      // 5. Refresh data
      fetchData();
      showToast('✅ Tracking printed & notification sent!', 'success');

    } catch (err) {
      console.error("Failed to process task", err);
      showToast('Failed to process task', 'error');
    }
  };

  const deleteRecord = async (id: any) => {
    if (confirm("Delete this record from database?")) {
      if (isConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/invoices/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast("Record deleted successfully!");
            fetchData();
          } else {
            const errorData = await res.json();
            showToast(`Failed to delete: ${errorData.error || 'Unknown error'}`, "error");
          }
        } catch (err) {
          console.error("Delete failed", err);
          showToast("Connection error: Could not delete the record.", "error");
        }
      } else {
        setHistory(history.filter(rec => rec.id !== id));
        showToast("Record removed from local view (Offline mode).", "info");
      }
    }
  };

  const updateStatus = async (id: any, status: string) => {
    if (isConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/invoices/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iqcstatus: status })
        });
        if (res.ok) {
          showToast("Status updated successfully!");
          fetchData();
        } else {
          showToast("Failed to update status", "error");
        }
      } catch (err) {
        console.error("Update failed", err);
        showToast("Connection error: Could not update status.", "error");
      }
    } else {
      // Offline fallback
      setHistory(history.map(rec =>
        rec.id === id ? { ...rec, iqcstatus: status } : rec
      ));
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#AECBEB] relative overflow-hidden font-sans text-slate-800">
      {/* Background effects to mimic clouds/sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#BFE0F5] via-[#D6EAF8] to-[#EBF5FB] z-0" />

      {/* Cloud-like blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/40 rounded-full blur-[100px] opacity-60 z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/40 rounded-full blur-[100px] opacity-60 z-0" />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-white/30 rounded-full blur-[80px] opacity-40 z-0" />

      <div className="relative z-10 flex">
        <Sidebar
          currentUser={currentUser}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          isConnected={isConnected}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main
          className={`transition-all duration-300 p-4 sm:p-6 lg:p-8 min-h-screen flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-72'
            }`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {currentView === 'invoices' ? 'Inbound Tasks' : currentView === 'history' ? 'Received History' : currentView === 'users' ? 'User Management' : 'Supplier Management'}
              </h1>
              <p className="text-slate-600 text-sm font-medium">
                {currentView === 'invoices'
                  ? 'Manage and track warehouse inbound tasks'
                  : currentView === 'history'
                    ? 'View and export received invoice history'
                    : currentView === 'users'
                      ? 'Manage system users and access roles'
                      : 'Manage product suppliers and vendors'}
              </p>
            </div>

            {currentView === 'invoices' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TaskQueue
                  tasks={tasks}
                  onSync={handleSync}
                  onProcess={handleProcessTask}
                  isSyncing={isSyncing}
                />
              </div>
            ) : currentView === 'history' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <HistoryTable
                  history={history}
                  isConnected={isConnected}
                  onDelete={deleteRecord}
                  onUpdateStatus={updateStatus}
                  onPreview={(rec) => { setPreviewRecord(rec); setCanPrintLabel(false); setIsModalOpen(true); }}
                />
              </div>
            ) : currentView === 'users' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <UserManagement />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SupplierManagement />
              </div>
            )}
          </div>
        </main>
      </div>

      <LabelModal
        isOpen={isModalOpen}
        autoCloseMs={10000}
        onClose={() => setIsModalOpen(false)}
        record={previewRecord}
        canPrint={canPrintLabel}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={6000}
        />
      )}
    </div>
  );
}