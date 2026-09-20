import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "./ResizableImageView";

function parsePx(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export const ResizableImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") ?? "",
        renderHTML: (attributes) => ({
          alt: attributes.alt || "",
        }),
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) =>
          parsePx(element.getAttribute("width")) ??
          parsePx(element.style.width?.replace("px", "") ?? null),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const style = attributes.height
            ? `width: ${attributes.width}px; height: ${attributes.height}px; max-width: 100%; object-fit: fill;`
            : `width: ${attributes.width}px; height: auto; max-width: 100%;`;
          return {
            width: attributes.width,
            style,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          parsePx(element.getAttribute("height")) ??
          parsePx(element.style.height?.replace("px", "") ?? null),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
