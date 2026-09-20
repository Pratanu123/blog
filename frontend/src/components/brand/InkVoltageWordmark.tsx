import { BrandAmp } from "./BrandAmp";

type InkVoltageWordmarkProps = {
  className?: string;
  as?: "span" | "p" | "h1" | "h2";
};

/** Typeset wordmark: Fraunces Ink / Voltage + Fraunces orange &. */
export function InkVoltageWordmark({ className = "", as: Tag = "span" }: InkVoltageWordmarkProps) {
  return (
    <Tag className={`ink-voltage-wordmark ${className}`.trim()}>
      Ink <BrandAmp /> Voltage
    </Tag>
  );
}
