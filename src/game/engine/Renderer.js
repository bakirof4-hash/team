import { CANVAS_CONFIG } from '../constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    };
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.width = width;
    this.camera.height = height;
  }

  updateCamera(player, shakeOffset = { x: 0, y: 0 }) {
    // Center camera on player with arena bounds clamping
    const targetCamX = player.x - this.camera.width / 2;
    const targetCamY = player.y - this.camera.height / 2;

    const maxCamX = Math.max(0, CANVAS_CONFIG.ARENA_WIDTH - this.camera.width);
    const maxCamY = Math.max(0, CANVAS_CONFIG.ARENA_HEIGHT - this.camera.height);

    // Smooth lerp camera
    this.camera.x += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.camera.x) * 0.15 + shakeOffset.x;
    this.camera.y += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.camera.y) * 0.15 + shakeOffset.y;
  }

  render({
    player,
    enemySpawner,
    projectileManager,
    dropsManager,
    particleSystem,
    damageNumbers,
    inputManager,
  }) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Clear Screen
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply Camera Translation
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 2. Render Arena Floor & Grid
    this.renderArenaFloor(ctx);

    // 3. Render Drops
    dropsManager.render(ctx);

    // 4. Render Enemies & Boss
    enemySpawner.render(ctx);

    // 5. Render Player
    player.render(ctx);

    // 6. Render Projectiles
    projectileManager.render(ctx);

    // 7. Render Particles
    particleSystem.render(ctx);

    // 8. Render Damage Numbers
    damageNumbers.render(ctx);

    ctx.restore();

    // 9. Render Screen-space UI Overlays (Cursor aim, screen vignette)
    this.renderVignette(ctx, width, height);
    this.renderAimReticle(ctx, inputManager.mouse.x, inputManager.mouse.y);
  }

  renderArenaFloor(ctx) {
    const arenaW = CANVAS_CONFIG.ARENA_WIDTH;
    const arenaH = CANVAS_CONFIG.ARENA_HEIGHT;

    // Dark stone dungeon floor base
    ctx.fillStyle = '#0d131f';
    ctx.fillRect(0, 0, arenaW, arenaH);

    // Grid tiles
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    const tileSize = 80;

    const startX = Math.max(0, Math.floor(this.camera.x / tileSize) * tileSize);
    const endX = Math.min(arenaW, Math.ceil((this.camera.x + this.camera.width) / tileSize) * tileSize);
    const startY = Math.max(0, Math.floor(this.camera.y / tileSize) * tileSize);
    const endY = Math.min(arenaH, Math.ceil((this.camera.y + this.camera.height) / tileSize) * tileSize);

    ctx.beginPath();
    for (let x = startX; x <= endX; x += tileSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += tileSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Arena Central Rune Circle
    const centerX = arenaW / 2;
    const centerY = arenaH / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 300, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.beginPath();
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4;
      ctx.moveTo(centerX + Math.cos(ang) * 180, centerY + Math.sin(ang) * 180);
      ctx.lineTo(centerX + Math.cos(ang) * 300, centerY + Math.sin(ang) * 300);
    }
    ctx.stroke();
    ctx.restore();

    // Glowing Arena Border Runes
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 16;
    ctx.strokeRect(10, 10, arenaW - 20, arenaH - 20);
    ctx.restore();
  }

  renderVignette(ctx, width, height) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.35,
      width / 2,
      height / 2,
      width * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  renderAimReticle(ctx, mouseX, mouseY) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;

    // Crosshair circle
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer ticks
    ctx.beginPath();
    ctx.moveTo(mouseX - 14, mouseY);
    ctx.lineTo(mouseX - 9, mouseY);
    ctx.moveTo(mouseX + 9, mouseY);
    ctx.lineTo(mouseX + 14, mouseY);
    ctx.moveTo(mouseX, mouseY - 14);
    ctx.lineTo(mouseX, mouseY - 9);
    ctx.moveTo(mouseX, mouseY + 9);
    ctx.lineTo(mouseX, mouseY + 14);
    ctx.stroke();

    ctx.restore();
  }
}
