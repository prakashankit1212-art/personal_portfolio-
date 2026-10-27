import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type SnakePhase = "start" | "playing" | "paused" | "gameover";

type SnakeRuntime = {
  snake: Point[];
  food: Point | null;
  direction: Direction;
  queuedDirection: Direction;
  score: number;
  phase: SnakePhase;
  won: boolean;
};

type SnakeSnapshot = Omit<SnakeRuntime, "queuedDirection" | "won"> & { won: boolean };

const GRID_WIDTH = 24;
const GRID_HEIGHT = 16;
const BEST_SCORE_STORAGE_KEY = "ankit-exe-snake-best";
const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
];

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const keyboardDirections: Record<string, Direction> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

function pointsMatch(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y;
}

function isOpposite(first: Direction, second: Direction) {
  return (
    (first === "up" && second === "down") ||
    (first === "down" && second === "up") ||
    (first === "left" && second === "right") ||
    (first === "right" && second === "left")
  );
}

function getTickDelay(score: number) {
  return Math.max(76, 190 - score * 7);
}

function spawnFood(snake: Point[]): Point | null {
  const openCells: Point[] = [];

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const point = { x, y };
      if (!snake.some((segment) => pointsMatch(segment, point))) openCells.push(point);
    }
  }

  if (openCells.length === 0) return null;
  return openCells[Math.floor(Math.random() * openCells.length)];
}

function createRuntime(direction: Direction = "right"): SnakeRuntime {
  const snake = INITIAL_SNAKE.map((segment) => ({ ...segment }));
  return {
    snake,
    food: spawnFood(snake),
    direction,
    queuedDirection: direction,
    score: 0,
    phase: "start",
    won: false,
  };
}

function createSnapshot(runtime: SnakeRuntime): SnakeSnapshot {
  return {
    snake: runtime.snake.map((segment) => ({ ...segment })),
    food: runtime.food ? { ...runtime.food } : null,
    direction: runtime.direction,
    score: runtime.score,
    phase: runtime.phase,
    won: runtime.won,
  };
}

function readBestScore() {
  try {
    const stored = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsed = stored === null ? 0 : Number.parseInt(stored, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function persistBestScore(score: number) {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch {
    // The game remains playable when browser storage is blocked or unavailable.
  }
}

function directionLabel(direction: Direction) {
  return direction.charAt(0).toUpperCase() + direction.slice(1);
}

export default function SnakeGame({ isActive = true }: { isActive?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SnakeRuntime>(createRuntime());
  const timeoutRef = useRef<number | null>(null);
  const pausedByWindowRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const bestScoreRef = useRef(0);
  const [snapshot, setSnapshot] = useState<SnakeSnapshot>(() => createSnapshot(runtimeRef.current));
  const [bestScore, setBestScore] = useState(0);

  isActiveRef.current = isActive;

  useEffect(() => {
    const storedBest = readBestScore();
    bestScoreRef.current = storedBest;
    setBestScore(storedBest);
    if (isActiveRef.current) rootRef.current?.focus();
  }, []);

  const clearGameTimer = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const syncSnapshot = () => {
    setSnapshot(createSnapshot(runtimeRef.current));
  };

  const recordBestScore = (score: number) => {
    if (score <= bestScoreRef.current) return;
    bestScoreRef.current = score;
    setBestScore(score);
    persistBestScore(score);
  };

  const advanceGame = () => {
    const runtime = runtimeRef.current;
    if (runtime.phase !== "playing") return;

    const nextDirection = runtime.queuedDirection;
    const vector = directionVectors[nextDirection];
    const nextHead = {
      x: runtime.snake[0].x + vector.x,
      y: runtime.snake[0].y + vector.y,
    };
    const willEat = runtime.food !== null && pointsMatch(nextHead, runtime.food);
    const bodyToCheck = willEat ? runtime.snake : runtime.snake.slice(0, -1);
    const hitWall = nextHead.x < 0 || nextHead.x >= GRID_WIDTH || nextHead.y < 0 || nextHead.y >= GRID_HEIGHT;
    const hitSelf = bodyToCheck.some((segment) => pointsMatch(segment, nextHead));

    runtime.direction = nextDirection;

    if (hitWall || hitSelf) {
      runtime.phase = "gameover";
      recordBestScore(runtime.score);
      syncSnapshot();
      return;
    }

    runtime.snake = [nextHead, ...(willEat ? runtime.snake : runtime.snake.slice(0, -1))];

    if (willEat) {
      runtime.score += 1;
      recordBestScore(runtime.score);
      runtime.food = spawnFood(runtime.snake);
      if (runtime.food === null) {
        runtime.phase = "gameover";
        runtime.won = true;
      }
    }

    syncSnapshot();
  };

  const scheduleNextTick = () => {
    clearGameTimer();
    const runtime = runtimeRef.current;
    if (runtime.phase !== "playing") return;

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      advanceGame();
      if (runtimeRef.current.phase === "playing") scheduleNextTick();
    }, getTickDelay(runtime.score));
  };

  const startRound = (direction: Direction = "right") => {
    clearGameTimer();
    const nextRuntime = createRuntime(direction);
    nextRuntime.phase = "playing";
    runtimeRef.current = nextRuntime;
    syncSnapshot();
    rootRef.current?.focus();
    scheduleNextTick();
  };

  const queueDirection = (nextDirection: Direction) => {
    const runtime = runtimeRef.current;
    if (runtime.phase === "start") {
      startRound(nextDirection);
      return;
    }
    if (runtime.phase === "gameover") return;
    if (isOpposite(nextDirection, runtime.direction) || isOpposite(nextDirection, runtime.queuedDirection)) return;

    runtime.queuedDirection = nextDirection;
    syncSnapshot();
    rootRef.current?.focus();
  };

  const togglePause = () => {
    const runtime = runtimeRef.current;
    if (runtime.phase === "playing") {
      clearGameTimer();
      runtime.phase = "paused";
      syncSnapshot();
    } else if (runtime.phase === "paused") {
      runtime.phase = "playing";
      syncSnapshot();
      scheduleNextTick();
    }
    rootRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const root = rootRef.current;
      const activeElement = document.activeElement;
      const target = event.target as HTMLElement | null;
      if (!isActiveRef.current || !root || !activeElement || !root.contains(activeElement)) return;
      if (target?.closest("button, a, input, textarea, select, [contenteditable='true']")) return;

      const nextDirection = keyboardDirections[event.key];
      if (nextDirection) {
        event.preventDefault();
        queueDirection(nextDirection);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }
    };

    const releaseFocusWhenLeavingGame = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) root.blur();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", releaseFocusWhenLeavingGame);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", releaseFocusWhenLeavingGame);
      clearGameTimer();
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!isActive) {
      if (runtime.phase === "playing") {
        clearGameTimer();
        runtime.phase = "paused";
        pausedByWindowRef.current = true;
        syncSnapshot();
      }
      return;
    }

    rootRef.current?.focus();

    if (pausedByWindowRef.current && runtime.phase === "paused") {
      pausedByWindowRef.current = false;
      runtime.phase = "playing";
      syncSnapshot();
      scheduleNextTick();
    }
  }, [isActive]);

  const handleRootKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" && snapshot.phase === "start") startRound();
    if (event.key === "Enter" && snapshot.phase === "gameover") startRound();
  };

  const getCellClassName = (point: Point) => {
    const snakeIndex = snapshot.snake.findIndex((segment) => pointsMatch(segment, point));
    const isFood = snapshot.food !== null && pointsMatch(snapshot.food, point);
    return [
      "snake-cell",
      snakeIndex >= 0 ? "is-snake" : "",
      snakeIndex === 0 ? "is-head" : "",
      snakeIndex === snapshot.snake.length - 1 && snakeIndex >= 0 ? "is-tail" : "",
      isFood ? "is-byte" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const cells = Array.from({ length: GRID_WIDTH * GRID_HEIGHT }, (_, index) => ({
    x: index % GRID_WIDTH,
    y: Math.floor(index / GRID_WIDTH),
  }));

  const statusMessage =
    snapshot.phase === "start"
      ? "Collect the bytes. Keep the process alive."
      : snapshot.phase === "playing"
        ? `Heading ${directionLabel(snapshot.direction)} // speed ${getTickDelay(snapshot.score)}ms`
        : snapshot.phase === "paused"
          ? "Process suspended. Press Space or Resume."
          : snapshot.won
            ? "All available bytes collected. System complete."
            : "Process terminated by collision.";

  return (
    <div
      ref={rootRef}
      className="snake-app"
      tabIndex={0}
      aria-label="Snake.exe game"
      onKeyDown={handleRootKeyDown}
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button, a, input, textarea, select")) rootRef.current?.focus();
      }}
    >
      <div className="snake-toolbar">
        <div className="snake-brand">
          <span className="snake-brand-mark" aria-hidden="true">▦</span>
          <span><strong>SNAKE.EXE</strong><small>DATA RECOVERY ARCADE</small></span>
        </div>
        <div className="snake-scoreboard" aria-label="Snake score">
          <span><small>SCORE</small><strong>{String(snapshot.score).padStart(3, "0")}</strong></span>
          <span><small>BEST</small><strong>{String(bestScore).padStart(3, "0")}</strong></span>
        </div>
      </div>

      <div className="snake-stage">
        <div className="snake-board-frame">
          <div className="snake-board" role="grid" aria-label={`Snake board. ${statusMessage}`}>
            {cells.map((point) => (
              <span className={getCellClassName(point)} key={`${point.x}-${point.y}`} aria-hidden="true">
                {snapshot.food && pointsMatch(snapshot.food, point) ? "01" : ""}
              </span>
            ))}
          </div>

          {snapshot.phase !== "playing" && (
            <div className={`snake-overlay snake-overlay-${snapshot.phase}`} role="status">
              {snapshot.phase === "start" && (
                <>
                  <span className="snake-overlay-kicker">ANKIT.EXE // ARCADE</span>
                  <h1>Snake.exe</h1>
                  <p>Guide the pixel process through the grid and collect every data byte.</p>
                  <button type="button" className="retro-button primary-button" onClick={() => startRound()}>Start game</button>
                  <small>Arrow keys / WASD to move</small>
                </>
              )}
              {snapshot.phase === "paused" && (
                <>
                  <span className="snake-overlay-kicker">PROCESS PAUSED</span>
                  <h1>PAUSED</h1>
                  <p>Your current run is safe. Resume when ready.</p>
                  <button type="button" className="retro-button primary-button" onClick={togglePause}>Resume</button>
                </>
              )}
              {snapshot.phase === "gameover" && (
                <>
                  <span className="snake-overlay-kicker">{snapshot.won ? "SYSTEM COMPLETE" : "PROCESS CRASH"}</span>
                  <h1>{snapshot.won ? "NICE RUN" : "GAME OVER"}</h1>
                  <p>Final score: <strong>{snapshot.score}</strong> · Best: <strong>{bestScore}</strong></p>
                  <button type="button" className="retro-button primary-button" onClick={() => startRound()}>Play again</button>
                  <small>Press Enter to start a fresh run</small>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="snake-action-row">
        <button type="button" className="retro-button primary-button" onClick={() => startRound()}>{snapshot.phase === "start" ? "Start round" : "Restart"}</button>
        <button type="button" className="retro-button" onClick={togglePause} disabled={snapshot.phase === "start" || snapshot.phase === "gameover"}>
          {snapshot.phase === "paused" ? "Resume" : "Pause"}
        </button>
        <span className="snake-shortcuts"><kbd>SPACE</kbd> pause / resume</span>
      </div>

      <div className="snake-mobile-controls" aria-label="Touch movement controls">
        <button type="button" className="snake-direction-button snake-direction-up" aria-label="Move up" onClick={() => queueDirection("up")}>▲</button>
        <button type="button" className="snake-direction-button snake-direction-left" aria-label="Move left" onClick={() => queueDirection("left")}>◀</button>
        <button type="button" className="snake-direction-button snake-direction-down" aria-label="Move down" onClick={() => queueDirection("down")}>▼</button>
        <button type="button" className="snake-direction-button snake-direction-right" aria-label="Move right" onClick={() => queueDirection("right")}>▶</button>
      </div>

      <div className="snake-statusbar">
        <span><i className="snake-status-led" aria-hidden="true" /> {statusMessage}</span>
        <span>ARROWS / WASD</span>
      </div>
    </div>
  );
}
