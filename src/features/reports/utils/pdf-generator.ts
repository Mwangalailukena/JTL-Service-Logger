import { AggregatedReport } from "../types";

export async function generatePDF(report: AggregatedReport) {
  // Dynamic import for code splitting - saving ~200KB initial bundle
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Jeotronix Service Report", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 30);
  doc.text(`Period: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 14, 35);

  // Summary Metrics
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Overview", 14, 45);
  
  const summaryData = [
    ["Total Visits", report.summary.totalVisits],
    ["Completed", report.summary.completedVisits],
    ["Completion Rate", `${Math.round((report.summary.completedVisits / (report.summary.totalVisits || 1)) * 100)}%`]
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] } // blue-500
  });

  // Technician Stats
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("Technician Performance", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Technician', 'Visits Logged']],
    body: report.technicianStats.map(t => [t.techName, t.visits]),
    theme: 'grid'
  });

  // ICT Issues
  finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text("ICT Issues by Category", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Category', 'Count']],
    body: report.ictIssues.map(i => [i.category.toUpperCase(), i.count]),
    theme: 'grid'
  });

  doc.save(`report_${report.startDate.slice(0,10)}.pdf`);
}