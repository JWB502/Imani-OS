import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

import { AppLayout } from "@/components/app/AppLayout";
import { RequireAuth } from "@/components/app/RequireAuth";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Reports from "@/pages/Reports";
import ReportBuilder from "@/pages/ReportBuilder";
import Templates from "@/pages/Templates";
import SectionTemplateEditor from "@/pages/SectionTemplateEditor";
import FullTemplateBuilder from "@/pages/FullTemplateBuilder";
import RoiDashboard from "@/pages/RoiDashboard";
import Wins from "@/pages/Wins";
import Impact from "@/pages/Impact";
import ValueCalculator from "@/pages/ValueCalculator";
import AgencyHq from "@/pages/AgencyHq";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SettingsProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />

                <Route
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/new" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />

                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/new" element={<Reports />} />
                  <Route path="/reports/:id" element={<ReportBuilder />} />

                  <Route path="/templates" element={<Templates />} />
                  <Route
                    path="/templates/sections/:id"
                    element={<SectionTemplateEditor />}
                  />
                  <Route
                    path="/templates/full/:id"
                    element={<FullTemplateBuilder />}
                  />

                  <Route path="/roi" element={<RoiDashboard />} />
                  <Route path="/wins" element={<Wins />} />
                  <Route path="/impact" element={<Impact />} />
                  <Route path="/calculator" element={<ValueCalculator />} />
                  <Route path="/hq" element={<AgencyHq />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;