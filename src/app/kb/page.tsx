"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useKnowledgeBase } from "@/hooks/use-knowledge-base";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Info,
  X,
  ChevronRight,
  Filter,
  RefreshCw,
  MoreVertical,
  Layers,
  Clock,
  Plus
} from "lucide-react";
import { LocalAttachment } from "@/lib/db";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/ui/markdown-editor";

// --- Components ---

function AttachmentItem({ file, downloadAttachment, progress }: { 
  file: LocalAttachment; 
  downloadAttachment: (a: LocalAttachment) => void; 
  progress: Record<string, number>;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.blob) {
      const url = URL.createObjectURL(file.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [file.blob]);

  return (
    <div className="flex justify-between items-center group/file hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-8 w-8 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
           <FileText size={14} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-xs font-semibold text-slate-700" title={file.name}>{file.name}</span>
          <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      
      {file.isDownloaded && objectUrl ? (
        <a 
          href={objectUrl} 
          download={file.name}
          target="_blank"
          rel="noreferrer"
          className="text-green-600 bg-green-50 p-1.5 rounded-md"
        >
          <Check size={14} />
        </a>
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); downloadAttachment(file); }}
          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
        >
          {progress[file.id] ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
        </button>
      )}
    </div>
  );
}

function AttachmentList({ articleId, getAttachments, downloadAttachment, progress }: any) {
  const [files, setFiles] = useState<LocalAttachment[]>([]);

  useEffect(() => {
    getAttachments(articleId).then(setFiles);
  }, [articleId, getAttachments]);

  if (files.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-3 space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</p>
      {files.map(file => (
        <AttachmentItem 
          key={file.id} 
          file={file} 
          downloadAttachment={downloadAttachment} 
          progress={progress} 
        />
      ))}
    </div>
  );
}

function KnowledgeBasePageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("all");
  const [readingArticle, setReadingArticle] = useState<any | null>(null);

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
    downloadProgress
  } = useKnowledgeBase(search, category);

  const isLoading = articles === undefined;

  useEffect(() => {
    syncArticles();
  }, []);

  const categories = [
    { id: 'all', label: 'All Protocols', icon: Layers },
    { id: 'ict', label: 'ICT & Network', icon: Monitor },
    { id: 'solar', label: 'Solar & Power', icon: Zap },
    { id: 'general', label: 'General Info', icon: Book },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-slate-50/50">
        
        {/* Sidebar - Desktop */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-100">
             <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={16} />
                Knowledge Base
             </h2>
             <p className="text-xs text-slate-500 mt-1">Technical Documentation Hub</p>
          </div>

          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Library</p>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    category === cat.id 
                      ? "bg-blue-50 text-blue-700 font-semibold" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                     <cat.icon size={16} className={category === cat.id ? "text-blue-600" : "text-slate-400"} />
                     {cat.label}
                  </div>
                  {category === cat.id && <ChevronRight size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
               <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Pin size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Offline Mode</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      Pinned articles are stored locally for field access.
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
            <Button 
               variant="outline" 
               className="w-full justify-between bg-white text-xs font-bold border-slate-200"
               onClick={syncArticles}
               disabled={isSyncing}
            >
               <span className="flex items-center gap-2">
                 {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                 {isSyncing ? "Syncing..." : "Sync Library"}
               </span>
               {!isSyncing && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Header Toolbar */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
               <Search className="text-slate-400" size={18} />
               <input 
                  type="text"
                  placeholder="Search articles, error codes, and tags..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
               {search && (
                 <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                   <X size={16} />
                 </button>
               )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
               <Link href="/kb/new">
                 <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-200">
                   <Plus size={16} />
                   <span className="hidden lg:inline">New Article</span>
                 </Button>
               </Link>

               <span className="text-xs font-medium text-slate-500 hidden sm:inline-block ml-2">
                 {isLoading ? "Loading..." : `${articles?.length || 0} articles`}
               </span>
               <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button className="p-1.5 rounded bg-white shadow-sm text-slate-700">
                    <Layers size={14} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                    <Filter size={14} />
                  </button>
               </div>
            </div>
          </header>

          {/* Article List / Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Breadcrumbs / Context */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
               <span>Library</span>
               <ChevronRight size={12} />
               <span className="capitalize text-slate-900">{category}</span>
               {search && (
                 <>
                   <ChevronRight size={12} />
                   <span>Search: "{search}"</span>
                 </>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                     <Skeleton className="h-4 w-1/3" />
                     <Skeleton className="h-6 w-3/4" />
                     <Skeleton className="h-20 w-full" />
                  </div>
                ))
              ) : articles && articles.length > 0 ? (
                articles.map((article) => (
                  <article 
                    key={article.id} 
                    onClick={() => setReadingArticle(article)}
                    className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer flex flex-col h-[280px]"
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                           article.category === 'solar' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                           article.category === 'ict' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                           'bg-slate-50 text-slate-600 border-slate-100'
                         )}>
                           {article.category}
                         </span>
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(article);
                            }}
                            className={cn(
                              "text-slate-300 hover:text-blue-600 transition-colors",
                              article.isPinned && "text-blue-600 fill-current"
                            )}
                          >
                            <Pin size={16} fill={article.isPinned ? "currentColor" : "none"} />
                         </button>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {article.title}
                      </h3>
                      
                      <div className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        {article.content.replace(/[#*`]/g, '').substring(0, 150)}...
                      </div>
                      
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-50 text-[10px] font-medium text-slate-500 border border-slate-100">
                             #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-400">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between rounded-b-xl">
                       <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <Clock size={12} />
                          {new Date(article.lastUpdated).toLocaleDateString()}
                       </div>
                       <div className="flex items-center text-blue-600 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Read <ChevronRight size={12} />
                       </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center text-center">
                   <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                      <Search className="text-slate-300" size={32} />
                   </div>
                   <h3 className="text-slate-900 font-bold">No results found</h3>
                   <p className="text-slate-500 text-sm mt-1 max-w-xs">We couldn't find any articles matching "{search}" in the {category} category.</p>
                   <Button 
                      variant="link" 
                      className="mt-4 text-blue-600 font-bold"
                      onClick={() => { setSearch(""); setCategory("all"); }}
                   >
                     Clear filters
                   </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Reading Drawer (Right Side) */}
        {readingArticle && (
          <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={() => setReadingArticle(null)} />
            <aside className="fixed top-0 right-0 h-screen w-full md:w-[600px] lg:w-[800px] bg-white shadow-2xl shadow-slate-900/20 z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <header className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                       <FileText size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         {readingArticle.category}
                       </span>
                       <span className="text-sm font-bold text-slate-900 line-clamp-1 max-w-[300px]">
                         {readingArticle.title}
                       </span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={() => togglePin(readingArticle)}
                       className={cn(
                         "p-2 rounded-lg transition-colors border",
                         readingArticle.isPinned 
                           ? "bg-blue-50 border-blue-200 text-blue-600" 
                           : "bg-white border-transparent text-slate-400 hover:bg-slate-50"
                       )}
                       title={readingArticle.isPinned ? "Unpin" : "Pin for offline"}
                    >
                       <Pin size={18} fill={readingArticle.isPinned ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => setReadingArticle(null)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
                      <X size={20} />
                    </button>
                 </div>
              </header>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="max-w-3xl mx-auto p-8">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-6">{readingArticle.title}</h1>
                  
                  <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-slate-100">
                     {readingArticle.tags.map((tag: string) => (
                       <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-50 text-xs font-medium text-slate-600 border border-slate-100">
                         #{tag}
                       </span>
                     ))}
                  </div>

                  <MarkdownViewer value={readingArticle.content} />
                  
                  <div className="mt-10">
                    <AttachmentList 
                      articleId={readingArticle.firebaseId} 
                      getAttachments={getAttachments}
                      downloadAttachment={downloadAttachment}
                      progress={downloadProgress}
                    />
                  </div>
                </div>
              </div>
              
              {/* Drawer Footer */}
              <footer className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-medium text-slate-500">
                 <span>Last updated: {new Date(readingArticle.lastUpdated).toLocaleDateString()}</span>
                 <Button size="sm" variant="outline" onClick={() => window.print()}>
                   Print Protocol
                 </Button>
              </footer>
            </aside>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </DashboardLayout>
    }>
      <KnowledgeBasePageContent />
    </Suspense>
  );
}
