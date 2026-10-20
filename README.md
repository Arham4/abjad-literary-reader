# Abjad Literary Reader (Urdu MVP — Formula 1 Stack v3)

An ultra-low-latency literary reading application for Perso-Arabic Abjad languages, starting with Urdu (`ur`).

## Core Principles
1. **Pedagogical Rule ("No Spoonfeeding")**: Clicking a word does NOT immediately spoil the English translation. It invokes a **3-Tap Progressive Scaffolding** workflow:
   - **Tap 1: The Optical & Phonetic Unblocker**: Large Nastaliq calligraphic display with full vocalized aeraab, structured RTL vowel pills, unified aspirated digraph grapheme decomposer bar, and audio pronunciation.
   - **Tap 2: The Conversational Urdu Bridge & Morphology**: Everyday spoken Urdu synonyms (*rozmarra*), simple Urdu explanation, Arabic triliteral root (`مادہ`) with familiar cousin words, and Persian Izafat syntactic breakdowns.
   - **Tap 3: Full Literary & Philosophical Gloss**: Precise contextual English gloss and literary/stylistic nuance note.
2. **Formula 1 Absolute Speed Tech Stack**:
   - **Zero Virtual DOM**: SolidJS compiles directly to DOM pointer operations so the browser's HarfBuzz font shaping engine never tears down or recalculates Nastaliq ligatures on state updates.
   - **In-Process C-Bindings**: `bun:sqlite` with WAL mode and Drizzle ORM provides ~0.02ms query latency.
   - **Single Delegated Event Listener**: Zero per-span listeners; a single delegator on `.abjad-reader-surface` handles word selection with direct DOM attribute toggling.
   - **Tailwind CSS v4 (Oxide)**: Zero PostCSS runtime overhead.
   - **Mobile Bottom Sheet vs Desktop Floating Card**: Floating card via `@floating-ui/dom` with automatic teardown on desktop; thumb-friendly fixed slide-up bottom sheet on mobile (`< 768px`).
   - **Touch Hit-Box Expansion**: `@media (pointer: coarse)` pseudo-element expansion for 44px minimum touch targets without disrupting Nastaliq cursive flow.

## Running with Docker (Strict Zero-Host-Installation)

### 1. Build and Run Container
```bash
docker compose up --build -d
```
- **Desktop Local Access**: [http://localhost:4000](http://localhost:4000)
- **Mobile Access (Same Wi-Fi)**: [http://192.168.1.161:4000](http://192.168.1.161:4000) or [http://192.168.1.163:4000](http://192.168.1.163:4000)
- **Mobile Access (Cellular / Outside via UPnP)**: [http://98.116.68.62:4000](http://98.116.68.62:4000)

*(To renew the UPnP external port mapping at any time without touching other scripts: `C:\tools\upnpc.exe -e "Abjad Reader" -a 192.168.1.161 4000 4000 TCP 86400`)*

### 2. Run Tests in Docker
```bash
docker run --rm -v "${PWD}:/app" -w /app oven/bun:latest bun test
```

### 3. Re-Seed Database in Docker
```bash
docker run --rm -v "${PWD}:/app" -w /app oven/bun:latest bun run src/db/seed.ts
```

## Canonical Seed Stories
1. **Saadat Hasan Manto** — *Toba Tek Singh* (`ٹوبہ ٹیک سنگھ`, Level 2)
2. **Ashfaq Ahmed** — *Gadaria* (`گڈریا`, Level 2)
3. **Intizar Husain** — *Shehr-e-Afsos* (`شہرِ افسوس`, Level 3)
