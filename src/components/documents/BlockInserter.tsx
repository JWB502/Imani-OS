import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlashMenu } from "@/components/documents/SlashMenu";
import type { DocumentBlockType } from "@/types/imani";

export function BlockInserter({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: DocumentBlockType) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-border/70" />
      <SlashMenu
        open={open}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-2xl border-dashed bg-white/90 shadow-sm"
            aria-label="Insert block"
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}
