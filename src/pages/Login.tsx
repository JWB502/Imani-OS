import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { BrandMark } from "@/components/app/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/imani";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [name, setName] = React.useState("Imani Team");
  const [email, setEmail] = React.useState("team@imaniadvantage.com");
  const [role, setRole] = React.useState<UserRole>("admin");

  React.useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const from = location?.state?.from ?? "/dashboard";

  return (
    <div className="min-h-svh bg-[color:var(--im-bg)] text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-3xl bg-[color:var(--im-navy)] p-5 shadow-[0_10px_30px_rgba(0,17,41,0.25)] ring-1 ring-white/10">
              <BrandMark className="text-white" />
            </div>
          </div>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-[0_12px_30px_rgba(3,17,17,0.10)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
              <CardDescription className="text-base">
                Internal access for Imani Advantage team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  login({ name, email, role });
                  navigate(from, { replace: true });
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-2xl bg-white/80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-2xl bg-white/80"
                    type="email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="h-11 rounded-2xl bg-white/80">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin / Owner</SelectItem>
                      <SelectItem value="editor">Team Member / Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="h-11 rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Enter Imani OS
                </Button>

                <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-sm text-white/85 ring-1 ring-white/10">
                  <div className="font-medium text-white">No public accounts</div>
                  <div className="mt-1">
                    This is an internal operations system — access is managed by your team.
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Tip: Add your OpenAI API key in Settings to enable AI drafting.
          </div>
        </div>
      </div>
    </div>
  );
}
