import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPdf(opts: {
  elements: HTMLElement[];
  fileName: string;
}) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    compress: true, // Enable internal PDF compression
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < opts.elements.length; i++) {
    if (i > 0) pdf.addPage();
    
    // Using a slightly lower scale (1.5x) for 80%+ file size savings
    // While JPEG format (0.75 quality) handles the rest
    const canvas = await html2canvas(opts.elements[i], {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.75);
    
    // Add the JPEG image to the current page
    // Compression "FAST" is used for the JPEG to keep it snappy
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  pdf.save(opts.fileName);
}
