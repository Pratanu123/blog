import type { PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../../utils/cn";
import type { ResizeDirection, Size } from "./useMediaResize";

const HANDLES: Array<{ dir: ResizeDirection; className: string; label: string }> = [
  { dir: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize", label: "Resize vertically" },
  { dir: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize", label: "Resize vertically" },
  { dir: "e", className: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize", label: "Resize horizontally" },
  { dir: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize", label: "Resize horizontally" },
  { dir: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize", label: "Resize diagonally" },
  { dir: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize", label: "Resize diagonally" },
  { dir: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize", label: "Resize diagonally" },
  { dir: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize", label: "Resize diagonally" },
];

export function ResizeHandles({
  onStart,
  getStartSize,
}: {
  onStart: (dir: ResizeDirection, event: ReactPointerEvent, start: Size) => void;
  getStartSize: () => Size;
}) {
  return (
    <>
      {HANDLES.map((handle) => (
        <button
          key={handle.dir}
          type="button"
          aria-label={handle.label}
          title={handle.label}
          className={cn(
            "absolute z-10 h-3 w-3 rounded-sm border-2 border-white bg-rust-600 shadow",
            handle.className,
          )}
          onPointerDown={(event) => onStart(handle.dir, event, getStartSize())}
        />
      ))}
    </>
  );
}
