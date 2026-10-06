import { AudioEngine } from './audio.js';
import { Scene }       from './scene.js';

const canvas       = document.getElementById('gl-canvas');
const entryOverlay = document.getElementById('entry-overlay');
const hud          = document.getElementById('hud');

const btnMic       = document.getElementById('btn-mic');
const btnFile      = document.getElementById('btn-file');
const fileInput    = document.getElementById('audio-file-input');
const btnReset     = document.getElementById('btn-reset');

const fillBass     = document.getElementById('fill-bass');
const fillMid      = document.getElementById('fill-mid');
const fillTreble   = document.getElementById('fill-treble');
const valBass      = document.getElementById('val-bass');
const valMid       = document.getElementById('val-mid');
const valTreble    = document.getElementById('val-treble');
const fpsCounter   = document.getElementById('fps-counter');
const sourceLabel  = document.getElementById('audio-source-label');

let audio  = null;
let scene  = null;
let running = false;

let frameCount = 0;
let lastFpsTime = performance.now();

function bootstrap() {
  // Scene is created once and lives for the full page session
  scene = new Scene(canvas);
  // Run idle animation (no audio) so the entry screen has a live background
  requestAnimationFrame(idleLoop);
}

/* ── Idle render loop (entry screen) ─────────────────────────── */

function idleLoop() {
  if (running) return;           // hand off to audioLoop once started
  scene.update(null);            // pass null → audio values default to 0
  requestAnimationFrame(idleLoop);
}

/* ── Audio render loop ────────────────────────────────────────── */

function audioLoop() {
  if (!running) return;

  audio.update();
  scene.update(audio);
  updateHUD();

  requestAnimationFrame(audioLoop);
}

/* ── HUD update ───────────────────────────────────────────────── */

function updateHUD() {
  const b = audio.bass;
  const m = audio.mid;
  const t = audio.treble;

  fillBass.style.width   = `${(b * 100).toFixed(1)}%`;
  fillMid.style.width    = `${(m * 100).toFixed(1)}%`;
  fillTreble.style.width = `${(t * 100).toFixed(1)}%`;

  valBass.textContent   = b.toFixed(2);
  valMid.textContent    = m.toFixed(2);
  valTreble.textContent = t.toFixed(2);

  // FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    const fps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
    fpsCounter.textContent = `${fps} FPS`;
    frameCount  = 0;
    lastFpsTime = now;
  }
}

/* ── Transition: entry → experience ──────────────────────────── */

function startExperience(label) {
  sourceLabel.textContent = label;

  // Fade out overlay
  entryOverlay.classList.remove('active');
  setTimeout(() => {
    entryOverlay.style.display = 'none';
  }, 700);

  // Show HUD
  hud.classList.remove('hidden');

  running = true;
  requestAnimationFrame(audioLoop);
}

/* ── Transition: experience → entry ──────────────────────────── */

function resetExperience() {
  running = false;
  if (audio) audio.suspend();

  hud.classList.add('hidden');
  entryOverlay.style.display = '';
  setTimeout(() => entryOverlay.classList.add('active'), 20);

  // Restart idle loop
  requestAnimationFrame(idleLoop);
}

/* ── Button handlers ──────────────────────────────────────────── */

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

btnFile.addEventListener('click', () => {
  fileInput.click();
});

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
  // Reset input so same file can be picked again
  fileInput.value = '';
});

btnReset.addEventListener('click', resetExperience);

/* ── Page visibility (pause on tab switch) ────────────────────── */

document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else                  audio.resume();
});

bootstrap();