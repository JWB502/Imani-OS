import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";

export default function FullTemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, updateFullTemplate, deleteFullTemplate } = useData();

  const template = data.fullTemplates.find((t) => t.id === id);
  const sectionMap = React.useMemo(
    () => new Map(data.sectionTemplates.map((s) => [s.id, s])),
    [data.sectionTemplates],
  );

  const [dragId, setDragId] = React.useState<string | null>(null);

  if (!template) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Template not found</div>
        <SoftButton asChild className="mt-4 rounded-2xl">
          <Link to="/templates">Back to Templates</Link>
        </SoftButton>
      </div>
    );
  }

  function patch(p: any) {
    updateFullTemplate(template.id, p);
  }

  const availableSections = data.sectionTemplates
    .filter((s) => !s.archived)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedSections = template.sectionTemplateIds
    .map((sid) => sectionMap.get(sid))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <SoftButton
            className="mb-3 rounded-2xl"
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </SoftButton>
          <div className="text-sm font-medium text-muted-foreground">
            Full template builder
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{template.name}</h1>
        </div>
        <SoftButton
          variant="destructive"
          className="rounded-2xl"
          onClick={() => {
            if (!confirm(`Delete full template “${template.name}”?`)) return;
            deleteFullTemplate(template.id);
            toast({ title: "Template deleted." });
            navigate("/templates");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </SoftButton>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Template details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={template.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="h-11 rounded-2xl bg-white/70"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={template.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
                className="min-h-20 rounded-2xl bg-white/70"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Archived</div>
                <div className="text-xs text-muted-foreground">Hide from new report creation.</div>
              </div>
              <Switch checked={template.archived} onCheckedChange={(v) => patch({ archived: v })} />
            </div>
            <div className="text-xs text-muted-foreground">Autosaved.</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sections (drag to reorder)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedSections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-white/70 p-10 text-center">
                <div className="text-sm font-medium">No sections yet</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Add section templates from the library.
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {template.sectionTemplateIds.map((sid) => {
                const s = sectionMap.get(sid);
                if (!s) return null;
                return (
                  <div
                    key={sid}
                    draggable
                    onDragStart={() => setDragId(sid)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!dragId || dragId === sid) return;
                      const next = template.sectionTemplateIds.slice();
                      const from = next.indexOf(dragId);
                      const to = next.indexOf(sid);
                      next.splice(from, 1);
                      next.splice(to, 0, dragId);
                      patch({ sectionTemplateIds: next });
                      setDragId(null);
                    }}
                    className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.blocks.length} blocks
                        </div>
                      </div>
                    </div>
                    <SoftButton
                      className="rounded-2xl bg-white"
                      onClick={() =>
                        patch({
                          sectionTemplateIds: template.sectionTemplateIds.filter(
                            (x) => x !== sid,
                          ),
                        })
                      }
                    >
                      Remove
                    </SoftButton>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium">Add sections</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSections
                  .filter((s) => !template.sectionTemplateIds.includes(s.id))
                  .slice(0, 18)
                  .map((s) => (
                    <SoftButton
                      key={s.id}
                      className="rounded-2xl bg-white"
                      onClick={() => patch({ sectionTemplateIds: [...template.sectionTemplateIds, s.id] })}
                    >
                      <Plus className="mr-2 h-4 w-4" /> {s.name}
                    </SoftButton>
                  ))}

                {availableSections.filter((s) => !template.sectionTemplateIds.includes(s.id)).length > 18 ? (
                  <Badge variant="secondary" className="rounded-full bg-white/70">
                    + more in library
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Sections are reusable across many full templates. Editing a report section does not change the master template.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}