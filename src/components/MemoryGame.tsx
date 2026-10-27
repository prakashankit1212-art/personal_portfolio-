import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";

type Difficulty = "easy" | "medium" | "hard";
type MemoryPhase = "select" | "playing" | "victory";

type Technology = {
  key: string;
  label: string;
  icon: string;
};

type MemoryCard = Technology & {
  id: string;
  copy: number;
  revealed: boolean;
  matched: boolean;
};

type DifficultyConfig = {
  label: string;
  rows: number;
  columns: number;
  pairs: number;
  description: string;
};

type BestResult = {
  score: number;
  time: number;
  moves: number;
};

type MemoryGameProps = {
  isActive?: boolean;
};

const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy", rows: 4, columns: 4, pairs: 8, description: "A compact warm-up for new operators." },
  medium: { label: "Medium", rows: 6, columns: 6, pairs: 18, description: "More tech, more memory, more careful scanning." },
  hard: { label: "Hard", rows: 10, columns: 10, pairs: 50, description: "The full technology archive. Scroll on small screens." },
};

const technologies: Technology[] = [
  { key: "javascript", label: "JavaScript", icon: "JS" },
  { key: "typescript", label: "TypeScript", icon: "TS" },
  { key: "react", label: "React", icon: "R" },
  { key: "python", label: "Python", icon: "PY" },
  { key: "node", label: "Node.js", icon: "N" },
  { key: "git", label: "Git", icon: "GIT" },
  { key: "sql", label: "SQL", icon: "SQL" },
  { key: "html", label: "HTML", icon: "<>" },
  { key: "css", label: "CSS", icon: "#" },
  { key: "express", label: "Express.js", icon: "EX" },
  { key: "vite", label: "Vite", icon: "V" },
  { key: "postgresql", label: "PostgreSQL", icon: "PG" },
  { key: "mongodb", label: "MongoDB", icon: "DB" },
  { key: "rest", label: "REST API", icon: "API" },
  { key: "socketio", label: "Socket.IO", icon: "IO" },
  { key: "docker", label: "Docker", icon: "DO" },
  { key: "linux", label: "Linux", icon: "LIN" },
  { key: "github", label: "GitHub", icon: "GH" },
  { key: "c", label: "C", icon: "C" },
  { key: "cpp", label: "C++", icon: "C++" },
  { key: "java", label: "Java", icon: "JV" },
  { key: "go", label: "Go", icon: "GO" },
  { key: "rust", label: "Rust", icon: "RS" },
  { key: "php", label: "PHP", icon: "PHP" },
  { key: "next", label: "Next.js", icon: "NX" },
  { key: "vue", label: "Vue", icon: "VU" },
  { key: "angular", label: "Angular", icon: "NG" },
  { key: "tailwind", label: "Tailwind CSS", icon: "TW" },
  { key: "firebase", label: "Firebase", icon: "FB" },
  { key: "redis", label: "Redis", icon: "RD" },
  { key: "graphql", label: "GraphQL", icon: "GQL" },
  { key: "json", label: "JSON", icon: "{}" },
  { key: "xml", label: "XML", icon: "XML" },
  { key: "bash", label: "Bash", icon: "SH" },
  { key: "powershell", label: "PowerShell", icon: "PS" },
  { key: "npm", label: "npm", icon: "NPM" },
  { key: "pnpm", label: "pnpm", icon: "PN" },
  { key: "jest", label: "Jest", icon: "J" },
  { key: "playwright", label: "Playwright", icon: "PW" },
  { key: "vitest", label: "Vitest", icon: "VT" },
  { key: "flask", label: "Flask", icon: "FL" },
  { key: "django", label: "Django", icon: "DJ" },
  { key: "fastapi", label: "FastAPI", icon: "FA" },
  { key: "tensorflow", label: "TensorFlow", icon: "TF" },
  { key: "pytorch", label: "PyTorch", icon: "PT" },
  { key: "machine-learning", label: "Machine Learning", icon: "ML" },
  { key: "neural-networks", label: "Neural Networks", icon: "NN" },
  { key: "data-science", label: "Data Science", icon: "DS" },
  { key: "cloud", label: "Cloud Computing", icon: "CLD" },
  { key: "kubernetes", label: "Kubernetes", icon: "K8S" },
];

const BEST_KEYS: Record<Difficulty, string> = {
  easy: "ankit-exe-memory-best-easy",
  medium: "ankit-exe-memory-best-medium",
  hard: "ankit-exe-memory-best-hard",
};

function readBestResult(difficulty: Difficulty): BestResult | null {
  try {
    const raw = window.localStorage.getItem(BEST_KEYS[difficulty]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BestResult>;
    if (typeof parsed.score !== "number" || typeof parsed.time !== "number" || typeof parsed.moves !== "number") return null;
    return { score: parsed.score, time: parsed.time, moves: parsed.moves };
  } catch {
    return null;
  }
}

function writeBestResult(difficulty: Difficulty, result: BestResult) {
  try {
    window.localStorage.setItem(BEST_KEYS[difficulty], JSON.stringify(result));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createDeck(difficulty: Difficulty, roundId: number, previousSignature: string | null) {
  const config = difficultyConfigs[difficulty];
  const selected = technologies.slice(0, config.pairs);
  let deck: MemoryCard[] = [];
  let signature = "";
  let attempts = 0;

  do {
    deck = shuffle(selected.flatMap((technology) => [0, 1].map((copy) => ({
      ...technology,
      id: `${technology.key}-${copy}-${roundId}`,
      copy,
      revealed: false,
      matched: false,
    }))));
    signature = deck.map((card) => card.key).join("|");
    attempts += 1;
  } while (signature === previousSignature && attempts < 12);

  return { deck, signature };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function calculateScore(config: DifficultyConfig, elapsed: number, moves: number) {
  const pairPoints = config.pairs * 100;
  const timeBonus = Math.max(0, config.pairs * 22 - elapsed * 2);
  const moveBonus = Math.max(0, config.pairs * 30 - Math.max(0, moves - config.pairs) * 4);
  return pairPoints + timeBonus + moveBonus;
}

export default function MemoryGame({ isActive = true }: MemoryGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<MemoryPhase>("select");
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [bestResults, setBestResults] = useState<Record<Difficulty, BestResult | null>>(() => ({
    easy: readBestResult("easy"),
    medium: readBestResult("medium"),
    hard: readBestResult("hard"),
  }));
  const [isResolving, setIsResolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Choose a difficulty to initialize the memory grid.");
  const [roundId, setRoundId] = useState(0);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const inactiveSinceRef = useRef<number | null>(null);
  const mismatchTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const victoryRef = useRef<HTMLDivElement>(null);
  const resolvingRef = useRef(false);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const config = difficultyConfigs[difficulty];
  const bestResult = bestResults[difficulty];
  const progress = config.pairs === 0 ? 0 : Math.round((matchedPairs / config.pairs) * 100);

  const clearMismatchTimer = () => {
    if (mismatchTimerRef.current !== null) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
  };

  useEffect(() => () => {
    clearMismatchTimer();
    if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (!isActive) {
      inactiveSinceRef.current ??= performance.now();
      return;
    }
    if (inactiveSinceRef.current !== null && startedAtRef.current !== null) {
      startedAtRef.current += performance.now() - inactiveSinceRef.current;
      inactiveSinceRef.current = null;
    }
    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;
      const nextElapsed = Math.floor((performance.now() - startedAtRef.current) / 1000);
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
    }, 250);
    return () => window.clearInterval(interval);
  }, [phase, isActive, roundId]);

  useEffect(() => {
    if (phase === "victory") victoryRef.current?.focus();
  }, [phase]);

  const finishRound = (nextMoves: number) => {
    const finalElapsed = startedAtRef.current === null
      ? elapsedRef.current
      : Math.floor((performance.now() - startedAtRef.current) / 1000);
    elapsedRef.current = finalElapsed;
    setElapsed(finalElapsed);
    const score = calculateScore(config, finalElapsed, nextMoves);
    const newBest = bestResult === null || score > bestResult.score;
    const nextBest = bestResult === null || score > bestResult.score
      ? { score, time: finalElapsed, moves: nextMoves }
      : bestResult;
    setIsNewBest(newBest);
    setFinalScore(score);
    setBestResults((current) => ({ ...current, [difficulty]: nextBest }));
    if (newBest) writeBestResult(difficulty, nextBest);
    setPhase("victory");
    setStatusMessage(`Archive complete. ${config.pairs} pairs matched.`);
  };

  const startRound = (nextDifficulty: Difficulty = difficulty) => {
    clearMismatchTimer();
    resolvingRef.current = false;
    setIsResolving(false);
    setDifficulty(nextDifficulty);
    setMatchedPairs(0);
    setSelectedIndices([]);
    setMoves(0);
    elapsedRef.current = 0;
    setElapsed(0);
    setFinalScore(0);
    setIsNewBest(false);
    startedAtRef.current = performance.now();
    inactiveSinceRef.current = null;
    const nextRoundId = roundId + 1;
    const nextDeck = createDeck(nextDifficulty, nextRoundId, lastSignature);
    setRoundId(nextRoundId);
    setLastSignature(nextDeck.signature);
    setCards(nextDeck.deck);
    setPhase("playing");
    setStatusMessage("Flip two cards. Matching technologies stay online.");
    if (focusTimerRef.current !== null) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      cardRefs.current[0]?.focus();
      focusTimerRef.current = null;
    }, 0);
  };

  const changeDifficulty = (nextDifficulty: Difficulty) => {
    clearMismatchTimer();
    resolvingRef.current = false;
    setIsResolving(false);
    setDifficulty(nextDifficulty);
    setPhase("select");
    setCards([]);
    setSelectedIndices([]);
    setMatchedPairs(0);
    setMoves(0);
    setElapsed(0);
    setFinalScore(0);
    setIsNewBest(false);
    startedAtRef.current = null;
    inactiveSinceRef.current = null;
    setStatusMessage("Choose Start Game to build the new grid.");
  };

  const handleCardClick = (index: number) => {
    if (phase !== "playing" || isResolving || resolvingRef.current) return;
    const card = cards[index];
    if (!card || card.matched || card.revealed || selectedIndices.length >= 2) return;

    const nextSelected = [...selectedIndices, index];
    setSelectedIndices(nextSelected);
    setCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, revealed: true } : item));
    if (nextSelected.length < 2) {
      setStatusMessage("One card selected. Find its matching technology.");
      return;
    }

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const firstCard = cards[nextSelected[0]];
    const secondCard = card;
    if (firstCard.key === secondCard.key) {
      const nextMatchedPairs = matchedPairs + 1;
      setCards((current) => current.map((item, itemIndex) => nextSelected.includes(itemIndex) ? { ...item, revealed: true, matched: true } : item));
      setMatchedPairs(nextMatchedPairs);
      setSelectedIndices([]);
      setStatusMessage(`${firstCard.label} pair matched.`);
      if (nextMatchedPairs === config.pairs) finishRound(nextMoves);
      return;
    }

    resolvingRef.current = true;
    setIsResolving(true);
    setStatusMessage("No match. Cards will reset shortly.");
    mismatchTimerRef.current = window.setTimeout(() => {
      setCards((current) => current.map((item, itemIndex) => nextSelected.includes(itemIndex) ? { ...item, revealed: false } : item));
      setSelectedIndices([]);
      resolvingRef.current = false;
      setIsResolving(false);
      mismatchTimerRef.current = null;
      setStatusMessage("Try another pair.");
    }, 720);
  };

  const handleBoardKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isActive || phase !== "playing") return;
    const target = event.target as HTMLElement;
    const currentIndex = Number(target.dataset.memoryIndex);
    if (!Number.isInteger(currentIndex)) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = currentIndex + 1;
    if (event.key === "ArrowLeft") nextIndex = currentIndex - 1;
    if (event.key === "ArrowDown") nextIndex = currentIndex + config.columns;
    if (event.key === "ArrowUp") nextIndex = currentIndex - config.columns;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      if (nextIndex >= 0 && nextIndex < cards.length) cardRefs.current[nextIndex]?.focus();
    }
  };

  const cardClass = `memory-card ${difficulty === "hard" ? "memory-card-compact" : ""}`;
  const boardStyle = { gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))` } as CSSProperties;

  if (phase === "select") {
    return (
      <div className="memory-app">
        <div className="memory-toolbar"><span className="memory-brand-mark">▦</span><strong>MEMORY.EXE // MATCH THE TECH</strong><span className="memory-toolbar-status">READY</span></div>
        <div className="memory-select-screen">
          <div className="memory-select-heading"><p className="eyebrow">ANKIT.EXE // ARCADE</p><h1>Memory.exe</h1><p>Flip the cards and match the technology pairs. The cards are game content, not a claim of personal mastery.</p></div>
          <div className="memory-difficulty-grid">
            {(Object.entries(difficultyConfigs) as Array<[Difficulty, DifficultyConfig]>).map(([key, item]) => {
              const saved = bestResults[key];
              return (
                <button type="button" key={key} className={`memory-difficulty-card ${difficulty === key ? "is-selected" : ""}`} onClick={() => setDifficulty(key)}>
                  <span className="memory-difficulty-label">{item.label}</span>
                  <strong>{item.columns} × {item.rows}</strong>
                  <span>{item.pairs} matching pairs</span>
                  <small>{item.description}</small>
                  <em>{saved ? `Best ${saved.score} pts · ${formatTime(saved.time)}` : "No saved result"}</em>
                </button>
              );
            })}
          </div>
          <button type="button" className="retro-button primary-button memory-start-button" onClick={() => startRound()}>Start Game</button>
          <p className="memory-select-help">Use mouse, touch, or Tab + arrow keys. Enter/Space flips the focused card.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-app">
      <div className="memory-toolbar"><span className="memory-brand-mark">▦</span><strong>MEMORY.EXE // {difficultyConfigs[difficulty].label.toUpperCase()}</strong><span className="memory-toolbar-status">{progress}% INDEXED</span></div>
      <div className="memory-stats">
        <span><small>TIME</small><strong>{formatTime(elapsed)}</strong></span>
        <span><small>MOVES</small><strong>{moves}</strong></span>
        <span><small>PAIRS</small><strong>{matchedPairs}/{config.pairs}</strong></span>
        <span><small>BEST</small><strong>{bestResult ? bestResult.score : "—"}</strong></span>
      </div>
      <div className="memory-status" role="status"><i className="memory-status-led" /> {statusMessage}</div>
      <div className={`memory-board-scroll memory-board-scroll-${difficulty}`}>
        <div className={`memory-board memory-board-${difficulty}`} style={boardStyle} aria-label={`${config.label} memory board with ${config.pairs} technology pairs`} onKeyDown={handleBoardKeyDown}>
          {cards.map((card, index) => {
            const isVisible = card.revealed || card.matched;
            return (
              <button
                type="button"
                key={card.id}
                ref={(element) => { cardRefs.current[index] = element; }}
                className={`${cardClass} ${isVisible ? "is-flipped" : ""} ${card.matched ? "is-matched" : ""}`}
                data-memory-index={index}
                aria-pressed={isVisible}
                aria-label={card.matched ? `${card.label}, matched pair` : isVisible ? `${card.label}, face up` : "Hidden technology card"}
                onClick={() => handleCardClick(index)}
                disabled={card.matched || isResolving}
              >
                <span className="memory-card-inner">
                  <span className="memory-card-face memory-card-back" aria-hidden={isVisible}>▦<small>TECH</small></span>
                  <span className="memory-card-face memory-card-front" aria-hidden={!isVisible}><strong>{card.icon}</strong><small>{card.label}</small>{card.matched && <em>✓ MATCHED</em>}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="memory-actions">
        <button type="button" className="retro-button primary-button" onClick={() => startRound()}>{phase === "victory" ? "Play Again" : "Restart"}</button>
        <button type="button" className="retro-button" onClick={() => changeDifficulty(difficulty === "easy" ? "medium" : difficulty === "medium" ? "hard" : "easy")}>Change Difficulty</button>
        <span className="memory-actions-note">{isResolving ? "PAIR LOCKED" : "FLIP TWO CARDS"}</span>
      </div>
      {phase === "victory" && (
        <div className="memory-victory" role="dialog" aria-label="Memory game complete">
        <div className="memory-victory-panel" ref={victoryRef} tabIndex={-1}>
            <span className="memory-victory-kicker">SYSTEM COMPLETE</span>
            <h1>Archive matched.</h1>
            <p>{config.pairs} pairs found in {formatTime(elapsed)} with {moves} moves.</p>
            <strong>{finalScore} POINTS</strong>
            <small>{isNewBest ? "New personal best." : `Personal best: ${bestResult?.score ?? finalScore}.`}</small>
            <div><button type="button" className="retro-button primary-button" onClick={() => startRound()}>Play Again</button><button type="button" className="retro-button" onClick={() => changeDifficulty(difficulty)}>Change Difficulty</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
