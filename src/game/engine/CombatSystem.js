export class CombatSystem {
  constructor() {
    this.screenShake = 0;
    this.screenShakeDuration = 0;
  }

  triggerScreenShake(intensity = 8, duration = 0.25) {
    this.screenShake = intensity;
    this.screenShakeDuration = duration;
  }

  updateScreenShake(dt) {
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= dt;
      if (this.screenShakeDuration <= 0) {
        this.screenShake = 0;
      }
    }
  }

  getShakeOffset() {
    if (this.screenShake <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShake * 2,
      y: (Math.random() - 0.5) * this.screenShake * 2,
    };
  }

  update({
    dt,
    player,
    enemySpawner,
    projectileManager,
    particleSystem,
    damageNumbers,
  }) {
    this.updateScreenShake(dt);

    const enemies = enemySpawner.enemies;
    const boss = enemySpawner.boss;
    const projectiles = projectileManager.projectiles;

    // 1. Player Projectiles vs Enemies & Boss
    for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = projectiles[pIdx];
      if (proj.owner !== 'player' || proj.isDestroyed) continue;

      // Check vs regular enemies
      for (const enemy of enemies) {
        if (enemy.isDead || proj.hitEntities.has(enemy.id)) continue;

        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = enemy.radius + proj.radius;

        if (distSq <= hitDist * hitDist) {
          proj.hitEntities.add(enemy.id);

          enemy.takeDamage(
            proj.damage,
            damageNumbers,
            particleSystem,
            proj.isCrit,
            { x: proj.x - proj.vx * 0.1, y: proj.y - proj.vy * 0.1 }
          );

          if (proj.isCrit) {
            this.triggerScreenShake(4, 0.15);
          }

          if (proj.pierce > 0) {
            proj.pierce -= 1;
          } else {
            proj.isDestroyed = true;
            break;
          }
        }
      }

      // Check vs Boss if alive
      if (!proj.isDestroyed && boss && !boss.isDead && !proj.hitEntities.has(boss.id)) {
        const bdx = boss.x - proj.x;
        const bdy = boss.y - proj.y;
        const bDistSq = bdx * bdx + bdy * bdy;
        const bHitDist = boss.radius + proj.radius;

        if (bDistSq <= bHitDist * bHitDist) {
          proj.hitEntities.add(boss.id);

          boss.takeDamage(
            proj.damage,
            damageNumbers,
            particleSystem,
            proj.isCrit,
            { x: proj.x, y: proj.y }
          );

          if (proj.isCrit) {
            this.triggerScreenShake(7, 0.2);
          }

          if (proj.pierce > 0) {
            proj.pierce -= 1;
          } else {
            proj.isDestroyed = true;
          }
        }
      }
    }

    // 2. Enemy Projectiles vs Player
    for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = projectiles[pIdx];
      if (proj.owner !== 'enemy' || proj.isDestroyed) continue;

      if (player.isDead) continue;

      const dx = player.x - proj.x;
      const dy = player.y - proj.y;
      const distSq = dx * dx + dy * dy;
      const hitDist = player.radius + proj.radius;

      if (distSq <= hitDist * hitDist) {
        proj.isDestroyed = true;
        const damageDealt = player.takeDamage(proj.damage, damageNumbers, particleSystem);
        if (damageDealt > 0) {
          this.triggerScreenShake(6, 0.2);
        }
      }
    }

    // 3. Enemy Contact vs Player (Melee collision)
    if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
      // Regular enemies contact
      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const contactDist = player.radius + enemy.radius;

        if (distSq <= contactDist * contactDist) {
          // Check enemy attack cooldown
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer = enemy.attackCooldown;
            const damageDealt = player.takeDamage(enemy.damage, damageNumbers, particleSystem);
            if (damageDealt > 0) {
              this.triggerScreenShake(8, 0.22);
            }
            break; // take damage from one enemy at a time per frame
          }
        }
      }

      // Boss contact
      if (boss && !boss.isDead) {
        const bdx = player.x - boss.x;
        const bdy = player.y - boss.y;
        const bDistSq = bdx * bdx + bdy * bdy;
        const bContactDist = player.radius + boss.radius;

        if (bDistSq <= bContactDist * bContactDist) {
          const damageDealt = player.takeDamage(boss.damage, damageNumbers, particleSystem);
          if (damageDealt > 0) {
            this.triggerScreenShake(12, 0.3);
          }
        }
      }
    }
  }
}
