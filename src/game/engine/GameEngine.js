import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { EnemySpawner } from './EnemySpawner.js';
import { ProjectileManager } from './Projectiles.js';
import { DropsManager } from './DropsSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { DamageNumbers } from './DamageNumbers.js';
import { Renderer3D } from './Renderer3D.js';

export class GameEngine {
  constructor(canvas, characterConfig = null, difficultyConfig = null, zoneConfig = null) {
    this.canvas = canvas;
    this.zoneConfig = zoneConfig;
    this.renderer = new Renderer3D(canvas, zoneConfig);
    this.input = new InputManager();
    this.characterConfig = characterConfig;
    this.difficultyConfig = difficultyConfig;

    // Game Core Systems
    this.player = new Player(undefined, undefined, characterConfig);
    this.enemySpawner = new EnemySpawner();
    if (difficultyConfig) {
      this.enemySpawner.setDifficulty(difficultyConfig);
    }
    this.projectiles = new ProjectileManager();
    this.drops = new DropsManager();
    this.combat = new CombatSystem();
    this.particles = new ParticleSystem();
    this.damageNumbers = new DamageNumbers();

    // Loop & State
    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastTime = 0;
    this.uiUpdateTimer = 0;
    this.timeElapsed = 0;

    // Callbacks
    this.onStateUpdate = null;
    this.onGameOver = null;
    this.onWaveBanner = null;

    // Attach input listeners with 3D raycast support
    this.input.attach(this.canvas, this.renderer);

    // Setup Spawner Callbacks
    this.enemySpawner.setCallbacks({
      onWaveAnnounce: (waveData) => {
        if (this.onWaveBanner) {
          this.onWaveBanner(waveData);
        }
      },
      onBossDefeated: (bossData) => {
        if (this.onWaveBanner) {
          this.onWaveBanner({
            wave: bossData.wave,
            isBossWave: false,
            bannerText: `VICTORY! ${bossData.bossName} has been slain!`,
          });
        }
      },
    });

    this.loop = this.loop.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.enemySpawner.startWave(1);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  restart() {
    this.stop();
    this.timeElapsed = 0;

    // Reset all game systems
    this.player = new Player(undefined, undefined, this.characterConfig);
    this.enemySpawner.clear();
    if (this.difficultyConfig) {
      this.enemySpawner.setDifficulty(this.difficultyConfig);
    }
    this.projectiles.clear();
    this.drops.clear();
    this.particles.clear();
    this.damageNumbers.clear();

    this.start();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.stop();
    this.input.detach();
    if (this.renderer && typeof this.renderer.destroy === 'function') {
      this.renderer.destroy();
    }
  }

  setQuality(preset) {
    if (this.renderer && typeof this.renderer.setQuality === 'function') {
      this.renderer.setQuality(preset);
    }
  }

  resize(width, height) {
    this.renderer.resize(width, height);
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    // Delta time calculation clamped to avoid huge jumps
    const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.timeElapsed = (this.timeElapsed || 0) + dt;

    // 1. Update Input with 3D ground plane raycasting
    this.input.updateWorldMouse(this.renderer);

    // 2. Update Player
    this.player.update(dt, this.input, this.projectiles, this.particles);

    // 3. Update Spawner & Enemies
    this.enemySpawner.update(
      dt,
      this.player,
      this.projectiles,
      this.particles,
      this.damageNumbers,
      this.drops,
      (intensity, duration) => this.combat.triggerScreenShake(intensity, duration)
    );

    // 4. Update Projectiles
    this.projectiles.update(dt, this.particles);

    // 5. Update Drops (magnets & collection)
    this.drops.update(dt, this.player, this.damageNumbers, this.particles);

    // 6. Update Combat (Collisions, damage, screen shake)
    this.combat.update({
      dt,
      player: this.player,
      enemySpawner: this.enemySpawner,
      projectileManager: this.projectiles,
      particleSystem: this.particles,
      damageNumbers: this.damageNumbers,
    });

    // 7. Update Particles & Floating Numbers
    this.particles.update(dt);
    this.damageNumbers.update(dt);

    // 8. Update Camera
    const shakeOffset = this.combat.getShakeOffset();
    this.renderer.updateCamera(this.player, shakeOffset);

    // 9. Check Game Over
    if (this.player.isDead && this.onGameOver) {
      this.onGameOver({
        kills: this.player.kills,
        gold: this.player.gold,
        wave: this.enemySpawner.wave,
        level: this.player.level,
        timeElapsed: Math.floor(this.timeElapsed),
      });
    }

    // 10. Throttle UI state dispatch to React (e.g. ~30 times per second)
    this.uiUpdateTimer += dt;
    if (this.uiUpdateTimer >= 0.033) {
      this.uiUpdateTimer = 0;
      if (this.onStateUpdate) {
        this.dispatchUIState();
      }
    }
  }

  render() {
    this.renderer.render({
      player: this.player,
      enemySpawner: this.enemySpawner,
      projectileManager: this.projectiles,
      dropsManager: this.drops,
      particleSystem: this.particles,
      damageNumbers: this.damageNumbers,
      inputManager: this.input,
      time: this.timeElapsed,
    });
  }

  dispatchUIState() {
    const boss = this.enemySpawner.boss;
    const enemyDots = this.enemySpawner.enemies.slice(0, 35).map((e) => ({
      x: Math.round(e.x),
      y: Math.round(e.y),
      color: e.color || '#ef4444',
      isBoss: false,
    }));

    if (boss && !boss.isDead) {
      enemyDots.push({
        x: Math.round(boss.x),
        y: Math.round(boss.y),
        color: '#dc2626',
        isBoss: true,
      });
    }

    this.onStateUpdate({
      hp: Math.max(0, Math.round(this.player.hp)),
      maxHp: this.player.maxHp,
      xp: Math.round(this.player.xp),
      maxXp: this.player.maxXp,
      level: this.player.level,
      gold: this.player.gold,
      kills: this.player.kills,
      wave: this.enemySpawner.wave,
      timeElapsed: Math.floor(this.timeElapsed),
      dashCooldown: Math.max(0, this.player.dashTimer),
      specialCooldown: Math.max(0, this.player.specialTimer),
      enemiesAlive: this.enemySpawner.enemies.length,
      playerPos: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      enemyDots,
      boss: boss && !boss.isDead ? {
        name: boss.name,
        hp: Math.max(0, Math.round(boss.hp)),
        maxHp: boss.maxHp,
        phase: boss.phase,
      } : null,
    });
  }
}
