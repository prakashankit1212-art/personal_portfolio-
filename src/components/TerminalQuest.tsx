import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

type MissionIndex = 0 | 1 | 2;
type QuestTone = "system" | "command" | "output" | "success" | "error" | "muted" | "hint";

type QuestLine = {
  id: number;
  text: string;
  tone: QuestTone;
};

type QuestSave = {
  completed: [boolean, boolean, boolean];
  xp: number;
  bestXp: number;
};

type TerminalQuestProps = {
  onBack: () => void;
};

const STORAGE_KEY = "ankit-exe-terminal-quest-v1";
const DEFAULT_SAVE: QuestSave = { completed: [false, false, false], xp: 0, bestXp: 0 };

const missionNames = ["System Scan", "Debug the Program", "Unlock the Secret"] as const;

const missionBriefings = [
  "MISSION 1 // SYSTEM SCAN\nInspect the simulated machine, locate the hidden project file, and submit the answer stored inside it.\nStart with: scan",
  "MISSION 2 // DEBUG THE PROGRAM\nA tiny JavaScript function is returning the wrong result. Inspect the code, identify the operator bug, and submit the correction.\nStart with: inspect",
  "MISSION 3 // UNLOCK THE SECRET\nThe first two missions left clues. Combine them in the correct format to unlock the final file.\nStart with: clues",
] as const;

const missionHelp = [
  "help       show commands\nscan       inspect the simulated environment\nls         list virtual files\ncat <file>  read a virtual file\nhint       reveal a clue\nstatus     show progress\nsubmit <answer>  submit the mission answer\nclear      clear visible output",
  "help       show commands\ninspect    inspect bug.js\ncat bug.js  read the buggy code\nhint       reveal a clue\nstatus     show progress\nsubmit <answer>  submit the correction\nclear      clear visible output",
  "help       show commands\nclues      show the discovered mission clues\nunlock <key>  attempt the final unlock\nhint       reveal a clue\nstatus     show progress\ncat secret.txt  read the unlocked file\nclear      clear visible output",
] as const;

const questIntroLines: QuestLine[] = [
  { id: 0, tone: "system", text: "TERMINAL QUEST v1.0 // ANKIT.EXE ARCADE" },
  { id: 1, tone: "muted", text: "Safe simulation online. No real shell commands are executed." },
];

function readQuestSave(): QuestSave {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<QuestSave>;
    const completed = Array.isArray(parsed.completed) && parsed.completed.length === 3
      ? parsed.completed.map((value) => value === true) as [boolean, boolean, boolean]
      : DEFAULT_SAVE.completed;
    const xp = typeof parsed.xp === "number" && Number.isFinite(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0;
    const bestXp = typeof parsed.bestXp === "number" && Number.isFinite(parsed.bestXp) && parsed.bestXp >= 0 ? parsed.bestXp : xp;
    return { completed, xp, bestXp: Math.max(bestXp, xp) };
  } catch {
    return DEFAULT_SAVE;
  }
}

function writeQuestSave(save: QuestSave) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

function hasQuestStorage() {
  try {
    const probeKey = `${STORAGE_KEY}-probe`;
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function firstIncompleteMission(completed: [boolean, boolean, boolean]) {
  const index = completed.findIndex((value) => !value);
  return (index === -1 ? 2 : index) as MissionIndex;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "");
}

function TerminalQuest({ onBack }: TerminalQuestProps) {
  const [save, setSave] = useState<QuestSave>(() => readQuestSave());
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [hintUsed, setHintUsed] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [missionOneScanned, setMissionOneScanned] = useState(false);
  const [missionOneKeyRead, setMissionOneKeyRead] = useState(false);
  const [missionTwoInspected, setMissionTwoInspected] = useState(false);
  const [lines, setLines] = useState<QuestLine[]>(questIntroLines);
  const [storageAvailable] = useState(() => hasQuestStorage());
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(questIntroLines.length - 1);

  const activeMission = firstIncompleteMission(save.completed);
  const isComplete = save.completed.every(Boolean);

  useEffect(() => {
    if (storageAvailable) writeQuestSave(save);
  }, [save, storageAvailable]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [started]);

  const appendLines = (entries: Array<{ text: string; tone?: QuestTone }>) => {
    const nextLines = entries.flatMap(({ text, tone = "output" }) => text.split("\n").map((line) => {
      lineIdRef.current += 1;
      return { id: lineIdRef.current, tone, text: line };
    }));
    setLines((current) => [...current, ...nextLines]);
  };

  const appendText = (text: string, tone: QuestTone = "output") => {
    appendLines([{ text, tone }]);
  };

  const resetMissionFlags = () => {
    setMissionOneScanned(false);
    setMissionOneKeyRead(false);
    setMissionTwoInspected(false);
  };

  const startMission = () => {
    setStarted(true);
    appendLines([
      { text: `C:\\ANKIT\\QUEST> boot --mission ${activeMission + 1}`, tone: "command" },
      { text: missionBriefings[activeMission], tone: "system" },
    ]);
  };

  const restartGame = () => {
    const nextSave: QuestSave = { completed: [false, false, false], xp: 0, bestXp: save.bestXp };
    setSave(nextSave);
    setStarted(false);
    setInput("");
    setCommandHistory([]);
    setHistoryIndex(-1);
    setHintUsed([false, false, false]);
    resetMissionFlags();
    setLines(questIntroLines);
    lineIdRef.current = questIntroLines.length - 1;
  };

  const showStatus = () => {
    const completedCount = save.completed.filter(Boolean).length;
    appendText(`MISSION ${activeMission + 1}/3 // ${missionNames[activeMission]}\nProgress: ${completedCount}/3 missions complete\nXP: ${save.xp} // Best XP: ${save.bestXp}\nHints used this run: ${hintUsed.filter(Boolean).length}`, "system");
  };

  const showHint = () => {
    const nextHints = [...hintUsed] as [boolean, boolean, boolean];
    nextHints[activeMission] = true;
    setHintUsed(nextHints);
    const hints = [
      "Hint: scan first, then list the /vault directory. The project map points to the hidden file.",
      "Hint: inspect bug.js. The function should add the two values, not subtract them.",
      "Hint: combine the two discovered words with a hyphen: PIXEL-PLUS.",
    ];
    appendText(hints[activeMission], "hint");
  };

  const completeMission = (mission: MissionIndex) => {
    if (save.completed[mission]) return;
    const baseXp = mission === 2 ? 150 : 100;
    const bonusXp = hintUsed[mission] ? 0 : 25;
    const nextCompleted = [...save.completed] as [boolean, boolean, boolean];
    nextCompleted[mission] = true;
    const nextXp = save.xp + baseXp + bonusXp;
    const nextSave: QuestSave = { completed: nextCompleted, xp: nextXp, bestXp: Math.max(save.bestXp, nextXp) };
    setSave(nextSave);
    appendText(`MISSION ${mission + 1} COMPLETE // +${baseXp + bonusXp} XP${bonusXp ? " // no-hint bonus" : ""}`, "success");
    if (mission < 2) {
      appendText(missionBriefings[mission + 1], "system");
    } else {
      appendText("ALL MISSIONS COMPLETE. SECRET FILE UNLOCKED.", "success");
      appendText("Final message: Build boldly, debug kindly, and keep making useful things.", "system");
    }
  };

  const execute = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
    const [command, ...argumentParts] = normalized.split(" ");
    const argument = argumentParts.join(" ");
    setCommandHistory((current) => [...current, trimmed].slice(-30));
    setHistoryIndex(-1);
    appendLines([{ text: `C:\\ANKIT\\QUEST> ${trimmed}`, tone: "command" }]);

    if (command === "clear" || command === "cls") {
      setLines([]);
      setInput("");
      return;
    }

    if (command === "help" || command === "?") {
      appendText(missionHelp[activeMission], "output");
    } else if (command === "status") {
      showStatus();
    } else if (command === "hint") {
      showHint();
    } else if (command === "restart") {
      restartGame();
      return;
    } else if (activeMission === 0) {
      executeMissionOne(command, argument);
    } else if (activeMission === 1) {
      executeMissionTwo(command, argument);
    } else {
      executeMissionThree(command, argument);
    }

    setInput("");
  };

  function executeMissionOne(command: string, argument: string) {
    if (command === "scan") {
      setMissionOneScanned(true);
      appendText("Scanning ANKIT\\QUEST...\n[OK] /home/ankit/projects\n[OK] /vault\n[OK] /system\nHidden project files detected in /vault.", "success");
    } else if (command === "ls") {
      if (!missionOneScanned) {
        appendText("Environment not scanned. Run: scan", "error");
      } else {
        appendText("/vault\n  notes.log\n  project-map.txt\n  quest-key.txt\n/system\n  status.txt", "output");
      }
    } else if (command === "cat") {
      if (!argument) {
        appendText("Usage: cat <filename> // example: cat project-map.txt", "error");
      } else if (!missionOneScanned) {
        appendText("Permission denied: scan the environment before reading files.", "error");
      } else if (["project-map.txt", "/vault/project-map.txt"].includes(argument)) {
        appendText("PROJECT MAP\nThe next clue lives in quest-key.txt.\nRead it, then submit the answer it contains.", "output");
      } else if (["notes.log", "/vault/notes.log"].includes(argument)) {
        appendText("notes.log\nA project can hide in plain sight when you know which directory to inspect.", "output");
      } else if (["quest-key.txt", "/vault/quest-key.txt"].includes(argument)) {
        setMissionOneKeyRead(true);
        appendText("quest-key.txt\nSYSTEM SCAN ANSWER: PIXEL", "success");
      } else if (["status.txt", "/system/status.txt"].includes(argument)) {
        appendText("SYSTEM STATUS\nAll simulated services are healthy. Mission state is local to this game.", "output");
      } else {
        appendText(`File not found: ${argument}. Try ls.`, "error");
      }
    } else if (command === "submit") {
      if (!argument) {
        appendText("Usage: submit <answer> // example: submit pixel", "error");
      } else if (!missionOneKeyRead) {
        appendText("Answer locked. Discover and read quest-key.txt first.", "error");
      } else if (normalizeAnswer(argument) === "pixel") {
        completeMission(0);
      } else {
        appendText("Incorrect answer. Re-read quest-key.txt and try again.", "error");
      }
    } else {
      appendText(`Unknown command: ${command}. Type help for mission commands.`, "error");
    }
  }

  function executeMissionTwo(command: string, argument: string) {
    if (command === "inspect" || (command === "cat" && argument === "bug.js")) {
      setMissionTwoInspected(true);
      appendText("bug.js\nfunction add(a, b) {\n  return a - b;\n}\n\nconsole.log(add(8, 5));\n\nThe mission expects an addition result.", "output");
    } else if (command === "cat") {
      appendText("Usage: cat bug.js // or use inspect", "error");
    } else if (command === "submit") {
      if (!argument) {
        appendText("Usage: submit <answer> // example: submit return a + b;", "error");
      } else if (!missionTwoInspected) {
        appendText("The code is still hidden. Run inspect first.", "error");
      } else {
        const answer = normalizeAnswer(argument);
        const acceptedAnswers = new Set(["returna+b;", "a+b", "returna+b", "change-to+", "plus"]);
        if (acceptedAnswers.has(answer)) {
          completeMission(1);
          appendText("Why it works: + combines the two numeric inputs. - subtracts the second input instead.", "system");
        } else {
          appendText("Not accepted. Replace the subtraction with addition: return a + b;", "error");
        }
      }
    } else {
      appendText(`Unknown command: ${command}. Type help for mission commands.`, "error");
    }
  }

  function executeMissionThree(command: string, argument: string) {
    if (command === "clues") {
      appendText("DISCOVERED CLUES\nMission 1 file: PIXEL\nMission 2 correction: PLUS\nFormat: combine the clues with a hyphen.", "output");
    } else if (command === "unlock" || command === "submit") {
      if (!argument) {
        appendText("Usage: unlock <key> // example: unlock pixel-plus", "error");
      } else if (normalizeAnswer(argument) === "pixel-plus" || normalizeAnswer(argument) === "pixelplus") {
        completeMission(2);
      } else {
        appendText("Unlock rejected. Use the two mission clues in the requested format.", "error");
      }
    } else if (command === "cat") {
      if (argument === "secret.txt" && isComplete) {
        appendText("secret.txt\nYou found the hidden ANKIT.EXE message. Keep building, keep testing, keep shipping.", "success");
      } else if (argument === "secret.txt") {
        appendText("secret.txt is encrypted. Complete the unlock mission first.", "error");
      } else {
        appendText("Only the unlocked secret.txt file is available in this mission.", "error");
      }
    } else {
      appendText(`Unknown command: ${command}. Type help for mission commands.`, "error");
    }
  }

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
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    }
  };

  if (!started) {
    return (
      <div className={`quest-app ${scanlinesEnabled ? "has-scanlines" : ""}`}>
        <div className="quest-toolbar">
          <button type="button" className="quest-toolbar-button" onClick={onBack}>← Arcade</button>
          <strong>Terminal Quest.exe</strong>
          <label className="quest-scan-toggle"><input type="checkbox" checked={scanlinesEnabled} onChange={(event) => setScanlinesEnabled(event.target.checked)} /> CRT</label>
        </div>
        <div className="quest-start-screen">
          <div className="quest-logo">&gt;_</div>
          <p className="quest-kicker">ANKIT.EXE // ARCADE SYSTEM</p>
          <h1>TERMINAL QUEST v1.0</h1>
          <p className="quest-briefing">Three coding-themed missions stand between you and a locked virtual file. Inspect the system, fix a beginner-friendly JavaScript bug, and combine the clues to unlock the secret.</p>
          <div className="quest-start-grid">
            <div><strong>1</strong><span>System Scan</span></div>
            <div><strong>2</strong><span>Debug Program</span></div>
            <div><strong>3</strong><span>Unlock Secret</span></div>
          </div>
          <button type="button" className="quest-primary-button" onClick={startMission}>{save.completed.some(Boolean) ? "Continue Mission" : "Start Mission"}</button>
          <p className="quest-instructions">Type commands at <code>C:\\ANKIT\\QUEST&gt;</code>. Use Enter or the Submit button. ↑/↓ navigates command history. Hints reduce the no-hint XP bonus.</p>
          <div className="quest-save-status">{storageAvailable ? `LOCAL SAVE READY // XP ${save.xp} // BEST ${save.bestXp}` : "LOCAL SAVE UNAVAILABLE // SESSION ONLY"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`quest-app ${scanlinesEnabled ? "has-scanlines" : ""}`} onClick={() => inputRef.current?.focus()}>
      <div className="quest-toolbar" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="quest-toolbar-button" onClick={onBack}>← Arcade</button>
        <strong>Terminal Quest.exe</strong>
        <label className="quest-scan-toggle"><input type="checkbox" checked={scanlinesEnabled} onChange={(event) => setScanlinesEnabled(event.target.checked)} /> CRT</label>
      </div>
      <div className="quest-statusbar">
        <span>MISSION {isComplete ? "COMPLETE" : `${activeMission + 1}/3`}</span>
        <strong>{isComplete ? "SECRET UNLOCKED" : missionNames[activeMission]}</strong>
        <span>XP {save.xp} / BEST {save.bestXp}</span>
      </div>
      <div className="quest-output" aria-live="polite">
        {lines.map((line) => <pre className={`quest-line quest-line-${line.tone}`} key={line.id}>{line.text}</pre>)}
        {isComplete && <div className="quest-success-banner">ALL SYSTEMS SOLVED // ANKIT.EXE QUEST COMPLETE</div>}
        <div ref={terminalEndRef} />
      </div>
      <form className="quest-prompt" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
        <label htmlFor="quest-input">C:\\ANKIT\\QUEST&gt;</label>
        <input ref={inputRef} id="quest-input" value={input} onChange={(event) => { setInput(event.target.value); setHistoryIndex(-1); }} onKeyDown={handleInputKeyDown} autoComplete="off" spellCheck={false} placeholder="type help to begin..." aria-label="Terminal Quest command" />
        <button type="submit" className="quest-submit-button">Submit</button>
        <span className="quest-cursor" aria-hidden="true">█</span>
      </form>
      <div className="quest-controls" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={showHint}>Hint</button>
        <button type="button" onClick={showStatus}>Status</button>
        <button type="button" onClick={restartGame}>Restart Game</button>
        <span>↑↓ history // safe simulation</span>
      </div>
    </div>
  );
}

export default TerminalQuest;
