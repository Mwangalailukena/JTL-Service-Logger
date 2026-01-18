"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Info, Paperclip, X, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { queueOperation } from "@/lib/sync-engine";
import { db } from "@/lib/db";
import { kbArticleSchema } from "@/lib/schemas";

// Extend schema for form usage if needed, or use as is
const formSchema = kbArticleSchema.extend({
  tagsString: z.string().optional(), // Helper for comma-separated input
  isCritical: z.boolean(), // Explicitly required, default handled by RHF
  tags: z.array(z.string()), // Explicitly required, default handled by RHF
  version: z.number(), // Explicitly required, default handled by RHF
});

type FormValues = z.infer<typeof formSchema>;

export default function NewArticlePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "general",
      content: "",
      tags: [],
      tagsString: "",
      isCritical: false,
      version: 1
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Process tags string -> array
      let finalTags = values.tags;
      if (values.tagsString) {
        finalTags = values.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }

      const tempId = `temp_${Date.now()}`;

      const newArticle = {
        title: values.title,
        category: values.category,
        content: values.content,
        tags: finalTags,
        isPinned: 0,
        isCritical: values.isCritical ? 1 : 0,
        version: 1,
        lastUpdated: Date.now(),
        deletedAt: null,
        // Temp ID for local DB until sync
        firebaseId: tempId
      };

      // 1. Save to Local DB first (Optimistic UI)
      // @ts-ignore
      const id = await db.articles.add(newArticle);

      // 2. Save Attachments Locally
      const attachmentMetas = [];
      for (const file of selectedFiles) {
        const attId = `temp_att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.attachments.add({
            id: attId,
            articleId: tempId,
            name: file.name,
            size: file.size,
            type: file.type,
            blob: file,
            isDownloaded: 1,
            needsUpload: 1
        });
        attachmentMetas.push({
            storagePath: attId, // Will be replaced by real path during sync
            name: file.name,
            size: file.size,
            type: file.type
        });
      }

      // 3. Queue for Sync (Background Upload)
      // We pass the attachment metadata so the sync engine knows what to look for
      // effectively modifying the 'data' we queue
      await queueOperation('knowledge_base', 'create', { 
          ...newArticle, 
          id,
          _localAttachments: attachmentMetas // Custom field for sync engine
      });

      router.push('/kb');
    } catch (error) {
      console.error("Failed to save article:", error);
      alert("Failed to save article. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/kb" 
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create Article</h1>
              <p className="text-sm text-slate-500">Add new documentation to the knowledge base.</p>
            </div>
          </div>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Meta */}
            <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900">Article Title</label>
                <input 
                  {...form.register("title")}
                  type="text" 
                  placeholder="e.g. Victron Inverter Troubleshooting Guide"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500 font-bold">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Category</label>
                  <select 
                    {...form.register("category")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium appearance-none"
                  >
                    <option value="general">General</option>
                    <option value="ict">ICT & Networks</option>
                    <option value="solar">Solar & Power</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-900">Tags</label>
                   <input 
                    {...form.register("tagsString")}
                    type="text" 
                    placeholder="wifi, config, error-codes..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium"
                   />
                </div>
              </div>
            </div>

            {/* Sidebar / Settings */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                       <input 
                         type="checkbox" 
                         id="isCritical"
                         {...form.register("isCritical")}
                         className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                       />
                    </div>
                    <div>
                      <label htmlFor="isCritical" className="text-sm font-bold text-slate-900 block cursor-pointer">Mark as Critical</label>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Critical articles and their attachments are automatically downloaded to all technicians' devices.
                      </p>
                    </div>
                  </div>
               </div>

               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="text-blue-600 shrink-0" size={20} />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    This article will be saved locally immediately and synced to the cloud in the background.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-bold text-slate-900">Attachments</label>
                     <label htmlFor="file-upload" className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700">
                        + Add File
                     </label>
                     <input 
                       id="file-upload" 
                       type="file" 
                       multiple 
                       accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                       className="hidden"
                       onChange={handleFileChange}
                     />
                  </div>
                  
                  <div className="space-y-2">
                    {selectedFiles.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No files attached</p>
                    )}
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={14} className="text-slate-400 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 truncate">{file.name}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => removeFile(idx)}
                                className="text-slate-400 hover:text-red-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Content</label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
               <MarkdownEditor 
                 value={form.watch("content")}
                 onChange={(val) => form.setValue("content", val)}
                 placeholder="Write your technical protocol here..."
               />
            </div>
            {form.formState.errors.content && (
              <p className="text-xs text-red-500 font-bold">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
             <Link href="/kb">
               <Button type="button" variant="ghost" className="font-bold text-slate-500">Cancel</Button>
             </Link>
             <Button 
               type="submit" 
               className="bg-slate-900 font-bold px-8"
               disabled={isSaving}
             >
               {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
               Save Article
             </Button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}