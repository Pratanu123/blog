import { brandAssets } from "./brandAssets";

type InkVoltageLockupProps = {
  className?: string;
  title?: string;
  /** Display height in CSS px — lockup is a horizontal SVG. */
  height?: number;
};

/** Full brand lockup (emblem + wordmark) as one SVG asset. */
export function InkVoltageLockup({
  className = "",
  title = "Ink & Voltage",
  height = 48,
}: InkVoltageLockupProps) {
  const { lockupSvg } = brandAssets;
  const width = Math.round(height * 3.644);
  return (
    <img
      src={lockupSvg}
      alt={title}
      width={width}
      height={height}
      decoding="async"
      className={className}
      draggable={false}
    />
  );
}
