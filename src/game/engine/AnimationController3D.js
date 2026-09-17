/**
 * AnimationController3D:
 * Procedural skeletal-style joint animation engine for Player, Enemies, and Boss.
 * Drives idle, walk/run, attack swings, hit reactions, dashes, and death sequences.
 */
export class AnimationController3D {
  constructor() {
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
  }

  // ---------------------------------------------------------------------------
  // PLAYER ANIMATIONS
  // ---------------------------------------------------------------------------
  animatePlayer(rig, player, dt) {
    if (!rig) return;

    const isMoving = Math.hypot(player.vx, player.vy) > 10;
    const isDashing = player.isDashing;
    const isAttacking = player.swingProgress > 0;
    const isHit = player.invulnerableTimer > 0;
    const isDead = player.isDead;

    // Reset base transforms
    if (isDead) {
      // Death collapse
      rig.root.rotation.x = Math.min(Math.PI / 2, rig.root.rotation.x + dt * 4);
      rig.root.position.y = Math.max(-0.6, rig.root.position.y - dt * 0.4);
      rig.leftArm.rotation.z = 0.8;
      rig.rightArm.rotation.z = -0.8;
      return;
    }

    // 1. Idle & Breath
    const breath = Math.sin(this.time * 2.5) * 0.03;
    rig.torso.position.y = breath;
    rig.head.rotation.x = breath * 0.5;

    // 2. Walk / Run Cycle
    if (isMoving && !isDashing) {
      const cycle = player.walkCycle || (this.time * 10);
      const stride = Math.sin(cycle) * 0.65;

      // Legs swing
      rig.leftLeg.rotation.x = stride;
      rig.rightLeg.rotation.x = -stride;

      // Knee lift / vertical bob
      rig.torso.position.y += Math.abs(Math.sin(cycle * 2)) * 0.08;

      // Arms counter-swing (unless attacking)
      if (!isAttacking) {
        rig.leftArm.rotation.x = -stride * 0.7;
        rig.rightArm.rotation.x = stride * 0.7;
      }

      // Torso slight forward lean
      rig.torso.rotation.x = 0.12;
    } else {
      // Settle legs
      rig.leftLeg.rotation.x *= 0.8;
      rig.rightLeg.rotation.x *= 0.8;
      rig.torso.rotation.x *= 0.8;

      if (!isAttacking) {
        rig.leftArm.rotation.x = breath;
        rig.rightArm.rotation.x = -breath;
      }
    }

    // 3. Dash Tilt & Pose
    if (isDashing) {
      rig.torso.rotation.x = 0.35; // aggressive forward lean
      rig.leftArm.rotation.x = -0.8;
      rig.rightArm.rotation.x = -0.8;
    }

    // 4. Primary Attack Swing
    if (isAttacking) {
      // Swing progress goes from 1 down to 0
      const prog = player.swingProgress; // 0 to 1
      const slashAngle = (1 - prog) * Math.PI * 1.2 - Math.PI * 0.4;

      rig.rightArm.rotation.x = -0.3;
      rig.rightArm.rotation.y = slashAngle;
      rig.torso.rotation.y = -slashAngle * 0.3;

      // Weapon spin/recoil for gunner
      const barrels = rig.weapon.getObjectByName('minigunBarrels');
      if (barrels) {
        barrels.rotation.z += dt * 35;
      }
    } else {
      rig.rightArm.rotation.y *= 0.85;
      rig.torso.rotation.y *= 0.85;
    }

    // 5. Hit Flinch
    if (isHit) {
      rig.torso.rotation.x -= 0.2;
      rig.head.rotation.x -= 0.15;
    }
  }

  // ---------------------------------------------------------------------------
  // ENEMY ANIMATIONS
  // ---------------------------------------------------------------------------
  animateEnemy(rig, enemy, dt) {
    if (!rig) return;

    const isDead = enemy.isDead;
    const isHit = enemy.hitFlashTimer > 0;
    const speed = Math.hypot(enemy.vx, enemy.vy);
    const isMoving = speed > 5;
    const type = enemy.typeId;

    if (isDead) {
      // Fall and collapse
      rig.root.rotation.x = Math.min(Math.PI / 2, rig.root.rotation.x + dt * 6);
      rig.root.position.y = Math.max(-0.8, rig.root.position.y - dt * 0.8);
      return;
    }

    // Hit flinch jerk
    if (isHit) {
      rig.torso.rotation.x = -0.25;
      rig.head.rotation.x = -0.2;
    } else {
      rig.torso.rotation.x *= 0.88;
      rig.head.rotation.x *= 0.88;
    }

    // Individual Enemy Type Animations
    if (type === 'goblin') {
      // Nimble scamper run / fidgety idle
      const freq = isMoving ? 16 : 4;
      const t = this.time * freq + (enemy.wobbleTimer || 0);

      if (isMoving) {
        rig.leftLeg.rotation.x = Math.sin(t) * 0.75;
        rig.rightLeg.rotation.x = -Math.sin(t) * 0.75;
        rig.torso.position.y = Math.abs(Math.sin(t * 2)) * 0.12;
        rig.torso.rotation.x = 0.2; // hunched forward
        rig.rightArm.rotation.x = Math.sin(t) * 0.8;
      } else {
        rig.head.rotation.y = Math.sin(t) * 0.3; // twitchy looking around
        rig.leftLeg.rotation.x = 0;
        rig.rightLeg.rotation.x = 0;
        rig.torso.position.y = 0;
      }

    } else if (type === 'zombie') {
      // Asymmetric dragging shambling limp
      const t = this.time * 4.5 + (enemy.wobbleTimer || 0);
      if (isMoving) {
        rig.leftLeg.rotation.x = Math.sin(t) * 0.55;
        rig.rightLeg.rotation.x = -Math.sin(t + 0.5) * 0.35; // asymmetric limp
        rig.torso.rotation.z = Math.sin(t * 0.5) * 0.15; // side-to-side sway
        rig.head.rotation.z = 0.2 + Math.sin(t) * 0.1;

        // Outstretched clawing arms reach forward
        rig.leftArm.rotation.x = Math.PI / 2 + Math.sin(t) * 0.2;
        rig.rightArm.rotation.x = Math.PI / 2 - Math.sin(t) * 0.2;
      } else {
        rig.leftArm.rotation.x = Math.PI / 2.2;
        rig.rightArm.rotation.x = Math.PI / 2.2;
        rig.torso.rotation.z = 0;
      }

    } else if (type === 'orc') {
      // Thunderous stomp walk / berserker charge
      const isCharging = enemy.chargeState === 'charging';
      const freq = isCharging ? 14 : isMoving ? 7 : 2.5;
      const t = this.time * freq;

      if (isCharging) {
        // Head down charge
        rig.torso.rotation.x = 0.45;
        rig.head.rotation.x = -0.3;
        rig.leftLeg.rotation.x = Math.sin(t) * 0.8;
        rig.rightLeg.rotation.x = -Math.sin(t) * 0.8;
        rig.rightArm.rotation.x = 0.9; // raise hammer overhead
      } else if (isMoving) {
        rig.torso.rotation.x = 0.15;
        rig.leftLeg.rotation.x = Math.sin(t) * 0.6;
        rig.rightLeg.rotation.x = -Math.sin(t) * 0.6;
        rig.rightArm.rotation.x = -Math.sin(t) * 0.4;
      } else {
        rig.torso.rotation.x = Math.sin(t) * 0.05;
        rig.rightArm.rotation.x = 0;
      }

    } else if (type === 'archer') {
      // Skeleton Archer stride & aiming
      const t = this.time * 6;
      if (isMoving) {
        rig.leftLeg.rotation.x = Math.sin(t) * 0.5;
        rig.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      } else {
        rig.leftLeg.rotation.x = 0;
        rig.rightLeg.rotation.x = 0;
      }

      if (enemy.isAiming) {
        // Draw bow pose
        rig.leftArm.rotation.x = Math.PI / 2;
        rig.leftArm.rotation.y = -0.2;
        rig.rightArm.rotation.x = Math.PI / 2;
        rig.rightArm.rotation.y = 0.4;
      } else {
        rig.leftArm.rotation.x = 0.2;
        rig.leftArm.rotation.y = 0;
        rig.rightArm.rotation.x = -0.2;
        rig.rightArm.rotation.y = 0;
      }

    } else if (type === 'demon') {
      // Floating / hovering & wing flapping
      const hover = Math.sin(this.time * 3.5) * 0.25;
      rig.root.position.y = hover + 0.3;

      // Bat wings flap
      const flap = Math.sin(this.time * 5.0) * 0.4;
      if (rig.extra.children[0]) rig.extra.children[0].rotation.y = Math.PI / 4 + flap;
      if (rig.extra.children[1]) rig.extra.children[1].rotation.y = -Math.PI / 4 - flap;

      // Legs dangle backward
      rig.leftLeg.rotation.x = -0.3;
      rig.rightLeg.rotation.x = -0.2;

      // Casting hands
      if (enemy.castTimer > 0) {
        rig.leftArm.rotation.x = 0.8;
        rig.rightArm.rotation.x = 0.8;
      } else {
        rig.leftArm.rotation.x = 0.2;
        rig.rightArm.rotation.x = 0.2;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // BOSS ANIMATIONS (Malakor)
  // ---------------------------------------------------------------------------
  animateBoss(rig, boss, dt) {
    if (!rig) return;

    if (boss.isDead) {
      // Slow titan collapse
      rig.root.rotation.x = Math.min(Math.PI / 2, rig.root.rotation.x + dt * 2);
      rig.root.position.y = Math.max(-1.5, rig.root.position.y - dt * 0.6);
      return;
    }

    const isPhase2 = boss.phase === 2;
    const speed = Math.hypot(boss.vx, boss.vy);
    const isMoving = speed > 5;
    const freq = isPhase2 ? 7 : 4;
    const t = this.time * freq;

    // Phase 2 Roaring Flame Aura pulse & spin
    if (rig.flameAura) {
      rig.flameAura.rotation.y += dt * 3.5;
      const auraMesh = rig.flameAura.children[0];
      if (auraMesh && auraMesh.material) {
        auraMesh.material.opacity = isPhase2
          ? 0.45 + Math.sin(this.time * 8) * 0.2
          : 0;
      }
    }

    // Heavy Stomp Walk
    if (isMoving) {
      rig.leftLeg.rotation.x = Math.sin(t) * 0.5;
      rig.rightLeg.rotation.x = -Math.sin(t) * 0.5;
      rig.torso.position.y = Math.abs(Math.sin(t * 2)) * 0.2;
      rig.leftArm.rotation.x = -Math.sin(t) * 0.3;
    } else {
      rig.leftLeg.rotation.x *= 0.8;
      rig.rightLeg.rotation.x *= 0.8;
      rig.torso.position.y = Math.sin(this.time * 2) * 0.1;
    }

    // Greatsword attack & ground slam animation
    if (boss.isSlamming) {
      // Raise massive blade high overhead
      rig.rightArm.rotation.x = Math.PI * 0.8;
      rig.leftArm.rotation.x = Math.PI * 0.6;
      rig.torso.rotation.x = -0.2;
    } else {
      rig.rightArm.rotation.x = 0.3 + Math.sin(this.time * 3) * 0.15;
      rig.leftArm.rotation.x = -0.2;
      rig.torso.rotation.x *= 0.85;
    }

    // Demon Wings slow heavy flap
    const wingFlap = Math.sin(this.time * (isPhase2 ? 4 : 2)) * 0.35;
    if (rig.extra.children[0]) rig.extra.children[0].rotation.y = Math.PI / 4 + wingFlap;
    if (rig.extra.children[1]) rig.extra.children[1].rotation.y = -Math.PI / 4 - wingFlap;
  }
}
