import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Trash2, WandSparkles } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { DocumentStatusBadge, DocumentToolbar } from "@/components/documents/DocumentToolbar";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

export default function SectionTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, duplicateDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate } = useData();

  const fragment = data.documentTemplates.find((item) => item.id === id && item.kind === "fragment");
  const reusableFragments = data.documentTemplates.filter((item) => item.kind === "fragment" && item.id !== id && !item.archived);

  if (!fragment) {
    return (
      <div className="rounded-[32px] border border-border/70 bg-white/75 p-8 shadow-sm">
        <div className="text-lg font-semibold">Reusable fragment not found</div>
        <div className="mt-2 text-sm text-muted-foreground">It may have been removed from the library.</div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/templates">Back to templates</Link>
        </Button>
      </div>
    );
  }

  return (
    <DocumentWorkspace
      pages={fragment.pages}
      reusableFragments={reusableFragments}
      onChangePages={(pages) => updateDocumentTemplate(fragment.id, { pages })}
      topSlot={
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <SoftButton asChild className="rounded-2xl">
              <Link to="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to library
              </Link>
            </SoftButton>
          </div>

          <DocumentToolbar
            eyebrow="Reusable fragment workspace"
            title={fragment.name}
            description="Fragments preserve your old section-library concept, but now they live as reusable document content instead of a separate editing mode."
            warnings={fragment.migrationWarnings}
            badges={
              <>
                <DocumentStatusBadge label="Reusable fragment" tone="muted" />
                {fragment.archived ? <DocumentStatusBadge label="Archived" tone="warning" /> : <DocumentStatusBadge label="Active" tone="success" />}
                {fragment.legacySourceType ? <DocumentStatusBadge label={`Migrated from ${fragment.legacySourceType}`} tone="muted" /> : null}
              </>
            }
            actions={
              <>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    const duplicate = duplicateDocumentTemplate(fragment.id);
                    if (!duplicate) return;
                    toast({ title: "Reusable fragment duplicated." });
                    navigate(`/templates/sections/${duplicate.id}`);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => updateDocumentTemplate(fragment.id, { archived: !fragment.archived })}
                >
                  {fragment.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!confirm(`Delete “${fragment.name}”?`)) return;
                    deleteDocumentTemplate(fragment.id);
                    navigate("/templates");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </>
            }
          />

          <Card className="rounded-[32px] border-border/70 bg-white/75 shadow-sm">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={fragment.name}
                  onChange={(event) => updateDocumentTemplate(fragment.id, { name: event.target.value })}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Fragment role</Label>
                <div className="flex h-11 items-center rounded-2xl border border-border/70 bg-muted/30 px-4 text-sm text-muted-foreground">
                  Inserted as a detached copy into template and report pages.
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={fragment.description ?? ""}
                  onChange={(event) => updateDocumentTemplate(fragment.id, { description: event.target.value })}
                  className="min-h-24 rounded-2xl bg-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
