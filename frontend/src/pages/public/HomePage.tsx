import { useCallback, useEffect, useState } from "react";
import { publicService } from "../../services/public";
import { Spinner } from "../../components/ui/Spinner";
import { HomeArrivalIntro } from "../../components/home/HomeArrivalIntro";
import { HomeWelcomeHall } from "../../components/home/HomeWelcomeHall";

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [hallRevealed, setHallRevealed] = useState(false);

  useEffect(() => {
    publicService
      .homepage()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const revealHall = useCallback(() => setHallRevealed(true), []);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <div className="home-page-shell">
      {!introDone ? <HomeArrivalIntro onReveal={revealHall} onComplete={finishIntro} /> : null}

      {loading && !hallRevealed ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner label="Opening the journal" />
        </div>
      ) : (
        <HomeWelcomeHall revealed={hallRevealed} />
      )}
    </div>
  );
}
