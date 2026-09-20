import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type Size = { width: number; height: number };

type DragState = {
  dir: ResizeDirection;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  aspect: number;
};

const MIN = 120;
const MAX_W = 1200;
const MAX_H = 900;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function computeResize(
  dir: ResizeDirection,
  start: Size & { aspect: number },
  deltaX: number,
  deltaY: number,
): Size {
  let dw = deltaX;
  let dh = deltaY;

  if (dir.includes("w")) dw = -dw;
  if (dir.includes("n")) dh = -dh;

  const horizontal = dir === "e" || dir === "w";
  const vertical = dir === "n" || dir === "s";

  if (horizontal) {
    return {
      width: clamp(start.width + dw, MIN, MAX_W),
      height: start.height,
    };
  }

  if (vertical) {
    return {
      width: start.width,
      height: clamp(start.height + dh, MIN, MAX_H),
    };
  }

  // Diagonal — keep aspect ratio from the larger axis movement.
  const nextW = clamp(start.width + dw, MIN, MAX_W);
  const fromWidth = {
    width: nextW,
    height: clamp(nextW / start.aspect, MIN, MAX_H),
  };
  const nextH = clamp(start.height + dh, MIN, MAX_H);
  const fromHeight = {
    width: clamp(nextH * start.aspect, MIN, MAX_W),
    height: nextH,
  };

  return Math.abs(dw) >= Math.abs(dh) ? fromWidth : fromHeight;
}

export function useMediaResize(onCommit: (size: Size) => void) {
  const dragRef = useRef<DragState | null>(null);
  const liveRef = useRef<((size: Size) => void) | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const size = computeResize(
        drag.dir,
        { width: drag.startW, height: drag.startH, aspect: drag.aspect },
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      liveRef.current?.(size);
    };

    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const size = computeResize(
        drag.dir,
        { width: drag.startW, height: drag.startH, aspect: drag.aspect },
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      dragRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      onCommit(size);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onCommit]);

  const startResize = (
    dir: ResizeDirection,
    event: ReactPointerEvent,
    start: Size,
    onLive?: (size: Size) => void,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    liveRef.current = onLive ?? null;
    dragRef.current = {
      dir,
      startX: event.clientX,
      startY: event.clientY,
      startW: start.width,
      startH: start.height,
      aspect: start.width / Math.max(1, start.height),
    };
    const cursor =
      dir === "e" || dir === "w"
        ? "ew-resize"
        : dir === "n" || dir === "s"
          ? "ns-resize"
          : dir === "ne" || dir === "sw"
            ? "nesw-resize"
            : "nwse-resize";
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
  };

  return { startResize };
}
