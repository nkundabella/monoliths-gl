// scene.js — the visual "sketch" that plays during the show.
// Two stick figures walk toward each other, meet in the middle, and dance
// for as long as the music is running. On the outro they fade out together.

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    // start them on opposite sides — left one is yellow-ish, right one cyan-ish
    this.charA = { x: 80,  y: 0, color: '#ffdd55', angle: 0, dancing: false };
    this.charB = { x: -80, y: 0, color: '#55ffee', angle: 0, dancing: false };

    // sparks that pop out on a strong beat
    this.sparks = [];

    // 1 = fully visible, decays to 0 at the outro
    this.fade = 1;
  }

  // called every frame — audio can be null during the idle/intro phase
  update(audio) {
    const beat  = audio?.bass ?? 0;
    const mid   = audio?.mid  ?? 0;
    // base walk speed plus a kick on strong beats
    const speed = 1.2 + beat * 18;

    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 2;

    if (!this.charA.dancing) {
      // walk toward each other — charA from the left, charB from the right
      this.charA.x += (cx - this.charA.x) * 0.015 * speed;
      this.charA.y += (cy - this.charA.y) * 0.015 * speed;
      this.charB.x += (cx - this.charB.x) * 0.015 * speed;
      this.charB.y += (cy - this.charB.y) * 0.015 * speed;

      const dx = this.charA.x - this.charB.x;
      const dy = this.charA.y - this.charB.y;
      if (Math.hypot(dx, dy) < 36) {
        this.charA.dancing = true;
        this.charB.dancing = true;
      }
    } else {
      // when dancing, orbit slightly around the centre point
      const t = performance.now() / 1000;
      const orbitR = 22 + mid * 15;
      this.charA.x = cx + Math.cos(t * 1.4) * orbitR;
      this.charA.y = cy + Math.sin(t * 1.4) * orbitR * 0.5;
      this.charB.x = cx - Math.cos(t * 1.4) * orbitR;
      this.charB.y = cy - Math.sin(t * 1.4) * orbitR * 0.5;
    }

    // pop a few sparks when the kick hits
    if (beat > 0.45) {
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3;
        this.sparks.push({
          x:    (this.charA.x + this.charB.x) / 2,
          y:    (this.charA.y + this.charB.y) / 2,
          vx:   Math.cos(ang) * spd,
          vy:   Math.sin(ang) * spd,
          life: 1,            // 1 → 0
          hue:  Math.random() * 60 + 30,  // warm yellows and oranges
        });
      }
    }

    // age sparks
    this.sparks = this.sparks.filter(s => {
      s.x    += s.vx;
      s.y    += s.vy;
      s.vy   += 0.08;         // gravity
      s.life -= 0.04;
      return s.life > 0;
    });

    // fade during outro
    if (window.phase === 'outro') this.fade = Math.max(0, this.fade - 0.012);

    this._draw(beat, mid);
  }

  _draw(beat, mid) {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = this.fade;

    // deep background — shifts slightly with the bass
    const dark = Math.floor(10 + beat * 20);
    ctx.fillStyle = `rgb(${dark}, ${dark}, ${Math.floor(dark * 1.4)})`;
    ctx.fillRect(0, 0, W, H);

    // draw sparks underneath the figures
    for (const s of this.sparks) {
      ctx.globalAlpha = this.fade * s.life;
      ctx.fillStyle   = `hsl(${s.hue}, 90%, 65%)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = this.fade;

    this._figure(this.charA, beat, mid);
    this._figure(this.charB, beat, mid);
  }

  // draw one stick figure — arms and legs swing when dancing
  _figure(char, beat, mid) {
    const ctx     = this.ctx;
    const { x, y, color, dancing } = char;

    // how much limbs swing — zero while walking, beat-driven while dancing
    const swing   = dancing ? Math.sin(performance.now() / 180) * (0.5 + beat * 0.4) : 0;
    const legSwing = dancing ? -swing * 0.7 : 0;

    ctx.save();
    ctx.translate(x, y);

    // head
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8 + beat * 14;
    ctx.beginPath();
    ctx.arc(0, -44, 10, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3.5;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // left arm
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(-0.3 + swing);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-16, 10);
    ctx.stroke();
    ctx.restore();

    // right arm
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(0.3 - swing);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(16, 10);
    ctx.stroke();
    ctx.restore();

    // left leg
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(legSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-10, 22);
    ctx.stroke();
    ctx.restore();

    // right leg
    ctx.save();
    ctx.translate(0, 10);
    ctx.rotate(-legSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(10, 22);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}
