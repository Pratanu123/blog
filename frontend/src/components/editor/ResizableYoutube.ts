import Youtube from "@tiptap/extension-youtube";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableYoutubeView } from "./ResizableYoutubeView";

function parsePx(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export const ResizableYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 640,
        parseHTML: (element) =>
          parsePx(element.getAttribute("width")) ??
          parsePx(element.style.width?.replace("px", "") ?? null) ??
          640,
        renderHTML: (attributes) => ({
          width: attributes.width || 640,
        }),
      },
      height: {
        default: 360,
        parseHTML: (element) =>
          parsePx(element.getAttribute("height")) ??
          parsePx(element.style.height?.replace("px", "") ?? null) ??
          360,
        renderHTML: (attributes) => ({
          height: attributes.height || 360,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableYoutubeView);
  },
});
