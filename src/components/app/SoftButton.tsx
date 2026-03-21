import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SoftButton({ className, ...props }: ButtonProps) {
  return <Button variant="soft" {...props} className={cn("rounded-2xl", className)} />;
}

export function SoftIconButton({ className, ...props }: ButtonProps) {
  return <Button variant="soft" {...props} className={cn("rounded-2xl", className)} />;
}
