import { ENEMY_TYPES, CANVAS_CONFIG, DIFFICULTY_SCALING } from '../constants.js';
import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';

export class EnemySpawner {
  constructor() {
    this.enemies = [];
    this.boss = null;
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.totalKills = 0;
    this.waveKills = 0;
    this.isBossWave = false;
    this.waveAnnounceCallback = null;
    this.bossDefeatedCallback = null;
  }

  setCallbacks({ onWaveAnnounce, onBossDefeated }) {
    this.waveAnnounceCallback = onWaveAnnounce;
    this.bossDefeatedCallback = onBossDefeated;
  }

  getUnlockedEnemyTypes() {
    return Object.values(ENEMY_TYPES).filter((type) => this.wave >= type.unlockWave);
  }

  getRandomUnlockedType() {
    const unlocked = this.getUnlockedEnemyTypes();
    const totalWeight = unlocked.reduce((sum, t) => sum + t.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const type of unlocked) {
      if (rand < type.weight) {
        return type.id;
      }
      rand -= type.weight;
    }
    return unlocked[0].id;
  }

  startWave(waveNumber) {
    this.wave = waveNumber;
    this.waveTimer = 0;
    this.waveKills = 0;
    this.isBossWave = this.wave % 5 === 0;

    if (this.waveAnnounceCallback) {
      this.waveAnnounceCallback({
        wave: this.wave,
        isBossWave: this.isBossWave,
        unlockedTypes: this.getUnlockedEnemyTypes().map((t) => t.name),
      });
    }

    if (this.isBossWave) {
      this.spawnBoss();
    }
  }

  spawnBoss() {
    this.boss = new Boss({
      wave: this.wave,
      x: CANVAS_CONFIG.ARENA_WIDTH / 2,
      y: CANVAS_CONFIG.ARENA_HEIGHT / 2 - 350,
    });
  }

  spawnMinionAt(typeId, x, y) {
    const enemy = new Enemy({
      typeId,
      x,
      y,
      wave: this.wave,
    });
    this.enemies.push(enemy);
    return enemy;
  }

  getSpawnPositionAround(player, minDistance = 550, maxDistance = 750) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDistance + Math.random() * (maxDistance - minDistance);

    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;

    // Clamp inside arena boundaries
    x = Math.max(60, Math.min(CANVAS_CONFIG.ARENA_WIDTH - 60, x));
    y = Math.max(60, Math.min(CANVAS_CONFIG.ARENA_HEIGHT - 60, y));

    return { x, y };
  }

  spawnEnemy(player) {
    const maxEnemies = Math.min(
      DIFFICULTY_SCALING.maxEnemiesHardCap,
      DIFFICULTY_SCALING.maxEnemiesBase + this.wave * DIFFICULTY_SCALING.maxEnemiesPerWave
    );

    if (this.enemies.length >= maxEnemies) return;

    const typeId = this.getRandomUnlockedType();
    const { x, y } = this.getSpawnPositionAround(player);

    const enemy = new Enemy({
      typeId,
      x,
      y,
      wave: this.wave,
    });

    this.enemies.push(enemy);
  }

  update(dt, player, projectileManager, particleSystem, damageNumbers, dropsManager, screenShakeCallback) {
    this.waveTimer += dt;
    this.spawnTimer += dt;

    // Check wave progression
    if (!this.isBossWave && this.waveTimer >= DIFFICULTY_SCALING.waveDuration) {
      this.startWave(this.wave + 1);
    }

    // Dynamic spawn interval calculation: gets faster with higher waves
    const currentSpawnInterval = Math.max(
      DIFFICULTY_SCALING.spawnIntervalMin,
      DIFFICULTY_SCALING.spawnIntervalInitial - (this.wave - 1) * 0.12
    );

    // Continuous spawning
    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;
      // Spawn 1 to 2 enemies per tick depending on wave
      const spawnCount = this.wave >= 4 ? 2 : 1;
      for (let i = 0; i < spawnCount; i++) {
        this.spawnEnemy(player);
      }
    }

    // Update Boss if active
    if (this.boss && !this.boss.isDead) {
      this.boss.update(dt, player, projectileManager, particleSystem, this, screenShakeCallback);
    } else if (this.boss && this.boss.isDead) {
      // Boss defeated!
      dropsManager.spawnFromEnemy(this.boss);
      this.totalKills += 1;
      this.waveKills += 1;

      if (this.bossDefeatedCallback) {
        this.bossDefeatedCallback({
          wave: this.wave,
          bossName: this.boss.name,
        });
      }
      this.boss = null;
      this.isBossWave = false;
      this.startWave(this.wave + 1);
    }

    // Update regular enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, player, projectileManager, particleSystem);

      // Handle enemy death
      if (enemy.isDead) {
        dropsManager.spawnFromEnemy(enemy);
        this.totalKills += 1;
        this.waveKills += 1;
        player.kills += 1;
        this.enemies.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Render enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }

    // Render boss
    if (this.boss && !this.boss.isDead) {
      this.boss.render(ctx);
    }
  }

  clear() {
    this.enemies = [];
    this.boss = null;
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.totalKills = 0;
    this.waveKills = 0;
    this.isBossWave = false;
  }
}
