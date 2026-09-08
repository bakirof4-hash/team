export class DropItem {
  constructor({
    x,
    y,
    type, // 'gold' | 'xp' | 'health'
    value,
    vx = (Math.random() - 0.5) * 80,
    vy = (Math.random() - 0.5) * 80,
  }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    this.vx = vx;
    this.vy = vy;
    this.radius = type === 'health' ? 12 : type === 'gold' ? 8 : 7;
    this.life = 45; // 45 seconds lifetime
    this.isCollected = false;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.attracted = false;
  }

  update(dt, player) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isCollected = true;
      return;
    }

    this.bobTimer += dt * 4;

    // Natural drag for initial drop scatter
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);

    // Player magnet calculation
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;
    const magnetRadius = player.magnetRadius;

    if (distSq < magnetRadius * magnetRadius || this.attracted) {
      this.attracted = true;
      const dist = Math.sqrt(distSq);
      const accel = Math.min(800, 300 + (magnetRadius - dist) * 4.5);

      if (dist > 1) {
        this.vx += (dx / dist) * accel * dt;
        this.vy += (dy / dist) * accel * dt;
      }

      // Check collection distance
      if (dist < player.radius + this.radius) {
        this.isCollected = true;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    ctx.save();
    const bobOffset = Math.sin(this.bobTimer) * 3;
    const drawY = this.y + bobOffset;

    if (this.type === 'gold') {
      // Golden coin
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner coin rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center symbol '$'
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('G', this.x, drawY);
    } else if (this.type === 'xp') {
      // Cyan diamond crystal
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 9;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(this.x, drawY - this.radius);
      ctx.lineTo(this.x + this.radius, drawY);
      ctx.lineTo(this.x, drawY + this.radius);
      ctx.lineTo(this.x - this.radius, drawY);
      ctx.closePath();
      ctx.fill();

      // Bright inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, drawY, this.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'health') {
      // Ruby red heart / health vial
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';

      ctx.beginPath();
      ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // White cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x - 2, drawY - 6, 4, 12);
      ctx.fillRect(this.x - 6, drawY - 2, 12, 4);
    }

    ctx.restore();
  }
}

export class DropsManager {
  constructor() {
    this.drops = [];
  }

  spawnDrop({ x, y, type, value }) {
    this.drops.push(new DropItem({ x, y, type, value }));
  }

  spawnFromEnemy(enemy) {
    // XP gem
    if (enemy.xpReward > 0) {
      this.spawnDrop({
        x: enemy.x,
        y: enemy.y,
        type: 'xp',
        value: enemy.xpReward,
      });
    }

    // Gold chance
    if (Math.random() < enemy.goldChance) {
      const goldAmt = Math.floor(
        enemy.goldMin + Math.random() * (enemy.goldMax - enemy.goldMin + 1)
      );
      this.spawnDrop({
        x: enemy.x + (Math.random() - 0.5) * 15,
        y: enemy.y + (Math.random() - 0.5) * 15,
        type: 'gold',
        value: goldAmt,
      });
    }

    // Health vial chance (12% from normal enemies, 100% from bosses)
    const healChance = enemy.isBoss ? 1.0 : 0.12;
    if (Math.random() < healChance) {
      this.spawnDrop({
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y + (Math.random() - 0.5) * 20,
        type: 'health',
        value: enemy.isBoss ? 50 : 25,
      });
    }
  }

  update(dt, player, damageNumbers, particleSystem) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.update(dt, player);

      if (drop.isCollected) {
        // Collect reward
        if (drop.type === 'gold') {
          player.addGold(drop.value);
          damageNumbers.addGold(player.x, player.y - 15, drop.value);
          particleSystem.emit({
            x: player.x,
            y: player.y,
            count: 5,
            speedMin: 30,
            speedMax: 80,
            colors: ['#f59e0b', '#fef08a', '#ffffff'],
            shape: 'spark',
          });
        } else if (drop.type === 'xp') {
          player.addXp(drop.value, damageNumbers, particleSystem);
          damageNumbers.addXp(player.x, player.y - 25, drop.value);
          particleSystem.emit({
            x: player.x,
            y: player.y,
            count: 4,
            speedMin: 20,
            speedMax: 70,
            colors: ['#38bdf8', '#7dd3fc', '#ffffff'],
            shape: 'circle',
          });
        } else if (drop.type === 'health') {
          const healed = player.heal(drop.value);
          damageNumbers.addHeal(player.x, player.y - 20, healed);
          particleSystem.emit({
            x: player.x,
            y: player.y,
            count: 8,
            speedMin: 30,
            speedMax: 90,
            colors: ['#4ade80', '#86efac', '#ffffff'],
            shape: 'spark',
          });
        }

        this.drops.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const drop of this.drops) {
      drop.render(ctx);
    }
  }

  clear() {
    this.drops = [];
  }
}
