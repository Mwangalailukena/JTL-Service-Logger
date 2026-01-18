"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, Zap, ShieldCheck, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { profile, login, loading } = useAuth();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      router.push("/");
    }
  }, [profile, loading, router]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await login();
    } catch (error) {
      console.error("Login failed", error);
      setIsAuthenticating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Branding Area */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-200">
            <Zap size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">Jeotronix Portal</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized Access Only</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-8">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                <ShieldCheck size={16} /> Identity Verification
             </div>
             <p className="text-sm font-medium text-slate-600 leading-relaxed">
               Please authenticate using your company-issued credentials to access the internal service logging engine.
             </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isAuthenticating}
            className="w-full group flex items-center justify-between bg-slate-900 text-white h-14 px-6 rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              {isAuthenticating ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Mail size={20} className="text-slate-400 group-hover:text-blue-400" />}
              <span>{isAuthenticating ? "Verifying Session..." : "Sign in with SSO"}</span>
            </div>
            <LogIn size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
             <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
             <div>
               <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Security Protocol</p>
               <p className="text-[11px] text-amber-700 font-medium leading-normal mt-1">
                 Access is strictly monitored for security and compliance. IP addresses and session logs are recorded.
               </p>
             </div>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             Systems Security © {new Date().getFullYear()} Jeotronix Ltd
           </p>
        </div>
      </div>
    </div>
  );
}