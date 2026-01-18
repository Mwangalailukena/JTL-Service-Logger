import Dexie, { Table } from 'dexie';

// Define types for our local database
export interface LocalServiceLog {
  id?: string; // Optional because it might be auto-incremented locally before sync
  firebaseId?: string; // The ID in Firestore
  clientId: string;
  clientName: string;
  technicianId: string;
  technicianName: string; // Denormalized for reports/offline use
  serviceDate: string; // ISO string
  durationMinutes: number; // Duration of intervention in minutes
  description: string;
  status: 'pending' | 'completed' | 'cancelled' | 'draft';
  jobType: 'ict' | 'solar'; // Explicitly added to interface
  syncStatus: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
  createdAt: number;
  updatedAt: number;
  
  // Dynamic polymorphic data
  ictData?: {
    networkType?: 'fiber' | 'lte' | 'vsat' | 'lan';
    signalStrength?: number;
    hardwareReplaced?: string;
    issueCategory?: 'hardware' | 'software' | 'network' | 'power';
  };
  solarData?: {
    systemVoltage?: number;
    batteryHealth?: number;
    inverterStatus?: 'normal' | 'warning' | 'fault' | 'off';
    panelsCleaned?: boolean;
  };
}
  
export interface LocalClient {
    id?: string;
    firebaseId: string;
    name: string;
    type: 'corporate' | 'residential' | 'gov';
    location: string;
    contactPerson: string;
}

export interface SyncQueueItem {
    id?: number;
    collection: string;
    docId?: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
}

export interface LocalArticle {
    id?: string;
    firebaseId: string;
    title: string;
    category: 'ict' | 'solar' | 'general';
    content: string; // Markdown
    tags: string[];
    version: number;
    lastUpdated: number;
    deletedAt?: number | null; // For soft deletes
    isPinned: number; // 0 or 1 for indexing
    isCritical?: number; // 0 or 1 - Critical articles auto-download attachments
}

export interface LocalAttachment {
    id: string; // firebase storage path or local temp id
    articleId: string;
    name: string;
    size: number;
    type: string;
    localUrl?: string; // Blob URL if cached
    blob?: Blob; // Actual file data for offline storage
    isDownloaded: number; 
    needsUpload?: number; // 1 if pending upload to Firebase Storage
}

export interface SearchIndexEntry {
    word: string;
    refs: { id: string; score: number }[]; // Article IDs and their relevance score
}

export class JeotronixDB extends Dexie {    
    serviceLogs!: Table<LocalServiceLog>;
    clients!: Table<LocalClient>;
    syncQueue!: Table<SyncQueueItem>;
    articles!: Table<LocalArticle>;
    attachments!: Table<LocalAttachment>;
    searchIndex!: Table<SearchIndexEntry>;

    constructor() {
      super('JeotronixDB');
      this.version(9).stores({
        serviceLogs: '++id, firebaseId, clientId, technicianId, status, syncStatus, serviceDate, jobType',
        clients: '++id, firebaseId, name, type',
        syncQueue: '++id, collection, operation, timestamp',
        articles: '++id, firebaseId, title, category, *tags, isPinned, isCritical, lastUpdated, deletedAt',
        attachments: 'id, articleId, isDownloaded, needsUpload',
        searchIndex: 'word'
      });
    }
}

export const db = new JeotronixDB();