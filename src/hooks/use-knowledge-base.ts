"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalArticle, LocalAttachment } from "@/lib/db";
import { useState } from "react";
import { syncKnowledgeBase, downloadKBAttachment } from "@/lib/sync-engine";
import { SearchEngine } from "@/lib/search";

export function useKnowledgeBase(searchTerm: string = "", category: string = "all") {
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  // 1. Live Query with local search (IndexedDB)
  const articles = useLiveQuery(async () => {
    let results: LocalArticle[] = [];

    if (searchTerm.trim().length > 2) {
        // 1. Full Text Search (only triggers for >2 chars)
        const ids = await SearchEngine.search(searchTerm);
        if (ids.length > 0) {
            const fetched = await db.articles.bulkGet(ids);
            results = fetched.filter((a): a is LocalArticle => !!a);
        } else {
            return [];
        }
    } else {
        // 2. Default / Short Query: Fetch all sorted by date
        // Note: For short queries (1-2 chars), we could do substring search like before, 
        // but typically search engines wait for 3 chars. 
        // If the user wants substring search for "a", we can fallback to the old filter,
        // but mixing behaviors is confusing. We will treat < 3 chars as "Show All" or "Filter in memory"
        // Let's stick to "Show All" or "Filter in memory" for small datasets to be responsive.
        
        const all = await db.articles.orderBy('lastUpdated').reverse().toArray();
        if (searchTerm.trim() !== "") {
             // Fallback to simple filter for short terms that the index ignores
             results = all.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
             results = all;
        }
    }
    
    return results.filter(a => {
      // Filter out soft-deleted items
      if (a.deletedAt) return false;
      const matchesCategory = category === "all" || a.category === category;
      return matchesCategory;
    });
  }, [searchTerm, category]);

  // 2. Fetch attachments for a specific article
  const getAttachments = async (articleId: string) => {
    return await db.attachments.where('articleId').equals(articleId).toArray();
  };

  // 3. Delta Sync Strategy (Delegated to Sync Engine)
  const syncArticles = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);

    try {
      await syncKnowledgeBase();
    } catch (error) {
      console.error("KB Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Attachment Management (Delegated to Sync Engine)
  const downloadAttachment = async (attachment: LocalAttachment) => {
    if (!navigator.onLine) return;
    
    try {
        setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0.1 }));
        
        await downloadKBAttachment(attachment);
        
        setDownloadProgress(prev => {
            const newP = { ...prev };
            delete newP[attachment.id]; 
            return newP;
        });

    } catch (err: any) {
        console.warn(`Download failed for ${attachment.name}:`, err.message);
        setDownloadProgress(prev => ({ ...prev, [attachment.id]: -1 }));
        
        // If it's a 404 or retry error, we might want to tell the user
        if (err.code === 'storage/object-not-found' || err.code === 'storage/retry-limit-exceeded') {
          alert(`Could not download ${attachment.name}. The file might not be uploaded to your Firebase Storage yet.`);
        }
    }
  };

  const getAttachmentUrl = (attachment: LocalAttachment) => {
      if (attachment.blob) {
          return URL.createObjectURL(attachment.blob);
      }
      return null;
  };

  const togglePin = async (article: LocalArticle) => {
    const newStatus = article.isPinned ? 0 : 1;
    await db.articles.update(article.id!, { isPinned: newStatus });

    // Auto-download attachments if pinning
    if (newStatus === 1) {
        const attachments = await db.attachments.where('articleId').equals(article.firebaseId).toArray();
        attachments.forEach(att => {
            if (!att.isDownloaded) {
                downloadAttachment(att);
            }
        });
    }
  };

  return { 
    articles, 
    isSyncing, 
    syncArticles, 
    togglePin,
    getAttachments,
    downloadAttachment,
    getAttachmentUrl,
    downloadProgress
  };
}