export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.charA = { x: 80, y: 200, r: 20, color: '#ff6', angle: 0 };
    this.charB = { x: 320, y: 200, r: 20, color: '#6ff', angle: 0 };
    this.dancing = false;
    this.fade = 1;
  }

  update(audio) {
    const beat = audio?.bass ?? 0;
    const speed = 2 + beat * 30;
    if (!this.dancing) {
      const targetX = this.canvas.width / 2;
      const targetY = this.canvas.height / 2;
      this.charA.x += (targetX - this.charA.x) * 0.02 * speed;
      this.charA.y += (targetY - this.charA.y) * 0.02 * speed;
      this.charB.x += (targetX - this.charB.x) * 0.02 * speed;
      this.charB.y += (targetY - this.charB.y) * 0.02 * speed;
      const dx = this.charA.x - this.charB.x;
      const dy = this.charA.y - this.charB.y;
      if (Math.hypot(dx, dy) < 30) this.dancing = true;
    } else {
      this.charA.angle += 0.06 + beat * 0.3;
      this.charB.angle += 0.06 + beat * 0.3;
      const pulse = 1 + beat * 0.4;
      this.charA.r = 20 * pulse;
      this.charB.r = 20 * pulse;
    }
    // fade during outro
    if (window.phase === 'outro') this.fade *= 0.96;
    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = this.fade;
    const drawChar = (c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawChar(this.charA);
    drawChar(this.charB);
  }
}

