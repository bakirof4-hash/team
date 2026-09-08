import { ENEMY_TYPES, CANVAS_CONFIG, DIFFICULTY_SCALING } from '../constants.js';

export class Enemy {
  constructor({ typeId, x, y, wave = 1 }) {
    const config = ENEMY_TYPES[typeId] || ENEMY_TYPES.goblin;
    this.id = Math.random().toString(36).substring(2, 9);
    this.typeId = config.id;
    this.name = config.name;
    this.radius = config.radius;
    this.color = config.color;
    this.accentColor = config.accentColor;
    this.behavior = config.behavior;
    this.knockbackResistance = config.knockbackResistance || 0;

    // Progression scaling
    const hpScale = 1 + DIFFICULTY_SCALING.hpScalePerWave * (wave - 1);
    const dmgScale = 1 + DIFFICULTY_SCALING.damageScalePerWave * (wave - 1);
    const speedScale = 1 + Math.min(
      DIFFICULTY_SCALING.maxSpeedBonus,
      DIFFICULTY_SCALING.speedScalePerWave * (wave - 1)
    );

    this.maxHp = Math.round(config.baseHp * hpScale);
    this.hp = this.maxHp;
    this.damage = Math.round(config.baseDamage * dmgScale);
    this.speed = config.baseSpeed * speedScale;
    this.attackCooldown = config.attackCooldown;
    this.attackTimer = 0;
    this.attackRange = config.attackRange;

    // Drop config
    this.xpReward = Math.round(config.xpReward * (1 + 0.1 * (wave - 1)));
    this.goldChance = config.goldChance;
    this.goldMin = config.goldMin;
    this.goldMax = config.goldMax;

    // Transform & Physics
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.facingAngle = 0;
    this.isDead = false;

    // Visual feedback
    this.hitFlashTimer = 0;
    this.wobbleTimer = Math.random() * Math.PI * 2;

    // Behavior specific states
    // Goblin:
    this.flankDirection = Math.random() < 0.5 ? 1 : -1;
    this.flankTimer = 0;

    // Orc:
    this.chargeState = 'idle'; // 'idle' | 'telegraph' | 'charging' | 'cooldown'
    this.chargeTimer = 0;
    this.chargeTarget = { x: 0, y: 0 };
    this.chargeSpeed = config.chargeSpeed || 270;

    // Archer:
    this.archerAimTimer = 0;
    this.isAiming = false;
    this.aimTarget = { x: 0, y: 0 };

    // Demon:
    this.teleportCooldown = 4.0;
    this.teleportTimer = 0;
    this.castTimer = 0;
  }

  takeDamage(amount, damageNumbers, particleSystem, isCrit = false, knockbackSource = null) {
    if (this.isDead) return 0;

    const actualDamage = Math.max(1, Math.round(amount));
    this.hp -= actualDamage;
    this.hitFlashTimer = 0.12;

    if (damageNumbers) {
      damageNumbers.addDamage(this.x, this.y - this.radius, actualDamage, isCrit);
    }

    if (particleSystem) {
      const hitAngle = knockbackSource
        ? Math.atan2(this.y - knockbackSource.y, this.x - knockbackSource.x)
        : null;

      if (isCrit) {
        particleSystem.createCritBurst(this.x, this.y);
      } else {
        particleSystem.createHitSparks(this.x, this.y, hitAngle, this.color);
      }
      particleSystem.createBloodSplatter(this.x, this.y, this.color, hitAngle);
    }

    // Apply Knockback
    if (knockbackSource && this.knockbackResistance < 1) {
      const dx = this.x - knockbackSource.x;
      const dy = this.y - knockbackSource.y;
      const len = Math.hypot(dx, dy) || 1;
      const force = (isCrit ? 360 : 220) * (1 - this.knockbackResistance);
      this.knockbackVx = (dx / len) * force;
      this.knockbackVy = (dy / len) * force;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (particleSystem) {
        particleSystem.createDeathExplosion(this.x, this.y, this.radius, this.color);
      }
    }

    return actualDamage;
  }

  update(dt, player, projectileManager, particleSystem) {
    if (this.isDead) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    this.wobbleTimer += dt * 8;

    // Decay knockback
    this.knockbackVx *= Math.pow(0.85, dt * 60);
    this.knockbackVy *= Math.pow(0.85, dt * 60);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    this.facingAngle = Math.atan2(dy, dx);

    // AI Behaviors
    let moveVx = 0;
    let moveVy = 0;

    switch (this.behavior) {
      case 'flank': // Goblin: agile swarming, flank curves
        this.flankTimer += dt;
        if (this.flankTimer > 2.0) {
          this.flankTimer = 0;
          if (Math.random() < 0.4) this.flankDirection *= -1;
        }

        // Perpendicular vector
        const perpX = -dirY * this.flankDirection;
        const perpY = dirX * this.flankDirection;

        // Blend forward pursuit with sideways flanking
        const flankBlend = dist > 90 ? 0.6 : 0.2;
        const combinedX = dirX * (1 - flankBlend) + perpX * flankBlend;
        const combinedY = dirY * (1 - flankBlend) + perpY * flankBlend;
        const combinedLen = Math.hypot(combinedX, combinedY) || 1;

        moveVx = (combinedX / combinedLen) * this.speed;
        moveVy = (combinedY / combinedLen) * this.speed;
        break;

      case 'relentless': // Zombie: direct forward march, slight lunge
        if (dist < 60) {
          // Lunge bite acceleration
          moveVx = dirX * (this.speed * 1.6);
          moveVy = dirY * (this.speed * 1.6);
        } else {
          moveVx = dirX * this.speed;
          moveVy = dirY * this.speed;
        }

        // Rotting trail
        if (particleSystem && Math.random() < 0.08) {
          particleSystem.emit({
            x: this.x,
            y: this.y,
            count: 1,
            speedMin: 5,
            speedMax: 20,
            sizeMin: 2,
            sizeMax: 4,
            lifeMin: 0.3,
            lifeMax: 0.6,
            colors: ['#047857', '#065f46'],
            shape: 'circle',
          });
        }
        break;

      case 'brute_charge': // Orc: charge with telegraph
        if (this.chargeState === 'idle') {
          // Approach player normally
          moveVx = dirX * this.speed;
          moveVy = dirY * this.speed;

          // Check if within charge range and line of sight
          this.chargeTimer += dt;
          if (dist < 260 && dist > 70 && this.chargeTimer > 2.5) {
            this.chargeState = 'telegraph';
            this.chargeTimer = 0.65; // telegraph duration
            this.chargeTarget = { x: player.x, y: player.y };
          }
        } else if (this.chargeState === 'telegraph') {
          // Pause and wind up
          moveVx = 0;
          moveVy = 0;
          this.chargeTimer -= dt;

          if (this.chargeTimer <= 0) {
            this.chargeState = 'charging';
            this.chargeTimer = 0.8; // charge duration
            const cdx = this.chargeTarget.x - this.x;
            const cdy = this.chargeTarget.y - this.y;
            const clen = Math.hypot(cdx, cdy) || 1;
            this.chargeDir = { x: cdx / clen, y: cdy / clen };
          }
        } else if (this.chargeState === 'charging') {
          this.chargeTimer -= dt;
          moveVx = this.chargeDir.x * this.chargeSpeed;
          moveVy = this.chargeDir.y * this.chargeSpeed;

          if (particleSystem && Math.random() < 0.4) {
            particleSystem.emit({
              x: this.x,
              y: this.y,
              count: 2,
              speedMin: 10,
              speedMax: 40,
              sizeMin: 3,
              sizeMax: 6,
              colors: ['#f97316', '#ea580c', '#78350f'],
              shape: 'spark',
            });
          }

          if (this.chargeTimer <= 0) {
            this.chargeState = 'cooldown';
            this.chargeTimer = 1.4;
          }
        } else if (this.chargeState === 'cooldown') {
          this.chargeTimer -= dt;
          moveVx = dirX * (this.speed * 0.5);
          moveVy = dirY * (this.speed * 0.5);
          if (this.chargeTimer <= 0) {
            this.chargeState = 'idle';
            this.chargeTimer = 0;
          }
        }
        break;

      case 'ranged_kiter': // Archer: maintains distance, kites, shoots arrows
        const desiredDistMin = 240;
        const desiredDistMax = 320;

        if (this.isAiming) {
          moveVx = 0;
          moveVy = 0;
          this.archerAimTimer -= dt;

          if (this.archerAimTimer <= 0) {
            this.isAiming = false;
            // Fire arrow projectile
            if (projectileManager) {
              projectileManager.spawnEnemyArrow({
                x: this.x,
                y: this.y,
                targetX: player.x,
                targetY: player.y,
                damage: this.damage,
                speed: 400,
              });
            }
            this.attackTimer = this.attackCooldown;
          }
        } else {
          if (dist < desiredDistMin) {
            // Kite away from player
            moveVx = -dirX * this.speed;
            moveVy = -dirY * this.speed;
          } else if (dist > desiredDistMax) {
            // Approach player
            moveVx = dirX * this.speed;
            moveVy = dirY * this.speed;
          } else {
            // Circle or strafe slightly
            moveVx = -dirY * (this.speed * 0.4);
            moveVy = dirX * (this.speed * 0.4);
          }

          // Start aiming if attack ready and in range
          if (this.attackTimer <= 0 && dist <= 380) {
            this.isAiming = true;
            this.archerAimTimer = 0.5; // aim windup
            this.aimTarget = { x: player.x, y: player.y };
          }
        }
        break;

      case 'caster_teleport': // Demon: casts homing hellfire orbs, teleports if cornered
        this.teleportTimer -= dt;
        this.castTimer -= dt;

        // Teleport away if player gets too close
        if (dist < 85 && this.teleportTimer <= 0) {
          this.teleportTimer = this.teleportCooldown;

          if (particleSystem) {
            particleSystem.createDeathExplosion(this.x, this.y, this.radius * 1.2, '#ef4444');
          }

          // Teleport away from player
          const teleportDist = 180 + Math.random() * 60;
          const teleportAngle = Math.atan2(this.y - player.y, this.x - player.x) + (Math.random() - 0.5);
          this.x += Math.cos(teleportAngle) * teleportDist;
          this.y += Math.sin(teleportAngle) * teleportDist;

          // Clamp
          this.x = Math.max(50, Math.min(CANVAS_CONFIG.ARENA_WIDTH - 50, this.x));
          this.y = Math.max(50, Math.min(CANVAS_CONFIG.ARENA_HEIGHT - 50, this.y));

          if (particleSystem) {
            particleSystem.createDeathExplosion(this.x, this.y, this.radius * 1.2, '#b91c1c');
          }
        }

        // Maintain hover range
        if (dist < 180) {
          moveVx = -dirX * this.speed;
          moveVy = -dirY * this.speed;
        } else if (dist > 280) {
          moveVx = dirX * this.speed;
          moveVy = dirY * this.speed;
        }

        // Cast homing orb
        if (this.castTimer <= 0 && dist <= 360) {
          this.castTimer = this.attackCooldown;
          if (projectileManager) {
            projectileManager.spawnDemonOrb({
              x: this.x,
              y: this.y,
              targetX: player.x,
              targetY: player.y,
              damage: this.damage,
              speed: 280,
              homingTarget: player,
            });
          }
        }
        break;

      default:
        moveVx = dirX * this.speed;
        moveVy = dirY * this.speed;
        break;
    }

    // Apply movement & knockback
    this.vx = moveVx + this.knockbackVx;
    this.vy = moveVy + this.knockbackVy;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Arena Clamping
    const margin = this.radius + 5;
    this.x = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_WIDTH - margin, this.x));
    this.y = Math.max(margin, Math.min(CANVAS_CONFIG.ARENA_HEIGHT - margin, this.y));
  }

  render(ctx) {
    if (this.isDead) return;

    ctx.save();

    // Render telegraphs if applicable
    if (this.chargeState === 'telegraph') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.chargeTarget.x, this.chargeTarget.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.chargeTarget.x, this.chargeTarget.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.isAiming) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.aimTarget.x, this.aimTarget.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.translate(this.x, this.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.8, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hit flash
    const isFlashing = this.hitFlashTimer > 0;

    ctx.rotate(this.facingAngle);

    // Individual enemy visuals
    if (this.typeId === 'goblin') {
      // Nimble Goblin
      ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Large Pointy Ears
      ctx.fillStyle = isFlashing ? '#ffffff' : this.accentColor;
      ctx.beginPath();
      ctx.moveTo(-4, -this.radius);
      ctx.lineTo(-8, -this.radius - 8);
      ctx.lineTo(4, -this.radius + 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-4, this.radius);
      ctx.lineTo(-8, this.radius + 8);
      ctx.lineTo(4, this.radius - 2);
      ctx.fill();

      // Dagger
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(this.radius * 0.5, 5, 12, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(this.radius * 0.3, 4, 3, 5);

      // Yellow Eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(this.radius * 0.4, -4, 4, 3);
      ctx.fillRect(this.radius * 0.4, 1, 4, 3);

    } else if (this.typeId === 'zombie') {
      // Decaying Zombie
      ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Shambling extended arms
      ctx.fillStyle = isFlashing ? '#ffffff' : this.accentColor;
      ctx.fillRect(this.radius * 0.3, -8, 14, 5);
      ctx.fillRect(this.radius * 0.3, 3, 14, 5);

      // Hollow dead eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.radius * 0.4, -4, 4, 3);
      ctx.fillRect(this.radius * 0.4, 1, 4, 3);

    } else if (this.typeId === 'orc') {
      // Hulking Orc Berserker
      ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Spiked shoulder pads
      ctx.fillStyle = isFlashing ? '#ffffff' : '#78350f';
      ctx.fillRect(-this.radius * 0.5, -this.radius - 3, 14, 7);
      ctx.fillRect(-this.radius * 0.5, this.radius - 4, 14, 7);

      // War Club
      ctx.fillStyle = '#451a03';
      ctx.fillRect(this.radius * 0.4, 6, 18, 7);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(this.radius * 0.4 + 14, 4, 5, 11);

      // Red Fierce Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.radius * 0.4, -5, 5, 4);
      ctx.fillRect(this.radius * 0.4, 1, 5, 4);

    } else if (this.typeId === 'archer') {
      // Hooded Skeleton Archer
      ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Hood cloak trim
      ctx.strokeStyle = isFlashing ? '#ffffff' : '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Wooden Bow
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.radius * 0.6, 0, 15, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.6 + 6, -11);
      ctx.lineTo(this.radius * 0.6 + 6, 11);
      ctx.stroke();

      // Glowing spectral eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(this.radius * 0.3, -3, 3, 3);
      ctx.fillRect(this.radius * 0.3, 1, 3, 3);

    } else if (this.typeId === 'demon') {
      // Abyssal Demon
      ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Curved Demonic Horns
      ctx.fillStyle = isFlashing ? '#ffffff' : '#18181b';
      ctx.beginPath();
      ctx.moveTo(-2, -this.radius);
      ctx.quadraticCurveTo(8, -this.radius - 12, 16, -this.radius - 8);
      ctx.quadraticCurveTo(4, -this.radius - 2, 4, -this.radius);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-2, this.radius);
      ctx.quadraticCurveTo(8, this.radius + 12, 16, this.radius + 8);
      ctx.quadraticCurveTo(4, this.radius + 2, 4, this.radius);
      ctx.fill();

      // Flaming core
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Overhead Health Bar if damaged
    if (this.hp < this.maxHp) {
      const barWidth = this.radius * 2.2;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius - 10;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

      const healthPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = healthPct > 0.5 ? '#22c55e' : healthPct > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
    }
  }
}
