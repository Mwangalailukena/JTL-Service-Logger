"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useClients } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { 
  Plus, 
  Building2, 
  UserCircle, 
  MapPin, 
  Filter, 
  MoreVertical, 
  Download, 
  X,
  History,
  ClipboardList,
  Edit2,
  Trash2,
  ArrowRight,
  Zap,
  Monitor,
  CheckCircle2,
  Search,
  Globe
} from "lucide-react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LocalClient } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";

function ClientsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { logs } = useServiceLogs();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isLoading = clients === undefined;
  
  const [clientForm, setClientForm] = useState({
    name: "",
    type: "corporate" as LocalClient["type"],
    location: "",
    contactPerson: ""
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  const filteredClients = useMemo(() => {
    return clients?.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const clientLogs = useMemo(() => {
    if (!selectedClient || !logs) return [];
    return logs.filter(l => l.clientId === selectedClient.firebaseId);
  }, [selectedClient, logs]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setClientForm({ name: "", type: "corporate", location: "", contactPerson: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: LocalClient) => {
    setModalMode('edit');
    setClientForm({ 
      name: client.name, 
      type: client.type, 
      location: client.location, 
      contactPerson: client.contactPerson 
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      await addClient(clientForm);
    } else if (selectedClient?.id) {
      await updateClient(selectedClient.id, clientForm);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (client: LocalClient) => {
    if (!confirm(`Confirm entity termination for "${client.name}"? This action is permanent.`)) return;
    await deleteClient(client.id!, client.firebaseId);
    setActiveMenuId(null);
    if (selectedClient?.id === client.id) setSelectedClient(null);
  };

  return (
    <DashboardLayout>
      <div className="relative space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Registry Index</h1>
            <p className="text-sm font-medium text-slate-500">Global ledger of client portfolios and regional hubs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-subtle transition-all">
              <Download size={14} /> Export index
            </button>
            <Button onClick={handleOpenCreate} size="sm" className="bg-slate-900 font-bold">
              <Plus size={16} className="mr-2" /> Register Entity
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 shadow-subtle">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by legal name, hub or liaison..." 
              className="h-9 w-full rounded-lg bg-slate-50 pl-9 pr-4 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-brand-500/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <select className="h-9 rounded-lg border-transparent bg-slate-50 px-3 text-[10px] font-black uppercase text-slate-600 outline-none focus:bg-white transition-all cursor-pointer tracking-widest">
            <option>All Sectors</option>
            <option>Corporate</option>
            <option>Government</option>
            <option>Residential</option>
          </select>
          <button className="h-9 px-3 rounded-lg border bg-white text-slate-500 hover:text-slate-900 transition-colors ml-auto">
             <Filter size={16} />
          </button>
        </div>

        <div className="rounded-xl border bg-white shadow-subtle overflow-hidden h-[calc(100vh-280px)] flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Details</TableHead>
                  <TableHead className="text-center">Classification</TableHead>
                  <TableHead>Liaison</TableHead>
                  <TableHead>Regional Hub</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClients && filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className={cn(
                        "group cursor-pointer transition-all",
                        selectedClient?.id === client.id ? "bg-brand-50/50" : ""
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight group-hover:text-brand-700">{client.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">UID: {client.firebaseId?.slice(0, 8) || 'LOCAL'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border",
                          client.type === 'corporate' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                          client.type === 'gov' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
                        )}>
                          {client.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <UserCircle size={14} className="text-slate-300" />
                          {client.contactPerson}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <MapPin size={14} className="text-slate-300" />
                          {client.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === client.firebaseId ? null : client.firebaseId)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuId === client.firebaseId && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border shadow-floating z-50 p-1.5 animate-in fade-in zoom-in-95">
                               <button 
                                onClick={() => { router.push(`/logs/history?clientId=${client.firebaseId}`); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md"
                               >
                                 <History size={14} /> View History
                               </button>
                               <button 
                                onClick={() => { router.push(`/logs/new?clientId=${client.firebaseId}`); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-md"
                               >
                                 <Zap size={14} /> Initialize Protocol
                               </button>
                               <div className="my-1 border-t"></div>
                               <button 
                                onClick={() => handleOpenEdit(client)}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md"
                               >
                                 <Edit2 size={14} /> Edit Profile
                               </button>
                               <button 
                                onClick={() => handleDelete(client)}
                                className="w-full flex items-center gap-2.5 p-2 text-xs font-bold text-danger-600 hover:bg-danger-50 rounded-md"
                               >
                                 <Trash2 size={14} /> Terminate Account
                               </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="py-24 text-center">
                        <Building2 className="mx-auto mb-4 opacity-10" size={64} />
                        <p className="text-slate-400 font-bold italic text-sm uppercase tracking-widest">Registry is empty</p>
                        <Button 
                          onClick={handleOpenCreate}
                          variant="ghost"
                          className="mt-4 text-xs font-black text-brand-600 uppercase tracking-widest"
                        >
                          Register First Entity
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-slate-50/50 px-6 py-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               Live Registry: <span className="text-slate-900">{filteredClients?.length || 0} entities</span>
             </span>
             <p className="text-[10px] font-medium text-slate-400 italic">Enterprise Edition - v1.2</p>
          </div>
        </div>

        {selectedClient && (
          <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={() => setSelectedClient(null)}></div>
            <aside className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-floating z-50 border-l flex flex-col animate-in slide-in-from-right duration-300">
              <header className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-100">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedClient.name}</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">{selectedClient.type} entity</span>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Regional Hub</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <MapPin size={16} className="text-slate-400" />
                      {selectedClient.location}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="metadata-label mb-2">Primary Liaison</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <UserCircle size={16} className="text-slate-400" />
                      {selectedClient.contactPerson}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Activity Ledger</h3>
                    <span className="bg-slate-100 text-[10px] font-black text-slate-500 px-2 py-0.5 rounded uppercase">{clientLogs.length} Events</span>
                  </div>
                  <div className="space-y-3">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-full mb-3" />
                          <div className="flex justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      ))
                    ) : clientLogs.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed rounded-2xl">
                        <ClipboardList className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No transaction history</p>
                      </div>
                    ) : (
                      clientLogs.map(log => (
                        <div key={log.id} className="p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:shadow-subtle transition-all group bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {log.jobType === 'ict' ? <Monitor size={14} className="text-blue-600" /> : <Zap size={14} className="text-amber-500" />}
                              <span className="text-[10px] font-black uppercase text-slate-400">{log.jobType} intervention</span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase",
                              log.status === 'completed' ? "bg-success-50 text-success-600 border-success-600/10" : "bg-brand-50 text-brand-600 border-brand-600/10"
                            )}>{log.status}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-2 mb-3">{log.description}</p>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.serviceDate).toLocaleDateString()}</span>
                            <button className="text-[10px] font-black text-brand-600 uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                              Inspect <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <footer className="p-6 border-t bg-slate-50/50 flex gap-3">
                <Button 
                  className="flex-1 bg-brand-600 shadow-lg shadow-brand-100 font-black"
                  onClick={() => { router.push(`/logs/new?clientId=${selectedClient.firebaseId}`); }}
                >
                  <Plus size={18} className="mr-2" /> Initialize Intervention
                </Button>
                <Button variant="outline" className="px-4 font-black" onClick={() => handleOpenEdit(selectedClient)}>
                  <Edit2 size={18} />
                </Button>
              </footer>
            </aside>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? "Register New Entity" : "Update Profile"} className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="metadata-label">Legal Entity Name</label>
            <input
              required
              placeholder="Enter official registered name"
              className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-brand-500/5 focus:bg-white transition-all text-sm font-bold"
              value={clientForm.name}
              onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="metadata-label">Classification</label>
              <select
                className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white transition-all text-[10px] font-black uppercase tracking-widest"
                value={clientForm.type}
                onChange={(e) => setClientForm({...clientForm, type: e.target.value as any})}
              >
                <option value="corporate">Corporate</option>
                <option value="residential">Residential</option>
                <option value="gov">Government</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="metadata-label">Regional Hub</label>
              <input
                required
                placeholder="City or Operational Region"
                className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white transition-all text-sm font-bold"
                value={clientForm.location}
                onChange={(e) => setClientForm({...clientForm, location: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="metadata-label">Primary Liaison</label>
            <input
              required
              placeholder="Designated contact person"
              className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white transition-all text-sm font-bold"
              value={clientForm.contactPerson}
              onChange={(e) => setClientForm({...clientForm, contactPerson: e.target.value})}
            />
          </div>
          
          <div className="pt-4 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1 font-black text-slate-400" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-slate-900 font-black">
              {modalMode === 'create' ? "Initialize Entity" : "Commit Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    }>
      <ClientsPageContent />
    </Suspense>
  );
}