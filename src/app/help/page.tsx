"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  ExternalLink, 
  FileText,
  Zap,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const categories = [
    {
      title: "Getting Started",
      description: "Learn the basics of field logging and synchronization.",
      icon: Zap,
      links: ["Initializing your profile", "Connecting to client sites", "First service entry"]
    },
    {
      title: "Offline Operations",
      description: "Work effectively in remote areas without internet access.",
      icon: WifiOff,
      links: ["Data persistence logic", "Pinning documentation", "Resolution of sync conflicts"]
    },
    {
      title: "Technical Protocol",
      description: "Standard operating procedures for Solar and ICT.",
      icon: ShieldCheck,
      links: ["ICT safety standards", "Solar system health checks", "Reporting requirements"]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
            <HelpCircle size={28} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Support & Documentation</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Operational manuals, system help, and direct support for Jeotronix field technicians.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div key={cat.title} className="card-base p-6 flex flex-col h-full">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-4">
                <cat.icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.title}</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1">{cat.description}</p>
              <div className="space-y-3">
                {cat.links.map((link) => (
                  <Link 
                    key={link} 
                    href="/kb"
                    className="flex items-center justify-between w-full text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-widest"
                  >
                    {link}
                    <ExternalLink size={12} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-floating">
             <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-brand-400 border border-white/10">
                <Book size={40} />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">Technical Knowledge Base</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Search through detailed equipment manuals and troubleshooting guides for Victron, Ubiquiti, and more.
                </p>
                <Link href="/kb">
                  <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Access Library
                  </button>
                </Link>
             </div>
          </div>

          <div className="card-base p-8 flex flex-col md:flex-row items-center gap-8">
             <div className="h-20 w-20 shrink-0 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 border border-brand-100">
                <MessageSquare size={40} />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Direct Field Support</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Need immediate assistance with a complex installation? Reach out to the systems administrator.
                </p>
                <a href="mailto:support@jeotronix.com?subject=Field%20Support%20Request">
                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Open Support Ticket
                  </button>
                </a>
             </div>
          </div>
        </div>

        <footer className="text-center pt-12 pb-20 border-t border-slate-100">
           <p className="metadata-label mb-2">Internal Operations Portal</p>
           <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">
             Jeotronix PWA Version 1.2.4 (Enterprise Edition)<br />
             Built for distributed field operations and offline-first resilience.
           </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}
