import * as React from "react";
import { CheckSquare, ChevronDown, Heading2, Image, LayoutGrid, LineChart, ListChecks, Minus, PanelsTopLeft, TableProperties, Text, TriangleAlert } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DocumentBlockType } from "@/types/imani";

export const blockTypeOptions: Array<{
  type: DocumentBlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "paragraph", label: "Paragraph", description: "Body copy with rich text", icon: Text },
  { type: "heading", label: "Heading", description: "Section or sub-section heading", icon: Heading2 },
  { type: "toggle", label: "Toggle", description: "Collapsible notes or details", icon: ChevronDown },
  { type: "callout", label: "Callout", description: "Highlight key guidance or migration notes", icon: TriangleAlert },
  { type: "checklist", label: "Checklist", description: "Track tasks or review items", icon: CheckSquare },
  { type: "status", label: "Status", description: "Select current state or category", icon: PanelsTopLeft },
  { type: "score", label: "Score", description: "Scored assessment with note", icon: LineChart },
  { type: "progress", label: "Progress", description: "Percent-based progress bar", icon: ListChecks },
  { type: "kpiGrid", label: "KPI grid", description: "Small metric cards for headlines", icon: LayoutGrid },
  { type: "table", label: "Database table", description: "Simple table-driven content", icon: TableProperties },
  { type: "media", label: "Image / media", description: "Screenshots, charts, and visual proof", icon: Image },
  { type: "divider", label: "Divider", description: "Visual separation between ideas", icon: Minus },
];

export function SlashMenu({
  open,
  onOpenChange,
  onSelect,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: DocumentBlockType) => void;
  trigger: React.ReactNode;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[320px] rounded-3xl p-0" align="start">
        <Command className="rounded-3xl">
          <CommandInput placeholder="Type a block or use / search…" />
          <CommandList>
            <CommandEmpty>No block found.</CommandEmpty>
            <CommandGroup heading="Insert block">
              {blockTypeOptions.map((option) => (
                <CommandItem
                  key={option.type}
                  value={`${option.label} ${option.description}`}
                  onSelect={() => {
                    onSelect(option.type);
                    onOpenChange(false);
                  }}
                  className="mx-2 rounded-2xl px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-primary/10 p-2 text-primary">
                      <option.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SlashMenuButton({ onSelect, label = "Add block" }: { onSelect: (type: DocumentBlockType) => void; label?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SlashMenu
      open={open}
      onOpenChange={setOpen}
      onSelect={onSelect}
      trigger={
        <Button variant="outline" className="h-10 rounded-2xl border-dashed bg-white/80">
          / {label}
        </Button>
      }
    />
  );
}
