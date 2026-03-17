import * as React from "react";
import { Link } from "react-router-dom";
import { Users, FileText, TrendingUp, Sparkles, Plus, ArrowRight } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export default function Dashboard() {
  const { data } = useData();

  const activeClients = data.clients.filter(c => c.status === "Active");
  const draftReports = data.reports.filter(r => r.status === "Draft");
  const recentWins = data.wins.slice(0, 3);

  const stats = [
    { label: "Active Clients", value: activeClients.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Draft Reports", value: draftReports.length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Recent Wins", value: data.wins.length, icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Templates", value: data.fullTemplates.length, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--im-navy)]">Operations Workspace</h1>
        <p className="text-muted-foreground">Welcome back. Here is what is happening across your agency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-3xl border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>Your recently active accounts.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/clients">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {activeClients.slice(0, 5).map((client) => (
                <Link 
                  key={client.id} 
                  to={`/clients/${client.id}`}
                  className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold group-hover:text-primary transition-colors">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.industry || "General"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(client.monthlyRetainer || 0)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Monthly</div>
                  </div>
                </Link>
              ))}
              {activeClients.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No active clients found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl bg-[color:var(--im-navy)] text-white shadow-lg overflow-hidden relative border-0">
            <CardContent className="p-6">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/5 rotate-12" />
              <h3 className="text-xl font-bold mb-2">New Report</h3>
              <p className="text-white/70 text-sm mb-6">Generate a professional insight report using your saved templates.</p>
              <Button asChild className="w-full rounded-2xl bg-white text-[color:var(--im-navy)] hover:bg-white/90 shadow-xl">
                <Link to="/reports/new"><Plus className="mr-2 h-4 w-4" /> Create Report</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Recent Wins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentWins.map(win => (
                <div key={win.id} className="flex gap-3 items-start">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div>
                    <div className="text-sm font-medium leading-tight">{win.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{win.date}</div>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full rounded-xl mt-2">
                <Link to="/wins">View Library</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}