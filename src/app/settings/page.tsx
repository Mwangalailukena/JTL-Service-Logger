"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/providers/auth-provider";
import { useSync } from "@/providers/sync-provider";
import { 
  User, 
  Database, 
  Shield, 
  Monitor, 
  RefreshCw, 
  Cloud, 
  HardDrive,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { profile } = useAuth();
  const { lastSyncTime, isOnline, syncNow, isSyncing } = useSync();
  const [activeTab, setActiveTab] = useState<'profile' | 'sync' | 'security'>('profile');

  const handleClearLocal = async () => {
    if (!confirm("This will clear all offline data. You will need to re-sync. Continue?")) return;
    await db.delete();
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
          <p className="text-slate-500 font-medium">Manage your profile, sync engine, and local storage.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation */}
          <aside className="space-y-1">
             <button 
               onClick={() => setActiveTab('profile')}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'profile' ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
               )}
             >
                <User size={18} /> Profile Details
             </button>
             <button 
               onClick={() => setActiveTab('sync')}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'sync' ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
               )}
             >
                <Database size={18} /> Storage & Sync
             </button>
             <button 
               onClick={() => setActiveTab('security')}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'security' ? "bg-brand-50 text-brand-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
               )}
             >
                <Shield size={18} /> Security
             </button>
          </aside>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === 'profile' && (
              <section className="card-base p-6 animate-in fade-in duration-300">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Active Operator</h3>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black">
                    {profile?.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{profile?.displayName}</p>
                    <p className="text-sm font-medium text-slate-500">{profile?.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-widest border border-brand-100">
                      {profile?.role} Access
                    </span>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'sync' && (
              <>
                <section className="card-base p-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sync Engine</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={syncNow}
                      disabled={isSyncing || !isOnline}
                      className="h-8"
                    >
                      <RefreshCw size={14} className={isSyncing ? "animate-spin mr-2" : "mr-2"} />
                      Force Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Cloud size={20} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Cloud Link Status</p>
                          <p className="text-[11px] text-slate-500">Real-time connection to Firebase Firestore.</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-tighter ${isOnline ? 'text-success-600 bg-success-50 border-success-600/10' : 'text-danger-600 bg-danger-50 border-danger-600/10'}`}>
                        {isOnline ? 'Active' : 'Disconnected'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <HardDrive size={20} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Last Successful Handshake</p>
                          <p className="text-[11px] text-slate-500">Last time data was verified against cloud storage.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        {lastSyncTime ? lastSyncTime.toLocaleString() : 'Pending Sync'}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="card-base p-6 border-danger-600/10 bg-danger-50/10 animate-in fade-in duration-300">
                  <h3 className="text-xs font-black uppercase tracking-widest text-danger-600 mb-4">Danger Zone</h3>
                  <p className="text-[11px] text-slate-500 mb-6">
                    Clearing local storage will remove all cached service logs, clients, and technical documentation. 
                    This action cannot be undone, but data will be restored upon next cloud synchronization.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full font-bold"
                    onClick={handleClearLocal}
                  >
                    <Trash2 size={14} className="mr-2" /> Purge Local Data Cache
                  </Button>
                </section>
              </>
            )}

            {activeTab === 'security' && (
              <section className="card-base p-6 animate-in fade-in duration-300 text-center py-12">
                <Shield size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-sm font-bold text-slate-900 mb-2">Security Protocols Enabled</h3>
                <p className="text-xs text-slate-500">Your session is protected by enterprise-grade SSO and hardware-backed local persistence.</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
