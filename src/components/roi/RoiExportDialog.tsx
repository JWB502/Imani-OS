import React, { useState } from "react";
import { Download, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MetricDefinition, MonthlyMetric, Client } from "@/types/imani";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoiExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  metricDefs: MetricDefinition[];
  months: MonthlyMetric[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function RoiExportDialog({
  open,
  onOpenChange,
  client,
  metricDefs,
  months,
}: RoiExportDialogProps) {
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const availableYears = Array.from(
    new Set(months.map((m) => m.month.split("-")[0]))
  ).sort((a, b) => b.localeCompare(a));

  const toggleKpi = (id: string) => {
    setSelectedKpiIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 10
        ? [...prev, id]
        : prev
    );
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : prev.length < 3
        ? [...prev, year]
        : prev
    );
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const sortedSelectedYears = [...selectedYears].sort();

    selectedKpiIds.forEach((kpiId, index) => {
      const kpi = metricDefs.find((m) => m.id === kpiId);
      if (!kpi) return;

      if (index > 0) {
        doc.addPage();
      }

      // Header
      doc.setFontSize(18);
      doc.text(kpi.name, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Client: ${client.name}`, 14, 30);
      doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 35);

      const tableData: any[][] = [];
      const totals: Record<string, number[]> = {};

      MONTH_NAMES.forEach((monthName, monthIdx) => {
        const row = [monthName];
        sortedSelectedYears.forEach((year) => {
          const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
          const monthData = months.find((m) => m.month === monthKey);
          const val = monthData?.values[kpiId];
          
          if (typeof val === "number") {
            row.push(kpi.kind === "currency" ? formatCurrency(val) : kpi.kind === "percent" ? `${val}%` : formatNumber(val));
            if (!totals[year]) totals[year] = [];
            totals[year].push(val);
          } else {
            row.push("-");
          }
        });
        tableData.push(row);
      });

      // Footer Row (Summary)
      const footerRow = [kpi.kind === "percent" ? "Average" : "Total"];
      sortedSelectedYears.forEach((year) => {
        const yearVals = totals[year] || [];
        if (yearVals.length === 0) {
          footerRow.push("-");
          return;
        }

        const result = kpi.kind === "percent" 
          ? yearVals.reduce((a, b) => a + b, 0) / yearVals.length
          : yearVals.reduce((a, b) => a + b, 0);

        footerRow.push(kpi.kind === "currency" ? formatCurrency(result) : kpi.kind === "percent" ? `${result.toFixed(2)}%` : formatNumber(result));
      });
      tableData.push(footerRow);

      autoTable(doc, {
        startY: 45,
        head: [["Month", ...sortedSelectedYears]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [26, 31, 78], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
        didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
      });
    });

    doc.save(`${client.name}_ROI_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Export ROI Data to PDF</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select KPIs</Label>
              <span className="text-xs text-muted-foreground">{selectedKpiIds.length}/10</span>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {metricDefs.map((md) => (
                  <div key={md.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`kpi-${md.id}`}
                      checked={selectedKpiIds.includes(md.id)}
                      onCheckedChange={() => toggleKpi(md.id)}
                      disabled={!selectedKpiIds.includes(md.id) && selectedKpiIds.length >= 10}
                    />
                    <Label
                      htmlFor={`kpi-${md.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {md.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Years</Label>
              <span className="text-xs text-muted-foreground">{selectedYears.length}/3</span>
            </div>
            <div className="space-y-3">
              {availableYears.map((year) => (
                <div key={year} className="flex items-center space-x-3">
                  <Checkbox
                    id={`year-${year}`}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={() => toggleYear(year)}
                    disabled={!selectedYears.includes(year) && selectedYears.length >= 3}
                  />
                  <Label
                    htmlFor={`year-${year}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {year}
                  </Label>
                </div>
              ))}
              {availableYears.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No data found</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            disabled={selectedKpiIds.length === 0 || selectedYears.length === 0}
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
