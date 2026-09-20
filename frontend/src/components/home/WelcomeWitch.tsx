import { RefObject, useState } from "react";

type WelcomeWitchProps = {
  className?: string;
  tipRef?: RefObject<HTMLSpanElement | null>;
  forceCasting?: boolean;
};

export function WelcomeWitch({ className = "", tipRef, forceCasting = false }: WelcomeWitchProps) {
  const [casting, setCasting] = useState(false);
  const isCasting = casting || forceCasting;

  return (
    <button
      type="button"
      className={`home-welcome-witch ${isCasting ? "is-casting" : ""} ${className}`.trim()}
      aria-label="A witch holding a lantern. Hover or tap to reveal her wand."
      aria-pressed={isCasting}
      onClick={() => setCasting((current) => !current)}
      onBlur={() => setCasting(false)}
    >
      <span className="home-welcome-witch-figure">
        <span className="home-welcome-witch-leg home-welcome-witch-leg-back">
          <span className="home-welcome-witch-thigh" />
          <span className="home-welcome-witch-shin" />
          <span className="home-welcome-witch-boot" />
        </span>
        <span className="home-welcome-witch-leg home-welcome-witch-leg-front">
          <span className="home-welcome-witch-thigh" />
          <span className="home-welcome-witch-shin" />
          <span className="home-welcome-witch-boot" />
        </span>

        <span className="home-welcome-witch-skirt" />
        <span className="home-welcome-witch-skirt-fold" />
        <span className="home-welcome-witch-torso" />
        <span className="home-welcome-witch-belt" />

        <span className="home-welcome-witch-arm home-welcome-witch-arm-back">
          <span className="home-welcome-witch-upper-arm" />
          <span className="home-welcome-witch-forearm" />
          <span className="home-welcome-witch-hand">
            <span className="home-welcome-witch-lantern">
              <span className="home-welcome-witch-lantern-handle" />
              <span className="home-welcome-witch-lantern-roof" />
              <span className="home-welcome-witch-lantern-cage" />
              <span className="home-welcome-witch-lantern-pane" />
              <span className="home-welcome-witch-lantern-flame" />
              <span className="home-welcome-witch-lantern-base" />
              <span className="home-welcome-witch-lantern-glow" />
            </span>
          </span>
        </span>

        <span className="home-welcome-witch-hair-back" />
        <span className="home-welcome-witch-neck" />
        <span className="home-welcome-witch-head" />
        <span className="home-welcome-witch-ear" />
        <span className="home-welcome-witch-cheek" />
        <span className="home-welcome-witch-eye">
          <span className="home-welcome-witch-eye-white" />
          <span className="home-welcome-witch-eye-iris" />
          <span className="home-welcome-witch-eye-pupil" />
          <span className="home-welcome-witch-eye-shine" />
          <span className="home-welcome-witch-eye-lash" />
        </span>
        <span className="home-welcome-witch-brow" />
        <span className="home-welcome-witch-nose" />
        <span className="home-welcome-witch-lips" />
        <span className="home-welcome-witch-chin" />
        <span className="home-welcome-witch-hair-top" />
        <span className="home-welcome-witch-hair-lock" />

        <span className="home-welcome-witch-hat-cone" />
        <span className="home-welcome-witch-hat-brim" />
        <span className="home-welcome-witch-hat-band" />

        <span className="home-welcome-witch-arm home-welcome-witch-arm-front">
          <span className="home-welcome-witch-upper-arm" />
          <span className="home-welcome-witch-forearm" />
          <span className="home-welcome-witch-hand">
            <span className="home-welcome-witch-wand">
              <span className="home-welcome-witch-wand-shaft" />
              <span className="home-welcome-witch-wand-tip">
                <span className="home-welcome-witch-wand-origin" ref={tipRef} />
              </span>
              <span className="home-welcome-witch-wand-glow" />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
