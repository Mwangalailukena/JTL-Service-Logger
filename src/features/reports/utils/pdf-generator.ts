import { AggregatedReport } from "../types";
import { ServiceLogFormValues } from "@/lib/schemas";

export async function generatePDF(report: AggregatedReport) {
  // Dynamic import for code splitting
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

/**
 * Generates a detailed Field Service Report for a single job
 * Can be shared offline via Web Share API
 */
export async function generateServiceLogPDF(log: ServiceLogFormValues & { photos?: string[] }, clientName: string) {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
  
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
  
    // --- Header ---
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("FIELD SERVICE REPORT", 14, 25);
    
    doc.setFontSize(10);
    doc.text(`Jeotronix Technical Services`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`Date: ${new Date(log.serviceDate).toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });
  
    // --- Client & Job Info ---
    doc.setTextColor(0, 0, 0);
    let currentY = 55;
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Client Information", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Client Name: ${clientName}`, 14, currentY + 7);
    doc.text(`Job Type: ${log.jobType.toUpperCase()}`, 14, currentY + 14);
    doc.text(`Status: ${log.status.toUpperCase()}`, 100, currentY + 7);
    doc.text(`Duration: ${log.durationMinutes} Minutes`, 100, currentY + 14);
  
    currentY += 25;
  
    // --- Technical Details (Dynamic Table) ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Technical Parameters", 14, currentY);
    currentY += 5;
  
    const tableBody = [];
    if (log.jobType === 'ict' && log.ictData) {
        if (log.ictData.networkType) tableBody.push(['Network Type', log.ictData.networkType.toUpperCase()]);
        if (log.ictData.signalStrength) tableBody.push(['Signal Strength', `${log.ictData.signalStrength} dBm`]);
        if (log.ictData.hardwareReplaced) tableBody.push(['Hardware Replaced', log.ictData.hardwareReplaced]);
        if (log.ictData.issueCategory) tableBody.push(['Issue Category', log.ictData.issueCategory.toUpperCase()]);
    } else if (log.jobType === 'solar' && log.solarData) {
        if (log.solarData.systemVoltage) tableBody.push(['System Voltage', `${log.solarData.systemVoltage} V`]);
        if (log.solarData.batteryHealth) tableBody.push(['Battery Health', `${log.solarData.batteryHealth}%`]);
        if (log.solarData.inverterStatus) tableBody.push(['Inverter Status', log.solarData.inverterStatus.toUpperCase()]);
        tableBody.push(['Panels Cleaned', log.solarData.panelsCleaned ? 'Yes' : 'No']);
    }
  
    autoTable(doc, {
      startY: currentY,
      head: [['Parameter', 'Value']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });
  
    // --- Description ---
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Work Description", 14, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(log.description, pageWidth - 28);
    doc.text(splitDesc, 14, currentY + 7);
  
    currentY += 10 + (splitDesc.length * 5);
  
    // --- Photos ---
    if (log.photos && log.photos.length > 0) {
        // Add new page if space is low
        if (currentY > 200) {
            doc.addPage();
            currentY = 20;
        }
  
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Site Photos", 14, currentY);
        currentY += 10;
  
        const imgWidth = 50;
        const imgHeight = 50;
        const gap = 10;
        let x = 14;
  
        log.photos.forEach((photoData, index) => {
             // Handle simple pagination for photos
             if (x + imgWidth > pageWidth) {
                 x = 14;
                 currentY += imgHeight + gap;
             }
             if (currentY + imgHeight > 280) {
                 doc.addPage();
                 currentY = 20;
                 x = 14;
             }
  
             try {
                 doc.addImage(photoData, 'JPEG', x, currentY, imgWidth, imgHeight);
                 // Border
                 doc.setDrawColor(200);
                 doc.rect(x, currentY, imgWidth, imgHeight); 
                 x += imgWidth + gap;
             } catch (e) {
                 console.warn("Could not add image to PDF", e);
             }
        });
        currentY += imgHeight + 20;
    }
  
    // --- Sign Off ---
    if (currentY > 240) {
        doc.addPage();
        currentY = 40;
    } else {
        currentY += 10;
    }
  
    doc.setDrawColor(150);
    doc.line(14, currentY + 20, 90, currentY + 20); // Line 1
    doc.line(110, currentY + 20, 190, currentY + 20); // Line 2
  
    doc.setFontSize(8);
    doc.text("Technician Signature", 14, currentY + 25);
    doc.text("Client Signature", 110, currentY + 25);
  
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by Jeotronix PWA", pageWidth / 2, 290, { align: 'center' });
  
    // --- Return Blob for Sharing ---
    return doc.output('blob');
  }
