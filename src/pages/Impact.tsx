import * as React from "react";
import { BarChart3, Users, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default function Impact() {
  const { data } = useData();

  const activeClients = data.clients.filter(c => c.status === "Active");
  const totalLtv = activeClients.reduce((sum, c) => sum + (c.totalLifetimeValue || 0), 0);
  const totalReports = data.reports.filter(r => r.status === "Complete").length;
  const totalWins = data.wins.length;

  const highlights = [
    { label: "Portfolio Value", value: formatCurrency(totalLtv), icon: TrendingUp, color: "text-emerald-600" },
    { label: "Active Impact", value: activeClients.length, icon: Users, color: "text-blue-600" },
    { label: "Insight Reports", value: totalReports, icon: Target, color: "text-purple-600" },
    { label: "Recorded Wins", value: totalWins, icon: CheckCircle2, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--im-navy)]">Agency Impact</h1>
          <p className="text-muted-foreground">The aggregate growth and outcomes generated across your entire portfolio.</p>
        </div>
        <div className="p-3 bg-white border rounded-2xl shadow-sm">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((h) => (
          <Card key={h.label} className="rounded-3xl border-border/50 bg-white/70 shadow-sm group">
            <CardContent className="p-6">
              <div className="flex flex-col gap-2">
                <div className={`p-2 w-fit rounded-xl bg-slate-50 ${h.color}`}>
                  <h.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold tracking-tight">{h.value}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{h.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Industry Distribution</CardTitle>
            <CardDescription>Impact footprint across different sectors.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(new Set(data.clients.map(c => c.industry || "General"))).map(industry => {
                const count = data.clients.filter(c => (c.industry || "General") === industry).length;
                const percentage = (count / data.clients.length) * 100;
                return (
                  <div key={industry} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{industry}</span>
                      <span className="text-muted-foreground">{count} clients</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Service Delivery</CardTitle>
            <CardDescription>Most frequently provided services.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-wrap gap-2">
                {Array.from(new Set(data.clients.flatMap(c => c.serviceTypes))).map(service => (
                  <div key={service} className="px-4 py-2 rounded-2xl bg-white border border-border/60 text-sm font-medium shadow-sm">
                    {service}
                  </div>
                ))}
             </div>
             <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold text-primary">Outcome Driven</div>
                <p className="text-xs text-muted-foreground mt-1">Your agency maintains a high report-to-client ratio, ensuring transparency and alignment.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}