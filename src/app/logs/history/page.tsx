"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useServiceLogsFiltered, useServiceLogs } from "@/hooks/use-service-logs";
import { useClients } from "@/hooks/use-clients";
import { useSync } from "@/providers/sync-provider";
import {
  Search,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  RefreshCw,
  MoreVertical,
  Filter,
  X,
  Building2,
  UserCircle,
  Clock,
  Zap,
  Monitor,
  Trash2,
  Edit2,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalServiceLog } from "@/lib/db";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 15;

function ServiceHistoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { syncNow, isSyncing } = useSync();
  const { deleteLog } = useServiceLogs();
  
  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    status: "all",
    type: "all",
    client: searchParams.get("clientId") || "all",
    startDate: "",
    endDate: ""
  });

  const [page, setPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [inspectedLog, setInspectedLog] = useState<LocalServiceLog | null>(null);

  const { clients } = useClients();
  const allLogs = useServiceLogsFiltered(filters);

  const totalItems = allLogs?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => 
    allLogs?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [allLogs, page]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    const cId = searchParams.get("clientId");
    if (q || cId) {
      setFilters(prev => ({
        ...prev, 
        search: q || prev.search, 
        client: cId || prev.client 
      }));
    }
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedLogs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLogs(newSet);
  };

  const handleDelete = async (log: LocalServiceLog) => {
    if (!confirm(`Confirm deletion of intervention for "${log.clientName}"? This action is permanent.`)) return;
    await deleteLog(log.id!, log.firebaseId);
    setActiveMenuId(null);
    if (inspectedLog?.id === log.id) setInspectedLog(null);
  };

  const handleExport = () => {
    const logsToExport = selectedLogs.size > 0 
      ? allLogs?.filter(l => l.id && selectedLogs.has(l.id)) 
      : allLogs;

    if (!logsToExport || logsToExport.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,Client,Type,Status,Duration,Technician,Description"].join(",") + "\n"
      + logsToExport.map(l => {
          return `${l.serviceDate},"${l.clientName}",${l.jobType},${l.status},${l.durationMinutes},"${l.technicianName}","${l.description.replace(/"/g, '""')}"`;
      }).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `operational_archive_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Operational History</h1>
            <p className="text-sm font-medium text-slate-500">Master ledger of all field interventions and technical logs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 shadow-subtle transition-all"
            >
              <Download size={14} /> Export {selectedLogs.size > 0 ? `(${selectedLogs.size})` : 'All'}
            </button>
            <button 
              onClick={syncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 shadow-subtle transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Refresh Handshake"}
            </button>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 shadow-subtle">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by client, tech or description..." 
              className="h-9 w-full rounded-lg bg-slate-50 pl-9 pr-4 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-brand-500/5 transition-all"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <select 
            className="h-9 rounded-lg border-transparent bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:bg-white transition-all cursor-pointer"
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="all">Sectors: All</option>
            <option value="ict">ICT Infrastructure</option>
            <option value="solar">Solar Systems</option>
          </select>

          <select 
            className="h-9 rounded-lg border-transparent bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:bg-white transition-all cursor-pointer max-w-[150px]"
            value={filters.client}
            onChange={(e) => handleFilterChange("client", e.target.value)}
          >
            <option value="all">Clients: All</option>
            {clients?.map(c => (
              <option key={c.id} value={c.firebaseId}>{c.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              <input 
                type="date" 
                className="h-9 w-[130px] rounded-lg bg-slate-50 pl-9 pr-2 text-[10px] font-bold text-slate-500 outline-none focus:bg-white transition-all"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              <input 
                type="date" 
                className="h-9 w-[130px] rounded-lg bg-slate-50 pl-9 pr-2 text-[10px] font-bold text-slate-500 outline-none focus:bg-white transition-all"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="rounded-xl border bg-white shadow-subtle overflow-hidden flex flex-col h-[calc(100vh-320px)]">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 px-6 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 h-3.5 w-3.5"
                      checked={selectedLogs.size === paginatedLogs?.length && paginatedLogs?.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogs(new Set(paginatedLogs?.map(l => l.id!) || []));
                        } else {
                          setSelectedLogs(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Client / Intervention</TableHead>
                  <TableHead className="text-center">Classification</TableHead>
                  <TableHead className="text-center">Lifecycle</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs?.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className={cn(
                      "cursor-pointer transition-all",
                      inspectedLog?.id === log.id ? "bg-brand-50/50" : "",
                      selectedLogs.has(log.id!) ? "bg-brand-50/30" : ""
                    )}
                    onClick={() => setInspectedLog(log)}
                  >
                    <td className="px-6 py-0 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLogs.has(log.id!)}
                        onChange={() => toggleSelection(log.id!)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 transition-all cursor-pointer"
                      />
                    </td>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-tight group-hover:text-brand-700">{log.clientName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                           <Clock size={10} className="text-slate-300" />
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                             {new Date(log.serviceDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
                        log.jobType === 'solar' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      )}>
                        {log.jobType === 'solar' ? 'SOLAR_PWR' : 'ICT_INFRA'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                        log.status === 'completed' ? 'bg-success-50 text-success-600 border-success-600/10' : 'bg-brand-50 text-brand-600 border-brand-600/10'
                      )}>
                        {log.status === 'completed' ? <CheckCircle2 size={10} /> : <div className="h-1 w-1 rounded-full bg-slate-300" />}
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-brand-50 flex items-center justify-center text-[9px] font-bold text-brand-600 border border-brand-100 uppercase">
                          {(log.technicianName || 'T').charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold text-surface-500 uppercase tracking-tight truncate max-w-[100px]">
                          {log.technicianName || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1.5 mr-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            log.syncStatus === 'synced' ? "bg-success-600 shadow-[0_0_4px_rgba(22,163,74,0.4)]" : "bg-warning-600 shadow-[0_0_4px_rgba(217,119,6,0.4)]"
                          )} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {log.syncStatus === 'synced' ? 'LIVE' : 'CACHED'}
                          </span>
                        </div>

                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === log.id ? null : log.id!)}
                            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
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
                               <button 
                                 onClick={() => router.push(`/logs/edit/${log.id}`)}
                                 className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md"
                               >
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {(!paginatedLogs || paginatedLogs.length === 0) && (
              <div className="py-24 text-center">
                <FileText className="mx-auto mb-4 opacity-10" size={64} />
                <p className="text-slate-400 font-bold italic text-sm">No operational records found in archive.</p>
                <button 
                  onClick={() => setFilters({ search: "", status: "all", type: "all", client: "all", startDate: "", endDate: "" })}
                  className="mt-4 text-xs font-bold text-brand-600 hover:underline"
                >
                  Reset active filters
                </button>
              </div>
            )}
          </div>

          {/* Unified Pagination Footer */}
          <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-3">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Found <span className="text-slate-900">{totalItems}</span> transactions
              </span>
              {selectedLogs.size > 0 && (
                <span className="bg-brand-600 text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm animate-in slide-in-from-left-2">
                  {selectedLogs.size} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 px-4">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  Page {page} of {totalPages || 1}
                </span>
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Log Inspection Drawer */}
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
                {/* Protocol Header */}
                <section className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Timestamp</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(inspectedLog.serviceDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Duration</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Clock size={14} className="text-slate-400" />
                      {inspectedLog.durationMinutes} Min
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Sync Status</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 capitalize">
                      <div className={cn("h-1.5 w-1.5 rounded-full", inspectedLog.syncStatus === 'synced' ? 'bg-success-600' : 'bg-warning-600')} />
                      {inspectedLog.syncStatus.split('_').join(' ')}
                    </div>
                  </div>
                </section>

                {/* Operator Details */}
                <section className="card-base p-5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                        {(inspectedLog.technicianName || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{inspectedLog.technicianName || 'Unknown Operator'}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Technician</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">ID: {inspectedLog.technicianId.slice(0,12)}...</span>
                </section>

                {/* Technical Brief */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Technical Brief</h3>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 min-h-[120px]">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {inspectedLog.description}
                    </p>
                  </div>
                </section>

                {/* Specialized Metrics */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Telemetry & Configuration</h3>
                  {inspectedLog.jobType === 'ict' ? (
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-xl border border-slate-100">
                          <p className="metadata-label mb-2">Topology</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{inspectedLog.ictData?.networkType || 'N/A'}</p>
                       </div>
                       <div className="p-4 rounded-xl border border-slate-100">
                          <p className="metadata-label mb-2">Attenuation</p>
                          <p className="text-xs font-bold text-slate-700">{inspectedLog.ictData?.signalStrength ? `${inspectedLog.ictData.signalStrength} dBm` : 'N/A'}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-xl border border-slate-100">
                          <p className="metadata-label mb-2">System DC Voltage</p>
                          <p className="text-xs font-bold text-slate-700">{inspectedLog.solarData?.systemVoltage ? `${inspectedLog.solarData.systemVoltage} V` : 'N/A'}</p>
                       </div>
                       <div className="p-4 rounded-xl border border-slate-100">
                          <p className="metadata-label mb-2">SOH (State of Health)</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-success-600 rounded-full" style={{ width: `${inspectedLog.solarData?.batteryHealth || 0}%` }} />
                             </div>
                             <span className="text-xs font-black text-slate-700">{inspectedLog.solarData?.batteryHealth || 0}%</span>
                          </div>
                       </div>
                    </div>
                  )}
                </section>

                {/* Conflict / Security Shield */}
                <div className="rounded-xl bg-brand-50 p-4 border border-brand-100 flex gap-3">
                   <ShieldAlert size={18} className="text-brand-600 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Data Integrity</p>
                     <p className="text-[11px] text-brand-700 font-medium leading-normal mt-1">
                       This record is cryptographically signed and immutable after cloud finalization. Changes require administrator approval.
                     </p>
                   </div>
                </div>
              </div>

              <footer className="p-6 border-t bg-slate-50/50 flex gap-3">
                <Button className="flex-1 bg-slate-900 font-black shadow-lg">
                  <Download size={18} className="mr-2" /> Generate Technical PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4 font-black"
                  onClick={() => router.push(`/logs/edit/${inspectedLog.id}`)}
                >
                  <Edit2 size={18} />
                </Button>
              </footer>
            </aside>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ServiceHistoryPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    }>
      <ServiceHistoryPageContent />
    </Suspense>
  );
}
