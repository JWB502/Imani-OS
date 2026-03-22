"use client";

import * as React from "react";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import {
  Bold,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ensureRichTextDoc } from "@/lib/richText";

const COLORS = [
  { name: "Default", value: null },
  { name: "Navy", value: "#001129" },
  { name: "Teal", value: "#26bbc0" },
  { name: "Blue", value: "#185391" },
  { name: "Emerald", value: "#059669" },
  { name: "Amber", value: "#d97706" },
  { name: "Rose", value: "#e11d48" },
];

function ToolButton({
  active,
  disabled,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "h-9 w-9 rounded-xl bg-white shadow-sm ring-1 ring-border/80 hover:bg-slate-50 hover:ring-border transition-all duration-200",
        active && "bg-primary text-primary-foreground ring-primary hover:bg-primary/90 hover:ring-primary",
      )}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: JSONContent | string | null | undefined;
  onChange: (next: JSONContent) => void;
  placeholder?: string;
  className?: string;
}) {
  const initial = React.useMemo(() => ensureRichTextDoc(value), [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: initial,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full rounded-2xl bg-white px-4 py-3 text-sm leading-6 ring-1 ring-border/60 focus:outline-none shadow-inner" +
          " " +
          "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight" +
          " " +
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight" +
          " " +
          "[&_h3]:text-lg [&_h3]:font-semibold" +
          " " +
          "[&_p]:my-1.5" +
          " " +
          "[&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc" +
          " " +
          "[&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal" +
          " " +
          "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const next = ensureRichTextDoc(value);
    const current = editor.getJSON();
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    editor.commands.setContent(next);
  }, [editor, value]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[22px] border border-border/60 bg-slate-100/50 p-1.5 shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-xl border-none bg-white px-3 text-xs font-semibold shadow-sm ring-1 ring-border/80 hover:bg-slate-50 hover:ring-border"
            >
              Headings <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="rounded-xl border-border/60 shadow-lg">
            <DropdownMenuItem
              className="rounded-lg"
              onClick={() => editor?.chain().focus().setParagraph().run()}
            >
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="mr-2 h-4 w-4" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="mr-2 h-4 w-4" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="mr-2 h-4 w-4" /> Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-6 w-px bg-border/40" />

        <ToolButton
          ariaLabel="Bold"
          active={!!editor?.isActive("bold")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          ariaLabel="Italic"
          active={!!editor?.isActive("italic")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          ariaLabel="Underline"
          active={!!editor?.isActive("underline")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>

        <div className="mx-1 h-6 w-px bg-border/40" />

        <ToolButton
          ariaLabel="Bulleted list"
          active={!!editor?.isActive("bulletList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          ariaLabel="Numbered list"
          active={!!editor?.isActive("orderedList")}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>

        <div className="mx-1 h-6 w-px bg-border/40" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-xl border-none bg-white px-3 text-xs font-semibold shadow-sm ring-1 ring-border/80 hover:bg-slate-50 hover:ring-border"
            >
              Text color <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl border-border/60 shadow-lg">
            {COLORS.map((c) => (
              <DropdownMenuItem
                key={c.name}
                className="rounded-lg"
                onClick={() => {
                  const chain = editor?.chain().focus();
                  if (!chain) return;
                  if (!c.value) chain.unsetColor().run();
                  else chain.setColor(c.value).run();
                }}
              >
                <span
                  className="mr-2 inline-block h-3.5 w-3.5 rounded-full ring-1 ring-border shadow-sm"
                  style={{ backgroundColor: c.value ?? "transparent" }}
                />
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <Button
          type="button"
          variant="secondary"
          className="h-9 rounded-xl border-none bg-white px-3 text-xs font-semibold text-destructive shadow-sm ring-1 ring-border/80 hover:bg-destructive/5 hover:ring-destructive/30"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={!editor}
        >
          <RemoveFormatting className="mr-1.5 h-4 w-4" /> Clear
        </Button>
      </div>

      <div className="relative">
        {!editor?.getText().trim() && placeholder ? (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground/60">
            {placeholder}
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}