import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type JournalDragonProps = {
  className?: string;
  contentSelector?: string;
};

type Vec = { x: number; y: number };

type Frame = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DragonFigure() {
  return (
    <span className="journal-dragon-figure">
      <span className="journal-dragon-wing journal-dragon-wing--back">
        <span className="journal-dragon-wing-membrane" />
        <span className="journal-dragon-wing-bone" />
      </span>

      <span className="journal-dragon-tail">
        <span className="journal-dragon-tail-seg journal-dragon-tail-seg--1" />
        <span className="journal-dragon-tail-seg journal-dragon-tail-seg--2" />
        <span className="journal-dragon-tail-seg journal-dragon-tail-seg--3" />
        <span className="journal-dragon-tail-tip" />
      </span>

      <span className="journal-dragon-hind journal-dragon-hind--back">
        <span className="journal-dragon-thigh" />
        <span className="journal-dragon-shin" />
        <span className="journal-dragon-claw" />
      </span>
      <span className="journal-dragon-hind journal-dragon-hind--front">
        <span className="journal-dragon-thigh" />
        <span className="journal-dragon-shin" />
        <span className="journal-dragon-claw" />
      </span>

      <span className="journal-dragon-body" />
      <span className="journal-dragon-belly" />
      <span className="journal-dragon-ridge" />

      <span className="journal-dragon-fore journal-dragon-fore--back">
        <span className="journal-dragon-arm" />
        <span className="journal-dragon-forearm" />
        <span className="journal-dragon-paw" />
      </span>
      <span className="journal-dragon-fore journal-dragon-fore--front">
        <span className="journal-dragon-arm" />
        <span className="journal-dragon-forearm" />
        <span className="journal-dragon-paw" />
      </span>

      <span className="journal-dragon-neck" />
      <span className="journal-dragon-head" />
      <span className="journal-dragon-jaw" />
      <span className="journal-dragon-snout" />
      <span className="journal-dragon-nostril" />
      <span className="journal-dragon-horn journal-dragon-horn--back" />
      <span className="journal-dragon-horn journal-dragon-horn--front" />
      <span className="journal-dragon-ear" />
      <span className="journal-dragon-brow" />
      <span className="journal-dragon-eye">
        <span className="journal-dragon-eye-white" />
        <span className="journal-dragon-eye-iris">
          <span className="journal-dragon-eye-pupil" />
          <span className="journal-dragon-eye-shine" />
        </span>
      </span>

      <span className="journal-dragon-wing journal-dragon-wing--front">
        <span className="journal-dragon-wing-membrane" />
        <span className="journal-dragon-wing-bone" />
        <span className="journal-dragon-wing-glow" />
      </span>

      <span className="journal-dragon-breath" aria-hidden="true">
        <span className="journal-dragon-breath-plume journal-dragon-breath-plume--outer" />
        <span className="journal-dragon-breath-plume journal-dragon-breath-plume--mid" />
        <span className="journal-dragon-breath-core" />
        <span className="journal-dragon-breath-spark journal-dragon-breath-spark--1" />
        <span className="journal-dragon-breath-spark journal-dragon-breath-spark--2" />
        <span className="journal-dragon-breath-spark journal-dragon-breath-spark--3" />
        <span className="journal-dragon-breath-spark journal-dragon-breath-spark--4" />
        <span className="journal-dragon-breath-spark journal-dragon-breath-spark--5" />
      </span>
    </span>
  );
}

/** Loose yarn path: zigzag + curl offsets so it never looks like a ruler line. */
function buildYarnPath(points: Vec[], tight = false): string {
  if (points.length < 2) return "";

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const zig = (i % 2 === 0 ? 1 : -1) * (tight ? 1.1 + (i % 3) * 0.35 : 5 + (i % 5) * 1.4);
    const curl = Math.sin(i * 0.85) * (tight ? 0.7 : 4.5);
    const amp = zig + curl;

    const c1x = prev.x + dx * 0.28 + nx * amp * 0.55;
    const c1y = prev.y + dy * 0.28 + ny * amp * 0.55;
    const c2x = prev.x + dx * 0.72 - nx * amp * 0.7;
    const c2y = prev.y + dy * 0.72 - ny * amp * 0.7;

    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

/** Clockwise point + tangent on the margin rectangle. */
function pointOnLoop(frame: Frame, distance: number): { pos: Vec; dir: Vec } {
  const w = Math.max(8, frame.right - frame.left);
  const h = Math.max(8, frame.bottom - frame.top);
  const perimeter = 2 * (w + h);
  let d = ((distance % perimeter) + perimeter) % perimeter;

  if (d <= w) {
    return { pos: { x: frame.left + d, y: frame.top }, dir: { x: 1, y: 0 } };
  }
  d -= w;
  if (d <= h) {
    return { pos: { x: frame.right, y: frame.top + d }, dir: { x: 0, y: 1 } };
  }
  d -= h;
  if (d <= w) {
    return { pos: { x: frame.right - d, y: frame.bottom }, dir: { x: -1, y: 0 } };
  }
  d -= w;
  return { pos: { x: frame.left, y: frame.bottom - d }, dir: { x: 0, y: -1 } };
}

/** Clockwise loop with rounded corners — avoids the sticky hitch at sharp 90° turns. */
function pointOnRoundedLoop(frame: Frame, distance: number, cornerRadius: number): { pos: Vec; dir: Vec } {
  const w = Math.max(8, frame.right - frame.left);
  const h = Math.max(8, frame.bottom - frame.top);
  const r = Math.max(4, Math.min(cornerRadius, w / 2 - 2, h / 2 - 2));
  const straightH = Math.max(1, w - 2 * r);
  const straightV = Math.max(1, h - 2 * r);
  const arc = (Math.PI / 2) * r;
  const perimeter = 2 * (straightH + straightV) + 4 * arc;
  let d = ((distance % perimeter) + perimeter) % perimeter;

  // Top L → R
  if (d <= straightH) {
    return { pos: { x: frame.left + r + d, y: frame.top }, dir: { x: 1, y: 0 } };
  }
  d -= straightH;
  // Top-right arc
  if (d <= arc) {
    const a = -Math.PI / 2 + d / r;
    return {
      pos: { x: frame.right - r + Math.cos(a) * r, y: frame.top + r + Math.sin(a) * r },
      dir: { x: -Math.sin(a), y: Math.cos(a) },
    };
  }
  d -= arc;
  // Right T → B
  if (d <= straightV) {
    return { pos: { x: frame.right, y: frame.top + r + d }, dir: { x: 0, y: 1 } };
  }
  d -= straightV;
  // Bottom-right arc
  if (d <= arc) {
    const a = d / r;
    return {
      pos: { x: frame.right - r + Math.cos(a) * r, y: frame.bottom - r + Math.sin(a) * r },
      dir: { x: -Math.sin(a), y: Math.cos(a) },
    };
  }
  d -= arc;
  // Bottom R → L
  if (d <= straightH) {
    return { pos: { x: frame.right - r - d, y: frame.bottom }, dir: { x: -1, y: 0 } };
  }
  d -= straightH;
  // Bottom-left arc
  if (d <= arc) {
    const a = Math.PI / 2 + d / r;
    return {
      pos: { x: frame.left + r + Math.cos(a) * r, y: frame.bottom - r + Math.sin(a) * r },
      dir: { x: -Math.sin(a), y: Math.cos(a) },
    };
  }
  d -= arc;
  // Left B → T
  if (d <= straightV) {
    return { pos: { x: frame.left, y: frame.bottom - r - d }, dir: { x: 0, y: -1 } };
  }
  d -= straightV;
  // Top-left arc
  const a = Math.PI + d / r;
  return {
    pos: { x: frame.left + r + Math.cos(a) * r, y: frame.top + r + Math.sin(a) * r },
    dir: { x: -Math.sin(a), y: Math.cos(a) },
  };
}

export function JournalDragon({
  className = "",
  contentSelector = ".article-column",
}: JournalDragonProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const yarnRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dragonRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLSpanElement>(null);
  const [portalToBody, setPortalToBody] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPortalToBody(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const yarnEl = yarnRef.current;
    const pathEl = pathRef.current;
    const dragonEl = dragonRef.current;
    const irisEl = dragonEl?.querySelector(".journal-dragon-eye-iris") as HTMLSpanElement | null;
    if (!scene || !yarnEl || !pathEl || !dragonEl) return;
    if (irisEl) irisRef.current = irisEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame: Frame = { left: 52, right: 220, top: 56, bottom: 420 };
    let narrow = false;
    let stageSize = { w: 400, h: 800 };
    let contentBounds = { left: 0, right: 400, top: 0, bottom: 800 };
    let headerSafe = 0;

    const dragonScaleFor = () => (narrow ? 0.55 : 1);
    const dragonHalf = () => {
      const s = dragonScaleFor();
      return {
        // Extra inset for wings/tail/breath so the full figure stays inside the screen
        x: (5.6 * 16 * s) / 2 + (narrow ? 10 : 6),
        y: (4.6 * 16 * s) / 2 + (narrow ? 10 : 6),
      };
    };

    const readLayout = () => {
      const stage = scene.getBoundingClientRect();
      const stageW = Math.max(stage.width, 1);
      const stageH = Math.max(stage.height, 1);
      stageSize = { w: stageW, h: stageH };
      const content = document.querySelector(contentSelector) as HTMLElement | null;
      narrow = window.matchMedia("(max-width: 767px)").matches;
      const headerEl = document.querySelector("header");
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
      headerSafe = narrow ? Math.max(headerH + 8, 64) : 0;
      const half = dragonHalf();
      const padX = narrow ? Math.max(half.x + 4, 28) : 56;
      const padY = narrow ? Math.max(half.y + 4, 28) : 56;
      const topPad = padY + headerSafe;

      if (content) {
        const box = content.getBoundingClientRect();
        contentBounds = {
          left: Math.max(0, box.left - stage.left),
          right: Math.min(stageW, box.right - stage.left),
          top: Math.max(0, box.top - stage.top),
          bottom: Math.min(stageH, box.bottom - stage.top),
        };
      } else {
        contentBounds = { left: padX, right: stageW - padX, top: topPad, bottom: stageH - padY };
      }

      // Mobile: same idea as desktop — orbit the article margins, never cut through copy
      if (narrow) {
        const colL = contentBounds.left;
        const colR = contentBounds.right;
        const gutterL = Math.max(0, colL);
        const gutterR = Math.max(0, stageW - colR);

        // Center of each side gutter, kept clear of both the text and the screen edge
        let leftLane = gutterL > half.x + 8 ? gutterL * 0.5 : padX;
        let rightLane = gutterR > half.x + 8 ? stageW - gutterR * 0.5 : stageW - padX;
        leftLane = clamp(leftLane, half.x + 4, Math.max(half.x + 4, colL - half.x - 2));
        rightLane = clamp(rightLane, Math.min(stageW - half.x - 4, colR + half.x + 2), stageW - half.x - 4);

        // Top stays under the header and above the article (so the yarn doesn't cross buttons/text)
        let topLane = headerSafe + half.y + 8;
        if (contentBounds.top > topLane + half.y + 12) {
          topLane = contentBounds.top - half.y - 10;
        }

        const bottomLane = stageH - half.y - 28;

        if (rightLane - leftLane < half.x * 2 + 24) {
          leftLane = padX;
          rightLane = stageW - padX;
        }

        frame = {
          left: leftLane,
          right: rightLane,
          top: topLane,
          bottom: Math.max(topLane + 180, bottomLane),
        };
        return;
      }

      if (!content) {
        frame = {
          left: padX,
          right: stageW - padX,
          top: topPad,
          bottom: stageH - padY,
        };
        return;
      }

      const left = contentBounds.left;
      const right = contentBounds.right;
      const top = contentBounds.top;
      const bottom = contentBounds.bottom;
      const gutter = 12;
      const minSide = 36;
      const leftW = left - gutter;
      const rightW = stageW - right - gutter;
      const pad = 56;

      let leftLane = leftW >= minSide ? Math.max(pad, leftW * 0.5) : pad;
      let rightLane = rightW >= minSide ? Math.min(stageW - pad, stageW - rightW * 0.5) : stageW - pad;
      let topLane = top > pad + 8 ? Math.min(top - 20, Math.max(pad, top * 0.28)) : pad;
      let bottomLane =
        stageH - bottom > pad + 8
          ? Math.max(bottom + 20, Math.min(stageH - pad, bottom + (stageH - bottom) * 0.4))
          : stageH - pad;

      leftLane = clamp(leftLane, pad, Math.max(pad, left - 14));
      rightLane = clamp(rightLane, Math.min(stageW - pad, right + 14), stageW - pad);
      topLane = clamp(topLane, pad, Math.max(pad, top - 12));
      bottomLane = clamp(bottomLane, Math.min(stageH - pad, bottom + 12), stageH - pad);

      if (leftW >= minSide && leftLane > left - 10) {
        leftLane = Math.max(pad, left - Math.max(half.x * 0.85, leftW * 0.55));
      }
      if (rightW >= minSide && rightLane < right + 10) {
        rightLane = Math.min(stageW - pad, right + Math.max(half.x * 0.85, rightW * 0.55));
      }

      leftLane = clamp(leftLane, pad, stageW / 2 - 8);
      rightLane = clamp(rightLane, stageW / 2 + 8, stageW - pad);
      topLane = clamp(topLane, pad, stageH / 2 - 8);
      bottomLane = clamp(bottomLane, stageH / 2 + 8, stageH - pad);

      frame = {
        left: leftLane,
        right: rightLane,
        top: topLane,
        bottom: bottomLane,
      };
    };

    const keepOutsideText = (point: Vec, radius: number): Vec => {
      const { left, right, top, bottom } = contentBounds;
      let { x, y } = point;
      const inset = radius + (narrow ? 6 : 2);
      if (x > left - inset && x < right + inset && y > top - inset && y < bottom + inset) {
        const distL = Math.abs(x - left);
        const distR = Math.abs(x - right);
        const distT = Math.abs(y - top);
        const distB = Math.abs(y - bottom);
        const min = Math.min(distL, distR, distT, distB);
        if (min === distL) x = left - inset;
        else if (min === distR) x = right + inset;
        else if (min === distT) y = top - inset;
        else y = bottom + inset;
      }
      return { x, y };
    };

    /** Soft screen clamp only — never fight the path (that caused bottom-corner lag). */
    const keepOnScreen = (point: Vec): Vec => {
      const half = dragonHalf();
      const minX = half.x + (narrow ? 2 : 0);
      const maxX = stageSize.w - half.x - (narrow ? 2 : 0);
      const minY = narrow ? headerSafe + half.y + 4 : half.y;
      const maxY = stageSize.h - half.y - (narrow ? 16 : 0);
      return {
        x: clamp(point.x, minX, maxX),
        y: clamp(point.y, minY, maxY),
      };
    };

    readLayout();

    let yarnProgress = 0;
    let yarnSpin = 0;
    let yarnWobble = 0;
    let yarn = pointOnLoop(frame, yarnProgress).pos;

    const followGap = () => (narrow ? 160 : 110);
    let dragonProgress = yarnProgress - followGap();
    let dragon = pointOnLoop(frame, dragonProgress).pos;
    let facing = -1;
    let displayFacing = -1;

    let thread: Vec[] = [{ ...yarn }];
    let zigzagSign = 1;
    let raf = 0;
    let last = performance.now();
    let flapPhase = 0;
    const maxThreadPoints = () => 360;
    const yarnSpeedFor = () => (narrow ? 120 : 155);
    const dragonSpeedFor = () => (narrow ? 120 : 108);

    const place = () => {
      const dragonScale = dragonScaleFor();
      dragon = keepOnScreen(dragon);
      if (!narrow) {
        yarn = keepOnScreen(yarn);
        yarnEl.style.transform = `translate3d(${yarn.x}px, ${yarn.y}px, 0) translate(-50%, -50%) rotate(${yarnSpin}deg)`;
        pathEl.setAttribute("d", buildYarnPath(thread, false));
      } else {
        pathEl.setAttribute("d", "");
        yarnEl.style.transform = "translate3d(-9999px, -9999px, 0)";
      }
      dragonEl.style.transform = `translate3d(${dragon.x}px, ${dragon.y}px, 0) translate(-50%, -50%) scale(${facing * dragonScale}, ${dragonScale})`;
    };

    dragonEl.classList.add("is-breathing");

    if (reduced) {
      facing = -1;
      place();
      return;
    }

    const onResize = () => {
      readLayout();
    };

    // Mobile frame is viewport-stable; only refresh desktop layout on scroll
    let scrollRaf = 0;
    const onScroll = () => {
      if (narrow) return;
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        readLayout();
      });
    };

    const onEnter = () => dragonEl.classList.add("is-fierce");
    const onLeave = () => dragonEl.classList.remove("is-fierce");

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    dragonEl.addEventListener("pointerenter", onEnter);
    dragonEl.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const rawDt = (now - last) / 1000;
      // Cap dt so background tabs / jank don't teleport the chase
      const dt = Math.min(0.024, Math.max(0.001, rawDt));
      last = now;

      const yarnSpeed = yarnSpeedFor();
      const dragonSpeed = dragonSpeedFor();
      const gap = followGap();

      if (narrow) {
        // Mobile: dragon alone on a rounded margin loop (smooth bottom corners, no clamp fights)
        dragonProgress += dragonSpeed * dt;
        const cornerR = Math.min(36, (frame.right - frame.left) * 0.22, (frame.bottom - frame.top) * 0.18);
        const dragonSample = pointOnRoundedLoop(frame, dragonProgress, cornerR);
        dragon = keepOnScreen({
          x: dragonSample.pos.x,
          y: dragonSample.pos.y,
        });

        // Face along the path tangent; ease flips so corners don't hitch
        if (Math.abs(dragonSample.dir.x) > 0.2) {
          facing = dragonSample.dir.x >= 0 ? -1 : 1;
        }
        displayFacing += (facing - displayFacing) * Math.min(1, 14 * dt);

        flapPhase += (7 + clamp(dragonSpeed / 40, 0, 5)) * dt;
        dragonEl.style.setProperty("--wing-angle", `${(Math.sin(flapPhase) * 26).toFixed(1)}deg`);

        const bob = Math.sin(now / 560) * 0.8;
        const dragonScale = dragonScaleFor();
        // Keep a continuous scaleX so we never collapse through 0 at corners
        const faceScale = displayFacing >= 0 ? 1 : -1;
        pathEl.setAttribute("d", "");
        yarnEl.style.transform = "translate3d(-9999px, -9999px, 0)";
        dragonEl.style.transform = `translate3d(${dragon.x.toFixed(1)}px, ${(dragon.y + bob).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(faceScale * dragonScale).toFixed(3)}, ${dragonScale.toFixed(3)})`;

        raf = window.requestAnimationFrame(tick);
        return;
      }

      yarnProgress += yarnSpeed * dt;
      yarnWobble += dt * 6.2;
      const yarnSample = pointOnLoop(frame, yarnProgress);
      const weaveScale = 10;
      const weaveFine = 5;
      const weave = Math.sin(yarnWobble) * weaveScale + Math.sin(yarnWobble * 1.6) * weaveFine;
      yarn = keepOnScreen({
        x: yarnSample.pos.x + yarnSample.dir.y * weave,
        y: yarnSample.pos.y - yarnSample.dir.x * weave,
      });
      yarnSpin += yarnSpeed * 1.2 * dt;

      const targetDragonProgress = yarnProgress - gap;
      const catchUp = targetDragonProgress - dragonProgress;
      dragonProgress += clamp(catchUp, -dragonSpeed * dt * 1.35, dragonSpeed * dt);

      const dragonSample = pointOnLoop(frame, dragonProgress);
      const dWeave = Math.sin(yarnWobble * 0.85 + 1.1) * 6;
      dragon = keepOutsideText(
        keepOnScreen({
          x: dragonSample.pos.x + dragonSample.dir.y * dWeave,
          y: dragonSample.pos.y - dragonSample.dir.x * dWeave,
        }),
        0,
      );

      // Persist unfolded yarn with zigzag anchors
      const tip = thread[thread.length - 1];
      const zigGap = 12;
      const zigAmp = 8;
      const zigJitter = 7;
      if (!tip) {
        thread.push({ ...yarn });
      } else {
        tip.x = yarn.x;
        tip.y = yarn.y;
        const anchor = thread[thread.length - 2];
        if (!anchor || Math.hypot(yarn.x - anchor.x, yarn.y - anchor.y) > zigGap) {
          zigzagSign *= -1;
          const alongX = yarn.x - (anchor?.x ?? yarn.x);
          const alongY = yarn.y - (anchor?.y ?? yarn.y);
          const alen = Math.hypot(alongX, alongY) || 1;
          const ox = (-alongY / alen) * zigzagSign * (zigAmp + Math.random() * zigJitter);
          const oy = (alongX / alen) * zigzagSign * (zigAmp + Math.random() * zigJitter);
          thread.push(keepOnScreen({ x: yarn.x + ox, y: yarn.y + oy }));
          thread.push({ ...yarn });
          const maxPts = maxThreadPoints();
          if (thread.length > maxPts) {
            thread = thread.slice(thread.length - maxPts);
          }
        }
      }

      const pathPoints = thread;

      const dx = yarn.x - dragon.x;
      const dy = yarn.y - dragon.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dragonSample.dir.x) > 0.25) {
        facing = dragonSample.dir.x >= 0 ? -1 : 1;
      } else if (Math.abs(dx) > 4) {
        facing = dx >= 0 ? -1 : 1;
      }
      displayFacing = facing;

      const lookX = clamp((dx / dist) * facing * 3.2, -3.4, 3.4);
      const lookY = clamp((dy / dist) * 2.6, -2.8, 2.8);
      const iris = irisRef.current;
      if (iris) {
        iris.style.transform = `translate(${lookX.toFixed(2)}px, ${lookY.toFixed(2)}px)`;
      }

      flapPhase += (6.5 + clamp(dragonSpeed / 40, 0, 5)) * dt;
      dragonEl.style.setProperty("--wing-angle", `${(Math.sin(flapPhase) * 28).toFixed(1)}deg`);
      yarnEl.style.setProperty("--yarn-unravel", "1");

      const bob = Math.sin(now / 520) * 3;
      const dragonScale = dragonScaleFor();
      yarnEl.style.transform = `translate3d(${yarn.x.toFixed(1)}px, ${yarn.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${yarnSpin.toFixed(1)}deg)`;
      dragonEl.style.transform = `translate3d(${dragon.x.toFixed(1)}px, ${(dragon.y + bob).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(facing * dragonScale).toFixed(3)}, ${dragonScale.toFixed(3)})`;
      pathEl.setAttribute("d", buildYarnPath(pathPoints, false));

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      dragonEl.removeEventListener("pointerenter", onEnter);
      dragonEl.removeEventListener("pointerleave", onLeave);
    };
  }, [contentSelector, portalToBody]);

  const scene = (
    <div ref={sceneRef} className={`journal-dragon-scene ${className}`.trim()} aria-hidden="true">
      <div
        ref={dragonRef}
        className="journal-dragon"
        role="img"
        aria-label="A dragon flying through the margins of the journal post."
      >
        <DragonFigure />
      </div>

      <svg className="journal-yarn-thread-svg" aria-hidden="true">
        <path ref={pathRef} className="journal-yarn-thread-path" />
      </svg>

      <div ref={yarnRef} className="journal-yarn">
        <span className="journal-yarn-glow" />
        <span className="journal-yarn-ball">
          <svg className="journal-yarn-winding" viewBox="0 0 40 40" aria-hidden="true">
            <path
              className="journal-yarn-winding-path"
              d="M20 6c8 1 12 6 12 12s-5 12-12 13c-8 1-13-5-13-12 0-8 6-12 13-12 6 0 10 4 10 9 0 6-4 9-9 9-5 0-8-3-8-7 0-4 3-6 7-6 3 0 5 2 5 4"
            />
            <path
              className="journal-yarn-winding-path journal-yarn-winding-path--soft"
              d="M8 14c4-6 12-8 18-5 6 3 8 10 5 15-3 6-11 8-16 5"
            />
          </svg>
          <span className="journal-yarn-fiber journal-yarn-fiber--1" />
          <span className="journal-yarn-fiber journal-yarn-fiber--2" />
          <span className="journal-yarn-fiber journal-yarn-fiber--3" />
          <span className="journal-yarn-core" />
        </span>
        <span className="journal-yarn-strand journal-yarn-strand--1" />
        <span className="journal-yarn-strand journal-yarn-strand--2" />
        <span className="journal-yarn-strand journal-yarn-strand--3" />
      </div>
    </div>
  );

  if (portalToBody && typeof document !== "undefined") {
    return createPortal(scene, document.body);
  }
  return scene;
}
