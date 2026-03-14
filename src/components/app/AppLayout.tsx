import * as React from "react";
import { Outlet } from "react-router-dom";
import { Bell, Search } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SoftIconButton } from "@/components/app/SoftButton";

export function AppLayout() {
  const [query, setQuery] = React.useState("");

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 md:px-6">
            <SidebarTrigger className="rounded-xl" />
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients, reports, templates, wins…"
                className="h-10 rounded-2xl border-border/70 bg-white/70 pl-9 shadow-sm focus-visible:ring-primary/30"
              />
            </div>
            <SoftIconButton
              size="icon"
              className="h-10 w-10 rounded-2xl"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </SoftIconButton>
          </div>
          <div className="px-4 pb-3 text-xs text-muted-foreground md:px-6">
            Tip: Use <span className="font-medium">Ctrl/Cmd + B</span> to toggle the sidebar.
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet context={{ globalSearchQuery: query }} />
        </main>
      </div>
    </SidebarProvider>
  );
}

export type AppLayoutOutletContext = { globalSearchQuery: string };