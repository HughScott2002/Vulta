# Vulta — Product Requirements

Date: 14 October 2026. Status: shared understanding, grilled and confirmed. Companion document: `GLOSSARY.md` (the walled garden of terms; where this document and the glossary disagree, the glossary wins on naming).

How to read this: every requirement here is a best guess, written plainly so it can be tested later. Nothing here is architecture. The flow comes first; scope was cut from the flow, not guessed on the fly.

## Mission

Vulta is a personal workspace for artists making their own music. A jumping off point and a homebase where you watch your progress come to life.

**Vulta manages everything the DAW doesn't do.** Music-making happens in the DAW. Vulta organizes, connects, resurfaces, listens, and remembers.

The one-line test for every feature: **all your stuff, easy to find and manage.**

## North star

**Could Prince use this to make everything and be happy?**

The goal is motivation and cutting records, Prince style: prolific output from a full-stack artist who writes, produces, and performs. Anything that slows that down is out. Anything that makes you want to make more is in.

## Principle zero: artist ware, not CRM software

The app keeps you in flow and makes you want to make more ideas, more songs, more albums. Motivation is the product.

- **Intrinsic motivation, built in.** The shelf grows. Moments land. Your progress is visible. That is the reward. No points, no streaks, no gamification, no leaderboards of you-against-yourself.
- **Extrinsic motivation, later lane.** A community section where you see friends and people doing well, reference what they do, and put a fire under your belly. Designed as a lane, not built yet.

## The garden

Vulta's world has exactly one name for everything (see `GLOSSARY.md`):

- **Objects:** Idea, Cut (name under review), Record, Album, Bounce, Version, Session, Mark, Moment, Credit.
- **Places:** Canvas, Cuts, Discovery, Shelf.
- **Actions:** Dump (an action available everywhere, never a page).

The shape of a life of a song: **Idea → Cut → Record → Album.** Pages exist per function, combining functions on one page wherever they fit. Page order and arrangement are customizable and decided in the design phase.

## The flow (the map)

### 1. Capture — Dumping things in

- C1. Dumping is an action available everywhere. Drag anything in, from anywhere. Nothing is required before you can press play: no naming, no sorting, no decisions.
- C2. What lands goes where it belongs. Unattached audio becomes an Idea on the Canvas. A Bounce dropped on its Cut becomes a new Version.
- C3. Originals are sacred. Import behavior is configured at first run: move is recommended for Ideas and Bounces into Vulta's folder ("give it a folder and it works in there"). DAW files, sample libraries, and the like are never moved, only referenced in place. Vulta asks, then does what you told it.
- C4. DAW export folders are watched per Cut. New bounces appear on their own.
- C5. An old messy folder can be dumped in bulk without creating duplicates.
- C6. Provenance is kept automatically: where it came from, when, the original filename, and who sent it. If your friend made the idea, his name rides in on it.
- C7. Phone capture (the 2am hum) is a designed lane, built later. See Lanes.

### 2. Find & resurface — out of sight must not mean out of mind

- F1. Ideas live on the Canvas, placed by sound similarity (the XO model). Cold start: placed by time on day one, drifting into true position as analysis completes. No empty void, no waiting screen.
- F2. Resurfacing is distributed: a small amount in many places, blended in. Serendipity on entry (something old greets you). Time echoes in artist language ("these are 3 days old, your ears are fresh"). Similar ideas surface while you listen. Ideas come forward to be picked through when you start a Cut.
- F3. No notification ever begs you to listen. Resurfacing is ambient.
- F4. One specific thing among 500 is findable in seconds (search).
- F5. Ideas are used, not cataloged: develop them, sample them, reference them. No tagging for tagging's sake.

### 3. Listen & mark

- L1. Listening is continuous: one thing ends, the next begins. Never dead air.
- L2. Marking a moment is one gesture while it plays. Playback never pauses.
- L3. A Mark can carry a few of your words, optional, in the moment or later.
- L4. Every Idea shows its waveform; Marks live on it.
- L5. Deep annotation lives in the DAW, not Vulta. Listening stays simple.
- L6. Any Idea or Bounce can be trimmed and looped for audition: the good moment, replayable as a loop.

### 4. Develop — Ideas become a Cut

- D1. Any Idea, or any group of Ideas, becomes a Cut in one gesture. No forms. Working title optional forever.
- D2. Ideas are never consumed. Joining a Cut changes nothing about the Idea.
- D3. When you start a Cut, Ideas come forward to be picked through: similar to what you've been playing, what you marked, what you haven't heard in a while.
- D4. The Cut page is the lineage in progress: source Ideas, Bounces, Sessions, lyrics, notes, references, people. Everything traceable, nothing in your face.
- D5. Abandoned branches stay attached but rest quietly. Wrong turns are history, not clutter.
- D6. A Session needs no Cut. Open the DAW just to make music, bounce it out, and the result lands as an Idea. Pure play is first-class.
- D7. No progress-percentage pressure on a Cut. It takes what it takes.
- D8. Contribution is the simple fact of lineage: these Ideas helped make this Record. No labels, no taxonomy, no contribution bookkeeping. The link exists because you made the Cut from them, and that is enough.

### 4a. Un-stalling — creative recovery

When a Cut stalls, Vulta helps you move again the way artists actually do: write to discover, borrow an emotional arc, listen with a question, improvise and perform, change the constraints, compare the sound, get a different perspective, or rest, reduce and finish.

- U1. A stalled Cut can be parked with a clear return note. Resurfacing (F2) brings it back when your ears are fresh.
- U2. Recovery moves are offered in artist language, in context, never as a productivity checklist.

### 5. DAW handoff

- H1. Vulta launches the DAW with the right project file, OS-level, universal by design (.cpr, .als, .flp, .logicx, .ptx, .rpp, and friends). No per-DAW plugins, no integration treadmill.
- H2. Drag in and out of the DAW freely: Ideas and Bounces in, bounces back out. Vulta never does the DAW's work.
- H3. Project moved or drive renamed? Relink once, Vulta remembers.
- H4. Vulta points, never owns. No library lock-in, no hidden copies of your DAW life.
- H5. Many DAWs per Cut is normal life. The Cut doesn't care.

### 6. Versions — bounces come home

- V1. Bounces return on their own via per-Cut watch folders, or by drag.
- V2. Bounces stack by date into the Cut's version history, automatically. Names optional ("the one with the new bridge").
- V3. Roll back to any Version, like git. Rollback changes what is current, never what is kept. History is never rewritten.
- V4. Approval is an explicit human act. Nothing approved is ever silently replaced. Evergreen, never negotiable.
- V4b. Changing an approved asset flags what depends on it for review: revise the approved mix and the master built from it gets flagged. Old approvals remain in history, always.
- V5. The Cut's latest Bounce is where the project stands: listen to the project without opening the DAW.
- V6. Surgical A/B mix comparison lives in the DAW, which does it better. Vulta's listening bar is reference listening (Discovery), not mix surgery.

### 7. Words & references

- W1. A Cut can hold its lyrics: plain text, versioned, kept forever. The lineage knows where the words turned.
- W2. Lyric files stay clean and human-readable. Time-synced lyrics (Apple Music style) live in a sidecar companion file. Later lane.
- W3. A Reference is external material you admire (audio, link, image, text), attachable to anything, with one line on what attracts you. Reference audio also appears in Discovery.
- W4. References are context, not homework. Nothing demands you fill them in.
- W6. Discovery listening is built for judgment: loop a section and switch between your work and a reference, level-matched, so loudness never fools your ears.
- W5. Per-Cut moodboards (images, film, the visual world of the song) are an exploration lane. See Lanes.

### 8. Finish — the Cut becomes a Record

- R1. Finishing is a human decision. When the evidence is there (lyrics in, loud enough, artwork good), Vulta gently says "consider releasing." Evidence, never a gate. Any item can be marked inapplicable by the artist, with a reason kept: an instrumental needs no lyrics, and that is complete, not missing.
- R2. The page never starts all-red and missing. With nothing, it leads you toward more ideas to feed the Cut. As it fills, it shows how far the song is, and how far the Album is.
- R3. Cutting a Record is the big Moment: animation, your profile lights up, you feel it. Becoming a Record is a moment worth designing, even if the Record is never published.
- R4. A Record is a real object: approved master, artwork, words, credits, and the whole lineage compressed into its story. Records carry their own Versions (remasters, alternate masters).
- R5. Records gather into Albums. Albums are declared by the artist, hold Records and in-progress Cuts alike, have their own artwork and identity, and always show how far along they are. An Album has a track order: sequencing the flow, gaps and transitions is part of declaring it.
- R6. Parked Cuts rest without guilt.

### 9. Collect — the Shelf, credits, the artist space

- S1. Records and Albums live on the Shelf: finished work, always visible. The shelf grows, and that growth is the motivation engine.
- S2. Credits assemble from provenance: who made what, who sent what, carried forward by lineage. The artist confirms them in small moments everywhere, never in one big form.
- S3. Confirmed credits build the artist's credit history and an editable abilities list. Abilities you add yourself and credits your work earned are different kinds of entry, and they stay distinct. Correcting or removing a credit recomputes the summaries without deleting the song or its sources. Nothing is inferred from imports, filenames, or listening. No biography, no profile form in v1.
- S4. Counts come from distinct Records. A single that also appears on an Album is one Record, not two.
- S5. In-progress contributions can be visible separately from finished work.

### 10. Release & after

- X1. The release lane is guidance, not plumbing. Distribution (DistroKid, label, whatever) happens outside Vulta.
- X2. "Publish so you can hear it on Spotify" is a legitimate encouragement angle: release so your Record lives next to the artists you admire in Discovery.
- X3. Promotion, performance, ownership (splits, master ownership, sample licensing, registration), and archive are mapped future phases, not designed now.

## MVP contract

The map above is the vision. The contract below is what the first release must do to feel like Vulta. Test each line; change what fails.

1. Dump anything in from anywhere, bulk import included, zero questions, no duplicates, provenance kept.
2. First-run import configuration: move/copy/reference per source, move recommended for Ideas and Bounces, DAW files never moved.
3. The Canvas holds hundreds of Ideas, placed by time at first, drifting toward sound-similarity order as analysis lands.
4. Continuous listening with one-gesture Marks and waveforms.
5. Resurfacing: serendipity on entry and time echoes, ambient only.
6. One-gesture Cut creation from any Idea or group; Ideas never consumed.
7. Launch DAW project files (verified: Cubase, Ableton Live, FL Studio, Logic Pro, Pro Tools, Reaper) and drag audio in and out.
8. Per-Cut watch folders: bounces return, stack as Versions, roll back like git.
9. Lyrics on a Cut: plain text, versioned.
10. References attachable to anything.
11. The evidence row and the gentle "consider releasing."
12. The Record Moment and the Shelf that grows.
13. Albums: declared, ordered, holding Records and Cuts, progress visible.
14. Credits assembled from provenance, confirmed in small moments.
15. Local-first. macOS, Windows, Linux. One product, one design language.
16. Discovery: the listening room with local reference files, looped sections, level-matched switching.

## Lanes (designed now, built later)

Nothing in the MVP may block these. They are part of the design, scheduled later.

- **Phone capture.** The 2am hum must reach the Canvas without ceremony. Companion app or synced watch folder.
- **Streaming references.** Apple Music / Spotify as reference sources in Discovery. MVP ships local files you own.
- **Sending.** The right things to the right people at the right time: stems to your mix engineer, a bounce to a collaborator, a Record to your manager.
- **Community.** See friends and people doing well. Reference what others do. Fire under your belly.
- **Moodboards.** A visual world per Cut: images, film, texture.
- **Time-synced lyrics.** Sidecar timing file; lyric files stay clean.

## Cross-cutting rules

- **Local-first.** Everything is local as much as possible. The app works with the internet off.
- **Vulta never deletes on its own.** You can remove anything deliberately; the app never tidies you.
- **Nothing approved is ever silently replaced.**
- **No mandatory metadata. Ever.**
- **No nagging notifications.** Resurfacing and Moments are ambient.
- **No loudly-wrong guesses.** Suggestions whisper and are one step to correct. Quiet beats clever.
- **No progress-pressure.** The app measures nothing at you; it celebrates what you did.

## What Vulta is not

- Not a DAW. No instruments, no plugins, no recording, no mixing engine.
- Not a word processor. Lyrics are plain text.
- Not a CRM. No pipelines, no stale-item reports, no productivity shaming.
- Not a distributor. Release guidance points outward.
- Not cloud-dependent. Local-first, always.

## Open threads

- **Page order and arrangement.** DaVinci Resolve-style progression is the reference. Probing round in the design phase.
- **"Cut" naming.** "Cut" carries music-industry placement slang. Revisit before any public release.
- **DESIGN.md.** Gets its own full process. Not this document's job.
