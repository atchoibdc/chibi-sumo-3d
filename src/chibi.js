import * as THREE from 'three';
import { ChibiTextureFactory } from './chibiTexture.js';

export class ChibiSumo {
  constructor(scene, config, particles) {
    this.scene = scene;
    this.particles = particles;
    this.id = config.id;
    this.name = config.name;
    this.title = config.title || 'Sekiwake';
    this.mawashiColor = config.mawashiColor || 0xd62828;
    this.skinColor = config.skinColor || 0xffcbb2;
    this.mass = config.mass || 1.0;
    this.speed = config.speed || 1.0;
    this.aggression = config.aggression || 1.0;
    this.personality = config.personality || 'Balanced';
    this.isChampion = Boolean(config.isChampion);

    // Cosmetic-only mass proportions (keeps collision radius identical for fair gameplay)
    const massNorm = THREE.MathUtils.clamp((this.mass - 0.85) / 0.65, 0, 1);
    this.bellyHeft = 0.92 + massNorm * 0.24;     // 0.92x (nimble) -> 1.16x (super heavy)
    this.shoulderHeft = 0.95 + massNorm * 0.14;  // 0.95x -> 1.09x
    this.traitVariant = this.resolveTraitVariant(this.personality);

    // Physics collision radius (unchanged)
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
    this.idlePhase = Math.random() * Math.PI * 2;
    this.slapTimer = 0;
    this.currentFaceState = 'normal';

    // Natural Eye Blinking Cycle
    this.blinkTimer = 1.8 + Math.random() * 2.6;
    this.isBlinking = false;
    this.blinkDuration = 0;

    // 3D Object Hierarchy
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.bellyMesh = null;
    this.chestMesh = null;
    this.headGroup = new THREE.Group();
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.topknot = null;
    this.auraMesh = null;
    this.auraRingMesh = null;
    this.faceMesh = null;
    this.faceTextureObj = null;
    this.sweatDrop = null;
    this.sagariPivots = [];
    this.championRingMesh = null;
    this.contactShadowMesh = null;

    // Harmonic spring for squishy belly bounces
    this.squash = new THREE.Vector3(1, 1, 1);
    this.squashVel = new THREE.Vector3(0, 0, 0);

    this.buildFaithfulModel();
    this.root.position.copy(this.pos);
    this.scene.add(this.root);
  }

  resolveTraitVariant(personality = '') {
    const p = personality.toLowerCase();
    if (p.includes('trickster') || p.includes('spinning') || p.includes('flanker')) return 1;
    if (p.includes('berserker') || p.includes('bulldozer') || p.includes('heavyweight') || p.includes('power') || p.includes('striker')) return 2;
    if (p.includes('speed') || p.includes('strategist')) return 3;
    return 0;
  }

  buildFaithfulModel() {
    // 1. Toy-Grade Materials with Warm Subsurface Daylight Bounce
    const skinBaseColor = new THREE.Color(this.skinColor);
    const warmSubsurface = skinBaseColor.clone().lerp(new THREE.Color(0xff7b6b), 0.35).multiplyScalar(0.11);

    // Clean smooth vinyl skin for head, limbs, hands, feet (no torso navel texture!)
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinBaseColor,
      emissive: warmSubsurface,
      roughness: 0.52,
      metalness: 0.02
    });

    // Warm rosy blush-tinted skin for cute 3D nose, inner ears, and plump toe/finger pads
    const rosyColor = skinBaseColor.clone().lerp(new THREE.Color(0xff758f), 0.32);
    const rosySkinMat = new THREE.MeshStandardMaterial({
      color: rosyColor,
      emissive: rosyColor.clone().multiplyScalar(0.10),
      roughness: 0.50,
      metalness: 0.02
    });

    // Dedicated non-multiplying Full Seamless Torso skin texture (color: 0xffffff preserves exact skin tone)
    const torsoTexture = ChibiTextureFactory.createTorsoTexture(this.skinColor, 'full');
    const torsoSkinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: torsoTexture,
      emissive: warmSubsurface,
      roughness: 0.52,
      metalness: 0.02
    });

    const hairTexture = ChibiTextureFactory.createHairTexture();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: hairTexture,
      roughness: 0.36,
      metalness: 0.18
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: this.isChampion ? 0xffbe0b : 0xe6192e,
      roughness: 0.35,
      metalness: this.isChampion ? 0.45 : 0.12
    });

    const mawashiTexture = ChibiTextureFactory.createMawashiTexture(this.mawashiColor);
    const mawashiMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: mawashiTexture,
      roughness: 0.46,
      metalness: 0.12
    });

    const mawashiAccentColor = new THREE.Color(this.mawashiColor).lerp(new THREE.Color(0xffffff), 0.25);
    const sagariAltMat = new THREE.MeshStandardMaterial({
      color: mawashiAccentColor,
      roughness: 0.42,
      metalness: 0.15
    });

    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0xfafcff,
      roughness: 0.72,
      metalness: 0.02
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.16,
      roughness: 0.28,
      metalness: 0.65
    });

    // 2. Soft Ground Contact Shadow & Champion Floor Halo
    const shadowGeo = new THREE.CircleGeometry(0.95 * this.bellyHeft, 24);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: ChibiTextureFactory.createContactShadowTexture(),
      transparent: true,
      depthWrite: false
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.position.y = 0.015;
    this.root.add(this.contactShadowMesh);

    if (this.isChampion) {
      const champRingGeo = new THREE.RingGeometry(1.02, 1.18, 40);
      champRingGeo.rotateX(-Math.PI / 2);
      const champRingMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.championRingMesh = new THREE.Mesh(champRingGeo, champRingMat);
      this.championRingMesh.position.y = 0.022;
      this.root.add(this.championRingMesh);
    }

    // 3. Seamless Pear-Cheek Chibi Head, Curved Face, 3D Nose, Ears & Oichomage Topknot
    const headRadius = 0.69;
    const headScaleX = 1.07;
    const headScaleY = 0.96;
    const headScaleZ = 1.02;
    const headY = 1.77;

    // Helper: Smooth pear-shaped lower-cheek chibi sculpt (zero separate spheres, 100% concentric!)
    const sculptPearCheeks = (geo, rRef) => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        const ny = y / rRef;
        // Soft Gaussian expansion in lower cheeks (ny around -0.28), zero distortion at upper hairline
        const cheekBell = Math.exp(-Math.pow((ny + 0.28) / 0.34, 2));
        const frontBias = 0.65 + 0.35 * Math.max(0, z / rRef);
        x *= headScaleX * (1.0 + 0.085 * cheekBell * frontBias);
        y *= headScaleY;
        z *= headScaleZ * (1.0 + 0.045 * cheekBell * frontBias);
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
    };

    // Smooth neck bridge
    const neckGeo = new THREE.CylinderGeometry(0.30, 0.38, 0.26, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 1.32, 0.02);
    this.bodyGroup.add(neckMesh);

    // Main seamless pear-cheek chibi head
    const headGeo = new THREE.SphereGeometry(headRadius, 36, 28);
    sculptPearCheeks(headGeo, headRadius);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = headY;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Concentric Curved Spherical Face Decal (uses identical sculptPearCheeks so it wraps with 0 seams!)
    this.faceTextureObj = ChibiTextureFactory.createFaceTexture('normal', this.traitVariant);
    const phiLen = 1.30;
    const thetaCenter = Math.PI * 0.515;
    const thetaLen = 0.76;
    const faceRadius = headRadius * 1.008;
    const faceGeo = new THREE.SphereGeometry(
      faceRadius,
      28,
      20,
      Math.PI * 0.5 - phiLen * 0.5,
      phiLen,
      thetaCenter - thetaLen * 0.5,
      thetaLen
    );
    sculptPearCheeks(faceGeo, faceRadius);
    const faceMat = new THREE.MeshBasicMaterial({
      map: this.faceTextureObj.texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    this.faceMesh = new THREE.Mesh(faceGeo, faceMat);
    this.faceMesh.position.y = headY;
    this.headGroup.add(this.faceMesh);

    // Cute 3D Sculpted Button Nose
    const noseGeo = new THREE.SphereGeometry(0.050, 14, 12);
    noseGeo.scale(1.18, 0.88, 0.95);
    const noseMesh = new THREE.Mesh(noseGeo, rosySkinMat);
    noseMesh.position.set(0, headY - 0.074, headRadius * headScaleZ * 1.032);
    noseMesh.castShadow = true;
    this.headGroup.add(noseMesh);

    // Sculpted Chibi Ears with Rounded Outer Helix & Warm Rosy Inner Hollow
    [-1, 1].forEach(side => {
      const earGroup = new THREE.Group();
      const outerEarGeo = new THREE.SphereGeometry(0.14, 14, 12);
      outerEarGeo.scale(0.45, 1.08, 0.86);
      const outerEar = new THREE.Mesh(outerEarGeo, skinMat);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      const innerEarGeo = new THREE.SphereGeometry(0.085, 10, 10);
      innerEarGeo.scale(0.42, 0.92, 0.75);
      const innerEar = new THREE.Mesh(innerEarGeo, rosySkinMat);
      innerEar.position.set(side * 0.012, -0.01, 0.044);
      earGroup.add(innerEar);

      earGroup.position.set(side * headRadius * headScaleX * 1.01, headY - 0.04, 0.02);
      earGroup.rotation.y = -side * 0.22;
      earGroup.rotation.z = -side * 0.08;
      this.headGroup.add(earGroup);
    });

    // Waxed Sumo Hair Dome + Temple Sideburns (Bin)
    // Tilted backward (-0.36 rad) so front forehead stays open & cute (~64°) while back sweeps smoothly down nape (~105°)!
    const hairCapGeo = new THREE.SphereGeometry(headRadius * 1.018, 32, 22, 0, Math.PI * 2, 0, Math.PI * 0.47);
    hairCapGeo.scale(headScaleX, headScaleY, headScaleZ);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, headY + 0.02, -0.02);
    hairCap.rotation.x = -0.36;
    hairCap.castShadow = true;
    this.headGroup.add(hairCap);

    // Sculpted Sumo Sideburn Locks (Bin) tucked seamlessly into temple hairline
    const sideburnGeo = new THREE.CapsuleGeometry(0.052, 0.15, 6, 10);
    [-1, 1].forEach(side => {
      const sb = new THREE.Mesh(sideburnGeo, hairMat);
      sb.position.set(side * headRadius * headScaleX * 0.96, headY + 0.08, 0.18);
      sb.rotation.z = side * 0.18;
      sb.rotation.x = 0.28;
      this.headGroup.add(sb);
    });

    // Oichomage (Ginkgo-Leaf Fan Sumo Topknot) pivoted at crown for lively bounce
    this.topknot = new THREE.Group();
    this.topknot.position.set(0, headY + 0.62, -0.06);

    // Gathered crown hair root
    const stemBaseGeo = new THREE.SphereGeometry(0.15, 14, 12);
    stemBaseGeo.scale(1.05, 0.85, 1.15);
    const stemBase = new THREE.Mesh(stemBaseGeo, hairMat);
    stemBase.position.set(0, 0.02, -0.05);
    stemBase.castShadow = true;
    this.topknot.add(stemBase);

    // Arched hair stem sweeping forward
    const stemGeo = new THREE.CapsuleGeometry(0.092, 0.14, 8, 12);
    const stemMesh = new THREE.Mesh(stemGeo, hairMat);
    stemMesh.position.set(0, 0.11, -0.01);
    stemMesh.rotation.x = 0.38;
    stemMesh.castShadow = true;
    this.topknot.add(stemMesh);

    // Wrapped Silk Motoyui Tie Band
    const tieGeo = new THREE.CylinderGeometry(0.102, 0.112, 0.092, 16);
    const tieMesh = new THREE.Mesh(tieGeo, ribbonMat);
    tieMesh.position.set(0, 0.13, 0.0);
    tieMesh.rotation.x = 0.38;
    this.topknot.add(tieMesh);

    // Ginkgo-Leaf Splayed Fan Crest (Oichomage)
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 0.21, 0.07);
    fanGroup.rotation.x = 0.62;
    const lobeCount = 7;
    for (let i = 0; i < lobeCount; i++) {
      const t = (i / (lobeCount - 1)) - 0.5;
      const lobeLen = 0.155 - Math.abs(t) * 0.045;
      const lobeGeo = new THREE.CapsuleGeometry(0.046, lobeLen, 6, 10);
      lobeGeo.scale(1.12, 1.0, 0.62);
      const lobe = new THREE.Mesh(lobeGeo, hairMat);
      lobe.position.set(t * 0.33, Math.cos(t * 2.0) * 0.04, 0);
      lobe.rotation.z = -t * 0.95;
      lobe.castShadow = true;
      fanGroup.add(lobe);
    }
    this.topknot.add(fanGroup);
    this.headGroup.add(this.topknot);

    this.bodyGroup.add(this.headGroup);

    // 4. Single Unified Seamless Sculpted Sumo Torso (Chest + Round Potbelly with ZERO crease!)
    const torsoGeo = new THREE.SphereGeometry(1.0, 36, 28);
    torsoGeo.rotateY(-Math.PI * 0.5); // Centers UV u=0.5 squarely on +Z front!
    const tPos = torsoGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      const ny = tPos.getY(i); // -1 (hips) .. +1 (neck)
      const z = tPos.getZ(i);

      // Smooth potbelly fullness curve peaking around ny = -0.18 (just above mawashi top roll)
      const bellyBulge = Math.exp(-Math.pow((ny + 0.18) / 0.48, 2));
      const chestBroad = Math.exp(-Math.pow((ny - 0.35) / 0.36, 2));

      const rx = (0.78 * this.bellyHeft * (0.94 + 0.10 * bellyBulge)) + (0.08 * this.shoulderHeft * chestBroad);
      const ry = 0.48; // spans y = 0.92 ± 0.48 -> [0.44 .. 1.40], leaving full cute chin visible!

      let rz;
      if (z >= 0) {
        // Front profile: sloped upper chest behind chin, swelling smoothly into plump round potbelly
        rz = 0.50 + (0.42 * this.bellyHeft * bellyBulge);
      } else {
        // Back profile: sturdy muscular sumo back
        rz = 0.72 * this.bellyHeft * (1.0 - 0.16 * Math.max(0, ny));
      }

      const forwardBellyShift = 0.10 * this.bellyHeft * bellyBulge;
      tPos.setXYZ(i, x * rx, ny * ry, z * rz + forwardBellyShift);
    }
    torsoGeo.computeVertexNormals();

    this.bellyMesh = new THREE.Mesh(torsoGeo, torsoSkinMat);
    this.bellyMesh.position.set(0, 0.92, 0.04);
    this.bellyMesh.castShadow = true;
    this.bellyMesh.receiveShadow = true;
    this.bodyGroup.add(this.bellyMesh);

    // Smooth Deltoid Shoulder Caps bridging upper torso into upper arms
    const shoulderCapGeo = new THREE.SphereGeometry(0.22 * this.shoulderHeft, 14, 12);
    [-1, 1].forEach(side => {
      const sCap = new THREE.Mesh(shoulderCapGeo, skinMat);
      sCap.position.set(side * 0.76 * this.shoulderHeft, 1.19, 0.03);
      sCap.castShadow = true;
      this.bodyGroup.add(sCap);
    });

    // Chubby sumo lower hip/glute cheeks peeking cleanly at back
    const gluteGeo = new THREE.SphereGeometry(0.32 * this.bellyHeft, 16, 12);
    gluteGeo.scale(1.05, 0.88, 0.95);
    [-1, 1].forEach(side => {
      const glute = new THREE.Mesh(gluteGeo, skinMat);
      glute.position.set(side * 0.30 * this.bellyHeft, 0.54, -0.34 * this.bellyHeft);
      glute.castShadow = true;
      this.bodyGroup.add(glute);
    });

    // 5. Woven Silk Mawashi Belt, Swaying Front Sagari & Rear Komamusubi Knot
    const beltRx = 0.82 * this.bellyHeft * 1.06;
    const beltRz = 0.82 * this.bellyHeft * 1.08;

    const mawashiGeo = new THREE.CylinderGeometry(0.82 * this.bellyHeft, 0.79 * this.bellyHeft, 0.40, 32);
    mawashiGeo.scale(1.06, 1.0, 1.08);
    const mawashiMesh = new THREE.Mesh(mawashiGeo, mawashiMat);
    mawashiMesh.position.set(0, 0.62, 0.06);
    mawashiMesh.castShadow = true;
    this.bodyGroup.add(mawashiMesh);

    // Plush rolled silk upper & middle belt folds
    [0.76, 0.62, 0.48].forEach((foldY, idx) => {
      const rFactor = idx === 2 ? 0.97 : 1.0;
      const rollGeo = new THREE.TorusGeometry(0.81 * this.bellyHeft * rFactor, 0.036, 10, 32);
      rollGeo.scale(1.06, 1.0, 1.08);
      rollGeo.rotateX(Math.PI / 2);
      const rollMesh = new THREE.Mesh(rollGeo, mawashiMat);
      rollMesh.position.set(0, foldY, 0.06);
      rollMesh.castShadow = true;
      this.bodyGroup.add(rollMesh);
    });

    // Smooth sculpted curved front Maetate wrap (replaces blocky BoxGeometry)
    const groinGeo = new THREE.SphereGeometry(0.35, 18, 14);
    groinGeo.scale(0.76 * this.bellyHeft, 1.02, 1.18 * this.bellyHeft);
    const groinMesh = new THREE.Mesh(groinGeo, mawashiMat);
    groinMesh.position.set(0, 0.46, 0.14);
    groinMesh.castShadow = true;
    this.bodyGroup.add(groinMesh);

    // 7 Swaying Front Sagari Silk Fringes across the front waist arc
    const sagariCount = 7;
    const sagariCordGeo = new THREE.CapsuleGeometry(0.025, 0.25, 6, 8);
    const sagariTipGeo = new THREE.SphereGeometry(0.030, 8, 8);
    for (let i = 0; i < sagariCount; i++) {
      const frac = (i / (sagariCount - 1)) - 0.5; // -0.5 .. +0.5
      const angle = frac * 1.12; // Front arc around +Z
      const pivot = new THREE.Group();
      pivot.position.set(
        Math.sin(angle) * (beltRx + 0.03),
        0.70,
        0.06 + Math.cos(angle) * (beltRz + 0.03)
      );
      pivot.rotation.y = angle;
      // Slight natural outward rest angle over belly/thighs
      const baseTiltX = 0.08;
      pivot.rotation.x = baseTiltX;

      const cordMat = i % 2 === 0 ? mawashiMat : sagariAltMat;
      const cord = new THREE.Mesh(sagariCordGeo, cordMat);
      cord.position.y = -0.16;
      cord.castShadow = true;
      pivot.add(cord);

      const tip = new THREE.Mesh(sagariTipGeo, goldMat);
      tip.position.y = -0.30;
      pivot.add(tip);

      this.bodyGroup.add(pivot);
      this.sagariPivots.push({ pivot, baseTiltX, phase: i * 0.65 });
    }

    // Rear 4-Loop Butterfly Knot (Komamusubi)
    const knotGroup = new THREE.Group();
    knotGroup.position.set(0, 0.65, 0.06 - beltRz - 0.02);

    const centerKnotGeo = new THREE.CapsuleGeometry(0.11, 0.14, 8, 12);
    centerKnotGeo.rotateZ(Math.PI / 2);
    const centerKnot = new THREE.Mesh(centerKnotGeo, mawashiMat);
    centerKnot.castShadow = true;
    knotGroup.add(centerKnot);

    const loopGeo = new THREE.TorusGeometry(0.155, 0.062, 10, 18);
    [
      { rotZ: Math.PI * 0.26, posX: -0.16, posY: 0.11 },
      { rotZ: -Math.PI * 0.26, posX: 0.16, posY: 0.11 },
      { rotZ: Math.PI * 0.74, posX: -0.15, posY: -0.10 },
      { rotZ: -Math.PI * 0.74, posX: 0.15, posY: -0.10 }
    ].forEach(l => {
      const loopMesh = new THREE.Mesh(loopGeo, mawashiMat);
      loopMesh.rotation.z = l.rotZ;
      loopMesh.rotation.y = l.posX < 0 ? -0.18 : 0.18;
      loopMesh.position.set(l.posX, l.posY, -0.02);
      loopMesh.castShadow = true;
      knotGroup.add(loopMesh);
    });

    // Dual angled silk knot tails
    const tailGeo = new THREE.CapsuleGeometry(0.048, 0.20, 6, 8);
    tailGeo.scale(1.15, 1.0, 0.45);
    [-1, 1].forEach(side => {
      const tailMesh = new THREE.Mesh(tailGeo, mawashiMat);
      tailMesh.position.set(side * 0.065, -0.22, -0.02);
      tailMesh.rotation.z = side * 0.18;
      tailMesh.castShadow = true;
      knotGroup.add(tailMesh);
    });
    this.bodyGroup.add(knotGroup);

    // Prestigious Ceremonial Yokozuna Tsuna Rope & Paper Shide for Picked Champion!
    if (this.isChampion) {
      const tsunaMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff3d6,
        emissiveIntensity: 0.12,
        roughness: 0.55,
        metalness: 0.05
      });

      // Thick braided white ceremonial rope around upper belt
      const tsunaGeo = new THREE.TorusGeometry(0.84 * this.bellyHeft, 0.072, 12, 36);
      tsunaGeo.scale(1.06, 1.25, 1.08);
      tsunaGeo.rotateX(Math.PI / 2);
      const tsunaMesh = new THREE.Mesh(tsunaGeo, tsunaMat);
      tsunaMesh.position.set(0, 0.74, 0.06);
      tsunaMesh.castShadow = true;
      this.bodyGroup.add(tsunaMesh);

      // Gold ceremonial bindings + 5 crisp white folded Shide paper zig-zags
      const shideAngles = [-0.95, -0.48, 0, 0.48, 0.95];
      shideAngles.forEach(ang => {
        const holder = new THREE.Group();
        holder.position.set(
          Math.sin(ang) * (beltRx + 0.08),
          0.72,
          0.06 + Math.cos(ang) * (beltRz + 0.08)
        );
        holder.rotation.y = ang;

        // Gold binding ring on rope
        const ringGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.05, 12);
        ringGeo.rotateZ(Math.PI / 2);
        const ring = new THREE.Mesh(ringGeo, goldMat);
        holder.add(ring);

        // Two-step zig-zag white paper Shide pendant
        const segGeo = new THREE.BoxGeometry(0.085, 0.13, 0.018);
        const seg1 = new THREE.Mesh(segGeo, tsunaMat);
        seg1.position.set(-0.02, -0.10, 0.02);
        seg1.rotation.z = 0.26;
        seg1.castShadow = true;
        holder.add(seg1);

        const seg2 = new THREE.Mesh(segGeo, tsunaMat);
        seg2.position.set(0.02, -0.20, 0.025);
        seg2.rotation.z = -0.26;
        seg2.castShadow = true;
        holder.add(seg2);

        this.bodyGroup.add(holder);
      });
    }

    // 6. Smooth Capsule Arms, White Athletic Wrist Tape & Plump Sculpted Hands
    const createSculptedHand = (isLeft) => {
      const handGroup = new THREE.Group();
      const thumbSign = isLeft ? 1 : -1;

      // Soft rounded fleshy palm cushion (replaces sharp BoxGeometry)
      const palmGeo = new THREE.SphereGeometry(0.115, 14, 12);
      palmGeo.scale(1.12, 0.78, 0.92);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      palmMesh.position.set(0, -0.055, 0.01);
      palmMesh.castShadow = true;
      handGroup.add(palmMesh);

      // Rosy inner palm warmth pad
      const padGeo = new THREE.SphereGeometry(0.075, 10, 8);
      padGeo.scale(1.0, 0.65, 0.55);
      const padMesh = new THREE.Mesh(padGeo, rosySkinMat);
      padMesh.position.set(0, -0.06, 0.068);
      handGroup.add(padMesh);

      // Plump Opposable Thumb
      const thumbGeo = new THREE.CapsuleGeometry(0.038, 0.068, 6, 8);
      const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
      thumbMesh.position.set(0.095 * thumbSign, -0.055, 0.055);
      thumbMesh.rotation.set(0.38, 0.15 * thumbSign, -0.48 * thumbSign);
      thumbMesh.castShadow = true;
      handGroup.add(thumbMesh);

      // 4 Chubby Capsule Fingers splayed slightly in ready sumo palm
      const fingerDefs = [
        { offset: 0.058 * thumbSign, len: 0.075, rad: 0.032, splay: -0.10 * thumbSign },
        { offset: 0.019 * thumbSign, len: 0.090, rad: 0.034, splay: -0.03 * thumbSign },
        { offset: -0.020 * thumbSign, len: 0.078, rad: 0.032, splay: 0.04 * thumbSign },
        { offset: -0.056 * thumbSign, len: 0.058, rad: 0.029, splay: 0.12 * thumbSign }
      ];

      fingerDefs.forEach(f => {
        const fGeo = new THREE.CapsuleGeometry(f.rad, f.len, 6, 8);
        const fMesh = new THREE.Mesh(fGeo, skinMat);
        fMesh.position.set(f.offset, -0.13 - f.len * 0.35, 0.022);
        fMesh.rotation.x = 0.22;
        fMesh.rotation.z = f.splay;
        fMesh.castShadow = true;
        handGroup.add(fMesh);
      });

      return handGroup;
    };

    const buildArm = (isLeft) => {
      const side = isLeft ? -1 : 1;
      const armGroup = new THREE.Group();

      // Chubby upper arm capsule
      const upperGeo = new THREE.CapsuleGeometry(0.195 * this.shoulderHeft, 0.22, 10, 14);
      const upperMesh = new THREE.Mesh(upperGeo, skinMat);
      upperMesh.position.set(0, -0.17, 0);
      upperMesh.castShadow = true;
      armGroup.add(upperMesh);

      // Tapered forearm capsule angled slightly forward
      const foreGroup = new THREE.Group();
      foreGroup.position.set(0, -0.32, 0.02);
      foreGroup.rotation.x = -0.32; // Natural bent elbow ready to push!

      const foreGeo = new THREE.CapsuleGeometry(0.158, 0.18, 10, 14);
      const foreMesh = new THREE.Mesh(foreGeo, skinMat);
      foreMesh.position.set(0, -0.13, 0);
      foreMesh.castShadow = true;
      foreGroup.add(foreMesh);

      // Crisp White Sumo Wrist Tape Wrap
      const wristTapeGeo = new THREE.CylinderGeometry(0.155, 0.148, 0.095, 16);
      const wristTape = new THREE.Mesh(wristTapeGeo, tapeMat);
      wristTape.position.set(0, -0.23, 0);
      wristTape.castShadow = true;
      foreGroup.add(wristTape);

      const hand = createSculptedHand(isLeft);
      hand.position.set(0, -0.28, 0.01);
      // Angle palm slightly forward into classic sumo Tsuppari guard
      hand.rotation.x = -0.35;
      foreGroup.add(hand);

      armGroup.add(foreGroup);
      armGroup.position.set(side * 0.84 * this.shoulderHeft, 1.15, 0.05);
      armGroup.rotation.z = -side * 0.36;
      armGroup.rotation.x = 0.28;
      return armGroup;
    };

    this.leftArm = buildArm(true);
    this.rightArm = buildArm(false);
    this.bodyGroup.add(this.leftArm);
    this.bodyGroup.add(this.rightArm);

    // 7. Chubby Sumo Legs, White Athletic Ankle Wraps & Organic Sculpted Feet
    const createSculptedFoot = (isLeft) => {
      const footGroup = new THREE.Group();
      const innerSign = isLeft ? 1 : -1;

      // Smooth organic sculpted instep & sole cushion (replaces sharp BoxGeometry)
      const footGeo = new THREE.SphereGeometry(0.22, 16, 12);
      footGeo.scale(0.84, 0.46, 1.16);
      const footMesh = new THREE.Mesh(footGeo, skinMat);
      footMesh.position.set(0, 0.085, 0.05);
      footMesh.castShadow = true;
      footMesh.receiveShadow = true;
      footGroup.add(footMesh);

      // Rounded heel pad
      const heelGeo = new THREE.SphereGeometry(0.15, 12, 10);
      heelGeo.scale(0.95, 0.58, 0.90);
      const heelMesh = new THREE.Mesh(heelGeo, skinMat);
      heelMesh.position.set(0, 0.075, -0.09);
      heelMesh.castShadow = true;
      footGroup.add(heelMesh);

      // 5 Plump Rosy-Warm Toes fanned cleanly along front arc
      const toeDefs = [
        { x: 0.115 * innerSign, r: 0.052, z: 0.265 },
        { x: 0.056 * innerSign, r: 0.046, z: 0.282 },
        { x: 0.000,             r: 0.043, z: 0.286 },
        { x: -0.054 * innerSign, r: 0.039, z: 0.274 },
        { x: -0.104 * innerSign, r: 0.034, z: 0.252 }
      ];

      toeDefs.forEach((toe, idx) => {
        const toeGeo = new THREE.SphereGeometry(toe.r, 10, 8);
        toeGeo.scale(1.0, 0.82, 1.18);
        const toeMesh = new THREE.Mesh(toeGeo, idx === 0 ? rosySkinMat : skinMat);
        toeMesh.position.set(toe.x, 0.055, toe.z);
        toeMesh.castShadow = true;
        footGroup.add(toeMesh);
      });

      return footGroup;
    };

    const buildLeg = (isLeft) => {
      const side = isLeft ? -1 : 1;
      const legGroup = new THREE.Group();

      // Sturdy chubby thigh & calf capsule
      const thighGeo = new THREE.CapsuleGeometry(0.255 * this.shoulderHeft, 0.24, 10, 16);
      const thighMesh = new THREE.Mesh(thighGeo, skinMat);
      thighMesh.position.set(0, 0.30, 0);
      thighMesh.rotation.z = -side * 0.08; // Wide rooted sumo stance
      thighMesh.castShadow = true;
      legGroup.add(thighMesh);

      // Crisp White Athletic Sumo Ankle Tape Wrap
      const ankleTapeGeo = new THREE.CylinderGeometry(0.215, 0.228, 0.13, 18);
      const ankleTape = new THREE.Mesh(ankleTapeGeo, tapeMat);
      ankleTape.position.set(0, 0.155, 0.01);
      ankleTape.castShadow = true;
      legGroup.add(ankleTape);

      const foot = createSculptedFoot(isLeft);
      foot.rotation.y = side * 0.12; // Natural outward sumo foot turnout
      legGroup.add(foot);

      legGroup.position.set(side * 0.47 * this.bellyHeft, 0, 0.02);
      return legGroup;
    };

    this.leftLeg = buildLeg(true);
    this.rightLeg = buildLeg(false);
    this.bodyGroup.add(this.leftLeg);
    this.bodyGroup.add(this.rightLeg);

    // 8. Swirling Anime Power Charge Halos & Ground Shock Ring (keeps face 100% clear!)
    this.auraMesh = new THREE.Group();
    const haloMat = new THREE.MeshBasicMaterial({
      color: this.mawashiColor,
      transparent: true,
      opacity: 0.0
    });
    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(this.radius * 1.18, 0.035, 8, 36), haloMat);
    halo1.rotation.x = Math.PI * 0.45;
    halo1.position.y = 0.75;
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(this.radius * 1.02, 0.028, 8, 36), haloMat);
    halo2.rotation.x = -Math.PI * 0.42;
    halo2.position.y = 1.05;
    this.auraMesh.add(halo1);
    this.auraMesh.add(halo2);
    this.auraHaloMat = haloMat;
    this.bodyGroup.add(this.auraMesh);

    const auraRingGeo = new THREE.RingGeometry(0.85, 1.35, 32);
    auraRingGeo.rotateX(-Math.PI / 2);
    const auraRingMat = new THREE.MeshBasicMaterial({
      color: this.mawashiColor,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.auraRingMesh = new THREE.Mesh(auraRingGeo, auraRingMat);
    this.auraRingMesh.position.y = 0.04;
    this.bodyGroup.add(this.auraRingMesh);

    // 9. Glossy Teardrop Anime Sweat Drop (for edge teetering)
    const sweatGroup = new THREE.Group();
    const sweatCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.22, 10),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 })
    );
    sweatCone.position.y = 0.08;
    const sweatBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 10, 10),
      sweatCone.material
    );
    sweatBulb.position.y = -0.03;
    sweatGroup.add(sweatCone);
    sweatGroup.add(sweatBulb);
    sweatGroup.position.set(headRadius * 0.92, 2.25, 0.25);
    sweatGroup.rotation.z = -0.25;
    this.sweatDrop = sweatGroup;
    this.sweatDropMat = sweatCone.material;
    this.bodyGroup.add(this.sweatDrop);

    this.root.add(this.bodyGroup);
  }

  drawFace(state = 'normal') {
    if (this.currentFaceState === state) return;
    this.currentFaceState = state;
    if (this.faceTextureObj && this.faceTextureObj.ctx) {
      ChibiTextureFactory.renderFaceOnCanvas(this.faceTextureObj.ctx, state, this.traitVariant);
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

    // Pulse Champion floor halo if active
    if (this.championRingMesh) {
      const pulse = 1.0 + Math.sin(elapsedTime * 4.5) * 0.06;
      this.championRingMesh.scale.set(pulse, pulse, 1);
      this.championRingMesh.material.opacity = 0.55 + Math.sin(elapsedTime * 4.5) * 0.22;
    }

    // 1. Falling off edge animation
    if (this.isFalling) {
      this.fallProgress += dt;
      this.vel.y -= 24.0 * dt;
      this.pos.addScaledVector(this.vel, dt);
      this.root.position.copy(this.pos);

      if (this.contactShadowMesh) this.contactShadowMesh.visible = false;
      if (this.championRingMesh) this.championRingMesh.visible = false;

      // Comedic tumbling spin
      this.root.rotation.x += 4.5 * dt;
      this.root.rotation.y += 6.0 * dt;
      this.root.rotation.z += 3.5 * dt;

      // Frantic flailing arms
      this.leftArm.rotation.x = Math.sin(elapsedTime * 25) * 1.5;
      this.rightArm.rotation.x = -Math.sin(elapsedTime * 25) * 1.5;

      if (this.pos.y < -22) {
        this.isAlive = false;
        this.scene.remove(this.root);
      }
      return;
    }

    // 2. Teetering near edge animation
    if (this.isTeetering) {
      this.drawFace('shocked');
      this.sweatDropMat.opacity = 0.92;
      this.sweatDrop.position.y = 2.25 + Math.sin(elapsedTime * 12) * 0.08;

      // Unsteady wobble on one foot
      this.bodyGroup.rotation.z = Math.sin(elapsedTime * 14) * 0.24;
      this.bodyGroup.rotation.x = -0.22;
      this.leftArm.rotation.x = Math.sin(elapsedTime * 18) * 1.1;
      this.rightArm.rotation.x = Math.cos(elapsedTime * 18) * 1.1;
    } else {
      this.sweatDropMat.opacity = 0;
    }

    // 3. Stun timer
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0 && !this.isTeetering && !this.isCharging) {
        this.drawFace('normal');
      }
    }

    // Natural Eye Blinking Cycle (~2.4 - 5.2 seconds interval)
    if (!this.isTeetering && !this.isCharging && this.stunTimer <= 0 && this.slapTimer <= 0) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0 && !this.isBlinking) {
        this.isBlinking = true;
        this.blinkDuration = 0.13;
        this.drawFace('blink');
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
      if (Math.random() < 0.42 && this.particles) {
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

    // 6. Charging aura visual & deep Tachiai crouch
    if (this.isCharging) {
      this.drawFace('charging');
      this.auraHaloMat.opacity = 0.55 + this.chargeAmount * 0.40;
      this.auraMesh.rotation.y += 6.5 * dt;
      const s = 1.0 + this.chargeAmount * 0.22 + Math.sin(elapsedTime * 30) * 0.05;
      this.auraMesh.scale.set(s, s, s);

      this.auraRingMesh.material.opacity = 0.45 + this.chargeAmount * 0.4;
      const rs = 0.9 + Math.sin(elapsedTime * 18) * 0.15 + this.chargeAmount * 0.25;
      this.auraRingMesh.scale.set(rs, rs, 1);

      // Deep sumo tachiai squat & forward lean
      this.bodyGroup.position.y = -0.25 * this.chargeAmount;
      this.bodyGroup.position.x = (Math.random() - 0.5) * 0.07 * this.chargeAmount;
      if (!this.isTeetering) {
        this.bodyGroup.rotation.x = 0.22 * this.chargeAmount;
      }

      if (this.particles && Math.random() < 0.5) {
        this.particles.emitChargeSpark(this.pos, this.mawashiColor);
      }
    } else {
      this.auraHaloMat.opacity = 0;
      this.auraRingMesh.material.opacity = 0;
      this.bodyGroup.position.x = 0;
    }

    // 7. Waddling vs. Lively Sumo Idle Breathing Stance
    const speedMagnitude = Math.sqrt(this.vel.x * this.vel.x + this.vel.z * this.vel.z);
    if (speedMagnitude > 0.2 && !this.isTeetering) {
      this.waddleCycle += speedMagnitude * dt * 7.5;

      // Energetic sumo stomp roll & forward drive posture
      this.bodyGroup.rotation.z = Math.sin(this.waddleCycle) * 0.14;
      this.bodyGroup.rotation.y = Math.cos(this.waddleCycle) * 0.09;
      if (!this.isCharging) {
        this.bodyGroup.rotation.x = this.isDashing ? 0.24 : 0.09;
        this.bodyGroup.position.y = Math.abs(Math.sin(this.waddleCycle)) * 0.05;
      }

      // Alternating sumo leg stomps
      this.leftLeg.position.y = Math.max(0, Math.sin(this.waddleCycle)) * 0.19;
      this.rightLeg.position.y = Math.max(0, -Math.sin(this.waddleCycle)) * 0.19;

      // Oichomage fan topknot bounce
      this.topknot.rotation.z = -Math.sin(this.waddleCycle) * 0.26;
      this.topknot.rotation.x = Math.cos(this.waddleCycle * 2) * 0.10;

      // Swaying front Sagari belt fringes
      this.sagariPivots.forEach(sp => {
        sp.pivot.rotation.x = sp.baseTiltX + 0.16 + Math.abs(Math.sin(this.waddleCycle + sp.phase)) * 0.18;
        sp.pivot.rotation.z = Math.sin(this.waddleCycle + sp.phase * 0.4) * 0.18;
      });

      if (Math.sin(this.waddleCycle) > 0.95 && this.particles && Math.random() < 0.3) {
        this.particles.emitDustPuff(this.pos);
      }
    } else if (!this.isTeetering) {
      // Lively Sumo Shikiri Idle Breathing & Knee-Flex Rhythm
      const breath = Math.sin(elapsedTime * 3.2 + this.idlePhase);
      this.bodyGroup.rotation.z = Math.sin(elapsedTime * 1.6 + this.idlePhase) * 0.025;
      this.bodyGroup.rotation.y = Math.cos(elapsedTime * 1.4 + this.idlePhase) * 0.03;
      if (!this.isCharging) {
        this.bodyGroup.rotation.x = 0.03 + breath * 0.02;
        this.bodyGroup.position.y = (breath - 1) * 0.022;
      }

      // Subtle belly breathing expansion
      if (this.bellyMesh) {
        const bPulse = 1.0 + breath * 0.022;
        this.bellyMesh.scale.set(bPulse, 1.0 - breath * 0.01, bPulse);
      }

      this.leftLeg.position.y = 0;
      this.rightLeg.position.y = 0;
      this.topknot.rotation.z = Math.sin(elapsedTime * 2.2 + this.idlePhase) * 0.04;
      this.topknot.rotation.x = breath * 0.04;

      // Gentle Sagari fringe idle sway
      this.sagariPivots.forEach(sp => {
        sp.pivot.rotation.x = sp.baseTiltX + breath * 0.035;
        sp.pivot.rotation.z = Math.sin(elapsedTime * 2.4 + sp.phase) * 0.035;
      });
    }

    // 8. Harite Open-Palm Thrust Slap Animation
    if (this.slapTimer > 0) {
      this.slapTimer -= dt;
      if (this.stunTimer <= 0 && !this.isTeetering && !this.isCharging) {
        this.drawFace(this.slapTimer > 0.05 ? 'slap' : 'normal');
      }
      const slapPhase = Math.sin(elapsedTime * 30);
      const lThrust = Math.max(0, slapPhase);
      const rThrust = Math.max(0, -slapPhase);
      this.leftArm.position.z = 0.05 + lThrust * 0.46;
      this.rightArm.position.z = 0.05 + rThrust * 0.46;
      if (!this.isTeetering) {
        this.leftArm.rotation.x = 0.28 + lThrust * 0.55;
        this.rightArm.rotation.x = 0.28 + rThrust * 0.55;
      }
    } else {
      this.leftArm.position.z = 0.05;
      this.rightArm.position.z = 0.05;
      if (!this.isTeetering) {
        const guardSway = Math.sin(elapsedTime * 3.2 + this.idlePhase) * 0.06;
        this.leftArm.rotation.x = (this.isDashing ? 0.75 : 0.28) + guardSway;
        this.rightArm.rotation.x = (this.isDashing ? 0.75 : 0.28) - guardSway;
      }
    }

    // 9. Root orientation and position
    this.root.rotation.y = this.facingAngle;
    this.root.position.copy(this.pos);
  }
}
