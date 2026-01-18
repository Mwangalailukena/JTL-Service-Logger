"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  BarChart, 
  BookOpen, 
  Settings, 
  HelpCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncIndicator } from "@/components/ui/sync-indicator";

const mainNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Clients", icon: Users, href: "/clients" },
  { label: "Service Logs", icon: ClipboardList, href: "/logs/history" },
  { label: "Analytics", icon: BarChart, href: "/reports" },
];

const secondaryNav = [
  { label: "Knowledge Base", icon: BookOpen, href: "/kb" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Help Center", icon: HelpCircle, href: "/help" },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen flex-col border-r bg-white hidden lg:flex transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "flex h-16 items-center gap-2 px-6 border-b transition-all",
        isCollapsed ? "justify-center px-0" : ""
      )}>
        <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-lg overflow-hidden bg-white">
          <img src="/icons/jeotonixlogo.png" alt="Jeotronix" className="h-full w-full object-contain" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-black tracking-tighter text-slate-900 animate-in fade-in duration-500">
            Jeotronix
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 overflow-y-auto">
        <div className="space-y-8">
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 animate-in fade-in">
                Operations
              </p>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  title={isCollapsed ? item.label : ""}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                    isCollapsed ? "justify-center px-2" : "",
                    pathname === item.href 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    pathname === item.href ? "text-white" : "text-slate-400"
                  )} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 animate-in fade-in">
                Resources
              </p>
            )}
            <nav className="space-y-1">
              {secondaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  title={isCollapsed ? item.label : ""}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                    isCollapsed ? "justify-center px-2" : "",
                    pathname === item.href 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    pathname === item.href ? "text-white" : "text-slate-400"
                  )} />
                  {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-auto pt-8 animate-in fade-in duration-500">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Status</p>
              <SyncIndicator />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}