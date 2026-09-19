import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { MediaPicker } from "../media/MediaPicker";
import type { MediaItem } from "../../types";

function Tool({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-ink-100 dark:text-paper-100 dark:hover:bg-ink-800",
        active && "bg-ink-900 text-white dark:bg-paper-50 dark:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-[1.25rem]",
        },
      }),
      Placeholder.configure({ placeholder: "Write the piece…" }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[28rem] px-4 py-3 text-ink-900 focus:outline-none dark:text-paper-50",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current && !editor.isFocused) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
      <div className="flex flex-wrap gap-1 border-b border-ink-200 p-2 dark:border-ink-700">
        <Tool active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Tool>
        <Tool active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Tool>
        <Tool active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</Tool>
        <Tool active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</Tool>
        <Tool active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</Tool>
        <Tool
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Tool>
        <Tool
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Tool>
        <Tool active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</Tool>
        <Tool active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</Tool>
        <Tool onClick={() => editor.chain().focus().setHorizontalRule().run()}>Rule</Tool>
        <Tool
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </Tool>
        <Tool title="Insert image from media library" onClick={() => setImagePickerOpen(true)}>
          Image
        </Tool>
        <Tool
          onClick={() => {
            const url = window.prompt("YouTube URL");
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }}
        >
          Video
        </Tool>
        <Tool onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</Tool>
      </div>
      <EditorContent editor={editor} />
      <MediaPicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={(media: MediaItem) => {
          editor
            .chain()
            .focus()
            .setImage({
              src: media.url,
              alt: media.alt_text || media.original_filename,
            })
            .run();
        }}
      />
    </div>
  );
}
