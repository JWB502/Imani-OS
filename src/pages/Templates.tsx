import * as React from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Copy, FileStack, Layers2, Plus, Search, Trash2, WandSparkles } from "lucide-react";

import type { AppLayoutOutletContext } from "@/components/app/AppLayout";
import { DocumentStatusBadge } from "@/components/documents/DocumentToolbar";
import { SoftButton } from "@/components/app/SoftButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { countDocumentPages, createDocumentPage } from "@/lib/documentTree";
import type { DocumentTemplateKind } from "@/types/imani";

export default function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, createDocumentTemplate, duplicateDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate } = useData();
  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();

  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<DocumentTemplateKind>("template");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [localQuery, setLocalQuery] = React.useState("");

  const query = (localQuery || globalSearchQuery).trim().toLowerCase();
  const templates = data.documentTemplates
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((template) => {
      if (!query) return true;
      const haystack = [
        template.name,
        template.description,
        template.kind,
        template.archived ? "archived" : "active",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

  function openCreate(nextKind: DocumentTemplateKind) {
    setKind(nextKind);
    setName("");
    setDescription("");
    setOpen(true);
  }

  function routeForTemplate(templateId: string, templateKind: DocumentTemplateKind) {
    return templateKind === "fragment" ? `/templates/sections/${templateId}` : `/templates/full/${templateId}`;
  }

  function save() {
    if (!name.trim()) {
      toast({ title: "Template name is required." });
      return;
    }

    const template = createDocumentTemplate({
      kind,
      name: name.trim(),
      description: description.trim() || undefined,
      pages: [createDocumentPage(kind === "fragment" ? "Reusable fragment" : "Overview", null, 0)],
    });

    toast({ title: kind === "fragment" ? "Reusable fragment created." : "Template created." });
    setOpen(false);
    navigate(routeForTemplate(template.id, kind));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-border/70 bg-white/75 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Template library</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--im-navy)]">Notion-style templates</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Templates and reusable fragments now live in one document-first library, with nested pages, richer blocks, and migration notes where legacy content was simplified.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openCreate("template")} className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" /> New template
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => openCreate("fragment")}>
              <WandSparkles className="mr-2 h-4 w-4" /> New reusable fragment
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(event) => setLocalQuery(event.target.value)}
            className="h-11 rounded-2xl bg-white/80 pl-10"
            placeholder="Search templates, fragments, or archived items…"
          />
        </div>
        <div className="text-sm text-muted-foreground">{templates.length} items</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded-[32px] border border-border/70 bg-white/75 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    {template.kind === "template" ? <Layers2 className="h-5 w-5" /> : <FileStack className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <Link to={routeForTemplate(template.id, template.kind)} className="block truncate text-lg font-semibold tracking-tight hover:text-primary">
                      {template.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <DocumentStatusBadge label={template.kind === "template" ? "Template" : "Reusable fragment"} tone={template.kind === "template" ? "default" : "muted"} />
                      {template.archived ? <DocumentStatusBadge label="Archived" tone="warning" /> : <DocumentStatusBadge label="Active" tone="success" />}
                      {template.migrationWarnings?.length ? <Badge className="rounded-full bg-amber-100 text-amber-900">Needs review</Badge> : null}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{template.description || "No description yet."}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>{countDocumentPages(template.pages)} pages</div>
                <div className="mt-1">Updated {formatDate(template.updatedAt)}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <SoftButton
                className="rounded-2xl"
                onClick={() => {
                  const duplicate = duplicateDocumentTemplate(template.id);
                  if (!duplicate) return;
                  toast({ title: `${template.kind === "template" ? "Template" : "Fragment"} duplicated.` });
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </SoftButton>
              <SoftButton
                className="rounded-2xl"
                onClick={() => updateDocumentTemplate(template.id, { archived: !template.archived })}
              >
                {template.archived ? "Unarchive" : "Archive"}
              </SoftButton>
              <Button
                variant="destructive"
                className="rounded-2xl"
                onClick={() => {
                  if (!confirm(`Delete “${template.name}”?`)) return;
                  deleteDocumentTemplate(template.id);
                  toast({ title: "Library item deleted." });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border/80 bg-white/75 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Layers2 className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold">No templates found</div>
          <div className="mt-2 text-sm text-muted-foreground">Try a new search or create your first document template.</div>
          <Button onClick={() => openCreate("template")} className="mt-4 rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Create template
          </Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{kind === "template" ? "Create document template" : "Create reusable fragment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-2xl" placeholder={kind === "template" ? "Quarterly impact review" : "Executive summary block"} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 rounded-2xl" placeholder="What will this be used for?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-2xl" onClick={save}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
