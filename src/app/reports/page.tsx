"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useReports } from "@/features/reports/use-reports";
import { AggregatedReport } from "@/features/reports/types";
import { Download, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { generatePDF } from "@/features/reports/utils/pdf-generator";

// Dynamic imports for heavy charting libraries
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });

export default function ReportsPage() {
  const { generateLocalReport } = useReports();
  const [report, setReport] = useState<AggregatedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30"); // days

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(range));
      
      const data = await generateLocalReport(start, end);
      setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [range]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500">System performance and service trends</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter</option>
            </select>
            <button 
              onClick={() => report && generatePDF(report)}
              disabled={!report}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <Download size={18} />
              <span>Export PDF</span>
            </button>
          </div>
        </header>

        {loading ? (
           <div className="h-64 flex items-center justify-center">
             <Loader2 className="animate-spin text-blue-600" size={32} />
           </div>
        ) : report ? (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium">Total Visits</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{report.summary.totalVisits}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-slate-500 text-sm font-medium">Completion Rate</p>
                 <p className="text-4xl font-bold text-green-600 mt-2">
                   {Math.round((report.summary.completedVisits / (report.summary.totalVisits || 1)) * 100)}%
                 </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-slate-500 text-sm font-medium">Avg. Battery Health</p>
                 <p className="text-4xl font-bold text-amber-500 mt-2">
                   {report.solarTrends.length > 0 
                     ? Math.round(report.solarTrends.reduce((acc, c) => acc + c.avgBatteryHealth, 0) / report.solarTrends.length) + "%"
                     : "N/A"}
                 </p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Solar Trends */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Solar System Health Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.solarTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgBatteryHealth" stroke="#f59e0b" name="Battery Health %" />
                      <Line type="monotone" dataKey="avgSystemVoltage" stroke="#3b82f6" name="Voltage (V)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ICT Issues */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">ICT Issue Distribution</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.ictIssues}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="category"
                        label
                      >
                        {report.ictIssues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

             {/* Technician Stats */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Technician Activity</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.technicianStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="techName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#1e293b" name="Visits Logged" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

          </div>
        ) : (
          <div className="text-center py-20">No data available for this period.</div>
        )}
      </div>
    </DashboardLayout>
  );
}