"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceLogSchema, ServiceLogFormValues } from "@/lib/schemas";
import { useClients } from "@/hooks/use-clients";
import { useServiceLogs } from "@/hooks/use-service-logs";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2
} from "lucide-react";

export default function ServiceLogForm() {
  const { clients } = useClients();
  const { addLog } = useServiceLogs();
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      
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

      {/* 4. Description */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Work Description</h3>
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

      {/* 5. Photos */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">Site Photos</h3>
          <label className="cursor-pointer flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
            <Camera size={18} />
            <span className="text-sm font-bold">Add Photo</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
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
      <div className="sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex justify-between items-center">
        <span className="text-xs text-slate-500 font-medium px-2">
          {form.watch("status") === 'draft' ? 'Saving as Draft' : 'Ready to Submit'}
        </span>
        
        <div className="flex space-x-3">
          <button 
            type="button"
            onClick={() => form.setValue("status", "draft")}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Save Draft
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            onClick={() => form.setValue("status", "completed")}
            className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            <span>Submit Report</span>
          </button>
        </div>
      </div>

    </form>
  );
}
