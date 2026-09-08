export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(config) {
    const {
      x,
      y,
      count = 1,
      speedMin = 50,
      speedMax = 180,
      angleMin = 0,
      angleMax = Math.PI * 2,
      sizeMin = 2,
      sizeMax = 5,
      lifeMin = 0.25,
      lifeMax = 0.6,
      colors = ['#f59e0b', '#ef4444', '#ffffff'],
      shape = 'circle', // 'circle' | 'spark' | 'star' | 'square'
      gravity = 0,
      drag = 0.95,
      glow = false,
    } = config;

    for (let i = 0; i < count; i++) {
      const angle = angleMin + Math.random() * (angleMax - angleMin);
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const life = lifeMin + Math.random() * (lifeMax - lifeMin);
      const size = sizeMin + Math.random() * (sizeMax - sizeMin);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        initialSize: size,
        life,
        maxLife: life,
        color,
        shape,
        gravity,
        drag,
        glow,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
      });
    }
  }

  createHitSparks(x, y, dirAngle = null, color = '#fef08a') {
    const angleMin = dirAngle !== null ? dirAngle - 0.8 : 0;
    const angleMax = dirAngle !== null ? dirAngle + 0.8 : Math.PI * 2;

    this.emit({
      x,
      y,
      count: 8,
      speedMin: 80,
      speedMax: 240,
      angleMin,
      angleMax,
      sizeMin: 2,
      sizeMax: 4.5,
      lifeMin: 0.2,
      lifeMax: 0.45,
      colors: [color, '#ffffff', '#f59e0b'],
      shape: 'spark',
      glow: true,
      drag: 0.92,
    });
  }

  createCritBurst(x, y) {
    this.emit({
      x,
      y,
      count: 16,
      speedMin: 120,
      speedMax: 320,
      sizeMin: 3,
      sizeMax: 7,
      lifeMin: 0.35,
      lifeMax: 0.75,
      colors: ['#fbbf24', '#f59e0b', '#ffffff', '#fde047'],
      shape: 'star',
      glow: true,
      drag: 0.9,
    });
  }

  createBloodSplatter(x, y, enemyColor = '#ef4444', dirAngle = null) {
    const angleMin = dirAngle !== null ? dirAngle - 0.9 : 0;
    const angleMax = dirAngle !== null ? dirAngle + 0.9 : Math.PI * 2;

    this.emit({
      x,
      y,
      count: 10,
      speedMin: 60,
      speedMax: 200,
      angleMin,
      angleMax,
      sizeMin: 2.5,
      sizeMax: 5.5,
      lifeMin: 0.3,
      lifeMax: 0.6,
      colors: [enemyColor, '#991b1b', '#ffffff'],
      shape: 'circle',
      drag: 0.88,
      gravity: 40,
    });
  }

  createDeathExplosion(x, y, radius, color = '#ef4444') {
    this.emit({
      x,
      y,
      count: 24,
      speedMin: 70,
      speedMax: 260,
      sizeMin: 3,
      sizeMax: 8,
      lifeMin: 0.4,
      lifeMax: 0.85,
      colors: [color, '#f59e0b', '#ffffff', '#1f2937'],
      shape: 'circle',
      drag: 0.92,
      glow: true,
    });
  }

  createLevelUpEffect(x, y) {
    this.emit({
      x,
      y,
      count: 40,
      speedMin: 100,
      speedMax: 350,
      sizeMin: 4,
      sizeMax: 9,
      lifeMin: 0.6,
      lifeMax: 1.2,
      colors: ['#38bdf8', '#818cf8', '#fbbf24', '#ffffff'],
      shape: 'star',
      glow: true,
      drag: 0.94,
    });
  }

  createDashTrail(x, y, radius) {
    this.emit({
      x,
      y,
      count: 3,
      speedMin: 10,
      speedMax: 40,
      sizeMin: radius * 0.5,
      sizeMax: radius * 0.9,
      lifeMin: 0.15,
      lifeMax: 0.3,
      colors: ['rgba(96, 165, 250, 0.6)', 'rgba(147, 197, 253, 0.4)'],
      shape: 'circle',
      drag: 0.8,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.vy += p.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.rotation += p.vRot * dt;

      const progress = p.life / p.maxLife;
      p.alpha = Math.max(0, Math.min(1, progress));
      p.size = p.initialSize * (0.3 + 0.7 * progress);
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      if (p.shape === 'spark') {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillRect(-p.size * 1.5, -p.size * 0.5, p.size * 3, p.size);
        ctx.restore();
      } else if (p.shape === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          ctx.lineTo(
            Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
            -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size
          );
          ctx.lineTo(
            Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.4),
            -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.4)
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}
