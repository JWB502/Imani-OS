import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import { Loader2 } from "lucide-react";

// @ts-ignore - Vite will resolve this as a URL
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set worker source using the local package via Vite's URL asset mechanism
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfPageViewerProps {
  pdfData: string; // base64
  className?: string;
}

export function PdfPageViewer({ pdfData, className }: PdfPageViewerProps) {
  const [pages, setPages] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If the data is already a rendered image (from our new 1-page-at-a-time logic)
    // we bypass the PDF.js renderer and display it directly.
    if (pdfData.startsWith("data:image/")) {
      setPages([pdfData]);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadPdf() {

      try {
        setLoading(true);
        setError(null);

        // Convert base64 to Uint8Array
        const base64Content = pdfData.split(",")[1] || pdfData;
        const binaryString = window.atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        const renderedPages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High resolution

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          } as any).promise;

          renderedPages.push(canvas.toDataURL("image/png"));
        }

        if (active) {
          setPages(renderedPages);
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF rendering error:", err);
        if (active) {
          setError("Failed to render PDF document.");
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      active = false;
    };
  }, [pdfData]);

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-[32px] border border-dashed border-border/80 bg-muted/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm font-medium text-muted-foreground">Rendering PDF document...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center rounded-[32px] border border-dashed border-destructive/50 bg-destructive/5 text-destructive">
        <div className="text-sm font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {pages.map((url, i) => (
        <div key={i} className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm">
          <img src={url} alt={`Page ${i + 1}`} className="h-auto w-full object-contain" />
        </div>
      ))}
    </div>
  );
}
