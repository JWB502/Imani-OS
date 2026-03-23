import * as React from "react";
import {
  Building2,
  Calendar,
  DollarSign,
  Globe,
  MapPin,
  Plus,
  Package,
  Calculator,
  Target,
  Users as UsersIcon,
  Trash2,
  Settings2,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  BarChart3,
  GraduationCap,
  Award,
  FileText,
  Upload,
} from "lucide-react";

import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn, fileToBase64 } from "@/lib/utils";
import { runOpenAiChat } from "@/lib/ai";
import type { AgencyProduct, ProductType, PricingModel, AgencyExpense, BillingCycle, ExpenseCategory, KeyPerson } from "@/types/imani";

export default function AgencyHq() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const {
    data,
    updateAgencyOverview,
    upsertAgencyProduct,
    deleteAgencyProduct,
    upsertAgencyExpense,
    deleteAgencyExpense,
    upsertKeyPerson,
    deleteKeyPerson,
    updateAgencyAnnualProfitGoal
  } = useData();
  
  const hq = data.agencyHq;

  // Overview Form State
  const [isOverviewEditing, setIsOverviewEditing] = React.useState(false);
  const [overviewDraft, setOverviewDraft] = React.useState(hq?.overview || {
    name: "",
    description: "",
    location: { city: "", state: "", country: "" },
    websiteUrl: "",
    foundingDate: "",
    employeeCount: 0,
    annualMarketingBudget: 0,
  });

  React.useEffect(() => {
    if (hq?.overview) {
      setOverviewDraft(hq.overview);
    }
  }, [hq?.overview]);

  const handleOverviewSave = () => {
    updateAgencyOverview(overviewDraft);
    setIsOverviewEditing(false);
  };

  const isOverviewEmpty = !hq?.overview?.name;

  // Revenue Calculations
  const recurringProducts = React.useMemo(() => {
    return (hq?.products || []).filter(p => p.pricingModel !== 'one-time');
  }, [hq?.products]);

  const calculateMonthlyRevenue = (p: AgencyProduct) => {
    const active = p.activeClients || 0;
    if (p.pricingModel === 'monthly') return p.price * active;
    if (p.pricingModel === 'quarterly') return (p.price / 3) * active;
    if (p.pricingModel === 'semi-annually') return (p.price / 6) * active;
    if (p.pricingModel === 'annually') return (p.price / 12) * active;
    return 0;
  };

  const calculateAnnualRevenue = (p: AgencyProduct) => {
    return calculateMonthlyRevenue(p) * 12;
  };

  const mrr = recurringProducts.reduce((sum, p) => sum + calculateMonthlyRevenue(p), 0);
  const arr = mrr * 12;

  // Expense Calculations
  const calculateMonthlyExpense = (e: AgencyExpense) => {
    if (e.billingCycle === 'monthly') return e.cost;
    if (e.billingCycle === 'quarterly') return e.cost / 3;
    if (e.billingCycle === 'semi-annually') return e.cost / 6;
    if (e.billingCycle === 'annually') return e.cost / 12;
    return 0;
  };

  const monthlyExpensesTotal = (hq?.expenses || []).reduce((sum, e) => sum + calculateMonthlyExpense(e), 0);
  const annualExpensesTotal = monthlyExpensesTotal * 12;

  const monthlyProfit = mrr - monthlyExpensesTotal;
  const annualProfit = arr - annualExpensesTotal;

  // Projections Calculations
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [aiInsights, setAiInsights] = React.useState<string | null>(null);

  const projectedRevenue = (hq?.products || []).reduce((sum, p) => {
    const projected = p.projectedSales || 0;
    let annualValue = 0;
    if (p.pricingModel === 'one-time') annualValue = p.price * projected;
    else if (p.pricingModel === 'monthly') annualValue = p.price * 12 * projected;
    else if (p.pricingModel === 'quarterly') annualValue = p.price * 4 * projected;
    else if (p.pricingModel === 'semi-annually') annualValue = p.price * 2 * projected;
    else if (p.pricingModel === 'annually') annualValue = p.price * projected;
    return sum + annualValue;
  }, 0);

  const projectedProfit = projectedRevenue - annualExpensesTotal;
  const profitGoal = hq?.annualProfitGoal || 0;
  const progressToGoal = profitGoal > 0 ? (projectedProfit / profitGoal) * 100 : 0;

  const handleGenerateAi = async () => {
    if (!settings.openAiApiKey && !settings.openRouterApiKey) {
      toast({ 
        title: "API Key Missing", 
        description: "Please configure your OpenAI or OpenRouter API key in Settings.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAi(true);
    try {
      // Compile holistic data for strategic analysis
      const contextData = {
        agency: {
          name: hq?.overview.name,
          description: hq?.overview.description,
          goals: { targetProfit: profitGoal, projectedProfit },
          mrr: mrr,
          arr: arr,
          teamSize: hq?.overview.employeeCount
        },
        offerings: hq?.products.map(p => ({
          name: p.name,
          price: p.price,
          model: p.pricingModel,
          active: p.activeClients,
          projected: p.projectedSales
        })),
        expenses: hq?.expenses.map(e => ({
          name: e.name,
          cost: e.cost,
          cycle: e.billingCycle,
          category: e.category
        })),
        wins: data.wins.slice(0, 10).map(w => ({
          title: w.title,
          category: w.category,
          result: w.measurableResult
        })),
        activeCampaigns: data.campaigns.slice(0, 5).map(c => ({
          channel: c.channel,
          spend: c.adSpend,
          income: c.income
        }))
      };

      const systemPrompt = "You are a world-class Strategic Agency Advisor. You provide actionable, data-driven insights to agency owners based on their revenue, operations, personnel, and recent successes.";
      const userPrompt = `
        Analyze my agency footprint and provide 3-4 specific strategic insights.
        
        Current Status:
        - Annual Profit Goal: ${formatCurrency(profitGoal)}
        - Projected Annual Profit: ${formatCurrency(projectedProfit)}
        - Monthly Recurring Revenue (MRR): ${formatCurrency(mrr)}
        - Total Monthly Expenses: ${formatCurrency(monthlyExpensesTotal)}
        
        Agency Data Context:
        ${JSON.stringify(contextData, null, 2)}
        
        Provide your response as a professional advisor. Focus on:
        1. Leverage: Which of my products/services are the most scalable?
        2. Efficiency: Where can I optimize costs based on my expense categories?
        3. Momentum: How can I use my recent "Wins" to increase my prices or acquire better clients?
        4. Growth: A specific recommendation to hit my 100% profit goal.
      `;

      const result = await runOpenAiChat({
        apiKey: (settings.aiProvider === "openai" ? settings.openAiApiKey : settings.openRouterApiKey) || "",
        model: settings.openAiModel,
        provider: settings.aiProvider,
        system: systemPrompt,
        user: userPrompt
      });

      setAiInsights(result);
    } catch (error: any) {
      toast({ 
        title: "Analysis Failed", 
        description: error.message || "An unexpected error occurred during analysis.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const [goalDraft, setGoalDraft] = React.useState(String(hq?.annualProfitGoal || ""));

  const handleSetGoal = () => {
    const val = parseFloat(goalDraft) || 0;
    updateAgencyAnnualProfitGoal(val);
    toast({ title: "Profit goal updated." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--im-navy)]">Agency HQ</h1>
          <p className="text-muted-foreground">Manage your agency profile, personnel, offerings, and strategic growth.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/50 p-1 rounded-2xl shadow-sm border border-border/50 flex flex-wrap w-full md:w-auto h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap flex-1 md:flex-initial md:min-w-[140px] md:max-w-[calc(20%-4px)]">
            <Building2 className="h-4 w-4" />
            Agency Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap flex-1 md:flex-initial md:min-w-[140px] md:max-w-[calc(20%-4px)]">
            <Package className="h-4 w-4" />
            Products/Services
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap flex-1 md:flex-initial md:min-w-[140px] md:max-w-[calc(20%-4px)]">
            <DollarSign className="h-4 w-4" />
            Recurring Expenses
          </TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap flex-1 md:flex-initial md:min-w-[140px] md:max-w-[calc(20%-4px)]">
            <Calculator className="h-4 w-4" />
            Recurring Revenue
          </TabsTrigger>
          <TabsTrigger value="goal" className="rounded-xl px-4 py-2 gap-2 whitespace-nowrap flex-1 md:flex-initial md:min-w-[140px] md:max-w-[calc(20%-4px)]">
            <Target className="h-4 w-4" />
            Goal & Projection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {isOverviewEmpty && !isOverviewEditing ? (
            <Card className="rounded-3xl border-dashed border-2 bg-white/40 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mb-2">Complete your Agency Profile</CardTitle>
              <CardDescription className="max-w-md mb-6">
                Start by adding your agency details to unlock the full potential of Agency HQ and AI-powered insights.
              </CardDescription>
              <Button onClick={() => setIsOverviewEditing(true)} className="rounded-2xl px-8">
                Setup Agency HQ
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2 rounded-3xl shadow-sm border-border/50 bg-white/70 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Agency Details</CardTitle>
                      <CardDescription>General information about your company.</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl"
                      onClick={() => setIsOverviewEditing(!isOverviewEditing)}
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      {isOverviewEditing ? "Cancel" : "Edit Details"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isOverviewEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Agency Name</Label>
                          <Input 
                            id="name" 
                            value={overviewDraft.name} 
                            onChange={e => setOverviewDraft({...overviewDraft, name: e.target.value})}
                            placeholder="e.g. Acme Marketing"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website URL</Label>
                          <Input 
                            id="website" 
                            value={overviewDraft.websiteUrl} 
                            onChange={e => setOverviewDraft({...overviewDraft, websiteUrl: e.target.value})}
                            placeholder="https://example.com"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="desc">Brief Description</Label>
                        <Textarea 
                          id="desc" 
                          value={overviewDraft.description} 
                          onChange={e => setOverviewDraft({...overviewDraft, description: e.target.value})}
                          placeholder="What does your agency specialize in?"
                          className="rounded-xl min-h-[100px]"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city" 
                            value={overviewDraft.location.city} 
                            onChange={e => setOverviewDraft({
                              ...overviewDraft, 
                              location: {...overviewDraft.location, city: e.target.value}
                            })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Prov</Label>
                          <Input 
                            id="state" 
                            value={overviewDraft.location.state} 
                            onChange={e => setOverviewDraft({
                              ...overviewDraft, 
                              location: {...overviewDraft.location, state: e.target.value}
                            })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country" 
                            value={overviewDraft.location.country} 
                            onChange={e => setOverviewDraft({
                              ...overviewDraft, 
                              location: {...overviewDraft.location, country: e.target.value}
                            })}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="founding">Founding Date</Label>
                          <Input 
                            id="founding" 
                            type="date"
                            value={overviewDraft.foundingDate} 
                            onChange={e => setOverviewDraft({...overviewDraft, foundingDate: e.target.value})}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employees">Employee Count</Label>
                          <Input 
                            id="employees" 
                            type="number"
                            value={overviewDraft.employeeCount} 
                            onChange={e => setOverviewDraft({...overviewDraft, employeeCount: parseInt(e.target.value) || 0})}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Annual Marketing Budget</Label>
                          <Input 
                            id="budget" 
                            type="number"
                            value={overviewDraft.annualMarketingBudget} 
                            onChange={e => setOverviewDraft({...overviewDraft, annualMarketingBudget: parseFloat(e.target.value) || 0})}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button onClick={handleOverviewSave} className="rounded-2xl px-8 shadow-md">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-[color:var(--im-navy)] mb-2">{hq?.overview.name}</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{hq?.overview.description}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{hq?.overview.location.city}, {hq?.overview.location.state}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            <a href={hq?.overview.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {hq?.overview.websiteUrl.replace(/^https?:\/\//, '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Founding Date</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{hq?.overview.foundingDate || '—'}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Size</div>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-primary" />
                            <span>{hq?.overview.employeeCount} Employees</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marketing Budget</div>
                          <div className="flex items-center gap-2 text-emerald-700 font-medium">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(hq?.overview.annualMarketingBudget || 0)}/yr</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-3xl shadow-sm border-border/50 bg-white/70 overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-base">Quick Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Offerings</span>
                      <span className="font-semibold">{hq?.products.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Monthly Cost</span>
                      <span className="font-semibold text-rose-600">
                        {formatCurrency(hq?.expenses.reduce((sum, e) => {
                          if (e.billingCycle === 'monthly') return sum + e.cost;
                          if (e.billingCycle === 'quarterly') return sum + (e.cost / 3);
                          if (e.billingCycle === 'semi-annually') return sum + (e.cost / 6);
                          if (e.billingCycle === 'annually') return sum + (e.cost / 12);
                          return sum;
                        }, 0) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-4">
                      <span className="text-muted-foreground">App Version</span>
                      <Badge variant="outline" className="rounded-lg">v1.4.2</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Key Personnel Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[color:var(--im-navy)]">Key Personnel</h3>
                <p className="text-sm text-muted-foreground">Manage details for founders and executive team members.</p>
              </div>
              <PersonnelDialog onSave={upsertKeyPerson} />
            </div>

            {!hq?.keyPersonnel?.length ? (
              <Card className="rounded-3xl border-dashed border-2 bg-white/40 flex flex-col items-center justify-center p-12 text-center">
                <UsersIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <CardTitle className="text-base mb-1">No personnel listed</CardTitle>
                <CardDescription className="mb-6">Add your leadership team to complete your agency profile.</CardDescription>
                <PersonnelDialog onSave={upsertKeyPerson} trigger={
                  <Button variant="outline" className="rounded-xl">Add Leadership Member</Button>
                } />
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hq.keyPersonnel.map(person => (
                  <Card key={person.id} className="rounded-3xl shadow-sm border-border/50 bg-white/70 hover:shadow-md transition-shadow group overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="rounded-lg mb-2">
                          {person.role}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PersonnelDialog 
                            person={person} 
                            onSave={upsertKeyPerson} 
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600"
                            onClick={() => {
                              if(confirm(`Remove ${person.name} from personnel?`)) {
                                deleteKeyPerson(person.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{person.name}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{person.bio}"</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/40">
                        {person.education && (
                          <div className="flex items-center gap-2 text-xs">
                            <GraduationCap className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{person.education}</span>
                          </div>
                        )}
                        {person.certifications && (
                          <div className="flex items-center gap-2 text-xs">
                            <Award className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{person.certifications}</span>
                          </div>
                        )}
                      </div>
                      
                      {person.resumeData && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full rounded-xl gap-2 h-9 bg-white/50 hover:bg-white"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = person.resumeData!;
                            link.download = person.resumeFileName || `${person.name.replace(/\s+/g, '_')}_Resume.pdf`;
                            link.click();
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Download Resume
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Products & Services</h3>
              <p className="text-sm text-muted-foreground">Manage your core offerings and pricing models.</p>
            </div>
            <ProductDialog onSave={upsertAgencyProduct} />
          </div>

          {!hq?.products.length ? (
            <Card className="rounded-3xl border-dashed border-2 bg-white/40 flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-4" />
              <CardTitle className="text-base mb-1">No products or services yet</CardTitle>
              <CardDescription className="mb-6">Add your first offering to start tracking recurring revenue.</CardDescription>
              <ProductDialog onSave={upsertAgencyProduct} trigger={
                <Button variant="outline" className="rounded-xl">Add First Offering</Button>
              } />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hq.products.map(product => (
                <Card key={product.id} className="rounded-3xl shadow-sm border-border/50 bg-white/70 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="rounded-lg mb-2">
                        {product.type === 'service' ? 'Service' : 'Product'}
                      </Badge>
                      <div className="flex gap-1">
                        <ProductDialog 
                          product={product} 
                          onSave={upsertAgencyProduct} 
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600"
                          onClick={() => deleteAgencyProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mt-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Price</div>
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(product.price)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            / {product.pricingModel.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recurring Expenses</h3>
              <p className="text-sm text-muted-foreground">Track your agency software, payroll, and overhead costs.</p>
            </div>
            <ExpenseDialog onSave={upsertAgencyExpense} />
          </div>

          {!hq?.expenses.length ? (
            <Card className="rounded-3xl border-dashed border-2 bg-white/40 flex flex-col items-center justify-center p-12 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
              <CardTitle className="text-base mb-1">No expenses tracked</CardTitle>
              <CardDescription className="mb-6">Add your first expense to see your true agency profitability.</CardDescription>
              <ExpenseDialog onSave={upsertAgencyExpense} trigger={
                <Button variant="outline" className="rounded-xl">Add First Expense</Button>
              } />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hq.expenses.map(expense => (
                <Card key={expense.id} className="rounded-3xl shadow-sm border-border/50 bg-white/70 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="rounded-lg mb-2 bg-rose-50 text-rose-700 border-rose-100">
                        {expense.category}
                      </Badge>
                      <div className="flex gap-1">
                        <ExpenseDialog
                          expense={expense}
                          onSave={upsertAgencyExpense}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600"
                          onClick={() => deleteAgencyExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{expense.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{expense.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mt-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Cost</div>
                        <div className="text-xl font-bold text-rose-600">
                          {formatCurrency(expense.cost)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            / {expense.billingCycle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <CardDescription className="text-xs uppercase font-medium">MRR</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <CardDescription className="text-xs uppercase font-medium">ARR</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-primary">{formatCurrency(arr)}</div>
              </CardContent>
            </Card>
            <Card className={cn(
              "rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden",
              monthlyProfit < 0 ? "ring-1 ring-rose-500/20 bg-rose-50/30" : "ring-1 ring-emerald-500/20 bg-emerald-50/30"
            )}>
              <CardHeader className="p-4 pb-0">
                <CardDescription className="text-xs uppercase font-medium">Monthly Profit</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className={cn(
                  "text-2xl font-bold",
                  monthlyProfit < 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatCurrency(monthlyProfit)}
                </div>
              </CardContent>
            </Card>
            <Card className={cn(
              "rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden",
              annualProfit < 0 ? "ring-1 ring-rose-500/20 bg-rose-50/30" : "ring-1 ring-emerald-500/20 bg-emerald-50/30"
            )}>
              <CardHeader className="p-4 pb-0">
                <CardDescription className="text-xs uppercase font-medium">Annual Profit</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className={cn(
                  "text-2xl font-bold",
                  annualProfit < 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatCurrency(annualProfit)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl shadow-sm border-border/50 bg-white/70 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Recurring Revenue Breakdown</CardTitle>
              <CardDescription>All your non-one-time services and products are listed here.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="pl-6">Product/Service</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead className="w-[150px]">Active Clients</TableHead>
                    <TableHead>Monthly Value</TableHead>
                    <TableHead className="pr-6 text-right">Annual Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No recurring offerings found. Add some in the Products/Services tab.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recurringProducts.map(p => (
                      <TableRow key={p.id} className="border-border/40">
                        <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                        <TableCell>
                          {formatCurrency(p.price)}
                          <span className="text-muted-foreground text-xs ml-1">/ {p.pricingModel}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={p.activeClients}
                            onChange={e => upsertAgencyProduct({...p, activeClients: parseInt(e.target.value) || 0})}
                            className="h-8 rounded-lg w-24"
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatCurrency(calculateMonthlyRevenue(p))}
                        </TableCell>
                        <TableCell className="pr-6 text-right font-semibold text-primary">
                          {formatCurrency(calculateAnnualRevenue(p))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goal" className="space-y-8">
          {/* AI Strategic Analysis */}
          <Card className="rounded-3xl border-primary/20 bg-primary/5 overflow-hidden border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Strategic Advisor</CardTitle>
                  <CardDescription>Comprehensive insights based on holistic agency footprint, ROI impact, and wins.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center text-center py-8 px-6">
              {aiInsights ? (
                <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                  <div className="bg-white/80 rounded-2xl p-6 border border-primary/10 shadow-inner whitespace-pre-wrap leading-relaxed text-sm">
                    {aiInsights}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 rounded-xl" onClick={() => setAiInsights(null)}>
                      Clear Advisor Insights
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="h-8 w-8 text-primary/40" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[color:var(--im-navy)]">Consult your Strategic Advisor</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      The AI will analyze your <span className="font-bold text-primary">Key Wins</span>, <span className="font-bold text-primary">ROI data</span>, and <span className="font-bold text-primary">Offerings</span> to provide actionable growth and efficiency advice.
                    </p>
                  </div>
                  <Button
                    disabled={!hq?.annualProfitGoal || isGeneratingAi}
                    onClick={handleGenerateAi}
                    className="rounded-xl px-8 shadow-md gap-2"
                  >
                    {isGeneratingAi ? "Analyzing Portfolio..." : "Generate Analysis"}
                    {!isGeneratingAi && <Sparkles className="h-4 w-4" />}
                  </Button>
                  {!hq?.annualProfitGoal && (
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                      Set an annual profit goal below to enable AI analysis
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Annual Profit Goal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Annual Profit Goal</h3>
            <Card className="rounded-3xl shadow-sm border-border/50 bg-white/70 overflow-hidden p-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="profit-goal">Set Your Target Annual Profit</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profit-goal"
                        type="number"
                        value={goalDraft}
                        onChange={e => setGoalDraft(e.target.value)}
                        placeholder="e.g. 100000"
                        className="rounded-xl pl-9"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSetGoal} className="rounded-xl px-8 shadow-sm">Set Goal</Button>
                </div>

                {profitGoal > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Progress to Goal</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">{formatCurrency(projectedProfit)} / {formatCurrency(profitGoal)}</span>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100">
                        <div
                          style={{ width: `${Math.min(progressToGoal, 100)}%` }}
                          className={cn(
                            "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-in-out",
                            progressToGoal >= 100 ? "bg-emerald-500" : "bg-[color:var(--im-navy)]"
                          )}
                        />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm">
                        {Math.round(progressToGoal)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Scorecards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                <CardDescription className="text-xs uppercase font-medium">Projected Revenue</CardDescription>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-primary">{formatCurrency(projectedRevenue)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Based on projected sales</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                <CardDescription className="text-xs uppercase font-medium">Annual Expenses</CardDescription>
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(annualExpensesTotal)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Based on recurring costs</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl bg-white/70 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                <CardDescription className="text-xs uppercase font-medium">Projected Profit</CardDescription>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className={cn(
                  "text-2xl font-bold",
                  projectedProfit < 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {formatCurrency(projectedProfit)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Projected Revenue - Annual Expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Projections Table */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Sales Projections</h3>
              <p className="text-sm text-muted-foreground">Enter the projected number of clients or sales for each offering to calculate total projected revenue.</p>
            </div>
            <Card className="rounded-3xl shadow-sm border-border/50 bg-white/70 overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="pl-6">Service/Product</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead className="w-[150px]">Projected Sales</TableHead>
                      <TableHead className="pr-6 text-right">Projected Annual Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!hq?.products.length ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          No products or services found. Add some in the Products/Services tab.
                        </TableCell>
                      </TableRow>
                    ) : (
                      hq.products.map(p => {
                        let annualValue = 0;
                        const projected = p.projectedSales || 0;
                        if (p.pricingModel === 'one-time') annualValue = p.price * projected;
                        else if (p.pricingModel === 'monthly') annualValue = p.price * 12 * projected;
                        else if (p.pricingModel === 'quarterly') annualValue = p.price * 4 * projected;
                        else if (p.pricingModel === 'semi-annually') annualValue = p.price * 2 * projected;
                        else if (p.pricingModel === 'annually') annualValue = p.price * projected;

                        return (
                          <TableRow key={p.id} className="border-border/40">
                            <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                            <TableCell>
                              {formatCurrency(p.price)}
                              <span className="text-muted-foreground text-xs ml-1">/ {p.pricingModel}</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={p.projectedSales}
                                onChange={e => upsertAgencyProduct({...p, projectedSales: parseInt(e.target.value) || 0})}
                                className="h-8 rounded-lg w-24"
                              />
                            </TableCell>
                            <TableCell className="pr-6 text-right font-semibold text-primary">
                              {formatCurrency(annualValue)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PersonnelDialog({ person, onSave, trigger }: { person?: KeyPerson, onSave: (p: any) => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Omit<KeyPerson, 'id'>>({
    name: person?.name || "",
    role: person?.role || "",
    bio: person?.bio || "",
    education: person?.education || "",
    certifications: person?.certifications || "",
    resumeData: person?.resumeData || undefined,
    resumeFileName: person?.resumeFileName || undefined,
  });

  React.useEffect(() => {
    if (open && person) {
      setDraft({
        name: person.name,
        role: person.role,
        bio: person.bio,
        education: person.education,
        certifications: person.certifications,
        resumeData: person.resumeData,
        resumeFileName: person.resumeFileName,
      });
    }
  }, [open, person]);

  const handleSave = () => {
    onSave({
      ...draft,
      id: person?.id,
    });
    setOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setDraft({ ...draft, resumeData: base64, resumeFileName: file.name });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="rounded-xl gap-2 shadow-md"><Plus className="h-4 w-4" /> Add Member</Button>}
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-lg border-border/50 bg-white/95 backdrop-blur shadow-xl">
        <DialogHeader>
          <DialogTitle>{person ? "Edit Personnel" : "New Leadership Member"}</DialogTitle>
          <DialogDescription>
            Add a founder, executive, or key team member to the agency profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="per-name">Full Name</Label>
              <Input
                id="per-name"
                value={draft.name}
                onChange={e => setDraft({...draft, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="per-role">Role/Title</Label>
              <Input
                id="per-role"
                value={draft.role}
                onChange={e => setDraft({...draft, role: e.target.value})}
                placeholder="e.g. Founder & CEO"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="per-bio">Brief Bio</Label>
            <Textarea
              id="per-bio"
              value={draft.bio}
              onChange={e => setDraft({...draft, bio: e.target.value})}
              placeholder="A short professional overview..."
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="per-edu">Education</Label>
              <Input
                id="per-edu"
                value={draft.education}
                onChange={e => setDraft({...draft, education: e.target.value})}
                placeholder="e.g. MBA, Stanford"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="per-cert">Certifications</Label>
              <Input
                id="per-cert"
                value={draft.certifications}
                onChange={e => setDraft({...draft, certifications: e.target.value})}
                placeholder="e.g. Google Ads Expert"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Resume / CV (PDF or Image)</Label>
            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl gap-2 w-full border-dashed"
                onClick={() => document.getElementById('per-resume')?.click()}
              >
                <Upload className="h-4 w-4" />
                {draft.resumeFileName ? "Replace Resume" : "Upload Resume"}
              </Button>
              <input 
                id="per-resume" 
                type="file" 
                className="hidden" 
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
            </div>
            {draft.resumeFileName && (
              <p className="text-[10px] text-primary font-medium flex items-center gap-1 pl-1">
                <FileText className="h-3 w-3" />
                {draft.resumeFileName}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={handleSave} disabled={!draft.name || !draft.role}>Save Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseDialog({ expense, onSave, trigger }: { expense?: AgencyExpense, onSave: (e: any) => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Omit<AgencyExpense, 'id'>>({
    name: expense?.name || "",
    description: expense?.description || "",
    category: expense?.category || "Software/SaaS",
    billingCycle: expense?.billingCycle || "monthly",
    cost: expense?.cost || 0,
  });

  React.useEffect(() => {
    if (open && expense) {
      setDraft({
        name: expense.name,
        description: expense.description,
        category: expense.category,
        billingCycle: expense.billingCycle,
        cost: expense.cost,
      });
    }
  }, [open, expense]);

  const handleSave = () => {
    onSave({
      ...draft,
      id: expense?.id,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="rounded-xl gap-2 shadow-md"><Plus className="h-4 w-4" /> Add Expense</Button>}
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-lg border-border/50 bg-white/95 backdrop-blur shadow-xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "New Agency Expense"}</DialogTitle>
          <DialogDescription>
            Track costs like software, tools, and recurring overhead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exp-name">Expense Name</Label>
            <Input
              id="exp-name"
              value={draft.name}
              onChange={e => setDraft({...draft, name: e.target.value})}
              placeholder="e.g. Slack, Office Rent"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-desc">Description (Optional)</Label>
            <Textarea
              id="exp-desc"
              value={draft.description}
              onChange={e => setDraft({...draft, description: e.target.value})}
              placeholder="What is this expense for?"
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v: ExpenseCategory) => setDraft({...draft, category: v})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software/SaaS">Software/SaaS</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Rent/Office">Rent/Office</SelectItem>
                  <SelectItem value="Taxes">Taxes</SelectItem>
                  <SelectItem value="Legal/Professional">Legal/Professional</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                value={draft.billingCycle}
                onValueChange={(v: BillingCycle) => setDraft({...draft, billingCycle: v})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-cost">Cost ($)</Label>
            <Input
              id="exp-cost"
              type="number"
              value={draft.cost}
              onChange={e => setDraft({...draft, cost: parseFloat(e.target.value) || 0})}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={handleSave}>Save Expense</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product, onSave, trigger }: { product?: AgencyProduct, onSave: (p: any) => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Omit<AgencyProduct, 'id' | 'activeClients' | 'projectedSales'>>({
    name: product?.name || "",
    description: product?.description || "",
    type: product?.type || "service",
    pricingModel: product?.pricingModel || "monthly",
    price: product?.price || 0,
  });

  React.useEffect(() => {
    if (open && product) {
      setDraft({
        name: product.name,
        description: product.description,
        type: product.type,
        pricingModel: product.pricingModel,
        price: product.price,
      });
    }
  }, [open, product]);

  const handleSave = () => {
    onSave({
      ...draft,
      id: product?.id,
      activeClients: product?.activeClients || 0,
      projectedSales: product?.projectedSales || 0,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="rounded-xl gap-2 shadow-md"><Plus className="h-4 w-4" /> Add Offering</Button>}
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-lg border-border/50 bg-white/95 backdrop-blur shadow-xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Offering" : "New Product or Service"}</DialogTitle>
          <DialogDescription>
            Define your offering details and pricing model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Name</Label>
            <Input 
              id="prod-name" 
              value={draft.name} 
              onChange={e => setDraft({...draft, name: e.target.value})}
              placeholder="e.g. SEO Audit"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-desc">Description</Label>
            <Textarea 
              id="prod-desc" 
              value={draft.description} 
              onChange={e => setDraft({...draft, description: e.target.value})}
              placeholder="What is included in this offering?"
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={draft.type} 
                onValueChange={(v: ProductType) => setDraft({...draft, type: v})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select 
                value={draft.pricingModel} 
                onValueChange={(v: PricingModel) => setDraft({...draft, pricingModel: v})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annually">Semi-annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-price">Price ($)</Label>
            <Input 
              id="prod-price" 
              type="number"
              value={draft.price} 
              onChange={e => setDraft({...draft, price: parseFloat(e.target.value) || 0})}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={handleSave}>Save Offering</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}