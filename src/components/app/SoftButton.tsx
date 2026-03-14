import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SoftButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      {...props}
      className={cn(
        "rounded-2xl border-border/70 bg-white/80 text-[color:var(--im-navy)] shadow-sm",
        "hover:border-[color:var(--im-secondary)] hover:bg-[color:var(--im-secondary)] hover:text-white",
        className,
      )}
    />
  );
}

export function SoftIconButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      {...props}
      className={cn(
        "rounded-2xl border-border/70 bg-white/80 text-[color:var(--im-navy)] shadow-sm",
        "hover:border-[color:var(--im-secondary)] hover:bg-[color:var(--im-secondary)] hover:text-white",
        className,
      )}
    />
  );
}
