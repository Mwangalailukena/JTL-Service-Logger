"use client";

import { useSync } from "@/providers/sync-provider";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useSync();

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-200">
        <CloudOff size={14} />
        <span>Offline ({pendingCount} pending)</span>
      </div>
    );
  }

  if (isSyncing) {
     return (
      <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200">
        <RefreshCw size={14} className="animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
      // Online but items pending (waiting for retry or trigger)
      return (
        <button 
            onClick={syncNow}
            className="flex items-center space-x-2 text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        >
            <Cloud size={14} />
            <span>{pendingCount} unsynced</span>
        </button>
      );
  }

  // All good
  return (
    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium border border-green-200">
        <Cloud size={14} />
        <span>Synced</span>
    </div>
  );
}
