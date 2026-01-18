"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { processSyncQueue, pullInitialData } from "@/lib/sync-engine";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/providers/auth-provider";

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(true); // Assume true initially
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor sync queue count using Dexie live query
  const pendingCount = useLiveQuery(() => db.syncQueue.count()) || 0;

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || !user) return;
    
    setIsSyncing(true);
    try {
      await pullInitialData(); // Pull first
      await processSyncQueue(); // Then push
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Manual sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    // 1. Initial Pull - Only if authenticated
    if (navigator.onLine && user && !authLoading) {
        pullInitialData();
    }

    // 2. Online/Offline Listeners
    const handleOnline = () => {
        setIsOnline(true);
        if (user) syncNow(); // Auto-sync on reconnect
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    // 2. Periodic Sync (Poller)
    // Runs every minute to clear queue if it got stuck or if connectivity fluttered
    const poller = setInterval(() => {
        if (navigator.onLine && pendingCount > 0 && user) {
            syncNow();
        }
    }, 60000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(poller);
    };
  }, [syncNow, pendingCount, user, authLoading]);

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount, lastSyncTime, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};