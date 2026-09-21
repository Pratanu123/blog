import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { SiteSettings } from "../../types";
import { welcomeDoors } from "../../utils/siteContent";
import { WelcomeWitch } from "./WelcomeWitch";
import { WelcomeForest } from "./WelcomeForest";
import { InkVoltageMark } from "../brand/InkVoltageMark";
import { withBrandAmps } from "../brand/BrandAmp";

const CHARM_CYCLE_MS = 5000;

const parrots = [
  { tone: "scarlet", delay: 0 },
  { tone: "azure", delay: -3.8 },
  { tone: "lime", delay: -7.2 },
  { tone: "gold", delay: -10.6 },
] as const;

export function HomeWelcomeHall({ revealed }: { revealed: boolean }) {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const doors = welcomeDoors(settings);
  const eyebrow = settings.welcome_eyebrow?.trim() || "You have arrived";
  const title = settings.welcome_title?.trim() || "Welcome to Ink & Voltage";
  const subtitle =
    settings.welcome_subtitle?.trim() ||
    "Choose a door. Each one leads somewhere the algorithm cannot invent for you.";

  const stageRef = useRef<HTMLDivElement>(null);
  const wandTipRef = useRef<HTMLSpanElement>(null);
  const contactBtnRef = useRef<HTMLAnchorElement>(null);
  const charmRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const splashRef = useRef<HTMLSpanElement>(null);

  const [charmKey, setCharmKey] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const [forceCasting, setForceCasting] = useState(false);

  const mapCharmTrajectory = useCallback(() => {
    const stage = stageRef.current;
    const tip = wandTipRef.current;
    const button = contactBtnRef.current;
    const charm = charmRef.current;
    if (!stage || !tip || !button || !charm) return;

    const stageBox = stage.getBoundingClientRect();
    const tipBox = tip.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();

    // Origin sits on the outer edge of the glowing tip
    const startX = tipBox.left + tipBox.width * 0.5 - stageBox.left;
    const startY = tipBox.top + tipBox.height * 0.5 - stageBox.top;
    const endX = buttonBox.left + buttonBox.width * 0.5 - stageBox.left;
    const endY = buttonBox.top + buttonBox.height * 0.45 - stageBox.top;

    const mid1X = startX + (endX - startX) * 0.35;
    const mid1Y = startY + (endY - startY) * 0.25 - 48;
    const mid2X = startX + (endX - startX) * 0.7;
    const mid2Y = startY + (endY - startY) * 0.58 - 14;

    const apply = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--charm-x0", `${startX}px`);
      el.style.setProperty("--charm-y0", `${startY}px`);
      el.style.setProperty("--charm-x1", `${mid1X}px`);
      el.style.setProperty("--charm-y1", `${mid1Y}px`);
      el.style.setProperty("--charm-x2", `${mid2X}px`);
      el.style.setProperty("--charm-y2", `${mid2Y}px`);
      el.style.setProperty("--charm-x3", `${endX}px`);
      el.style.setProperty("--charm-y3", `${endY}px`);
    };

    apply(charm);
    apply(trailRef.current);
    apply(splashRef.current);
  }, []);

  useEffect(() => {
    if (!revealed) return;

    mapCharmTrajectory();
    const onResize = () => mapCharmTrajectory();
    window.addEventListener("resize", onResize);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(mapCharmTrajectory) : null;
    if (stageRef.current) ro?.observe(stageRef.current);
    if (contactBtnRef.current) ro?.observe(contactBtnRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [mapCharmTrajectory, revealed]);

  // Remeasure from tip after wand extends / charm remounts (launch window only)
  useLayoutEffect(() => {
    if (!revealed || charmKey === 0) return;

    let raf = 0;
    let frames = 0;
    const track = () => {
      mapCharmTrajectory();
      frames += 1;
      // Stick to the tip for the first ~150ms so emit matches the glowing orb
      if (frames < 10) {
        raf = window.requestAnimationFrame(track);
      }
    };
    raf = window.requestAnimationFrame(track);

    return () => window.cancelAnimationFrame(raf);
  }, [charmKey, mapCharmTrajectory, revealed]);

  useEffect(() => {
    if (!revealed) return;

    let cancelled = false;
    const timers: number[] = [];

    const runCycle = () => {
      if (cancelled) return;
      setGlowing(false);
      setForceCasting(true);

      // Wand extend (~0.45s) then emit from the tip
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setCharmKey((k) => k + 1);
        }, 520),
      );

      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setGlowing(true);
          timers.push(
            window.setTimeout(() => {
              if (!cancelled) setGlowing(false);
            }, 1100),
          );
        }, 520 + Math.round(CHARM_CYCLE_MS * 0.54)),
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setForceCasting(false);
        }, 520 + Math.round(CHARM_CYCLE_MS * 0.62)),
      );

      timers.push(window.setTimeout(runCycle, CHARM_CYCLE_MS + 700));
    };

    timers.push(window.setTimeout(runCycle, 1100));

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [revealed]);

  return (
    <section className={`home-welcome ${revealed ? "is-revealed" : ""}`} aria-hidden={!revealed}>
      <WelcomeForest />

      <WelcomeWitch tipRef={wandTipRef} forceCasting={forceCasting} />

      <div className="home-welcome-banner">
        <InkVoltageMark className="home-welcome-brand-mark" size={116} />
        <p className="home-welcome-eyebrow">{eyebrow}</p>
        <h1 className="home-welcome-title">{withBrandAmps(title)}</h1>
        <p className="home-welcome-sub">{subtitle}</p>
      </div>

      <div className="home-welcome-grid">
        {doors.map((item, index) => (
          <Link
            key={`${item.to}-${item.label}-${index}`}
            to={item.to}
            className="home-welcome-card"
            style={{ ["--card-i" as string]: index }}
            tabIndex={revealed ? 0 : -1}
          >
            <span className="home-welcome-card-rune" aria-hidden />
            <span className="home-welcome-card-label">{item.label}</span>
            {item.hint ? <span className="home-welcome-card-hint">{item.hint}</span> : null}
          </Link>
        ))}
      </div>

      <div className="home-welcome-contact">
        <Link
          ref={contactBtnRef}
          to="/contact"
          className={`home-welcome-contact-btn${glowing ? " is-charm-lit" : ""}`}
          tabIndex={revealed ? 0 : -1}
        >
          Contact me
        </Link>
      </div>

      <div className="home-welcome-charm-layer" ref={stageRef} aria-hidden="true">
        {revealed && charmKey > 0 ? (
          <>
            <span key={`charm-${charmKey}`} className="home-welcome-charm" ref={charmRef} />
            <span key={`trail-${charmKey}`} className="home-welcome-charm-trail" ref={trailRef} />
            <span key={`splash-${charmKey}`} className="home-welcome-charm-splash" ref={splashRef} />
          </>
        ) : null}
      </div>

      <div className="home-welcome-birds" aria-hidden>
        {parrots.map((parrot) => (
          <span
            key={parrot.tone}
            className={`home-welcome-parrot home-welcome-parrot-${parrot.tone}`}
            style={{ ["--parrot-d" as string]: parrot.delay }}
          >
            <span className="home-welcome-parrot-tail" />
            <span className="home-welcome-parrot-body" />
            <span className="home-welcome-parrot-wing" />
            <span className="home-welcome-parrot-head" />
            <span className="home-welcome-parrot-beak" />
          </span>
        ))}
      </div>
    </section>
  );
}
