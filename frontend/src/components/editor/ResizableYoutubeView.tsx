import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { ResizeHandles } from "./ResizeHandles";
import { useMediaResize, type Size } from "./useMediaResize";

function youtubeEmbedSrc(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    const id = url.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    if (url.pathname.includes("/embed/")) return src;
  } catch {
    // fall through
  }
  return src;
}

export function ResizableYoutubeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [liveSize, setLiveSize] = useState<Size | null>(null);

  const commitSize = useCallback(
    (size: Size) => {
      setLiveSize(null);
      updateAttributes({ width: size.width, height: size.height });
    },
    [updateAttributes],
  );

  const { startResize } = useMediaResize(commitSize);

  const width = liveSize?.width ?? (Number(node.attrs.width) || 640);
  const height = liveSize?.height ?? (Number(node.attrs.height) || 360);
  const embed = youtubeEmbedSrc(String(node.attrs.src || ""));

  const readSize = (): Size => ({
    width: Number(node.attrs.width) || Math.round(frameRef.current?.getBoundingClientRect().width || 640),
    height: Number(node.attrs.height) || Math.round(frameRef.current?.getBoundingClientRect().height || 360),
  });

  return (
    <NodeViewWrapper
      className={cn("editor-video-node my-4", selected && "is-selected")}
      data-drag-handle
    >
      <div
        ref={frameRef}
        className="relative max-w-full overflow-hidden rounded-[1.25rem]"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <iframe
          src={embed}
          title="YouTube video"
          width={width}
          height={height}
          className="h-full w-full rounded-[1.25rem] border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {/* Capture layer so iframe doesn't steal pointer events while selecting/resizing */}
        {editor.isEditable ? (
          <div className="absolute inset-0 z-[1]" contentEditable={false} />
        ) : null}
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
          className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-white/95 p-2 text-xs text-zinc-500 shadow-sm dark:border-ink-700 dark:bg-ink-900/95"
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="uppercase tracking-[0.16em]">Video size</span>
          <span>
            {Math.round(width)}×{Math.round(height)}px
          </span>
          <span>Edges = horizontal/vertical · Corners = diagonal</span>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
