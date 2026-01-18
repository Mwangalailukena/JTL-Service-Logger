"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Calendar,
  Filter,
  ArrowRight,
  Monitor,
  Zap,
  MoreVertical,
  BarChart,
  Wifi,
  WifiOff,
  Eye,
  Edit2,
  Trash2,
  X,
  Building2,
  ShieldAlert,
  Download
} from "lucide-react";
import Link from "next/link";
import { seedFirestore } from "@/lib/seed-firestore";
import { useState, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSync } from "@/providers/sync-provider";
import { LocalServiceLog } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { logs, deleteLog } = useServiceLogs();
  const { lastSyncTime, isOnline, isSyncing } = useSync();
  const [chartRange, setChartRange] = useState<7 | 30>(7);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [inspectedLog, setInspectedLog] = useState<LocalServiceLog | null>(null);

  // --- Advanced Operational Analytics ---
  const analytics = useMemo(() => {
    // If logs is undefined, it means Dexie is still loading
    if (logs === undefined) return { 
      chart: [], ictPct: 0, solarPct: 0, completed: 0, pending: 0, logTrend: "0%", jobTrend: "0%",
      isLoading: true 
    };

    if (logs.length === 0) return { 
      chart: [], ictPct: 0, solarPct: 0, completed: 0, pending: 0, logTrend: "0%", jobTrend: "0%",
      isLoading: false 
    };

    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

    const currentMonthLogs = logs.filter(l => new Date(l.serviceDate).getMonth() === thisMonth);
    const lastMonthLogs = logs.filter(l => new Date(l.serviceDate).getMonth() === lastMonth);

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const pct = Math.round(((curr - prev) / prev) * 100);
      return (pct >= 0 ? "+" : "") + pct + "%";
    };

    const logTrend = calculateTrend(currentMonthLogs.length, lastMonthLogs.length);
    const completedTrend = calculateTrend(
      currentMonthLogs.filter(l => l.status === 'completed').length,
      lastMonthLogs.filter(l => l.status === 'completed').length
    );

    const completed = logs.filter(l => l.status === 'completed').length;
    const pending = logs.filter(l => l.syncStatus !== 'synced').length;
    
    const total = logs.length || 1;
    const ictCount = logs.filter(l => l.jobType === 'ict').length;
    const ictPct = Math.round((ictCount / total) * 100);
    const solarPct = 100 - ictPct;

    // Service Velocity (Dynamic Range)
    const chartData = Array.from({ length: chartRange }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (chartRange - 1 - i));
      const count = logs.filter(l => new Date(l.serviceDate).toDateString() === date.toDateString()).length;
      return { 
        name: chartRange === 7 ? date.toLocaleDateString(undefined, { weekday: 'short' }) : date.getDate().toString(), 
        logs: count 
      };
    });

    return { chart: chartData, ictPct, solarPct, completed, pending, logTrend, jobTrend: completedTrend, isLoading: false };
  }, [logs, chartRange]);

  const handleDelete = async (log: LocalServiceLog) => {
    if (!confirm(`Permanently delete log for ${log.clientName}?`)) return;
    await deleteLog(log.id!, log.firebaseId);
    setActiveMenuId(null);
  };

  const isLoading = analytics.isLoading || (isSyncing && (!logs || logs.length === 0));

  return (
    <DashboardLayout>
      <div className="space-y-8 relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Operational Overview</h1>
            <p className="text-sm font-medium text-surface-500 mt-0.5">Real-time telemetry and field intervention metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/logs/new">
              <button className="flex h-9 items-center gap-2 rounded-md bg-brand-600 px-4 text-[11px] font-black uppercase tracking-widest text-white shadow-elevation transition-all hover:bg-brand-700">
                <Plus size={14} />
                <span>Initialize Log</span>
              </button>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Registry Total" 
            value={isLoading ? "..." : (logs?.length || 0)} 
            trend={!isLoading ? { value: analytics.logTrend, isUp: !analytics.logTrend.startsWith('-') } : undefined}
            icon={Clock} 
            description="Total service interventions logged across all clients."
            color="blue"
          />
          <StatCard 
            title="Finalized Jobs" 
            value={isLoading ? "..." : analytics.completed} 
            trend={!isLoading ? { value: analytics.jobTrend, isUp: !analytics.jobTrend.startsWith('-') } : undefined}
            icon={CheckCircle2} 
            description="Interventions successfully finalized and verified."
            color="green"
          />
          <StatCard 
            title="Sync Backlog" 
            value={isLoading ? "..." : analytics.pending} 
            trend={!isLoading ? { value: analytics.pending > 0 ? "Active" : "Synced", isUp: analytics.pending === 0 } : undefined}
            icon={AlertCircle} 
            description="Items queued in local storage awaiting cloud sync."
            color="amber"
          />
           <StatCard 
            title="System Health" 
            value={isOnline ? "Active" : "Offline"} 
            icon={isOnline ? Wifi : WifiOff} 
            description={`Last cloud handshake: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}`}
            color={isOnline ? "purple" : "amber"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Velocity Chart with Range Controls */}
          <div className="lg:col-span-2 card-base p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="metadata-label mb-1">Service Velocity</p>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{chartRange}-Day Intervention Volume</h3>
              </div>
              <div className="flex items-center gap-1 rounded-lg border bg-surface-50 p-1">
                <button 
                  onClick={() => setChartRange(7)}
                  className={cn(
                    "rounded-md px-3 py-1 text-[10px] font-black uppercase transition-all",
                    chartRange === 7 ? "bg-white text-slate-900 shadow-subtle" : "text-surface-400 hover:text-slate-600"
                  )}
                >7D</button>
                <button 
                  onClick={() => setChartRange(30)}
                  className={cn(
                    "rounded-md px-3 py-1 text-[10px] font-black uppercase transition-all",
                    chartRange === 30 ? "bg-white text-slate-900 shadow-subtle" : "text-surface-400 hover:text-slate-600"
                  )}
                >30D</button>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Analytics...</span>
                  </div>
                </div>
              ) : analytics.chart.length > 0 && analytics.chart.some(d => d.logs > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chart}>
                    <defs>
                      <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="logs" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLogs)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Database size={24} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activity in this range</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats/Widgets */}
          <div className="space-y-6">
            <div className="rounded-lg bg-surface-900 p-6 text-white shadow-floating border-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mb-6">Service Composition</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    <span>ICT INFRA</span>
                    <span>{isLoading ? "0%" : `${analytics.ictPct}%`}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                      style={{ width: `${isLoading ? 0 : analytics.ictPct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    <span>SOLAR & POWER</span>
                    <span>{isLoading ? "0%" : `${analytics.solarPct}%`}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-warning-600 shadow-[0_0_8px_rgba(217,119,6,0.5)] transition-all duration-1000 ease-out" 
                      style={{ width: `${isLoading ? 0 : analytics.solarPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <Link href="/reports">
                <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-white/10">
                  <BarChart size={14} />
                  Analytics Hub
                </button>
              </Link>
            </div>

            <div className="card-base p-6">
              <p className="metadata-label mb-4 flex items-center gap-2">
                <Monitor size={14} className="text-brand-600" />
                Network Integrity
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-50 border border-surface-100">
                   <span className="text-[11px] font-bold text-surface-600">Persistence Engine</span>
                   <span className="text-[9px] font-black uppercase text-success-600 bg-success-50 px-2 py-0.5 rounded border border-success-600/10 tracking-widest">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-50 border border-surface-100">
                   <span className="text-[11px] font-bold text-surface-600">Cloud Linkage</span>
                   <span className={cn(
                     "text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest",
                     isOnline ? "text-brand-600 bg-brand-50 border-brand-600/10" : "text-amber-600 bg-amber-50 border-amber-600/10"
                   )}>
                     {isOnline ? 'CONNECTED' : 'OFFLINE'}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Operational Feed */}
        <div className="card-base overflow-hidden">
          <div className="flex items-center justify-between border-b p-4 bg-white">
            <div>
              <p className="metadata-label">Operational Feed</p>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Latest Real-time Transactions</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/logs/history">
                <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-surface-50 transition-colors">
                  <ArrowRight size={12} /> Master Archive
                </button>
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[400px]">
            {isLoading && !logs ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                 <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Archive...</span>
              </div>
            ) : logs && logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity / Transaction</TableHead>
                    <TableHead className="text-center">Lifecycle</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.slice(0, 8).map((log) => (
                    <TableRow 
                      key={log.id} 
                      className={cn(
                        "group cursor-pointer",
                        inspectedLog?.id === log.id ? "bg-brand-50/50" : ""
                      )}
                      onClick={() => setInspectedLog(log)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">{log.clientName}</span>
                          <span className="text-[10px] text-surface-400 font-bold uppercase tracking-tighter mt-0.5">
                            {new Date(log.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                          log.status === 'completed' ? 'bg-success-50 text-success-600 border-success-600/10' : 'bg-brand-50 text-brand-600 border-brand-600/10'
                        )}>
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded bg-brand-50 flex items-center justify-center text-[9px] font-bold text-brand-600 border border-brand-100">
                             {(log.technicianName || 'T').charAt(0).toUpperCase()}
                           </div>
                           <span className="text-[11px] font-bold text-surface-500 uppercase tracking-tight truncate max-w-[100px]">
                             {log.technicianName || (log.technicianId && log.technicianId.slice(0, 8)) || 'System'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className={cn("h-1.5 w-1.5 rounded-full", log.syncStatus === 'synced' ? 'bg-success-600 shadow-[0_0_4px_rgba(22,163,74,0.4)]' : 'bg-warning-600 shadow-[0_0_4px_rgba(217,119,6,0.4)]')} />
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{log.syncStatus === 'synced' ? 'LIVE' : 'CACHED'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === log.id ? null : log.id!)}
                            className="p-1 text-surface-400 hover:text-brand-600 transition-colors rounded-md hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuId === log.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border shadow-floating z-50 p-1.5 animate-in fade-in zoom-in-95">
                               <button 
                                onClick={() => { setInspectedLog(log); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md"
                               >
                                 <Eye size={14} /> View Details
                               </button>
                               <button className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md">
                                 <Edit2 size={14} /> Edit Record
                               </button>
                               <div className="my-1 border-t"></div>
                               <button 
                                onClick={() => handleDelete(log)}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-danger-600 hover:bg-danger-50 rounded-md"
                               >
                                 <Trash2 size={14} /> Delete Entry
                               </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                 <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                    <Database size={32} className="text-slate-300" />
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-bold text-slate-900 uppercase">No logs detected</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Initialize your first service intervention to begin tracking.</p>
                 </div>
                 <Link href="/logs/new">
                   <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-colors">
                     Initialize Log
                   </button>
                 </Link>
              </div>
            )}
          </div>
          <div className="border-t p-3 bg-surface-50/50 text-center">
             <Link href="/logs/history">
               <button className="text-[10px] font-black text-surface-400 hover:text-brand-600 transition-colors uppercase tracking-widest">
                  Access Master Operational Archives
               </button>
             </Link>
          </div>
        </div>

        {/* Dashboard Log Inspection Drawer */}
        {inspectedLog && (
          <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={() => setInspectedLog(null)}></div>
            <aside className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-floating z-50 border-l flex flex-col animate-in slide-in-from-right duration-300">
              <header className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    inspectedLog.jobType === 'solar' ? "bg-warning-600 shadow-warning-100" : "bg-brand-600 shadow-brand-100"
                  )}>
                    {inspectedLog.jobType === 'solar' ? <Zap size={24} /> : <Monitor size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{inspectedLog.jobType} Intervention</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <Building2 size={12} className="text-slate-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{inspectedLog.clientName}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setInspectedLog(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Timestamp</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(inspectedLog.serviceDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Duration</p>
                    <p className="text-xs font-bold text-slate-700">{inspectedLog.durationMinutes || 0} Min</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Status</p>
                    <span className="text-[10px] font-black text-brand-600 uppercase">{inspectedLog.syncStatus}</span>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Technical Brief</h3>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 min-h-[120px]">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {inspectedLog.description}
                    </p>
                  </div>
                </section>

                <div className="rounded-xl bg-brand-50 p-4 border border-brand-100 flex gap-3">
                   <ShieldAlert size={18} className="text-brand-600 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Operator Identity</p>
                     <p className="text-[11px] text-brand-700 font-medium leading-normal mt-1">
                       Verified by {inspectedLog.technicianName} (UID: {inspectedLog.technicianId.slice(0, 8)})
                     </p>
                   </div>
                </div>
              </div>

              <footer className="p-6 border-t bg-slate-50/50 flex gap-3">
                <Button className="flex-1 bg-slate-900 font-black shadow-lg">
                  <Download size={18} className="mr-2" /> PDF Export
                </Button>
                <Button variant="outline" className="px-4 font-black" onClick={() => setInspectedLog(null)}>
                  Close Panel
                </Button>
              </footer>
            </aside>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}