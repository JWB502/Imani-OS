import * as React from "react";
import { ChevronRight, FilePlus2, FolderTree, GripVertical, PanelLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { flattenDocumentPages } from "@/lib/documentTree";
import type { DocumentPage } from "@/types/imani";

function PageList({
  pages,
  selectedPageId,
  onSelect,
  onAddPage,
  onMove,
}: {
  pages: DocumentPage[];
  selectedPageId?: string;
  onSelect: (pageId: string) => void;
  onAddPage: (parentId: string | null) => void;
  onMove: (pageId: string, direction: "up" | "down") => void;
}) {
  const flattened = flattenDocumentPages(pages);

  return (
    <div className="space-y-2">
      <Button className="h-11 w-full justify-start rounded-2xl" onClick={() => onAddPage(null)}>
        <Plus className="mr-2 h-4 w-4" /> New top-level page
      </Button>
      <div className="space-y-1">
        {flattened.map((page) => (
          <div key={page.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(page.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                selectedPageId === page.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/80 text-foreground hover:bg-muted/70",
              )}
              style={{ paddingLeft: `${page.depth * 18 + 12}px` }}
            >
              <ChevronRight className={cn("h-4 w-4 shrink-0", page.depth > 0 && "opacity-60")} />
              <span className="truncate text-sm font-medium">{page.icon ? `${page.icon} ${page.title}` : page.title}</span>
            </button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-2xl bg-white/80"
              onClick={() => onAddPage(page.id)}
              title="Add subpage"
            >
              <FilePlus2 className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onMove(page.id, "up")}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-muted-foreground hover:bg-white"
                aria-label="Move page up"
              >
                <GripVertical className="h-3 w-3 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => onMove(page.id, "down")}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-muted-foreground hover:bg-white"
                aria-label="Move page down"
              >
                <GripVertical className="h-3 w-3 -rotate-90" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentSidebarTree(props: {
  pages: DocumentPage[];
  selectedPageId?: string;
  onSelect: (pageId: string) => void;
  onAddPage: (parentId: string | null) => void;
  onMove: (pageId: string, direction: "up" | "down") => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-11 rounded-2xl bg-white/90">
            <PanelLeft className="mr-2 h-4 w-4" /> Pages
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[92vw] rounded-r-[32px] border-r-0 bg-background p-4 sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-left text-xl">
              <FolderTree className="h-5 w-5 text-primary" /> Page tree
            </SheetTitle>
          </SheetHeader>
          <PageList {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="space-y-4 rounded-[32px] border border-border/70 bg-white/75 p-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <FolderTree className="h-4 w-4 text-primary" /> Page tree
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Nested navigation with reorder controls and quick subpage creation.</div>
      </div>
      <PageList {...props} />
    </div>
  );
}
