import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { SiteSettings } from "../../types";

const COLS = 4;
const ROWS = 2;
const PIECE_COUNT = COLS * ROWS;
const TAB = 14;
const SNAP_RATIO = 0.5;

/** Tray occupies the top of the playfield; board the bottom. */
const TRAY_END = 42;
const BOARD_TOP = 48;
const BOARD_HEIGHT = 50;

const FALLBACK_ABOUT_ME = `I write and edit for Ink & Voltage — an independent journal for software, design, and the quieter craft behind lasting work.

By day I sit with drafts, photographs, and paintings; by evening I chase the sentence that makes a system feel human. This site is my studio wall: essays in the Journal, photographs and paintings in their own galleries, and a running set of ideas that keep the work honest.

If you are here looking for polish without the performance, you are in the right room.`;

const TRAY_SCATTER = [
  { x: 11, y: 13, rot: -6 },
  { x: 36, y: 11, rot: 5 },
  { x: 61, y: 13, rot: -4 },
  { x: 86, y: 12, rot: 6 },
  { x: 11, y: 31, rot: 4 },
  { x: 36, y: 33, rot: -5 },
  { x: 61, y: 31, rot: 5 },
  { x: 86, y: 32, rot: -4 },
] as const;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function splitIntoPieces(content: string): string[] {
  const normalized = content.replace(/\n+/g, " ").trim();
  const sentences = normalized
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [normalized];

  if (sentences.length >= PIECE_COUNT) {
    return sentences.slice(0, PIECE_COUNT);
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const chunk = Math.max(1, Math.ceil(words.length / PIECE_COUNT));
  return Array.from({ length: PIECE_COUNT }, (_, index) => {
    const slice = words.slice(index * chunk, (index + 1) * chunk).join(" ");
    return slice || sentences[index % sentences.length] || "…";
  });
}

/**
 * Complementary jigsaw edges — same path for floating pieces and bottom outlines
 * so corners and knobs line up exactly when comparing tray ↔ frame.
 */
function piecePath(row: number, col: number): string {
  const min = 0;
  const max = 100;

  const rightOut = col < COLS - 1 && (row + col) % 2 === 0;
  const leftOut = col > 0 && (row + col - 1) % 2 === 1;
  const bottomOut = row < ROWS - 1 && (row + col) % 2 === 0;
  const topOut = row > 0 && (row + col - 1) % 2 === 1;

  const edge = (
    axis: "h" | "v",
    corner: number,
    alongStart: number,
    alongEnd: number,
    outward: boolean | null,
    outwardSign: 1 | -1,
  ) => {
    if (outward === null) {
      return axis === "h" ? `L ${alongEnd} ${corner}` : `L ${corner} ${alongEnd}`;
    }
    const mid = (alongStart + alongEnd) / 2;
    const neck = TAB * 0.55;
    const bump = (outward ? TAB : -TAB) * outwardSign;
    if (axis === "h") {
      return [
        `L ${mid - neck} ${corner}`,
        `C ${mid - neck * 0.25} ${corner + bump * 0.2}, ${mid - neck * 0.85} ${corner + bump}, ${mid} ${corner + bump}`,
        `C ${mid + neck * 0.85} ${corner + bump}, ${mid + neck * 0.25} ${corner + bump * 0.2}, ${mid + neck} ${corner}`,
        `L ${alongEnd} ${corner}`,
      ].join(" ");
    }
    return [
      `L ${corner} ${mid - neck}`,
      `C ${corner + bump * 0.2} ${mid - neck * 0.25}, ${corner + bump} ${mid - neck * 0.85}, ${corner + bump} ${mid}`,
      `C ${corner + bump} ${mid + neck * 0.85}, ${corner + bump * 0.2} ${mid + neck * 0.25}, ${corner} ${mid + neck}`,
      `L ${corner} ${alongEnd}`,
    ].join(" ");
  };

  const top = row === 0 ? null : topOut;
  const right = col === COLS - 1 ? null : rightOut;
  const bottom = row === ROWS - 1 ? null : bottomOut;
  const left = col === 0 ? null : leftOut;

  return [
    `M ${min} ${min}`,
    edge("h", min, min, max, top, -1),
    edge("v", max, min, max, right, 1),
    edge("h", max, max, min, bottom, 1),
    edge("v", min, max, min, left, -1),
    "Z",
  ].join(" ");
}

function homeCenter(row: number, col: number) {
  return {
    x: ((col + 0.5) / COLS) * 100,
    y: BOARD_TOP + ((row + 0.5) / ROWS) * BOARD_HEIGHT,
  };
}

type PieceState = {
  id: number;
  text: string;
  row: number;
  col: number;
  x: number;
  y: number;
  rot: number;
  placed: boolean;
  /** Stable tray parking spot so failed drops never stack/hide under another piece. */
  trayX: number;
  trayY: number;
  trayRot: number;
};

type ConfettiBit = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
};

const CONFETTI_COLORS = ["#c45c26", "#e0895a", "#161310", "#f4ece0", "#a3481b", "#d4c7b0"];

function buildPieces(texts: string[]): PieceState[] {
  const starts = shuffle([...TRAY_SCATTER]);
  return texts.map((text, id) => ({
    id,
    text,
    row: Math.floor(id / COLS),
    col: id % COLS,
    x: starts[id].x,
    y: starts[id].y,
    rot: starts[id].rot,
    placed: false,
    trayX: starts[id].x,
    trayY: starts[id].y,
    trayRot: starts[id].rot,
  }));
}

function HandDrawnRose({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const outerPetals = [0, 45, 90, 135, 180, 225, 270, 315];
  const midPetals = [22, 67, 112, 157, 202, 247, 292, 337];
  const innerPetals = [0, 60, 120, 180, 240, 300];

  return (
    <svg className={className} style={style} viewBox="0 0 120 130" fill="none" aria-hidden>
      <g className="puzzle-flower-stem">
        <path
          d="M60 78 C58 92, 52 108, 46 122"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="text-rust-600/55"
        />
        <path
          d="M60 92 C46 88, 38 98, 40 106"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="text-rust-600/45"
        />
        <path
          d="M60 96 C72 92, 80 100, 78 108"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="text-rust-600/45"
        />
      </g>

      <g className="puzzle-flower-bud">
        <ellipse cx="60" cy="52" rx="10" ry="14" className="fill-rust-500/45 stroke-rust-500" strokeWidth="1.8" />
        <path
          d="M54 48 C58 44, 62 44, 66 48"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="text-rust-600/70"
        />
      </g>

      <g className="puzzle-flower-bloom">
        {outerPetals.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 60 + Math.cos(rad) * 26;
          const cy = 48 + Math.sin(rad) * 24;
          return (
            <ellipse
              key={`o-${angle}`}
              className="puzzle-flower-petal"
              cx={cx}
              cy={cy}
              rx="18"
              ry="24"
              transform={`rotate(${angle + 90} ${cx} ${cy})`}
              fill="rgba(196,92,38,0.14)"
              stroke="currentColor"
              strokeWidth="1.7"
            />
          );
        })}
        {midPetals.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 60 + Math.cos(rad) * 16;
          const cy = 48 + Math.sin(rad) * 15;
          return (
            <ellipse
              key={`m-${angle}`}
              className="puzzle-flower-petal"
              cx={cx}
              cy={cy}
              rx="13"
              ry="18"
              transform={`rotate(${angle + 90} ${cx} ${cy})`}
              fill="rgba(196,92,38,0.2)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          );
        })}
        {innerPetals.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 60 + Math.cos(rad) * 8;
          const cy = 48 + Math.sin(rad) * 7;
          return (
            <ellipse
              key={`i-${angle}`}
              className="puzzle-flower-petal"
              cx={cx}
              cy={cy}
              rx="8"
              ry="11"
              transform={`rotate(${angle + 90} ${cx} ${cy})`}
              fill="rgba(224,137,90,0.28)"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          );
        })}
        <circle cx="60" cy="48" r="7" className="fill-rust-500/50 stroke-rust-600" strokeWidth="1.4" />
        <circle cx="57" cy="45" r="1.4" className="fill-rust-600/55" />
        <circle cx="63" cy="47" r="1.1" className="fill-rust-600/45" />
        <circle cx="60" cy="51" r="1.2" className="fill-rust-600/50" />
      </g>
    </svg>
  );
}

function TrayCelebration() {
  const roses = [
    { left: "-4%", top: "-8%", size: 210, rotate: -14, delay: "0s" },
    { left: "18%", top: "-12%", size: 190, rotate: 10, delay: "0.15s" },
    { left: "48%", top: "-10%", size: 220, rotate: -6, delay: "0.08s" },
    { left: "72%", top: "-14%", size: 200, rotate: 16, delay: "0.22s" },
    { left: "88%", top: "-6%", size: 185, rotate: -10, delay: "0.3s" },
    { left: "-6%", top: "28%", size: 195, rotate: 12, delay: "0.18s" },
    { left: "12%", top: "42%", size: 175, rotate: -18, delay: "0.35s" },
    { left: "38%", top: "48%", size: 205, rotate: 8, delay: "0.12s" },
    { left: "62%", top: "40%", size: 188, rotate: -12, delay: "0.28s" },
    { left: "84%", top: "34%", size: 200, rotate: 14, delay: "0.4s" },
    { left: "2%", top: "68%", size: 170, rotate: -8, delay: "0.45s" },
    { left: "28%", top: "72%", size: 180, rotate: 11, delay: "0.2s" },
    { left: "55%", top: "70%", size: 195, rotate: -15, delay: "0.32s" },
    { left: "80%", top: "66%", size: 178, rotate: 7, delay: "0.5s" },
  ] as const;

  return (
    <div
      className="puzzle-tray-celebration pointer-events-none absolute inset-x-0 top-0 z-30 overflow-hidden rounded-[1.25rem]"
      style={{ height: `${TRAY_END}%` }}
    >
      <div className="absolute inset-0">
        {roses.map((rose) => (
          <HandDrawnRose
            key={`${rose.left}-${rose.top}-${rose.size}`}
            className="puzzle-flower puzzle-rose absolute text-rust-500"
            style={{
              left: rose.left,
              top: rose.top,
              width: rose.size,
              height: rose.size * 1.08,
              ["--flower-rot" as string]: `${rose.rotate}deg`,
              ["--bloom-delay" as string]: rose.delay,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <p className="puzzle-hurray-copy font-display text-3xl text-ink-900 md:text-4xl dark:text-paper-50">
          Hurray!!! You&apos;ve done it.
        </p>
      </div>
    </div>
  );
}

function PieceGraphic({
  path,
  text,
  clipId,
  enlarged = false,
}: {
  path: string;
  text: string;
  clipId: string;
  enlarged?: boolean;
}) {
  const readoutRef = useRef<HTMLParagraphElement>(null);

  const fitReadout = useCallback(() => {
    const el = readoutRef.current;
    const shell = el?.parentElement;
    if (!el || !shell) return;

    // Always fit the full sentence; enlarged only starts larger for easier reading.
    let size = enlarged ? 30 : 18;
    const floor = enlarged ? 11 : 6.5;
    el.style.fontSize = `${size}px`;
    el.style.lineHeight = enlarged ? "1.4" : "1.3";

    for (let i = 0; i < 48; i += 1) {
      if (el.scrollHeight <= shell.clientHeight + 0.5 && el.scrollWidth <= shell.clientWidth + 0.5) {
        break;
      }
      size = Math.max(floor, size * 0.9);
      el.style.fontSize = `${size}px`;
      if (size <= floor) break;
    }
  }, [text, enlarged]);

  useLayoutEffect(() => {
    fitReadout();
    const shell = readoutRef.current?.parentElement;
    if (!shell || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fitReadout());
    observer.observe(shell);
    return () => observer.disconnect();
  }, [fitReadout]);

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
        <path d={path} className="puzzle-piece-fill" />
        <path d={path} className="puzzle-piece-stroke-outer" fill="none" vectorEffect="non-scaling-stroke" />
        <path d={path} className="puzzle-piece-stroke" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className={`puzzle-piece-readout ${enlarged ? "is-enlarged" : ""}`} aria-live={enlarged ? "polite" : undefined}>
        <p ref={readoutRef}>{text}</p>
      </div>
    </>
  );
}

export function AboutMePage() {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const body = (settings.about_me_content || "").trim() || FALLBACK_ABOUT_ME;
  const name = settings.organization_name || settings.site_name || "Ink & Voltage";
  const texts = useMemo(() => splitIntoPieces(body), [body]);

  const playfieldRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const piecesRef = useRef<PieceState[]>([]);
  const draggingIdRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0, pieceX: 0, pieceY: 0, rot: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const [pieces, setPieces] = useState<PieceState[]>(() => buildPieces(texts));
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [readingId, setReadingId] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationFading, setCelebrationFading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiBit[]>([]);

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    setPieces((current) => {
      const byId = new Map(current.map((piece) => [piece.id, piece]));
      return texts.map((text, id) => {
        const existing = byId.get(id);
        if (existing) {
          return {
            ...existing,
            text,
            trayX: existing.trayX ?? existing.x,
            trayY: existing.trayY ?? existing.y,
            trayRot: existing.trayRot ?? existing.rot,
          };
        }
        const start = TRAY_SCATTER[id % TRAY_SCATTER.length];
        return {
          id,
          text,
          row: Math.floor(id / COLS),
          col: id % COLS,
          x: start.x,
          y: start.y,
          rot: start.rot,
          placed: false,
          trayX: start.x,
          trayY: start.y,
          trayRot: start.rot,
        };
      });
    });
  }, [texts]);

  const placedCount = pieces.filter((piece) => piece.placed).length;
  const allJoined = placedCount === PIECE_COUNT;

  useEffect(() => {
    if (!allJoined || solved) return;

    let cancelled = false;
    setReadingId(null);
    setCelebrating(true);
    setCelebrationFading(false);
    setConfetti(
      Array.from({ length: 90 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.45,
        duration: 1.4 + Math.random() * 1.2,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    );

    const fadeTimer = window.setTimeout(() => {
      if (!cancelled) setCelebrationFading(true);
    }, 5000);
    const hideTimer = window.setTimeout(() => {
      if (cancelled) return;
      setCelebrating(false);
      setCelebrationFading(false);
      setSolved(true);
    }, 6500);

    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [allJoined, solved]);

  const clientToPercent = useCallback((clientX: number, clientY: number) => {
    const field = playfieldRef.current;
    if (!field) return { x: 50, y: 50 };
    const rect = field.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const slotCenter = useCallback((row: number, col: number) => {
    const field = playfieldRef.current;
    const slot = slotRefs.current[row * COLS + col];
    if (!field || !slot) return homeCenter(row, col);
    const fieldRect = field.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    if (slotRect.width < 4 || slotRect.height < 4) return homeCenter(row, col);
    return {
      x: ((slotRect.left + slotRect.width / 2 - fieldRect.left) / fieldRect.width) * 100,
      y: ((slotRect.top + slotRect.height / 2 - fieldRect.top) / fieldRect.height) * 100,
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (solved || celebrating) return;
    const piece = piecesRef.current.find((item) => item.id === id);
    const field = playfieldRef.current;
    if (!piece || !field || piece.placed) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = field.getBoundingClientRect();
    const pieceCenterX = rect.left + (piece.x / 100) * rect.width;
    const pieceCenterY = rect.top + (piece.y / 100) * rect.height;
    dragOffset.current = {
      x: event.clientX - pieceCenterX,
      y: event.clientY - pieceCenterY,
    };
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pieceX: piece.x,
      pieceY: piece.y,
      rot: piece.rot,
    };
    dragMovedRef.current = false;
    draggingIdRef.current = id;
    setDraggingId(id);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (draggingIdRef.current !== id) return;

    const travel = Math.hypot(event.clientX - pointerStartRef.current.x, event.clientY - pointerStartRef.current.y);
    if (!dragMovedRef.current) {
      if (travel < 8) return;
      dragMovedRef.current = true;
      setReadingId(null);
    }

    const point = clientToPercent(event.clientX - dragOffset.current.x, event.clientY - dragOffset.current.y);
    setPieces((current) =>
      current.map((piece) =>
        piece.id === id
          ? {
              ...piece,
              x: Math.min(94, Math.max(6, point.x)),
              y: Math.min(94, Math.max(6, point.y)),
              rot: 0,
            }
          : piece,
      ),
    );
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>, id: number) => {
    if (draggingIdRef.current !== id) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }

    draggingIdRef.current = null;
    setDraggingId(null);

    const piece = piecesRef.current.find((item) => item.id === id);
    const field = playfieldRef.current;
    if (!piece || !field || piece.placed) return;

    const wasTap = !dragMovedRef.current;
    dragMovedRef.current = false;

    if (wasTap) {
      setPieces((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                x: pointerStartRef.current.pieceX,
                y: pointerStartRef.current.pieceY,
                rot: pointerStartRef.current.rot,
              }
            : item,
        ),
      );
      setReadingId((current) => (current === id ? null : id));
      return;
    }

    const point = clientToPercent(event.clientX - dragOffset.current.x, event.clientY - dragOffset.current.y);
    const home = slotCenter(piece.row, piece.col);
    const rect = field.getBoundingClientRect();
    const dx = ((point.x - home.x) / 100) * rect.width;
    const dy = ((point.y - home.y) / 100) * rect.height;
    const slot = slotRefs.current[piece.row * COLS + piece.col];
    const slotRect = slot?.getBoundingClientRect();
    const cellW = slotRect?.width || rect.width / COLS;
    const cellH = slotRect?.height || ((BOARD_HEIGHT / 100) * rect.height) / ROWS;
    const threshold = Math.min(cellW, cellH) * SNAP_RATIO;

    if (Math.hypot(dx, dy) <= threshold) {
      setReadingId(null);
      setPieces((current) =>
        current.map((item) =>
          item.id === id ? { ...item, placed: true, x: home.x, y: home.y, rot: 0 } : item,
        ),
      );
      return;
    }

    setPieces((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              x: item.trayX,
              y: item.trayY,
              rot: item.trayRot,
              placed: false,
            }
          : item,
      ),
    );
  };

  function resetPuzzle() {
    setSolved(false);
    setCelebrating(false);
    setCelebrationFading(false);
    setConfetti([]);
    setReadingId(null);
    draggingIdRef.current = null;
    setDraggingId(null);
    setPieces(buildPieces(texts));
  }

  // Match board cell aspect so tray knobs compare accurately to bottom outlines.
  const pieceW = 100 / COLS;
  const pieceH = BOARD_HEIGHT / ROWS;
  const looseScale = 0.72;
  const readScale = 2.05;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(196,92,38,0.1),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(22,19,16,0.05),transparent_45%)] dark:bg-[radial-gradient(ellipse_at_30%_0%,rgba(196,92,38,0.16),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(251,247,240,0.04),transparent_40%)]"
      />

      <div className="about-me-dear-section relative z-10 pt-8 md:pt-10">
        <div className="about-me-dear-birds" aria-hidden="true">
          {(
            [
              { tone: "scarlet", delay: 0, top: "8%", duration: 14, ya: "-6px", yb: "10px", yc: "-4px", size: "lg" },
              { tone: "azure", delay: 3.2, top: "32%", duration: 16, ya: "8px", yb: "-12px", yc: "6px", size: "lg" },
              { tone: "lime", delay: 6.4, top: "55%", duration: 15, ya: "-10px", yb: "6px", yc: "-8px", size: "lg" },
              { tone: "gold", delay: 9.6, top: "78%", duration: 17, ya: "4px", yb: "-8px", yc: "10px", size: "lg" },
              { tone: "scarlet", delay: 1.6, top: "22%", duration: 13, ya: "5px", yb: "-7px", yc: "3px", size: "sm" },
              { tone: "azure", delay: 8, top: "68%", duration: 12, ya: "-5px", yb: "9px", yc: "-6px", size: "sm" },
            ] as const
          ).map((parrot, index) => (
            <span
              key={`${parrot.tone}-${parrot.size}-${index}`}
              className={`about-me-dear-parrot about-me-dear-parrot--${parrot.size} home-welcome-parrot-${parrot.tone}`}
              style={{
                top: parrot.top,
                animationDelay: `${parrot.delay}s`,
                animationDuration: `${parrot.duration}s`,
                ["--fly-ya" as string]: parrot.ya,
                ["--fly-yb" as string]: parrot.yb,
                ["--fly-yc" as string]: parrot.yc,
              }}
            >
              <span className="home-welcome-parrot-tail" />
              <span className="home-welcome-parrot-body" />
              <span className="home-welcome-parrot-wing" />
              <span className="home-welcome-parrot-head" />
              <span className="home-welcome-parrot-beak" />
            </span>
          ))}
        </div>
        <div className="relative z-[2] mx-auto max-w-2xl px-5">
          <div className="joy-note">
            <p>Dear You,</p>
            <p className="mt-3">
              This puzzle is pretty much an accurate representation of how my personality is. See if you can match the correct peices to uncover a little bit about me!
            </p>
            <p className="mt-4">XoXo</p>
            <p>Joe</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-5 flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 pb-2">
        <p className="text-xs uppercase tracking-[0.22em] text-rust-600">
          {placedCount} / {PIECE_COUNT} joined
        </p>
        <p className="text-sm text-ink-700/80 dark:text-paper-100/70">
          Tap a piece to enlarge its text. Tap again to shrink, then drag it into the frame.
        </p>
        {(solved || placedCount > 0) && (
          <button type="button" onClick={resetPuzzle} className="text-sm text-rust-600 hover:underline">
            Reset puzzle
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-3 pb-10 md:px-5">
        <div
          ref={playfieldRef}
          className="puzzle-playfield relative h-[min(92vh,1040px)] w-full touch-none overflow-visible"
        >
          {/* Top: floating pieces tray */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 overflow-visible rounded-[1.25rem] border border-ink-200/50 bg-paper-50/40 dark:border-ink-700/50 dark:bg-ink-950/20"
            style={{ height: `${TRAY_END}%` }}
            aria-hidden
          />
          <p className="pointer-events-none absolute left-3 top-2 z-10 text-[0.65rem] uppercase tracking-[0.2em] text-rust-600/80">
            Pieces
          </p>

          {(allJoined || celebrating || solved) && <TrayCelebration />}

          {/* Bottom: dotted combined outline frame */}
          <div
            className="pointer-events-none absolute inset-x-0 overflow-visible rounded-[1.25rem] border border-dashed border-rust-500/55 bg-paper-50/30 dark:border-rust-400/45 dark:bg-ink-950/25"
            style={{ top: `${BOARD_TOP}%`, height: `${BOARD_HEIGHT}%` }}
          >
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-2">
              {Array.from({ length: PIECE_COUNT }, (_, id) => {
                const row = Math.floor(id / COLS);
                const col = id % COLS;
                const filled = pieces.find((piece) => piece.id === id)?.placed;
                return (
                  <div
                    key={id}
                    ref={(node) => {
                      slotRefs.current[id] = node;
                    }}
                    className={`puzzle-slot relative overflow-visible ${filled ? "is-filled" : ""}`}
                  >
                    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                      <path d={piecePath(row, col)} className="puzzle-slot-fill" />
                      <path
                        d={piecePath(row, col)}
                        className="puzzle-slot-stroke"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
          <p
            className="pointer-events-none absolute left-3 z-10 text-[0.65rem] uppercase tracking-[0.2em] text-rust-600/80"
            style={{ top: `calc(${BOARD_TOP}% + 0.5rem)` }}
          >
            Frame
          </p>

          {solved ? (
            <div
              className="puzzle-solved absolute inset-x-0 flex items-center justify-center p-3 md:p-6"
              style={{ top: `${BOARD_TOP}%`, height: `${BOARD_HEIGHT}%` }}
            >
              <div className="puzzle-solved-panel max-h-full w-full overflow-auto rounded-[1.5rem] border border-ink-200 bg-paper-50/95 p-6 shadow-lift md:p-10 dark:border-ink-700 dark:bg-ink-900/95">
                <p className="text-xs uppercase tracking-[0.2em] text-rust-600">About Me</p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">{name}</h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-ink-800 md:text-lg dark:text-paper-100/85">
                  {body.split(/\n\s*\n/).map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph.trim()}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            pieces.map((piece) => {
              const path = piecePath(piece.row, piece.col);
              const isDragging = draggingId === piece.id;
              const isReading = readingId === piece.id;
              const clipId = `puzzle-clip-${piece.id}`;
              const scale = piece.placed ? 1 : isReading ? readScale : looseScale;

              return (
                <button
                  key={piece.id}
                  type="button"
                  aria-label={`Puzzle piece ${piece.id + 1}. Tap to enlarge text, drag to place.`}
                  disabled={piece.placed || celebrating}
                  onPointerDown={(event) => onPointerDown(event, piece.id)}
                  onPointerMove={(event) => onPointerMove(event, piece.id)}
                  onPointerUp={(event) => onPointerUp(event, piece.id)}
                  onPointerCancel={(event) => onPointerUp(event, piece.id)}
                  className={`puzzle-piece absolute z-20 ${piece.placed ? "is-placed" : "is-loose"} ${isDragging ? "is-dragging" : ""} ${isReading ? "is-reading" : ""}`}
                  style={{
                    left: isReading ? "50%" : `${piece.x}%`,
                    top: isReading ? `${TRAY_END / 2}%` : `${piece.y}%`,
                    width: `${pieceW * scale}%`,
                    height: `${pieceH * scale}%`,
                    transform: `translate(-50%, -50%) rotate(${piece.placed || isReading ? 0 : piece.rot}deg)`,
                    animationDelay: `${piece.id * 0.12}s`,
                    zIndex: isDragging || isReading ? 60 : piece.placed ? 15 : 20 + piece.id,
                  }}
                >
                  <PieceGraphic path={path} text={piece.text} clipId={clipId} enlarged={isReading} />
                </button>
              );
            })
          )}

          {celebrating ? (
            <div
              className={`pointer-events-none absolute inset-0 z-50 transition-opacity duration-1000 ease-out ${celebrationFading ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            >
              <div className="confetti-layer">
                {confetti.map((bit) => (
                  <span
                    key={bit.id}
                    className="confetti-bit"
                    style={{
                      left: `${bit.left}%`,
                      backgroundColor: bit.color,
                      animationDelay: `${bit.delay}s`,
                      animationDuration: `${bit.duration}s`,
                      ["--spin" as string]: `${bit.rotate}deg`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
