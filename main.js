// main.js — wires up the UI, starts the audio, runs the render loops,
// and handles the intro → running → outro state machine.

import { AudioEngine }    from './audio.js';
import { Scene }          from './scene.js';
import { BytebeatEngine } from './audioBytebeat.js';

const canvas       = document.getElementById('c');
const entryOverlay = document.getElementById('entry-overlay');
const hud          = document.getElementById('hud');

const btnMic   = document.getElementById('btn-mic');
const btnFile  = document.getElementById('btn-file');
const fileInput= document.getElementById('audio-file-input');
const btnReset = document.getElementById('btn-reset');

const fillBass   = document.getElementById('fill-bass');
const fillMid    = document.getElementById('fill-mid');
const fillTreble = document.getElementById('fill-treble');
const valBass    = document.getElementById('val-bass');
const valMid     = document.getElementById('val-mid');
const valTreble  = document.getElementById('val-treble');
const fpsCounter = document.getElementById('fps-counter');
const sourceLabel= document.getElementById('audio-source-label');

let audio   = null;
let scene   = null;
let running = false;

// three phases: waiting for click, running the show, fading out
const Phase = { INTRO: 'intro', RUNNING: 'running', OUTRO: 'outro' };
let phase = Phase.INTRO;
window.phase = phase;  // scene reads this to know when to fade

let frameCount  = 0;
let lastFpsTime = performance.now();

// --- startup ---

function bootstrap() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  scene = new Scene(canvas);
  requestAnimationFrame(idleLoop);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.getContext('2d').scale(dpr, dpr);
}

// --- render loops ---

// idle: scene runs but there's no audio driving it yet
function idleLoop() {
  if (running) return;
  scene.update(null);
  requestAnimationFrame(idleLoop);
}

// active: audio and scene both update every frame
function audioLoop() {
  if (!running || !audio) return;
  audio.update();
  scene.update(audio);
  updateHUD();
  requestAnimationFrame(audioLoop);
}

// --- HUD ---

function updateHUD() {
  const b = audio?.bass   ?? 0;
  const m = audio?.mid    ?? 0;
  const t = audio?.treble ?? 0;

  fillBass.style.width   = `${(b * 100).toFixed(1)}%`;
  fillMid.style.width    = `${(m * 100).toFixed(1)}%`;
  fillTreble.style.width = `${(t * 100).toFixed(1)}%`;

  valBass.textContent   = b.toFixed(2);
  valMid.textContent    = m.toFixed(2);
  valTreble.textContent = t.toFixed(2);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    fpsCounter.textContent = `${Math.round(frameCount / ((now - lastFpsTime) / 1000))} FPS`;
    frameCount  = 0;
    lastFpsTime = now;
  }
}

// --- state transitions ---

function startExperience(label) {
  sourceLabel.textContent = label;

  entryOverlay.classList.remove('active');
  setTimeout(() => { entryOverlay.style.display = 'none'; }, 700);

  hud.classList.remove('hidden');
  running = true;
  requestAnimationFrame(audioLoop);

  if (phase === Phase.RUNNING) scheduleOutro(30000);
}

function resetExperience() {
  running = false;
  if (audio && typeof audio.suspend === 'function') audio.suspend();
  hud.classList.add('hidden');
  entryOverlay.style.display = '';
  setTimeout(() => entryOverlay.classList.add('active'), 20);
  requestAnimationFrame(idleLoop);
}

function scheduleOutro(ms) {
  setTimeout(() => {
    phase = Phase.OUTRO;
    window.phase = phase;
    entryOverlay.classList.add('active');
    hud.classList.add('hidden');
    running = false;
    if (audio && typeof audio.stop === 'function') audio.stop();
  }, ms);
}

// 3-second intro pause before the music kicks in
function startDemo() {
  setTimeout(() => {
    phase = Phase.RUNNING;
    window.phase = phase;
    startExperience('CODE-GEN MUSIC');
  }, 3000);
}

// --- button handlers ---

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
    console.error('mic error:', err);
    btnMic.disabled = false;
    btnMic.querySelector('span:last-child').textContent = 'ENABLE MIC';
    alert(`mic access denied: ${err.message}`);
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
    console.error('file audio error:', err);
    alert(`couldn't decode that file: ${err.message}`);
  }
  fileInput.value = '';
});

btnReset.addEventListener('click', resetExperience);

document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  document.hidden ? audio.suspend() : audio.resume();
});

bootstrap();
