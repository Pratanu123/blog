import { brandAssets } from "./brandAssets";

type InkVoltageMarkProps = {
  className?: string;
  title?: string;
  size?: number;
};

/** Emblem only — transparent SVG (no square plate). */
export function InkVoltageMark({ className = "", title = "Ink & Voltage", size = 112 }: InkVoltageMarkProps) {
  const { markSvg } = brandAssets;
  return (
    <img
      src={markSvg}
      alt={title}
      width={size}
      height={size}
      decoding="async"
      className={className}
      draggable={false}
    />
  );
}
