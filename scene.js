export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Two stick‑figure characters
    this.charA = { x: 80, y: 200, color: '#ff6', angle: 0, dancing: false };
    this.charB = { x: 320, y: 200, color: '#6ff', angle: 0, dancing: false };
    // Simple particle system for beat‑driven sparks
    this.particles = [];
    this.fade = 1; // canvas opacity for outro
  }

  // audio may be null (idle) – we use bass amplitude as the beat value (0‑1)
  update(audio) {
    const beat = audio?.bass ?? 0;
    const speed = 2 + beat * 30; // faster when the beat is strong

    // Move characters toward the centre until they meet
    if (!this.charA.dancing && !this.charB.dancing) {
      const targetX = this.canvas.width / 2;
      const targetY = this.canvas.height / 2;
      this.charA.x += (targetX - this.charA.x) * 0.02 * speed;
      this.charA.y += (targetY - this.charA.y) * 0.02 * speed;
      this.charB.x += (targetX - this.charB.x) * 0.02 * speed;
      this.charB.y += (targetY - this.charB.y) * 0.02 * speed;

      // when they get close start dancing
      const dx = this.charA.x - this.charB.x;
      const dy = this.charA.y - this.charB.y;
      if (Math.hypot(dx, dy) < 30) {
        this.charA.dancing = true;
        this.charB.dancing = true;
      }
    }

    // Spawn a few spark particles on strong beats
    if (beat > 0.5) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: (this.charA.x + this.charB.x) / 2,
          y: (this.charA.y + this.charB.y) / 2,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 30,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`
        });
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });

    // fade out during outro
    if (window.phase === 'outro') this.fade *= 0.96;
    this._draw(beat);
  }

  _draw(beat) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = this.fade;

    // Background: vertical gradient that subtly shifts with the beat
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    const base = 200;
    const offset = beat * 30;
    grad.addColorStop(0, `rgb(${base + offset}, ${base - offset}, 30)`);
    grad.addColorStop(1, `rgb(10, 10, ${30 + offset})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Helper to draw a simple stick figure
    const drawFigure = (char) => {
      const { x, y, color, angle, dancing } = char;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Head
      const headR = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -headR - 20, headR, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 30);
      ctx.stroke();

      // Arms – swing with the beat when dancing, otherwise stay down
      const armSwing = dancing ? Math.sin(beat * Math.PI * 2) * 0.6 : 0;
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(armSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(-armSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.restore();

      // Legs – opposite phase swing for a dancing effect
      const legSwing = dancing ? Math.sin(beat * Math.PI * 2 + Math.PI) * 0.4 : 0;
      ctx.save();
      ctx.translate(0, 30);
      ctx.rotate(legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, 15);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, 30);
      ctx.rotate(-legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, 15);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    };

    // Draw particles (tiny sparks)
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    drawFigure(this.charA);
    drawFigure(this.charB);
  }
}

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Two stick‑figure characters
    this.charA = { x: 80, y: 200, color: '#ff6', angle: 0, dancing: false };
    this.charB = { x: 320, y: 200, color: '#6ff', angle: 0, dancing: false };
    this.fade = 1; // canvas opacity for outro
  }

  // audio may be null (idle) – we use bass amplitude as the beat value (0‑1)
  update(audio) {
    const beat = audio?.bass ?? 0;
    const speed = 2 + beat * 30; // faster when the beat is strong

    // Move characters toward the centre until they meet
    if (!this.charA.dancing && !this.charB.dancing) {
      const targetX = this.canvas.width / 2;
      const targetY = this.canvas.height / 2;
      this.charA.x += (targetX - this.charA.x) * 0.02 * speed;
      this.charA.y += (targetY - this.charA.y) * 0.02 * speed;
      this.charB.x += (targetX - this.charB.x) * 0.02 * speed;
      this.charB.y += (targetY - this.charB.y) * 0.02 * speed;

      // when they get close start dancing
      const dx = this.charA.x - this.charB.x;
      const dy = this.charA.y - this.charB.y;
      if (Math.hypot(dx, dy) < 30) {
        this.charA.dancing = true;
        this.charB.dancing = true;
      }
    }
    // fade out during outro
    if (window.phase === 'outro') this.fade *= 0.96;
    this._draw(beat);
  }

  _draw(beat) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = this.fade;

    // Helper to draw a simple stick figure
    const drawFigure = (char) => {
      const { x, y, color, angle, dancing } = char;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Head
      const headR = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -headR - 20, headR, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 30);
      ctx.stroke();

      // Arms – swing with the beat when dancing, otherwise stay down
      const armSwing = dancing ? Math.sin(beat * Math.PI * 2) * 0.6 : 0;
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(armSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(-armSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.restore();

      // Legs – opposite phase swing for a dancing effect
      const legSwing = dancing ? Math.sin(beat * Math.PI * 2 + Math.PI) * 0.4 : 0;
      ctx.save();
      ctx.translate(0, 30);
      ctx.rotate(legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, 15);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, 30);
      ctx.rotate(-legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, 15);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    };

    drawFigure(this.charA);
    drawFigure(this.charB);
  }
}
