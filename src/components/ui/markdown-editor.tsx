"use client";

import React from "react";
import { MdEditor, MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  preview?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  preview = true,
}: MarkdownEditorProps) {
  return (
    <div className={className}>
      <MdEditor
        modelValue={value}
        onChange={onChange}
        placeholder={placeholder}
        language="en-US"
        theme="light"
        toolbars={[
          "bold",
          "italic",
          "strikeThrough",
          "-",
          "title",
          "sub",
          "sup",
          "quote",
          "unorderedList",
          "orderedList",
          "-",
          "codeRow",
          "code",
          "link",
          "image",
          "table",
          "mermaid",
          "katex",
          "-",
          "revoke",
          "next",
          "save",
          "=",
          "preview",
          "catalog",
        ]}
        style={{ height: "400px", borderRadius: "0.75rem" }}
        preview={preview}
      />
    </div>
  );
}

export function MarkdownViewer({ value, className }: { value: string; className?: string }) {
  return (
    <div className={className}>
      <MdPreview modelValue={value} theme="light" language="en-US" />
    </div>
  );
}
