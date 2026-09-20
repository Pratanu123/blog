import { cn } from "../../utils/cn";

function WatermarkLabel({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("watermark-label", className)} aria-hidden="true">
      <span className="watermark-label-dark">{text}</span>
      <span className="watermark-label-light">{text}</span>
    </span>
  );
}

export function WatermarkedMedia({
  src,
  alt,
  watermark,
  className,
  imgClassName,
  compact = false,
}: {
  src: string;
  alt: string;
  watermark: string;
  className?: string;
  imgClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("watermarked-media", compact && "watermarked-media--compact", className)}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn("watermarked-media-img", imgClassName)}
      />
      <div className="watermarked-media-mark" aria-hidden="true">
        {!compact ? (
          <>
            <WatermarkLabel text={watermark} className="watermarked-media-mark-tile watermarked-media-mark-tile--1" />
            <WatermarkLabel text={watermark} className="watermarked-media-mark-tile watermarked-media-mark-tile--2" />
            <WatermarkLabel text={watermark} className="watermarked-media-mark-tile watermarked-media-mark-tile--3" />
            <WatermarkLabel text={watermark} className="watermarked-media-mark-tile watermarked-media-mark-tile--4" />
          </>
        ) : null}
        <WatermarkLabel text={watermark} className="watermarked-media-mark-corner" />
      </div>
    </div>
  );
}
