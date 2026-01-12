'use client';

import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import HistoryTable from './components/HistoryTable';
import LabelModal from './components/LabelModal';

const API_BASE_URL = '/api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Data State
  const [history, setHistory] = useState<any[]>([]);
  const [poDatabase, setPoDatabase] = useState<any[]>([]);

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
          await fetch(`${API_BASE_URL}/invoices/${id}`, { method: 'DELETE' });
          fetchData();
        } catch (err) { console.error("Delete failed", err); }
      } else {
        setHistory(history.filter(rec => rec.id !== id));
      }
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans pb-20">
      <Header
        currentUser={currentUser}
        isConnected={isConnected}
        onLogout={handleLogout}
      />

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <InvoiceForm
          currentUser={currentUser}
          poDatabase={poDatabase}
          isConnected={isConnected}
          onSave={handleSave}
        />

        <HistoryTable
          history={history}
          isConnected={isConnected}
          onDelete={deleteRecord}
          onPreview={(rec) => { setPreviewRecord(rec); setIsModalOpen(true); }}
        />
      </main>

      <LabelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={previewRecord}
      />
    </div>
  );
}