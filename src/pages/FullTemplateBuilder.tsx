import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, FileStack, Trash2 } from "lucide-react";

import { DocumentStatusBadge, DocumentToolbar } from "@/components/documents/DocumentToolbar";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { SoftButton } from "@/components/app/SoftButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

export default function FullTemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, duplicateDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate } = useData();

  const template = data.documentTemplates.find((item) => item.id === id && item.kind === "template");
  const reusableFragments = data.documentTemplates.filter((item) => item.kind === "fragment" && !item.archived);

  if (!template) {
    return (
      <div className="rounded-[32px] border border-border/70 bg-white/75 p-8 shadow-sm">
        <div className="text-lg font-semibold">Template not found</div>
        <div className="mt-2 text-sm text-muted-foreground">It may have been deleted or migrated into a different library item.</div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/templates">Back to templates</Link>
        </Button>
      </div>
    );
  }

  return (
    <DocumentWorkspace
      pages={template.pages}
      reusableFragments={reusableFragments}
      onChangePages={(pages) => updateDocumentTemplate(template.id, { pages })}
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
            eyebrow="Template workspace"
            title={template.name}
            description="Build nested pages on the left, edit blocks on the document canvas, and compose pages with reusable fragments."
            warnings={template.migrationWarnings}
            badges={
              <>
                <DocumentStatusBadge label="Document template" />
                {template.archived ? <DocumentStatusBadge label="Archived" tone="warning" /> : <DocumentStatusBadge label="Active" tone="success" />}
                {template.legacySourceType ? <DocumentStatusBadge label={`Migrated from ${template.legacySourceType}`} tone="muted" /> : null}
              </>
            }
            actions={
              <>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    const duplicate = duplicateDocumentTemplate(template.id);
                    if (!duplicate) return;
                    toast({ title: "Template duplicated." });
                    navigate(`/templates/full/${duplicate.id}`);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => updateDocumentTemplate(template.id, { archived: !template.archived })}
                >
                  {template.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!confirm(`Delete “${template.name}”?`)) return;
                    deleteDocumentTemplate(template.id);
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
                  value={template.name}
                  onChange={(event) => updateDocumentTemplate(template.id, { name: event.target.value })}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Legacy mapping</Label>
                <div className="flex h-11 items-center rounded-2xl border border-border/70 bg-muted/30 px-4 text-sm text-muted-foreground">
                  {template.legacySourceType ? `${template.legacySourceType} • ${template.legacySourceId}` : "Native document template"}
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={template.description ?? ""}
                  onChange={(event) => updateDocumentTemplate(template.id, { description: event.target.value })}
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
