"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PwaLifecycle } from "@/components/pwa";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PwaLifecycle />
      <Sidebar isCollapsed={isCollapsed} />
      
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <Header onToggleSidebar={() => setIsCollapsed(!isCollapsed)} isCollapsed={isCollapsed} />
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>

        <footer className="border-t bg-white py-6 px-8 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
          © {new Date().getFullYear()} Jeotronix Internal Systems. All rights reserved.
        </footer>
      </div>
    </div>
  );
}