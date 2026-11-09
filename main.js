// d:\\izzy\\H_C\\Void\\main.js
import { AudioEngine } from './audio.js';
import { Scene } from './scene.js';
import { BytebeatEngine } from './audioBytebeat.js';

// Canvas and UI elements
const canvas = document.getElementById('c');
const entryOverlay = document.getElementById('entry-overlay');
const hud = document.getElementById('hud');

const btnMic = document.getElementById('btn-mic');
const btnFile = document.getElementById('btn-file');
const fileInput = document.getElementById('audio-file-input');
const btnReset = document.getElementById('btn-reset');

const fillBass = document.getElementById('fill-bass');
const fillMid = document.getElementById('fill-mid');
const fillTreble = document.getElementById('fill-treble');
const valBass = document.getElementById('val-bass');
const valMid = document.getElementById('val-mid');
const valTreble = document.getElementById('val-treble');
const fpsCounter = document.getElementById('fps-counter');
const sourceLabel = document.getElementById('audio-source-label');

let audio = null;
let scene = null;
let running = false;

// Demo phases – expose globally for the scene
const Phase = { INTRO: 'intro', RUNNING: 'running', OUTRO: 'outro' };
let phase = Phase.INTRO;
window.phase = phase;

let frameCount = 0;
let lastFpsTime = performance.now();

/** Initialise scene and start idle loop */
// Initialise scene and start idle loop
function bootstrap() {
  // set canvas size to full viewport (account for device pixel ratio)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  scene = new Scene(canvas);
  requestAnimationFrame(idleLoop);
}

// keep canvas full‑screen on resize
window.addEventListener('resize', () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
});

  scene = new Scene(canvas);
  requestAnimationFrame(idleLoop);
}

/** Idle animation shown while we wait for the user to start */
function idleLoop() {
  if (running) return;
  scene.update(null);
  requestAnimationFrame(idleLoop);
}

/** Main audio‑driven loop */
function audioLoop() {
  if (!running || !audio) return;
  audio.update();
  scene.update(audio);
  updateHUD();
  requestAnimationFrame(audioLoop);
}

/** Update the HUD bars and FPS counter */
function updateHUD() {
  const b = audio?.bass ?? 0;
  const m = audio?.mid ?? 0;
  const t = audio?.treble ?? 0;

  fillBass.style.width = `${(b * 100).toFixed(1)}%`;
  fillMid.style.width = `${(m * 100).toFixed(1)}%`;
  fillTreble.style.width = `${(t * 100).toFixed(1)}%`;

  valBass.textContent = b.toFixed(2);
  valMid.textContent = m.toFixed(2);
  valTreble.textContent = t.toFixed(2);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    const fps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
    fpsCounter.textContent = `${fps} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }
}

/** Transition from entry overlay → running demo */
function startExperience(label) {
  sourceLabel.textContent = label;

  // fade out overlay
  entryOverlay.classList.remove('active');
  setTimeout(() => {
    entryOverlay.style.display = 'none';
  }, 700);

  // show HUD
  hud.classList.remove('hidden');

  running = true;
  requestAnimationFrame(audioLoop);

  // schedule the 30 s outro
  if (phase === Phase.RUNNING) {
    scheduleOutro(30000);
  }
}

/** Return to entry screen */
function resetExperience() {
  running = false;
  if (audio && typeof audio.suspend === 'function') audio.suspend();
  hud.classList.add('hidden');
  entryOverlay.style.display = '';
  setTimeout(() => entryOverlay.classList.add('active'), 20);
  requestAnimationFrame(idleLoop);
}

/** Fade out the canvas and show the overlay after `durationMs` */
function scheduleOutro(durationMs) {
  setTimeout(() => {
    entryOverlay.classList.add('active');
    hud.classList.add('hidden');
    running = false;
    phase = Phase.OUTRO;
    window.phase = phase;
    // stop the bytebeat engine cleanly
    if (audio && typeof audio.stop === 'function') audio.stop();
  }, durationMs);
}

/** Kick‑off after the user presses the play button */
function startDemo() {
  entryOverlay.classList.add('active');
  setTimeout(() => {
    phase = Phase.RUNNING;
    window.phase = phase;
    startExperience('CODE‑GEN MUSIC');
  }, 3000);
}

/** Play button that sits on the overlay */
const playBtn = document.getElementById('play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    entryOverlay.classList.add('fade'); // fade animation defined in CSS
    setTimeout(() => {
      entryOverlay.style.display = 'none';
      startDemo();
    }, 500);
  });
}

/** Mic button – uses the original AudioEngine */
btnMic.addEventListener('click', async () => {
  try {
    btnMic.disabled = true;
    btnMic.querySelector('span:last-child').textContent = 'CONNECTING…';
    audio = new AudioEngine();
    await audio.startMic();
    startExperience('MIC INPUT');
  } catch (err) {
    console.error('Mic error:', err);
    btnMic.disabled = false;
    btnMic.querySelector('span:last-child').textContent = 'ENABLE MIC';
    alert(`Microphone access denied: ${err.message}`);
  }
});

/** File button – launches the bytebeat demo */
btnFile.addEventListener('click', () => {
  audio = new BytebeatEngine();
  audio.start();
  startDemo();
});

/** Optional file‑upload handling (kept for completeness) */
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    audio = new AudioEngine();
    await audio.startFile(file);
    startExperience(`♫ ${file.name.toUpperCase()}`);
  } catch (err) {
    console.error('File audio error:', err);
    alert(`Could not decode audio file: ${err.message}`);
  }
  fileInput.value = '';
});

/** Reset button */
btnReset.addEventListener('click', resetExperience);

/** Pause audio when tab loses focus */
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else audio.resume();
});

bootstrap();
