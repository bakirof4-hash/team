import { PLAYER_CONFIG, CANVAS_CONFIG } from '../constants.js';

export class Player {
  constructor(x = CANVAS_CONFIG.ARENA_WIDTH / 2, y = CANVAS_CONFIG.ARENA_HEIGHT / 2) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER_CONFIG.RADIUS;

    // Attributes
    this.speed = PLAYER_CONFIG.SPEED;
    this.maxHp = PLAYER_CONFIG.MAX_HP;
    this.hp = this.maxHp;
    this.hpRegen = PLAYER_CONFIG.HP_REGEN;
    this.magnetRadius = PLAYER_CONFIG.MAGNET_RADIUS;

    // Progression
    this.level = 1;
    this.xp = 0;
    this.maxXp = 100;
    this.gold = 0;
    this.kills = 0;

    // Combat Stats
    this.baseDamage = PLAYER_CONFIG.ATTACK_DAMAGE;
    this.critChance = PLAYER_CONFIG.CRIT_CHANCE;
    this.critMultiplier = PLAYER_CONFIG.CRIT_MULTIPLIER;
    this.attackCooldown = PLAYER_CONFIG.ATTACK_COOLDOWN;
    this.attackTimer = 0;

    // Special Whirlwind Attack
    this.specialCooldown = PLAYER_CONFIG.SPECIAL_COOLDOWN;
    this.specialTimer = 0;

    // Dash
    this.dashCooldown = PLAYER_CONFIG.DASH_COOLDOWN;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashDuration = PLAYER_CONFIG.DASH_DURATION;
    this.currentDashTime = 0;
    this.dashDirection = { x: 1, y: 0 };

    // Invulnerability
    this.invulnerableTimer = 0;
    this.isDead = false;

    // Animation & facing
    this.facingAngle = 0;
    this.walkCycle = 0;
    this.swingProgress = 0; // for sword swing visual
  }

  takeDamage(amount, damageNumbers, particleSystem) {
    if (this.isDead || this.invulnerableTimer > 0 || this.isDashing) {
      return 0;
    }

    const actualDamage = Math.max(1, Math.round(amount));
    this.hp -= actualDamage;
    this.invulnerableTimer = PLAYER_CONFIG.INVULNERABLE_TIME;

    if (damageNumbers) {
      damageNumbers.addPlayerDamage(this.x, this.y - this.radius, actualDamage);
    }
    if (particleSystem) {
      particleSystem.createBloodSplatter(this.x, this.y, '#ef4444');
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (particleSystem) {
        particleSystem.createDeathExplosion(this.x, this.y, this.radius * 1.5, '#ef4444');
      }
    }

    return actualDamage;
  }

  heal(amount) {
    if (this.isDead) return 0;
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return Math.round(this.hp - oldHp);
  }

  addGold(amount) {
    this.gold += amount;
  }

  addXp(amount, damageNumbers, particleSystem) {
    this.xp += amount;
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp;
      this.levelUp(damageNumbers, particleSystem);
    }
  }

  levelUp(damageNumbers, particleSystem) {
    this.level += 1;
    this.maxXp = Math.round(this.maxXp * 1.32 + 25);

    // Stat gains
    this.maxHp = Math.round(this.maxHp + 18);
    this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.45));
    this.baseDamage = Math.round(this.baseDamage + 5);
    this.critChance = Math.min(0.6, this.critChance + 0.015);
    this.speed = Math.min(320, this.speed + 4);
    this.magnetRadius = Math.min(260, this.magnetRadius + 10);

    if (damageNumbers) {
      damageNumbers.add({
        x: this.x,
        y: this.y - 40,
        text: `LEVEL UP! Lv.${this.level}`,
        color: '#38bdf8',
        strokeColor: '#0369a1',
        fontSize: 22,
        duration: 1.3,
        isCrit: true,
      });
    }

    if (particleSystem) {
      particleSystem.createLevelUpEffect(this.x, this.y);
    }
  }

  tryPrimaryAttack(targetX, targetY, projectileManager) {
    if (this.isDead || this.attackTimer > 0) return false;

    this.attackTimer = this.attackCooldown;
    this.swingProgress = 1.0;

    // Calculate critical hit
    const isCrit = Math.random() < this.critChance;
    const damage = isCrit
      ? this.baseDamage * this.critMultiplier
      : this.baseDamage;

    // Small random damage variance (±8%)
    const variance = 0.92 + Math.random() * 0.16;
    const finalDamage = Math.round(damage * variance);

    projectileManager.spawnPlayerSlash({
      x: this.x,
      y: this.y,
      targetX,
      targetY,
      damage: finalDamage,
      isCrit,
      speed: PLAYER_CONFIG.PROJECTILE_SPEED,
    });

    return true;
  }

  trySpecialAttack(projectileManager, particleSystem) {
    if (this.isDead || this.specialTimer > 0) return false;

    this.specialTimer = this.specialCooldown;
    this.swingProgress = 1.0;

    const isCrit = Math.random() < this.critChance;
    const damage = (isCrit ? PLAYER_CONFIG.SPECIAL_DAMAGE * this.critMultiplier : PLAYER_CONFIG.SPECIAL_DAMAGE);

    projectileManager.spawnWhirlwindNova({
      x: this.x,
      y: this.y,
      damage: Math.round(damage),
      isCrit,
      count: 10,
      speed: 420,
    });

    if (particleSystem) {
      particleSystem.emit({
        x: this.x,
        y: this.y,
        count: 20,
        speedMin: 80,
        speedMax: 200,
        colors: ['#a855f7', '#c084fc', '#ffffff'],
        shape: 'spark',
        glow: true,
      });
    }

    return true;
  }

  tryDash(dirX, dirY, particleSystem) {
    if (this.isDead || this.dashTimer > 0 || this.isDashing) return false;

    let dx = dirX;
    let dy = dirY;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(this.facingAngle);
      dy = Math.sin(this.facingAngle);
    }

    const len = Math.hypot(dx, dy) || 1;
    this.dashDirection = { x: dx / len, y: dy / len };
    this.isDashing = true;
    this.currentDashTime = this.dashDuration;
    this.dashTimer = this.dashCooldown;

    if (particleSystem) {
      particleSystem.createDashTrail(this.x, this.y, this.radius);
    }
    return true;
  }

  update(dt, inputManager, projectileManager, particleSystem) {
    if (this.isDead) return;

    // Cooldown timers
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.specialTimer > 0) this.specialTimer -= dt;
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // HP Regeneration
    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }

    // Sword swing animation decay
    if (this.swingProgress > 0) {
      this.swingProgress = Math.max(0, this.swingProgress - dt * 5);
    }

    // Handle Dash Movement vs Normal Movement
    const { dx, dy } = inputManager.getMovementVector();

    if (this.isDashing) {
      this.currentDashTime -= dt;
      this.vx = this.dashDirection.x * PLAYER_CONFIG.DASH_SPEED;
      this.vy = this.dashDirection.y * PLAYER_CONFIG.DASH_SPEED;

      if (particleSystem && Math.random() < 0.5) {
        particleSystem.createDashTrail(this.x, this.y, this.radius);
      }

      if (this.currentDashTime <= 0) {
        this.isDashing = false;
      }
    } else {
      if (dx !== 0 || dy !== 0) {
        this.vx = dx * this.speed;
        this.vy = dy * this.speed;
        this.walkCycle += dt * 12;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    }

    // Apply Velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Arena Clamping
    const margin = this.radius + 10;
    this.x = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_WIDTH - margin, this.x));
    this.y = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_HEIGHT - margin, this.y));

    // Facing direction: align towards cursor
    const mouseWorldX = inputManager.mouse.worldX;
    const mouseWorldY = inputManager.mouse.worldY;
    this.facingAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

    // Attack inputs
    if (inputManager.consumeDash()) {
      this.tryDash(dx, dy, particleSystem);
    }

    if (inputManager.consumeSpecial()) {
      this.trySpecialAttack(projectileManager, particleSystem);
    }

    if (
      inputManager.mouse.isDown ||
      inputManager.keys.has('j') ||
      inputManager.keys.has('f') ||
      inputManager.keys.has('enter')
    ) {
      let targetX = mouseWorldX;
      let targetY = mouseWorldY;
      if (Math.hypot(targetX - this.x, targetY - this.y) < 5) {
        targetX = this.x + Math.cos(this.facingAngle) * 100;
        targetY = this.y + Math.sin(this.facingAngle) * 100;
      }
      this.tryPrimaryAttack(targetX, targetY, projectileManager);
    }
  }

  render(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Blinking effect when invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.85, this.radius * 0.9, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dash aura / Shield glow
    if (this.isDashing) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#93c5fd';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Rotate player body towards facingAngle
    ctx.rotate(this.facingAngle);

    // Knight Body Armor
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shoulder Pauldrons
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, -this.radius * 0.7, 7, 0, Math.PI * 2);
    ctx.arc(0, this.radius * 0.7, 7, 0, Math.PI * 2);
    ctx.fill();

    // Visor glowing slit
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.radius * 0.2, -3, 8, 6);
    ctx.shadowBlur = 0;

    // Sword Weapon & Swing Arc
    const swordOffsetAngle = this.swingProgress > 0 ? (0.5 - this.swingProgress) * 1.8 : 0.4;
    ctx.save();
    ctx.rotate(swordOffsetAngle);

    // Sword Blade
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(this.radius * 0.7, -2.5, 22, 5);

    // Sword Tip
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.7 + 22, -2.5);
    ctx.lineTo(this.radius * 0.7 + 29, 0);
    ctx.lineTo(this.radius * 0.7 + 22, 2.5);
    ctx.closePath();
    ctx.fill();

    // Sword Crossguard & Pommel
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.radius * 0.65, -6, 4, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(this.radius * 0.35, -2, 7, 4);
    ctx.restore();

    ctx.restore();
  }
}
