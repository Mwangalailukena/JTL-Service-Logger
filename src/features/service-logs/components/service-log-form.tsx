"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceLogSchema, ServiceLogFormValues } from "@/lib/schemas";
import { useClients } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { useKnowledgeBase } from "@/hooks/use-knowledge-base";
import { ImageUtils } from "@/lib/image-utils";
import { VoiceInput } from "@/components/ui/voice-input";
import { generateServiceLogPDF } from "@/features/reports/utils/pdf-generator";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, 
  Camera, 
  CheckCircle, 
  Save, 
  Server, 
  Sun, 
  Signal, 
  Battery, 
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileText,
  Share2
} from "lucide-react";

function SmartAssistant({ jobType }: { jobType: string }) {
  const { articles } = useKnowledgeBase("", jobType);

  return (
    <aside className="hidden xl:block w-80 space-y-4 sticky top-6">
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
         <div className="flex items-center gap-2 mb-2 font-bold text-blue-100 uppercase tracking-widest text-xs">
           <Sparkles size={14} /> Smart Assistant
         </div>
         <h3 className="font-bold text-lg mb-1">Contextual Guide</h3>
         <p className="text-sm text-blue-100 opacity-80 leading-relaxed">
           Based on your selected job type <strong>({jobType.toUpperCase()})</strong>, here are some relevant technical protocols.
         </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Recommended Articles</span>
            <Link href="/kb" className="text-blue-600 hover:underline text-xs font-bold">View All</Link>
         </div>
         <div className="divide-y divide-slate-100">
           {articles?.slice(0, 5).map(article => (
             <Link key={article.id} href={`/kb?q=${encodeURIComponent(article.title)}`} target="_blank" className="block p-4 hover:bg-slate-50 transition-colors group">
               <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400 group-hover:text-blue-600 transition-colors">
                     <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-700">{article.title}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                       {article.tags.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">#{tag}</span>
                       ))}
                    </div>
                  </div>
               </div>
             </Link>
           ))}
           {articles?.length === 0 && (
             <div className="p-6 text-center text-slate-400 text-xs italic">
               No specific articles found for this category.
             </div>
           )}
         </div>
      </div>
    </aside>
  );
}

export default function ServiceLogForm() {
  const { clients } = useClients();
  const { addLog } = useServiceLogs();
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const form = useForm<ServiceLogFormValues>({
    resolver: zodResolver(serviceLogSchema) as any,
    defaultValues: {
      serviceDate: new Date().toISOString().split('T')[0],
      status: "draft",
      jobType: "ict",
      ictData: { networkType: "fiber" },
      solarData: { inverterStatus: "normal" }
    }
  });

  const jobType = form.watch("jobType");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      try {
        const compressedPhotos = await Promise.all(
          Array.from(files).map(file => ImageUtils.compressImage(file))
        );
        setPhotos(prev => [...prev, ...compressedPhotos]);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process images.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDictation = (text: string) => {
    const current = form.getValues("description") || "";
    form.setValue("description", current + (current ? " " : "") + text);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingPdf(true);
    try {
        const data = form.getValues();
        const client = clients?.find(c => c.firebaseId === data.clientId);
        
        // Merge photos into the data object for the generator
        const fullLog = { ...data, photos };
        
        const blob = await generateServiceLogPDF(fullLog, client?.name || "Client");
        const fileName = `ServiceReport_${client?.name || 'Log'}_${data.serviceDate}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Service Report',
                text: `Here is the service report for ${client?.name || 'the visit'}.`
            });
        } else {
            // Fallback: Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (e) {
        console.error("PDF Generation failed", e);
        alert("Could not generate PDF. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const onSubmit = async (data: ServiceLogFormValues) => {
    setIsSubmitting(true);
    try {
      // Find client name for local display optimization
      const client = clients?.find(c => c.firebaseId === data.clientId);
      
      await addLog({
        ...data,
        clientName: client?.name || "Unknown Client",
        // @ts-ignore - Schema mismatch for now, fixing in real db later
        photos: photos
      });
      
      router.push("/");
    } catch (error) {
      console.error("Failed to save log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start max-w-[1400px] mx-auto">
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-8 w-full max-w-4xl">
        
        {/* 1. Basic Info */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <CheckCircle className="mr-2 text-blue-600" size={20} />
            Visit Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Client</label>
              <select 
                {...form.register("clientId")}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client...</option>
                {clients?.map(client => (
                  <option key={client.id} value={client.firebaseId}>{client.name}</option>
                ))}
              </select>
              {form.formState.errors.clientId && (
                <p className="text-red-500 text-xs">{form.formState.errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Service Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  {...form.register("serviceDate")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Service Type Toggle */}
        <section className="grid grid-cols-2 gap-4">
          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            jobType === 'ict' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
          }`}>
            <input type="radio" value="ict" {...form.register("jobType")} className="hidden" />
            <Server size={32} className="mb-2" />
            <span className="font-bold">ICT Service</span>
          </label>

          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            jobType === 'solar' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-500 hover:border-amber-200'
          }`}>
            <input type="radio" value="solar" {...form.register("jobType")} className="hidden" />
            <Sun size={32} className="mb-2" />
            <span className="font-bold">Solar Maintenance</span>
          </label>
        </section>

        {/* 3. Conditional Fields */}
        {jobType === 'ict' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-2">
            <h3 className="text-lg font-bold text-slate-900 mb-4">ICT Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Network Type</label>
                <select {...form.register("ictData.networkType")} className="w-full p-3 rounded-xl border border-slate-200">
                  <option value="fiber">Fiber Optic</option>
                  <option value="lte">4G / LTE</option>
                  <option value="vsat">VSAT</option>
                  <option value="lan">Local LAN Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Signal Strength (dBm)</label>
                <div className="relative">
                  <Signal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number" 
                    {...form.register("ictData.signalStrength")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200"
                    placeholder="-65"
                  />
                </div>
              </div>
               <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Hardware Replaced / Installed</label>
                <input 
                  type="text" 
                  {...form.register("ictData.hardwareReplaced")}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  placeholder="e.g. TP-Link Switch, Cat6 Patch Cord"
                />
              </div>
            </div>
          </section>
        )}

        {jobType === 'solar' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-2">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Solar Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">System Voltage (V)</label>
                <input 
                  type="number" 
                  {...form.register("solarData.systemVoltage")}
                  className="w-full p-3 rounded-xl border border-slate-200"
                  placeholder="48"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Battery Health (%)</label>
                <div className="relative">
                  <Battery className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number" 
                    {...form.register("solarData.batteryHealth")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Inverter Status</label>
                <select {...form.register("solarData.inverterStatus")} className="w-full p-3 rounded-xl border border-slate-200">
                  <option value="normal">Normal Operation</option>
                  <option value="warning">Warning / Alert</option>
                  <option value="fault">Fault / Error</option>
                  <option value="off">Switched Off</option>
                </select>
              </div>
              <div className="flex items-center space-x-3 pt-6">
                <input 
                  type="checkbox" 
                  {...form.register("solarData.panelsCleaned")}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-slate-700">Panels Cleaned?</label>
              </div>
            </div>
          </section>
        )}

        {/* 4. Description with Voice Input */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-900">Work Description</h3>
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dictate</span>
               <VoiceInput onTranscript={handleDictation} />
             </div>
          </div>
          <textarea 
            {...form.register("description")}
            rows={4}
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the work performed, issues found, and resolutions..."
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-xs mt-2">{form.formState.errors.description.message}</p>
          )}
        </section>

        {/* 5. Photos with Compression */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Site Photos</h3>
            <label className={`cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isCompressing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {isCompressing ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
              <span className="text-sm font-bold">{isCompressing ? "Processing..." : "Add Photo"}</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={isCompressing} className="hidden" />
            </label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                <img src={src} alt="Site evidence" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No photos added yet
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center z-10">
          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={handleGenerateReport}
               disabled={isGeneratingPdf}
               className="text-slate-600 hover:text-blue-600 font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                Share Report
             </button>
             <span className="text-xs text-slate-400 font-medium">|</span>
             <span className="text-xs text-slate-500 font-medium px-2">
                {form.watch("status") === 'draft' ? 'Saving as Draft' : 'Ready to Submit'}
             </span>
          </div>
          
          <div className="flex space-x-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => form.setValue("status", "draft")}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Save Draft
            </button>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              onClick={() => form.setValue("status", "completed")}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              <span>Submit Report</span>
            </button>
          </div>
        </div>

      </form>

      {/* Smart Assistant Sidebar */}
      <SmartAssistant jobType={jobType} />
    </div>
  );
}
