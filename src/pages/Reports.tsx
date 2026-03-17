import * as React from "react";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Client } from "@/types/imani";

export default function Reports() {
  const { data, createReportFromTemplate, duplicateReport, deleteReport } = useData();
  const { settings } = useSettings();
  const [query, setQuery] = React.useState("");

  const clientMap = React.useMemo(() => {
    const map = new Map<string, Client>();
    data.clients.forEach(c => map.set(c.id, c));
    return map;
  }, [data.clients]);

  const filteredReports = data.reports.filter(r => {
    if (!query) return true;
    const client = clientMap.get(r.clientId);
    const clientName = client?.name ?? "";
    const hay = [r.title, r.reportType, r.reportingPeriod, r.status, clientName].map(s => s.toLowerCase());
    return hay.some(h => h.includes(query.toLowerCase()));
  });

  return (
    <div className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.title}</TableCell>
              <TableCell>{clientMap.get(r.clientId)?.name ?? "—"}</TableCell>
              <TableCell>{r.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}