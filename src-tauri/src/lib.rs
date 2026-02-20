use chrono::{Local, NaiveDate};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;
use tauri_plugin_autostart::MacosLauncher;

// ─── Settings persistence ────────────────────────────────────────────

fn settings_path() -> Result<PathBuf, String> {
    let dir = dirs::data_local_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join(".vulta")))
        .ok_or_else(|| "Cannot determine app data directory".to_string())?;
    let app_dir = dir.join("Vulta");
    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create settings dir: {}", e))?;
    Ok(app_dir.join("settings.json"))
}

#[derive(Serialize, Deserialize, Default)]
struct Settings {
    base_dir: Option<String>,
    watch_folders: Option<Vec<String>>,
    yearly_goal: Option<u32>,
    onboarding_completed: Option<bool>,
}

#[command]
fn load_settings() -> Result<String, String> {
    let path = settings_path()?;
    if !path.exists() {
        return get_default_base_dir();
    }
    let data =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: Settings =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse settings: {}", e))?;
    match settings.base_dir {
        Some(dir) if !dir.is_empty() => Ok(dir),
        _ => get_default_base_dir(),
    }
}

#[command]
fn save_settings(base_dir: String) -> Result<(), String> {
    let path = settings_path()?;
    let mut settings: Settings = if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Settings::default()
    };
    settings.base_dir = Some(base_dir);
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

#[command]
fn load_watch_folders() -> Result<Vec<String>, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: Settings =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse settings: {}", e))?;
    Ok(settings.watch_folders.unwrap_or_default())
}

#[command]
fn save_watch_folders(watch_folders: Vec<String>) -> Result<(), String> {
    let path = settings_path()?;
    let mut settings: Settings = if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Settings::default()
    };
    settings.watch_folders = Some(watch_folders);
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

#[command]
fn load_yearly_goal() -> Result<u32, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(365);
    }
    let data =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: Settings =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse settings: {}", e))?;
    Ok(settings.yearly_goal.unwrap_or(365))
}

#[command]
fn save_yearly_goal(goal: u32) -> Result<(), String> {
    let path = settings_path()?;
    let mut settings: Settings = if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Settings::default()
    };
    settings.yearly_goal = Some(goal);
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

#[command]
fn get_yearly_total(base_dir: Option<String>) -> Result<u32, String> {
    let base = match &base_dir {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => dirs::audio_dir()
            .or_else(|| dirs::home_dir().map(|h| h.join("Music")))
            .ok_or_else(|| "Cannot determine Music directory".to_string())?,
    };

    let current_year = Local::now().format("%Y").to_string().parse::<i32>().unwrap_or(2026);
    let mut total = 0u32;

    if base.is_dir() {
        if let Ok(entries) = fs::read_dir(&base) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if let Some(date_str) = name.strip_prefix("Idea Gen - ") {
                    let date_opt =
                        NaiveDate::parse_from_str(date_str, "%b %d, %Y")
                            .ok()
                            .or_else(|| NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok());
                    if let Some(date) = date_opt {
                        if date.format("%Y").to_string().parse::<i32>().unwrap_or(0)
                            == current_year
                        {
                            total += count_files_recursive(&entry.path());
                        }
                    }
                }
            }
        }
    }

    Ok(total)
}

#[command]
fn get_default_base_dir() -> Result<String, String> {
    let base = dirs::audio_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Music")))
        .ok_or_else(|| "Cannot determine Music directory".to_string())?;
    Ok(base.to_string_lossy().to_string())
}

#[command]
fn load_onboarding_completed() -> Result<bool, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(false);
    }
    let data =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: Settings =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse settings: {}", e))?;
    Ok(settings.onboarding_completed.unwrap_or(false))
}

#[command]
fn save_onboarding_completed(completed: bool) -> Result<(), String> {
    let path = settings_path()?;
    let mut settings: Settings = if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Settings::default()
    };
    settings.onboarding_completed = Some(completed);
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write settings: {}", e))?;
    Ok(())
}

// ─── File move ───────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct MoveResult {
    destination: String,
    filename: String,
}

const AUDIO_EXTENSIONS: &[&str] = &["wav", "mp3", "flac", "aiff", "ogg", "m4a"];

#[derive(Serialize)]
pub struct AudioFile {
    name: String,
    path: String,
    source_folder: String,
}

#[command]
fn scan_watch_folders(watch_folders: Vec<String>) -> Result<Vec<AudioFile>, String> {
    let mut files: Vec<AudioFile> = Vec::new();
    for folder in &watch_folders {
        let dir = Path::new(folder);
        if !dir.is_dir() {
            continue;
        }
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_file() {
                    continue;
                }
                if let Some(ext) = path.extension() {
                    let ext_lower = ext.to_string_lossy().to_lowercase();
                    if AUDIO_EXTENSIONS.contains(&ext_lower.as_str()) {
                        files.push(AudioFile {
                            name: path
                                .file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string(),
                            path: path.to_string_lossy().to_string(),
                            source_folder: folder.clone(),
                        });
                    }
                }
            }
        }
    }
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(files)
}

#[command]
fn move_file(
    source_path: String,
    zone: String,
    base_dir: Option<String>,
    mode: Option<String>,
) -> Result<MoveResult, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err(format!("File not found: {}", source_path));
    }
    if !source.is_file() {
        return Err(format!("Not a file (directory?): {}", source_path));
    }

    let base = match &base_dir {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => dirs::audio_dir()
            .or_else(|| dirs::home_dir().map(|h| h.join("Music")))
            .ok_or_else(|| "Cannot determine Music directory".to_string())?,
    };

    let today = Local::now().format("%b %d, %Y").to_string();
    let date_folder = format!("Idea Gen - {}", today);

    let zone_subfolder = match zone.as_str() {
        "instrumental" => "Instrumental",
        "lyrics" => "Lyrics and Melody",
        _ => return Err(format!("Unknown zone: {}", zone)),
    };

    let dest_dir = base.join(&date_folder).join(zone_subfolder);
    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create directories: {}", e))?;

    let original_name = source
        .file_name()
        .ok_or_else(|| "Cannot read filename".to_string())?
        .to_string_lossy()
        .to_string();

    let dest_path = unique_path(&dest_dir, &original_name);
    let final_name = dest_path
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_string();

    let is_copy = mode.as_deref() == Some("copy");

    if is_copy {
        fs::copy(&source, &dest_path)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
    } else if fs::rename(&source, &dest_path).is_err() {
        fs::copy(&source, &dest_path)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
        fs::remove_file(&source)
            .map_err(|e| format!("File copied but failed to remove original: {}", e))?;
    }

    Ok(MoveResult {
        destination: dest_path.to_string_lossy().to_string(),
        filename: final_name,
    })
}

fn unique_path(dir: &Path, filename: &str) -> PathBuf {
    let candidate = dir.join(filename);
    if !candidate.exists() {
        return candidate;
    }

    let stem = Path::new(filename)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let ext = Path::new(filename)
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();

    let mut counter = 1u32;
    loop {
        let new_name = format!("{}_{}{}", stem, counter, ext);
        let path = dir.join(&new_name);
        if !path.exists() {
            return path;
        }
        counter += 1;
    }
}

// ─── Contribution history (filesystem scan) ──────────────────────────

#[derive(Serialize, Clone)]
pub struct DayEntry {
    date: String,
    count: u32,
}

/// Scan baseDir for "Idea Gen - <date>" folders, count files in each.
/// Returns last 30 days, filling in zeros for missing days.
#[command]
fn get_contribution_history(base_dir: Option<String>) -> Result<Vec<DayEntry>, String> {
    let base = match &base_dir {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => dirs::audio_dir()
            .or_else(|| dirs::home_dir().map(|h| h.join("Music")))
            .ok_or_else(|| "Cannot determine Music directory".to_string())?,
    };

    // Scan existing "Idea Gen - ..." folders and count files
    let mut counts: HashMap<NaiveDate, u32> = HashMap::new();

    if base.is_dir() {
        if let Ok(entries) = fs::read_dir(&base) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if let Some(date_str) = name.strip_prefix("Idea Gen - ") {
                    // Try to parse "Feb 14, 2026" format
                    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%b %d, %Y") {
                        let dir_path = entry.path();
                        let file_count = count_files_recursive(&dir_path);
                        *counts.entry(date).or_insert(0) += file_count;
                    }
                    // Also try legacy "YYYY-MM-DD" format from IdeaBucket
                    else if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                        let dir_path = entry.path();
                        let file_count = count_files_recursive(&dir_path);
                        *counts.entry(date).or_insert(0) += file_count;
                    }
                }
            }
        }
    }

    // Build last 30 days, filling zeros
    let today = Local::now().date_naive();
    let mut history: Vec<DayEntry> = Vec::with_capacity(30);

    for i in (0..30).rev() {
        let date = today - chrono::Duration::days(i);
        let count = counts.get(&date).copied().unwrap_or(0);
        let label = date.format("%b %d").to_string();
        history.push(DayEntry {
            date: label,
            count,
        });
    }

    Ok(history)
}

/// Count all files (not dirs) inside a directory, recursively.
fn count_files_recursive(dir: &Path) -> u32 {
    let mut count = 0u32;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                count += 1;
            } else if path.is_dir() {
                count += count_files_recursive(&path);
            }
        }
    }
    count
}

// ─── App entry ───────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            move_file,
            get_default_base_dir,
            load_settings,
            save_settings,
            get_contribution_history,
            load_watch_folders,
            save_watch_folders,
            scan_watch_folders,
            load_yearly_goal,
            save_yearly_goal,
            get_yearly_total,
            load_onboarding_completed,
            save_onboarding_completed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
