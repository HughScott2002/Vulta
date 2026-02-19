<p align="center">
  <img src="Vulta_Logo.svg" alt="Vulta" width="200" />
</p>

<p align="center">
  A minimal desktop app for music producers to capture, organize, and track creative ideas.<br/>
  Built with Tauri v2, React, TypeScript, and Rust.
</p>

---

<!-- Add a screenshot here later -->
<!-- <p align="center"><img src=".github/screenshot.png" alt="Vulta screenshot" width="700" /></p> -->

## Features

- **Drop zones** -- Drag audio files onto Instrumental or Lyrics & Melody zones to sort them instantly
- **Auto-organization** -- Files land in dated folders (`Idea Gen - Feb 18, 2026/Instrumental/`) with automatic collision handling
- **Mixdowns panel** -- Point Vulta at your DAW export folders (Cubase, Ableton, etc.) and copy or move renders into your idea library with one click
- **Contribution heatmap** -- GitHub-style 30-day grid so you can see your creative output at a glance
- **Yearly goal** -- Set a target number of ideas for the year and track progress with a live progress bar
- **Launch on startup** -- Optional autostart so Vulta is always ready when inspiration hits

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | [Tauri v2](https://v2.tauri.app) |
| Frontend | React 19 + TypeScript |
| Backend | Rust (std::fs for file ops, chrono for dates) |
| Build | Vite 7 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://rustup.rs/)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

### Development

```bash
npm install
cargo tauri dev
```

### Build

```bash
cargo tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

## How It Works

Vulta watches your configured DAW export folders and organizes files into a simple structure:

```
~/Music/
  Idea Gen - Feb 18, 2026/
    Instrumental/
      beat_01.wav
      synth_loop.flac
    Lyrics and Melody/
      vocal_sketch.mp3
  Idea Gen - Feb 17, 2026/
    Instrumental/
      demo_track.wav
```

Settings (output directory, watch folders, yearly goal) persist in your OS app data directory.

## License

[MIT](LICENSE)
