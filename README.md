# void

a 30-second audiovisual show that runs in your browser. no samples, no assets, no build step — just one HTML file and the Web Audio API doing its thing.

---

## what it is

i wanted to make something that felt like those old demoscene intros — the kind where someone squeezed an entire light show into a few kilobytes and you'd just stare at it. everything you see and hear is generated on-the-fly, on your machine, by the code itself.

press play and you get:

- a **16-bar structured music piece** (~32s long) at 128 BPM:
  - **intro buildup (bars 0-3)**: kick on the 1 and 3, bassline and tight closed hi-hats
  - **groove progression (bars 4-11)**: full drums with snare on 2 & 4, open hats, evolving bass tones and reverbed arpeggios
  - **breakdown & variation**: syncopated 16th-note snare and hi-hat rolls
  - **outro (bars 15+)**: kick drops out, reverb tails wash away, and the landing screen returns smoothly
- **audio-reactive visuals** synced to live FFT and waveform data:
  - an **oscilloscope waveform ring** mapping 2048 time-domain samples
  - **128 radial frequency bars** radiating out from the centre
  - **280 particles** kicked outward by the bass and swirled by the mids
  - a **wireframe tunnel** with counter-rotating depth rings that flex with the beat
  - a **harmonic Lissajous figure** floating in the core that deforms with mid & treble frequencies
  - a rotating mid-driven hexagon, high-frequency treble sparks, and a BPM-locked flash

---

## what was hard

**getting the scheduler right.** the Web Audio API has a clock (`AudioContext.currentTime`) that's completely separate from `requestAnimationFrame`. if you fire notes from inside the render loop you get drift and stuttering. so the sequencer runs on its own `setInterval` with a small lookahead window — it schedules notes ahead in time and the audio engine plays them at the exact right time regardless of what the frame rate is doing.

**giving it a real song structure.** early on, it was just a static looping bar. making it an actual 30-second show meant counting bars, modulating patterns (layering in the snare, switching to syncopated variations, shifting the bass scale), and scheduling a clean fade-out when bar 16 completes.

**the reverb without external impulse files.** loading an audio file felt like cheating for a code-only demoscene entry. the reverb convolver uses a procedural stereo buffer filled with decaying random noise. it gives the triangle-wave arp just enough space and atmosphere.

**the wireframe tunnel & Lissajous core.** balancing multiple canvas layers so the screen feels dense like a demoscene production without turning into muddy soup took lots of tweaking of alpha values, composite operations, and motion trails (`rgba(0, 0, 0, 0.22)`).

---

## how to run it

open `index.html` via any local HTTP server (needed for Web Audio context permissions):

```bash
# quick option:
npx serve .
```

then visit `http://localhost:3000` (or use Python `python -m http.server`, VS Code Live Server, etc.). Click the play button to start the 30-second show.

---

## ai disclosure

i used an AI assistant while building this — specifically for early scaffolding of the Web Audio nodes and testing different particle velocity damping formulas. the sequencer architecture, the multi-bar song progression, the tunnel and Lissajous visual layers, the reverb math, and all styling were written and tuned by hand.

---

## project structure

```
void/
└── index.html   ← the whole show, self-contained in a single file
```

---

## license

MIT. take whatever's useful.
