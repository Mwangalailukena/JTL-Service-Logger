export interface ReportMetric {
  label: string;
  value: number | string;
  change?: number; // percentage change
  trend?: 'up' | 'down' | 'neutral';
}

export interface SolarTrendPoint {
  date: string;
  avgBatteryHealth: number;
  avgSystemVoltage: number;
  [key: string]: any;
}

export interface ICTIssueStat {
  category: string;
  count: number;
  [key: string]: any;
}

export interface AggregatedReport {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  generatedAt: number;
  
  summary: {
    totalVisits: number;
    completedVisits: number;
    avgDurationMinutes: number;
  };
  
  technicianStats: {
    techId: string;
    techName: string;
    visits: number;
  }[];

  solarTrends: SolarTrendPoint[];
  ictIssues: ICTIssueStat[];
}
