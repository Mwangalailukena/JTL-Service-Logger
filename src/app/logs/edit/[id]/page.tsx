"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { serviceLogSchema, ServiceLogFormValues } from "@/lib/schemas";
import { useClients } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db as localDb } from "@/lib/db";
import { 
  Save, 
  X, 
  Zap, 
  Monitor, 
  ClipboardCheck, 
  Info,
  CheckCircle2,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EditServiceLogPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { clients } = useClients();
  const { updateLog } = useServiceLogs();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocalId, setCurrentLocalId] = useState<number | string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceLogFormValues>({
    resolver: zodResolver(serviceLogSchema) as any,
  });

  const jobType = watch("jobType");
  const status = watch("status");

  useEffect(() => {
    if (!id) return;

    async function loadLog() {
      try {
        console.log("Fetching log with ID:", id);
        
        // 1. Try local Dexie ID (numeric)
        const numericId = !isNaN(Number(id)) ? Number(id) : -1;
        let log = numericId !== -1 ? await localDb.serviceLogs.get(numericId) : null;
        
        // 2. Fallback to Firebase ID (string) if not found by local ID
        if (!log) {
          log = await localDb.serviceLogs.where('firebaseId').equals(id).first();
        }
        
        if (log) {
          console.log("Log data loaded:", log);
          setCurrentLocalId(log.id!); 
          
          reset({
            clientId: log.clientId,
            serviceDate: log.serviceDate,
            durationMinutes: log.durationMinutes,
            description: log.description,
            status: log.status,
            jobType: log.jobType,
            ictData: log.ictData,
            solarData: log.solarData,
          });
        } else {
          console.error("Log not found with ID:", numericId);
          router.push("/logs/history");
        }
      } catch (error) {
        console.error("Failed to load log:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLog();
  }, [id, reset, router]);

  const onSubmit = async (data: ServiceLogFormValues) => {
    if (!currentLocalId) return;
    setIsSubmitting(true);
    try {
      const client = clients?.find((c) => c.firebaseId === data.clientId);
      await updateLog(currentLocalId, {
        ...data,
        clientName: client?.name || "Unknown Client",
      });
      router.push("/logs/history");
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
           <Skeleton className="h-20 w-3/4 rounded-2xl" />
           <Skeleton className="h-64 w-full rounded-2xl" />
           <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                <Edit2 size={14} className="mr-1" /> Protocol Modification
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Service Entry</h1>
              <p className="text-slate-500 font-medium mt-1">Updating intervention record ID: {id}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8">
            {/* Section 1: Core Logistics */}
            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50/50 flex items-center gap-2">
                <Info size={16} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Assignment Details</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Target Client</label>
                  {clients === undefined ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <select
                      {...register("clientId")}
                      className={cn(
                        "w-full h-11 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-slate-700",
                        errors.clientId ? "border-red-300" : "border-slate-200"
                      )}
                    >
                      <option value="">Select entity for assignment...</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.firebaseId}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.clientId && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.clientId.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Service Timestamp</label>
                  <input
                    type="date"
                    {...register("serviceDate")}
                    className={cn(
                      "w-full h-11 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-slate-700",
                      errors.serviceDate ? "border-red-300" : "border-slate-200"
                    )}
                  />
                  {errors.serviceDate && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.serviceDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Duration (Minutes)</label>
                  <input
                    type="number"
                    {...register("durationMinutes", { valueAsNumber: true })}
                    placeholder="Enter total time on-site"
                    className={cn(
                      "w-full h-11 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-slate-700",
                      errors.durationMinutes ? "border-red-300" : "border-slate-200"
                    )}
                  />
                  {errors.durationMinutes && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.durationMinutes.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Operational Sector</label>
                  <div className="flex gap-2">
                    {['ict', 'solar'].map((type) => (
                      <label key={type} className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 cursor-pointer transition-all font-bold text-xs uppercase",
                        jobType === type 
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" 
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}>
                        <input type="radio" {...register("jobType")} value={type} className="hidden" />
                        {type === 'ict' ? <Monitor size={16} /> : <Zap size={16} />}
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Final Disposition</label>
                  <select
                    {...register("status")}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-slate-700"
                  >
                    <option value="draft">Draft / Internal Only</option>
                    <option value="completed">Finalized / Completed</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Technical Observations */}
            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50/50 flex items-center gap-2">
                <ClipboardCheck size={16} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Technical Brief</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Executive Summary</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Provide a detailed overview of the intervention, hardware changes, and final status..."
                    className={cn(
                      "w-full p-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-medium text-slate-700",
                      errors.description ? "border-red-300" : "border-slate-200"
                    )}
                  />
                  {errors.description && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.description.message}</p>}
                </div>
              </div>
            </section>

            {/* Section 3: Specialized Data (Conditional) */}
            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
               <div className="px-6 py-4 border-b bg-slate-50/50 flex items-center gap-2">
                {jobType === 'ict' ? <Monitor size={16} className="text-blue-600" /> : <Zap size={16} className="text-amber-500" />}
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {jobType === 'ict' ? "Infrastructure Configuration" : "Power System Metrics"}
                </h3>
              </div>
              <div className="p-6">
                {jobType === "ict" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Network Topology</label>
                      <select {...register("ictData.networkType")} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white transition-all font-bold text-slate-600">
                        <option value="fiber">Fiber Optic</option>
                        <option value="lte">LTE / 5G</option>
                        <option value="vsat">VSAT / Satellite</option>
                        <option value="lan">Local Area Network</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Signal Attenuation (dBm)</label>
                      <input type="number" {...register("ictData.signalStrength", { valueAsNumber: true })} placeholder="Measure and enter value" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white transition-all font-bold text-slate-600" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">System DC Voltage</label>
                      <input type="number" {...register("solarData.systemVoltage", { valueAsNumber: true })} placeholder="Enter nominal voltage" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white transition-all font-bold text-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Battery Health (SOH %)</label>
                      <input type="number" {...register("solarData.batteryHealth", { valueAsNumber: true })} placeholder="Estimated health percentage" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white transition-all font-bold text-slate-600" />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sticky Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t p-4 flex justify-end gap-3 z-20">
             <Button 
                type="button" 
                variant="ghost" 
                className="font-bold text-slate-500"
                onClick={() => router.back()}
              >
                Discard Edits
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "px-10 font-bold transition-all duration-300 shadow-lg",
                  status === 'completed' 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" 
                    : "bg-slate-700 hover:bg-slate-800 shadow-slate-200"
                )}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : status === 'completed' ? (
                  <>
                    <CheckCircle2 size={18} className="mr-2" />
                    Update & Finalize
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Update Draft
                  </>
                )}
              </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
