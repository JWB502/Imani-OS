import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import from the legacy build for better environment compatibility
// @ts-ignore - types are compatible but paths are deep
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// Use a direct CDN link to the legacy worker matching the installed version
// this ensures the worker and library logic stay in sync and bypasses local bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

export interface RenderedPdfPage {
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
}

/**
 * Renders a PDF file to an array of high-quality image data URLs.
 * One for each page. Use scale 2.0 to capture enough detail for 
 * subsequent 1.5x scaling during export without losing quality.
 */
export async function renderPdfToImages(file: File): Promise<RenderedPdfPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const renderedPages: RenderedPdfPage[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // Use scale 2.0 for high resolution "as-is" fidelity (1224px width)
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;

    // Use JPEG 0.8 for professional quality with a reduced footprint
    renderedPages.push({
      dataUrl: canvas.toDataURL("image/jpeg", 0.8),
      width: viewport.width,
      height: viewport.height,
      pageNumber: i,
    });
    
    // Cleanup memory
    page.cleanup();
  }
  
  return renderedPages;
}

export async function exportElementToPdf(opts: {
  elements: HTMLElement[];
  fileName: string;
}) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
    compress: true, 
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < opts.elements.length; i++) {
    if (i > 0) pdf.addPage();
    
    // 1.5x scale during export results in a 1224px wide image (816 * 1.5)
    // which matches the 2.0x scale import exactly (612 * 2.0 = 1224px).
    const canvas = await html2canvas(opts.elements[i], {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.75);
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  pdf.save(opts.fileName);
}