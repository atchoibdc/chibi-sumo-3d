import * as THREE from 'three';
import { ChibiTextureFactory } from './chibiTexture.js';

export class ChibiSumo {
  constructor(scene, config, particles) {
    this.scene = scene;
    this.particles = particles;
    this.id = config.id;
    this.name = config.name;
    this.title = config.title || 'Sekiwake';
    this.mawashiColor = config.mawashiColor || 0xd62828; // Default Red Mawashi from reference sheet
    this.skinColor = config.skinColor || 0xffcbb2;
    this.mass = config.mass || 1.0;
    this.speed = config.speed || 1.0;
    this.aggression = config.aggression || 1.0;
    this.personality = config.personality || 'Balanced';

    // Physics collision radius
    this.radius = 1.05;
    this.pos = new THREE.Vector3(config.x || 0, 0, config.z || 0);
    this.vel = new THREE.Vector3(0, 0, 0);
    this.facingAngle = config.angle || 0;
    this.isAlive = true;
    this.isTeetering = false;
    this.isFalling = false;
    this.fallProgress = 0;
    this.kills = 0;

    // Combat & Animation state
    this.chargeAmount = 0;
    this.isCharging = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.stunTimer = 0;
    this.waddleCycle = Math.random() * Math.PI * 2;
    this.slapTimer = 0;

    // Natural Eye Blinking Cycle
    this.blinkTimer = 2.0 + Math.random() * 2.5;
    this.isBlinking = false;
    this.blinkDuration = 0;

    // 3D Object Hierarchy
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.bellyMesh = null;
    this.headGroup = new THREE.Group();
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.topknot = null;
    this.auraMesh = null;
    this.faceMesh = null;
    this.faceTextureObj = null;
    this.sweatDrop = null;

    // Harmonic spring for squishy belly bounces
    this.squash = new THREE.Vector3(1, 1, 1);
    this.squashVel = new THREE.Vector3(0, 0, 0);

    this.buildFaithfulModel();
    this.root.position.copy(this.pos);
    this.scene.add(this.root);
  }

  // Build the 3D model faithfully matching the front, side, and back views
  buildFaithfulModel() {
    // 1. Materials
    const torsoTexture = ChibiTextureFactory.createTorsoTexture(this.skinColor);
    const skinMat = new THREE.MeshStandardMaterial({
      color: this.skinColor,
      map: torsoTexture,
      roughness: 0.65,
      metalness: 0.05
    });

    const hairTexture = ChibiTextureFactory.createHairTexture();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x221e1b,
      map: hairTexture,
      roughness: 0.5,
      metalness: 0.15
    });

    // Red hair tie ribbon from reference
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xdd1c1a,
      roughness: 0.4,
      metalness: 0.1
    });

    const mawashiMat = new THREE.MeshStandardMaterial({
      color: this.mawashiColor,
      roughness: 0.7,
      metalness: 0.1
    });

    // 2. Head & Facial Features
    const headRadius = 0.72;
    const headGeo = new THREE.SphereGeometry(headRadius, 24, 20);
    // Chubby cheek expansion
    headGeo.scale(1.06, 0.98, 1.02);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.62;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Left and Right Ears with inner lobe indentation
    const earGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12);
    earGeo.rotateZ(Math.PI / 2);
    const earMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.7 });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-headRadius * 1.02, 1.62, 0.02);
    leftEar.rotation.y = 0.25;
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(headRadius * 1.02, 1.62, 0.02);
    rightEar.rotation.y = -0.25;
    this.headGroup.add(rightEar);

    // High-Resolution Expressive Face Canvas
    this.faceTextureObj = ChibiTextureFactory.createFaceTexture('normal');
    const faceGeo = new THREE.PlaneGeometry(0.88, 0.44);
    const faceMat = new THREE.MeshBasicMaterial({
      map: this.faceTextureObj.texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.faceMesh = new THREE.Mesh(faceGeo, faceMat);
    // Project slightly curved over front of face
    this.faceMesh.position.set(0, 1.62, headRadius * 0.98);
    this.headGroup.add(this.faceMesh);

    // Sculpted Hair Cap matching hairline
    const hairCapGeo = new THREE.SphereGeometry(headRadius * 1.015, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 1.64, -0.04);
    hairCap.rotation.x = -0.15; // Natural hairline slope
    this.headGroup.add(hairCap);

    // Topknot Bun (Chonmage) angled slightly back
    const bunGeo = new THREE.SphereGeometry(0.24, 16, 14);
    bunGeo.scale(1.0, 1.15, 0.9);
    this.topknot = new THREE.Mesh(bunGeo, hairMat);
    this.topknot.position.set(0, 2.38, -0.12);
    this.topknot.rotation.x = -0.25;
    this.headGroup.add(this.topknot);

    // Red Ribbon Band (Motoyui) wrapped around base of topknot
    const tieGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    const tieMesh = new THREE.Mesh(tieGeo, ribbonMat);
    tieMesh.position.set(0, 2.24, -0.09);
    tieMesh.rotation.x = -0.25;
    this.headGroup.add(tieMesh);

    this.bodyGroup.add(this.headGroup);

    // 3. Torso & Chubby Potbelly (matching the distinct Side View silhouette)
    // Main upper torso
    const chestGeo = new THREE.SphereGeometry(0.78, 20, 16);
    chestGeo.scale(1.12, 0.9, 0.98);
    const chestMesh = new THREE.Mesh(chestGeo, skinMat);
    chestMesh.position.set(0, 1.08, -0.02);
    chestMesh.castShadow = true;
    this.bodyGroup.add(chestMesh);

    // Prominent forward potbelly bulge
    const bellyGeo = new THREE.SphereGeometry(0.74, 20, 16);
    bellyGeo.scale(1.08, 0.92, 1.15); // Stretches forward
    this.bellyMesh = new THREE.Mesh(bellyGeo, skinMat);
    this.bellyMesh.position.set(0, 0.88, 0.18); // Forward offset
    this.bellyMesh.castShadow = true;
    this.bodyGroup.add(this.bellyMesh);

    // 4. Mawashi (Sumo Loincloth Belt) with Back Bow Knot (Komamusubi)
    // Waistband - Double-Tier Folded Silk Mawashi
    const mawashiGeo = new THREE.CylinderGeometry(0.82, 0.80, 0.38, 24);
    mawashiGeo.scale(1.08, 1.0, 1.08);
    const mawashiMesh = new THREE.Mesh(mawashiGeo, mawashiMat);
    mawashiMesh.position.set(0, 0.62, 0.06);
    mawashiMesh.castShadow = true;
    this.bodyGroup.add(mawashiMesh);

    // Subtle horizontal fold crease along the belt circumference (Double-tier fold from turnaround sheet)
    const creaseGeo = new THREE.TorusGeometry(0.84, 0.022, 8, 28);
    creaseGeo.scale(1.08, 1.0, 1.08);
    creaseGeo.rotateX(Math.PI / 2);
    const creaseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.mawashiColor).multiplyScalar(0.72),
      roughness: 0.85
    });
    const creaseMesh = new THREE.Mesh(creaseGeo, creaseMat);
    creaseMesh.position.set(0, 0.62, 0.06);
    this.bodyGroup.add(creaseMesh);

    // Front groin strap (Maetate)
    const groinGeo = new THREE.BoxGeometry(0.32, 0.38, 0.42);
    const groinMesh = new THREE.Mesh(groinGeo, mawashiMat);
    groinMesh.position.set(0, 0.44, 0.08);
    this.bodyGroup.add(groinMesh);

    // --- DISTINCTIVE REAR 4-LOOP BUTTERFLY KNOT (From Back View) ---
    const knotGroup = new THREE.Group();
    knotGroup.position.set(0, 0.64, -0.84); // Mounted on rear belt

    // Center knot block
    const centerKnotGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12);
    centerKnotGeo.rotateZ(Math.PI / 2);
    const centerKnot = new THREE.Mesh(centerKnotGeo, mawashiMat);
    centerKnot.castShadow = true;
    knotGroup.add(centerKnot);

    // 4 Butterfly Bow Loops (Upper-Left, Upper-Right, Lower-Left, Lower-Right)
    const loopGeo = new THREE.TorusGeometry(0.16, 0.065, 8, 16);
    const loops = [
      { rotZ: Math.PI * 0.28, posX: -0.16, posY: 0.12 },
      { rotZ: -Math.PI * 0.28, posX: 0.16, posY: 0.12 },
      { rotZ: Math.PI * 0.72, posX: -0.16, posY: -0.10 },
      { rotZ: -Math.PI * 0.72, posX: 0.16, posY: -0.10 }
    ];
    loops.forEach(l => {
      const loopMesh = new THREE.Mesh(loopGeo, mawashiMat);
      loopMesh.rotation.z = l.rotZ;
      loopMesh.rotation.y = 0.1;
      loopMesh.position.set(l.posX, l.posY, 0.02);
      loopMesh.castShadow = true;
      knotGroup.add(loopMesh);
    });

    // Hanging rear tie ends
    const tailGeo = new THREE.BoxGeometry(0.12, 0.32, 0.05);
    const tailMesh = new THREE.Mesh(tailGeo, mawashiMat);
    tailMesh.position.set(0, -0.22, 0.04);
    knotGroup.add(tailMesh);

    this.bodyGroup.add(knotGroup);

    // Helper: Sculpted Chibi Sumo Hand with 4 fingers and distinct opposable thumb
    const createSculptedHand = (isLeft) => {
      const handGroup = new THREE.Group();

      // 1. Palm - Rounded soft fleshy block
      const palmGeo = new THREE.BoxGeometry(0.20, 0.10, 0.18);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      palmMesh.position.set(0, -0.05, 0);
      palmMesh.castShadow = true;
      handGroup.add(palmMesh);

      // 2. Opposable Thumb (forward & medial angled)
      const thumbGroup = new THREE.Group();
      const thumbShaftGeo = new THREE.CylinderGeometry(0.040, 0.046, 0.10, 8);
      const thumbShaft = new THREE.Mesh(thumbShaftGeo, skinMat);
      thumbShaft.position.y = -0.05;
      thumbShaft.castShadow = true;
      thumbGroup.add(thumbShaft);

      const thumbTipGeo = new THREE.SphereGeometry(0.044, 8, 8);
      const thumbTip = new THREE.Mesh(thumbTipGeo, skinMat);
      thumbTip.position.y = -0.10;
      thumbTip.castShadow = true;
      thumbGroup.add(thumbTip);

      const thumbSign = isLeft ? 1 : -1;
      thumbGroup.position.set(0.085 * thumbSign, -0.03, 0.065);
      thumbGroup.rotation.set(0.40, 0.18 * thumbSign, -0.32 * thumbSign);
      handGroup.add(thumbGroup);

      // 3. Four Chubby Fingers (Index, Middle, Ring, Pinky) with soft fingertip pads
      const fingerDefs = [
        { offset: 0.052 * thumbSign, len: 0.13, rad: 0.036 },  // Index (inner)
        { offset: 0.016 * thumbSign, len: 0.15, rad: 0.038 },  // Middle
        { offset: -0.018 * thumbSign, len: 0.13, rad: 0.036 }, // Ring
        { offset: -0.054 * thumbSign, len: 0.105, rad: 0.032 } // Pinky (outer)
      ];

      fingerDefs.forEach(f => {
        const fGroup = new THREE.Group();
        const fShaftGeo = new THREE.CylinderGeometry(f.rad * 0.92, f.rad, f.len, 8);
        const fShaft = new THREE.Mesh(fShaftGeo, skinMat);
        fShaft.position.y = -f.len * 0.5;
        fShaft.castShadow = true;
        fGroup.add(fShaft);

        const fTipGeo = new THREE.SphereGeometry(f.rad * 1.05, 8, 8);
        const fTip = new THREE.Mesh(fTipGeo, skinMat);
        fTip.position.y = -f.len;
        fTip.castShadow = true;
        fGroup.add(fTip);

        fGroup.position.set(f.offset, -0.10, 0.015);
        fGroup.rotation.x = 0.20; // Natural forward push curvature
        handGroup.add(fGroup);
      });

      return handGroup;
    };

    // 5. Chubby Tapered Arms with Articulated Hands & Distinct Fingers
    const armGeo = new THREE.CylinderGeometry(0.24, 0.17, 0.68, 12);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    const lArmMesh = new THREE.Mesh(armGeo, skinMat);
    lArmMesh.position.y = -0.30;
    lArmMesh.castShadow = true;
    leftArmGroup.add(lArmMesh);

    const lHand = createSculptedHand(true);
    lHand.position.y = -0.62;
    leftArmGroup.add(lHand);

    leftArmGroup.position.set(-0.88, 1.14, 0.05);
    leftArmGroup.rotation.z = 0.35; // Gentle outwards T-pose stance
    leftArmGroup.rotation.x = 0.35;
    this.leftArm = leftArmGroup;
    this.bodyGroup.add(this.leftArm);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    const rArmMesh = new THREE.Mesh(armGeo, skinMat);
    rArmMesh.position.y = -0.30;
    rArmMesh.castShadow = true;
    rightArmGroup.add(rArmMesh);

    const rHand = createSculptedHand(false);
    rHand.position.y = -0.62;
    rightArmGroup.add(rHand);

    rightArmGroup.position.set(0.88, 1.14, 0.05);
    rightArmGroup.rotation.z = -0.35;
    rightArmGroup.rotation.x = 0.35;
    this.rightArm = rightArmGroup;
    this.bodyGroup.add(this.rightArm);

    // Helper: Sculpted Foot with 5 distinct rounded toes matching reference turnaround
    const createSculptedFoot = (isLeft) => {
      const footGroup = new THREE.Group();

      // Foot main sole pad
      const footGeo = new THREE.BoxGeometry(0.34, 0.16, 0.42);
      const footMesh = new THREE.Mesh(footGeo, skinMat);
      footMesh.position.set(0, 0.08, 0.04);
      footMesh.castShadow = true;
      footGroup.add(footMesh);

      // 5 Sculpted Toes along the forward foot arc
      const innerSign = isLeft ? 1 : -1;
      const toeDefs = [
        { x: 0.12 * innerSign, r: 0.054, z: 0.24 },  // Big toe (inner)
        { x: 0.06 * innerSign, r: 0.048, z: 0.25 },  // Index toe
        { x: 0.00,             r: 0.044, z: 0.255 }, // Middle toe
        { x: -0.06 * innerSign, r: 0.039, z: 0.245 }, // Fourth toe
        { x: -0.11 * innerSign, r: 0.033, z: 0.23 }  // Pinky toe (outer)
      ];

      toeDefs.forEach(toe => {
        const toeGeo = new THREE.SphereGeometry(toe.r, 8, 8);
        toeGeo.scale(1.0, 0.85, 1.15);
        const toeMesh = new THREE.Mesh(toeGeo, skinMat);
        toeMesh.position.set(toe.x, 0.06, toe.z);
        toeMesh.castShadow = true;
        footGroup.add(toeMesh);
      });

      return footGroup;
    };

    // 6. Chubby Legs & 5-Toed Sculpted Feet
    const legGeo = new THREE.CylinderGeometry(0.30, 0.28, 0.52, 14);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legGeo, skinMat);
    lLegMesh.position.y = 0.26;
    lLegMesh.castShadow = true;
    leftLegGroup.add(lLegMesh);

    const lFoot = createSculptedFoot(true);
    leftLegGroup.add(lFoot);

    leftLegGroup.position.set(-0.46, 0, 0.02);
    this.leftLeg = leftLegGroup;
    this.bodyGroup.add(this.leftLeg);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legGeo, skinMat);
    rLegMesh.position.y = 0.26;
    rLegMesh.castShadow = true;
    rightLegGroup.add(rLegMesh);

    const rFoot = createSculptedFoot(false);
    rightLegGroup.add(rFoot);

    rightLegGroup.position.set(0.46, 0, 0.02);
    this.rightLeg = rightLegGroup;
    this.bodyGroup.add(this.rightLeg);

    // 7. Power Charge Aura Dome (Wireframe)
    const auraGeo = new THREE.SphereGeometry(this.radius * 1.45, 18, 18);
    const auraMat = new THREE.MeshBasicMaterial({
      color: this.mawashiColor,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.position.y = 1.1;
    this.bodyGroup.add(this.auraMesh);

    // 8. Edge Teetering Anime Sweat Drop
    const sweatGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
    sweatGeo.rotateX(Math.PI);
    const sweatMat = new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0 });
    this.sweatDrop = new THREE.Mesh(sweatGeo, sweatMat);
    this.sweatDrop.position.set(headRadius * 0.9, 2.3, 0.2);
    this.bodyGroup.add(this.sweatDrop);

    this.root.add(this.bodyGroup);
  }

  drawFace(state = 'normal') {
    if (this.faceTextureObj && this.faceTextureObj.ctx) {
      ChibiTextureFactory.renderFaceOnCanvas(this.faceTextureObj.ctx, state);
      this.faceTextureObj.texture.needsUpdate = true;
    }
  }

  // Harmonic spring squash & stretch on impact
  applySquash(sx, sy, sz) {
    this.squash.set(sx, sy, sz);
    this.squashVel.set((1 - sx) * 15, (1 - sy) * 15, (1 - sz) * 15);
  }

  update(dt, elapsedTime) {
    if (!this.isAlive) return;

    // 1. Falling off edge animation
    if (this.isFalling) {
      this.fallProgress += dt;
      this.vel.y -= 24.0 * dt;
      this.pos.addScaledVector(this.vel, dt);
      this.root.position.copy(this.pos);

      // Comedic tumbling spin
      this.root.rotation.x += 4.5 * dt;
      this.root.rotation.y += 6.0 * dt;
      this.root.rotation.z += 3.5 * dt;

      // Arms waving
      this.leftArm.rotation.x = Math.sin(elapsedTime * 25) * 1.5;
      this.rightArm.rotation.x = -Math.sin(elapsedTime * 25) * 1.5;

      if (this.pos.y < -18) {
        this.isAlive = false;
        this.scene.remove(this.root);
      }
      return;
    }

    // 2. Teetering near edge animation
    if (this.isTeetering) {
      this.drawFace('shocked');
      this.sweatDrop.material.opacity = 0.9;
      this.sweatDrop.position.y = 2.3 + Math.sin(elapsedTime * 12) * 0.08;

      // Unsteady wobble on one foot
      this.bodyGroup.rotation.z = Math.sin(elapsedTime * 14) * 0.24;
      this.bodyGroup.rotation.x = -0.2; // Leaning back inward
      this.leftArm.rotation.x = Math.sin(elapsedTime * 18) * 1.1;
      this.rightArm.rotation.x = Math.cos(elapsedTime * 18) * 1.1;
    } else {
      this.sweatDrop.material.opacity = 0;
    }

    // 3. Stun timer
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0 && !this.isTeetering) {
        this.drawFace('normal');
      }
    }

    // Natural Eye Blinking Cycle (~2.5 - 4.5 seconds interval)
    if (!this.isTeetering && !this.isCharging && this.stunTimer <= 0) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        if (!this.isBlinking) {
          this.isBlinking = true;
          this.blinkDuration = 0.12;
          this.drawFace('blink');
        }
      }
      if (this.isBlinking) {
        this.blinkDuration -= dt;
        if (this.blinkDuration <= 0) {
          this.isBlinking = false;
          this.blinkTimer = 2.4 + Math.random() * 2.8;
          this.drawFace('normal');
        }
      }
    } else {
      this.isBlinking = false;
    }

    // 4. Dash timer
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
      if (Math.random() < 0.4 && this.particles) {
        this.particles.emitDustPuff(this.pos);
      }
    }

    // 5. Update Harmonic Squash-and-Stretch Spring
    const springK = 180.0;
    const damping = 12.0;
    const fx = -springK * (this.squash.x - 1) - damping * this.squashVel.x;
    const fy = -springK * (this.squash.y - 1) - damping * this.squashVel.y;
    const fz = -springK * (this.squash.z - 1) - damping * this.squashVel.z;
    this.squashVel.x += fx * dt;
    this.squashVel.y += fy * dt;
    this.squashVel.z += fz * dt;
    this.squash.x += this.squashVel.x * dt;
    this.squash.y += this.squashVel.y * dt;
    this.squash.z += this.squashVel.z * dt;
    this.bodyGroup.scale.copy(this.squash);

    // 6. Charging aura visual & vibration
    if (this.isCharging) {
      this.drawFace('charging');
      this.auraMesh.material.opacity = 0.35 + this.chargeAmount * 0.45;
      this.auraMesh.rotation.y += 4.0 * dt;
      const s = 1.0 + this.chargeAmount * 0.3 + Math.sin(elapsedTime * 30) * 0.05;
      this.auraMesh.scale.set(s, s, s);

      // Squatting down low into sumo crouch
      this.bodyGroup.position.y = -0.22 * this.chargeAmount;
      this.bodyGroup.position.x = (Math.random() - 0.5) * 0.08 * this.chargeAmount;

      if (this.particles && Math.random() < 0.5) {
        this.particles.emitChargeSpark(this.pos, this.mawashiColor);
      }
    } else {
      this.auraMesh.material.opacity = 0;
      this.bodyGroup.position.set(0, 0, 0);
    }

    // 7. Waddling Animation Cycle
    const speedMagnitude = Math.sqrt(this.vel.x * this.vel.x + this.vel.z * this.vel.z);
    if (speedMagnitude > 0.2 && !this.isTeetering) {
      this.waddleCycle += speedMagnitude * dt * 7.5;

      // Chubby body roll
      this.bodyGroup.rotation.z = Math.sin(this.waddleCycle) * 0.14;
      this.bodyGroup.rotation.y = Math.cos(this.waddleCycle) * 0.08;

      // Alternating leg steps
      this.leftLeg.position.y = Math.max(0, Math.sin(this.waddleCycle)) * 0.18;
      this.rightLeg.position.y = Math.max(0, -Math.sin(this.waddleCycle)) * 0.18;

      // Topknot bouncing
      this.topknot.rotation.z = -Math.sin(this.waddleCycle) * 0.28;

      if (Math.sin(this.waddleCycle) > 0.95 && this.particles && Math.random() < 0.3) {
        this.particles.emitDustPuff(this.pos);
      }
    } else if (!this.isTeetering) {
      // Idle breathing bounce
      this.bodyGroup.rotation.z = 0;
      this.bodyGroup.rotation.y = 0;
      this.leftLeg.position.y = 0;
      this.rightLeg.position.y = 0;
      this.topknot.rotation.z = 0;
    }

    // 8. Slap / Push Harite arm animation
    if (this.slapTimer > 0) {
      this.slapTimer -= dt;
      const slapPhase = Math.sin(elapsedTime * 28);
      this.leftArm.position.z = 0.05 + Math.max(0, slapPhase) * 0.45;
      this.rightArm.position.z = 0.05 + Math.max(0, -slapPhase) * 0.45;
    } else {
      this.leftArm.position.z = 0.05;
      this.rightArm.position.z = 0.05;
    }

    // 9. Root orientation and position
    this.root.rotation.y = this.facingAngle;
    this.root.position.copy(this.pos);
  }
}
