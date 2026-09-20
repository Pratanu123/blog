import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_CONFETTI_COLORS = [
  "#ff4d2e",
  "#2ee6ff",
  "#1a7cff",
  "#ffe14a",
  "#3dd6ff",
  "#ff7a18",
  "#ff3d6e",
  "#b8ff3c",
  "#ff2eb8",
  "#7a1cff",
  "#ff9a1a",
  "#c41e3a",
] as const;

type ConfettiBit = {
  id: string;
  color: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  delay: number;
};

function makeBurst(): ConfettiBit[] {
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
    const dist = 16 + Math.random() * 28;
    return {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      color: NAV_CONFETTI_COLORS[i % NAV_CONFETTI_COLORS.length],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 8,
      rot: (Math.random() - 0.5) * 260,
      size: 3.5 + Math.random() * 4,
      delay: Math.random() * 0.12,
    };
  });
}

export function NavConfettiLink({
  to,
  children,
  className,
  onNavigate,
}: {
  to: string;
  children: string;
  className?: string | ((props: { isActive: boolean }) => string);
  onNavigate?: () => void;
}) {
  const [bits, setBits] = useState<ConfettiBit[]>([]);
  const clearRef = useRef<number | undefined>(undefined);
  const hoveringRef = useRef(false);

  function popConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (hoveringRef.current) return;
    hoveringRef.current = true;
    window.clearTimeout(clearRef.current);
    setBits(makeBurst());
    clearRef.current = window.setTimeout(() => setBits([]), 1600);
  }

  function endHover() {
    hoveringRef.current = false;
  }

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={(props) => {
        const resolved = typeof className === "function" ? className(props) : className;
        return `nav-confetti-link relative inline-flex w-fit ${resolved ?? ""}`;
      }}
    >
      <span
        className="nav-confetti-hit relative z-[1]"
        onMouseEnter={popConfetti}
        onMouseLeave={endHover}
      >
        {children}
      </span>
      <span className="nav-confetti-burst" aria-hidden="true">
        {bits.map((bit) => (
          <span
            key={bit.id}
            className="nav-confetti-bit"
            style={{
              backgroundColor: bit.color,
              width: `${bit.size}px`,
              height: `${bit.size * 0.55}px`,
              animationDelay: `${bit.delay}s`,
              ["--nav-cx" as string]: `${bit.x}px`,
              ["--nav-cy" as string]: `${bit.y}px`,
              ["--nav-rot" as string]: `${bit.rot}deg`,
            }}
          />
        ))}
      </span>
    </NavLink>
  );
}
