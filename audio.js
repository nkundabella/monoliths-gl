/* ================================================================
   ANOMALOUS ARCHITECTURE — Audio Engine
   Handles mic / file input, FFT analysis, and band extraction.
   ================================================================ */

export class AudioEngine {
  constructor() {
    this.ctx        = null;
    this.analyser   = null;
    this.source     = null;
    this.dataArray  = null;
    this.bufferLen  = 0;
    this.isRunning  = false;

    // Smoothed output values (0–1 range)
    this.bass   = 0;
    this.mid    = 0;
    this.treble = 0;

    // Raw peaks (for beat detection / transients)
    this.bassPeak   = 0;
    this.midPeak    = 0;
    this.treblePeak = 0;

    // Exponential smoothing factor (spec: ~0.15)
    this.lerpFactor = 0.15;
  }

  /* ── Initialise audio context ─────────────────────────────── */

  _initContext() {
    if (this.ctx) return;
    this.ctx      = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize         = 2048;   // 1024 bins
    this.analyser.smoothingTimeConstant = 0.75;
    this.bufferLen = this.analyser.frequencyBinCount;  // 1024
    this.dataArray = new Uint8Array(this.bufferLen);
    this.analyser.connect(this.ctx.destination);
  }

  /* ── Microphone input ─────────────────────────────────────── */

  async startMic() {
    this._initContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    if (this.source) this.source.disconnect();
    this.source = this.ctx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    // Don't connect analyser to destination for mic (avoid feedback)
    this.analyser.disconnect();
    this.isRunning = true;
  }

  /* ── Audio file input ─────────────────────────────────────── */

  async startFile(file) {
    this._initContext();
    if (this.source) this.source.disconnect();

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const bufferSource = this.ctx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop   = true;
    bufferSource.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    bufferSource.start(0);

    this.source    = bufferSource;
    this.isRunning = true;
  }

  /* ── Per-frame analysis ───────────────────────────────────── */

  update() {
    if (!this.isRunning || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    const sampleRate = this.ctx.sampleRate;          // e.g. 44100
    const binHz      = sampleRate / (this.bufferLen * 2);  // Hz per bin

    // Compute band averages
    const rawBass   = this._bandAverage(20,   250,  binHz);
    const rawMid    = this._bandAverage(250,  4000, binHz);
    const rawTreble = this._bandAverage(4000, 20000, binHz);

    // Exponential lerp smoothing (0–1)
    this.bass   += (rawBass   - this.bass)   * this.lerpFactor;
    this.mid    += (rawMid    - this.mid)    * this.lerpFactor;
    this.treble += (rawTreble - this.treble) * this.lerpFactor;

    // Raw peaks (no smoothing — for punch / transients)
    this.bassPeak   = rawBass;
    this.midPeak    = rawMid;
    this.treblePeak = rawTreble;
  }

  /* ── Helper: average bin values within a frequency range ──── */

  _bandAverage(freqLow, freqHigh, binHz) {
    const lo  = Math.floor(freqLow  / binHz);
    const hi  = Math.min(Math.ceil(freqHigh / binHz), this.bufferLen - 1);
    let   sum = 0;
    for (let i = lo; i <= hi; i++) sum += this.dataArray[i];
    return (sum / ((hi - lo + 1) * 255));  // normalised 0–1
  }

  /* ── Suspend / resume (page visibility) ──────────────────── */

  suspend() { if (this.ctx) this.ctx.suspend(); }
  resume()  { if (this.ctx) this.ctx.resume(); }
}
