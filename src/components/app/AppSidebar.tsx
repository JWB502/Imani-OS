import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/app/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/templates", label: "Templates", icon: Tags },
  { to: "/roi", label: "ROI Tracking", icon: TrendingUp },
  { to: "/wins", label: "Wins", icon: Sparkles },
  { to: "/impact", label: "Agency Impact", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border">
      <SidebarHeader className="p-4">
        <BrandMark />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "rounded-xl px-3 py-2.5 text-sm transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="text-xs text-sidebar-foreground/70">Signed in</div>
          <div className="mt-0.5 text-sm font-medium leading-tight">
            {user?.name ?? "—"}
          </div>
          <div className="text-xs text-sidebar-foreground/70">{user?.email}</div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full rounded-xl bg-white/10 text-sidebar-foreground hover:bg-white/15"
            onClick={logout}
          >
            Log out
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
