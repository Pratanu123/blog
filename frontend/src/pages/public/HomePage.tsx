import { useCallback, useEffect, useState } from "react";
import { publicService } from "../../services/public";
import { Spinner } from "../../components/ui/Spinner";
import { HomeArrivalIntro } from "../../components/home/HomeArrivalIntro";
import { HomeWelcomeHall } from "../../components/home/HomeWelcomeHall";

const ARRIVAL_SEEN_KEY = "inkvoltage.arrival.seen";

function hasSeenArrival(): boolean {
  try {
    return sessionStorage.getItem(ARRIVAL_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markArrivalSeen() {
  try {
    sessionStorage.setItem(ARRIVAL_SEEN_KEY, "1");
  } catch {
    // ignore private-mode / blocked storage
  }
}

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(() => hasSeenArrival());
  const [hallRevealed, setHallRevealed] = useState(() => hasSeenArrival());

  useEffect(() => {
    publicService
      .homepage()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const revealHall = useCallback(() => setHallRevealed(true), []);
  const finishIntro = useCallback(() => {
    markArrivalSeen();
    setIntroDone(true);
    setHallRevealed(true);
  }, []);

  return (
    <div className="home-page-shell">
      {!introDone ? <HomeArrivalIntro onReveal={revealHall} onComplete={finishIntro} /> : null}

      {loading && !hallRevealed ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner label="Opening the journal" />
        </div>
      ) : (
        <HomeWelcomeHall revealed={hallRevealed || introDone} />
      )}
    </div>
  );
}
