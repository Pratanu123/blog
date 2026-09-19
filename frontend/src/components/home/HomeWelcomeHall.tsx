import { Link } from "react-router-dom";

const destinations = [
  { to: "/blog", label: "To the journal", hint: "Essays, systems, and long-form notes" },
  { to: "/photography", label: "To the photos", hint: "Light, place, and quiet frames" },
  { to: "/painting", label: "To the paintings", hint: "Colour, texture, and hand-made marks" },
  { to: "/about", label: "To the blog inspiration", hint: "Why this room exists" },
  { to: "/about-me", label: "To the about me", hint: "A puzzle, a letter, a person" },
] as const;

export function HomeWelcomeHall({ revealed }: { revealed: boolean }) {
  return (
    <section className={`home-welcome ${revealed ? "is-revealed" : ""}`} aria-hidden={!revealed}>
      <div className="home-welcome-banner">
        <p className="home-welcome-eyebrow">You have arrived</p>
        <h1 className="home-welcome-title">Welcome to Ink &amp; Voltage</h1>
        <p className="home-welcome-sub">Choose a door. Each one leads somewhere the algorithm cannot invent for you.</p>
      </div>

      <div className="home-welcome-grid">
        {destinations.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className="home-welcome-card"
            style={{ ["--card-i" as string]: index }}
            tabIndex={revealed ? 0 : -1}
          >
            <span className="home-welcome-card-label">{item.label}</span>
            <span className="home-welcome-card-hint">{item.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
