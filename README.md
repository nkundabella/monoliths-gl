# VOID: Audiovisual Show

> *An audiovisual show made entirely with code.*

A self-contained, browser-based audiovisual experience in which every sound and every frame of animation is generated programmatically at runtime — no audio samples, no asset files, no external plugins.

---

## Purpose

The project demonstrates that a complete audio-visual performance — drums, bass, melody, reverb, and synchronised generative graphics — can be authored entirely as source code and executed live inside a standard web browser, with zero dependencies beyond the browser itself and a single CDN font.

---

## What It Does

When you press **Play**, the browser simultaneously:

- **Synthesises a drum machine** — kick, snare, open and closed hi-hats, sequenced in a 16-step pattern at 128 BPM
- **Generates a bass line** — a sawtooth oscillator with a resonant low-pass filter sweep, following an 8-note pattern
- **Plays a melodic arpeggio** — triangle-wave tones with a procedural convolver reverb
- **Renders synchronised visuals** in real time on an HTML Canvas, driven by live FFT analysis of the generated audio:

| Visual Layer | Audio Driver |
|---|---|
| Oscilloscope waveform ring | Waveform data (time domain) |
| 128 radial frequency bars | Full spectrum FFT |
| 280 drifting particles | Bass explodes outward; mid creates a slow whirl |
| Rotating hexagon | Mid frequency rotation speed |
| Treble sparks | High-frequency transients |
| Beat flash | BPM-locked white pulse |
| Radial centre glow | Bass amplitude |

All visual parameters shift with the music — the show looks different every bar because the audio itself evolves.

---

## Outcomes

| Outcome | Detail |
|---|---|
| **Zero assets** | No `.mp3`, `.wav`, `.png`, or `.svg` files. Every pixel and sample is computed. |
| **Single file** | The entire show lives in `index.html` — CSS, JS, audio engine, visual engine, and UI combined. |
| **Real-time synthesis** | Audio is generated on-the-fly via the Web Audio API scheduler, not pre-rendered. |
| **Live analysis loop** | Visuals read FFT data every animation frame (~60 fps) and respond instantaneously. |
| **No build step** | Nothing to compile or bundle. Serve the folder and open a browser. |

---

## Technology

| Layer | Technology |
|---|---|
| Audio synthesis | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — `OscillatorNode`, `BiquadFilterNode`, `ConvolverNode`, `GainNode` |
| Audio analysis | `AnalyserNode` — FFT with smoothed band extraction (bass / mid / treble) |
| Sequencing | Custom 16-step scheduler using `AudioContext.currentTime` lookahead |
| Visuals | [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — particle system, radial bars, waveform ring, polygon, spark system |
| Typography | [Space Mono](https://fonts.google.com/specimen/Space+Mono) via Google Fonts |
| Runtime | Any modern browser (Chrome, Firefox, Edge, Safari) |

---

## Running It

Because the project uses ES modules and the Web Audio API, it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

**Option 1 — npx (no install required):**
```bash
npx serve .
```
Then open `http://localhost:3000`.

**Option 2 — specific port:**
```bash
npx serve . --listen 5500
```
Then open `http://localhost:5500`.

**Option 3 — any static server you already have** (Python, Caddy, nginx, VS Code Live Server, etc.)

---

## Project Structure

```
VOID/
└── index.html   ← Everything. The entire show.
```

---

## License

MIT — do whatever you like with it.