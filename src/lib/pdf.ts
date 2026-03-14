import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPdf(opts: {
  element: HTMLElement;
  fileName: string;
  pageNumbers: boolean;
}) {
  const canvas = await html2canvas(opts.element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  let page = 1;
  const totalPages = Math.ceil(imgHeight / pageHeight);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    page++;
  }

  if (opts.pageNumbers) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      pdf.text(`${i} / ${totalPages}`, pageWidth - 54, pageHeight - 24);
    }
  }

  pdf.save(opts.fileName);
}
