"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalServiceLog } from "@/lib/db";
import { AggregatedReport, ICTIssueStat, SolarTrendPoint } from "./types";

export function useReports() {
  
  // Client-side aggregation for offline use (when Cloud Function isn't reachable)
  const generateLocalReport = async (startDate: Date, endDate: Date): Promise<AggregatedReport> => {
    // Fetch logs in range
    const logs = await db.serviceLogs
      .where('serviceDate')
      .between(startDate.toISOString(), endDate.toISOString(), true, true)
      .toArray();

    // 1. Summary
    const totalVisits = logs.length;
    const completedVisits = logs.filter(l => l.status === 'completed').length;
    const totalDuration = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    const avgDurationMinutes = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;
    
    // 2. Tech Stats
    const techMap = new Map<string, {name: string, count: number}>();
    logs.forEach(l => {
      const existing = techMap.get(l.technicianId) || { name: l.technicianName || "Unknown", count: 0 };
      existing.count++;
      techMap.set(l.technicianId, existing);
    });
    const technicianStats = Array.from(techMap.entries()).map(([techId, data]) => ({
      techId,
      techName: data.name,
      visits: data.count
    }));

    // 3. Solar Trends
    const solarLogs = logs.filter(l => l.jobType === 'solar');
    // Group by day for simplified trend
    const trendsMap = new Map<string, {batt: number, volt: number, count: number}>();
    solarLogs.forEach(l => {
        const d = l.serviceDate;
        const sData = l.solarData;
        if (!sData) return;
        
        const curr = trendsMap.get(d) || { batt: 0, volt: 0, count: 0 };
        curr.batt += sData.batteryHealth || 0;
        curr.volt += sData.systemVoltage || 0;
        curr.count++;
        trendsMap.set(d, curr);
    });

    const solarTrends: SolarTrendPoint[] = Array.from(trendsMap.entries())
        .map(([date, data]) => ({
            date,
            avgBatteryHealth: Math.round(data.batt / data.count),
            avgSystemVoltage: Math.round(data.volt / data.count)
        }))
        .sort((a,b) => a.date.localeCompare(b.date));

    // 4. ICT Issues
    const ictLogs = logs.filter(l => l.jobType === 'ict');
    const issueMap = new Map<string, number>();
    ictLogs.forEach(l => {
        const cat = l.ictData?.issueCategory || 'uncategorized';
        issueMap.set(cat, (issueMap.get(cat) || 0) + 1);
    });
    const ictIssues: ICTIssueStat[] = Array.from(issueMap.entries())
        .map(([category, count]) => ({ category, count }));

    return {
        id: `local_${Date.now()}`,
        period: 'monthly', // simplified
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: Date.now(),
        summary: { totalVisits, completedVisits, avgDurationMinutes },
        technicianStats,
        solarTrends,
        ictIssues
    };
  };

  return { generateLocalReport };
}