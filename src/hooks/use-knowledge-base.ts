"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalArticle, LocalAttachment } from "@/lib/db";
import { db as firebaseDb, storage } from "@/lib/firebase";
import { collection, query, getDocs, where, limit, orderBy, Timestamp } from "firebase/firestore";
import { ref, getBytes } from "firebase/storage";
import { useState, useEffect } from "react";

export function useKnowledgeBase(searchTerm: string = "", category: string = "all") {
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  // 1. Live Query with local search (IndexedDB)
  const articles = useLiveQuery(async () => {
    let collection = db.articles.orderBy('lastUpdated').reverse();
    
    // In a real app with >1000 items, use a dedicated search index (like FlexSearch)
    // For <1000 items, filtering in memory after fetching metadata is instant.
    const all = await collection.toArray();
    
    return all.filter(a => {
      const matchesSearch = searchTerm === "" || 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesCategory = category === "all" || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, category]);

  // 2. Fetch attachments for a specific article
  const getAttachments = async (articleId: string) => {
    return await db.attachments.where('articleId').equals(articleId).toArray();
  };

  // 3. Delta Sync Strategy
  const syncArticles = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);

    try {
      const lastSync = parseInt(localStorage.getItem('kbLastSync') || '0');
      const lastSyncDate = new Date(lastSync);

      console.log(`Syncing KB since ${lastSyncDate.toISOString()}`);

      // Query: Updated after last sync
      const q = query(
        collection(firebaseDb, "knowledge_base"),
        orderBy("updatedAt"),
        where("updatedAt", ">", Timestamp.fromMillis(lastSync)),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("KB up to date.");
      } else {
        const remoteArticles = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                firebaseId: doc.id,
                title: data.title,
                category: data.category,
                content: data.content,
                tags: data.tags || [],
                lastUpdated: data.updatedAt?.toMillis() || Date.now(),
                isPinned: 0,
                _attachments: data.attachments || [] 
            };
        });

        await db.transaction('rw', db.articles, db.attachments, async () => {
          for (const ra of remoteArticles) {
            // 1. Update/Add Article
            const existing = await db.articles.where("firebaseId").equals(ra.firebaseId).first();
            
            let articleId = existing?.id;
            if (existing) {
              await db.articles.update(existing.id!, {
                  ...ra,
                  isPinned: existing.isPinned // Preserve pin status
              });
            } else {
              // @ts-ignore
              articleId = await db.articles.add(ra);
            }

            // 2. Sync Attachments Metadata
            // We blindly overwrite attachment metadata for simplicity in this prototype
            if (ra._attachments && articleId) {
                for (const att of ra._attachments) {
                    const existingAtt = await db.attachments.get(att.storagePath);
                    if (!existingAtt) {
                        await db.attachments.add({
                            id: att.storagePath,
                            articleId: ra.firebaseId, // linking via firebaseId for stability
                            name: att.name,
                            size: att.size,
                            type: att.type,
                            isDownloaded: 0
                        });
                    }
                }
            }
          }
        });
      }

      localStorage.setItem('kbLastSync', Date.now().toString());

    } catch (error) {
      console.error("KB Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Attachment Management (Blob Storage)
  const downloadAttachment = async (attachment: LocalAttachment) => {
    if (!navigator.onLine) return;
    
    try {
        setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0.1 }));
        
        // Fetch Blob from Firebase Storage
        const storageRef = ref(storage, attachment.id);
        
        // Safety: If the ID is still a placeholder, don't try to download
        if (attachment.id.includes('gs://bucket')) {
          throw new Error("Invalid storage path: still using placeholder bucket.");
        }

        const blobBuffer = await getBytes(storageRef, 5 * 1024 * 1024); // 5MB limit for safety
        const blob = new Blob([blobBuffer], { type: attachment.type });

        // Save to IndexedDB
        await db.attachments.update(attachment.id, {
            blob: blob,
            isDownloaded: 1
        });
        
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