import * as React from "react";
import type { JSONContent } from "@tiptap/react";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import { cn } from "@/lib/utils";

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextStyle,
  Color,
];

export function RichTextRenderer({
  doc,
  className,
}: {
  doc: JSONContent;
  className?: string;
}) {
  const html = React.useMemo(() => {
    return generateHTML(doc, extensions);
  }, [doc]);

  return (
    <div
      className={cn(
        "text-sm leading-6",
        "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:my-1.5",
        "[&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc",
        "[&_ol]:my-2 [&_ol]:ml-5 [&_ol]:list-decimal",
        "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
