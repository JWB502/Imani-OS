import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";

export default function Templates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    data,
    createSectionTemplate,
    updateSectionTemplate,
    duplicateSectionTemplate,
    deleteSectionTemplate,
    createFullTemplate,
    updateFullTemplate,
    duplicateFullTemplate,
    deleteFullTemplate,
  } = useData();

  const [tab, setTab] = React.useState<"sections" | "full">("full");

  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<"section" | "full">("full");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  function openCreate(k: "section" | "full") {
    setKind(k);
    setName("");
    setDescription("");
    setOpen(true);
  }

  function save() {
    if (!name.trim()) {
      toast({ title: "Name is required." });
      return;
    }

    if (kind === "section") {
      const t = createSectionTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        blocks: [
          {
            id: `blk_${Date.now()}`,
            type: "richText",
            label: "Notes",
            content: "",
          } as any,
        ],
        archived: false,
      });
      toast({ title: "Section template created." });
      setOpen(false);
      navigate(`/templates/sections/${t.id}`);
    } else {
      const t = createFullTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        sectionTemplateIds: [],
        archived: false,
      });
      toast({ title: "Full template created." });
      setOpen(false);
      navigate(`/templates/full/${t.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Reusable building blocks + assembled reports
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Templates</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openCreate("full")} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> New full template
          </Button>
          <Button
            onClick={() => openCreate("section")}
            variant="secondary"
            className="rounded-2xl bg-white/70"
          >
            <Plus className="mr-2 h-4 w-4" /> New section template
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="h-11 rounded-2xl bg-white/70 p-1">
          <TabsTrigger value="full" className="rounded-2xl">
            Full templates
          </TabsTrigger>
          <TabsTrigger value="sections" className="rounded-2xl">
            Section templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="mt-4">
          <div className="grid gap-3">
            {data.fullTemplates
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="truncate font-medium">
                          <Link
                            to={`/templates/full/${t.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {t.name}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.sectionTemplateIds.length} sections
                          {t.description ? ` • ${t.description}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.archived ? (
                      <Badge className="rounded-full bg-slate-200 text-slate-900">
                        Archived
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-white"
                      onClick={() => {
                        const dupe = duplicateFullTemplate(t.id);
                        if (dupe) toast({ title: "Template duplicated." });
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-white"
                      onClick={() => updateFullTemplate(t.id, { archived: !t.archived })}
                    >
                      {t.archived ? "Unarchive" : "Archive"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-2xl"
                      onClick={() => {
                        if (!confirm(`Delete full template “${t.name}”?`)) return;
                        deleteFullTemplate(t.id);
                        toast({ title: "Template deleted." });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))}

            {data.fullTemplates.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-white/70 p-10 text-center">
                <div className="text-sm font-medium">No full templates yet</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Assemble reports by combining reusable section templates.
                </div>
                <Button onClick={() => openCreate("full")} className="mt-4 rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" /> Create a full template
                </Button>
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="sections" className="mt-4">
          <div className="grid gap-3">
            {data.sectionTemplates
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      <Link
                        to={`/templates/sections/${t.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {t.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.blocks.length} blocks
                      {t.description ? ` • ${t.description}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.archived ? (
                      <Badge className="rounded-full bg-slate-200 text-slate-900">
                        Archived
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-white"
                      onClick={() => {
                        const dupe = duplicateSectionTemplate(t.id);
                        if (dupe) toast({ title: "Template duplicated." });
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-2xl bg-white"
                      onClick={() => updateSectionTemplate(t.id, { archived: !t.archived })}
                    >
                      {t.archived ? "Unarchive" : "Archive"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-2xl"
                      onClick={() => {
                        if (!confirm(`Delete section template “${t.name}”?`)) return;
                        deleteSectionTemplate(t.id);
                        toast({ title: "Template deleted." });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {kind === "full" ? "New full template" : "New section template"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder={
                  kind === "full"
                    ? "Local Visibility Snapshot"
                    : "Google Business Profile Audit"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20 rounded-2xl"
                placeholder="What is this template for?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={save}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
