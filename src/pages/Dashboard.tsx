import * as React from "react";
import { useData } from "@/contexts/DataContext";

export default function Dashboard() {
  const { data } = useData();

  const activeClients = React.useMemo(
    () => data.clients.filter((c) => c.status === "active").length,
    [data.clients]
  );

  const draftedReports = React.useMemo(
    () => data.reports.filter((r) => r.status === "draft").length,
    [data.reports]
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border">
          <div className="text-sm text-muted-foreground">Active Clients</div>
          <div className="text-2xl font-bold">{activeClients}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border">
          <div className="text-sm text-muted-foreground">Draft Reports</div>
          <div className="text-2xl font-bold">{draftedReports}</div>
        </div>
      </div>
    </div>
  );
}