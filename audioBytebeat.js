export class BytebeatEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.bufferSize = 4096;
    this.node = this.ctx.createScriptProcessor(this.bufferSize, 0, 1);
    this.t = 0;
    // Expose simple amplitude values for HUD (approximate)
    this.bass = this.mid = this.treble = 0;
    this.node.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++, this.t++) {
        // Classic bytebeat: (t>>4)|(t>>5) or similar – use a melodic pattern
        const sample = ((this.t * (this.t >> 12 | this.t >> 8)) & 127) / 128 - 0.5;
        out[i] = sample;
        // Rough band mapping for visualizer HUD
        const amp = Math.abs(sample);
        this.bass   = amp * 0.5;
        this.mid    = amp * 0.7;
        this.treble = amp;
      }
    };
    this.node.connect(this.ctx.destination);
  }

  start() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  suspend() {
    if (this.ctx.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  stop() {
    this.node.disconnect();
    this.ctx.close();
  }
}

