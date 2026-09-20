import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { MediaPicker } from "../media/MediaPicker";
import type { MediaItem } from "../../types";
import { ResizableImage } from "./ResizableImage";
import { ResizableYoutube } from "./ResizableYoutube";

function Tool({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-800 transition hover:bg-ink-100 disabled:opacity-35 dark:text-paper-100 dark:hover:bg-ink-800",
        active && "bg-ink-900 text-white hover:bg-ink-900 dark:bg-paper-50 dark:text-ink-900 dark:hover:bg-paper-50",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 hidden h-5 w-px bg-ink-200 sm:block dark:bg-ink-700" aria-hidden />;
}

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return `https://${url}`;
}

export function RichTextEditor({
  value,
  onChange,
  syncKey = 0,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Bump this when content is changed outside the editor (restores, etc.). */
  syncKey?: number;
}) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "editor-link",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ResizableImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-[1.25rem]",
        },
      }),
      Placeholder.configure({ placeholder: "Write the piece…" }),
      ResizableYoutube.configure({ width: 640, height: 360 }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table",
        },
      }),
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
    if (!editor || syncKey < 1) return;
    editor.commands.setContent(value || "", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed by syncKey
  }, [syncKey, editor]);

  useEffect(() => {
    if (!editor || syncKey > 0) return;
    if (editor.isFocused) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor, syncKey]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const raw = window.prompt("Link URL", previous || "https://");
    if (raw === null) return;

    if (raw.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const href = normalizeUrl(raw);
    const { from, to, empty } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ");

    if (empty || !selected.trim()) {
      const label = href.replace(/^https?:\/\//i, "");
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${href}" class="editor-link" target="_blank" rel="noopener noreferrer">${label}</a>`)
        .run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const insertTable = () => {
    const inserted = editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    if (inserted) return;

    editor
      .chain()
      .focus()
      .insertContent(
        "<table><tbody>" +
          "<tr><th>Heading</th><th>Heading</th><th>Heading</th></tr>" +
          "<tr><td></td><td></td><td></td></tr>" +
          "<tr><td></td><td></td><td></td></tr>" +
          "</tbody></table><p></p>",
      )
      .run();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-white/95 p-2 backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
        <Tool title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Tool>
        <Tool title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </Tool>
        <Divider />
        <Tool title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Tool>
        <Tool title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </Tool>
        <Divider />
        <Tool title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Tool>
        <Tool title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Tool>
        <Tool title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </Tool>
        <Tool title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Tool>
        <Divider />
        <Tool title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Tool>
        <Tool title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Tool>
        <Tool title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Tool>
        <Tool title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-4 w-4" />
        </Tool>
        <Tool title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </Tool>
        <Divider />
        <Tool title="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </Tool>
        <Tool title="Image from media library" onClick={() => setImagePickerOpen(true)}>
          <ImageIcon className="h-4 w-4" />
        </Tool>
        <Tool
          title="YouTube video"
          onClick={() => {
            const url = window.prompt("YouTube URL");
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }}
        >
          <YoutubeIcon className="h-4 w-4" />
        </Tool>
        <Tool title="Insert table" onClick={insertTable}>
          <TableIcon className="h-4 w-4" />
        </Tool>
      </div>
      <div className="overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
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
