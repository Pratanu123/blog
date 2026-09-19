const tallTrees = [
  { side: "left", x: "1%", h: "96%", delay: 0 },
  { side: "left", x: "7%", h: "84%", delay: 0.6 },
  { side: "left", x: "13%", h: "90%", delay: 1.2 },
  { side: "left", x: "19%", h: "78%", delay: 1.8 },
  { side: "left", x: "25%", h: "86%", delay: 2.3 },
  { side: "right", x: "72%", h: "82%", delay: 0.4 },
  { side: "right", x: "78%", h: "92%", delay: 1.1 },
  { side: "right", x: "84%", h: "80%", delay: 1.7 },
  { side: "right", x: "90%", h: "95%", delay: 0.8 },
  { side: "right", x: "96%", h: "76%", delay: 2.1 },
  { side: "back", x: "30%", h: "58%", delay: 0.5 },
  { side: "back", x: "38%", h: "64%", delay: 1.4 },
  { side: "back", x: "46%", h: "55%", delay: 0.9 },
  { side: "back", x: "54%", h: "66%", delay: 1.9 },
  { side: "back", x: "62%", h: "60%", delay: 0.2 },
  { side: "back", x: "68%", h: "57%", delay: 2.4 },
] as const;

export function WelcomeForest() {
  return (
    <div className="home-welcome-forest" aria-hidden>
      <div className="home-welcome-canopy" />
      <div className="home-welcome-ground" />
      <div className="home-welcome-mist home-welcome-mist-a" />
      <div className="home-welcome-mist home-welcome-mist-b" />

      <div className="home-welcome-grove">
        {tallTrees.map((tree, index) => (
          <div
            key={`${tree.side}-${index}`}
            className={`home-welcome-tree home-welcome-tree-${tree.side}`}
            style={{
              ["--tree-x" as string]: tree.x,
              ["--tree-h" as string]: tree.h,
              ["--tree-d" as string]: tree.delay,
            }}
          >
            <span className="home-welcome-tree-trunk" />
            <span className="home-welcome-tree-foliage home-welcome-tree-foliage-a" />
            <span className="home-welcome-tree-foliage home-welcome-tree-foliage-b" />
            <span className="home-welcome-tree-foliage home-welcome-tree-foliage-c" />
            <span className="home-welcome-tree-fruit home-welcome-tree-fruit-a" />
            <span className="home-welcome-tree-fruit home-welcome-tree-fruit-b" />
            <span className="home-welcome-tree-fruit home-welcome-tree-fruit-c" />
            <span className="home-welcome-tree-fruit home-welcome-tree-fruit-d" />
            <span
              className="home-welcome-fall-leaf"
              style={{ ["--fall-i" as string]: 0, ["--fall-x" as string]: "32%" }}
            />
            <span
              className="home-welcome-fall-fruit"
              style={{ ["--fall-i" as string]: 1, ["--fall-x" as string]: "58%" }}
            />
            <span
              className="home-welcome-fall-leaf"
              style={{ ["--fall-i" as string]: 2, ["--fall-x" as string]: "46%" }}
            />
          </div>
        ))}
      </div>

      <div className="home-welcome-fireflies">
        <span style={{ ["--fx" as string]: 0 }} />
        <span style={{ ["--fx" as string]: 1 }} />
        <span style={{ ["--fx" as string]: 2 }} />
        <span style={{ ["--fx" as string]: 3 }} />
        <span style={{ ["--fx" as string]: 4 }} />
        <span style={{ ["--fx" as string]: 5 }} />
        <span style={{ ["--fx" as string]: 6 }} />
        <span style={{ ["--fx" as string]: 7 }} />
      </div>
    </div>
  );
}
