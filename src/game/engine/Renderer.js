import { CANVAS_CONFIG } from '../constants.js';

export class Renderer {
  constructor(canvas, zoneConfig = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.zoneConfig = zoneConfig || {
      id: 'city',
      name: 'Qorong‘u Zombi Shahri',
      bg: '#090d16',
      gridColor: 'rgba(51, 65, 85, 0.4)',
      accentColor: '#38bdf8',
    };

    this.camera = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    };

    this.zoneProps = this.generateZoneProps(this.zoneConfig.id || 'city');
    this.weatherParticles = this.initWeatherParticles(this.zoneConfig.id || 'city');
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.width = width;
    this.camera.height = height;
  }

  generateZoneProps(zoneId) {
    const props = [];
    const seed = (zoneId + 'zone_seed_2026').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (i) => {
      const x = Math.sin(seed * 9999 + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const count = 45;
    for (let i = 0; i < count; i++) {
      const px = 120 + pseudoRandom(i * 3 + 1) * (CANVAS_CONFIG.ARENA_WIDTH - 240);
      const py = 120 + pseudoRandom(i * 3 + 2) * (CANVAS_CONFIG.ARENA_HEIGHT - 240);
      const size = 18 + pseudoRandom(i * 3 + 3) * 32;

      if (zoneId === 'arctic') {
        const type = i % 3 === 0 ? 'pine_tree' : i % 3 === 1 ? 'snow_mound' : 'ice_crystal';
        props.push({ x: px, y: py, size, type, seed: pseudoRandom(i * 7) });
      } else if (zoneId === 'volcano') {
        const type = i % 3 === 0 ? 'lava_pit' : i % 3 === 1 ? 'basalt_rock' : 'lava_crack';
        props.push({ x: px, y: py, size, type, seed: pseudoRandom(i * 7) });
      } else if (zoneId === 'toxic') {
        const type = i % 3 === 0 ? 'slime_pool' : i % 3 === 1 ? 'toxic_barrel' : 'metal_grate';
        props.push({ x: px, y: py, size, type, seed: pseudoRandom(i * 7) });
      } else if (zoneId === 'cyber') {
        const type = i % 2 === 0 ? 'neon_cube' : 'circuit_node';
        props.push({ x: px, y: py, size, type, seed: pseudoRandom(i * 7) });
      } else {
        const type = i % 3 === 0 ? 'street_lamp' : i % 3 === 1 ? 'rubble' : 'road_marking';
        props.push({ x: px, y: py, size, type, seed: pseudoRandom(i * 7) });
      }
    }

    // Zone specific cracks / rivers
    const cracks = [];
    for (let c = 0; c < 7; c++) {
      cracks.push({
        x1: pseudoRandom(c * 5 + 10) * CANVAS_CONFIG.ARENA_WIDTH,
        y1: pseudoRandom(c * 5 + 11) * CANVAS_CONFIG.ARENA_HEIGHT,
        x2: pseudoRandom(c * 5 + 12) * CANVAS_CONFIG.ARENA_WIDTH,
        y2: pseudoRandom(c * 5 + 13) * CANVAS_CONFIG.ARENA_HEIGHT,
      });
    }

    return { props, cracks };
  }

  initWeatherParticles(zoneId) {
    const particles = [];
    const count = zoneId === 'arctic' ? 220 : zoneId === 'volcano' ? 120 : zoneId === 'toxic' ? 90 : zoneId === 'cyber' ? 140 : 70;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (this.canvas.width || 1200),
        y: Math.random() * (this.canvas.height || 800),
        size: zoneId === 'arctic' ? 1.2 + Math.random() * 4.2 : 2 + Math.random() * 4,
        speedY: zoneId === 'arctic' ? 50 + Math.random() * 110 : zoneId === 'volcano' ? -(40 + Math.random() * 80) : zoneId === 'toxic' ? -(15 + Math.random() * 35) : Math.random() * 30 - 15,
        speedX: zoneId === 'arctic' ? 20 + Math.random() * 40 : Math.random() * 30 - 15,
        opacity: 0.3 + Math.random() * 0.65,
        seed: Math.random() * Math.PI * 2,
        color: zoneId === 'arctic' ? '#ffffff' : zoneId === 'volcano' ? '#f97316' : zoneId === 'toxic' ? '#4ade80' : zoneId === 'cyber' ? '#c084fc' : '#94a3b8',
      });
    }

    return particles;
  }

  updateCamera(player, shakeOffset = { x: 0, y: 0 }) {
    const targetCamX = player.x - this.camera.width / 2;
    const targetCamY = player.y - this.camera.height / 2;

    const maxCamX = Math.max(0, CANVAS_CONFIG.ARENA_WIDTH - this.camera.width);
    const maxCamY = Math.max(0, CANVAS_CONFIG.ARENA_HEIGHT - this.camera.height);

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
    time = 0,
  }) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dt = 0.016;

    // 1. Clear Screen
    ctx.fillStyle = this.zoneConfig.bg || '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply Camera Translation
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 2. Render Arena Floor, Grid & Zone Terrain Props
    this.renderArenaFloor(ctx, time);
    this.renderZoneProps(ctx, time);

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

    // 9. Render Screen-space Weather (Falling Snow, Lava Embers, Mist)
    this.renderWeather(ctx, width, height, dt, time);

    // 10. Render Screen-space UI Overlays
    this.renderVignette(ctx, width, height);
    this.renderAimReticle(ctx, inputManager.mouse.x, inputManager.mouse.y);
  }

  renderArenaFloor(ctx, time) {
    const arenaW = CANVAS_CONFIG.ARENA_WIDTH;
    const arenaH = CANVAS_CONFIG.ARENA_HEIGHT;
    const zoneId = this.zoneConfig.id || 'city';

    // Base Floor Color
    ctx.fillStyle = this.zoneConfig.bg || '#0d131f';
    ctx.fillRect(0, 0, arenaW, arenaH);

    // Zone-specific Grid Tiles
    const tileSize = 80;
    const startX = Math.max(0, Math.floor(this.camera.x / tileSize) * tileSize);
    const endX = Math.min(arenaW, Math.ceil((this.camera.x + this.camera.width) / tileSize) * tileSize);
    const startY = Math.max(0, Math.floor(this.camera.y / tileSize) * tileSize);
    const endY = Math.min(arenaH, Math.ceil((this.camera.y + this.camera.height) / tileSize) * tileSize);

    ctx.save();
    ctx.strokeStyle = this.zoneConfig.gridColor || 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = zoneId === 'cyber' ? 1.8 : 1.2;

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
    ctx.restore();

    // Render Cracks / Veins in Arena Floor
    if (this.zoneProps.cracks) {
      ctx.save();
      if (zoneId === 'arctic') {
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
      } else if (zoneId === 'volcano') {
        const lavaGlow = Math.sin(time * 3) * 0.2 + 0.5;
        ctx.strokeStyle = `rgba(239, 68, 68, ${lavaGlow})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
      } else if (zoneId === 'toxic') {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.lineWidth = 2.5;
      } else if (zoneId === 'cyber') {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 2;
      }

      ctx.beginPath();
      for (const crack of this.zoneProps.cracks) {
        ctx.moveTo(crack.x1, crack.y1);
        ctx.lineTo(crack.x2, crack.y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Arena Central Rune Circle
    const centerX = arenaW / 2;
    const centerY = arenaH / 2;

    ctx.save();
    ctx.strokeStyle = this.zoneConfig.accentColor ? `${this.zoneConfig.accentColor}44` : 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = this.zoneConfig.accentColor ? `${this.zoneConfig.accentColor}22` : 'rgba(168, 85, 247, 0.1)';
    ctx.beginPath();
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4 + time * 0.05;
      ctx.moveTo(centerX + Math.cos(ang) * 190, centerY + Math.sin(ang) * 190);
      ctx.lineTo(centerX + Math.cos(ang) * 320, centerY + Math.sin(ang) * 320);
    }
    ctx.stroke();
    ctx.restore();

    // Glowing Arena Outer Boundary Box
    ctx.save();
    ctx.strokeStyle = this.zoneConfig.accentColor || '#ef4444';
    ctx.lineWidth = 6;
    ctx.shadowColor = this.zoneConfig.accentColor || '#ef4444';
    ctx.shadowBlur = 18;
    ctx.strokeRect(10, 10, arenaW - 20, arenaH - 20);
    ctx.restore();
  }

  renderZoneProps(ctx, time) {
    const zoneId = this.zoneConfig.id || 'city';
    const props = this.zoneProps.props;

    for (const prop of props) {
      // Frustum culling check
      if (
        prop.x + prop.size < this.camera.x ||
        prop.x - prop.size > this.camera.x + this.camera.width ||
        prop.y + prop.size < this.camera.y ||
        prop.y - prop.size > this.camera.y + this.camera.height
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(prop.x, prop.y);

      if (zoneId === 'arctic') {
        if (prop.type === 'pine_tree') {
          // Snowy Pine Tree (Qorli Archa)
          const h = prop.size * 1.8;
          const w = prop.size * 1.1;

          // Tree Trunk
          ctx.fillStyle = '#3e2723';
          ctx.fillRect(-w * 0.15, h * 0.2, w * 0.3, h * 0.25);

          // 3 Foliage Tiers with Thick White Snow Caps
          for (let tier = 0; tier < 3; tier++) {
            const ty = -h * 0.25 + tier * (h * 0.22);
            const tw = w * (1 - tier * 0.22);

            // Pine needle triangle
            ctx.fillStyle = tier === 0 ? '#14532d' : tier === 1 ? '#166534' : '#15803d';
            ctx.beginPath();
            ctx.moveTo(0, ty - h * 0.35);
            ctx.lineTo(-tw, ty + h * 0.1);
            ctx.lineTo(tw, ty + h * 0.1);
            ctx.closePath();
            ctx.fill();

            // White Fluffy Snow Layer on Top of Branch Tier
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#e0f2fe';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.ellipse(0, ty + h * 0.05, tw * 0.85, h * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Top Snow Tip
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -h * 0.58, w * 0.2, 0, Math.PI * 2);
          ctx.fill();

        } else if (prop.type === 'snow_mound') {
          // Smooth Snow Mound / Drift
          const rad = prop.size * 1.2;
          const grad = ctx.createRadialGradient(0, 0, rad * 0.1, 0, 0, rad);
          grad.addColorStop(0, 'rgba(240, 249, 255, 0.85)');
          grad.addColorStop(0.6, 'rgba(186, 230, 253, 0.5)');
          grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, rad * 1.4, rad * 0.8, prop.seed, 0, Math.PI * 2);
          ctx.fill();

        } else if (prop.type === 'ice_crystal') {
          // Sharp Translucent Blue Ice Crystal
          ctx.fillStyle = 'rgba(125, 211, 252, 0.75)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -prop.size);
          ctx.lineTo(prop.size * 0.5, -prop.size * 0.2);
          ctx.lineTo(prop.size * 0.4, prop.size * 0.6);
          ctx.lineTo(-prop.size * 0.4, prop.size * 0.6);
          ctx.lineTo(-prop.size * 0.5, -prop.size * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

      } else if (zoneId === 'volcano') {
        if (prop.type === 'lava_pit') {
          // Pulsing Lava Pool
          const pulse = Math.sin(time * 2.5 + prop.seed * 5) * 0.2 + 0.8;
          const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, prop.size);
          grad.addColorStop(0, `rgba(254, 240, 138, ${pulse})`);
          grad.addColorStop(0.5, `rgba(249, 115, 22, ${pulse * 0.9})`);
          grad.addColorStop(1, 'rgba(153, 27, 27, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, prop.size, 0, Math.PI * 2);
          ctx.fill();

        } else if (prop.type === 'basalt_rock') {
          // Dark Volcanic Rock
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, prop.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

      } else if (zoneId === 'toxic') {
        if (prop.type === 'slime_pool') {
          // Bubbling Green Toxic Acid Pool
          const bubble = Math.sin(time * 3 + prop.seed * 10) * 0.15 + 0.7;
          ctx.fillStyle = `rgba(74, 222, 128, ${bubble * 0.6})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, prop.size * 1.3, prop.size * 0.8, prop.seed, 0, Math.PI * 2);
          ctx.fill();

          // Acid bubble
          ctx.fillStyle = '#a3e635';
          ctx.beginPath();
          ctx.arc(Math.sin(time * 2) * 5, Math.cos(time * 2) * 5, prop.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (prop.type === 'toxic_barrel') {
          ctx.fillStyle = '#ca8a04';
          ctx.beginPath();
          ctx.arc(0, 0, prop.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(0, 0, prop.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (zoneId === 'cyber') {
        // Neon Wireframe Cube / Node
        ctx.strokeStyle = prop.type === 'neon_cube' ? '#c084fc' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.strokeRect(-prop.size * 0.5, -prop.size * 0.5, prop.size, prop.size);

      } else {
        // City Street Lamp / Rubble
        if (prop.type === 'street_lamp') {
          // Light Cone on Floor
          const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, prop.size * 2);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, prop.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Lamp Base
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-prop.size * 0.4, -prop.size * 0.3, prop.size * 0.8, prop.size * 0.6);
        }
      }

      ctx.restore();
    }
  }

  renderWeather(ctx, width, height, dt, time) {
    const zoneId = this.zoneConfig.id || 'city';

    ctx.save();
    for (const p of this.weatherParticles) {
      // Update particle position
      p.y += p.speedY * dt;
      p.x += (p.speedX + Math.sin(time * 1.8 + p.seed) * 18) * dt;

      // Wrap around viewport
      if (p.y > height + 20) p.y = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.x < -20) p.x = width + 20;

      ctx.globalAlpha = p.opacity;

      if (zoneId === 'arctic') {
        // REAL FALLING SNOWFLAKES (Qor yog'ishi)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#e0f2fe';
        ctx.shadowBlur = p.size > 3 ? 6 : 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Larger flakes have delicate 6-point snowflake sparkles
        if (p.size > 3.4) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 1.4, p.y);
          ctx.lineTo(p.x + p.size * 1.4, p.y);
          ctx.moveTo(p.x, p.y - p.size * 1.4);
          ctx.lineTo(p.x, p.y + p.size * 1.4);
          ctx.stroke();
        }

      } else if (zoneId === 'volcano') {
        // Hot Rising Lava Embers
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

      } else if (zoneId === 'toxic') {
        // Floating Green Spore Mist
        ctx.fillStyle = 'rgba(74, 222, 128, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (zoneId === 'cyber') {
        // Floating Cyber Star Pixels
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x, p.y, p.size, p.size);

      } else {
        // Urban Smog Dust
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderVignette(ctx, width, height) {
    const zoneId = this.zoneConfig.id || 'city';
    ctx.save();

    const edgeColor =
      zoneId === 'arctic'
        ? 'rgba(6, 40, 68, 0.65)'
        : zoneId === 'volcano'
        ? 'rgba(69, 10, 10, 0.75)'
        : zoneId === 'toxic'
        ? 'rgba(20, 83, 45, 0.65)'
        : zoneId === 'cyber'
        ? 'rgba(58, 12, 92, 0.7)'
        : 'rgba(15, 23, 42, 0.7)';

    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.32,
      width / 2,
      height / 2,
      width * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, edgeColor);

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

