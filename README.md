# void

a 30-second audiovisual show that runs in your browser. no samples, no assets, no build step — just one HTML file and the Web Audio API doing its thing.

---

## what it is

i wanted to make something that felt like those old demoscene intros — the kind where someone squeezed an entire light show into a few kilobytes and you'd just stare at it. i didn't go that small, but the spirit is the same: everything you see and hear is being generated right now, on your machine, by the code itself.

press play and you get:

- a **drum machine** — kick on the 1 and 3, snare on the 2 and 4, hats rolling through the gaps. all synthesised: the kick is a sine wave pitched down from 160 Hz, the snare is filtered noise layered over a triangle body, the hi-hats are bandpass-filtered white noise with different decay times for open and closed
- a **bass line** — sawtooth oscillator through a resonant low-pass filter. the filter sweeps shut on each note which gives it that slightly wobbly analogue feel
- a **melodic arp** — triangle waves with a hand-rolled reverb (a buffer of decaying noise, basically what every convolver tutorial recommends)
- **visuals** synced to live FFT data from the audio: a waveform that wraps into a ring, 128 frequency bars radiating outward, 280 particles that the bass punches outward and the mids spin into a slow vortex, a rotating hexagon whose speed is wired to the mid band, treble sparks, and a white flash every beat

---

## what was hard

**getting the scheduler right.** the Web Audio API has a clock (`AudioContext.currentTime`) that's completely separate from `requestAnimationFrame`. if you fire notes from inside the render loop you get drift and stuttering. so the sequencer runs on its own `setInterval` with a small lookahead window — it schedules notes a tenth of a second ahead and the audio engine plays them at the exact right time regardless of what the frame rate is doing. figuring out that the interval and the render loop have to be independent was the first real puzzle.

**the reverb.** i didn't want to load an impulse response file — that felt like cheating for a "no assets" project. so the reverb is a buffer of random noise that falls off exponentially over 1.5 seconds. it doesn't sound like a real room but it softens the arp nicely and was satisfying to build from scratch.

**the waveform ring.** mapping 2048 time-domain samples onto a circle sounds straightforward but getting the phase right so the ring doesn't jump every frame took some trial and error. the fix is subtracting `Math.PI / 2` from the angle so sample 0 always starts at 12 o'clock.

---

## how to run it

the project uses ES modules and the Web Audio API, so it needs to be served over HTTP — a `file://` URL won't work.

```bash
# quickest option, no install needed
npx serve .
```

then open `http://localhost:3000`. any other static server works too — VS Code Live Server, Python's `http.server`, whatever you have around.

---

## ai disclosure

i used an AI assistant to help build this — mostly for iteration speed on the visual layer (particle physics, the bar rendering loop) and for the initial scaffold of the drum synth functions. i wrote and shaped all the sequencer logic, the band-extraction math, the waveform ring, and the reverb approach myself. if something in the code looks hand-shaped, it probably is; if something looks like it was auto-completed and left alone, that's also probably true.

---

## project structure

```
void/
└── index.html   ← the whole show, start to finish
```

---

## license

MIT. take whatever's useful.
