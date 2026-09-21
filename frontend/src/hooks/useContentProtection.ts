import { useEffect } from "react";

const BLOCKED_KEYS = new Set(["c", "x", "a", "s", "p", "u"]);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function useContentProtection(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add("content-protected");

    const onContextMenu = (event: MouseEvent) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    const onCopyCut = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    };

    const onSelectStart = (event: Event) => {
      if (isEditableTarget(event.target)) return;
      // Preventing selectstart on coarse pointers can freeze scrolling on mobile WebKit.
      if (window.matchMedia("(pointer: coarse)").matches) return;
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;

      if (meta && BLOCKED_KEYS.has(key) && !isEditableTarget(event.target)) {
        event.preventDefault();
        return;
      }

      if (key === "printscreen") {
        event.preventDefault();
        root.classList.add("content-protected--flash");
        window.setTimeout(() => root.classList.remove("content-protected--flash"), 900);
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      root.classList.remove("content-protected", "content-protected--flash");
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
