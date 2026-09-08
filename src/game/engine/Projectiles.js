export class Projectile {
  constructor({
    x,
    y,
    vx,
    vy,
    radius = 6,
    damage = 25,
    isCrit = false,
    owner = 'player', // 'player' | 'enemy'
    color = '#60a5fa',
    accentColor = '#ffffff',
    lifetime = 1.2,
    pierce = 0,
    homingTarget = null,
    homingStrength = 0,
    type = 'slash', // 'slash' | 'arrow' | 'fireball' | 'demon_orb' | 'boss_orb'
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.damage = damage;
    this.isCrit = isCrit;
    this.owner = owner;
    this.color = color;
    this.accentColor = accentColor;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.pierce = pierce;
    this.hitEntities = new Set();
    this.isDestroyed = false;
    this.homingTarget = homingTarget;
    this.homingStrength = homingStrength;
    this.type = type;
    this.trailTimer = 0;
  }

  update(dt, particleSystem) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.isDestroyed = true;
      return;
    }

    // Homing behavior if specified
    if (this.homingTarget && !this.homingTarget.isDead && this.homingStrength > 0) {
      const dx = this.homingTarget.x - this.x;
      const dy = this.homingTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const speed = Math.hypot(this.vx, this.vy);
        const desiredVx = (dx / dist) * speed;
        const desiredVy = (dy / dist) * speed;
        this.vx += (desiredVx - this.vx) * Math.min(1, this.homingStrength * dt);
        this.vy += (desiredVy - this.vy) * Math.min(1, this.homingStrength * dt);
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Trail particle emission
    this.trailTimer += dt;
    if (particleSystem && this.trailTimer > 0.035) {
      this.trailTimer = 0;
      if (this.type === 'fireball' || this.type === 'demon_orb' || this.type === 'boss_orb') {
        particleSystem.emit({
          x: this.x,
          y: this.y,
          count: 1,
          speedMin: 5,
          speedMax: 25,
          sizeMin: 2,
          sizeMax: this.radius * 0.7,
          lifeMin: 0.15,
          lifeMax: 0.3,
          colors: [this.color, this.accentColor, '#f97316'],
          shape: 'circle',
          glow: true,
        });
      } else if (this.type === 'slash') {
        particleSystem.emit({
          x: this.x,
          y: this.y,
          count: 1,
          speedMin: 10,
          speedMax: 30,
          sizeMin: 2,
          sizeMax: 4,
          lifeMin: 0.1,
          lifeMax: 0.2,
          colors: [this.color, '#93c5fd', '#ffffff'],
          shape: 'spark',
          glow: true,
        });
      }
    }
  }

  render(ctx) {
    ctx.save();
    const angle = Math.atan2(this.vy, this.vx);

    if (this.type === 'slash') {
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);

      // Arc energy blade
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.6, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.lineWidth = this.isCrit ? 6 : 4;
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.isCrit ? 14 : 8;
      ctx.stroke();

      // Inner core
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.2, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.accentColor;
      ctx.stroke();
    } else if (this.type === 'arrow') {
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);

      // Wooden shaft
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(8, -4);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();

      // Feathers
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-12, -3);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Glowing orb (fireball / demon_orb / boss_orb)
      ctx.translate(this.x, this.y);

      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
      grad.addColorStop(0, this.accentColor);
      grad.addColorStop(0.5, this.color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  add(projectile) {
    this.projectiles.push(projectile);
  }

  spawnPlayerSlash({
    x,
    y,
    targetX,
    targetY,
    damage,
    isCrit,
    speed = 580,
    radius = 12,
  }) {
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;

    const proj = new Projectile({
      x,
      y,
      vx,
      vy,
      radius,
      damage,
      isCrit,
      owner: 'player',
      color: isCrit ? '#facc15' : '#38bdf8',
      accentColor: '#ffffff',
      lifetime: 0.85,
      pierce: isCrit ? 1 : 0,
      type: 'slash',
    });

    this.add(proj);
    return proj;
  }

  spawnWhirlwindNova({ x, y, damage, isCrit, count = 8, speed = 400 }) {
    const angleStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const proj = new Projectile({
        x,
        y,
        vx,
        vy,
        radius: 14,
        damage: damage * 0.75,
        isCrit,
        owner: 'player',
        color: '#a855f7',
        accentColor: '#f3e8ff',
        lifetime: 0.65,
        pierce: 2,
        type: 'slash',
      });
      this.add(proj);
    }
  }

  spawnEnemyArrow({ x, y, targetX, targetY, damage, speed = 380 }) {
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;

    const proj = new Projectile({
      x,
      y,
      vx,
      vy,
      radius: 6,
      damage,
      owner: 'enemy',
      color: '#f87171',
      accentColor: '#fee2e2',
      lifetime: 2.0,
      type: 'arrow',
    });
    this.add(proj);
    return proj;
  }

  spawnDemonOrb({ x, y, targetX, targetY, damage, speed = 290, homingTarget = null }) {
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;

    const proj = new Projectile({
      x,
      y,
      vx,
      vy,
      radius: 9,
      damage,
      owner: 'enemy',
      color: '#dc2626',
      accentColor: '#fef08a',
      lifetime: 2.5,
      type: 'demon_orb',
      homingTarget,
      homingStrength: 1.5,
    });
    this.add(proj);
    return proj;
  }

  spawnBossSpiral({ x, y, baseAngle, count = 10, speed = 320, damage = 35 }) {
    const angleStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + i * angleStep;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const proj = new Projectile({
        x,
        y,
        vx,
        vy,
        radius: 11,
        damage,
        owner: 'enemy',
        color: '#b91c1c',
        accentColor: '#fbbf24',
        lifetime: 3.0,
        type: 'boss_orb',
      });
      this.add(proj);
    }
  }

  update(dt, particleSystem) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, particleSystem);
      if (p.isDestroyed) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.projectiles) {
      p.render(ctx);
    }
  }

  clear() {
    this.projectiles = [];
  }
}
