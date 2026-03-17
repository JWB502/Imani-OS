import * as React from "react";
import { useData } from "@/contexts/DataContext";
import { Client } from "@/types/imani";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface BulkMonthAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function BulkMonthAddDialog({ open, onOpenChange, client }: BulkMonthAddDialogProps) {
  const { bulkUpsertMonthlyMetrics } = useData();
  const { toast } = useToast();

  const handleAdd = () => {
    const monthsRequested = ["2024-01", "2024-02"]; // Example
    const metricsToUpsert = monthsRequested.map(m => ({
      clientId: client.id,
      month: m,
      values: {}
    }));

    bulkUpsertMonthlyMetrics(metricsToUpsert);
    
    toast({
      title: "Months added.",
      description: `Created ${metricsToUpsert.length} months. You can now fill in historical KPIs.`,
    });
    onOpenChange(false);
  };

  return (
    <Button onClick={handleAdd}>Add Months</Button>
  );
}