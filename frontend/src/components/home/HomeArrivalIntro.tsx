import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type IntroPhase = "fly" | "open" | "letter" | "doors" | "done";

const FLY_MS = 3200;
/** flap lead-in ~0.55s + slide 1.85s */
const EMERGE_MS = 2600;
const DOOR_MS = 4600;

type LetterOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function LetterContent({ showButton, onSwoop }: { showButton: boolean; onSwoop: () => void }) {
  return (
    <>
      <div className="home-letter-scroll">
        <p className="home-letter-eyebrow">A private correspondence</p>
        <h2 className="home-letter-title">Dear You,</h2>
        <div className="home-letter-body">
          <p>
            From hereon, you enter a space devoid of any sales pitches tricking you to feel miserable about yourself.
            You&apos;ll no longer feel the burden of performance pressure or buying that one extra course to prove your
            worth to your ungrateful boss.
          </p>
          <p>
            No... you are not necessarily transcending into heaven. You are just entering the ROOM OF REQUIREMENTS on
            this boring muggle world.
          </p>
          <p>
            Since none of us made it to Hogwarts, I thought of creating a space where you might actually find what you
            truly need — random thoughts, mythological stories, some pieces on our vivid cultures... and much more.
          </p>
          <p>So, if you&apos;re ready, click the button that says &apos;SWOOPISH&apos;.</p>
        </div>
        {showButton ? (
          <button type="button" className="home-swoopish" onClick={onSwoop}>
            SWOOPISH
          </button>
        ) : null}
      </div>
      <div className="home-letter-scroll-fade" aria-hidden />
      <div className="home-letter-scroll-hint" aria-hidden>
        <span>Scroll for SWOOPISH</span>
      </div>
    </>
  );
}

export function HomeArrivalIntro({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<IntroPhase>("fly");
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState<LetterOrigin | null>(null);
  const emergingRef = useRef<HTMLArticleElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setPhase("letter");
      return;
    }

    const openTimer = window.setTimeout(() => setPhase("open"), FLY_MS);
    return () => window.clearTimeout(openTimer);
  }, [mounted]);

  useEffect(() => {
    if (phase !== "open") return;
    const letterTimer = window.setTimeout(() => {
      const node = emergingRef.current;
      if (node) {
        const rect = node.getBoundingClientRect();
        setOrigin({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
      setPhase("letter");
    }, EMERGE_MS);
    return () => window.clearTimeout(letterTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "doors") return;
    onReveal();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doneTimer = window.setTimeout(
      () => {
        setPhase("done");
        onComplete();
      },
      reducedMotion ? 500 : DOOR_MS,
    );
    return () => window.clearTimeout(doneTimer);
  }, [phase, onReveal, onComplete]);

  if (!mounted || phase === "done") return null;

  const showScene = phase === "fly" || phase === "open" || phase === "letter";
  const showDoors = phase === "doors";
  const swoop = () => setPhase("doors");

  const enlargeStyle = origin
    ? ({
        ["--letter-from-top" as string]: `${origin.top}px`,
        ["--letter-from-left" as string]: `${origin.left}px`,
        ["--letter-from-width" as string]: `${origin.width}px`,
        ["--letter-from-height" as string]: `${origin.height}px`,
      } as CSSProperties)
    : undefined;

  return createPortal(
    <div
      className={`home-arrival ${showDoors ? "is-doors" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome letter"
    >
      {!showDoors ? <div className="home-arrival-sky" aria-hidden /> : null}

      {showScene ? (
        <div
          className={[
            "home-arrival-stage",
            phase === "fly" ? "is-flying" : "",
            phase === "open" ? "is-opening" : "",
            phase === "letter" ? "is-letter-focus" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="home-arrival-caption" aria-hidden>
            An owl approaches…
          </p>

          <div className="home-envelope">
            <div className="home-envelope-back" />

            <div className="home-envelope-slot">
              {phase === "open" ? (
                <article ref={emergingRef} className="home-letter is-emerging">
                  <LetterContent showButton={false} onSwoop={swoop} />
                </article>
              ) : null}
            </div>

            <div className="home-envelope-body">
              <div className="home-envelope-lining" />
              <p className="home-envelope-address">
                To the Reader
                <br />
                Somewhere in the Muggle World
              </p>
            </div>

            <div className="home-envelope-flap">
              <div className="home-envelope-flap-face" />
              <div className="home-wax-seal">
                <span>I&amp;V</span>
                <small>Ink &amp; Voltage</small>
              </div>
            </div>
          </div>

          {phase === "letter" ? (
            <article className="home-letter is-enlarged" style={enlargeStyle}>
              <LetterContent showButton onSwoop={swoop} />
            </article>
          ) : null}
        </div>
      ) : null}

      {showDoors ? (
        <div className="home-castle-doors is-opening" aria-hidden>
          <div className="home-castle-door home-castle-door-left">
            <div className="home-castle-door-panel">
              <span className="home-castle-planks" />
              <span className="home-castle-band home-castle-band-top" />
              <span className="home-castle-band home-castle-band-mid" />
              <span className="home-castle-band home-castle-band-bot" />
              <span className="home-castle-studs" />
              <span className="home-castle-crest" />
              <span className="home-castle-knocker" />
              <span className="home-castle-hinge home-castle-hinge-top" />
              <span className="home-castle-hinge home-castle-hinge-mid" />
              <span className="home-castle-hinge home-castle-hinge-bot" />
            </div>
          </div>

          <div className="home-castle-door home-castle-door-right">
            <div className="home-castle-door-panel">
              <span className="home-castle-planks" />
              <span className="home-castle-band home-castle-band-top" />
              <span className="home-castle-band home-castle-band-mid" />
              <span className="home-castle-band home-castle-band-bot" />
              <span className="home-castle-studs" />
              <span className="home-castle-crest" />
              <span className="home-castle-knocker" />
              <span className="home-castle-hinge home-castle-hinge-top" />
              <span className="home-castle-hinge home-castle-hinge-mid" />
              <span className="home-castle-hinge home-castle-hinge-bot" />
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
