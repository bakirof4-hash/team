import { BOSS_CONFIG, CANVAS_CONFIG } from '../constants.js';

export class Boss {
  constructor({ wave = 5, x = CANVAS_CONFIG.ARENA_WIDTH / 2, y = 300 }) {
    this.id = 'boss_' + Math.random().toString(36).substring(2, 9);
    this.isBoss = true;
    this.name = BOSS_CONFIG.name;
    this.radius = BOSS_CONFIG.radius;
    this.color = BOSS_CONFIG.color;
    this.accentColor = BOSS_CONFIG.accentColor;
    this.knockbackResistance = 0.95; // virtually immune to knockback

    // Boss Scaling
    const waveMultiplier = 1 + (wave - 5) * 0.45;
    this.maxHp = Math.round(BOSS_CONFIG.baseHp * waveMultiplier);
    this.hp = this.maxHp;
    this.damage = Math.round(BOSS_CONFIG.baseDamage * (1 + (wave - 5) * 0.25));
    this.baseSpeed = BOSS_CONFIG.baseSpeed;
    this.speed = this.baseSpeed;

    this.xpReward = Math.round(BOSS_CONFIG.xpReward * waveMultiplier);
    this.goldChance = 1.0;
    this.goldMin = BOSS_CONFIG.goldMin;
    this.goldMax = BOSS_CONFIG.goldMax;

    // Transform
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.facingAngle = 0;
    this.isDead = false;

    // Phase management
    this.phase = 1; // 1: normal, 2: enraged
    this.hasTransitioned = false;

    // Boss Attack Patterns & Cooldowns
    this.slamCooldown = 6.0;
    this.slamTimer = 3.0;
    this.isSlamming = false;
    this.slamTelegraphTimer = 0;
    this.slamPos = { x: 0, y: 0 };
    this.slamRadius = 150;

    this.projectileRingCooldown = 5.0;
    this.projectileRingTimer = 4.0;

    this.spiralBarrageCooldown = 4.0;
    this.spiralBarrageTimer = 2.0;

    this.summonCooldown = 14.0;
    this.summonTimer = 8.0;

    // Hit & visual effects
    this.hitFlashTimer = 0;
    this.flameAuraTimer = 0;
    this.auraPulse = 0;
  }

  takeDamage(amount, damageNumbers, particleSystem, isCrit = false, _knockbackSource = null) {
    if (this.isDead) return 0;

    const actualDamage = Math.max(1, Math.round(amount));
    this.hp -= actualDamage;
    this.hitFlashTimer = 0.12;

    if (damageNumbers) {
      damageNumbers.addDamage(this.x, this.y - this.radius, actualDamage, isCrit);
    }

    if (particleSystem) {
      if (isCrit) {
        particleSystem.createCritBurst(this.x, this.y);
      } else {
        particleSystem.createHitSparks(this.x, this.y, null, '#dc2626');
      }
      particleSystem.createBloodSplatter(this.x, this.y, '#991b1b');
    }

    // Phase 2 transition check at 50% HP
    if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.hasTransitioned = true;
      this.speed = BOSS_CONFIG.enragedSpeed;

      if (damageNumbers) {
        damageNumbers.add({
          x: this.x,
          y: this.y - 60,
          text: 'ENRAGED!',
          color: '#ef4444',
          strokeColor: '#450a0a',
          fontSize: 28,
          duration: 1.8,
          isCrit: true,
        });
      }

      if (particleSystem) {
        particleSystem.createDeathExplosion(this.x, this.y, 80, '#ef4444');
      }
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (particleSystem) {
        particleSystem.createDeathExplosion(this.x, this.y, 100, '#dc2626');
        particleSystem.createDeathExplosion(this.x + 20, this.y - 20, 70, '#f59e0b');
        particleSystem.createDeathExplosion(this.x - 20, this.y + 20, 70, '#ffffff');
      }
    }

    return actualDamage;
  }

  update(dt, player, projectileManager, particleSystem, enemySpawner, screenShakeCallback) {
    if (this.isDead) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    this.auraPulse += dt * 4;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    this.facingAngle = Math.atan2(dy, dx);

    // Timers
    this.slamTimer -= dt;
    this.projectileRingTimer -= dt;
    this.summonTimer -= dt;
    if (this.phase === 2) {
      this.spiralBarrageTimer -= dt;
    }

    // Flame aura particles
    this.flameAuraTimer += dt;
    if (particleSystem && this.flameAuraTimer > 0.08) {
      this.flameAuraTimer = 0;
      particleSystem.emit({
        x: this.x + (Math.random() - 0.5) * this.radius * 1.5,
        y: this.y + (Math.random() - 0.5) * this.radius * 1.5,
        count: this.phase === 2 ? 3 : 1,
        speedMin: 10,
        speedMax: 40,
        sizeMin: 3,
        sizeMax: 7,
        colors: this.phase === 2 ? ['#ef4444', '#f97316', '#fbbf24'] : ['#b91c1c', '#7f1d1d'],
        shape: 'spark',
        glow: true,
      });
    }

    // Attack 1: Ground Slam Telegraph & Execution
    if (this.isSlamming) {
      this.slamTelegraphTimer -= dt;
      this.vx = 0;
      this.vy = 0;

      if (this.slamTelegraphTimer <= 0) {
        this.isSlamming = false;
        this.slamTimer = this.slamCooldown;

        // Perform Slam
        if (screenShakeCallback) screenShakeCallback(12, 0.4);

        if (particleSystem) {
          particleSystem.createDeathExplosion(this.slamPos.x, this.slamPos.y, 60, '#ef4444');
          particleSystem.emit({
            x: this.slamPos.x,
            y: this.slamPos.y,
            count: 28,
            speedMin: 80,
            speedMax: 280,
            sizeMin: 4,
            sizeMax: 9,
            colors: ['#dc2626', '#f97316', '#fde047'],
            shape: 'spark',
            glow: true,
          });
        }

        // Damage check in radius
        const slamDx = player.x - this.slamPos.x;
        const slamDy = player.y - this.slamPos.y;
        const slamDist = Math.hypot(slamDx, slamDy);
        if (slamDist <= this.slamRadius + player.radius) {
          player.takeDamage(this.damage * 1.4, null, particleSystem);
        }
      }
    } else if (this.slamTimer <= 0 && dist < 320) {
      // Start slam telegraph
      this.isSlamming = true;
      this.slamTelegraphTimer = 1.0;
      this.slamPos = { x: player.x, y: player.y };
    }

    // Attack 2: 8-way projectile ring
    if (this.projectileRingTimer <= 0 && !this.isSlamming) {
      this.projectileRingTimer = this.projectileRingCooldown;
      if (projectileManager) {
        projectileManager.spawnBossSpiral({
          x: this.x,
          y: this.y,
          baseAngle: this.facingAngle,
          count: this.phase === 2 ? 12 : 8,
          speed: 310,
          damage: this.damage * 0.8,
        });
      }
    }

    // Attack 3: Enraged Phase 2 Spiral Barrage
    if (this.phase === 2 && this.spiralBarrageTimer <= 0 && !this.isSlamming) {
      this.spiralBarrageTimer = this.spiralBarrageCooldown;
      if (projectileManager) {
        for (let s = 0; s < 3; s++) {
          setTimeout(() => {
            if (!this.isDead && projectileManager) {
              projectileManager.spawnBossSpiral({
                x: this.x,
                y: this.y,
                baseAngle: (s * Math.PI) / 6,
                count: 8,
                speed: 340,
                damage: this.damage * 0.75,
              });
            }
          }, s * 220);
        }
      }
    }

    // Attack 4: Summon Minions
    if (this.summonTimer <= 0) {
      this.summonTimer = this.summonCooldown;
      if (enemySpawner) {
        // Summon 2 goblins / zombies around boss
        enemySpawner.spawnMinionAt('goblin', this.x - 70, this.y + 40);
        enemySpawner.spawnMinionAt('goblin', this.x + 70, this.y + 40);
        if (this.phase === 2) {
          enemySpawner.spawnMinionAt('demon', this.x, this.y - 80);
        }

        if (particleSystem) {
          particleSystem.emit({
            x: this.x,
            y: this.y,
            count: 20,
            speedMin: 50,
            speedMax: 150,
            colors: ['#7f1d1d', '#991b1b', '#000000'],
            shape: 'circle',
          });
        }
      }
    }

    // Normal Movement towards player if not slamming
    if (!this.isSlamming) {
      this.vx = dirX * this.speed;
      this.vy = dirY * this.speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // Arena Clamping
    const margin = this.radius + 10;
    this.x = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_WIDTH - margin, this.x));
    this.y = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_HEIGHT - margin, this.y));
  }

  render(ctx) {
    if (this.isDead) return;

    ctx.save();

    // Render Slam Telegraph
    if (this.isSlamming) {
      ctx.save();
      const progress = 1 - this.slamTelegraphTimer / 1.0;

      // Telegraph circle outline
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(this.slamPos.x, this.slamPos.y, this.slamRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Expanding inner fill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(this.slamPos.x, this.slamPos.y, this.slamRadius * progress, 0, Math.PI * 2);
      ctx.fill();

      // Connecting danger beam
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.slamPos.x, this.slamPos.y);
      ctx.stroke();

      ctx.restore();
    }

    ctx.translate(this.x, this.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.9, this.radius * 1.1, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aura Pulsing
    const auraSize = this.radius + 6 + Math.sin(this.auraPulse) * 4;
    ctx.strokeStyle = this.phase === 2 ? '#ef4444' : '#b91c1c';
    ctx.lineWidth = this.phase === 2 ? 5 : 3;
    ctx.shadowColor = this.phase === 2 ? '#f87171' : '#dc2626';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const isFlashing = this.hitFlashTimer > 0;
    ctx.rotate(this.facingAngle);

    // Boss Body - Demon Lord Armor
    ctx.fillStyle = isFlashing ? '#ffffff' : this.phase === 2 ? '#7f1d1d' : '#18181b';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Spiked Shoulders
    ctx.fillStyle = isFlashing ? '#ffffff' : '#450a0a';
    ctx.fillRect(-this.radius * 0.6, -this.radius - 8, 26, 14);
    ctx.fillRect(-this.radius * 0.6, this.radius - 6, 26, 14);

    // Large Demonic Horns
    ctx.fillStyle = isFlashing ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-10, -this.radius);
    ctx.quadraticCurveTo(12, -this.radius - 28, 30, -this.radius - 18);
    ctx.quadraticCurveTo(10, -this.radius - 4, 8, -this.radius);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-10, this.radius);
    ctx.quadraticCurveTo(12, this.radius + 28, 30, this.radius + 18);
    ctx.quadraticCurveTo(10, this.radius + 4, 8, this.radius);
    ctx.fill();

    // Glowing Core
    ctx.fillStyle = this.phase === 2 ? '#facc15' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.radius * 0.5, -7, 6, 4);
    ctx.fillRect(this.radius * 0.5, 3, 6, 4);

    ctx.restore();
  }
}
