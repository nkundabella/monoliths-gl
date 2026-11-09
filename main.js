// d:\izzy\H_C\Void\main.js
import { AudioEngine } from './audio.js';
import { Scene } from './scene.js';
import { BytebeatEngine } from './audioBytebeat.js';

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

// Demo phases
const Phase = { INTRO: 'intro', RUNNING: 'running', OUTRO: 'outro' };
let phase = Phase.INTRO;
window.phase = phase; // expose for scene

let frameCount = 0;
let lastFpsTime = performance.now();

function bootstrap() {
  scene = new Scene(canvas);
  requestAnimationFrame(idleLoop);
}

/* ── Idle render loop (entry screen) ─────────────────────────── */
function idleLoop() {
  if (running) return;
  scene.update(null);
  requestAnimationFrame(idleLoop);
}

/* ── Audio render loop ────────────────────────────────────────── */
function audioLoop() {
  if (!running || !audio) return;
  audio.update();
  scene.update(audio);
  updateHUD();
  requestAnimationFrame(audioLoop);
}

/* ── HUD update ───────────────────────────────────────────────── */
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

function startExperience(label) {
  sourceLabel.textContent = label;
  entryOverlay.classList.remove('active');
  setTimeout(() => {
    entryOverlay.style.display = 'none';
  }, 700);
  hud.classList.remove('hidden');
  running = true;
  requestAnimationFrame(audioLoop);
  // schedule outro (30 s)
  if (phase === Phase.RUNNING) {
    scheduleOutro(30000);
  }
}

function resetExperience() {
  running = false;
  if (audio) audio.suspend();
  hud.classList.add('hidden');
  entryOverlay.style.display = '';
  setTimeout(() => entryOverlay.classList.add('active'), 20);
  requestAnimationFrame(idleLoop);
}

function scheduleOutro(durationMs) {
  setTimeout(() => {
    entryOverlay.classList.add('active');
    hud.classList.add('hidden');
    running = false;
    phase = Phase.OUTRO;
    window.phase = phase;
    // stop the generated audio if possible
    if (audio && typeof audio.stop === 'function') audio.stop();
  }, durationMs);
}

function startDemo() {
  entryOverlay.classList.add('active');
  setTimeout(() => {
    phase = Phase.RUNNING;
    window.phase = phase;
    startExperience('CODE‑GEN MUSIC');
  }, 3000);
}

// Play button (overlay)
const playBtn = document.getElementById('play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    entryOverlay.classList.add('fade');
    setTimeout(() => {
      entryOverlay.style.display = 'none';
      startDemo();
    }, 500);
  });
}

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
  audio = new BytebeatEngine();
  audio.start();
  startDemo();
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
  fileInput.value = '';
});

btnReset.addEventListener('click', resetExperience);

document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else audio.resume();
});

bootstrap();
