import * as React from "react";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";

export default function Dashboard() {
  const { data } = useData();

  const activeClients = React.useMemo(
    () => data.clients.filter((c) => c.status === "Active").length,
    [data.clients],
  );

  const draftedReports = React.useMemo(
    () => data.reports.filter((r) => r.status === "Draft").length,
    [data.reports],
  );

  const campaignWins = React.useMemo(
    () => data.wins.length,
    [data.wins],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Quick snapshot of your clients, reports, and campaign performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active clients</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Showing clients with status set to Active.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports drafted</CardTitle>
            <TrendingUp className="h-4 w-4 text-[color:var(--im-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{draftedReports}</div>
            <p className="text-xs text-muted-foreground">
              Reports currently in Draft status.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign wins</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{campaignWins}</div>
            <p className="text-xs text-muted-foreground">
              Total wins logged across all clients.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Get started</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Draft a new client report or review recent templates to keep momentum.
          </p>
          <div className="flex gap-2">
            <Button asChild className="rounded-2xl">
              <Link to="/reports">
                Open Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-2xl">
              <Link to="/templates">
                Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}