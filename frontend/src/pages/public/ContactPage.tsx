import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { publicService } from "../../services/public";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import type { SiteSettings } from "../../types";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { WelcomeForest } from "../../components/home/WelcomeForest";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { trackEvent } from "../../utils/analytics";

const SPIT_CYCLE_MS = 5000;

const contactParrots = [
  { tone: "scarlet", delay: 0, duration: 13, top: "26%", ya: "0px", yb: "14px", yc: "-10px" },
  { tone: "azure", delay: 2.2, duration: 15, top: "38%", ya: "6px", yb: "-12px", yc: "16px" },
  { tone: "lime", delay: 4.8, duration: 12.5, top: "52%", ya: "-4px", yb: "18px", yc: "-6px" },
  { tone: "gold", delay: 7.4, duration: 14.5, top: "33%", ya: "10px", yb: "-8px", yc: "12px" },
  { tone: "scarlet", delay: 9.6, duration: 11.5, top: "60%", ya: "2px", yb: "-14px", yc: "8px", size: "sm" },
  { tone: "azure", delay: 11.2, duration: 16, top: "44%", ya: "-8px", yb: "12px", yc: "-4px", size: "sm" },
] as const;

export function ContactPage() {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [spitKey, setSpitKey] = useState(0);

  const title = settings.contact_title?.trim() || "Write to us";
  const intro = settings.contact_intro?.trim() || "";
  const submitLabel = settings.contact_submit_label?.trim() || "Send";
  const successMessage = settings.contact_success_message?.trim() || "Message sent to the newsroom.";

  const stageRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spitRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const splashRef = useRef<HTMLSpanElement>(null);

  const mapSpitTrajectory = useCallback(() => {
    const stage = stageRef.current;
    const mouth = mouthRef.current;
    const button = buttonRef.current;
    const spit = spitRef.current;
    if (!stage || !mouth || !button || !spit) return;

    const stageBox = stage.getBoundingClientRect();
    const mouthBox = mouth.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();

    const startX = mouthBox.left + mouthBox.width * 0.1 - stageBox.left;
    const startY = mouthBox.top + mouthBox.height * 0.75 - stageBox.top;
    const endX = buttonBox.left + buttonBox.width * 0.5 - stageBox.left;
    const endY = buttonBox.top + buttonBox.height * 0.45 - stageBox.top;

    const mid1X = startX + (endX - startX) * 0.38;
    const mid1Y = startY + (endY - startY) * 0.28 - 56;
    const mid2X = startX + (endX - startX) * 0.72;
    const mid2Y = startY + (endY - startY) * 0.62 - 18;

    const apply = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--spit-x0", `${startX}px`);
      el.style.setProperty("--spit-y0", `${startY}px`);
      el.style.setProperty("--spit-x1", `${mid1X}px`);
      el.style.setProperty("--spit-y1", `${mid1Y}px`);
      el.style.setProperty("--spit-x2", `${mid2X}px`);
      el.style.setProperty("--spit-y2", `${mid2Y}px`);
      el.style.setProperty("--spit-x3", `${endX}px`);
      el.style.setProperty("--spit-y3", `${endY}px`);
    };

    apply(spit);
    apply(trailRef.current);
    apply(splashRef.current);
  }, []);

  useEffect(() => {
    mapSpitTrajectory();
    const onResize = () => mapSpitTrajectory();
    window.addEventListener("resize", onResize);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(mapSpitTrajectory) : null;
    if (stageRef.current) ro?.observe(stageRef.current);
    if (buttonRef.current) ro?.observe(buttonRef.current);

    const t1 = window.setTimeout(mapSpitTrajectory, 80);
    const t2 = window.setTimeout(mapSpitTrajectory, 400);

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [mapSpitTrajectory]);

  useLayoutEffect(() => {
    mapSpitTrajectory();
  }, [spitKey, mapSpitTrajectory]);

  useEffect(() => {
    let cancelled = false;
    let glowOn: number | undefined;
    let glowOff: number | undefined;
    let loop: number | undefined;

    const runCycle = () => {
      if (cancelled) return;
      setGlowing(false);
      setSpitKey((k) => k + 1);

      glowOn = window.setTimeout(() => {
        if (!cancelled) setGlowing(true);
        glowOff = window.setTimeout(() => {
          if (!cancelled) setGlowing(false);
        }, 1100);
      }, Math.round(SPIT_CYCLE_MS * 0.54));

      loop = window.setTimeout(runCycle, SPIT_CYCLE_MS);
    };

    runCycle();

    return () => {
      cancelled = true;
      window.clearTimeout(glowOn);
      window.clearTimeout(glowOff);
      window.clearTimeout(loop);
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await publicService.contact(form);
      setForm({ name: "", email: "", message: "" });
      trackEvent("contact_submit", { content_type: "contact" });
      push(successMessage);
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-forest" aria-hidden="true">
        <WelcomeForest />
      </div>

      <div className="contact-birds" aria-hidden="true">
        {contactParrots.map((parrot, index) => (
          <span
            key={`${parrot.tone}-${index}`}
            className={`contact-parrot home-welcome-parrot-${parrot.tone}${"size" in parrot && parrot.size === "sm" ? " contact-parrot--sm" : ""}`}
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

      <div className="contact-page-inner" ref={stageRef}>
        <div className="contact-form-panel">
          <div className="mb-6">
            <PageBackLink to="/" label="Back to Home" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">{title}</h1>
          {intro ? <p className="mt-3 max-w-xl text-base leading-7 text-ink-700 dark:text-paper-100/75">{intro}</p> : null}
          <form onSubmit={onSubmit} className="contact-form mt-8 space-y-4">
            <div className="contact-field-card">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="contact-field-card">
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="contact-field-card">
              <Field label="Message">
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </Field>
            </div>
            <Button
              ref={buttonRef}
              type="submit"
              className={`contact-send-btn${glowing ? " is-spit-lit" : ""}`}
              disabled={sending}
            >
              {sending ? "Sending…" : submitLabel}
            </Button>
          </form>
        </div>

        <span key={`spit-${spitKey}`} className="contact-llama-spit" ref={spitRef} aria-hidden="true" />
        <span key={`trail-${spitKey}`} className="contact-llama-spit-trail" ref={trailRef} aria-hidden="true" />
        <span key={`splash-${spitKey}`} className="contact-llama-splash" ref={splashRef} aria-hidden="true" />
      </div>

      <div className="contact-llama-stage" aria-hidden="true">
        <span className="contact-llama-ground" />
        <div className="contact-llama" role="img" aria-label="A llama that spits toward the send button">
          <span className="contact-llama-leg contact-llama-leg--back" />
          <span className="contact-llama-leg contact-llama-leg--mid-back" />
          <span className="contact-llama-leg contact-llama-leg--mid-front" />
          <span className="contact-llama-leg contact-llama-leg--front" />
          <span className="contact-llama-body" />
          <span className="contact-llama-wool" />
          <span className="contact-llama-neck" />
          <span className="contact-llama-head">
            <span className="contact-llama-ear contact-llama-ear--back" />
            <span className="contact-llama-ear contact-llama-ear--front" />
            <span className="contact-llama-snout" />
            <span className="contact-llama-nose" />
            <span className="contact-llama-eye">
              <span className="contact-llama-eye-shine" />
            </span>
            <span className="contact-llama-mouth" ref={mouthRef} />
          </span>
          <span className="contact-llama-tail" />
        </div>
      </div>
    </div>
  );
}
