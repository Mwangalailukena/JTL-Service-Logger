"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db as localDb, LocalServiceLog } from "@/lib/db";
import { useAuth } from "@/providers/auth-provider";
import { queueServiceLogOperation } from "@/lib/sync-engine";

export function useServiceLogs() {
  const { user, profile } = useAuth();
  
  // Live query from Dexie (IndexedDB)
  // We sort by serviceDate descending
  const logs = useLiveQuery(
    () => localDb.serviceLogs.orderBy('serviceDate').reverse().toArray()
  );

  const addLog = async (logData: Omit<LocalServiceLog, 'technicianId' | 'technicianName' | 'syncStatus' | 'createdAt' | 'updatedAt' | 'id'>) => {
    if (!user || !profile) return;

    const newLog: LocalServiceLog = {
      ...logData,
      technicianId: user.uid,
      technicianName: profile.displayName,
      syncStatus: 'pending_create',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as LocalServiceLog;

    // 1. Save to Local DB (IndexedDB) immediately
    const localId = await localDb.serviceLogs.add(newLog);

    // 2. Queue for Sync (Sync Engine handles the rest, including Firebase upload)
    const logWithId = { ...newLog, id: localId as unknown as string }; // dexie returns key
    await queueServiceLogOperation('create', logWithId);
  };

  const updateLog = async (id: string | number, updates: Partial<LocalServiceLog>) => {
    // 1. Update Local
    // Ensure numeric ID if it's a string containing a number
    const numericId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;
    
    await localDb.serviceLogs.update(numericId, {
        ...updates,
        updatedAt: Date.now(),
        syncStatus: 'pending_update'
    });

    // 2. Get updated record
    const updatedLog = await localDb.serviceLogs.get(numericId);
    if (updatedLog) {
        // 3. Queue Sync
        await queueServiceLogOperation('update', updatedLog);
    }
  };

  const deleteLog = async (id: string | number, firebaseId?: string) => {
    const numericId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;
    await localDb.serviceLogs.delete(numericId);
    await queueServiceLogOperation('delete', { id: numericId, firebaseId } as any);
  };

  return { logs, addLog, updateLog, deleteLog };
}

export function useServiceLogsFiltered(filters: {

  search: string;

  status: string;

  type: string;

  client: string;

  startDate: string;

  endDate: string;

}) {

  return useLiveQuery(async () => {

    let collection = localDb.serviceLogs.toCollection();



    // Dexie works best when we use its native filtering where possible

    // but for complex multi-criteria like this, we often pull and filter.

    // Optimization: If clientId is provided, use its index.

    if (filters.client !== "all") {

      collection = localDb.serviceLogs.where('clientId').equals(filters.client);

    } else {

      collection = localDb.serviceLogs.orderBy('serviceDate').reverse();

    }



    const all = await collection.toArray();

    

    // Sort manually if we didn't use the serviceDate index

    if (filters.client !== "all") {

      all.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

    }

    

    return all.filter(log => {

      // Search (Case insensitive)

      const matchesSearch = filters.search === "" || 

        log.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||

        log.technicianName?.toLowerCase().includes(filters.search.toLowerCase()) ||

        log.description?.toLowerCase().includes(filters.search.toLowerCase());



      // Status

      const matchesStatus = filters.status === "all" || log.status === filters.status;



      // Type

      const matchesType = filters.type === "all" || log.jobType === filters.type;



      // Date Range

      const logDate = new Date(log.serviceDate).getTime();

      const afterStart = !filters.startDate || logDate >= new Date(filters.startDate).getTime();

      const beforeEnd = !filters.endDate || logDate <= new Date(filters.endDate).getTime();



      return matchesSearch && matchesStatus && matchesType && afterStart && beforeEnd;

    });

  }, [filters]);

}
