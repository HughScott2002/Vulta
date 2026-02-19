import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import "./App.css";

type Zone = "instrumental" | "lyrics";
type Tab = "home" | "organize";

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

// ─── Main App ────────────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [baseDir, setBaseDir] = useState<string>("");
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
        </nav>
      </header>

      <main className="tab-content">
        {tab === "home" ? (
          <HomeTab baseDir={baseDir} addToast={addToast} />
        ) : (
          <OrganizeTab addToast={addToast} baseDirRef={baseDirRef} />
        )}
      </main>

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "\u2713" : "\u2717"} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
