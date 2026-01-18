import { db, SyncQueueItem, LocalServiceLog, LocalArticle, LocalAttachment } from "./db";
import { SearchEngine } from "./search";
import { db as firestore, storage } from "./firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  Timestamp
} from "firebase/firestore";
import { ref, getBytes } from "firebase/storage";

const RETRY_DELAY_MS = 5000;

export async function pullInitialData() {
  if (!navigator.onLine) return;

  try {
    console.log("Starting initial data pull...");
    
    // 1. Pull Clients
    console.log("Pulling clients...");
    const clientSnapshot = await getDocs(collection(firestore, "clients"));
    const clients = clientSnapshot.docs.map(doc => ({
      firebaseId: doc.id,
      ...doc.data()
    })) as any[];
    
    await db.clients.clear();
    await db.clients.bulkAdd(clients);
    console.log(`Successfully pulled ${clients.length} clients`);

    // 2. Pull Knowledge Base
    console.log("Pulling knowledge base...");
    const kbSnapshot = await getDocs(query(collection(firestore, "knowledge_base"), orderBy("updatedAt", "desc")));
    
    await db.transaction('rw', db.articles, db.attachments, async () => {
        // Clear for the "Initial" pull
        await db.articles.clear();
        
        for (const doc of kbSnapshot.docs) {
            const data = doc.data();
            const article: LocalArticle = {
                firebaseId: doc.id,
                title: data.title,
                category: data.category,
                content: data.content,
                tags: data.tags || [],
                version: data.version || 1,
                lastUpdated: data.updatedAt?.toMillis() || Date.now(),
                deletedAt: data.deletedAt?.toMillis() || null,
                isPinned: 0,
                isCritical: data.isCritical ? 1 : 0 // Map critical flag
            };
            
            // @ts-ignore
            await db.articles.add(article);

            // Handle Attachments Metadata
            if (data.attachments) {
                for (const att of data.attachments) {
                     const existingAtt = await db.attachments.get(att.storagePath);
                     if (!existingAtt) {
                         const newAtt = {
                             id: att.storagePath,
                             articleId: doc.id,
                             name: att.name,
                             size: att.size,
                             type: att.type,
                             isDownloaded: 0
                         };
                         await db.attachments.add(newAtt);
                         
                         // Auto-download critical attachments during initial pull
                         if (article.isCritical) {
                             downloadKBAttachment(newAtt).catch(e => console.warn("Background critical download failed", e));
                         }
                     }
                }
            }
        }
    });
    
    // Build Search Index
    await SearchEngine.rebuildIndex();
    
    console.log(`Successfully pulled ${kbSnapshot.size} articles`);

    // 3. Pull Service Logs
    console.log("Pulling service logs...");
    const logsSnapshot = await getDocs(query(collection(firestore, "serviceLogs"), orderBy("serviceDate", "desc")));
    
    let logsCount = 0;
    for (const doc of logsSnapshot.docs) {
      logsCount++;
      const data = doc.data();
      const firebaseId = doc.id;
      
      const existing = await db.serviceLogs.where('firebaseId').equals(firebaseId).first();
      
      const logData = {
        ...data,
        firebaseId,
        syncStatus: 'synced',
        serviceDate: typeof data.serviceDate === 'string' ? data.serviceDate : new Date().toISOString(),
      } as LocalServiceLog;

      if (existing) {
        await db.serviceLogs.update(existing.id!, logData);
      } else {
        await db.serviceLogs.add(logData);
      }
    }

    console.log(`Successfully synchronized ${logsCount} service logs`);
  } catch (error) {
    console.error("Failed to pull initial data:", error);
  }
}

/**
 * Robust Delta Sync for Knowledge Base (Optimized)
 * - Loops through pages of updates
 * - Handles critical article pre-caching
 * - Updates lastSync timestamp accurately
 */
export async function syncKnowledgeBase() {
    if (!navigator.onLine) return;

    try {
      let lastSync = parseInt(localStorage.getItem('kbLastSync') || '0');
      // Buffer of 1 minute to handle server time skew
      let syncQueryTime = lastSync > 0 ? lastSync - 60000 : 0; 
      
      let hasMore = true;
      let loopCount = 0;
      const BATCH_SIZE = 50;

      console.log(`Starting KB Sync. Last Sync: ${new Date(syncQueryTime).toISOString()}`);

      while (hasMore && loopCount < 10) {
        loopCount++;
        
        const q = query(
            collection(firestore, "knowledge_base"),
            orderBy("updatedAt"),
            where("updatedAt", ">", Timestamp.fromMillis(syncQueryTime)),
            limit(BATCH_SIZE)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            hasMore = false;
            console.log("KB Sync complete. No more updates.");
            break;
        }

        console.log(`KB Sync: Processing batch ${loopCount} with ${querySnapshot.size} docs.`);

        let maxBatchTime = syncQueryTime;
        
        const remoteArticles = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const updatedAt = data.updatedAt?.toMillis() || Date.now();
            if (updatedAt > maxBatchTime) maxBatchTime = updatedAt;

            return {
                firebaseId: doc.id,
                title: data.title,
                category: data.category,
                content: data.content,
                tags: data.tags || [],
                version: data.version || 1,
                lastUpdated: updatedAt,
                deletedAt: data.deletedAt?.toMillis() || null,
                isPinned: 0,
                isCritical: data.isCritical ? 1 : 0,
                _attachments: data.attachments || [] 
            };
        });

        await db.transaction('rw', db.articles, db.attachments, db.searchIndex, async () => {
          for (const ra of remoteArticles) {
            // 1. Update/Add Article
            const existing = await db.articles.where("firebaseId").equals(ra.firebaseId).first();
            
            let articleId = existing?.id;
            if (existing) {
              await db.articles.update(existing.id!, {
                  ...ra,
                  isPinned: existing.isPinned 
              });
            } else {
              // @ts-ignore
              articleId = await db.articles.add(ra);
            }

            // Update Search Index
            await SearchEngine.indexArticle(ra as LocalArticle);

            // 2. Sync Attachments Metadata
            if (!ra.deletedAt && ra._attachments && articleId) {
                for (const att of ra._attachments) {
                    const existingAtt = await db.attachments.get(att.storagePath);
                    
                    // Logic for pre-caching:
                    // If attachment is new -> Add & Download if critical
                    // If exists but not downloaded -> Download if critical
                    
                    let attToDownload = null;

                    if (!existingAtt) {
                        const newAtt = {
                            id: att.storagePath,
                            articleId: ra.firebaseId, 
                            name: att.name,
                            size: att.size,
                            type: att.type,
                            isDownloaded: 0
                        };
                        await db.attachments.add(newAtt);
                        if (ra.isCritical) attToDownload = newAtt;
                    } else if (ra.isCritical && !existingAtt.isDownloaded) {
                        attToDownload = existingAtt;
                    }

                    if (attToDownload) {
                        // Trigger download in background
                        downloadKBAttachment(attToDownload).catch(err => 
                            console.warn(`Failed to auto-download critical attachment ${att.name}`, err)
                        );
                    }
                }
            }
          }
        });
        
        // Update Sync Time for next loop iteration
        syncQueryTime = maxBatchTime;
        localStorage.setItem('kbLastSync', maxBatchTime.toString());
      }

    } catch (error) {
      console.error("KB Sync failed:", error);
    }
}

/**
 * Download Attachment Blob and Cache in IndexedDB
 */
export async function downloadKBAttachment(attachment: LocalAttachment) {
    if (!navigator.onLine) throw new Error("Offline");
    
    // Safety: If the ID is still a placeholder
    if (attachment.id.includes('gs://bucket')) {
      throw new Error("Invalid storage path: still using placeholder bucket.");
    }

    const storageRef = ref(storage, attachment.id);
    const blobBuffer = await getBytes(storageRef, 5 * 1024 * 1024); // 5MB limit
    const blob = new Blob([blobBuffer], { type: attachment.type });

    // Save to IndexedDB
    await db.attachments.update(attachment.id, {
        blob: blob,
        isDownloaded: 1
    });

    return blob;
}

export async function processSyncQueue() {
  if (!navigator.onLine) return;

  const queue = await db.syncQueue.orderBy('timestamp').toArray();

  for (const item of queue) {
    try {
      await processItem(item);
      // If successful, remove from queue
      await db.syncQueue.delete(item.id!);
    } catch (error) {
      console.error(`Sync failed for item ${item.id}:`, error);
      // Basic retry strategy: leave in queue, it will be picked up next run
      break; 
    }
  }
}

async function processItem(item: SyncQueueItem) {
  const { collection: colName, operation, data, docId } = item;
  
  // Reference to the Firestore collection
  const colRef = collection(firestore, colName);

  switch (operation) {
    case 'create': {
      // 1. Clean data (remove local-only fields)
      const { id, syncStatus, firebaseId, ...cleanData } = data;
      const payload = {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 2. Write to Firestore
      const docRef = await addDoc(colRef, payload);

      // 3. Update local record with the new Firebase ID and 'synced' status
      if (colName === 'serviceLogs') {
        if (data.id) {
            await db.serviceLogs.update(data.id, {
                firebaseId: docRef.id,
                syncStatus: 'synced'
            });
        }
      } else if (colName === 'clients') {
        if (data.id) {
            await db.clients.update(data.id, {
                firebaseId: docRef.id
            });
        }
      } else if (colName === 'knowledge_base') {
        if (data.id) {
            // Update the local article with the real Firebase ID
            // We also re-index it with the new ID
            const article = await db.articles.get(data.id);
            if (article) {
                await db.articles.update(data.id, { firebaseId: docRef.id });
                // Re-index search for the new ID
                await SearchEngine.indexArticle({ ...article, firebaseId: docRef.id });
            }
        }
      }
      break;
    }

    case 'update': {
      if (!docId) {
        console.warn(`Skipping Firestore update for ${colName} - document not yet synced to cloud.`);
        if (colName === 'serviceLogs' && data.id) {
            await db.serviceLogs.update(data.id, { syncStatus: 'synced' });
        }
        return; 
      }
      
      const docRef = doc(firestore, colName, docId);
      const { id, syncStatus, firebaseId, ...cleanData } = data;
      
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp(),
      });

      if (colName === 'serviceLogs' && data.id) {
         await db.serviceLogs.update(data.id, { syncStatus: 'synced' });
      }
      break;
    }

    case 'delete': {
      if (!docId) throw new Error("Missing docId for delete operation");
      await deleteDoc(doc(firestore, colName, docId));
      break;
    }
  }
}

export async function queueOperation(
  collection: 'serviceLogs' | 'clients' | 'knowledge_base',
  op: 'create' | 'update' | 'delete',
  data: any
) {
  // 1. Add to Sync Queue
  await db.syncQueue.add({
    collection,
    operation: op,
    docId: data.firebaseId,
    data,
    timestamp: Date.now()
  });

  // 2. Trigger immediate sync attempt if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}

export async function queueServiceLogOperation(
  op: 'create' | 'update' | 'delete', 
  log: LocalServiceLog
) {
  if (op === 'create' || op === 'update') {
      await db.serviceLogs.update(log.id!, { syncStatus: `pending_${op}` });
  }
  await queueOperation('serviceLogs', op, log);
}
