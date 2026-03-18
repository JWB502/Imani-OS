"use client";

import * as React from "react";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  Clock, 
  Info,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type CalcMethod = "revenue" | "profit" | "replacement";

export default function ValueCalculator() {
  const [method, setMethod] = React.useState<CalcMethod>("revenue");
  
  // Input states
  const [m1, setM1] = React.useState<string>("");
  const [m2, setM2] = React.useState<string>("");
  const [m3, setM3] = React.useState<string>("");
  const [hoursPerWeek, setHoursPerWeek] = React.useState<string>("");
  const [basisType, setBasisType] = React.useState<"revenue" | "profit">("revenue");
  const [impactHours, setImpactHours] = React.useState<string>("10");

  // Reset inputs when method changes
  React.useEffect(() => {
    setM1("");
    setM2("");
    setM3("");
    setHoursPerWeek("");
  }, [method]);

  // Calculations
  const numM1 = parseFloat(m1) || 0;
  const numM2 = parseFloat(m2) || 0;
  const numM3 = parseFloat(m3) || 0;
  const numHoursPerWeek = parseFloat(hoursPerWeek) || 0;
  const numImpactHours = parseFloat(impactHours) || 0;

  const avgMonthlyAmount = (numM1 + numM2 + numM3) / 3;
  const monthlyHours = numHoursPerWeek * 4;
  
  const hourlyValue = monthlyHours > 0 ? avgMonthlyAmount / monthlyHours : 0;
  const estimatedImpactValue = numImpactHours * hourlyValue;

  const methodInfo = {
    revenue: {
      title: "Revenue per Operating Hour",
      description: "Best for high-volume retail, e-commerce, or service businesses where every hour open correlates directly to revenue generation.",
      icon: TrendingUp,
      amountLabel: "Revenue",
      hoursLabel: "Hours Open Per Week"
    },
    profit: {
      title: "Profit per Operating Hour",
      description: "Focuses on bottom-line efficiency. Useful for understanding how much actual profit each hour of operation contributes.",
      icon: DollarSign,
      amountLabel: "Profit",
      hoursLabel: "Hours Open Per Week"
    },
    replacement: {
      title: "Owner Replacement Value",
      description: "Calculates the value of the owner's time based on business performance. Critical for founders looking to outsource or delegate tasks.",
      icon: UserPlus,
      amountLabel: basisType === "revenue" ? "Revenue" : "Profit",
      hoursLabel: "Owner Hours Worked Per Week"
    }
  };

  const currentInfo = methodInfo[method];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[color:var(--im-navy)] text-white shadow-sm">
            <Calculator className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--im-navy)]">Value Calculator</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Estimate the financial value of time to make data-driven decisions about delegation, automation, and efficiency.
        </p>
      </div>

      <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-slate-50/50 pb-6">
          <CardTitle className="text-lg">Select Calculation Method</CardTitle>
          <RadioGroup 
            value={method} 
            onValueChange={(v) => setMethod(v as CalcMethod)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
          >
            {Object.entries(methodInfo).map(([key, info]) => (
              <Label
                key={key}
                className={cn(
                  "flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-white p-4 hover:bg-slate-50 transition-all cursor-pointer",
                  method === key && "border-[color:var(--im-secondary)] bg-indigo-50/30 ring-1 ring-[color:var(--im-secondary)]/20 shadow-sm"
                )}
              >
                <RadioGroupItem value={key} className="sr-only" />
                <info.icon className={cn("h-6 w-6 mb-2", method === key ? "text-[color:var(--im-secondary)]" : "text-muted-foreground")} />
                <span className="text-xs font-bold text-center leading-tight">{info.title}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Inputs Section */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-[color:var(--im-navy)] flex items-center gap-2">
                  <currentInfo.icon className="h-4 w-4" />
                  {currentInfo.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentInfo.description}
                </p>
              </div>

              {method === "replacement" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Basis Type</Label>
                  <Select value={basisType} onValueChange={(v: any) => setBasisType(v)}>
                    <SelectTrigger className="rounded-xl border-border/60 bg-white">
                      <SelectValue placeholder="Select basis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Basis</SelectItem>
                      <SelectItem value="profit">Profit Basis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month 1 {currentInfo.amountLabel}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      className="pl-8 rounded-xl border-border/60 bg-white"
                      value={m1}
                      onChange={(e) => setM1(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month 2 {currentInfo.amountLabel}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      className="pl-8 rounded-xl border-border/60 bg-white"
                      value={m2}
                      onChange={(e) => setM2(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month 3 {currentInfo.amountLabel}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      className="pl-8 rounded-xl border-border/60 bg-white"
                      value={m3}
                      onChange={(e) => setM3(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{currentInfo.hoursLabel}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="e.g. 40"
                      className="pl-8 rounded-xl border-border/60 bg-white"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex flex-col">
              <div className="p-6 rounded-3xl bg-[color:var(--im-bg)] border border-border/40 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-border/40">
                    <div className="text-xs font-bold text-[color:var(--im-secondary)] uppercase tracking-widest mb-1">Estimated Hourly Value</div>
                    <div className="text-4xl font-black text-[color:var(--im-navy)]">
                      {formatCurrency(hourlyValue)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">Per Operating Hour</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Avg. Monthly {currentInfo.amountLabel}</span>
                      <span className="font-bold text-[color:var(--im-navy)]">{formatCurrency(avgMonthlyAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Monthly Hours Tracked</span>
                      <span className="font-bold text-[color:var(--im-navy)]">{formatNumber(monthlyHours)}h</span>
                    </div>
                  </div>

                  {/* Enhanced Impact Snapshot */}
                  <div className="p-5 rounded-2xl bg-white/80 border border-indigo-100/60 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[color:var(--im-navy)] uppercase tracking-widest">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        Impact Snapshot
                      </div>
                      <div className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        Efficiency Gain
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Hours Saved Per Month</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input 
                            type="number"
                            className="pl-8 h-9 text-sm font-bold border-indigo-100 focus:ring-indigo-500 rounded-xl bg-white/50"
                            value={impactHours}
                            onChange={(e) => setImpactHours(e.target.value)}
                            placeholder="Hours..."
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-indigo-50">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Saving these hours frees up an estimated <span className="text-lg font-black text-[color:var(--im-navy)] block mt-1">{formatCurrency(estimatedImpactValue)}</span> in monthly business value.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-4">
                  <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    These figures are estimates for strategic planning, not official accounting or tax metrics. 
                    They help visualize the opportunity cost and efficiency potential of your business operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-border/40 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[color:var(--im-navy)]">Why this matters?</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Knowing your hourly value allows you to objectively decide if a task should be delegated. 
            If a task costs $25/hr to outsource but your time is worth $150/hr, delegation is a mathematical win.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-border/40 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[color:var(--im-navy)]">Which method to use?</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Revenue basis is best for growth focus. Profit basis is best for efficiency focus. 
            Owner Replacement is best for founders looking to step out of daily operations.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-border/40 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[color:var(--im-navy)]">The "4x" Multiplier</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We calculate monthly hours by multiplying weekly hours by 4. While some months have more weeks, 
            this creates a consistent baseline for relative performance comparison.
          </p>
        </div>
      </div>
    </div>
  );
}