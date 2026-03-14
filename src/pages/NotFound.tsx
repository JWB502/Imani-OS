import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-svh bg-[color:var(--im-bg)] text-foreground">
      <div className="mx-auto flex min-h-svh max-w-xl items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border/70 bg-white/70 p-8 text-center shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Imani OS</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page doesn't exist.
          </p>
          <Button asChild className="mt-6 rounded-2xl">
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;