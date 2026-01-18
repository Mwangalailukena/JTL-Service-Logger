"use client";

import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  Building2, 
  ClipboardList, 
  ArrowRight, 
  X,
  BookOpen,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { useKnowledgeBase } from "@/hooks/use-knowledge-base";
import { useSync } from "@/providers/sync-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

export function Header({ onToggleSidebar, isCollapsed }: HeaderProps) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const { clients } = useClients();
  const { logs } = useServiceLogs();
  const { articles } = useKnowledgeBase("", "all");
  const { isOnline, pendingCount, syncNow, isSyncing } = useSync();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // --- Global Search Engine Logic ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;

    const query = searchQuery.toLowerCase();
    
    const matchedClients = (clients || [])
      .filter(c => c.name.toLowerCase().includes(query) || c.location.toLowerCase().includes(query))
      .slice(0, 2);

    const matchedLogs = (logs || [])
      .filter(l => l.clientName.toLowerCase().includes(query) || l.description.toLowerCase().includes(query))
      .slice(0, 3);

    const matchedKB = (articles || [])
      .filter(a => a.title.toLowerCase().includes(query) || a.tags.some(t => t.toLowerCase().includes(query)))
      .slice(0, 3);

    return { 
      clients: matchedClients, 
      logs: matchedLogs, 
      kb: matchedKB,
      hasResults: matchedClients.length > 0 || matchedLogs.length > 0 || matchedKB.length > 0 
    };
  }, [searchQuery, clients, logs, articles]);

  // --- Notifications Logic ---
  const notifications = useMemo(() => {
    const items = [];
    
    if (!isOnline) {
      items.push({
        id: 'offline',
        title: 'System Offline',
        desc: 'Connectivity lost. Data is being saved locally.',
        icon: WifiOff,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        action: () => router.push('/help')
      });
    }

    if (pendingCount > 0) {
      items.push({
        id: 'sync',
        title: 'Pending Sync',
        desc: `${pendingCount} records awaiting cloud handshake.`,
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        action: () => syncNow()
      });
    }

    logs?.slice(0, 2).forEach(log => {
      items.push({
        id: log.id,
        title: 'Activity Logged',
        desc: `${log.clientName} intervention updated.`,
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        action: () => router.push(`/logs/history?clientId=${log.clientId}`)
      });
    });

    return items;
  }, [isOnline, pendingCount, logs, router, syncNow]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-8">
      <div className="flex flex-1 items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors hidden lg:block"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>

        <div className="relative w-full max-w-md hidden md:block ml-2" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search clients, logs, or KB guides..."
            className={cn(
              "h-9 w-full rounded-lg border bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition-all",
              isSearchFocused ? "border-brand-500 bg-white ring-4 ring-brand-500/5 w-[120%]" : "border-slate-200"
            )}
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          
          {searchQuery && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 mt-2 w-[120%] bg-white rounded-xl border shadow-floating overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="max-h-[450px] overflow-y-auto">
                {!searchResults?.hasResults ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="mx-auto text-slate-200 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                  </div>
                ) : (
                  <>
                    {searchResults.kb.length > 0 && (
                      <div className="p-2 border-b">
                        <p className="px-3 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">Knowledge Base</p>
                        {searchResults.kb.map(item => (
                          <Link 
                            key={item.id} 
                            href={`/kb?q=${encodeURIComponent(item.title)}`} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                              <BookOpen size={14} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{item.category}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.clients.length > 0 && (
                      <div className="p-2 border-b">
                        <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clients</p>
                        {searchResults.clients.map(client => (
                          <Link 
                            key={client.id} 
                            href={`/clients?q=${encodeURIComponent(client.name)}`} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div className="h-8 w-8 rounded bg-brand-50 flex items-center justify-center text-brand-600">
                              <Building2 size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900">{client.name}</p>
                              <p className="text-[10px] text-slate-500">{client.location}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.logs.length > 0 && (
                      <div className="p-2">
                        <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Transactions</p>
                        {searchResults.logs.map(log => (
                          <Link 
                            key={log.id} 
                            href={`/logs/history?clientId=${log.clientId}`} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                              <ClipboardList size={14} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate">{log.clientName}</p>
                              <p className="text-[10px] text-slate-500 truncate">{log.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Hub */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-blue-600 border-2 border-white"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-floating overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">System Notifications</p>
                <span className="bg-blue-600 text-[10px] font-black text-white px-1.5 py-0.5 rounded">{notifications.length}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="mx-auto text-slate-100 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Clear</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button 
                      key={n.id} 
                      className="w-full text-left p-4 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-3 group"
                      onClick={() => { n.action(); setIsNotifOpen(false); }}
                    >
                      <div className={cn("h-8 w-8 rounded-lg shrink-0 flex items-center justify-center", n.bg, n.color)}>
                        <n.icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          {n.title}
                          <ArrowRight size={10} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{n.desc}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {pendingCount > 0 && (
                <div className="p-2 bg-brand-50 border-t">
                   <button 
                    disabled={isSyncing}
                    onClick={syncNow}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
                   >
                     <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                     {isSyncing ? "Syncing..." : "Perform Handshake"}
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 font-bold text-[10px] text-white shadow-sm">
              {profile?.displayName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{profile?.displayName}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</p>
                <p className="text-xs font-bold text-slate-700 truncate">{profile?.email}</p>
              </div>
              <Link href="/settings">
                <button onClick={() => setIsProfileOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <User size={14} /> Profile Settings
                </button>
              </Link>
              <Link href="/settings">
                <button onClick={() => setIsProfileOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Settings size={14} /> System Config
                </button>
              </Link>
              <div className="my-1 border-t"></div>
              <button 
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
