import { db, SyncQueueItem, LocalServiceLog } from "./db";
import { db as firestore } from "./firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";

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
    const articles = kbSnapshot.docs.map(doc => ({
      firebaseId: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().updatedAt?.toMillis() || Date.now(),
      isPinned: doc.data().isPinned ? 1 : 0
    })) as any[];

    await db.articles.clear();
    await db.articles.bulkAdd(articles);
    console.log(`Successfully pulled ${articles.length} articles`);

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
      // In a real app, you might want a 'retryCount' field to prevent infinite loops for bad data
      // For now, we just break to avoid hammering the API if we are "online" but unstable
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
      }
      break;
    }

    case 'update': {
      // If we don't have a docId (firebaseId), it means the 'create' operation 
      // hasn't finished yet or it's a draft that was never synced.
      if (!docId) {
        console.warn(`Skipping Firestore update for ${colName} - document not yet synced to cloud.`);
        // We still mark it as 'synced' locally so it doesn't keep trying 
        // until the next change happens. The 'create' operation in the queue 
        // will eventually upload the final state anyway.
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

      // Update local status
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

/**
 * Queue a Generic Operation
 */
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

/**
 * Queue a Service Log operation (Legacy wrapper)
 */
export async function queueServiceLogOperation(
  op: 'create' | 'update' | 'delete', 
  log: LocalServiceLog
) {
  if (op === 'create' || op === 'update') {
      await db.serviceLogs.update(log.id!, { syncStatus: `pending_${op}` });
  }
  await queueOperation('serviceLogs', op, log);
}
