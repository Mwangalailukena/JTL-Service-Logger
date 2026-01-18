"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useKnowledgeBase } from "@/hooks/use-knowledge-base";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Book, 
  Pin, 
  Download, 
  FileText, 
  Check, 
  Loader2, 
  BookOpen, 
  Zap, 
  Monitor, 
  Tag,
  ArrowUpRight,
  Info
} from "lucide-react";
import { LocalAttachment } from "@/lib/db";
import { seedKB } from "@/lib/seed-kb";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);
  const { 
    articles, 
    isSyncing, 
    syncArticles, 
    togglePin, 
    getAttachments,
    downloadAttachment,
    getAttachmentUrl,
    downloadProgress
  } = useKnowledgeBase(search, category);

  const isLoading = articles === undefined;

  useEffect(() => {
    // Initial sync on mount
    syncArticles();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
               <BookOpen size={14} /> Documentation Hub
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Technical Knowledge</h1>
            <p className="text-slate-500 mt-1 font-medium">Internal manuals, wiring diagrams, and troubleshooting protocols.</p>
          </div>
          <button 
            onClick={syncArticles}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            <span>{isSyncing ? "Updating Registry..." : "Fetch Latest Updates"}</span>
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 space-y-8">
            <div className="space-y-4">
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Search Library</p>
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search technical library..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Categories</p>
               <div className="flex flex-col gap-1">
                  {['all', 'ict', 'solar', 'general'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all capitalize",
                        category === cat 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                         {cat === 'ict' ? <Monitor size={14} /> : cat === 'solar' ? <Zap size={14} /> : <Book size={14} />}
                         {cat}
                      </div>
                      {category === cat && <ArrowUpRight size={12} />}
                    </button>
                  ))}
               </div>
            </div>

            <div className="rounded-2xl border bg-blue-50 p-4">
               <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-900 uppercase">Offline Ready</p>
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed mt-1">
                      Pin articles to store them in your local browser cache for field access without internet.
                    </p>
                  </div>
               </div>
            </div>
          </aside>

          {/* Articles Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between mb-4">
                       <Skeleton className="h-5 w-16" />
                       <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-6" />
                    <div className="pt-4 border-t border-slate-50 flex justify-between">
                       <Skeleton className="h-3 w-20" />
                       <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : articles && articles.length > 0 ? (
                articles.map((article) => (
                  <article 
                    key={article.id} 
                    className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col group relative"
                  >
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border",
                      article.category === 'solar' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    )}>
                      {article.category}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(article);
                      }}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        article.isPinned 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <Pin size={16} fill={article.isPinned ? "currentColor" : "none"} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {article.title}
                  </h3>
                  
                  <div className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1 font-medium leading-relaxed">
                    {article.content.substring(0, 150)}...
                  </div>

                  <AttachmentList 
                    articleId={article.firebaseId} 
                    getAttachments={getAttachments}
                    downloadAttachment={downloadAttachment}
                    getAttachmentUrl={getAttachmentUrl}
                    progress={downloadProgress}
                  />

                  <div className="flex flex-wrap gap-2 my-4">
                    {article.tags.map(tag => (
                      <div key={tag} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                         <Tag size={10} /> {tag}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Rev: {new Date(article.lastUpdated).toLocaleDateString()}
                    </span>
                    <button className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Technical Protocol <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                <Book className="mx-auto mb-4 text-slate-200" size={64} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No documentation found</h3>
                <p className="text-xs font-medium text-slate-400 mt-2">Adjust your search or category filters to locate specific protocols.</p>
                <button 
                  onClick={() => { setSearch(""); setCategory("all"); }}
                  className="mt-6 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Reset Library Filters
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AttachmentList({ articleId, getAttachments, downloadAttachment, getAttachmentUrl, progress }: any) {
  const [files, setFiles] = useState<LocalAttachment[]>([]);

  useEffect(() => {
    getAttachments(articleId).then(setFiles);
  }, [articleId, getAttachments]);

  if (files.length === 0) return null;

  return (
    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-2">
      {files.map(file => (
        <div key={file.id} className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
               <FileText size={12} />
            </div>
            <span className="truncate text-xs font-bold text-slate-600" title={file.name}>{file.name}</span>
          </div>
          
          {file.isDownloaded ? (
            <a 
              href={getAttachmentUrl(file)} 
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors"
            >
              <Check size={14} />
            </a>
          ) : (
            <button 
              onClick={() => downloadAttachment(file)}
              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
            >
              {progress[file.id] ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
