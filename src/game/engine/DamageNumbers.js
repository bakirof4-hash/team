export class DamageNumbers {
  constructor() {
    this.numbers = [];
  }

  add({
    x,
    y,
    text,
    color = '#ffffff',
    fontSize = 16,
    isCrit = false,
    duration = 0.85,
    strokeColor = '#000000',
  }) {
    // Add slight random offset to prevent stacking
    const offsetX = (Math.random() - 0.5) * 24;
    const offsetY = (Math.random() - 0.5) * 12;

    this.numbers.push({
      x: x + offsetX,
      y: y + offsetY,
      text: String(text),
      color,
      strokeColor,
      baseSize: isCrit ? fontSize * 1.35 : fontSize,
      isCrit,
      life: duration,
      maxLife: duration,
      vy: isCrit ? -110 : -75,
      vx: (Math.random() - 0.5) * 35,
      scale: isCrit ? 1.6 : 1.2,
      alpha: 1,
    });
  }

  addDamage(x, y, amount, isCrit = false) {
    const text = isCrit ? `CRIT! ${Math.round(amount)}` : `${Math.round(amount)}`;
    this.add({
      x,
      y,
      text,
      color: isCrit ? '#facc15' : '#f8fafc',
      strokeColor: isCrit ? '#713f12' : '#0f172a',
      fontSize: isCrit ? 20 : 16,
      isCrit,
      duration: isCrit ? 1.05 : 0.75,
    });
  }

  addPlayerDamage(x, y, amount) {
    this.add({
      x,
      y,
      text: `-${Math.round(amount)}`,
      color: '#f87171',
      strokeColor: '#450a0a',
      fontSize: 18,
      duration: 0.8,
    });
  }

  addHeal(x, y, amount) {
    this.add({
      x,
      y,
      text: `+${Math.round(amount)}`,
      color: '#4ade80',
      strokeColor: '#052e16',
      fontSize: 15,
      duration: 0.75,
    });
  }

  addGold(x, y, amount) {
    this.add({
      x,
      y,
      text: `+${amount}g`,
      color: '#fde047',
      strokeColor: '#78350f',
      fontSize: 15,
      duration: 0.7,
    });
  }

  addXp(x, y, amount) {
    this.add({
      x,
      y,
      text: `+${amount} XP`,
      color: '#38bdf8',
      strokeColor: '#082f49',
      fontSize: 14,
      duration: 0.7,
    });
  }

  update(dt) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      num.life -= dt;

      if (num.life <= 0) {
        this.numbers.splice(i, 1);
        continue;
      }

      num.x += num.vx * dt;
      num.y += num.vy * dt;
      num.vy += 65 * dt; // gravity easing deceleration

      const progress = num.life / num.maxLife; // 1 -> 0
      num.alpha = Math.min(1, progress * 1.5);

      // Bounce scale down to 1.0 then shrink at end
      if (progress > 0.8) {
        num.scale = 1 + (num.isCrit ? 0.6 : 0.3) * ((progress - 0.8) / 0.2);
      } else {
        num.scale = 1;
      }
    }
  }

  render(ctx) {
    if (this.numbers.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const num of this.numbers) {
      ctx.globalAlpha = num.alpha;
      const size = Math.max(8, Math.round(num.baseSize * num.scale));
      ctx.font = `${num.isCrit ? 'bold ' : '600 '}${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      ctx.strokeStyle = num.strokeColor;
      ctx.lineWidth = num.isCrit ? 4 : 3;
      ctx.strokeText(num.text, num.x, num.y);

      ctx.fillStyle = num.color;
      ctx.fillText(num.text, num.x, num.y);
    }
    ctx.restore();
  }

  clear() {
    this.numbers = [];
  }
}
