import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

type Zone = "instrumental" | "lyrics";
type Tab = "home" | "organize" | "help";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface MoveResult {
  destination: string;
  filename: string;
}

interface DayEntry {
  date: string;
  count: number;
}

interface AudioFile {
  name: string;
  path: string;
  source_folder: string;
}

type TransferMode = "copy" | "move";

// ─── Help tab content ───────────────────────────────────────────────

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "\u{1F3AC}",
    content: [
      "Vulta organizes your daily creative output into a date-based folder structure. Every time you drop or send a file, it goes into an \"Idea Gen\" folder for today's date.",
      "Use the folder button in the header to choose where Vulta saves files. By default it uses your Music folder.",
    ],
  },
  {
    id: "drop-zones",
    title: "Drop Zones",
    icon: "\u{1F3AF}",
    content: [
      "Switch to the Organize tab to see two drop zones: Instrumentals/Beats and Lyrics & Melody. Drag audio files from your file manager onto the correct zone.",
      "Files are moved into today's dated subfolder automatically. If a file with the same name already exists, Vulta appends a number (_1, _2, etc.).",
    ],
  },
  {
    id: "mixdowns",
    title: "Mixdowns",
    icon: "\u{1F3B5}",
    content: [
      "The Mixdowns panel on the Home tab lets you watch folders for new audio files. Click the + button to add a watch folder, then use the Inst/Lyr buttons to quickly send files to the right zone.",
      "Toggle between Copy and Move mode with the mode button. Copy leaves the original in place; Move removes it after transfer.",
    ],
  },
  {
    id: "yearly-goal",
    title: "Yearly Goal & Heatmap",
    icon: "\u{1F525}",
    content: [
      "Set a yearly goal by clicking the goal number on the Home tab. The heatmap shows your last 30 days of activity \u2014 darker green means more ideas that day.",
      "Your streak counter tracks consecutive days with at least one idea. The progress card shows how many ideas remain to hit your annual target.",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: "\u2699\uFE0F",
    content: [
      "Click the folder path in the header to change the output directory. Enable \"Launch on startup\" on the Home tab to have Vulta open when your computer starts.",
      "Watch folders for the Mixdowns panel are saved between sessions. Remove a watch folder by clicking the \u00D7 on its chip.",
    ],
  },
];

// ─── Onboarding step definitions ────────────────────────────────────

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  targetTab?: Tab;
  position: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Vulta",
    description:
      "Vulta organizes your daily creative output into date-based folders. Let\u2019s take a quick tour.",
    targetSelector: ".app-header h1",
    position: "bottom",
  },
  {
    id: "home-overview",
    title: "Home Tab",
    description:
      "This is your dashboard. See today\u2019s ideas count, your streak, heatmap, and yearly progress at a glance.",
    targetSelector: ".home-left",
    targetTab: "home",
    position: "right",
  },
  {
    id: "mixdowns",
    title: "Mixdowns Panel",
    description:
      "Watch folders for new audio files and quickly sort them into the right zone. Add folders with the + button.",
    targetSelector: ".mixdowns-section",
    targetTab: "home",
    position: "left",
  },
  {
    id: "organize",
    title: "Drop Zones",
    description:
      "Drag files from your file manager onto Instrumentals or Lyrics & Melody to organize them instantly.",
    targetSelector: ".zones",
    targetTab: "organize",
    position: "top",
  },
  {
    id: "yearly-goal",
    title: "Yearly Goal",
    description:
      "Click the goal number to set a target. The heatmap and progress bar track how you\u2019re doing.",
    targetSelector: ".stats-grid",
    targetTab: "home",
    position: "bottom",
  },
  {
    id: "done",
    title: "You\u2019re all set!",
    description:
      "Start dropping files to build your creative streak. You can always revisit the Help tab for guidance.",
    targetSelector: ".tab-nav",
    position: "bottom",
  },
];

// ─── Heatmap component ──────────────────────────────────────────────

function Heatmap({ data }: { data: DayEntry[] }) {
  const getLevel = (count: number): string => {
    if (count === 0) return "heat-0";
    if (count <= 2) return "heat-1";
    if (count <= 4) return "heat-2";
    return "heat-3";
  };

  return (
    <div className="heatmap">
      {data.map((d, i) => (
        <div key={i} className={`heat-cell ${getLevel(d.count)}`} title={`${d.date}: ${d.count} ideas`}>
          <span className="heat-tooltip">{d.date}<br />{d.count} idea{d.count !== 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Goal stat card (click-to-edit) ─────────────────────────────────

function GoalStatCard({ goal, onSave }: { goal: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(goal)); }, [goal]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
    else setDraft(String(goal));
    setEditing(false);
  };

  return (
    <div className="stat-card stat-card-goal" onClick={() => !editing && setEditing(true)}>
      {editing ? (
        <input
          ref={inputRef}
          className="goal-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          type="number"
          min={1}
        />
      ) : (
        <div className="stat-value">{goal}</div>
      )}
      <div className="stat-label">yearly goal</div>
    </div>
  );
}

// ─── Goal progress card ─────────────────────────────────────────────

function GoalProgressCard({ current, goal }: { current: number; goal: number }) {
  const remaining = Math.max(0, goal - current);
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return (
    <div className="stat-card">
      <div className="stat-value">{remaining > 0 ? remaining : "Done!"}</div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="stat-label">{remaining > 0 ? "to go" : "goal reached"}</div>
    </div>
  );
}

// ─── Mixdowns section ────────────────────────────────────────────────

function MixdownsSection({
  baseDir,
  addToast,
}: {
  baseDir: string;
  addToast: (msg: string, type: "success" | "error") => void;
}) {
  const [watchFolders, setWatchFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [transferMode, setTransferMode] = useState<TransferMode>("copy");

  useEffect(() => {
    invoke<string[]>("load_watch_folders")
      .then(setWatchFolders)
      .catch(() => {});
  }, []);

  const scanFiles = useCallback(() => {
    if (watchFolders.length === 0) {
      setFiles([]);
      return;
    }
    invoke<AudioFile[]>("scan_watch_folders", { watchFolders })
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [watchFolders]);

  useEffect(() => {
    scanFiles();
  }, [scanFiles]);

  const addWatchFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose a mixdown watch folder",
    });
    if (selected && !watchFolders.includes(selected)) {
      const updated = [...watchFolders, selected];
      setWatchFolders(updated);
      invoke("save_watch_folders", { watchFolders: updated }).catch(() => {});
    }
  };

  const removeWatchFolder = (folder: string) => {
    const updated = watchFolders.filter((f) => f !== folder);
    setWatchFolders(updated);
    invoke("save_watch_folders", { watchFolders: updated }).catch(() => {});
  };

  const transferFile = async (filePath: string, zone: Zone) => {
    try {
      const result = await invoke<MoveResult>("move_file", {
        sourcePath: filePath,
        zone,
        baseDir: baseDir || null,
        mode: transferMode,
      });
      const verb = transferMode === "copy" ? "copied" : "moved";
      addToast(`${result.filename} ${verb}`, "success");
      scanFiles();
    } catch (err) {
      addToast(`Error: ${String(err)}`, "error");
    }
  };

  const folderDisplayName = (fullPath: string) => {
    const parts = fullPath.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || fullPath;
  };

  return (
    <div className="mixdowns-section">
      <div className="mixdowns-header">
        <span className="mixdowns-title">Mixdowns</span>
        <div className="mixdowns-actions">
          <button
            className={`mode-toggle ${transferMode === "copy" ? "mode-copy" : "mode-move"}`}
            onClick={() => setTransferMode(transferMode === "copy" ? "move" : "copy")}
            title={`Mode: ${transferMode}. Click to toggle.`}
          >
            {transferMode === "copy" ? "Copy" : "Move"}
          </button>
          <button className="mixdowns-btn" onClick={scanFiles} title="Refresh file list">
            &#8635;
          </button>
          <button className="mixdowns-btn" onClick={addWatchFolder} title="Add watch folder">
            +
          </button>
        </div>
      </div>

      {watchFolders.length > 0 && (
        <div className="watch-folders">
          {watchFolders.map((folder) => (
            <span key={folder} className="watch-chip">
              {folderDisplayName(folder)}
              <button className="chip-remove" onClick={() => removeWatchFolder(folder)}>
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {watchFolders.length === 0 ? (
        <div className="mixdowns-empty">Add a watch folder to see your mixdowns</div>
      ) : files.length === 0 ? (
        <div className="mixdowns-empty">No audio files found</div>
      ) : (
        <div className="mixdowns-list">
          {files.map((file) => (
            <div key={file.path} className="mixdown-row">
              <div className="mixdown-info">
                <span className="mixdown-name">{file.name}</span>
                <span className="mixdown-source">{folderDisplayName(file.source_folder)}</span>
              </div>
              <div className="mixdown-zone-btns">
                <button
                  className="zone-pill zone-pill-inst"
                  onClick={() => transferFile(file.path, "instrumental")}
                  title="Instrumental"
                >
                  Inst
                </button>
                <button
                  className="zone-pill zone-pill-lyr"
                  onClick={() => transferFile(file.path, "lyrics")}
                  title="Lyrics &amp; Melody"
                >
                  Lyr
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Home tab (two-column layout) ───────────────────────────────────

function HomeTab({
  baseDir,
  addToast,
}: {
  baseDir: string;
  addToast: (msg: string, type: "success" | "error") => void;
}) {
  const [history, setHistory] = useState<DayEntry[]>([]);
  const [autostart, setAutostart] = useState(false);
  const [yearlyGoal, setYearlyGoal] = useState(365);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const todayCount = history.length > 0 ? history[history.length - 1].count : 0;

  const loadHistory = useCallback(() => {
    invoke<DayEntry[]>("get_contribution_history", {
      baseDir: baseDir || null,
    })
      .then(setHistory)
      .catch(() => {});
  }, [baseDir]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    invoke<number>("load_yearly_goal").then(setYearlyGoal).catch(() => {});
  }, []);

  useEffect(() => {
    invoke<number>("get_yearly_total", { baseDir: baseDir || null })
      .then(setYearlyTotal)
      .catch(() => {});
  }, [baseDir]);

  useEffect(() => {
    isEnabled().then(setAutostart).catch(() => {});
  }, []);

  useEffect(() => {
    if (autostart) {
      enable().catch(() => {});
    }
  }, [autostart]);

  const toggleAutostart = async () => {
    try {
      if (autostart) {
        await disable();
      } else {
        await enable();
      }
      setAutostart(await isEnabled());
    } catch {
      // silently fail
    }
  };

  const saveGoal = (val: number) => {
    setYearlyGoal(val);
    invoke("save_yearly_goal", { goal: val }).catch(() => {});
  };

  const streak = (() => {
    let s = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].count > 0) s++;
      else break;
    }
    return s;
  })();

  return (
    <div className="home-tab">
      <div className="home-left">
        <div className="today-hero">
          <div className={`today-count ${todayCount >= 5 ? "neon" : todayCount > 0 ? "active" : ""}`}>
            {todayCount}
          </div>
          <div className="today-label">idea{todayCount !== 1 ? "s" : ""} today</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{streak}</div>
            <div className="stat-label">day streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{history.reduce((a, b) => a + b.count, 0)}</div>
            <div className="stat-label">last 30 days</div>
          </div>
          <GoalStatCard goal={yearlyGoal} onSave={saveGoal} />
          <GoalProgressCard current={yearlyTotal} goal={yearlyGoal} />
        </div>

        <div className="heatmap-section">
          <div className="heatmap-header">
            <span className="heatmap-title">Last 30 days</span>
            <div className="heatmap-legend">
              <span className="legend-label">Less</span>
              <div className="heat-cell heat-0 legend-cell" />
              <div className="heat-cell heat-1 legend-cell" />
              <div className="heat-cell heat-2 legend-cell" />
              <div className="heat-cell heat-3 legend-cell" />
              <span className="legend-label">More</span>
            </div>
          </div>
          <Heatmap data={history} />
        </div>

        <label className="autostart-toggle">
          <input type="checkbox" checked={autostart} onChange={toggleAutostart} />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">Launch on startup</span>
        </label>
      </div>

      <div className="home-right">
        <MixdownsSection baseDir={baseDir} addToast={addToast} />
      </div>
    </div>
  );
}

// ─── Organize tab (existing drop zones) ─────────────────────────────

function OrganizeTab({
  addToast,
  baseDirRef,
}: {
  addToast: (msg: string, type: "success" | "error") => void;
  baseDirRef: React.RefObject<string>;
}) {
  const [dragOver, setDragOver] = useState<Zone | null>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const resolveZone = useCallback((x: number, y: number): Zone | null => {
    const check = (ref: React.RefObject<HTMLDivElement | null>, zone: Zone) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zone;
      return null;
    };
    return check(leftRef, "instrumental") ?? check(rightRef, "lyrics");
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const movedPaths = new Set<string>();

    const setup = async () => {
      unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
        const { type } = event.payload;

        if (type === "enter" || type === "over") {
          const { position } = event.payload as { position: { x: number; y: number } };
          setDragOver(resolveZone(position.x, position.y));
        } else if (type === "drop") {
          const { paths, position } = event.payload as {
            paths: string[];
            position: { x: number; y: number };
          };
          const zone = resolveZone(position.x, position.y);
          setDragOver(null);

          if (!zone) {
            addToast("Drop on a zone!", "error");
            return;
          }

          const uniquePaths = [...new Set(paths)];
          const dir = baseDirRef.current;

          for (const filePath of uniquePaths) {
            if (movedPaths.has(filePath)) continue;
            try {
              const result = await invoke<MoveResult>("move_file", {
                sourcePath: filePath,
                zone,
                baseDir: dir || null,
              });
              movedPaths.add(filePath);
              addToast(`${result.filename} moved`, "success");
            } catch (err) {
              const msg = String(err);
              if (movedPaths.has(filePath) || msg.includes("File not found")) continue;
              addToast(`Error: ${msg}`, "error");
            }
          }
        } else {
          setDragOver(null);
        }
      });
    };

    setup();
    return () => unlisten?.();
  }, [resolveZone, addToast, baseDirRef]);

  return (
    <div className="organize-tab">
      <div className="zones">
        <div
          ref={leftRef}
          className={`zone zone-left ${dragOver === "instrumental" ? "zone-active" : ""}`}
        >
          <div className="zone-icon">&#9835;</div>
          <div className="zone-label">Instrumentals / Beats</div>
          <div className="zone-hint">Drop audio files here</div>
        </div>

        <div className="zone-divider" />

        <div
          ref={rightRef}
          className={`zone zone-right ${dragOver === "lyrics" ? "zone-active" : ""}`}
        >
          <div className="zone-icon">&#9998;</div>
          <div className="zone-label">Lyrics & Melody / Scratch</div>
          <div className="zone-hint">Drop sketches here</div>
        </div>
      </div>
    </div>
  );
}

// ─── Help tab ────────────────────────────────────────────────────────

function HelpTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["getting-started"]));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="help-tab">
      <div className="help-header">
        <span className="help-title-text">User Guide</span>
        <span className="help-subtitle">Learn how to use every feature in Vulta</span>
      </div>
      <div className="help-sections">
        {HELP_SECTIONS.map((section) => {
          const isOpen = expanded.has(section.id);
          return (
            <div
              key={section.id}
              className={`help-section ${isOpen ? "help-section-open" : ""}`}
            >
              <button className="help-section-header" onClick={() => toggle(section.id)}>
                <span className="help-section-icon">{section.icon}</span>
                <span className="help-section-title">{section.title}</span>
                <span className={`help-chevron ${isOpen ? "help-chevron-open" : ""}`}>
                  &#9662;
                </span>
              </button>
              {isOpen && (
                <div className="help-section-body">
                  {section.content.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Onboarding overlay (coach marks) ───────────────────────────────

function OnboardingOverlay({
  onComplete,
  setTab,
}: {
  onComplete: () => void;
  setTab: (tab: Tab) => void;
}) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const current = ONBOARDING_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    if (current.targetTab) {
      setTab(current.targetTab);
    }

    const timer = setTimeout(() => {
      const el = document.querySelector(current.targetSelector);
      if (el) {
        setSpotlightRect(el.getBoundingClientRect());
      } else {
        setSpotlightRect(null);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [step, current, setTab]);

  useEffect(() => {
    const handleResize = () => {
      const el = document.querySelector(current.targetSelector);
      if (el) setSpotlightRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [current]);

  const next = () => {
    if (isLast) onComplete();
    else setStep(step + 1);
  };

  const back = () => {
    if (!isFirst) setStep(step - 1);
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const pad = 16;
    const pos = current.position;

    if (pos === "bottom") {
      return {
        top: spotlightRect.bottom + pad,
        left: spotlightRect.left + spotlightRect.width / 2,
        transform: "translateX(-50%)",
      };
    }
    if (pos === "top") {
      return {
        bottom: window.innerHeight - spotlightRect.top + pad,
        left: spotlightRect.left + spotlightRect.width / 2,
        transform: "translateX(-50%)",
      };
    }
    if (pos === "left") {
      return {
        top: spotlightRect.top + spotlightRect.height / 2,
        right: window.innerWidth - spotlightRect.left + pad,
        transform: "translateY(-50%)",
      };
    }
    return {
      top: spotlightRect.top + spotlightRect.height / 2,
      left: spotlightRect.right + pad,
      transform: "translateY(-50%)",
    };
  };

  return (
    <div className="onboarding-overlay">
      <svg className="onboarding-backdrop">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 8}
                y={spotlightRect.top - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {spotlightRect && (
        <div
          className="onboarding-spotlight-ring"
          style={{
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
          }}
        />
      )}

      <div className="onboarding-tooltip" style={getTooltipStyle()}>
        <div className="onboarding-step-indicator">
          {step + 1} / {ONBOARDING_STEPS.length}
        </div>
        <div className="onboarding-tooltip-title">{current.title}</div>
        <div className="onboarding-tooltip-desc">{current.description}</div>
        <div className="onboarding-tooltip-actions">
          <button className="onboarding-btn onboarding-btn-skip" onClick={onComplete}>
            Skip
          </button>
          <div className="onboarding-btn-group">
            {!isFirst && (
              <button className="onboarding-btn onboarding-btn-back" onClick={back}>
                Back
              </button>
            )}
            <button className="onboarding-btn onboarding-btn-next" onClick={next}>
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Update bar ─────────────────────────────────────────────────────

function UpdateBar({
  update,
  onDismiss,
}: {
  update: Update;
  onDismiss: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const doUpdate = async () => {
    setUpdating(true);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      setUpdating(false);
    }
  };

  return (
    <div className="update-bar">
      <span className="update-bar-text">
        {updating
          ? "Downloading update\u2026"
          : `Update v${update.version} available`}
      </span>
      {!updating && (
        <div className="update-bar-actions">
          <button className="update-bar-btn" onClick={doUpdate}>
            Update Now
          </button>
          <button className="update-bar-dismiss" onClick={onDismiss}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [baseDir, setBaseDir] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const toastId = useRef(0);
  const baseDirRef = useRef(baseDir);
  baseDirRef.current = baseDir;

  useEffect(() => {
    invoke<string>("load_settings")
      .then(setBaseDir)
      .catch(() => {
        invoke<string>("get_default_base_dir").then(setBaseDir).catch(() => {});
      });
  }, []);

  useEffect(() => {
    invoke<boolean>("load_onboarding_completed")
      .then((completed) => {
        if (!completed) setShowOnboarding(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    check()
      .then((update) => {
        if (update) setAvailableUpdate(update);
      })
      .catch(() => {});
  }, []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    invoke("save_onboarding_completed", { completed: true }).catch(() => {});
    setTab("home");
  }, []);

  useEffect(() => {
    if (baseDir) {
      invoke("save_settings", { baseDir }).catch(() => {});
    }
  }, [baseDir]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const pickFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: baseDir || undefined,
      title: "Choose output folder",
    });
    if (selected) setBaseDir(selected);
  };

  return (
    <div className="app">
      {availableUpdate && (
        <UpdateBar
          update={availableUpdate}
          onDismiss={() => setAvailableUpdate(null)}
        />
      )}
      <header className="app-header">
        <div className="header-top">
          <h1>Vulta</h1>
          <button
            className="base-dir-btn"
            onClick={pickFolder}
            title="Click to change output folder"
          >
            {baseDir || "Loading..."}
          </button>
        </div>

        <nav className="tab-nav">
          <button
            className={`tab-btn ${tab === "home" ? "tab-active" : ""}`}
            onClick={() => setTab("home")}
          >
            Home
          </button>
          <button
            className={`tab-btn ${tab === "organize" ? "tab-active" : ""}`}
            onClick={() => setTab("organize")}
          >
            Organize
          </button>
          <button
            className={`tab-btn ${tab === "help" ? "tab-active" : ""}`}
            onClick={() => setTab("help")}
          >
            Help
          </button>
        </nav>
      </header>

      <main className="tab-content">
        {tab === "home" ? (
          <HomeTab baseDir={baseDir} addToast={addToast} />
        ) : tab === "organize" ? (
          <OrganizeTab addToast={addToast} baseDirRef={baseDirRef} />
        ) : (
          <HelpTab />
        )}
      </main>

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "\u2713" : "\u2717"} {t.message}
          </div>
        ))}
      </div>

      {showOnboarding && (
        <OnboardingOverlay onComplete={completeOnboarding} setTab={setTab} />
      )}
    </div>
  );
}

export default App;
