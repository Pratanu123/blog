import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { ResizeHandles } from "./ResizeHandles";
import { useMediaResize, type Size } from "./useMediaResize";

const PRESETS = [
  { label: "S", width: 240 },
  { label: "M", width: 400 },
  { label: "L", width: 640 },
  { label: "Full", width: null },
] as const;

export function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [altDraft, setAltDraft] = useState(String(node.attrs.alt ?? ""));
  const [liveSize, setLiveSize] = useState<Size | null>(null);

  useEffect(() => {
    setAltDraft(String(node.attrs.alt ?? ""));
  }, [node.attrs.alt]);

  const commitSize = useCallback(
    (size: Size) => {
      setLiveSize(null);
      updateAttributes({ width: size.width, height: size.height });
    },
    [updateAttributes],
  );

  const { startResize } = useMediaResize(commitSize);

  const readSize = (): Size => {
    const rect = frameRef.current?.getBoundingClientRect();
    return {
      width: Number(node.attrs.width) || Math.round(rect?.width || 400),
      height: Number(node.attrs.height) || Math.round(rect?.height || 240),
    };
  };

  const applyPreset = (width: number | null) => {
    setLiveSize(null);
    if (width === null) {
      updateAttributes({ width: null, height: null });
      return;
    }
    const current = readSize();
    const aspect = current.width / Math.max(1, current.height);
    updateAttributes({
      width,
      height: Math.round(width / aspect),
    });
  };

  const commitAlt = () => {
    const next = altDraft.trim();
    if (next !== String(node.attrs.alt ?? "")) {
      updateAttributes({ alt: next });
    }
  };

  const width = liveSize?.width ?? node.attrs.width;
  const height = liveSize?.height ?? node.attrs.height;

  return (
    <NodeViewWrapper
      className={cn("editor-image-node my-4", selected && "is-selected")}
      data-drag-handle
    >
      <div
        ref={frameRef}
        className="relative inline-block max-w-full"
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : undefined,
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || undefined}
          className={cn(
            "block max-w-full rounded-[1.25rem]",
            height ? "h-full w-full object-fill" : "h-auto w-full",
          )}
          draggable={false}
        />
        {selected && editor.isEditable ? (
          <ResizeHandles
            getStartSize={readSize}
            onStart={(dir, event, start) =>
              startResize(dir, event, start, (size) => setLiveSize(size))
            }
          />
        ) : null}
      </div>

      {selected && editor.isEditable ? (
        <div
          className="mt-2 flex max-w-full flex-col gap-2 rounded-2xl border border-ink-200 bg-white/95 p-2 shadow-sm dark:border-ink-700 dark:bg-ink-900/95"
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-1 text-[0.65rem] uppercase tracking-[0.16em] text-zinc-500">Size</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium text-ink-800 hover:bg-ink-100 dark:text-paper-100 dark:hover:bg-ink-800",
                  (preset.width === null && !node.attrs.width) ||
                    Number(node.attrs.width) === preset.width
                    ? "bg-ink-900 text-white hover:bg-ink-900 dark:bg-paper-50 dark:text-ink-900"
                    : "",
                )}
                onClick={() => applyPreset(preset.width)}
              >
                {preset.label}
              </button>
            ))}
            {width || height ? (
              <span className="ml-1 text-xs text-zinc-500">
                {Math.round(Number(width) || 0)}×{Math.round(Number(height) || 0)}px
              </span>
            ) : null}
          </div>
          <p className="px-1 text-[0.7rem] text-zinc-500">
            Drag edge handles for horizontal/vertical, corners for diagonal.
          </p>
          <label className="flex flex-col gap-1">
            <span className="px-1 text-[0.65rem] uppercase tracking-[0.16em] text-zinc-500">Alt text</span>
            <input
              type="text"
              value={altDraft}
              placeholder="Describe the image for accessibility and SEO"
              className="rounded-xl border border-ink-200 bg-transparent px-3 py-2 text-sm text-ink-900 outline-none focus:border-rust-500 dark:border-ink-700 dark:text-paper-50"
              onChange={(event) => setAltDraft(event.target.value)}
              onBlur={commitAlt}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitAlt();
                  (event.target as HTMLInputElement).blur();
                }
              }}
            />
          </label>
        </div>
      ) : node.attrs.alt ? (
        <p className="mt-1 max-w-prose text-xs text-zinc-500" contentEditable={false}>
          Alt: {node.attrs.alt}
        </p>
      ) : null}
    </NodeViewWrapper>
  );
}
