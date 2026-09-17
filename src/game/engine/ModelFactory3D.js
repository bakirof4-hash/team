import * as THREE from 'three';

/**
 * ModelFactory3D:
 * Procedural generation of stylized, optimized low-to-mid poly 3D assets,
 * procedural canvas textures, and articulated character rigs.
 * Completely offline with zero external network or CDN dependencies.
 */
export class ModelFactory3D {
  constructor() {
    this.materials = new Map();
    this.textures = new Map();
    this.geometries = new Map();

    this.initTextures();
    this.initCommonMaterials();
  }

  // ---------------------------------------------------------------------------
  // PROCEDURAL TEXTURE GENERATION
  // ---------------------------------------------------------------------------
  initTextures() {
    // 1. Cobblestone Dungeon Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');

    fctx.fillStyle = '#0f172a';
    fctx.fillRect(0, 0, 512, 512);

    const cols = 8;
    const rows = 8;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;
        const shade = Math.floor(18 + Math.random() * 22);
        fctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
        fctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Stone edge bevel highlight
        fctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        fctx.lineWidth = 1;
        fctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);

        // Subtle crack / stone noise
        if (Math.random() < 0.4) {
          fctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          fctx.beginPath();
          fctx.moveTo(x + 10, y + 15);
          fctx.lineTo(x + cellW - 12, y + cellH - 10);
          fctx.stroke();
        }
      }
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 12);
    this.textures.set('floor', floorTexture);

    // 2. Ancient Mystic Rune Circle Texture
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 1024;
    runeCanvas.height = 1024;
    const rctx = runeCanvas.getContext('2d');

    rctx.clearRect(0, 0, 1024, 1024);
    const cx = 512;
    const cy = 512;

    // Outer ring glow
    rctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    rctx.lineWidth = 6;
    rctx.beginPath();
    rctx.arc(cx, cy, 470, 0, Math.PI * 2);
    rctx.stroke();

    rctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
    rctx.lineWidth = 4;
    rctx.beginPath();
    rctx.arc(cx, cy, 440, 0, Math.PI * 2);
    rctx.arc(cx, cy, 330, 0, Math.PI * 2);
    rctx.arc(cx, cy, 210, 0, Math.PI * 2);
    rctx.stroke();

    // Star polygons
    for (let k = 0; k < 2; k++) {
      const sides = 8;
      const r = k === 0 ? 440 : 330;
      rctx.beginPath();
      for (let i = 0; i < sides * 2; i++) {
        const radius = i % 2 === 0 ? r : r * 0.65;
        const ang = (i * Math.PI) / sides + (k * Math.PI) / 8;
        const px = cx + Math.cos(ang) * radius;
        const py = cy + Math.sin(ang) * radius;
        if (i === 0) rctx.moveTo(px, py);
        else rctx.lineTo(px, py);
      }
      rctx.closePath();
      rctx.strokeStyle = k === 0 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(244, 63, 94, 0.45)';
      rctx.lineWidth = 3;
      rctx.stroke();
    }

    // Rune glyph marks around ring
    rctx.fillStyle = '#38bdf8';
    rctx.font = 'bold 26px monospace';
    rctx.textAlign = 'center';
    rctx.textBaseline = 'middle';
    const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ'];
    for (let i = 0; i < 16; i++) {
      const ang = (i * Math.PI * 2) / 16;
      const rx = cx + Math.cos(ang) * 385;
      const ry = cy + Math.sin(ang) * 385;
      rctx.save();
      rctx.translate(rx, ry);
      rctx.rotate(ang + Math.PI / 2);
      rctx.fillText(runes[i % runes.length], 0, 0);
      rctx.restore();
    }

    const runeTexture = new THREE.CanvasTexture(runeCanvas);
    this.textures.set('runes', runeTexture);

    // 3. Particle Sprite Texture (soft glowing circle)
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const pctx = particleCanvas.getContext('2d');
    const grad = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 64, 64);

    const particleTexture = new THREE.CanvasTexture(particleCanvas);
    this.textures.set('particle', particleTexture);

    // 4. Wood Plank Texture (for crates & barrels)
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 128;
    woodCanvas.height = 128;
    const wctx = woodCanvas.getContext('2d');
    wctx.fillStyle = '#451a03';
    wctx.fillRect(0, 0, 128, 128);
    wctx.fillStyle = '#78350f';
    for (let i = 0; i < 4; i++) {
      wctx.fillRect(2, i * 32 + 2, 124, 28);
    }
    wctx.strokeStyle = '#1e0c03';
    wctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      wctx.beginPath();
      wctx.moveTo(0, i * 32);
      wctx.lineTo(128, i * 32);
      wctx.stroke();
    }
    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    this.textures.set('wood', woodTexture);
  }

  // ---------------------------------------------------------------------------
  // COMMON MATERIALS
  // ---------------------------------------------------------------------------
  initCommonMaterials() {
    // Floor
    this.materials.set('floor', new THREE.MeshStandardMaterial({
      map: this.textures.get('floor'),
      roughness: 0.82,
      metalness: 0.15,
    }));

    // Rune circle overlay
    this.materials.set('runeCircle', new THREE.MeshBasicMaterial({
      map: this.textures.get('runes'),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));

    // Stone walls
    this.materials.set('stoneWall', new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
    }));

    this.materials.set('stoneTrim', new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      metalness: 0.2,
    }));

    // Wood & Iron
    this.materials.set('wood', new THREE.MeshStandardMaterial({
      map: this.textures.get('wood'),
      roughness: 0.7,
      metalness: 0.05,
    }));

    this.materials.set('iron', new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.45,
      metalness: 0.85,
    }));

    this.materials.set('gold', new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0xb45309,
      emissiveIntensity: 0.35,
    }));

    // Crystal / Gem
    this.materials.set('crystalCyan', new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.92,
    }));

    this.materials.set('crystalPurple', new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      roughness: 0.15,
      metalness: 0.1,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.92,
    }));

    // Torch Fire
    this.materials.set('torchFire', new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    }));

    // Ground blob shadow
    this.materials.set('shadow', new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }));
  }

  // ---------------------------------------------------------------------------
  // SHARED GEOMETRIES (Cached for max FPS)
  // ---------------------------------------------------------------------------
  getGeometry(key, factory) {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, factory());
    }
    return this.geometries.get(key);
  }

  // Helper: create blob shadow mesh under characters
  createShadowMesh(radius = 1.0) {
    const geo = this.getGeometry(`shadow_${radius.toFixed(1)}`, () =>
      new THREE.CircleGeometry(radius, 16)
    );
    const mesh = new THREE.Mesh(geo, this.materials.get('shadow'));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.04;
    return mesh;
  }

  // ---------------------------------------------------------------------------
  // 1. PLAYER 3D MODELS
  // ---------------------------------------------------------------------------
  createPlayerModel(characterId = 'knight', characterColor = '#3b82f6') {
    const root = new THREE.Group();
    root.name = 'playerRoot';

    // Rigs container
    const rig = {
      root,
      torso: new THREE.Group(),
      head: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftLeg: new THREE.Group(),
      rightLeg: new THREE.Group(),
      weapon: new THREE.Group(),
      shield: new THREE.Group(),
      extra: new THREE.Group(),
    };

    root.add(this.createShadowMesh(1.1));

    // Custom armor/hero color material
    const heroMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(characterColor),
      roughness: 0.35,
      metalness: 0.6,
    });
    const darkPlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.7,
    });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.85,
    });
    const glowVisorMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
    });

    // 1. TORSO
    const chestGeo = this.getGeometry('player_chest', () =>
      new THREE.BoxGeometry(1.2, 1.3, 0.75)
    );
    const chestMesh = new THREE.Mesh(chestGeo, heroMat);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chestMesh.position.y = 1.45;
    rig.torso.add(chestMesh);

    // Belt
    const beltGeo = this.getGeometry('player_belt', () =>
      new THREE.BoxGeometry(1.25, 0.25, 0.8)
    );
    const beltMesh = new THREE.Mesh(beltGeo, darkPlateMat);
    beltMesh.position.y = 0.85;
    rig.torso.add(beltMesh);

    // 2. HEAD
    rig.head.position.set(0, 2.15, 0);
    const helmGeo = this.getGeometry('player_helm', () =>
      new THREE.BoxGeometry(0.85, 0.85, 0.85)
    );
    const helmMesh = new THREE.Mesh(helmGeo, darkPlateMat);
    helmMesh.castShadow = true;
    rig.head.add(helmMesh);

    // Glowing visor slit
    const visorGeo = this.getGeometry('player_visor', () =>
      new THREE.BoxGeometry(0.65, 0.16, 0.1)
    );
    const visorMesh = new THREE.Mesh(visorGeo, glowVisorMat);
    visorMesh.position.set(0, 0.05, 0.43);
    rig.head.add(visorMesh);

    // Plume / Crown
    const plumeGeo = this.getGeometry('player_plume', () =>
      new THREE.ConeGeometry(0.2, 0.6, 6)
    );
    const plumeMesh = new THREE.Mesh(plumeGeo, heroMat);
    plumeMesh.rotation.x = -Math.PI / 4;
    plumeMesh.position.set(0, 0.55, -0.15);
    rig.head.add(plumeMesh);

    rig.torso.add(rig.head);

    // 3. ARMS
    // Pauldrons (shoulders)
    const pauldronGeo = this.getGeometry('player_pauldron', () =>
      new THREE.SphereGeometry(0.35, 8, 8)
    );
    const leftPauldron = new THREE.Mesh(pauldronGeo, heroMat);
    leftPauldron.position.set(-0.75, 1.9, 0);
    rig.torso.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, heroMat);
    rightPauldron.position.set(0.75, 1.9, 0);
    rig.torso.add(rightPauldron);

    // Arm limbs
    const armGeo = this.getGeometry('player_arm', () =>
      new THREE.CylinderGeometry(0.18, 0.15, 0.9, 8)
    );
    // Left arm
    rig.leftArm.position.set(-0.75, 1.85, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, darkPlateMat);
    leftArmMesh.position.y = -0.45;
    leftArmMesh.castShadow = true;
    rig.leftArm.add(leftArmMesh);

    // Right arm (weapon arm)
    rig.rightArm.position.set(0.75, 1.85, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, darkPlateMat);
    rightArmMesh.position.y = -0.45;
    rightArmMesh.castShadow = true;
    rig.rightArm.add(rightArmMesh);

    // 4. LEGS
    const legGeo = this.getGeometry('player_leg', () =>
      new THREE.CylinderGeometry(0.22, 0.18, 0.85, 8)
    );
    rig.leftLeg.position.set(-0.35, 0.8, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, darkPlateMat);
    leftLegMesh.position.y = -0.42;
    leftLegMesh.castShadow = true;
    rig.leftLeg.add(leftLegMesh);

    rig.rightLeg.position.set(0.35, 0.8, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, darkPlateMat);
    rightLegMesh.position.y = -0.42;
    rightLegMesh.castShadow = true;
    rig.rightLeg.add(rightLegMesh);

    // Boots
    const bootGeo = this.getGeometry('player_boot', () =>
      new THREE.BoxGeometry(0.32, 0.28, 0.5)
    );
    const leftBoot = new THREE.Mesh(bootGeo, heroMat);
    leftBoot.position.set(0, -0.8, 0.1);
    rig.leftLeg.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, heroMat);
    rightBoot.position.set(0, -0.8, 0.1);
    rig.rightLeg.add(rightBoot);

    // 5. CLASS SPECIFIC WEAPON & ACCESSORIES
    if (characterId === 'knight') {
      // Broadsword on Right Arm
      const bladeGeo = this.getGeometry('knight_blade', () =>
        new THREE.BoxGeometry(0.22, 1.7, 0.06)
      );
      const bladeMesh = new THREE.Mesh(bladeGeo, silverMat);
      bladeMesh.position.set(0, 0.85, 0);
      bladeMesh.castShadow = true;

      const crossguardGeo = this.getGeometry('knight_guard', () =>
        new THREE.BoxGeometry(0.7, 0.12, 0.16)
      );
      const crossguard = new THREE.Mesh(crossguardGeo, heroMat);

      const hiltGeo = this.getGeometry('knight_hilt', () =>
        new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8)
      );
      const hilt = new THREE.Mesh(hiltGeo, darkPlateMat);
      hilt.position.set(0, -0.25, 0);

      rig.weapon.add(bladeMesh);
      rig.weapon.add(crossguard);
      rig.weapon.add(hilt);
      rig.weapon.position.set(0, -0.8, 0.4);
      rig.weapon.rotation.x = Math.PI / 4;
      rig.rightArm.add(rig.weapon);

      // Shield on Left Arm
      const shieldGeo = this.getGeometry('knight_shield', () =>
        new THREE.BoxGeometry(0.95, 1.3, 0.12)
      );
      const shieldMesh = new THREE.Mesh(shieldGeo, heroMat);
      shieldMesh.position.set(-0.25, -0.4, 0.25);
      shieldMesh.castShadow = true;
      rig.shield.add(shieldMesh);
      rig.leftArm.add(rig.shield);

    } else if (characterId === 'mage') {
      // Magic Arcane Staff
      const staffRodGeo = this.getGeometry('mage_rod', () =>
        new THREE.CylinderGeometry(0.07, 0.06, 2.2, 8)
      );
      const staffRod = new THREE.Mesh(staffRodGeo, this.materials.get('wood'));
      staffRod.position.set(0, 0.5, 0);

      const crystalGeo = this.getGeometry('mage_crystal', () =>
        new THREE.OctahedronGeometry(0.28, 0)
      );
      const crystalMesh = new THREE.Mesh(crystalGeo, this.materials.get('crystalPurple'));
      crystalMesh.position.set(0, 1.65, 0);
      rig.weapon.add(staffRod);
      rig.weapon.add(crystalMesh);
      rig.weapon.position.set(0, -0.7, 0.3);
      rig.weapon.rotation.x = Math.PI / 6;
      rig.rightArm.add(rig.weapon);

      // Wizard Robe skirt
      const robeGeo = this.getGeometry('mage_robe', () =>
        new THREE.CylinderGeometry(0.65, 0.95, 1.1, 8, 1, true)
      );
      const robeMesh = new THREE.Mesh(robeGeo, heroMat);
      robeMesh.position.y = 0.7;
      rig.torso.add(robeMesh);

    } else if (characterId === 'ninja') {
      // Cyber Tanto / Dual Shurikens
      const tantoGeo = this.getGeometry('ninja_tanto', () =>
        new THREE.BoxGeometry(0.12, 1.2, 0.04)
      );
      const tantoMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2,
      });
      const tanto1 = new THREE.Mesh(tantoGeo, tantoMat);
      tanto1.position.set(0, 0.5, 0);
      rig.weapon.add(tanto1);
      rig.weapon.position.set(0, -0.7, 0.3);
      rig.weapon.rotation.x = Math.PI / 3;
      rig.rightArm.add(rig.weapon);

      // Back Scabbards
      const scabbardGeo = this.getGeometry('ninja_scabbard', () =>
        new THREE.BoxGeometry(0.15, 1.4, 0.15)
      );
      const scabbard = new THREE.Mesh(scabbardGeo, darkPlateMat);
      scabbard.position.set(0, 1.5, -0.45);
      scabbard.rotation.z = Math.PI / 5;
      rig.torso.add(scabbard);

    } else if (characterId === 'gunner') {
      // Heavy Minigun
      const barrelBundle = new THREE.Group();
      barrelBundle.name = 'minigunBarrels';
      const barrelGeo = this.getGeometry('gunner_barrel', () =>
        new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8)
      );
      for (let b = 0; b < 3; b++) {
        const ang = (b * Math.PI * 2) / 3;
        const bm = new THREE.Mesh(barrelGeo, silverMat);
        bm.position.set(Math.cos(ang) * 0.12, 0.7, Math.sin(ang) * 0.12);
        barrelBundle.add(bm);
      }
      const gunBodyGeo = this.getGeometry('gunner_body', () =>
        new THREE.BoxGeometry(0.45, 0.6, 0.45)
      );
      const gunBody = new THREE.Mesh(gunBodyGeo, darkPlateMat);
      gunBody.position.set(0, 0, 0);

      rig.weapon.add(barrelBundle);
      rig.weapon.add(gunBody);
      rig.weapon.position.set(0, -0.7, 0.4);
      rig.weapon.rotation.x = Math.PI / 2;
      rig.rightArm.add(rig.weapon);

      // Backpack Ammo Drum
      const drumGeo = this.getGeometry('gunner_drum', () =>
        new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12)
      );
      const drumMesh = new THREE.Mesh(drumGeo, heroMat);
      drumMesh.rotation.x = Math.PI / 2;
      drumMesh.position.set(0, 1.5, -0.55);
      rig.torso.add(drumMesh);
    }

    // Assemble root
    root.add(rig.torso);
    root.add(rig.leftLeg);
    root.add(rig.rightLeg);
    rig.torso.add(rig.leftArm);
    rig.torso.add(rig.rightArm);

    root.userData.rig = rig;
    return root;
  }

  // ---------------------------------------------------------------------------
  // 2. ENEMY 3D MODELS
  // ---------------------------------------------------------------------------
  createEnemyModel(typeId = 'goblin', _wave = 1) {
    const root = new THREE.Group();
    root.name = `enemy_${typeId}`;

    const rig = {
      root,
      torso: new THREE.Group(),
      head: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftLeg: new THREE.Group(),
      rightLeg: new THREE.Group(),
      weapon: new THREE.Group(),
      extra: new THREE.Group(),
    };

    if (typeId === 'goblin') {
      // Small hunched goblin
      root.add(this.createShadowMesh(0.75));

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.65,
        metalness: 0.1,
      });
      const ragsMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.8,
      });

      // Torso
      const chestGeo = this.getGeometry('goblin_chest', () =>
        new THREE.BoxGeometry(0.7, 0.7, 0.5)
      );
      const chest = new THREE.Mesh(chestGeo, ragsMat);
      chest.position.y = 0.85;
      chest.castShadow = true;
      rig.torso.add(chest);

      // Head (pointed ears & crooked nose)
      rig.head.position.set(0, 1.35, 0.15);
      const headGeo = this.getGeometry('goblin_head', () =>
        new THREE.BoxGeometry(0.55, 0.5, 0.5)
      );
      const head = new THREE.Mesh(headGeo, skinMat);
      head.castShadow = true;
      rig.head.add(head);

      // Ears
      const earGeo = this.getGeometry('goblin_ear', () =>
        new THREE.ConeGeometry(0.14, 0.45, 4)
      );
      const leftEar = new THREE.Mesh(earGeo, skinMat);
      leftEar.rotation.z = Math.PI / 3;
      leftEar.position.set(-0.38, 0.1, 0);
      rig.head.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, skinMat);
      rightEar.rotation.z = -Math.PI / 3;
      rightEar.position.set(0.38, 0.1, 0);
      rig.head.add(rightEar);

      // Glowing yellow bead eyes
      const eyeGeo = this.getGeometry('goblin_eye', () =>
        new THREE.BoxGeometry(0.1, 0.08, 0.08)
      );
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const le = new THREE.Mesh(eyeGeo, eyeMat);
      le.position.set(-0.16, 0.08, 0.26);
      rig.head.add(le);
      const re = new THREE.Mesh(eyeGeo, eyeMat);
      re.position.set(0.16, 0.08, 0.26);
      rig.head.add(re);

      rig.torso.add(rig.head);

      // Arms
      const armGeo = this.getGeometry('goblin_arm', () =>
        new THREE.CylinderGeometry(0.1, 0.08, 0.6, 6)
      );
      rig.leftArm.position.set(-0.45, 1.05, 0);
      const la = new THREE.Mesh(armGeo, skinMat);
      la.position.y = -0.3;
      rig.leftArm.add(la);

      rig.rightArm.position.set(0.45, 1.05, 0);
      const ra = new THREE.Mesh(armGeo, skinMat);
      ra.position.y = -0.3;
      rig.rightArm.add(ra);

      // Dagger in right hand
      const daggerGeo = this.getGeometry('goblin_dagger', () =>
        new THREE.BoxGeometry(0.1, 0.65, 0.03)
      );
      const dagger = new THREE.Mesh(daggerGeo, this.materials.get('iron'));
      dagger.position.set(0, -0.45, 0.2);
      dagger.rotation.x = Math.PI / 4;
      rig.rightArm.add(dagger);

      // Legs
      const legGeo = this.getGeometry('goblin_leg', () =>
        new THREE.CylinderGeometry(0.12, 0.09, 0.5, 6)
      );
      rig.leftLeg.position.set(-0.2, 0.5, 0);
      const ll = new THREE.Mesh(legGeo, skinMat);
      ll.position.y = -0.25;
      rig.leftLeg.add(ll);

      rig.rightLeg.position.set(0.2, 0.5, 0);
      const rl = new THREE.Mesh(legGeo, skinMat);
      rl.position.y = -0.25;
      rig.rightLeg.add(rl);

    } else if (typeId === 'zombie') {
      // Undead Shambler
      root.add(this.createShadowMesh(1.0));

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // rotting cyan
        roughness: 0.8,
        metalness: 0.1,
      });
      const tatteredMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.9,
      });
      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.4,
      });

      // Torso with exposed ribcage
      const chestGeo = this.getGeometry('zombie_chest', () =>
        new THREE.BoxGeometry(1.0, 1.25, 0.65)
      );
      const chest = new THREE.Mesh(chestGeo, tatteredMat);
      chest.position.y = 1.35;
      chest.castShadow = true;
      rig.torso.add(chest);

      // Exposed ribs
      const ribGeo = this.getGeometry('zombie_rib', () =>
        new THREE.BoxGeometry(0.35, 0.1, 0.15)
      );
      for (let i = 0; i < 3; i++) {
        const rib = new THREE.Mesh(ribGeo, boneMat);
        rib.position.set(0.25, 1.25 + i * 0.18, 0.3);
        rig.torso.add(rib);
      }

      // Head
      rig.head.position.set(0, 2.1, 0);
      const headGeo = this.getGeometry('zombie_head', () =>
        new THREE.BoxGeometry(0.75, 0.75, 0.75)
      );
      const head = new THREE.Mesh(headGeo, skinMat);
      head.rotation.z = 0.15; // creepy head tilt
      head.castShadow = true;
      rig.head.add(head);

      // Creepy sunken eye sockets
      const eyeGeo = this.getGeometry('zombie_eye', () =>
        new THREE.BoxGeometry(0.18, 0.15, 0.1)
      );
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const le = new THREE.Mesh(eyeGeo, eyeMat);
      le.position.set(-0.2, 0.08, 0.38);
      rig.head.add(le);
      const re = new THREE.Mesh(eyeGeo, eyeMat);
      re.position.set(0.2, 0.08, 0.38);
      rig.head.add(re);

      rig.torso.add(rig.head);

      // Outstretched arms
      const armGeo = this.getGeometry('zombie_arm', () =>
        new THREE.CylinderGeometry(0.16, 0.13, 1.1, 8)
      );
      rig.leftArm.position.set(-0.65, 1.7, 0);
      const la = new THREE.Mesh(armGeo, skinMat);
      la.position.set(0, 0, 0.55);
      la.rotation.x = Math.PI / 2; // outstretched forward
      rig.leftArm.add(la);

      rig.rightArm.position.set(0.65, 1.7, 0);
      const ra = new THREE.Mesh(armGeo, skinMat);
      ra.position.set(0, 0, 0.55);
      ra.rotation.x = Math.PI / 2; // outstretched forward
      rig.rightArm.add(ra);

      // Legs
      const legGeo = this.getGeometry('zombie_leg', () =>
        new THREE.CylinderGeometry(0.2, 0.16, 0.8, 8)
      );
      rig.leftLeg.position.set(-0.3, 0.75, 0);
      const ll = new THREE.Mesh(legGeo, tatteredMat);
      ll.position.y = -0.4;
      rig.leftLeg.add(ll);

      rig.rightLeg.position.set(0.3, 0.75, 0);
      const rl = new THREE.Mesh(legGeo, tatteredMat);
      rl.position.y = -0.4;
      rig.rightLeg.add(rl);

    } else if (typeId === 'orc') {
      // Bulky Orc Berserker
      root.add(this.createShadowMesh(1.4));

      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, // aggressive orange/brown
        roughness: 0.6,
        metalness: 0.1,
      });
      const ironSpikesMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.35,
      });

      // Massive chest
      const chestGeo = this.getGeometry('orc_chest', () =>
        new THREE.BoxGeometry(1.65, 1.6, 1.1)
      );
      const chest = new THREE.Mesh(chestGeo, skinMat);
      chest.position.y = 1.7;
      chest.castShadow = true;
      rig.torso.add(chest);

      // Spiked Pauldrons
      const spGeo = this.getGeometry('orc_spikes', () =>
        new THREE.ConeGeometry(0.2, 0.5, 4)
      );
      const lsp = new THREE.Mesh(spGeo, ironSpikesMat);
      lsp.position.set(-1.0, 2.3, 0);
      rig.torso.add(lsp);
      const rsp = new THREE.Mesh(spGeo, ironSpikesMat);
      rsp.position.set(1.0, 2.3, 0);
      rig.torso.add(rsp);

      // Head & tusks
      rig.head.position.set(0, 2.65, 0.25);
      const headGeo = this.getGeometry('orc_head', () =>
        new THREE.BoxGeometry(0.95, 0.85, 0.95)
      );
      const head = new THREE.Mesh(headGeo, skinMat);
      head.castShadow = true;
      rig.head.add(head);

      // Tusks
      const tuskGeo = this.getGeometry('orc_tusk', () =>
        new THREE.ConeGeometry(0.12, 0.45, 5)
      );
      const lt = new THREE.Mesh(tuskGeo, this.materials.get('gold'));
      lt.rotation.x = -Math.PI / 4;
      lt.position.set(-0.32, -0.2, 0.5);
      rig.head.add(lt);
      const rt = new THREE.Mesh(tuskGeo, this.materials.get('gold'));
      rt.rotation.x = -Math.PI / 4;
      rt.position.set(0.32, -0.2, 0.5);
      rig.head.add(rt);

      rig.torso.add(rig.head);

      // Arms
      const armGeo = this.getGeometry('orc_arm', () =>
        new THREE.CylinderGeometry(0.28, 0.24, 1.3, 8)
      );
      rig.leftArm.position.set(-1.05, 2.1, 0);
      const la = new THREE.Mesh(armGeo, skinMat);
      la.position.y = -0.65;
      rig.leftArm.add(la);

      rig.rightArm.position.set(1.05, 2.1, 0);
      const ra = new THREE.Mesh(armGeo, skinMat);
      ra.position.y = -0.65;
      rig.rightArm.add(ra);

      // Giant Stone Warhammer
      const hHandleGeo = this.getGeometry('orc_handle', () =>
        new THREE.CylinderGeometry(0.1, 0.1, 2.1, 8)
      );
      const handle = new THREE.Mesh(hHandleGeo, this.materials.get('wood'));
      handle.position.set(0, 0.4, 0);

      const hHeadGeo = this.getGeometry('orc_hammer_head', () =>
        new THREE.BoxGeometry(0.8, 0.6, 0.8)
      );
      const hHead = new THREE.Mesh(hHeadGeo, ironSpikesMat);
      hHead.position.set(0, 1.3, 0);

      rig.weapon.add(handle);
      rig.weapon.add(hHead);
      rig.weapon.position.set(0, -0.8, 0.4);
      rig.weapon.rotation.x = Math.PI / 4;
      rig.rightArm.add(rig.weapon);

      // Heavy Legs
      const legGeo = this.getGeometry('orc_leg', () =>
        new THREE.CylinderGeometry(0.32, 0.26, 0.95, 8)
      );
      rig.leftLeg.position.set(-0.45, 0.9, 0);
      const ll = new THREE.Mesh(legGeo, ironSpikesMat);
      ll.position.y = -0.45;
      rig.leftLeg.add(ll);

      rig.rightLeg.position.set(0.45, 0.9, 0);
      const rl = new THREE.Mesh(legGeo, ironSpikesMat);
      rl.position.y = -0.45;
      rig.rightLeg.add(rl);

    } else if (typeId === 'archer') {
      // Skeleton Archer
      root.add(this.createShadowMesh(0.85));

      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.5,
      });

      // Spine & Ribs
      const ribGeo = this.getGeometry('skel_ribs', () =>
        new THREE.CylinderGeometry(0.45, 0.35, 1.0, 6, 1, true)
      );
      const ribs = new THREE.Mesh(ribGeo, boneMat);
      ribs.position.y = 1.3;
      rig.torso.add(ribs);

      // Skull
      rig.head.position.set(0, 2.05, 0);
      const skullGeo = this.getGeometry('skel_skull', () =>
        new THREE.BoxGeometry(0.65, 0.65, 0.65)
      );
      const skull = new THREE.Mesh(skullGeo, boneMat);
      skull.castShadow = true;
      rig.head.add(skull);

      // Glowing crimson eye sockets
      const eyeGeo = this.getGeometry('skel_eye', () =>
        new THREE.BoxGeometry(0.12, 0.12, 0.1)
      );
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const le = new THREE.Mesh(eyeGeo, eyeMat);
      le.position.set(-0.16, 0.05, 0.33);
      rig.head.add(le);
      const re = new THREE.Mesh(eyeGeo, eyeMat);
      re.position.set(0.16, 0.05, 0.33);
      rig.head.add(re);

      rig.torso.add(rig.head);

      // Bony Arms
      const armGeo = this.getGeometry('skel_arm', () =>
        new THREE.CylinderGeometry(0.08, 0.06, 0.9, 6)
      );
      rig.leftArm.position.set(-0.55, 1.7, 0);
      const la = new THREE.Mesh(armGeo, boneMat);
      la.position.y = -0.45;
      rig.leftArm.add(la);

      rig.rightArm.position.set(0.55, 1.7, 0);
      const ra = new THREE.Mesh(armGeo, boneMat);
      ra.position.y = -0.45;
      rig.rightArm.add(ra);

      // Wooden Bow in Left Hand
      const bowCurve = new THREE.Group();
      const bowGeo = this.getGeometry('skel_bow', () =>
        new THREE.TorusGeometry(0.7, 0.05, 6, 12, Math.PI)
      );
      const bowMesh = new THREE.Mesh(bowGeo, this.materials.get('wood'));
      bowMesh.rotation.y = Math.PI / 2;
      bowCurve.add(bowMesh);
      rig.weapon.add(bowCurve);
      rig.weapon.position.set(0, -0.5, 0.3);
      rig.leftArm.add(rig.weapon);

      // Bony Legs
      const legGeo = this.getGeometry('skel_leg', () =>
        new THREE.CylinderGeometry(0.09, 0.07, 0.8, 6)
      );
      rig.leftLeg.position.set(-0.25, 0.75, 0);
      const ll = new THREE.Mesh(legGeo, boneMat);
      ll.position.y = -0.4;
      rig.leftLeg.add(ll);

      rig.rightLeg.position.set(0.25, 0.75, 0);
      const rl = new THREE.Mesh(legGeo, boneMat);
      rl.position.y = -0.4;
      rig.rightLeg.add(rl);

    } else if (typeId === 'demon') {
      // Abyssal Demon
      root.add(this.createShadowMesh(1.1));

      const demonSkinMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.45,
        metalness: 0.2,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.35,
      });
      const hornMat = new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.2,
        metalness: 0.9,
      });

      // Torso
      const chestGeo = this.getGeometry('demon_chest', () =>
        new THREE.BoxGeometry(1.1, 1.35, 0.7)
      );
      const chest = new THREE.Mesh(chestGeo, demonSkinMat);
      chest.position.y = 1.6;
      chest.castShadow = true;
      rig.torso.add(chest);

      // Horned Head
      rig.head.position.set(0, 2.45, 0);
      const headGeo = this.getGeometry('demon_head', () =>
        new THREE.BoxGeometry(0.75, 0.75, 0.75)
      );
      const head = new THREE.Mesh(headGeo, demonSkinMat);
      head.castShadow = true;
      rig.head.add(head);

      // Curved Horns
      const hornGeo = this.getGeometry('demon_horn', () =>
        new THREE.ConeGeometry(0.18, 0.8, 6)
      );
      const lh = new THREE.Mesh(hornGeo, hornMat);
      lh.rotation.z = Math.PI / 4;
      lh.position.set(-0.4, 0.55, -0.1);
      rig.head.add(lh);
      const rh = new THREE.Mesh(hornGeo, hornMat);
      rh.rotation.z = -Math.PI / 4;
      rh.position.set(0.4, 0.55, -0.1);
      rig.head.add(rh);

      rig.torso.add(rig.head);

      // Bat Wings on back
      const wingGeo = this.getGeometry('demon_wing', () =>
        new THREE.PlaneGeometry(1.4, 1.2)
      );
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x450a0a,
        side: THREE.DoubleSide,
        roughness: 0.6,
      });
      const lw = new THREE.Mesh(wingGeo, wingMat);
      lw.position.set(-1.0, 1.8, -0.45);
      lw.rotation.y = Math.PI / 4;
      rig.extra.add(lw);

      const rw = new THREE.Mesh(wingGeo, wingMat);
      rw.position.set(1.0, 1.8, -0.45);
      rw.rotation.y = -Math.PI / 4;
      rig.extra.add(rw);
      rig.torso.add(rig.extra);

      // Claws Arms
      const armGeo = this.getGeometry('demon_arm', () =>
        new THREE.CylinderGeometry(0.18, 0.14, 1.0, 8)
      );
      rig.leftArm.position.set(-0.75, 1.9, 0);
      const la = new THREE.Mesh(armGeo, demonSkinMat);
      la.position.y = -0.5;
      rig.leftArm.add(la);

      rig.rightArm.position.set(0.75, 1.9, 0);
      const ra = new THREE.Mesh(armGeo, demonSkinMat);
      ra.position.y = -0.5;
      rig.rightArm.add(ra);

      // Legs
      const legGeo = this.getGeometry('demon_leg', () =>
        new THREE.CylinderGeometry(0.2, 0.16, 0.9, 8)
      );
      rig.leftLeg.position.set(-0.35, 0.9, 0);
      const ll = new THREE.Mesh(legGeo, demonSkinMat);
      ll.position.y = -0.45;
      rig.leftLeg.add(ll);

      rig.rightLeg.position.set(0.35, 0.9, 0);
      const rl = new THREE.Mesh(legGeo, demonSkinMat);
      rl.position.y = -0.45;
      rig.rightLeg.add(rl);
    }

    // Assemble root
    root.add(rig.torso);
    root.add(rig.leftLeg);
    root.add(rig.rightLeg);
    rig.torso.add(rig.leftArm);
    rig.torso.add(rig.rightArm);

    root.userData.rig = rig;
    return root;
  }

  // ---------------------------------------------------------------------------
  // 3. FINAL BOSS: MALAKOR, INFERNAL OVERLORD
  // ---------------------------------------------------------------------------
  createBossModel() {
    const root = new THREE.Group();
    root.name = 'boss_malakor';

    const rig = {
      root,
      torso: new THREE.Group(),
      head: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftLeg: new THREE.Group(),
      rightLeg: new THREE.Group(),
      weapon: new THREE.Group(),
      extra: new THREE.Group(),
      flameAura: new THREE.Group(),
    };

    root.add(this.createShadowMesh(2.5));

    const titanSkinMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
    });
    const titanArmorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.85,
    });
    const magmaGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
    });

    // Colossal Chest
    const chestGeo = this.getGeometry('boss_chest', () =>
      new THREE.BoxGeometry(2.8, 2.6, 1.8)
    );
    const chest = new THREE.Mesh(chestGeo, titanArmorMat);
    chest.position.y = 3.2;
    chest.castShadow = true;
    rig.torso.add(chest);

    // Magma Core Fissure on chest
    const coreGeo = this.getGeometry('boss_core', () =>
      new THREE.BoxGeometry(1.2, 1.4, 0.1)
    );
    const core = new THREE.Mesh(coreGeo, magmaGlowMat);
    core.position.set(0, 3.2, 0.95);
    rig.torso.add(core);

    // Spiked Titan Pauldrons
    const pGeo = this.getGeometry('boss_pauldron', () =>
      new THREE.BoxGeometry(1.2, 0.8, 1.2)
    );
    const lp = new THREE.Mesh(pGeo, titanArmorMat);
    lp.position.set(-1.9, 4.2, 0);
    rig.torso.add(lp);
    const rp = new THREE.Mesh(pGeo, titanArmorMat);
    rp.position.set(1.9, 4.2, 0);
    rig.torso.add(rp);

    // Massive Horned Crown Head
    rig.head.position.set(0, 4.8, 0.2);
    const headGeo = this.getGeometry('boss_head', () =>
      new THREE.BoxGeometry(1.4, 1.3, 1.4)
    );
    const head = new THREE.Mesh(headGeo, titanSkinMat);
    head.castShadow = true;
    rig.head.add(head);

    // 4 Flaming Horns
    const hornGeo = this.getGeometry('boss_horn', () =>
      new THREE.ConeGeometry(0.3, 1.5, 6)
    );
    for (let h = 0; h < 4; h++) {
      const hm = new THREE.Mesh(hornGeo, magmaGlowMat);
      const sign = h % 2 === 0 ? 1 : -1;
      const angle = (h < 2 ? 0.35 : 0.6) * sign;
      hm.rotation.z = angle;
      hm.position.set(sign * (0.55 + (h > 1 ? 0.3 : 0)), 0.9, -0.1 + (h > 1 ? -0.3 : 0));
      rig.head.add(hm);
    }

    rig.torso.add(rig.head);

    // Arms
    const armGeo = this.getGeometry('boss_arm', () =>
      new THREE.CylinderGeometry(0.45, 0.38, 2.2, 8)
    );
    rig.leftArm.position.set(-1.8, 3.8, 0);
    const la = new THREE.Mesh(armGeo, titanSkinMat);
    la.position.y = -1.1;
    rig.leftArm.add(la);

    rig.rightArm.position.set(1.8, 3.8, 0);
    const ra = new THREE.Mesh(armGeo, titanSkinMat);
    ra.position.y = -1.1;
    rig.rightArm.add(ra);

    // Colossal Infernal Greatsword
    const bladeGeo = this.getGeometry('boss_blade', () =>
      new THREE.BoxGeometry(0.65, 4.2, 0.15)
    );
    const swordBlade = new THREE.Mesh(bladeGeo, magmaGlowMat);
    swordBlade.position.set(0, 2.1, 0);

    const guardGeo = this.getGeometry('boss_guard', () =>
      new THREE.BoxGeometry(1.8, 0.35, 0.35)
    );
    const guard = new THREE.Mesh(guardGeo, titanArmorMat);

    const hiltGeo = this.getGeometry('boss_hilt', () =>
      new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8)
    );
    const hilt = new THREE.Mesh(hiltGeo, titanArmorMat);
    hilt.position.set(0, -0.6, 0);

    rig.weapon.add(swordBlade);
    rig.weapon.add(guard);
    rig.weapon.add(hilt);
    rig.weapon.position.set(0, -1.3, 0.6);
    rig.weapon.rotation.x = Math.PI / 4;
    rig.rightArm.add(rig.weapon);

    // Massive Demon Wings
    const wingGeo = this.getGeometry('boss_wing', () =>
      new THREE.PlaneGeometry(3.2, 2.8)
    );
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.2,
    });
    const lw = new THREE.Mesh(wingGeo, wingMat);
    lw.position.set(-2.2, 4.0, -1.0);
    lw.rotation.y = Math.PI / 4;
    rig.extra.add(lw);

    const rw = new THREE.Mesh(wingGeo, wingMat);
    rw.position.set(2.2, 4.0, -1.0);
    rw.rotation.y = -Math.PI / 4;
    rig.extra.add(rw);
    rig.torso.add(rig.extra);

    // Enraged Flame Aura (hidden in phase 1, animated in phase 2)
    const auraGeo = this.getGeometry('boss_aura', () =>
      new THREE.CylinderGeometry(3.5, 3.2, 5.5, 16, 1, true)
    );
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.y = 2.8;
    rig.flameAura.add(auraMesh);
    root.add(rig.flameAura);

    // Legs
    const legGeo = this.getGeometry('boss_leg', () =>
      new THREE.CylinderGeometry(0.55, 0.45, 1.8, 8)
    );
    rig.leftLeg.position.set(-0.85, 1.7, 0);
    const ll = new THREE.Mesh(legGeo, titanArmorMat);
    ll.position.y = -0.9;
    rig.leftLeg.add(ll);

    rig.rightLeg.position.set(0.85, 1.7, 0);
    const rl = new THREE.Mesh(legGeo, titanArmorMat);
    rl.position.y = -0.9;
    rig.rightLeg.add(rl);

    // Assemble root
    root.add(rig.torso);
    root.add(rig.leftLeg);
    root.add(rig.rightLeg);
    rig.torso.add(rig.leftArm);
    rig.torso.add(rig.rightArm);

    root.userData.rig = rig;
    return root;
  }

  // ---------------------------------------------------------------------------
  // 4. ARENA ENVIRONMENT & PROPS
  // ---------------------------------------------------------------------------
  createArenaEnvironment(arenaW = 130, arenaH = 100) {
    const envGroup = new THREE.Group();
    envGroup.name = 'arenaEnvironment';

    // 1. Ground Floor Plane
    const floorGeo = new THREE.PlaneGeometry(arenaW, arenaH);
    const floorMesh = new THREE.Mesh(floorGeo, this.materials.get('floor'));
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    envGroup.add(floorMesh);

    // 2. Central Rune Circle
    const runeGeo = new THREE.PlaneGeometry(36, 36);
    const runeMesh = new THREE.Mesh(runeGeo, this.materials.get('runeCircle'));
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.y = 0.03;
    envGroup.add(runeMesh);

    // 3. Perimeter Fortress Walls
    const wallThickness = 4.0;
    const wallHeight = 8.0;
    const halfW = arenaW / 2;
    const halfH = arenaH / 2;

    const wallMat = this.materials.get('stoneWall');
    const trimMat = this.materials.get('stoneTrim');

    // Helper: create a wall section with battlements
    const createWall = (w, h, x, z, rotY) => {
      const wg = new THREE.Group();
      const mainGeo = new THREE.BoxGeometry(w, wallHeight, wallThickness);
      const mainMesh = new THREE.Mesh(mainGeo, wallMat);
      mainMesh.position.y = wallHeight / 2;
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      wg.add(mainMesh);

      // Crenellations (battlements)
      const crenW = 2.5;
      const crenH = 1.6;
      const count = Math.floor(w / (crenW * 2));
      const crenGeo = this.getGeometry(`cren_${crenW}`, () =>
        new THREE.BoxGeometry(crenW, crenH, wallThickness * 1.05)
      );
      for (let i = 0; i < count; i++) {
        const cm = new THREE.Mesh(crenGeo, trimMat);
        cm.position.set(-w / 2 + (i * 2 + 1) * crenW, wallHeight + crenH / 2, 0);
        cm.castShadow = true;
        wg.add(cm);
      }

      wg.position.set(x, 0, z);
      wg.rotation.y = rotY;
      return wg;
    };

    // North, South, East, West Walls
    envGroup.add(createWall(arenaW + wallThickness * 2, wallHeight, 0, -halfH - wallThickness / 2, 0));
    envGroup.add(createWall(arenaW + wallThickness * 2, wallHeight, 0, halfH + wallThickness / 2, 0));
    envGroup.add(createWall(arenaH, wallHeight, -halfW - wallThickness / 2, 0, Math.PI / 2));
    envGroup.add(createWall(arenaH, wallHeight, halfW + wallThickness / 2, 0, Math.PI / 2));

    // 4. Torch Braziers on Walls
    const brazierPositions = [
      { x: -arenaW * 0.35, z: -halfH + 0.8 },
      { x: 0, z: -halfH + 0.8 },
      { x: arenaW * 0.35, z: -halfH + 0.8 },
      { x: -arenaW * 0.35, z: halfH - 0.8 },
      { x: 0, z: halfH - 0.8 },
      { x: arenaW * 0.35, z: halfH - 0.8 },
      { x: -halfW + 0.8, z: -arenaH * 0.25 },
      { x: -halfW + 0.8, z: arenaH * 0.25 },
      { x: halfW - 0.8, z: -arenaH * 0.25 },
      { x: halfW - 0.8, z: arenaH * 0.25 },
    ];

    const torchLights = [];
    const brazierGeo = this.getGeometry('brazier_bowl', () =>
      new THREE.CylinderGeometry(0.8, 0.4, 0.8, 8)
    );
    const flameGeo = this.getGeometry('brazier_flame', () =>
      new THREE.ConeGeometry(0.5, 1.2, 6)
    );

    brazierPositions.forEach((pos) => {
      const bg = new THREE.Group();
      const bowl = new THREE.Mesh(brazierGeo, this.materials.get('iron'));
      bowl.position.y = 4.5;
      bg.add(bowl);

      const flame = new THREE.Mesh(flameGeo, this.materials.get('torchFire'));
      flame.position.y = 5.2;
      bg.add(flame);

      bg.position.set(pos.x, 0, pos.z);
      envGroup.add(bg);

      // Flickering Point Light
      const pLight = new THREE.PointLight(0xff7722, 1.4, 22, 1.5);
      pLight.position.set(pos.x, 5.5, pos.z);
      envGroup.add(pLight);
      torchLights.push({ light: pLight, baseIntensity: 1.4, seed: Math.random() * 100 });
    });

    // 5. Environmental Scatter Props
    // Ancient stone pillars
    const pillarPositions = [
      { x: -35, z: -25 },
      { x: 35, z: -25 },
      { x: -35, z: 25 },
      { x: 35, z: 25 },
      { x: -18, z: 0 },
      { x: 18, z: 0 },
    ];

    const pillarGeo = this.getGeometry('pillar', () =>
      new THREE.CylinderGeometry(1.2, 1.4, 7.5, 10)
    );
    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(pillarGeo, trimMat);
      pillar.position.set(pos.x, 7.5 / 2, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      envGroup.add(pillar);
    });

    // Crates & Barrels near corners
    const crateGeo = this.getGeometry('crate', () =>
      new THREE.BoxGeometry(1.8, 1.8, 1.8)
    );
    const barrelGeo = this.getGeometry('barrel', () =>
      new THREE.CylinderGeometry(0.9, 0.9, 2.0, 10)
    );

    const propClusters = [
      { x: -halfW + 8, z: -halfH + 8 },
      { x: halfW - 8, z: -halfH + 8 },
      { x: -halfW + 8, z: halfH - 8 },
      { x: halfW - 8, z: halfH - 8 },
    ];

    propClusters.forEach((cl) => {
      // 2 crates
      const c1 = new THREE.Mesh(crateGeo, this.materials.get('wood'));
      c1.position.set(cl.x, 0.9, cl.z);
      c1.rotation.y = Math.PI / 7;
      c1.castShadow = true;
      c1.receiveShadow = true;
      envGroup.add(c1);

      const c2 = new THREE.Mesh(crateGeo, this.materials.get('wood'));
      c2.position.set(cl.x + 2.2, 0.9, cl.z - 0.4);
      c2.rotation.y = -Math.PI / 5;
      c2.castShadow = true;
      c2.receiveShadow = true;
      envGroup.add(c2);

      // 1 barrel
      const b1 = new THREE.Mesh(barrelGeo, this.materials.get('wood'));
      b1.position.set(cl.x + 1.2, 1.0, cl.z + 1.8);
      b1.castShadow = true;
      b1.receiveShadow = true;
      envGroup.add(b1);
    });

    // Glowing Mana Crystals at corners
    const crystalGeo = this.getGeometry('mana_crystal', () =>
      new THREE.ConeGeometry(0.85, 3.2, 6)
    );
    const crystalSpots = [
      { x: -halfW + 16, z: -halfH + 16, mat: 'crystalCyan' },
      { x: halfW - 16, z: -halfH + 16, mat: 'crystalPurple' },
      { x: -halfW + 16, z: halfH - 16, mat: 'crystalPurple' },
      { x: halfW - 16, z: halfH - 16, mat: 'crystalCyan' },
    ];
    crystalSpots.forEach((spot) => {
      const cm = new THREE.Mesh(crystalGeo, this.materials.get(spot.mat));
      cm.position.set(spot.x, 1.6, spot.z);
      cm.rotation.z = (Math.random() - 0.5) * 0.3;
      cm.castShadow = true;
      envGroup.add(cm);
    });

    return { envGroup, torchLights };
  }

  // ---------------------------------------------------------------------------
  // 5. 3D PROJECTILES & DROPS
  // ---------------------------------------------------------------------------
  createProjectileMesh(type = 'slash', color = '#60a5fa') {
    const group = new THREE.Group();
    const projColor = new THREE.Color(color);

    if (type === 'slash') {
      // 3D Crescent slash arc
      const slashGeo = this.getGeometry('proj_slash', () =>
        new THREE.RingGeometry(0.4, 1.1, 16, 1, 0, Math.PI * 0.85)
      );
      const slashMat = new THREE.MeshBasicMaterial({
        color: projColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const slashMesh = new THREE.Mesh(slashGeo, slashMat);
      slashMesh.rotation.x = Math.PI / 2;
      group.add(slashMesh);

    } else if (type === 'arrow') {
      // 3D Wooden arrow with iron tip
      const shaftGeo = this.getGeometry('proj_arrow_shaft', () =>
        new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6)
      );
      const shaft = new THREE.Mesh(shaftGeo, this.materials.get('wood'));
      shaft.rotation.x = Math.PI / 2;
      group.add(shaft);

      const tipGeo = this.getGeometry('proj_arrow_tip', () =>
        new THREE.ConeGeometry(0.12, 0.3, 4)
      );
      const tip = new THREE.Mesh(tipGeo, this.materials.get('iron'));
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.65;
      group.add(tip);

    } else if (type === 'shuriken') {
      // 3D 4-point cyber shuriken
      const starGeo = this.getGeometry('proj_shuriken', () =>
        new THREE.BoxGeometry(0.7, 0.06, 0.7)
      );
      const shurikenMat = new THREE.MeshStandardMaterial({
        color: projColor,
        emissive: projColor,
        emissiveIntensity: 0.6,
        metalness: 0.9,
      });
      const starMesh = new THREE.Mesh(starGeo, shurikenMat);
      group.add(starMesh);

    } else {
      // Glowing orb (fireball, demon orb, boss orb)
      const orbGeo = this.getGeometry('proj_orb', () =>
        new THREE.SphereGeometry(0.45, 12, 12)
      );
      const orbMat = new THREE.MeshBasicMaterial({
        color: projColor,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      group.add(orbMesh);

      const auraGeo = this.getGeometry('proj_orb_aura', () =>
        new THREE.SphereGeometry(0.75, 10, 10)
      );
      const auraMat = new THREE.MeshBasicMaterial({
        color: projColor,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      group.add(auraMesh);
    }

    return group;
  }

  createDropMesh(type = 'gold') {
    const group = new THREE.Group();
    group.add(this.createShadowMesh(0.45));

    if (type === 'gold') {
      // Spinning embossed gold coin
      const coinGeo = this.getGeometry('drop_coin', () =>
        new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16)
      );
      const coinMesh = new THREE.Mesh(coinGeo, this.materials.get('gold'));
      coinMesh.position.y = 0.45;
      coinMesh.rotation.z = Math.PI / 2;
      group.add(coinMesh);

    } else if (type === 'xp') {
      // Floating multifaceted cyan gem
      const gemGeo = this.getGeometry('drop_gem', () =>
        new THREE.OctahedronGeometry(0.45, 0)
      );
      const gemMesh = new THREE.Mesh(gemGeo, this.materials.get('crystalCyan'));
      gemMesh.position.y = 0.55;
      group.add(gemMesh);

    } else if (type === 'health') {
      // 3D red potion bottle with cork
      const bottleGeo = this.getGeometry('drop_bottle', () =>
        new THREE.SphereGeometry(0.38, 10, 10)
      );
      const bottleMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const bottle = new THREE.Mesh(bottleGeo, bottleMat);
      bottle.position.y = 0.45;
      group.add(bottle);

      const neckGeo = this.getGeometry('drop_neck', () =>
        new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8)
      );
      const neck = new THREE.Mesh(neckGeo, this.materials.get('wood'));
      neck.position.y = 0.85;
      group.add(neck);

    } else {
      // Magnet
      const magGeo = this.getGeometry('drop_magnet', () =>
        new THREE.TorusGeometry(0.4, 0.12, 8, 12, Math.PI)
      );
      const magMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.8,
        roughness: 0.3,
      });
      const mag = new THREE.Mesh(magGeo, magMat);
      mag.position.y = 0.5;
      mag.rotation.z = Math.PI;
      group.add(mag);
    }

    return group;
  }
}
