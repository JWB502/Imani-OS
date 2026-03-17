import * as React from "react";
import { useData } from "@/contexts/DataContext";

export default function Impact() {
  const { data } = useData();

  const activeClientsCount = data.clients.filter((c) => c.status === "active").length;
  const completedReportsCount = data.reports.filter((r) => r.status === "published").length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Agency Impact</h1>
      <div className="mt-4">
        Active: {activeClientsCount} | Published Reports: {completedReportsCount}
      </div>
    </div>
  );
}