'use client';

import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import InvoiceForm from './components/InvoiceForm';
import HistoryTable from './components/HistoryTable';
import LabelModal from './components/LabelModal';
import UserManagement from './components/UserManagement';

const API_BASE_URL = '/api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentView, setCurrentView] = useState<'invoices' | 'users'>('invoices');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data State
  const [history, setHistory] = useState<any[]>([]);
  const [poDatabase, setPoDatabase] = useState<any[]>([]);
  const [partsDatabase, setPartsDatabase] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<any>(null);

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
          fetchData(); // Refresh list
        } else {
          throw new Error("Failed to save");
        }
      } catch (err) {
        console.error("Save failed", err);
        alert("Error saving to database");
        throw err; // Propagate to form
      }
    } else {
      // Simple fallback if DB is down just to show UI works
      const offlineRecord = { ...newRecord, id: Date.now() };
      setHistory([offlineRecord, ...history]);
    }

    setPreviewRecord(newRecord);
    setIsModalOpen(true);
  };

  const deleteRecord = async (id: any) => {
    if (confirm("Delete this record from database?")) {
      if (isConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/invoices/${id}`, { method: 'DELETE' });
          if (res.ok) {
            alert("Record deleted successfully!");
            fetchData();
          } else {
            const errorData = await res.json();
            alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error("Delete failed", err);
          alert("Connection error: Could not delete the record.");
        }
      } else {
        setHistory(history.filter(rec => rec.id !== id));
        alert("Record removed from local view (Offline mode).");
      }
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans">
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
        className={`transition-all duration-300 p-4 sm:p-6 lg:p-8 min-h-screen ${isSidebarCollapsed ? 'ml-20' : 'ml-72'
          }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {currentView === 'invoices' ? 'Invoice System' : 'User Management'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {currentView === 'invoices'
                ? 'Manage and track warehouse inbound invoices'
                : 'Manage system users and access roles'}
            </p>
          </div>

          {currentView === 'invoices' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="xl:col-span-6 2xl:col-span-4 space-y-6">
                <InvoiceForm
                  currentUser={currentUser}
                  poDatabase={poDatabase}
                  partsDatabase={partsDatabase}
                  isConnected={isConnected}
                  onSave={handleSave}
                />
              </div>

              <div className="xl:col-span-6 2xl:col-span-8">
                <HistoryTable
                  history={history}
                  isConnected={isConnected}
                  onDelete={deleteRecord}
                  onPreview={(rec) => { setPreviewRecord(rec); setIsModalOpen(true); }}
                />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UserManagement />
            </div>
          )}
        </div>
      </main>

      <LabelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={previewRecord}
      />
    </div>
  );
}