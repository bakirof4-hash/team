import * as THREE from 'three';
import { ModelFactory3D } from './ModelFactory3D.js';
import { AnimationController3D } from './AnimationController3D.js';
import { CANVAS_CONFIG } from '../constants.js';

/**
 * Renderer3D:
 * State-of-the-art WebGL Three.js renderer for the survival arena.
 * Maps 2D simulation coordinates to 3D world space, manages dynamic lighting,
 * soft shadows, procedural environments, skeletal animation rigs,
 * 3D projectiles/drops, and performance quality tiers.
 */
export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.arenaWidth = CANVAS_CONFIG.ARENA_WIDTH;
    this.arenaHeight = CANVAS_CONFIG.ARENA_HEIGHT;

    // Coordinate Scale Factor: 2600 x 2000 -> 130 x 100 units
    this.worldScale = 0.05;
    this.halfArenaW = this.arenaWidth / 2;
    this.halfArenaH = this.arenaHeight / 2;

    // Quality level: 'high' | 'medium' | 'low'
    this.quality = 'high';

    // 1. Initialize Three.js WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0065);

    // 3. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      400
    );
    // Isometric-style angled perspective: elevation 42 units, offset Z 32 units
    this.cameraDistance = 38;
    this.cameraHeight = 35;
    this.cameraPitch = 0.88; // radians tilt down (~50 deg)
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // 4. Ground Plane for Mouse Raycasting (Y = 0)
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.raycaster = new THREE.Raycaster();
    this.planeIntersection = new THREE.Vector3();

    // 5. Factories & Controllers
    this.modelFactory = new ModelFactory3D();
    this.animController = new AnimationController3D();

    // 6. Dynamic Lights
    this.initLights();

    // 7. Environment
    const { envGroup, torchLights } = this.modelFactory.createArenaEnvironment(130, 100);
    this.scene.add(envGroup);
    this.torchLights = torchLights;

    // 8. Entity Mesh Registries
    this.playerMesh = null;
    this.bossMesh = null;
    this.enemyMeshes = new Map(); // enemy.id -> THREE.Group
    this.projectileMeshes = new Map(); // proj -> THREE.Group
    this.dropMeshes = new Map(); // drop -> THREE.Group

    // 9. Special FX 3D Meshes
    this.initVisualFX();

    // 10. 3D Particle Points System
    this.init3DParticles();

    // 11. 2D Screen Overlay for floating damage numbers & reticle
    this.initOverlayCanvas();

    this.lastTime = performance.now();
  }

  // ---------------------------------------------------------------------------
  // LIGHTING SETUP
  // ---------------------------------------------------------------------------
  initLights() {
    // Ambient Light (deep indigo shadow fill)
    this.ambientLight = new THREE.AmbientLight(0x2e3856, 0.75);
    this.scene.add(this.ambientLight);

    // Hemisphere Light (sky blue & dark ground)
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.45);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Main Directional Sun/Moon Light with soft shadows
    this.dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.85);
    this.dirLight.position.set(35, 60, 45);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.bias = -0.0004;

    const d = 45;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Dynamic Player Light (glow following hero)
    this.playerLight = new THREE.PointLight(0x38bdf8, 1.2, 14, 1.2);
    this.playerLight.position.set(0, 2.5, 0);
    this.scene.add(this.playerLight);
  }

  // ---------------------------------------------------------------------------
  // VISUAL FX MESHES
  // ---------------------------------------------------------------------------
  initVisualFX() {
    // 1. Boss Slam Warning Ring
    const slamGeo = new THREE.RingGeometry(0.5, 7.5, 32);
    const slamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.slamDecal = new THREE.Mesh(slamGeo, slamMat);
    this.slamDecal.rotation.x = -Math.PI / 2;
    this.slamDecal.position.y = 0.05;
    this.scene.add(this.slamDecal);

    // 2. Nova Slash Special AoE Wave Ring
    const novaGeo = new THREE.RingGeometry(1.0, 7.0, 32);
    const novaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.novaWave = new THREE.Mesh(novaGeo, novaMat);
    this.novaWave.rotation.x = -Math.PI / 2;
    this.novaWave.position.y = 0.06;
    this.scene.add(this.novaWave);
    this.novaTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // 3D GPU PARTICLE SYSTEM (Embers, sparks, blood)
  // ---------------------------------------------------------------------------
  init3DParticles() {
    this.maxParticles = 500;
    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 3);
    this.particleSizes = new Float32Array(this.maxParticles);

    this.particleData = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particleData.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 1, b: 1,
        life: 0, maxLife: 1,
        size: 0,
      });
      this.particlePositions[i * 3 + 1] = -100; // hide below ground
    }

    const particleGeo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.particlePositions, 3);
    this.colorAttr = new THREE.BufferAttribute(this.particleColors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.particleSizes, 1);

    particleGeo.setAttribute('position', this.posAttr);
    particleGeo.setAttribute('color', this.colorAttr);
    particleGeo.setAttribute('size', this.sizeAttr);

    const particleMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.modelFactory.textures.get('particle'),
    });

    this.particlePoints = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particlePoints);
  }

  spawn3DParticle(x, y, z, vx, vy, vz, colorHex = '#f59e0b', size = 1.0, life = 0.6) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particleData[i];
      if (!p.active) {
        p.active = true;
        p.x = x; p.y = y; p.z = z;
        p.vx = vx; p.vy = vy; p.vz = vz;
        p.life = life;
        p.maxLife = life;
        p.size = size;

        const c = new THREE.Color(colorHex);
        p.r = c.r; p.g = c.g; p.b = c.b;
        break;
      }
    }
  }

  update3DParticles(dt) {
    let activeCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particleData[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          this.particlePositions[i * 3 + 1] = -100;
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 9.8 * 0.4 * dt; // gravity

        if (p.y < 0.1) {
          p.y = 0.1;
          p.vy = -p.vy * 0.3; // ground bounce
          p.vx *= 0.8;
          p.vz *= 0.8;
        }

        const alpha = p.life / p.maxLife;
        this.particlePositions[i * 3] = p.x;
        this.particlePositions[i * 3 + 1] = p.y;
        this.particlePositions[i * 3 + 2] = p.z;

        this.particleColors[i * 3] = p.r * alpha;
        this.particleColors[i * 3 + 1] = p.g * alpha;
        this.particleColors[i * 3 + 2] = p.b * alpha;

        this.particleSizes[i] = p.size * (0.3 + alpha * 0.7);
        activeCount++;
      }
    }

    if (activeCount > 0) {
      this.posAttr.needsUpdate = true;
      this.colorAttr.needsUpdate = true;
      this.sizeAttr.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------------------
  // 2D OVERLAY CANVAS (Crisp Floating Damage Numbers & Reticle)
  // ---------------------------------------------------------------------------
  initOverlayCanvas() {
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.width = '100%';
    this.overlayCanvas.style.height = '100%';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '5';
    this.canvas.parentElement?.appendChild(this.overlayCanvas);
    this.overlayCtx = this.overlayCanvas.getContext('2d');
  }

  // ---------------------------------------------------------------------------
  // COORDINATE TRANSFORMS
  // ---------------------------------------------------------------------------
  to3DX(x) {
    return (x - this.halfArenaW) * this.worldScale;
  }

  to3DZ(y) {
    return (y - this.halfArenaH) * this.worldScale;
  }

  to2DX(x3D) {
    return x3D / this.worldScale + this.halfArenaW;
  }

  to2DY(z3D) {
    return z3D / this.worldScale + this.halfArenaH;
  }

  /**
   * Raycast from mouse screen coordinates to 3D ground plane (Y = 0)
   * Returns exact 2D simulation coordinates { worldX, worldY }
   */
  screenToGround2D(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.planeIntersection);

    if (hit) {
      return {
        worldX: this.to2DX(this.planeIntersection.x),
        worldY: this.to2DY(this.planeIntersection.z),
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // QUALITY PRESETS (LOW / MEDIUM / HIGH)
  // ---------------------------------------------------------------------------
  setQuality(preset = 'high') {
    this.quality = preset;
    if (preset === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      this.playerLight.visible = false;
      this.torchLights.forEach((t) => (t.light.visible = false));
      this.renderer.setPixelRatio(1.0);
    } else if (preset === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.playerLight.visible = true;
      this.torchLights.forEach((t) => (t.light.visible = true));
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      // High
      this.renderer.shadowMap.enabled = true;
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.playerLight.visible = true;
      this.torchLights.forEach((t) => (t.light.visible = true));
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }
  }

  // ---------------------------------------------------------------------------
  // RESIZE
  // ---------------------------------------------------------------------------
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.overlayCanvas) {
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }
  }

  // ---------------------------------------------------------------------------
  // CAMERA UPDATE
  // ---------------------------------------------------------------------------
  updateCamera(player, shakeOffset = { x: 0, y: 0 }) {
    const px3D = this.to3DX(player.x);
    const pz3D = this.to3DZ(player.y);

    // Smooth camera tracking
    const targetX = px3D + shakeOffset.x * 0.05;
    const targetZ = pz3D + shakeOffset.y * 0.05;

    this.cameraTarget.x += (targetX - this.cameraTarget.x) * 0.12;
    this.cameraTarget.z += (targetZ - this.cameraTarget.z) * 0.12;
    this.cameraTarget.y = 1.2;

    this.camera.position.x = this.cameraTarget.x;
    this.camera.position.y = this.cameraHeight;
    this.camera.position.z = this.cameraTarget.z + this.cameraDistance;

    this.camera.lookAt(this.cameraTarget);

    // Directional shadow frustum tracks with player
    this.dirLight.position.set(
      this.cameraTarget.x + 35,
      60,
      this.cameraTarget.z + 45
    );
    this.dirLight.target.position.copy(this.cameraTarget);

    // Player glow light follows player
    this.playerLight.position.set(px3D, 2.2, pz3D);
  }

  // ---------------------------------------------------------------------------
  // MAIN 3D RENDER LOOP
  // ---------------------------------------------------------------------------
  render({
    player,
    enemySpawner,
    projectileManager,
    dropsManager,
    _particleSystem,
    damageNumbers,
    inputManager,
  }) {
    const now = performance.now();
    const dt = Math.min(0.08, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.animController.update(dt);

    // 1. Torch Braziers Light Flicker
    this.torchLights.forEach((t) => {
      t.light.intensity = t.baseIntensity + Math.sin(now * 0.015 + t.seed) * 0.35;
    });

    // 2. Render Player
    this.updatePlayer3D(player, dt);

    // 3. Render Enemies & Boss
    this.updateEnemies3D(enemySpawner, dt);

    // 4. Render Projectiles
    this.updateProjectiles3D(projectileManager);

    // 5. Render Collectible Drops
    this.updateDrops3D(dropsManager, dt);

    // 6. Update 3D Visual Effects
    this.updateVisualFX(player, enemySpawner, dt);

    // 7. Update 3D GPU Particles
    this.update3DParticles(dt);

    // 8. Render Three.js 3D Scene
    this.renderer.render(this.scene, this.camera);

    // 9. Render Screen-space Overlay (Floating Damage Numbers & Reticle)
    this.renderOverlay(damageNumbers, inputManager);
  }

  // ---------------------------------------------------------------------------
  // PLAYER 3D UPDATE
  // ---------------------------------------------------------------------------
  updatePlayer3D(player, dt) {
    if (!this.playerMesh) {
      this.playerMesh = this.modelFactory.createPlayerModel(
        player.character?.id || 'knight',
        player.character?.color || '#3b82f6'
      );
      this.scene.add(this.playerMesh);
    }

    const px3D = this.to3DX(player.x);
    const pz3D = this.to3DZ(player.y);

    this.playerMesh.position.set(px3D, 0, pz3D);

    // Rotate player towards facing angle
    // In Three.js: -facingAngle + PI/2 aligns with standard forward (+Z)
    this.playerMesh.rotation.y = -player.facingAngle + Math.PI / 2;

    // Dash particles
    if (player.isDashing && Math.random() < 0.6) {
      this.spawn3DParticle(
        px3D,
        0.8,
        pz3D,
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4,
        player.character?.color || '#38bdf8',
        1.5,
        0.35
      );
    }

    // Joint animations
    this.animController.animatePlayer(this.playerMesh.userData.rig, player, dt);
  }

  // ---------------------------------------------------------------------------
  // ENEMIES & BOSS 3D UPDATE
  // ---------------------------------------------------------------------------
  updateEnemies3D(enemySpawner, dt) {
    const enemies = enemySpawner.enemies;
    const activeEnemyIds = new Set();

    // Regular enemies
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      activeEnemyIds.add(enemy.id);

      let mesh = this.enemyMeshes.get(enemy.id);
      if (!mesh) {
        mesh = this.modelFactory.createEnemyModel(enemy.typeId, enemy.wave);
        this.enemyMeshes.set(enemy.id, mesh);
        this.scene.add(mesh);
      }

      const ex3D = this.to3DX(enemy.x);
      const ez3D = this.to3DZ(enemy.y);

      mesh.position.set(ex3D, 0, ez3D);
      mesh.rotation.y = -enemy.facingAngle + Math.PI / 2;

      // Orc charge dust
      if (enemy.typeId === 'orc' && enemy.chargeState === 'charging' && Math.random() < 0.5) {
        this.spawn3DParticle(
          ex3D,
          0.3,
          ez3D,
          (Math.random() - 0.5) * 3,
          Math.random() * 2 + 1,
          (Math.random() - 0.5) * 3,
          '#94a3b8',
          1.2,
          0.4
        );
      }

      // Hit flash visual
      if (enemy.hitFlashTimer > 0 && Math.random() < 0.4) {
        this.spawn3DParticle(
          ex3D,
          1.5,
          ez3D,
          (Math.random() - 0.5) * 6,
          Math.random() * 6,
          (Math.random() - 0.5) * 6,
          '#facc15',
          1.4,
          0.3
        );
      }

      this.animController.animateEnemy(mesh.userData.rig, enemy, dt);
    }

    // Cleanup dead/removed enemy meshes
    for (const [id, mesh] of this.enemyMeshes.entries()) {
      if (!activeEnemyIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(id);
      }
    }

    // Boss (Malakor)
    const boss = enemySpawner.boss;
    if (boss && !boss.isDead) {
      if (!this.bossMesh) {
        this.bossMesh = this.modelFactory.createBossModel();
        this.scene.add(this.bossMesh);
      }

      const bx3D = this.to3DX(boss.x);
      const bz3D = this.to3DZ(boss.y);

      this.bossMesh.position.set(bx3D, 0, bz3D);
      this.bossMesh.rotation.y = -boss.facingAngle + Math.PI / 2;

      // Phase 2 Roaring Embers
      if (boss.phase === 2 && Math.random() < 0.7) {
        this.spawn3DParticle(
          bx3D + (Math.random() - 0.5) * 3,
          Math.random() * 4,
          bz3D + (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          Math.random() * 4 + 2,
          (Math.random() - 0.5) * 3,
          '#ff3300',
          1.8,
          0.5
        );
      }

      this.animController.animateBoss(this.bossMesh.userData.rig, boss, dt);
    } else if (this.bossMesh && (!boss || boss.isDead)) {
      this.scene.remove(this.bossMesh);
      this.bossMesh = null;
    }
  }

  // ---------------------------------------------------------------------------
  // PROJECTILES 3D UPDATE
  // ---------------------------------------------------------------------------
  updateProjectiles3D(projectileManager) {
    const projectiles = projectileManager.projectiles;
    const activeProjs = new Set();

    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];
      if (proj.isDestroyed) continue;
      activeProjs.add(proj);

      let mesh = this.projectileMeshes.get(proj);
      if (!mesh) {
        mesh = this.modelFactory.createProjectileMesh(proj.type, proj.color);
        this.projectileMeshes.set(proj, mesh);
        this.scene.add(mesh);
      }

      const px3D = this.to3DX(proj.x);
      const pz3D = this.to3DZ(proj.y);

      mesh.position.set(px3D, 1.2, pz3D);

      // Orientation along flight direction
      const angle = Math.atan2(proj.vx, proj.vy);
      mesh.rotation.y = angle;

      if (proj.type === 'shuriken') {
        mesh.rotation.y += performance.now() * 0.02;
      }
    }

    // Cleanup destroyed projectile meshes
    for (const [proj, mesh] of this.projectileMeshes.entries()) {
      if (!activeProjs.has(proj)) {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(proj);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DROPS 3D UPDATE
  // ---------------------------------------------------------------------------
  updateDrops3D(dropsManager, dt) {
    const drops = dropsManager.drops;
    const activeDrops = new Set();

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      if (drop.isCollected) continue;
      activeDrops.add(drop);

      let mesh = this.dropMeshes.get(drop);
      if (!mesh) {
        mesh = this.modelFactory.createDropMesh(drop.type);
        this.dropMeshes.set(drop, mesh);
        this.scene.add(mesh);
      }

      const dx3D = this.to3DX(drop.x);
      const dz3D = this.to3DZ(drop.y);

      mesh.position.set(dx3D, 0, dz3D);
      mesh.rotation.y += dt * 3.2; // spin
    }

    // Cleanup collected drop meshes
    for (const [drop, mesh] of this.dropMeshes.entries()) {
      if (!activeDrops.has(drop)) {
        this.scene.remove(mesh);
        this.dropMeshes.delete(drop);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SPECIAL FX 3D UPDATE
  // ---------------------------------------------------------------------------
  updateVisualFX(player, enemySpawner, _dt) {
    // 1. Boss Slam Warning Ring
    const boss = enemySpawner.boss;
    if (boss && boss.isSlamming && boss.slamTelegraphTimer > 0) {
      const sx3D = this.to3DX(boss.slamPos.x);
      const sz3D = this.to3DZ(boss.slamPos.y);
      this.slamDecal.position.set(sx3D, 0.05, sz3D);
      this.slamDecal.material.opacity = Math.min(0.8, (1.0 - boss.slamTelegraphTimer / 0.8) * 0.8);
      this.slamDecal.visible = true;
    } else {
      this.slamDecal.visible = false;
    }

    // 2. Nova Slash Wave Expansion
    if (player.specialTimer > player.specialCooldown - 0.45) {
      const px3D = this.to3DX(player.x);
      const pz3D = this.to3DZ(player.y);
      this.novaWave.position.set(px3D, 0.06, pz3D);
      const scale = (player.specialCooldown - player.specialTimer) * 2.8;
      this.novaWave.scale.set(scale, scale, 1);
      this.novaWave.material.opacity = Math.max(0, 0.85 - scale * 0.25);
      this.novaWave.visible = true;
    } else {
      this.novaWave.visible = false;
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN-SPACE OVERLAY RENDER (Floating Combat Numbers & Aim Crosshair)
  // ---------------------------------------------------------------------------
  renderOverlay(damageNumbers, inputManager) {
    if (!this.overlayCtx) return;
    const ctx = this.overlayCtx;
    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Floating Damage Numbers (Projected from 3D coordinates to Screen)
    const projVector = new THREE.Vector3();
    const numbers = damageNumbers.numbers;

    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      const x3D = this.to3DX(num.x);
      const z3D = this.to3DZ(num.y);
      const y3D = 2.0 + (num.maxLife - num.life) * 1.5; // float upward

      projVector.set(x3D, y3D, z3D);
      projVector.project(this.camera);

      // Check if inside frustum
      if (projVector.z < 1) {
        const sx = (projVector.x * 0.5 + 0.5) * w;
        const sy = (-projVector.y * 0.5 + 0.5) * h;

        ctx.save();
        ctx.font = `bold ${Math.round(num.baseSize * num.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.max(0, Math.min(1, num.alpha));

        ctx.strokeStyle = num.strokeColor || '#000000';
        ctx.lineWidth = num.isCrit ? 4 : 3;
        ctx.strokeText(num.text, sx, sy);

        ctx.fillStyle = num.color || '#ffffff';
        ctx.fillText(num.text, sx, sy);
        ctx.restore();
      }
    }

    // 2. High-Tech 3D Aim Reticle
    const mx = inputManager.mouse.x;
    const my = inputManager.mouse.y;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;

    // Center dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fill();

    // Outer crosshair circle
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.stroke();

    // 4 crosshair ticks
    const tickLen = 7;
    const dist = 19;
    ctx.beginPath();
    ctx.moveTo(mx - dist - tickLen, my); ctx.lineTo(mx - dist, my);
    ctx.moveTo(mx + dist, my); ctx.lineTo(mx + dist + tickLen, my);
    ctx.moveTo(mx, my - dist - tickLen); ctx.lineTo(mx, my - dist);
    ctx.moveTo(mx, my + dist); ctx.lineTo(mx, my + dist + tickLen);
    ctx.stroke();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // CLEANUP / DESTROY
  // ---------------------------------------------------------------------------
  destroy() {
    if (this.overlayCanvas && this.overlayCanvas.parentElement) {
      this.overlayCanvas.parentElement.removeChild(this.overlayCanvas);
    }
    this.renderer.dispose();
  }
}
