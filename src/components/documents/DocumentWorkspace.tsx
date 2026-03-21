import * as React from "react";

import { DocumentPageEditor } from "@/components/documents/DocumentPageEditor";
import { DocumentSidebarTree } from "@/components/documents/DocumentSidebarTree";
import { createDocumentPage, flattenDocumentPages, getChildPages, moveItem, normalizePageOrders } from "@/lib/documentTree";
import type { DocumentPage, DocumentTemplate } from "@/types/imani";

export function DocumentWorkspace({
  pages,
  onChangePages,
  reusableFragments,
  topSlot,
}: {
  pages: DocumentPage[];
  onChangePages: (pages: DocumentPage[]) => void;
  reusableFragments: DocumentTemplate[];
  topSlot?: React.ReactNode;
}) {
  const flattened = React.useMemo(() => flattenDocumentPages(pages), [pages]);
  const [selectedPageId, setSelectedPageId] = React.useState<string | undefined>(flattened[0]?.id);

  React.useEffect(() => {
    if (!selectedPageId && flattened[0]) setSelectedPageId(flattened[0].id);
    if (selectedPageId && !pages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(flattened[0]?.id);
    }
  }, [flattened, pages, selectedPageId]);

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];

  function addPage(parentId: string | null) {
    const siblings = getChildPages(pages, parentId);
    const nextPage = createDocumentPage(parentId ? "New subpage" : "New page", parentId, siblings.length);
    const nextPages = normalizePageOrders([...pages, nextPage]);
    onChangePages(nextPages);
    setSelectedPageId(nextPage.id);
  }

  function movePage(pageId: string, direction: "up" | "down") {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;

    const siblings = getChildPages(pages, page.parentId);
    const index = siblings.findIndex((item) => item.id === pageId);
    if (index < 0) return;
    const nextIndex = direction === "up" ? Math.max(0, index - 1) : Math.min(siblings.length - 1, index + 1);
    const reorderedSiblings = moveItem(siblings, index, nextIndex).map((item, siblingIndex) => ({ ...item, order: siblingIndex }));

    const nextPages = pages.map((item) => {
      const replacement = reorderedSiblings.find((candidate) => candidate.id === item.id);
      return replacement ?? item;
    });

    onChangePages(normalizePageOrders(nextPages));
  }

  return (
    <div className="space-y-5">
      {topSlot}
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <DocumentSidebarTree
            pages={pages}
            selectedPageId={selectedPage?.id}
            onSelect={setSelectedPageId}
            onAddPage={addPage}
            onMove={movePage}
          />
        </div>
        <DocumentPageEditor
          page={selectedPage}
          onChange={(nextPage) => onChangePages(pages.map((page) => (page.id === nextPage.id ? nextPage : page)))}
          reusableFragments={reusableFragments}
        />
      </div>
    </div>
  );
}
