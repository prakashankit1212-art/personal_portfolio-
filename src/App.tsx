import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { portfolioIdentity, portfolioLinks, portfolioProjects, type PortfolioProject } from "./content/portfolio";
import TerminalQuest from "./components/TerminalQuest";
import SnakeGame from "./components/SnakeGame";
import MemoryGame from "./components/MemoryGame";

type AppId = "projects" | "about" | "terminal" | "arcade" | "snake" | "terminal-quest" | "memory" | "resume" | "contact";

type WindowState = {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
};

type AppDefinition = {
  id: AppId;
  title: string;
  icon: string;
  description: string;
};

type Project = PortfolioProject;

type TerminalTone = "system" | "command" | "output" | "success" | "error" | "muted";

type TerminalEntry = {
  id: number;
  tone: TerminalTone;
  text: string;
  appId?: AppId;
  href?: string;
  linkLabel?: string;
};

type IdentityInfo = { name: string; role: string; bio: string };
const IDENTITY_STORAGE_KEY = "ankit-portfolio-identity-v2";
const defaultIdentityInfo: IdentityInfo = {
  name: portfolioIdentity.fullName,
  role: portfolioIdentity.title,
  bio: portfolioIdentity.introduction,
};

function getIdentityWindowWidth(viewportWidth: number) {
  if (viewportWidth <= 430) return Math.min(190, viewportWidth - 16);
  if (viewportWidth <= 720) return Math.min(245, viewportWidth - 210);
  return Math.min(430, viewportWidth - 265);
}

const appDefinitions: AppDefinition[] = [
  { id: "projects", title: "My Projects", icon: "▦", description: "Browse selected work" },
  { id: "about", title: "About Me", icon: "✎", description: "A short personal note" },
  { id: "terminal", title: "Terminal.exe", icon: ">_", description: "Ask the portfolio" },
  { id: "arcade", title: "Arcade.exe", icon: "★", description: "Choose a playable game" },
  { id: "resume", title: "Resume.pdf", icon: "▤", description: "Open the resume" },
  { id: "contact", title: "Contact.lnk", icon: "@", description: "Find the right inbox" },
];

const snakeAppDefinition: AppDefinition = { id: "snake", title: "Snake.exe", icon: "▦", description: "Recover the data bytes" };
const terminalQuestAppDefinition: AppDefinition = { id: "terminal-quest", title: "Terminal Quest.exe", icon: ">_", description: "Solve three coding missions" };
const memoryAppDefinition: AppDefinition = { id: "memory", title: "Memory.exe", icon: "▦", description: "Match the tech" };

const bootStages = [
  "Checking system files...",
  "Loading portfolio modules...",
  "Mounting personal desktop...",
  "Starting ANKIT.EXE...",
];

const BOOT_DURATION_MS = 12000;

const bootLogLines = [
  { text: "Mounting projects...", threshold: 18 },
  { text: "Waking up the arcade...", threshold: 42 },
  { text: "Loading ankit.exe...", threshold: 68 },
  { text: "Initializing interface...", threshold: 90 },
];

const projects: Project[] = portfolioProjects;

const windowDefaults: Record<AppId, Omit<WindowState, "id" | "isMinimized" | "isMaximized" | "zIndex">> = {
  projects: { x: 185, y: 42, width: 700, height: 495 },
  about: { x: 250, y: 82, width: 570, height: 455 },
  terminal: { x: 315, y: 125, width: 610, height: 375 },
  arcade: { x: 365, y: 95, width: 470, height: 430 },
  snake: { x: 300, y: 50, width: 550, height: 570 },
  "terminal-quest": { x: 260, y: 45, width: 650, height: 560 },
  memory: { x: 180, y: 30, width: 760, height: 650 },
  resume: { x: 425, y: 115, width: 520, height: 390 },
  contact: { x: 470, y: 145, width: 420, height: 330 },
};

function getApp(id: AppId) {
  return [...appDefinitions, snakeAppDefinition, terminalQuestAppDefinition, memoryAppDefinition].find((app) => app.id === id)!;
}

function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [zCounter, setZCounter] = useState(10);
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStage, setBootStage] = useState(0);
  const [bootRunId, setBootRunId] = useState(0);
  const [identityInfo, setIdentityInfo] = useState<IdentityInfo>(() => {
    try {
      const saved = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!saved) return defaultIdentityInfo;
      const parsed = JSON.parse(saved) as Partial<IdentityInfo>;
      return {
        name: typeof parsed.name === "string" ? parsed.name : defaultIdentityInfo.name,
        role: typeof parsed.role === "string" ? parsed.role : defaultIdentityInfo.role,
        bio: typeof parsed.bio === "string" ? parsed.bio : defaultIdentityInfo.bio,
      };
    } catch {
      return defaultIdentityInfo;
    }
  });
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [isIdentityMinimized, setIsIdentityMinimized] = useState(false);
  const [isIdentityMaximized, setIsIdentityMaximized] = useState(false);
  const [identityPosition, setIdentityPosition] = useState(() => ({
    x: Math.max(8, window.innerWidth - getIdentityWindowWidth(window.innerWidth) - (window.innerWidth <= 720 ? 10 : 24)),
    y: 25,
  }));
  const [identityZIndex, setIdentityZIndex] = useState(3);
  const [desktopNotice, setDesktopNotice] = useState<string>(portfolioIdentity.welcomeMessage);
  const [now, setNow] = useState(() => new Date());
  const startMenuRef = useRef<HTMLDivElement>(null);
  const bootDismissedRef = useRef(false);
  const identityDragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identityInfo));
    } catch {
      // Editing remains available for this session when browser storage is blocked.
    }
  }, [identityInfo]);

  useEffect(() => {
    const keepIdentityInView = () => {
      if (isIdentityMaximized) return;
      const maxX = Math.max(8, window.innerWidth - getIdentityWindowWidth(window.innerWidth) - 8);
      const maxY = Math.max(8, window.innerHeight - 54 - (isEditingIdentity ? 250 : 190));
      setIdentityPosition((position) => ({ x: Math.min(position.x, maxX), y: Math.min(position.y, maxY) }));
    };
    window.addEventListener("resize", keepIdentityInView);
    return () => window.removeEventListener("resize", keepIdentityInView);
  }, [isEditingIdentity, isIdentityMaximized]);

  const focusIdentity = () => {
    const nextZ = zCounter + 1;
    setZCounter(nextZ);
    setIdentityZIndex(nextZ);
    setIsIdentityMinimized(false);
  };

  const startIdentityDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isIdentityMaximized || (event.target as HTMLElement).closest("button, input, textarea")) return;
    focusIdentity();
    identityDragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - identityPosition.x, offsetY: event.clientY - identityPosition.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveIdentity = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = identityDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = Math.min(430, window.innerWidth - 16);
    setIdentityPosition({
      x: Math.min(Math.max(8, event.clientX - drag.offsetX), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, event.clientY - drag.offsetY), Math.max(8, window.innerHeight - 240)),
    });
  };

  const toggleIdentityMaximize = () => {
    focusIdentity();
    setIsIdentityMaximized((maximized) => !maximized);
  };

  const dismissBoot = () => {
    bootDismissedRef.current = true;
    setIsBooting(false);
  };

  const restartBoot = () => {
    bootDismissedRef.current = false;
    setBootProgress(0);
    setBootStage(0);
    setIsBooting(true);
    setBootRunId((current) => current + 1);
  };

  useEffect(() => {
    let bootTimer: number | undefined;
    let finishTimer: number | undefined;
    const handleSkip = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissBoot();
    };

    document.addEventListener("keydown", handleSkip);

    const startedAt = window.performance.now();
    bootTimer = window.setInterval(() => {
      if (bootDismissedRef.current) {
        if (bootTimer !== undefined) window.clearInterval(bootTimer);
        return;
      }

      const nextProgress = Math.min(100, Math.round(((window.performance.now() - startedAt) / BOOT_DURATION_MS) * 100));
      setBootProgress(nextProgress);
      setBootStage(Math.min(bootStages.length - 1, Math.floor(nextProgress / (100 / bootStages.length))));

      if (nextProgress >= 100) {
        if (bootTimer !== undefined) window.clearInterval(bootTimer);
        bootDismissedRef.current = true;
        finishTimer = window.setTimeout(() => setIsBooting(false), 260);
      }
    }, 80);

    return () => {
      if (bootTimer !== undefined) window.clearInterval(bootTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
      document.removeEventListener("keydown", handleSkip);
    };
  }, [bootRunId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isStartOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!startMenuRef.current?.contains(event.target as Node)) {
        setIsStartOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsStartOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isStartOpen]);

  const focusWindow = (id: AppId) => {
    const nextZ = zCounter + 1;
    setZCounter(nextZ);
    setWindows((current) => current.map((item) => (item.id === id ? { ...item, isMinimized: false, zIndex: nextZ } : item)));
  };

  const openApp = (id: AppId) => {
    const nextZ = zCounter + 1;
    setZCounter(nextZ);
    setWindows((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) => (item.id === id ? { ...item, isMinimized: false, zIndex: nextZ } : item));
      }
      return [
        ...current,
        {
          id,
          ...windowDefaults[id],
          isMinimized: false,
          isMaximized: false,
          zIndex: nextZ,
        },
      ];
    });
    setIsStartOpen(false);
    setSelectedIcon(id);
  };

  const closeApp = (id: AppId) => {
    setWindows((current) => current.filter((item) => item.id !== id));
  };

  const minimizeApp = (id: AppId) => {
    setWindows((current) => current.map((item) => (item.id === id ? { ...item, isMinimized: true } : item)));
  };

  const toggleMaximize = (id: AppId) => {
    setWindows((current) => current.map((item) => (item.id === id ? { ...item, isMaximized: !item.isMaximized, isMinimized: false } : item)));
  };

  const moveWindow = (id: AppId, x: number, y: number) => {
    const target = windows.find((item) => item.id === id);
    if (!target || target.isMaximized) return;

    const usableHeight = Math.max(window.innerHeight - 54, 260);
    const maxX = Math.max(8, window.innerWidth - target.width - 8);
    const maxY = Math.max(8, usableHeight - target.height - 8);
    const nextX = Math.min(Math.max(x, 8), maxX);
    const nextY = Math.min(Math.max(y, 8), maxY);

    setWindows((current) => current.map((item) => (item.id === id ? { ...item, x: nextX, y: nextY } : item)));
  };

  const showNotice = (message: string) => {
    setDesktopNotice(message);
    window.setTimeout(() => setDesktopNotice(portfolioIdentity.welcomeMessage), 4200);
  };

  const handleShutdown = () => {
    setIsStartOpen(false);
    showNotice("Shutdown is disabled — this is a portfolio, not a real operating system.");
  };

  return (
    <main className="desktop-shell" onClick={() => setSelectedIcon(null)}>
      <section className="desktop-area" aria-label="Ankit's personal desktop">
        <DesktopWallpaper />

        <aside
          className={`desktop-brand identity-widget identity-window ${isIdentityMaximized ? "is-maximized" : ""} ${isIdentityMinimized ? "is-minimized" : ""}`}
          style={isIdentityMaximized ? { zIndex: identityZIndex } : { left: identityPosition.x, right: "auto", top: identityPosition.y, zIndex: identityZIndex }}
          aria-label="Personal desktop identity"
          onPointerDown={focusIdentity}
        >
          <div className="identity-titlebar" onPointerDown={startIdentityDrag} onPointerMove={moveIdentity} onPointerUp={() => { identityDragRef.current = null; }} onPointerCancel={() => { identityDragRef.current = null; }} onDoubleClick={toggleIdentityMaximize}>
            <span className="identity-title-icon" aria-hidden="true">▦</span>
            <strong>ANKIT.EXE</strong>
            <div className="identity-controls">
              <button type="button" aria-label="Minimize personal information" onPointerDown={(event) => event.stopPropagation()} onClick={() => setIsIdentityMinimized(true)}>_</button>
              <button type="button" aria-label={isIdentityMaximized ? "Restore personal information" : "Maximize personal information"} onPointerDown={(event) => event.stopPropagation()} onClick={toggleIdentityMaximize}>{isIdentityMaximized ? "❐" : "□"}</button>
            </div>
            <div className="identity-controls" aria-hidden="true"><span>_</span><span>□</span><span>×</span></div>
          </div>
          <div className="identity-body">
            <div className="identity-avatar" aria-hidden="true">
              <svg viewBox="0 0 64 72" shapeRendering="crispEdges">
                <rect width="64" height="72" fill="#e8ece8" />
                <path d="M9 69c2-16 11-23 23-23s21 7 23 23z" fill="#1d2634" />
                <path d="M17 43l15-9 16 9-3 15H20z" fill="#d99469" />
                <path d="M15 29l4-18 14-8 17 10 2 19-9-8-8 5-13-4z" fill="#232434" />
                <path d="M22 25l22-5 7 9-4 15-14 7-14-9z" fill="#bc744f" />
                <path d="M26 31h4M39 30h4M30 40l8 2" stroke="#3a2630" strokeWidth="3" />
              </svg>
            </div>
            <div className="identity-widget-copy">
              {isEditingIdentity ? (
                <div className="identity-edit-fields" onClick={(event) => event.stopPropagation()}>
                  <label>Name<input aria-label="Name" maxLength={48} value={identityInfo.name} onChange={(event) => setIdentityInfo({ ...identityInfo, name: event.target.value })} /></label>
                  <label>Role<input aria-label="Role" maxLength={48} value={identityInfo.role} onChange={(event) => setIdentityInfo({ ...identityInfo, role: event.target.value })} /></label>
                  <label>About<textarea aria-label="About" maxLength={260} rows={3} value={identityInfo.bio} onChange={(event) => setIdentityInfo({ ...identityInfo, bio: event.target.value })} /></label>
                </div>
              ) : (
                <>
                  <p className="brand-kicker">{identityInfo.name.toUpperCase()}</p>
                  <p className="identity-role">{identityInfo.role}</p>
                  <p className="brand-copy">{identityInfo.bio}</p>
                </>
              )}
            </div>
          </div>
          <div className="identity-footer">
            <span><span className="identity-led" aria-hidden="true" /> SYSTEM READY</span>
            <button type="button" className="identity-edit-button" onClick={() => setIsEditingIdentity((editing) => !editing)}>{isEditingIdentity ? "Done" : "Edit info"}</button>
            <span className="identity-build">v1.0.0</span>
          </div>
        </aside>

        <div className="desktop-icons" onClick={(event) => event.stopPropagation()}>
          {appDefinitions.map((app) => (
            <DesktopIcon
              key={app.id}
              app={app}
              selected={selectedIcon === app.id}
              onSelect={() => setSelectedIcon(app.id)}
              onOpen={() => openApp(app.id)}
            />
          ))}
          <RecycleBinShortcut onNotice={() => showNotice("Recycle Bin is empty — there is nothing to restore.")} />
        </div>

        <div className="desktop-notice desktop-status-strip" role="status">
          <span className="notice-prefix">C:\\ANKIT&gt;</span> {desktopNotice}
          <span className="status-led" aria-hidden="true" />
        </div>

        {windows.map((item) => {
          const app = getApp(item.id);
          const visibleWindows = windows.filter((windowItem) => !windowItem.isMinimized);
          const activeZIndex = visibleWindows.length > 0 ? Math.max(...visibleWindows.map((windowItem) => windowItem.zIndex)) : -1;
          const isWindowActive = !item.isMinimized && item.zIndex === activeZIndex;
          return (
            <AppWindow
              key={item.id}
              state={item}
              title={app.title}
              icon={app.icon}
              onFocus={() => focusWindow(item.id)}
              onClose={() => closeApp(item.id)}
              onMinimize={() => minimizeApp(item.id)}
              onToggleMaximize={() => toggleMaximize(item.id)}
              onMove={(x, y) => moveWindow(item.id, x, y)}
            >
              <AppContent id={item.id} isActive={isWindowActive} onOpenApp={openApp} onNotice={showNotice} onReplayBoot={restartBoot} />
            </AppWindow>
          );
        })}
      </section>

      <footer className="taskbar" onClick={(event) => event.stopPropagation()}>
        <div className="start-menu-wrap" ref={startMenuRef}>
          <button
            className={`start-button ${isStartOpen ? "is-pressed" : ""}`}
            type="button"
            aria-expanded={isStartOpen}
            aria-haspopup="menu"
            onClick={() => setIsStartOpen((open) => !open)}
          >
            <span className="start-logo" aria-hidden="true">▦</span>
            <strong>Start</strong>
          </button>
          {isStartOpen && (
            <StartMenu onOpenApp={openApp} onShutdown={handleShutdown} />
          )}
        </div>

        <div className="taskbar-windows" aria-label="Open applications">
          <button className={`taskbar-window ${isIdentityMinimized ? "is-minimized" : "is-active"}`} type="button" onClick={() => isIdentityMinimized ? focusIdentity() : setIsIdentityMinimized(true)}>
            <span className="taskbar-icon" aria-hidden="true">▦</span>
            <span>Personal info</span>
          </button>
          {windows.map((item) => (
            <button
              className={`taskbar-window ${item.isMinimized ? "is-minimized" : ""} ${item.zIndex === Math.max(...windows.map((windowItem) => windowItem.zIndex)) && !item.isMinimized ? "is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => {
                if (!item.isMinimized && item.zIndex === Math.max(...windows.map((windowItem) => windowItem.zIndex))) {
                  minimizeApp(item.id);
                } else {
                  focusWindow(item.id);
                }
              }}
            >
              <span className="taskbar-icon" aria-hidden="true">{getApp(item.id).icon}</span>
              <span>{getApp(item.id).title}</span>
            </button>
          ))}
        </div>

        <div className="taskbar-tray">
          <span className="tray-signal" aria-hidden="true">▥</span>
          <time dateTime={now.toISOString()}>{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
        </div>
      </footer>

      {isBooting && (
        <BootScreen progress={bootProgress} stage={bootStages[bootStage]} onSkip={dismissBoot} />
      )}
    </main>
  );
}

function BootScreen({ progress, stage, onSkip }: { progress: number; stage: string; onSkip: () => void }) {
  const activeSegments = Math.round((progress / 100) * 24);

  return (
    <section className="boot-screen" role="status" aria-live="polite" aria-label="Starting Ankit's personal desktop">
      <BootBackdrop />
      <div className="boot-panel">
        <div className="boot-panel-header">
          <div className="boot-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="boot-kicker">ANKIT.EXE</p>
            <h1>PERSONAL DESKTOP SYSTEM</h1>
          </div>
          <span className="boot-version">v0.1.0</span>
        </div>

        <div className="boot-panel-body">
          <div className="boot-content-grid">
            <BootMascot />
            <div className="boot-log">
              <div className="boot-system-line">
                <span className="boot-prompt">C:\\ANKIT&gt;</span>
                <span>{stage}</span>
              </div>
              <div className="boot-log-lines">
                {bootLogLines.map((line, index) => {
                  const isComplete = progress >= line.threshold;
                  const isActive = !isComplete && index === Math.min(bootStageIndex(progress), bootLogLines.length - 1);
                  return (
                    <p className={`boot-log-line ${isComplete ? "is-complete" : ""} ${isActive ? "is-active" : ""}`} key={line.text}>
                      <span aria-hidden="true">{isComplete ? "✓" : isActive ? ">" : "·"}</span> {line.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="boot-progress-shell" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`Loading ${progress}%`}>
            <div className="boot-progress-segments">
              {Array.from({ length: 24 }, (_, index) => (
                <span className={index < activeSegments ? "is-active" : ""} key={index} />
              ))}
            </div>
          </div>
          <div className="boot-progress-meta">
            <span>Initializing interface</span>
            <strong>{progress}%</strong>
          </div>
          <div className="boot-checklist" aria-hidden="true">
            <span><i className={progress >= 18 ? "is-complete" : ""} /> PROJECTS</span>
            <span><i className={progress >= 42 ? "is-complete" : ""} /> APPS</span>
            <span><i className={progress >= 68 ? "is-complete" : ""} /> ASSETS</span>
            <span><i className={progress >= 90 ? "is-complete" : ""} /> SYSTEM</span>
          </div>
        </div>

        <div className="boot-panel-footer">
          <span><span className="boot-led" aria-hidden="true" /> SYSTEM READY</span>
          <button type="button" className="boot-skip" onClick={onSkip}>Skip startup</button>
          <span className="boot-escape">ESC</span>
        </div>
      </div>
    </section>
  );
}

function bootStageIndex(progress: number) {
  if (progress < 18) return 0;
  if (progress < 42) return 1;
  if (progress < 68) return 2;
  return 3;
}

function BootBackdrop() {
  const [hasWallpaper, setHasWallpaper] = useState(false);

  return (
    <div className={`boot-backdrop ${hasWallpaper ? "has-menu-wallpaper" : ""}`} aria-hidden="true">
      <img className="boot-wallpaper-image" src="/menu-wallpaper.png" alt="" onLoad={() => setHasWallpaper(true)} />
      <div className="boot-starfield">
        {Array.from({ length: 28 }, (_, index) => <i className="boot-star" key={index} />)}
      </div>
      <svg className="boot-cityscape" viewBox="0 0 1400 620" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        <defs>
          <linearGradient id="boot-night-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05082b" />
            <stop offset="0.58" stopColor="#101863" />
            <stop offset="1" stopColor="#b84e82" />
          </linearGradient>
          <pattern id="boot-night-dither" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="transparent" />
            <rect x="1" y="1" width="1" height="1" fill="#5e74d9" opacity="0.26" />
            <rect x="5" y="5" width="1" height="1" fill="#04082d" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="1400" height="620" fill="url(#boot-night-sky)" />
        <rect width="1400" height="620" fill="url(#boot-night-dither)" opacity="0.72" />
        <path d="M0 405c164-105 252-76 377-34 144 48 221-39 360-12 146 28 225 73 366 22 116-42 192-36 297 13v226H0z" fill="#172252" />
        <path d="M0 462c131-63 244-58 354-25 139 42 217-37 357-11 148 28 220 59 361 17 132-39 229-35 328 10v167H0z" fill="#0e173d" />
        <circle cx="1030" cy="426" r="73" fill="#ffcf75" />
        <path d="M957 417h146v9H957zM968 438h124v9H968zM982 459h97v8h-97z" fill="#ee7b73" />
        <path d="M0 501h69v-67h37v67h28v-93h45v93h33v-46h46v46h24v-129h53v129h31v-72h59v72h26v-100h45v100h35v-57h60v57h27v-118h49v118h36v-82h52v82h42v-132h49v132h31v-63h61v63h38v-108h49v108h32v-78h57v78h31v-137h46v137h37v-73h51v73h31v-99h55v99h40v-125h48v125h37v-74h55v74h32v-103h49v103h55v119H0z" fill="#0b1437" />
        <g fill="#ffd86f">
          <path d="M97 463h7v14h-7zM183 439h7v18h-7zM253 491h7v12h-7zM337 419h7v17h-7zM430 464h7v15h-7zM516 431h7v17h-7zM612 451h7v18h-7zM707 409h7v21h-7zM803 450h7v16h-7zM892 420h7v19h-7zM984 466h7v15h-7zM1094 437h7v19h-7zM1190 469h7v15h-7zM1288 423h7v19h-7zM1350 456h7v18h-7z" />
        </g>
        <path d="M0 567h1400v53H0z" fill="#08102d" />
        <path d="M0 578c173-13 277 7 406-3 144-12 271-13 401 2 147 17 296-2 593-8v51H0z" fill="#18255d" />
        <g fill="#ff906a">
          <rect x="76" y="578" width="7" height="5" /><rect x="154" y="590" width="7" height="5" /><rect x="234" y="572" width="7" height="5" /><rect x="315" y="589" width="7" height="5" /><rect x="447" y="579" width="7" height="5" /><rect x="552" y="592" width="7" height="5" /><rect x="686" y="575" width="7" height="5" /><rect x="811" y="590" width="7" height="5" /><rect x="951" y="578" width="7" height="5" /><rect x="1125" y="592" width="7" height="5" /><rect x="1268" y="575" width="7" height="5" />
        </g>
      </svg>
    </div>
  );
}

function BootMascot() {
  return (
    <div className="boot-mascot" aria-hidden="true">
      <span className="boot-mascot-spark boot-mascot-spark-one">✦</span>
      <span className="boot-mascot-spark boot-mascot-spark-two">✦</span>
      <svg viewBox="0 0 180 150" shapeRendering="crispEdges">
        <path d="M42 22h96v76H42z" fill="#9fa9b5" stroke="#111a36" strokeWidth="5" />
        <path d="M51 32h78v54H51z" fill="#07102b" stroke="#eef2f0" strokeWidth="4" />
        <path d="M72 54v8M108 54v8M77 72l9 7 15-12 10 8" stroke="#22f6c7" strokeWidth="5" fill="none" />
        <path d="M32 99h116l17 13v14H15v-14z" fill="#c8d0d0" stroke="#111a36" strokeWidth="5" />
        <path d="M55 111h65v9H55z" fill="#707c91" />
        <path d="M129 110h9v9h-9z" fill="#26e6a9" />
        <path d="M21 129h143" stroke="#f8f2d2" strokeWidth="4" />
      </svg>
      <span className="boot-mascot-label">READY_</span>
    </div>
  );
}

function DesktopWallpaper() {
  const [hasMenuWallpaper, setHasMenuWallpaper] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    fetch("/menu-wallpaper.png", { cache: "no-store" })
      .then((response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!isCancelled && response.ok && contentType.startsWith("image/")) {
          setHasMenuWallpaper(true);
        }
      })
      .catch(() => {
        if (!isCancelled) setHasMenuWallpaper(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <>
      <div className={`wallpaper-art ${hasMenuWallpaper ? "has-menu-wallpaper" : ""}`} aria-hidden="true">
        {hasMenuWallpaper && <img className="wallpaper-image" src="/menu-wallpaper.png" alt="" />}
        <svg viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
          <defs>
            <linearGradient id="wallpaper-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#087f80" />
              <stop offset="0.58" stopColor="#1b7180" />
              <stop offset="1" stopColor="#d96857" />
            </linearGradient>
            <linearGradient id="wallpaper-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#31566d" />
              <stop offset="1" stopColor="#172638" />
            </linearGradient>
            <pattern id="wallpaper-dither" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="transparent" />
              <rect x="1" y="1" width="1" height="1" fill="#b7eded" opacity="0.35" />
              <rect x="5" y="5" width="1" height="1" fill="#002b39" opacity="0.28" />
            </pattern>
          </defs>

          <rect width="1400" height="800" fill="url(#wallpaper-sky)" />
          <rect width="1400" height="800" fill="url(#wallpaper-dither)" opacity="0.38" />

          <g opacity="0.58" fill="#9dd0cf">
            <path d="M485 146h48v-9h22v-12h20v12h17v9h39v9H485z" />
            <path d="M1006 349h46v-8h15v-11h23v11h17v8h31v9h-132z" />
            <path d="M1245 280h37v-9h18v-13h22v13h17v9h34v9h-128z" />
          </g>

          <g fill="#f5d676" opacity="0.92">
            <circle cx="1072" cy="308" r="79" />
            <rect x="993" y="299" width="158" height="8" fill="#e8755a" />
            <rect x="1002" y="321" width="140" height="7" fill="#e8755a" />
            <rect x="1014" y="344" width="116" height="8" fill="#e8755a" />
          </g>

          <g fill="#224b61">
            <path d="M0 520h68v-42h38v42h25v-81h55v81h32v-57h42v57h39v-112h48v112h30v-66h61v66h26v-92h47v92h36v-47h60v47h29v-124h42v124h39v-71h56v71h34v-93h50v93h39v-54h42v54h40v-119h44v119h32v-76h59v76h38v-105h43v105h31v-60h56v60h29v-93h47v93h40v-130h44v130h34v-69h52v69h29v-104h48v104h51v280H0z" />
          </g>

          <g fill="#f59b58">
            <path d="M92 500h7v15h-7zM145 474h7v17h-7zM212 453h7v18h-7zM277 482h7v14h-7zM353 429h7v20h-7zM422 467h7v15h-7zM500 449h7v18h-7zM593 411h7v20h-7zM667 461h7v16h-7zM771 426h7v19h-7zM870 447h7v18h-7zM955 402h7v22h-7zM1059 469h7v17h-7zM1149 424h7v20h-7zM1238 452h7v18h-7zM1326 413h7v22h-7z" />
          </g>

          <path d="M0 570c150-54 250-36 359-18 132 22 196-32 303-18 124 16 185 57 301 34 113-22 207-37 437 14v218H0z" fill="url(#wallpaper-ground)" />
          <path d="M0 582c133-38 238-27 353-12 127 17 189-29 298-18 122 13 187 45 301 27 115-18 233-29 448 13v42H0z" fill="#2f8b91" opacity="0.72" />

          <g fill="#f4b65c">
            <path d="M174 568h9v15h-9zM204 560h9v13h-9zM243 574h9v13h-9zM312 552h8v16h-8zM383 581h9v13h-9zM451 555h9v16h-9zM1183 572h9v14h-9zM1211 557h9v17h-9zM1274 576h8v14h-8zM1341 549h9v18h-9z" />
          </g>

          <path d="M80 664h1230v136H80z" fill="#3f4752" />
          <path d="M80 664h1230v18H80z" fill="#8b7865" />
          <path d="M80 682h1230v11H80z" fill="#252c36" />
          <g fill="#56606a" opacity="0.9">
            <path d="M111 701h166v43H111zM297 696h184v54H297zM509 702h153v44H509zM688 692h181v57H688zM892 700h172v48H892zM1082 692h190v57H1082z" />
          </g>
          <g fill="#242c36">
            <path d="M277 701h9v44h-9zM481 696h9v55h-9zM662 702h9v44h-9zM869 692h9v57h-9zM1064 700h9v48h-9z" />
          </g>

          <g transform="translate(717 90)">
            <path d="M56 162c-32 14-50 45-56 90l34 30 27-16 19 28 68-5 18-57-17-51-40-28z" fill="#ece4d1" />
            <path d="M74 177h53l27 62-25 70-74-11-19-63z" fill="#f2e7d1" />
            <path d="M48 240l-26 87 25 39 36-68zM156 237l24 93-31 38-38-71z" fill="#f2e7d1" />
            <path d="M49 319l-6 134 64 10 5-126zM108 337l17 126 66-1-24-139z" fill="#181d2c" />
            <path d="M40 446l-20 45 43 11 46-27-5-21zM131 458l10 36 72 4-6-30-45-14z" fill="#ece4d1" />
            <path d="M64 154l11-36 44-26 40 24 6 55-22 37-52 4-31-27z" fill="#a45e3f" />
            <path d="M72 112l19-31 44-11 37 35-6 29-26-15-13 15-23-10-22 23z" fill="#252333" />
            <path d="M95 118l37-8 25 26-6 40-29 22-37-24z" fill="#b96d4b" />
            <path d="M111 145h8M139 143h8M117 169l14 3" stroke="#36242b" strokeWidth="4" fill="none" />
            <path d="M87 217l23 16 29-9-11 21-29 8z" fill="#d3c4ac" />
            <path d="M61 270l72 17-8 28-73-18z" fill="#d2c5ad" />
            <path d="M132 284l47 47-15 19-54-40z" fill="#b96d4b" />
            <path d="M76 284l42 28-17 34-43-27z" fill="#b96d4b" />
            <path d="M51 470l28-8 20 10-26 18-42 2zM143 475l27-8 39 12-4 14-62-5z" fill="#f6f0dd" />
            <path d="M52 469l31 3M144 476l41 9" stroke="#7e7b73" strokeWidth="5" />
          </g>

          <g transform="translate(370 492)">
            <path d="M16 86l10-57 29-27 43 20 18 56-18 39H29z" fill="#222633" />
            <path d="M65 3l30 15 8 35-27 15-28-30z" fill="#303340" />
            <path d="M58 14l20-3 17 18-4 25-28 7-18-20z" fill="#f1f0dc" />
            <path d="M68 27h6M87 26h6M75 42l11 1" stroke="#1b2731" strokeWidth="4" />
            <path d="M99 11l21-12 18 5-18 12z" fill="#f1f0dc" />
            <path d="M109 15l15-3 9 7-18 9z" fill="#f1f0dc" />
          </g>

          <g transform="translate(952 508)">
            <path d="M4 94h162l-20-86H25z" fill="#131a29" stroke="#b9c1c4" strokeWidth="6" />
            <path d="M24 20h120l13 58H38z" fill="#2d3443" />
            <path d="M48 49h22v22H48zM83 39h18v18H83zM113 57h20v20h-20z" fill="#f4d27c" />
            <path d="M43 44l8 8M51 44l-8 8M89 40l9 9M98 40l-9 9" stroke="#fff" strokeWidth="3" />
            <path d="M67 92h41" stroke="#aab2ba" strokeWidth="5" />
          </g>

          <g transform="translate(1097 563)">
            <path d="M0 101h178v28H0z" fill="#9a7a55" />
            <path d="M16 73h118v29H16z" fill="#c8a477" />
            <path d="M35 43h109v30H35z" fill="#5a4238" />
            <path d="M53 14h92v29H53z" fill="#dd9253" />
            <path d="M139 12h13v117h-13z" fill="#1e2635" />
            <path d="M157 12h13v117h-13z" fill="#1e2635" />
            <path d="M171 96l21-15 11 9-24 17z" fill="#d0a36b" />
          </g>

          <g transform="translate(1245 410)">
            <path d="M85 256c-14-70-17-159 9-225l18 8c-31 90-18 151-4 217z" fill="#503a2e" />
            <path d="M97 113c-43-20-74-10-91-3l7 16c31-6 49-2 75 13zM104 162c-52-11-76 1-93 16l10 14c24-17 49-20 84-9zM103 76c-31-39-56-42-75-39l1 17c23 2 40 12 61 39z" fill="#578746" />
            <path d="M117 56c29-40 51-48 71-47l-4 17c-21 5-36 17-57 43zM116 134c38-33 67-36 88-31l-2 17c-24 1-43 10-72 31z" fill="#6c9b4e" />
          </g>
        </svg>
      </div>

      {!hasMenuWallpaper && <div className="wallpaper-message" aria-hidden="true">
        <span>BUILDING</span>
        <span>THINGS</span>
        <span>BREAKING</span>
        <span>THINGS</span>
        <span>LEARNING</span>
        <span>ALWAYS...</span>
        <b>⌣</b>
      </div>}
    </>
  );
}

function DesktopIcon({ app, selected, onSelect, onOpen }: { app: AppDefinition; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  return (
    <button
      className={`desktop-icon ${selected ? "is-selected" : ""}`}
      type="button"
      aria-label={`${app.title}. ${app.description}`}
      onClick={(event) => {
        onSelect();
        if (event.detail === 2) onOpen();
      }}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className={`desktop-icon-art desktop-icon-art-${app.id}`} aria-hidden="true">
        <PixelIcon id={app.id} />
      </span>
      <span className="desktop-icon-label">{app.title}</span>
    </button>
  );
}

function PixelIcon({ id }: { id: AppId }) {
  if (id === "projects") {
    return (
      <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
        <path d="M4 10h14l4 4h22v20H4z" fill="#000080" />
        <path d="M4 15h40v17H4z" fill="#f4d27c" />
        <path d="M8 18h32v10H8z" fill="#d6a843" />
        <path d="M8 18h32v3H8z" fill="#fff2ad" />
      </svg>
    );
  }

  if (id === "about") {
    return (
      <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
        <path d="M13 3h20l8 8v26H13z" fill="#fff" stroke="#000080" strokeWidth="2" />
        <path d="M33 3v9h8" fill="#c0c0c0" stroke="#000080" strokeWidth="2" />
        <circle cx="23" cy="18" r="5" fill="#000080" />
        <path d="M15 32c1-6 4-9 8-9s7 3 8 9z" fill="#000080" />
      </svg>
    );
  }

  if (id === "terminal") {
    return (
      <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
        <path d="M4 5h40v30H4z" fill="#000080" />
        <path d="M8 9h32v22H8z" fill="#071407" />
        <path d="M13 15l5 4-5 4" fill="none" stroke="#f4d27c" strokeWidth="3" />
        <path d="M22 25h10" stroke="#8de08d" strokeWidth="3" />
      </svg>
    );
  }

  if (id === "arcade") {
    return (
      <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
        <path d="M24 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#f4d27c" stroke="#000080" strokeWidth="2" />
        <path d="M24 9v18M15 16h18M18 27l6-4 6 4" stroke="#fff2ad" strokeWidth="2" />
      </svg>
    );
  }

  if (id === "resume") {
    return (
      <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
        <path d="M10 3h21l8 8v26H10z" fill="#fff" stroke="#000080" strokeWidth="2" />
        <path d="M31 3v9h8" fill="#c0c0c0" stroke="#000080" strokeWidth="2" />
        <path d="M16 19h17M16 24h17M16 29h12" stroke="#000080" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
      <path d="M5 8h38v25H5z" fill="#fff" stroke="#000080" strokeWidth="2" />
      <path d="M6 10l18 14L42 10" fill="none" stroke="#000080" strokeWidth="3" />
      <path d="M6 32l14-12M42 32L28 20" fill="none" stroke="#000080" strokeWidth="2" />
    </svg>
  );
}

function RecycleBinShortcut({ onNotice }: { onNotice: () => void }) {
  return (
    <button
      className="desktop-icon recycle-bin-shortcut"
      type="button"
      aria-label="Recycle Bin. This portfolio recycle bin is empty."
      onClick={onNotice}
      onDoubleClick={onNotice}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNotice();
        }
      }}
    >
      <span className="desktop-icon-art" aria-hidden="true">
        <svg viewBox="0 0 48 40" role="presentation" shapeRendering="crispEdges">
          <path d="M10 11h28l-3 25H13z" fill="#e9eeee" stroke="#172c38" strokeWidth="2" />
          <path d="M8 8h32v5H8zM17 4h14v4H17z" fill="#d8e0df" stroke="#172c38" strokeWidth="2" />
          <path d="M17 18l5 5 4-4 5 5" fill="none" stroke="#13894b" strokeWidth="3" />
          <path d="M16 29l7-5 6 6" fill="none" stroke="#13894b" strokeWidth="3" />
        </svg>
      </span>
      <span className="desktop-icon-label">Recycle Bin</span>
    </button>
  );
}

function StartMenu({ onOpenApp, onShutdown }: { onOpenApp: (id: AppId) => void; onShutdown: () => void }) {
  return (
    <div className="start-menu" role="menu" aria-label="Start menu">
      <div className="start-menu-banner">
        <span className="start-menu-mark">▦</span>
        <span><strong>{portfolioIdentity.displayName}</strong><br /><small>{portfolioIdentity.title}</small></span>
      </div>
      <div className="start-menu-items">
        {appDefinitions.map((app) => (
          <button key={app.id} type="button" role="menuitem" onClick={() => onOpenApp(app.id)}>
            <span className="menu-item-icon" aria-hidden="true">{app.icon}</span>
            <span>{app.title}</span>
          </button>
        ))}
        <span className="menu-divider" />
        <button type="button" role="menuitem" onClick={onShutdown}>
          <span className="menu-item-icon" aria-hidden="true">⏻</span>
          <span>Shut Down...</span>
        </button>
      </div>
    </div>
  );
}

function AppWindow({
  state,
  title,
  icon,
  children,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
}: {
  state: WindowState;
  title: string;
  icon: string;
  children: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onFocus();
    if (state.isMaximized || (event.target as HTMLElement).closest("button")) return;
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - state.x, offsetY: event.clientY - state.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    onMove(event.clientX - dragRef.current.offsetX, event.clientY - dragRef.current.offsetY);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      className={`app-window ${state.isMaximized ? "is-maximized" : ""}`}
      style={{ left: state.x, top: state.y, width: state.width, height: state.height, zIndex: state.zIndex, display: state.isMinimized ? "none" : undefined }}
      role="dialog"
      aria-labelledby={`window-title-${state.id}`}
      onPointerDown={onFocus}
    >
      <div
        className="window-titlebar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) onToggleMaximize();
        }}
      >
        <span className="window-title-icon" aria-hidden="true">{icon}</span>
        <span className="window-title" id={`window-title-${state.id}`}>{title}</span>
        <div className="window-controls">
          <button type="button" className="window-control" aria-label={`Minimize ${title}`} onClick={onMinimize}>_</button>
          <button type="button" className="window-control" aria-label={`${state.isMaximized ? "Restore" : "Maximize"} ${title}`} onClick={onToggleMaximize}>{state.isMaximized ? "❐" : "□"}</button>
          <button type="button" className="window-control close-control" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </div>
      </div>
      <div className="window-body" onPointerDown={onFocus}>{children}</div>
    </section>
  );
}

function AppContent({ id, isActive, onOpenApp, onNotice, onReplayBoot }: { id: AppId; isActive: boolean; onOpenApp: (id: AppId) => void; onNotice: (message: string) => void; onReplayBoot: () => void }) {
  switch (id) {
    case "projects":
      return <ProjectsApp onNotice={onNotice} />;
    case "about":
      return <AboutApp />;
    case "terminal":
      return <TerminalApp onOpenApp={onOpenApp} onReplayBoot={onReplayBoot} />;
    case "arcade":
      return <ArcadeApp onOpenApp={onOpenApp} />;
    case "snake":
      return <SnakeGame isActive={isActive} />;
    case "terminal-quest":
      return <TerminalQuest onBack={() => onOpenApp("arcade")} />;
    case "memory":
      return <MemoryGame isActive={isActive} />;
    case "resume":
      return <ResumeApp onNotice={onNotice} />;
    case "contact":
      return <ContactApp />;
  }
}

function ProjectsApp({ onNotice }: { onNotice: (message: string) => void }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  return (
    <div className="explorer-app">
      <div className="explorer-toolbar">
        <button type="button" onClick={() => onNotice("Navigation is intentionally simple in this first build.")}>← Back</button>
        <button type="button" onClick={() => onNotice("You are already looking at the project folder.")}>↑ Up</button>
        <div className="address-bar"><span>📁</span> C:\\Ankit\\Portfolio\\Projects</div>
      </div>
      <div className="explorer-layout">
        <aside className="explorer-sidebar">
          <p className="sidebar-heading">Places</p>
          <button type="button" className="sidebar-link is-current"><span>▣</span> Projects</button>
          <button type="button" className="sidebar-link" onClick={() => onNotice("The desktop is the home folder for now.")}><span>⌂</span> Desktop</button>
          <p className="sidebar-heading">Details</p>
          <p className="sidebar-note">{projects.length} project records</p>
          <p className="sidebar-note">Last edited: today</p>
        </aside>
      <div className="explorer-main">
          <div className="file-list-header"><span>Name</span><span>Type</span><span>Status</span></div>
          <div className="file-list">
            {projects.map((project) => (
              <button
                type="button"
                className={`file-row ${selectedProject.name === project.name ? "is-selected" : ""}`}
                key={project.name}
                onClick={() => setSelectedProject(project)}
                onDoubleClick={() => onNotice(`${project.name} is selected. Use the verified link${project.demo ? "s" : ""} in the details pane to inspect it.`)}
              >
                <span className="file-name"><span className="folder-icon" aria-hidden="true">📁</span>{project.name}</span>
                <span>{project.kind}</span>
                <span className="file-status">{project.status}</span>
              </button>
            ))}
          </div>
          <ProjectDetails project={selectedProject} />
        </div>
      </div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <article className="project-details">
      <div className="details-heading">
        <div>
          <p className="eyebrow">Selected file</p>
          <h2>{project.name}</h2>
          <p className="muted-text">{project.kind}</p>
        </div>
        <span className="details-badge">{project.status}</span>
      </div>
      <p>{project.description}</p>
      <div className="detail-grid">
        <div><span className="detail-label">Stack</span><div className="tag-list">{project.stack.map((item) => <span className="tag" key={item}>{item}</span>)}</div></div>
        <div><span className="detail-label">Technical challenge</span><p className="detail-copy">{project.challenge}</p></div>
        <div><span className="detail-label">Contribution checkpoint</span><p className="detail-copy">{project.contribution}</p></div>
      </div>
      <div className="project-links">
        {project.repository ? <a href={project.repository} target="_blank" rel="noreferrer">Repository ↗</a> : <span className="link-placeholder">Repository URL pending</span>}
        {project.demo ? <a href={project.demo} target="_blank" rel="noreferrer">Live demo ↗</a> : <span className="link-placeholder">Demo URL pending</span>}
      </div>
    </article>
  );
}

function AboutApp() {
  return (
    <div className="notepad-app">
      <div className="notepad-menu"><span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span></div>
      <div className="notepad-paper">
        <p className="notepad-comment">// about_me.txt</p>
        <h1>Hi, I'm {portfolioIdentity.displayName}.</h1>
        <p>{portfolioIdentity.introduction}</p>
        <p>{portfolioIdentity.interests} are the spaces I keep returning to while turning ideas into working projects.</p>
        <p><strong>{portfolioIdentity.title}</strong> · {portfolioIdentity.location}</p>
        <h2>Current focus</h2>
        <ul>
          <li>Building interactive web applications.</li>
          <li>Exploring AI/ML technologies through practical experiments.</li>
          <li>Solving software development problems with clear, usable interfaces.</li>
        </ul>
        <h2>About this desktop</h2>
        <p>{portfolioIdentity.welcomeMessage} This portfolio uses a small personal computer metaphor so projects, tools, and contact details feel like places you can explore.</p>
        <p className="notepad-cursor">_</p>
        <div className="content-checkpoint"><strong>Editable profile:</strong> the identity panel can be updated later without changing the desktop shell.</div>
      </div>
      <div className="notepad-status">Ln 12, Col 1 <span>Windows (CRLF)</span> <span>UTF-8</span></div>
    </div>
  );
}

function TerminalApp({ onOpenApp, onReplayBoot }: { onOpenApp: (id: AppId) => void; onReplayBoot: () => void }) {
  const supportedCommands = [
    "help", "about", "whoami", "projects", "skills", "github", "linkedin", "contact", "resume", "arcade", "snake", "quest", "memory", "terminal",
    "dir", "ls", "tree", "cd", "pwd", "system", "status", "theme", "version", "neofetch", "date", "time", "open",
    "restart", "reboot", "clear", "cls", "echo", "man",
  ];
  const appAliases: Record<string, AppId> = {
    projects: "projects", "my projects": "projects", about: "about", "about me": "about", terminal: "terminal", "terminal.exe": "terminal",
    arcade: "arcade", "arcade.exe": "arcade", snake: "snake", "snake.exe": "snake", quest: "terminal-quest", "terminal quest": "terminal-quest", "terminal-quest.exe": "terminal-quest", memory: "memory", "memory.exe": "memory", resume: "resume", "resume.pdf": "resume", contact: "contact", "contact.lnk": "contact",
  };
  const directoryEntries: Record<string, string[]> = {
    "C:\\ANKIT": [
      "[DIR]  Projects\\",
      "[TXT]  About Me.txt",
      "[APP]  Arcade.exe",
      "[APP]  Terminal.exe",
      "[APP]  Memory.exe",
      "[PDF]  Resume.pdf",
      "[LNK]  Contact.lnk",
    ],
    "C:\\ANKIT\\Projects": [
      "[DIR]  ..\\",
      "[PRJ]  Scribble Arena",
      "[PRJ]  PneumoScan AI",
      "[PRJ]  Society",
    ],
  };
  const commandHelp = [
    "CORE     help  about  whoami  system  status  version",
    "BROWSE   dir  ls  tree  cd  pwd  open <app>",
    "ARCADE   arcade  snake  quest  memory  open snake|quest|memory",
    "PROFILE  projects  skills  github  linkedin  contact  resume",
    "TOOLS    date  time  theme  neofetch  echo <text>  man <command>",
    "CONTROL  clear  cls  restart  reboot",
    "TIP      Use ↑/↓ for history, Tab for completion, and try 'open projects'.",
  ];
  const entryIdRef = useRef(2);
  const [history, setHistory] = useState<TerminalEntry[]>([
    { id: 0, tone: "system", text: "ANKIT_OS Terminal [Version 0.3.0]" },
    { id: 1, tone: "muted", text: "Portfolio shell online. Safe mode enabled — type 'help' to begin." },
    { id: 2, tone: "success", text: "SYSTEM READY // WINDOW MANAGER CONNECTED" },
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState("C:\\ANKIT");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const nextId = () => {
    entryIdRef.current += 1;
    return entryIdRef.current;
  };

  const appendEntries = (entries: Array<Omit<TerminalEntry, "id">>) => {
    setHistory((current) => [...current, ...entries.map((entry) => ({ ...entry, id: nextId() }))]);
  };

  const appendText = (text: string | string[], tone: TerminalTone = "output", appId?: AppId) => {
    const lines = Array.isArray(text) ? text : text.split("\n");
    appendEntries(lines.map((line) => ({ tone, text: line, appId })));
  };

  const appendLink = (label: string, href: string) => {
    appendEntries([{ tone: "success", text: label, href, linkLabel: "open verified link ↗" }]);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [history]);

  const execute = (rawCommand: string) => {
    const trimmedCommand = rawCommand.trim();
    const command = trimmedCommand.toLowerCase().replace(/\s+/g, " ");
    if (!command) return;

    setCommandHistory((current) => [...current, trimmedCommand].slice(-40));
    setHistoryIndex(-1);
    appendEntries([{ tone: "command", text: `${cwd}> ${trimmedCommand}` }]);

    if (command === "clear" || command === "cls") {
      setHistory([]);
      setInput("");
      return;
    }

    const [baseCommand, ...argumentsList] = command.split(" ");
    const argument = argumentsList.join(" ");

    if (baseCommand === "help" || baseCommand === "?") {
      appendText("ANKIT_OS command reference", "system");
      appendText(commandHelp, "output");
    } else if (baseCommand === "dir" || baseCommand === "ls") {
      const currentDirectoryEntries = directoryEntries[cwd] ?? directoryEntries["C:\\ANKIT"];
      appendText(` Volume in drive C is ANKIT_OS\n Directory of ${cwd}\n`, "muted");
      appendText(currentDirectoryEntries, "output");
      appendText(`${currentDirectoryEntries.length} item(s) // 1.4 MB free portfolio space`, "muted");
    } else if (baseCommand === "tree") {
      appendText("C:\\ANKIT\n├── Projects\\\n│   ├── Scribble Arena\n│   ├── PneumoScan AI\n│   └── Society\n├── About Me.txt\n├── Arcade.exe\n├── Snake.exe\n├── Terminal Quest.exe\n├── Memory.exe\n├── Terminal.exe\n├── Resume.pdf\n└── Contact.lnk", "output");
    } else if (baseCommand === "pwd") {
      appendText(cwd, "success");
    } else if (baseCommand === "cd") {
      if (!argument || argument === "~" || argument === "\\") {
        setCwd("C:\\ANKIT");
        appendText("C:\\ANKIT", "success");
      } else if (argument === "..") {
        setCwd("C:\\ANKIT");
        appendText("Moved to C:\\ANKIT", "success");
      } else if (argument === "projects" || argument === "portfolio") {
        setCwd("C:\\ANKIT\\Projects");
        appendText("Moved to C:\\ANKIT\\Projects", "success");
      } else {
        appendText(`The system cannot find the path specified: ${argument}`, "error");
      }
    } else if (baseCommand === "open") {
      const target = appAliases[argument];
      if (target) {
        onOpenApp(target);
        appendText(`Opening ${getApp(target).title}...`, "success", target);
      } else {
        appendText("Usage: open projects|about|terminal|arcade|snake|quest|memory|resume|contact", "error");
      }
    } else if (baseCommand === "about") {
      onOpenApp("about");
      appendText("Opening About Me.txt...", "success", "about");
      appendText(portfolioIdentity.introduction, "output");
    } else if (baseCommand === "projects") {
      onOpenApp("projects");
      appendText("Opening Projects\\...", "success", "projects");
    } else if (baseCommand === "arcade") {
      onOpenApp("arcade");
      appendText("Launching Arcade.exe...", "success", "arcade");
    } else if (baseCommand === "snake") {
      onOpenApp("snake");
      appendText("Launching Snake.exe...", "success", "snake");
    } else if (baseCommand === "quest") {
      onOpenApp("terminal-quest");
      appendText("Launching Terminal Quest.exe...", "success", "terminal-quest");
    } else if (baseCommand === "memory") {
      onOpenApp("memory");
      appendText("Launching Memory.exe...", "success", "memory");
    } else if (baseCommand === "resume") {
      onOpenApp("resume");
      appendText("Opening Resume.pdf...", "success", "resume");
    } else if (baseCommand === "contact") {
      onOpenApp("contact");
      appendText("Opening Contact.lnk...", "success", "contact");
    } else if (baseCommand === "terminal") {
      appendText("Terminal.exe is already running. Safe mode is active.", "success");
    } else if (baseCommand === "skills") {
      appendText(portfolioIdentity.interests, "output");
    } else if (baseCommand === "github") {
      appendLink(`${portfolioLinks.github.label}: ${portfolioLinks.github.href}`, portfolioLinks.github.href);
    } else if (baseCommand === "linkedin") {
      appendLink(`${portfolioLinks.linkedin.label}: ${portfolioLinks.linkedin.href}`, portfolioLinks.linkedin.href);
    } else if (baseCommand === "system") {
      appendText(`${portfolioIdentity.computerName} PERSONAL DESKTOP SYSTEM\nUSER: ${portfolioIdentity.fullName}\nROLE: ${portfolioIdentity.title}\nLOCATION: ${portfolioIdentity.location}\nUI: React + TypeScript + Vite\nWINDOW MANAGER: online\nTERMINAL: safe portfolio shell`, "output");
    } else if (baseCommand === "status") {
      appendText("SYSTEM READY\nBoot sequence: complete\nWindow manager: online\nTerminal safety: enabled\nDesktop: interactive", "success");
    } else if (baseCommand === "version") {
      appendText("ANKIT_OS v0.3.0 // Personal Desktop Portfolio", "system");
    } else if (baseCommand === "theme") {
      appendText("Theme: Windows-inspired desktop\nPalette: teal / gray / navy / pixel yellow\nEffects: CRT texture + pixel dithering", "output");
    } else if (baseCommand === "neofetch") {
      appendText("        .----.       ankit@personal-desktop\n       / .-.  \\      ------------------------\n      | |   | | |     OS: ANKIT_OS\n      | |___| | |     Shell: portfolio-safe\n       \\_____/ /      UI: React + TypeScript\n        `----`        Status: READY", "output");
    } else if (baseCommand === "whoami") {
      appendText(`${portfolioIdentity.displayName} — ${portfolioIdentity.title}`, "output");
    } else if (baseCommand === "date" || baseCommand === "time") {
      appendText(new Date().toString(), "output");
    } else if (baseCommand === "echo") {
      appendText(argument || "(empty)", "output");
    } else if (baseCommand === "man") {
      const manualText = argument ? `MANUAL: ${argument}\nTry the command, then use ↑ to repeat it. No real system commands are executed.` : "Usage: man <command>";
      appendText(manualText, argument ? "muted" : "error");
    } else if (baseCommand === "restart" || baseCommand === "reboot") {
      appendText("Restarting ANKIT.EXE...", "success");
      onReplayBoot();
    } else if (baseCommand === "exit" || baseCommand === "quit") {
      appendText("This terminal stays open so the portfolio remains discoverable. Try 'clear' instead.", "muted");
    } else {
      appendText(`'${baseCommand}' is not recognized as an ANKIT_OS command. Type 'help'.`, "error");
    }

    setInput("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    execute(input);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (commandHistory.length === 0 || historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const currentInput = input.trimStart().toLowerCase();
      if (currentInput.startsWith("open ")) {
        const targetPrefix = currentInput.slice(5);
        const targetMatch = Object.keys(appAliases).find((item) => item.startsWith(targetPrefix));
        if (targetMatch) setInput(`open ${targetMatch}`);
      } else {
        const completionPool = [...supportedCommands, ...Object.keys(appAliases)];
        const match = completionPool.find((item) => item.startsWith(currentInput));
        if (match) setInput(match);
      }
    }
  };

  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-toolbar">
        <div className="terminal-toolbar-brand"><span className="terminal-led" /> ANKIT_OS SHELL</div>
        <div className="terminal-toolbar-meta">SAFE MODE <span>•</span> {cwd}</div>
      </div>
      <div className="terminal-quick-actions" onClick={(event) => event.stopPropagation()}>
        {['help', 'dir', 'system', 'open projects'].map((command) => (
          <button type="button" key={command} onClick={() => execute(command)}>{command}</button>
        ))}
      </div>
      <div className="terminal-output" aria-live="polite">
        {history.map((entry) => (
          <div className={`terminal-entry terminal-entry-${entry.tone}`} key={entry.id}>
            <pre>{entry.text}</pre>
            {entry.appId && <button type="button" className="terminal-entry-link" onClick={() => onOpenApp(entry.appId!)}>focus {getApp(entry.appId).title} ↗</button>}
            {entry.href && <a className="terminal-entry-link" href={entry.href} target="_blank" rel="noreferrer">{entry.linkLabel ?? "open link ↗"}</a>}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>
      <form className="terminal-prompt" onSubmit={handleSubmit}>
        <label htmlFor="terminal-input">{cwd}&gt;</label>
        <input ref={inputRef} id="terminal-input" value={input} onChange={(event) => { setInput(event.target.value); setHistoryIndex(-1); }} onKeyDown={handleInputKeyDown} autoComplete="off" spellCheck={false} aria-label="Terminal command" placeholder="type a command..." />
        <span className="terminal-cursor" aria-hidden="true">█</span>
      </form>
      <div className="terminal-footer"><span>↑↓ history</span><span>Tab complete</span><span>safe shell</span></div>
    </div>
  );
}

function ArcadeApp({ onOpenApp }: { onOpenApp: (id: AppId) => void }) {
  return (
    <div className="arcade-app arcade-launcher">
      <div className="arcade-launcher-header">
        <div>
          <p className="eyebrow">ANKIT.EXE // ARCADE SYSTEM</p>
          <h1>Choose a game</h1>
        </div>
        <span className="arcade-cabinet-mark">★</span>
      </div>
      <p className="arcade-launcher-copy">Small experiments, safe simulations, and one more reason to keep the desktop open.</p>
      <div className="arcade-game-grid">
        <button type="button" className="arcade-game-card" onClick={() => onOpenApp("snake")}>
          <span className="arcade-game-icon">▦</span>
          <span><strong>SNAKE.EXE</strong><small>Recover data bytes and keep the pixel process alive.</small></span>
          <span className="arcade-launch-arrow">›</span>
        </button>
        <button type="button" className="arcade-game-card arcade-game-card-featured" onClick={() => onOpenApp("terminal-quest")}>
          <span className="arcade-game-icon">&gt;_</span>
          <span><strong>TERMINAL QUEST.EXE</strong><small>Solve three coding missions and unlock the secret file.</small></span>
          <span className="arcade-launch-arrow">›</span>
        </button>
        <button type="button" className="arcade-game-card" onClick={() => onOpenApp("memory")}>
          <span className="arcade-game-icon">▦</span>
          <span><strong>MEMORY.EXE</strong><small>Match the technology archive across three grid sizes.</small></span>
          <span className="arcade-launch-arrow">›</span>
        </button>
      </div>
      <div className="arcade-launcher-footer"><span>3 PLAYABLE ENTRIES</span><span>SAFE LOCAL SIMULATIONS</span></div>
    </div>
  );
}

function ResumeApp({ onNotice }: { onNotice: (message: string) => void }) {
  const [resumeStatus, setResumeStatus] = useState<"checking" | "available" | "missing">("checking");
  const [isViewingResume, setIsViewingResume] = useState(false);

  const checkResume = (notifyOnMissing = false) => {
    setResumeStatus("checking");
    fetch("/resume.pdf", { cache: "no-store" })
      .then((response) => {
        const isPdf = response.ok && (response.headers.get("content-type") ?? "").includes("application/pdf");
        setResumeStatus(isPdf ? "available" : "missing");
        if (!isPdf && notifyOnMissing) onNotice("Add the resume PDF to public/resume.pdf, then try again.");
      })
      .catch(() => {
        setResumeStatus("missing");
        if (notifyOnMissing) onNotice("Could not load public/resume.pdf. Check the file and try again.");
      });
  };

  useEffect(() => {
    checkResume();
  }, []);

  return (
    <div className="resume-app">
      <div className="pdf-toolbar">
        <span className="pdf-badge">PDF</span>
        <span>Resume.pdf</span>
        {isViewingResume && (
          <button type="button" className="pdf-toolbar-button" onClick={() => setIsViewingResume(false)}>Back to summary</button>
        )}
        <span className="pdf-page">{resumeStatus === "checking" ? "Checking file..." : resumeStatus === "available" ? "PDF ready" : "PDF missing"}</span>
      </div>
      {isViewingResume && resumeStatus === "available" ? (
        <iframe className="resume-pdf-frame" src="/resume.pdf#view=FitH" title={`${portfolioIdentity.fullName} resume PDF`} />
      ) : (
        <div className="resume-overview-scroll">
          <article className="resume-overview">
            <header className="resume-overview-header">
              <div className="resume-monogram" aria-hidden="true">AP</div>
              <div className="resume-heading-copy">
                <p className="resume-eyebrow">PROFILE SUMMARY</p>
                <h1>{portfolioIdentity.fullName}</h1>
                <p className="resume-role">{portfolioIdentity.title}</p>
                <p className="resume-contact">{portfolioIdentity.location} <span aria-hidden="true">|</span> {portfolioIdentity.email}</p>
              </div>
            </header>

            <section className="resume-summary-section">
              <h2>Summary</h2>
              <p>{portfolioIdentity.introduction}</p>
            </section>

            <section className="resume-highlights-section">
              <h2>Highlights</h2>
              <ul>
                <li>Computer Science and Engineering student at OP Jindal University.</li>
                <li>Builds full-stack and real-time applications with React, TypeScript, Node.js, Express, and Socket.IO.</li>
                <li>Explores applied AI/ML through projects such as PneumoScan AI.</li>
              </ul>
            </section>

            <footer className="resume-overview-footer">
              {resumeStatus === "available" ? (
                <>
                  <button type="button" className="retro-button primary-button" onClick={() => setIsViewingResume(true)}>View full resume</button>
                  <a className="retro-button resume-download-button" href="/resume.pdf" download="Ankit-Prakash-Resume.pdf">Download PDF</a>
                </>
              ) : resumeStatus === "checking" ? (
                <span className="resume-file-status">Checking for the full resume PDF...</span>
              ) : (
                <>
                  <span className="resume-file-status">The full resume is not available right now.</span>
                  <button type="button" className="retro-button" onClick={() => checkResume(true)}>Try again</button>
                </>
              )}
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}

function ContactApp() {
  return (
    <div className="contact-app">
      <div className="contact-hero"><span className="contact-at">@</span><div><p className="eyebrow">Contact.lnk</p><h1>Let's make something useful.</h1></div></div>
      <p className="contact-copy">Reach {portfolioIdentity.fullName} in {portfolioIdentity.location}. These are verified destinations from the portfolio content file.</p>
      <div className="contact-list">
        <ContactRow label="Email" value={portfolioIdentity.email} icon="✉" href={`mailto:${portfolioIdentity.email}`} />
        <ContactRow label="Phone" value={portfolioIdentity.phone} icon="☎" href={`tel:${portfolioIdentity.phone}`} />
        <ContactRow label="GitHub" value={portfolioLinks.github.href} icon="◉" href={portfolioLinks.github.href} external />
        <ContactRow label="LinkedIn" value={portfolioLinks.linkedin.href} icon="in" href={portfolioLinks.linkedin.href} external />
      </div>
      <div className="content-checkpoint"><strong>Content note:</strong> profile links are kept in <code>src/content/portfolio.ts</code> so they can be updated without rewriting the desktop shell.</div>
    </div>
  );
}

function ContactRow({ label, value, icon, href, external }: { label: string; value: string; icon: string; href: string; external?: boolean }) {
  return (
    <a className="contact-row" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      <span className="contact-row-icon" aria-hidden="true">{icon}</span>
      <span><strong>{label}</strong><small>{value}</small></span>
      <span className="contact-arrow" aria-hidden="true">›</span>
    </a>
  );
}

export default App;
