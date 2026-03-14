import { ArrowRight, FileText, Sparkles, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { SoftButton } from "@/components/app/SoftButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { formatCurrency } from "@/lib/format";

export default function Dashboard() {
  const { data } = useData();

  const activeClients = data.clients.filter((c) => c.status === "Active");
  const reportsCompleted = data.reports.filter((r) => r.status === "Complete");
  const draftReports = data.reports.filter((r) => r.status === "Draft");

  const totalLifetime = data.clients.reduce(
    (sum, c) => sum + (c.totalLifetimeValue ?? 0),
    0,
  );

  const winsCount = data.wins.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Internal operations workspace
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Agency Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-2xl">
            <Link to="/reports/new">
              New report <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <SoftButton asChild className="rounded-2xl">
            <Link to="/clients/new">Add client</Link>
          </SoftButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active clients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {activeClients.length}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {data.clients.length} total in the system
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports completed
            </CardTitle>
            <FileText className="h-4 w-4 text-[color:var(--im-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {reportsCompleted.length}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {draftReports.length} drafts in progress
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wins logged
            </CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{winsCount}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="rounded-full bg-[color:var(--im-navy)] text-white">
                Case studies: {data.wins.filter((w) => w.caseStudyPotential).length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime value tracked
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[color:var(--im-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {formatCurrency(totalLifetime)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Sum of client lifetime values (manual)
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">What's moving right now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Draft reports</div>
                <div className="text-xs text-muted-foreground">
                  Push these to "Complete" to lock the PDF.
                </div>
              </div>
              <SoftButton asChild className="rounded-2xl bg-white">
                <Link to="/reports">Review</Link>
              </SoftButton>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--im-navy)] p-3 text-white ring-1 ring-white/10">
              <div>
                <div className="text-sm font-medium">Template-driven speed</div>
                <div className="text-xs text-white/80">
                  Build once, reuse forever. Duplicate + revise for versioning.
                </div>
              </div>
              <Button asChild className="rounded-2xl bg-white text-[color:var(--im-navy)] hover:bg-white/90">
                <Link to="/templates">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <SoftButton asChild className="h-11 justify-between rounded-2xl">
              <Link to="/impact">
                Agency Impact Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </SoftButton>
            <SoftButton asChild className="h-11 justify-between rounded-2xl">
              <Link to="/wins">
                Wins Library <ArrowRight className="h-4 w-4" />
              </Link>
            </SoftButton>
            <SoftButton asChild className="h-11 justify-between rounded-2xl">
              <Link to="/roi">
                ROI Tracking <ArrowRight className="h-4 w-4" />
              </Link>
            </SoftButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}