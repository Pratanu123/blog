import markSvg from "../../assets/brand/ink-voltage-mark.svg";
import mark128 from "../../assets/brand/ink-voltage-mark-128.png";
import mark256 from "../../assets/brand/ink-voltage-mark-256.png";
import mark512 from "../../assets/brand/ink-voltage-mark-512.png";
import lockupSvg from "../../assets/brand/ink-voltage-lockup.svg";
import lockupH64 from "../../assets/brand/ink-voltage-lockup-h64.png";
import lockupH96 from "../../assets/brand/ink-voltage-lockup-h96.png";
import lockupH128 from "../../assets/brand/ink-voltage-lockup-h128.png";
import lockupH160 from "../../assets/brand/ink-voltage-lockup-h160.png";
import lockupH256 from "../../assets/brand/ink-voltage-lockup-h256.png";

/** Bundled brand URLs — prefer Vite imports over public/ in Docker preview. */
export const brandAssets = {
  markSvg,
  lockupSvg,
  lockup: {
    h64: lockupH64,
    h96: lockupH96,
    h128: lockupH128,
    h160: lockupH160,
    h256: lockupH256,
  },
  mark: {
    128: mark128,
    256: mark256,
    512: mark512,
  },
  public: {
    markSvg: "/logos/ink-voltage-mark.svg",
    lockupSvg: "/logos/ink-voltage-lockup.svg",
    wordmarkSvg: "/logos/ink-voltage-wordmark.svg",
    email: "/logos/ink-voltage-email-600.png",
    og: "/logos/ink-voltage-og-1200x630.png",
    favicon: "/favicon.svg",
    appleTouch: "/apple-touch-icon.png",
  },
} as const;
