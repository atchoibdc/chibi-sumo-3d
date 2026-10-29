import * as THREE from 'three';
import { ChibiTextureFactory } from './chibiTexture.js';
import { SumoModelLoader } from './modelLoader.js';

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export class ChibiSumo {
  constructor(scene, config, particles) {
    this.scene = scene;
    this.particles = particles;
    this.id = config.id;
    this.name = config.name;
    this.title = config.title || 'Sekiwake';
    this.mawashiColor = config.mawashiColor || 0xd90429;
    this.skinColor = config.skinColor || 0xffcbb2;
    this.mass = config.mass || 1.0;
    this.speed = config.speed || 1.0;
    this.aggression = config.aggression || 1.0;
    this.personality = config.personality || 'Balanced';
    this.isChampion = Boolean(config.isChampion);

    // Subtle cosmetic mass proportions while staying faithful to CHIBI SUMO #1 turnaround sheet
    const massNorm = THREE.MathUtils.clamp((this.mass - 0.85) / 0.65, 0, 1);
    this.bellyHeft = 0.96 + massNorm * 0.10;
    this.shoulderHeft = 0.97 + massNorm * 0.07;
    this.traitVariant = this.resolveTraitVariant(this.personality);

    // Physics collision radius (unchanged for fair gameplay)
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
    this.inTPose = false;

    // Natural Eye Blinking Cycle
    this.blinkTimer = 1.8 + Math.random() * 2.6;
    this.isBlinking = false;
    this.blinkDuration = 0;

    // 3D Object Hierarchy
    this.root = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.bellyMesh = null;
    this.headGroup = new THREE.Group();
    this.headBaseY = 2.21;
    this.leftArm = null;
    this.rightArm = null;
    this.leftForeArm = null;
    this.rightForeArm = null;
    this.leftHand = null;
    this.rightHand = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.topknot = null;
    this.topknotBaseRotX = -0.52;
    this.leftBrow = null;
    this.rightBrow = null;
    this.auraMesh = null;
    this.auraRingMesh = null;
    this.faceMesh = null;
    this.faceTextureObj = null;
    this.sweatDrop = null;
    this.championRingMesh = null;
    this.contactShadowMesh = null;
    this.isCustomModel = false;
    this.mixer = null;

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
    // 1. Shared Ground Contact Shadow & Champion Golden Floor Ring
    const shadowGeo = new THREE.CircleGeometry(0.88 * this.bellyHeft, 24);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: ChibiTextureFactory.createContactShadowTexture(),
      transparent: true,
      depthWrite: false
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.position.y = 0.015;
    this.root.add(this.contactShadowMesh);

    // Champion is marked solely by the pulsing golden floor ring beneath their feet
    if (this.isChampion) {
      const champRingGeo = new THREE.RingGeometry(0.98, 1.15, 44);
      champRingGeo.rotateX(-Math.PI / 2);
      const champRingMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.championRingMesh = new THREE.Mesh(champRingGeo, champRingMat);
      this.championRingMesh.position.y = 0.022;
      this.root.add(this.championRingMesh);
    }

    // Shared Combat Aura Halos & Edge-Teetering Sweat Drop
    this.buildCombatFX();

    // 2. Plug-and-Play Custom .glb Model Override (if public/models/chibi-sumo.glb is present)
    const customInstance = SumoModelLoader.createInstance(this.mawashiColor);
    if (customInstance) {
      this.isCustomModel = true;
      this.bodyGroup.add(customInstance.modelGroup);
      if (customInstance.animations && customInstance.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(customInstance.modelGroup);
        const action = this.mixer.clipAction(customInstance.animations[0]);
        action.play();
      }
      this.root.add(this.bodyGroup);
      return;
    }

    // 3. 1:1 Reference-Faithful Procedural Sculpt ("CHIBI SUMO #1 - 3D MODEL REFERENCE")
    const skinBaseColor = ChibiTextureFactory.resolveWarmSkinColor(this.skinColor);
    const warmSubsurface = skinBaseColor.clone().lerp(new THREE.Color(0xff745c), 0.38).multiplyScalar(0.10);

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinBaseColor,
      emissive: warmSubsurface,
      roughness: 0.54,
      metalness: 0.02
    });

    // Natural warm peach-terracotta accent for 3D nose & inner ear hollow (not pink)
    const noseColor = skinBaseColor.clone().lerp(new THREE.Color(0xe8886e), 0.18);
    const noseSkinMat = new THREE.MeshStandardMaterial({
      color: noseColor,
      emissive: noseColor.clone().multiplyScalar(0.08),
      roughness: 0.52,
      metalness: 0.02
    });

    const torsoTexture = ChibiTextureFactory.createTorsoTexture(this.skinColor);
    const torsoSkinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: torsoTexture,
      emissive: warmSubsurface,
      roughness: 0.54,
      metalness: 0.02
    });

    // Matte-satin warm espresso-chocolate brown hair matching reference sheet
    const hairTexture = ChibiTextureFactory.createHairTexture();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: hairTexture,
      roughness: 0.58,
      metalness: 0.03
    });

    const browMat = new THREE.MeshStandardMaterial({
      color: 0x2e211d,
      roughness: 0.68,
      metalness: 0.02
    });

    // Vivid crimson topknot cord band matching CHIBI SUMO #1 across all views
    const motoyuiRedMat = new THREE.MeshStandardMaterial({
      color: 0xc92027,
      roughness: 0.44,
      metalness: 0.06
    });

    // Clean matte-satin folded cloth mawashi material
    const mawashiTexture = ChibiTextureFactory.createMawashiTexture(this.mawashiColor);
    const mawashiMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: mawashiTexture,
      roughness: 0.55,
      metalness: 0.05
    });

    // ================= A. HEAD, FACE, 3D BROWS, PROFILE NOSE, EARS & HAIR =================
    const headRadius = 0.50;
    const headScaleX = 1.07;
    const headScaleY = 0.89;
    const headScaleZ = 1.01;
    const headY = this.headBaseY;

    // Shared skull/cheek/brow/jaw vertex sculpt (identical for headMesh, faceMesh, and hair base)
    const sculptHeadShape = (geo, rRef) => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const ny = vy / rRef;
        const nz = vz / rRef;

        // Plump lower-cheek pear fullness (ny ≈ -0.28)
        const cheekBell = Math.exp(-Math.pow((ny + 0.28) / 0.36, 2));
        const frontCheekBias = smoothstep(-0.25, 0.55, nz);

        // Subtle brow-ridge fullness for crisp Side View profile (ny ≈ +0.32, nz > 0.5)
        const browRidge = 0.030 * Math.exp(-Math.pow((ny - 0.32) / 0.16, 2)) * smoothstep(0.45, 0.90, nz);

        // Plump rounded chin/jaw cushion (ny ≈ -0.80, nz > 0.15)
        const chinFullness = 0.036 * Math.exp(-Math.pow((ny + 0.80) / 0.22, 2)) * smoothstep(0.10, 0.72, nz);

        const sx = headScaleX * (1.0 + 0.085 * cheekBell * frontCheekBias);
        const sy = headScaleY;
        const sz = headScaleZ * (1.0 + 0.048 * cheekBell * frontCheekBias + browRidge + chinFullness);

        pos.setXYZ(i, vx * sx, vy * sy, vz * sz);
      }
      geo.computeVertexNormals();
    };

    // Short sturdy neck tucked cleanly inside upper torso (zero visible cylinder lip in Side/Back views)
    const neckGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.26, 22);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 1.83, 0.01);
    neckMesh.castShadow = true;
    this.bodyGroup.add(neckMesh);

    // Main seamless chibi head
    const headGeo = new THREE.SphereGeometry(headRadius, 48, 36);
    sculptHeadShape(headGeo, headRadius);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = headY;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Concentric Curved Face Shell (wide phiLen=1.60 so eyes remain visible in 90° Side View!)
    this.faceTextureObj = ChibiTextureFactory.createFaceTexture('normal', this.traitVariant);
    const phiLen = 1.60;
    const thetaStart = 0.92;
    const thetaLen = 1.40;
    const faceRadius = headRadius * 1.007;
    const faceGeo = new THREE.SphereGeometry(
      faceRadius,
      36,
      28,
      Math.PI * 0.5 - phiLen * 0.5,
      phiLen,
      thetaStart,
      thetaLen
    );
    sculptHeadShape(faceGeo, faceRadius);
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

    // 3D Sculpted Chunky Capsule Eyebrows (aligned flush over 2D brow shadow for seamless Front + Side 3D relief)
    const create3DBrow = (isLeft) => {
      const side = isLeft ? -1 : 1;
      const browGeo = new THREE.CapsuleGeometry(0.036, 0.118, 8, 12);
      browGeo.rotateZ(Math.PI / 2);
      browGeo.scale(1.0, 1.0, 0.42);
      const bPos = browGeo.attributes.position;
      for (let i = 0; i < bPos.count; i++) {
        const bx = bPos.getX(i);
        const bz = bPos.getZ(i);
        bPos.setZ(i, bz - bx * bx * 1.25);
      }
      browGeo.computeVertexNormals();

      const browMesh = new THREE.Mesh(browGeo, browMat);
      browMesh.position.set(side * 0.165, headY + 0.146, 0.468);
      browMesh.rotation.y = side * 0.30;
      browMesh.rotation.x = -0.20;
      browMesh.rotation.z = side * 0.21;
      browMesh.castShadow = true;
      return browMesh;
    };
    this.leftBrow = create3DBrow(true);
    this.rightBrow = create3DBrow(false);
    this.headGroup.add(this.leftBrow);
    this.headGroup.add(this.rightBrow);

    // 3D Skin-Toned Upturned Profile Nose
    const noseGeo = new THREE.SphereGeometry(0.056, 18, 14);
    const nPos = noseGeo.attributes.position;
    for (let i = 0; i < nPos.count; i++) {
      const x = nPos.getX(i);
      const y = nPos.getY(i);
      const z = nPos.getZ(i);
      const ny = y / 0.056;
      const baseFlare = 1.0 + 0.18 * Math.max(0, -ny);
      const tipLift = z > 0 ? 0.010 * (z / 0.056) : 0;
      nPos.setXYZ(i, x * 1.12 * baseFlare, y * 0.90 + tipLift, z * 1.12);
    }
    noseGeo.computeVertexNormals();
    const noseMesh = new THREE.Mesh(noseGeo, noseSkinMat);
    noseMesh.position.set(0, headY - 0.088, 0.502);
    noseMesh.castShadow = true;
    this.headGroup.add(noseMesh);

    // Sculpted C-Cupped Chibi Ears
    [-1, 1].forEach(side => {
      const earGroup = new THREE.Group();
      const outerEarGeo = new THREE.SphereGeometry(0.118, 16, 14);
      outerEarGeo.scale(0.46, 1.06, 0.86);
      const outerEar = new THREE.Mesh(outerEarGeo, skinMat);
      outerEar.castShadow = true;
      earGroup.add(outerEar);

      const innerEarGeo = new THREE.SphereGeometry(0.072, 12, 10);
      innerEarGeo.scale(0.42, 0.88, 0.72);
      const innerEar = new THREE.Mesh(innerEarGeo, noseSkinMat);
      innerEar.position.set(side * 0.012, -0.008, 0.036);
      earGroup.add(innerEar);

      earGroup.position.set(side * 0.556, headY - 0.022, -0.032);
      earGroup.rotation.y = -side * 0.20;
      earGroup.rotation.z = -side * 0.06;
      this.headGroup.add(earGroup);
    });

    // Watertight Sculpted 3D Hair Subtool:
    // Widow's-peak M-hairline + puffed Bin temple wings + C-ear cutout + tapered lower Tabo back bulb
    const hairGeo = new THREE.SphereGeometry(headRadius, 84, 64);
    hairGeo.rotateY(-Math.PI * 0.5);

    const hPos = hairGeo.attributes.position;
    const unitDirs = new Float32Array(hPos.count * 3);
    for (let i = 0; i < hPos.count; i++) {
      unitDirs[i * 3] = hPos.getX(i) / headRadius;
      unitDirs[i * 3 + 1] = hPos.getY(i) / headRadius;
      unitDirs[i * 3 + 2] = hPos.getZ(i) / headRadius;
    }

    sculptHeadShape(hairGeo, headRadius);

    for (let i = 0; i < hPos.count; i++) {
      const nx = unitDirs[i * 3];
      const ny = unitDirs[i * 3 + 1];
      const nz = unitDirs[i * 3 + 2];
      const absX = Math.abs(nx);

      let x = hPos.getX(i);
      let y = hPos.getY(i);
      let z = hPos.getZ(i);

      // 1. Forehead M-shaped widow's-peak curve
      const browArch = 0.088 * Math.exp(-Math.pow((absX - 0.34) / 0.24, 2));
      const widowDip = -0.055 * Math.exp(-Math.pow(nx / 0.16, 2));
      const templeDrop = -0.56 * Math.pow(Math.max(0, (absX - 0.54) / 0.36), 1.75);
      const frontHairlineY = 0.62 + browArch + widowDip + templeDrop;

      const faceCut = smoothstep(frontHairlineY + 0.048, frontHairlineY - 0.048, ny)
        * smoothstep(0.10, 0.24, nz)
        * smoothstep(0.92, 0.80, absX);

      // 2. Ear C-shaped pocket cutout around (ny = -0.04, nz = -0.06)
      const earDist = Math.hypot((ny + 0.04) / 0.29, (nz + 0.06) / 0.20);
      const earCut = smoothstep(1.08, 0.82, earDist) * smoothstep(0.55, 0.72, absX);

      // 3. Lower cheek / jaw / nape bottom hairline:
      // Keeps lower jaw 100% clear in Front View while sweeping down to nape (ny = -0.80) in Back/Side View
      const bottomHairlineY = 0.00 - 0.80 * smoothstep(0.10, -0.36, nz);
      const sideburnTab = smoothstep(0.76, 0.86, absX)
        * smoothstep(0.06, 0.14, nz)
        * smoothstep(0.28, 0.19, nz)
        * smoothstep(-0.06, 0.03, ny);
      const jawCut = smoothstep(bottomHairlineY + 0.05, bottomHairlineY - 0.05, ny) * (1.0 - 0.85 * sideburnTab);

      const cutAmount = Math.max(faceCut, earCut, jawCut);
      const cov = 1.0 - cutAmount;

      const radialOffset = -0.055 * (1.0 - cov) + 0.040 * cov;
      const rLen = Math.hypot(x, y, z) || 1;
      x += (x / rLen) * radialOffset;
      y += (y / rLen) * radialOffset;
      z += (z / rLen) * radialOffset;

      if (cov > 0.01) {
        // Puffed rounded Bin side-hair lobes above ears
        const binHeight = Math.exp(-Math.pow((ny - 0.26) / 0.32, 2));
        const binSide = smoothstep(0.38, 0.78, absX);
        const binPuff = 0.064 * binHeight * binSide * cov;
        x += Math.sign(nx) * binPuff;
        y += 0.020 * binHeight * binSide * cov;

        // Voluminous rounded back-of-head hair bulb (Tabo) that tapers cleanly inward toward neck
        if (nz < 0.08) {
          const backFactor = smoothstep(0.08, -0.55, nz);
          const bulbVertical = Math.exp(-Math.pow((ny + 0.08) / 0.56, 2));
          const taboDepth = 0.140 * backFactor * bulbVertical * cov;
          z -= taboDepth;

          // Taper lower back hair width below ear level so Front View jaw stays clean & Back View tapers gracefully!
          const lowerNeckTaper = smoothstep(0.06, -0.72, ny) * smoothstep(0.06, -0.25, nz);
          x *= 1.0 - 0.16 * lowerNeckTaper * cov;
        }

        // Delicate sculpted combed strand fluting converging toward crown
        const meridianAngle = Math.atan2(nx, -nz);
        const strandWave = 0.0040 * Math.cos(meridianAngle * 22) * cov * cov * (1.0 - Math.abs(ny) * 0.5);
        x += nx * strandWave;
        z += nz * strandWave;
      }

      hPos.setXYZ(i, x, y, z);
    }
    hairGeo.computeVertexNormals();

    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.y = headY;
    hairMesh.castShadow = true;
    hairMesh.receiveShadow = true;
    this.headGroup.add(hairMesh);

    // Plump Round Backward-Angled Chonmage Bun + Vivid Crimson Motoyui Band
    this.topknot = new THREE.Group();
    this.topknot.position.set(0, headY + 0.435, -0.165);
    this.topknot.rotation.x = this.topknotBaseRotX;

    const tieGeo = new THREE.TorusGeometry(0.146, 0.035, 16, 36);
    tieGeo.scale(1.12, 1.0, 1.04);
    tieGeo.rotateX(Math.PI / 2);
    const tieMesh = new THREE.Mesh(tieGeo, motoyuiRedMat);
    tieMesh.position.set(0, 0.052, 0);
    tieMesh.castShadow = true;
    this.topknot.add(tieMesh);

    const bunGeo = new THREE.SphereGeometry(0.202, 36, 26);
    bunGeo.rotateY(-Math.PI * 0.5);
    const bunPos = bunGeo.attributes.position;
    for (let i = 0; i < bunPos.count; i++) {
      const bx = bunPos.getX(i);
      const by = bunPos.getY(i);
      const bz = bunPos.getZ(i);
      const r = 0.202;
      const nx = bx / r;
      const ny = by / r;
      const nz = bz / r;
      const ang = Math.atan2(nx, -nz);
      const flute = 1.0 + 0.022 * Math.cos(ang * 18) * (1.0 - ny * ny);
      const topDimple = ny > 0.65 ? -0.018 * Math.pow((ny - 0.65) / 0.35, 2) : 0;
      bunPos.setXYZ(i, bx * 1.18 * flute, by * 0.88 + topDimple, bz * 1.08 * flute);
    }
    bunGeo.computeVertexNormals();
    const bunMesh = new THREE.Mesh(bunGeo, hairMat);
    bunMesh.position.set(0, 0.160, 0);
    bunMesh.castShadow = true;
    bunMesh.receiveShadow = true;
    this.topknot.add(bunMesh);

    this.headGroup.add(this.topknot);
    this.bodyGroup.add(this.headGroup);

    // ================= B. UNIFIED S-CURVE TORSO, SMOOTH POTBELLY & SPINE =================
    const torsoGeo = new THREE.SphereGeometry(1.0, 60, 46);
    torsoGeo.rotateY(-Math.PI * 0.5);
    const tPos = torsoGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const nx = tPos.getX(i);
      const ny = tPos.getY(i); // -1 (hips) .. +1 (neck)
      const nz = tPos.getZ(i);
      const absX = Math.abs(nx);

      // Broad, smooth round potbelly curve (no sharp point in Side View!)
      const bellyBulge = Math.exp(-Math.pow((ny + 0.18) / 0.62, 2));
      const chestBroad = Math.exp(-Math.pow((ny - 0.34) / 0.36, 2));

      const rx = (0.64 * this.bellyHeft * (0.93 + 0.11 * bellyBulge))
        + (0.06 * this.shoulderHeft * chestBroad);
      const ry = 0.55; // Spans y = 1.34 ± 0.55 -> [0.79 .. 1.89]

      let zOut;
      if (nz >= 0) {
        const pecPad = 0.026 * Math.exp(-Math.pow((ny - 0.30) / 0.18, 2))
          * Math.exp(-Math.pow((absX - 0.38) / 0.22, 2));
        const sternumIndent = -0.012 * Math.exp(-Math.pow((ny - 0.30) / 0.20, 2))
          * Math.exp(-Math.pow(nx / 0.12, 2));
        const rzFront = 0.45 + (0.26 * this.bellyHeft * bellyBulge) + pecPad + sternumIndent;
        zOut = nz * rzFront + (0.035 * this.bellyHeft * bellyBulge);
      } else {
        const lumbarTuck = 0.055 * Math.exp(-Math.pow((ny + 0.14) / 0.34, 2));
        const spineGroove = 0.026 * Math.exp(-Math.pow(nx / 0.11, 2))
          * smoothstep(-0.30, 0.0, ny) * smoothstep(0.75, 0.45, ny) * (-nz);
        const rzBack = (0.51 * this.bellyHeft - lumbarTuck) * (1.0 - 0.14 * Math.max(0, ny));
        zOut = nz * rzBack + spineGroove;
      }

      tPos.setXYZ(i, nx * rx, ny * ry, zOut);
    }
    torsoGeo.computeVertexNormals();

    this.bellyMesh = new THREE.Mesh(torsoGeo, torsoSkinMat);
    this.bellyMesh.position.set(0, 1.34, 0.02);
    this.bellyMesh.castShadow = true;
    this.bellyMesh.receiveShadow = true;
    this.bodyGroup.add(this.bellyMesh);

    // Natural Bare Glute Cheeks flowing smoothly into back of thighs with clear center cleft for Tate-Mitsu!
    const gluteGeo = new THREE.SphereGeometry(0.232 * this.bellyHeft, 22, 18);
    gluteGeo.scale(1.02, 0.96, 0.88);
    [-1, 1].forEach(side => {
      const glute = new THREE.Mesh(gluteGeo, skinMat);
      glute.position.set(side * 0.245 * this.bellyHeft, 0.72, -0.20 * this.bellyHeft);
      glute.castShadow = true;
      glute.receiveShadow = true;
      this.bodyGroup.add(glute);
    });

    // ================= C. CLEAN TILTED MAWASHI, TATE-MITSU & 4-PETAL X-KNOT =================
    const beltRx = 0.70 * this.bellyHeft;
    const beltRz = 0.61 * this.bellyHeft;
    const beltHeight = 0.40;

    // Forward-tilted folded cloth waistband
    const mawashiGroup = new THREE.Group();
    mawashiGroup.position.set(0, 1.01, 0.03);
    mawashiGroup.rotation.x = 0.115;

    const bandGeo = new THREE.CylinderGeometry(1.0, 1.0, beltHeight, 60, 20, false);
    const bandPos = bandGeo.attributes.position;
    for (let i = 0; i < bandPos.count; i++) {
      const bx = bandPos.getX(i);
      const by = bandPos.getY(i);
      const bz = bandPos.getZ(i);
      const ny = by / (beltHeight * 0.5);
      const radialR = Math.hypot(bx, bz);

      if (radialR > 0.001) {
        const edgeRound = 1.0 - 0.065 * Math.pow(Math.abs(ny), 3.2);
        const midFold = 1.0 - 0.025 * Math.exp(-Math.pow(ny / 0.16, 2));
        const taper = 0.97 + 0.03 * ((ny + 1) * 0.5);
        const profile = edgeRound * midFold * taper;
        bandPos.setXYZ(i, bx * beltRx * profile, by, bz * beltRz * profile);
      } else {
        bandPos.setXYZ(i, 0, by, 0);
      }
    }
    bandGeo.computeVertexNormals();
    const mawashiBand = new THREE.Mesh(bandGeo, mawashiMat);
    mawashiBand.castShadow = true;
    mawashiBand.receiveShadow = true;
    mawashiGroup.add(mawashiBand);
    this.bodyGroup.add(mawashiGroup);

    // Tucked Rounded-Triangular Front Maetate Groin Pouch (flush under front belt between inner thighs!)
    const pouchGeo = new THREE.SphereGeometry(1.0, 28, 22);
    const pPos = pouchGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const nx = pPos.getX(i);
      const ny = pPos.getY(i); // -1 (crotch) .. +1 (tucked inside belt)
      const nz = pPos.getZ(i);
      const widthTaper = 0.11 + 0.13 * smoothstep(-0.85, 0.65, ny);
      const zCurve = 0.08 * smoothstep(-0.85, 0.45, ny);
      pPos.setXYZ(
        i,
        nx * widthTaper * this.bellyHeft,
        ny * 0.21,
        nz * 0.21 * this.bellyHeft + zCurve
      );
    }
    pouchGeo.computeVertexNormals();
    const pouchMesh = new THREE.Mesh(pouchGeo, mawashiMat);
    pouchMesh.position.set(0, 0.67, 0.17 * this.bellyHeft);
    pouchMesh.castShadow = true;
    this.bodyGroup.add(pouchMesh);

    // Rear Vertical Tate-Mitsu Cloth Strap clearly visible right down the center cleft between the glutes!
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.50, -0.02),
      new THREE.Vector3(0, 0.56, -0.28 * this.bellyHeft),
      new THREE.Vector3(0, 0.74, -0.40 * this.bellyHeft),
      new THREE.Vector3(0, 1.00, -0.52 * this.bellyHeft)
    ]);
    const strapGeo = new THREE.TubeGeometry(strapCurve, 24, 0.084 * this.bellyHeft, 14, false);
    strapGeo.scale(1.12, 1.0, 0.72);
    const strapMesh = new THREE.Mesh(strapGeo, mawashiMat);
    strapMesh.castShadow = true;
    this.bodyGroup.add(strapMesh);

    // Rear 4-Petal X-Shaped Flat-Folded Ribbon Knot (Exact Back & Side View reference match, no tails)
    const knotGroup = new THREE.Group();
    knotGroup.position.set(0, 1.09, 0.03 - beltRz - 0.012);
    knotGroup.rotation.x = 0.10;

    const createRibbonPetalGeo = () => {
      const geo = new THREE.SphereGeometry(1.0, 24, 18);
      const gPos = geo.attributes.position;
      for (let i = 0; i < gPos.count; i++) {
        const nx = gPos.getX(i);
        const ny = gPos.getY(i);
        const nz = gPos.getZ(i);

        const u = (ny + 1) * 0.5;
        const boxY = Math.sign(ny) * Math.pow(Math.abs(ny), 0.72);
        const boxX = Math.sign(nx) * Math.pow(Math.abs(nx), 0.78);

        const halfWidth = 0.052 + 0.052 * smoothstep(0.0, 0.85, u);
        const halfThick = 0.044 * (0.80 + 0.25 * Math.sin(u * Math.PI));
        const pleat = nz < 0 ? 0.010 * Math.exp(-Math.pow(nx / 0.35, 2)) * smoothstep(0.15, 0.85, u) : 0;

        gPos.setXYZ(
          i,
          boxX * halfWidth,
          (boxY + 1.0) * 0.145,
          nz * halfThick + pleat - u * 0.018
        );
      }
      geo.computeVertexNormals();
      return geo;
    };

    const petalGeo = createRibbonPetalGeo();
    [
      { rotZ: 0.72, tiltY: -0.10 },
      { rotZ: -0.72, tiltY: 0.10 },
      { rotZ: 2.42, tiltY: -0.10 },
      { rotZ: -2.42, tiltY: 0.10 }
    ].forEach(p => {
      const petal = new THREE.Mesh(petalGeo, mawashiMat);
      petal.rotation.z = p.rotZ;
      petal.rotation.y = p.tiltY;
      petal.castShadow = true;
      knotGroup.add(petal);
    });

    const centerWrapGeo = new THREE.SphereGeometry(1.0, 20, 16);
    const cwPos = centerWrapGeo.attributes.position;
    for (let i = 0; i < cwPos.count; i++) {
      const nx = cwPos.getX(i);
      const ny = cwPos.getY(i);
      const nz = cwPos.getZ(i);
      const bx = Math.sign(nx) * Math.pow(Math.abs(nx), 0.75);
      const by = Math.sign(ny) * Math.pow(Math.abs(ny), 0.75);
      cwPos.setXYZ(i, bx * 0.088, by * 0.135, nz * 0.068 - 0.02);
    }
    centerWrapGeo.computeVertexNormals();
    const centerWrap = new THREE.Mesh(centerWrapGeo, mawashiMat);
    centerWrap.rotation.z = 0.22;
    centerWrap.castShadow = true;
    knotGroup.add(centerWrap);

    this.bodyGroup.add(knotGroup);

    // ================= D. SEAMLESS BARE-WRISTED ARMS & SCULPTED CHIBI HANDS =================
    const shoulderCapGeo = new THREE.SphereGeometry(0.154 * this.shoulderHeft, 18, 14);
    [-1, 1].forEach(side => {
      const sCap = new THREE.Mesh(shoulderCapGeo, skinMat);
      sCap.position.set(side * 0.49 * this.shoulderHeft, 1.65, -0.01);
      sCap.castShadow = true;
      this.bodyGroup.add(sCap);
    });

    const createSculptedHand = (isLeft) => {
      const handGroup = new THREE.Group();
      const side = isLeft ? -1 : 1;
      const palmInward = -side;

      const palmGeo = new THREE.SphereGeometry(0.098, 16, 14);
      palmGeo.scale(0.68, 1.05, 0.96);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      palmMesh.position.set(0, -0.055, 0);
      palmMesh.castShadow = true;
      handGroup.add(palmMesh);

      const thumbGeo = new THREE.CapsuleGeometry(0.029, 0.054, 6, 10);
      const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
      thumbMesh.position.set(palmInward * 0.018, -0.058, 0.084);
      thumbMesh.rotation.x = 0.68;
      thumbMesh.rotation.z = -palmInward * 0.28;
      thumbMesh.castShadow = true;
      handGroup.add(thumbMesh);

      const fingerDefs = [
        { z: 0.050, len: 0.056, r: 0.024 },
        { z: 0.017, len: 0.066, r: 0.025 },
        { z: -0.016, len: 0.058, r: 0.024 },
        { z: -0.047, len: 0.045, r: 0.022 }
      ];
      fingerDefs.forEach(f => {
        const fGeo = new THREE.CapsuleGeometry(f.r, f.len, 6, 8);
        const fMesh = new THREE.Mesh(fGeo, skinMat);
        fMesh.position.set(palmInward * 0.012, -0.135 - f.len * 0.28, f.z);
        fMesh.rotation.z = palmInward * 0.18;
        fMesh.castShadow = true;
        handGroup.add(fMesh);
      });

      return handGroup;
    };

    const buildArm = (isLeft) => {
      const side = isLeft ? -1 : 1;
      const armGroup = new THREE.Group();

      // Continuous CapsuleGeometry upper arm (stays full across shoulder & elbow joints without pinching!)
      const upperGeo = new THREE.CapsuleGeometry(0.148 * this.shoulderHeft, 0.24, 10, 18);
      const uPos = upperGeo.attributes.position;
      for (let i = 0; i < uPos.count; i++) {
        const x = uPos.getX(i);
        const y = uPos.getY(i); // +0.268 .. -0.268
        const z = uPos.getZ(i);
        const t = THREE.MathUtils.clamp((0.20 - y) / 0.40, 0, 1); // 0 shoulder -> 1 elbow
        const taper = 1.04 - 0.12 * t;
        uPos.setXYZ(i, x * taper, y - 0.12, z * taper * 0.96);
      }
      upperGeo.computeVertexNormals();
      const upperMesh = new THREE.Mesh(upperGeo, skinMat);
      upperMesh.castShadow = true;
      armGroup.add(upperMesh);

      // Continuous CapsuleGeometry forearm tapering smoothly to a bare wrist (zero bead pinch, zero wrist tape!)
      const foreGroup = new THREE.Group();
      foreGroup.position.set(0, -0.28, 0);

      const foreGeo = new THREE.CapsuleGeometry(0.132, 0.22, 10, 18);
      const fPos = foreGeo.attributes.position;
      for (let i = 0; i < fPos.count; i++) {
        const x = fPos.getX(i);
        const y = fPos.getY(i);
        const z = fPos.getZ(i);
        const t = THREE.MathUtils.clamp((0.18 - y) / 0.36, 0, 1); // 0 elbow -> 1 wrist
        const forearmTaper = 1.03 - 0.24 * t + 0.05 * Math.sin(t * Math.PI);
        fPos.setXYZ(i, x * forearmTaper, y - 0.13, z * forearmTaper * 0.95);
      }
      foreGeo.computeVertexNormals();
      const foreMesh = new THREE.Mesh(foreGeo, skinMat);
      foreMesh.castShadow = true;
      foreGroup.add(foreMesh);

      const hand = createSculptedHand(isLeft);
      hand.position.set(0, -0.29, 0);
      foreGroup.add(hand);

      armGroup.add(foreGroup);
      armGroup.position.set(side * 0.53 * this.shoulderHeft, 1.66, -0.01);

      if (isLeft) {
        this.leftForeArm = foreGroup;
        this.leftHand = hand;
      } else {
        this.rightForeArm = foreGroup;
        this.rightHand = hand;
      }

      return armGroup;
    };

    this.leftArm = buildArm(true);
    this.rightArm = buildArm(false);
    this.bodyGroup.add(this.leftArm);
    this.bodyGroup.add(this.rightArm);
    this.applyDefaultArmStance();

    // ================= E. STRAIGHT STURDY BARE LEGS & FLAT-PLANTED 5-TOED FEET =================
    const createSculptedFoot = (isLeft) => {
      const footGroup = new THREE.Group();
      const innerSign = isLeft ? 1 : -1;

      const footGeo = new THREE.SphereGeometry(1.0, 22, 16);
      const ftPos = footGeo.attributes.position;
      for (let i = 0; i < ftPos.count; i++) {
        const nx = ftPos.getX(i);
        const ny = ftPos.getY(i);
        const nz = ftPos.getZ(i);
        const yScaled = ny < 0 ? 0.068 + ny * 0.065 : 0.068 + ny * 0.095 * (1.0 - 0.28 * Math.max(0, nz));
        const xWidth = 0.176 * (1.0 + 0.08 * Math.max(0, nz));
        const zLen = nz >= 0 ? nz * 0.24 : nz * 0.18;
        ftPos.setXYZ(i, nx * xWidth, Math.max(0.002, yScaled), zLen + 0.04);
      }
      footGeo.computeVertexNormals();
      const footMesh = new THREE.Mesh(footGeo, skinMat);
      footMesh.castShadow = true;
      footMesh.receiveShadow = true;
      footGroup.add(footMesh);

      const toeDefs = [
        { x: 0.122 * innerSign, r: 0.044, z: 0.275 },
        { x: 0.061 * innerSign, r: 0.039, z: 0.290 },
        { x: 0.002 * innerSign, r: 0.037, z: 0.292 },
        { x: -0.055 * innerSign, r: 0.035, z: 0.282 },
        { x: -0.108 * innerSign, r: 0.032, z: 0.264 }
      ];
      toeDefs.forEach(toe => {
        const toeGeo = new THREE.SphereGeometry(toe.r, 12, 10);
        const tp = toeGeo.attributes.position;
        for (let i = 0; i < tp.count; i++) {
          const ty = tp.getY(i);
          tp.setY(i, ty < 0 ? ty * 0.35 : ty * 0.85);
          tp.setZ(i, tp.getZ(i) * 1.18);
        }
        toeGeo.computeVertexNormals();
        const toeMesh = new THREE.Mesh(toeGeo, skinMat);
        toeMesh.position.set(toe.x, 0.036, toe.z);
        toeMesh.castShadow = true;
        footGroup.add(toeMesh);
      });

      return footGroup;
    };

    const buildLeg = (isLeft) => {
      const side = isLeft ? -1 : 1;
      const legGroup = new THREE.Group();

      // Continuous CapsuleGeometry leg tapering straight from plump upper thigh down to bare ankle
      const legGeo = new THREE.CapsuleGeometry(0.19, 0.52, 12, 22);
      const lPos = legGeo.attributes.position;
      for (let i = 0; i < lPos.count; i++) {
        const x = lPos.getX(i);
        const y = lPos.getY(i); // -0.45 .. +0.45
        const z = lPos.getZ(i);
        const u = THREE.MathUtils.clamp((y + 0.38) / 0.76, 0, 1); // 0 ankle -> 1 hip
        const rScale = (0.72 + 0.62 * Math.pow(u, 0.90)) * this.shoulderHeft;
        const calfBack = z < 0 ? 0.022 * Math.sin(u * Math.PI) : 0;
        lPos.setXYZ(i, x * rScale, y + 0.50, z * rScale * 0.96 - calfBack);
      }
      legGeo.computeVertexNormals();
      const legMesh = new THREE.Mesh(legGeo, skinMat);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      legGroup.add(legMesh);

      const foot = createSculptedFoot(isLeft);
      foot.rotation.y = side * 0.04;
      legGroup.add(foot);

      legGroup.position.set(side * 0.33 * this.bellyHeft, 0, -0.01);
      return legGroup;
    };

    this.leftLeg = buildLeg(true);
    this.rightLeg = buildLeg(false);
    this.bodyGroup.add(this.leftLeg);
    this.bodyGroup.add(this.rightLeg);

    this.root.add(this.bodyGroup);
  }

  buildCombatFX() {
    this.auraMesh = new THREE.Group();
    const haloMat = new THREE.MeshBasicMaterial({
      color: this.mawashiColor,
      transparent: true,
      opacity: 0.0
    });
    const halo1 = new THREE.Mesh(new THREE.TorusGeometry(this.radius * 1.15, 0.035, 8, 36), haloMat);
    halo1.rotation.x = Math.PI * 0.45;
    halo1.position.y = 0.95;
    const halo2 = new THREE.Mesh(new THREE.TorusGeometry(this.radius * 0.98, 0.028, 8, 36), haloMat);
    halo2.rotation.x = -Math.PI * 0.42;
    halo2.position.y = 1.30;
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
    sweatGroup.position.set(0.58, 2.52, 0.25);
    sweatGroup.rotation.z = -0.25;
    this.sweatDrop = sweatGroup;
    this.sweatDropMat = sweatCone.material;
    this.bodyGroup.add(this.sweatDrop);
  }

  // Toggle between exact orthographic reference T-pose (for turnaround inspection) and natural sumo ready stance
  setTPose(enabled = true) {
    this.inTPose = Boolean(enabled);
    if (!this.leftArm || !this.rightArm) return;
    if (this.inTPose) {
      this.leftArm.rotation.set(0, 0, -1.48);
      this.rightArm.rotation.set(0, 0, 1.48);
      if (this.leftForeArm) this.leftForeArm.rotation.set(0, 0, 0);
      if (this.rightForeArm) this.rightForeArm.rotation.set(0, 0, 0);
      if (this.leftHand) this.leftHand.rotation.set(0, 0, 0);
      if (this.rightHand) this.rightHand.rotation.set(0, 0, 0);
      this.bodyGroup.rotation.set(0, 0, 0);
      this.bodyGroup.position.set(0, 0, 0);
    } else {
      this.applyDefaultArmStance();
    }
  }

  applyDefaultArmStance() {
    if (!this.leftArm || !this.rightArm) return;
    this.leftArm.rotation.set(-0.26, 0, -0.56);
    this.rightArm.rotation.set(-0.26, 0, 0.56);
    if (this.leftForeArm) this.leftForeArm.rotation.set(-0.48, 0, 0.24);
    if (this.rightForeArm) this.rightForeArm.rotation.set(-0.48, 0, -0.24);
    if (this.leftHand) this.leftHand.rotation.set(-0.18, 0, 0);
    if (this.rightHand) this.rightHand.rotation.set(-0.18, 0, 0);
  }

  sync3DBrows(state) {
    if (!this.leftBrow || !this.rightBrow) return;
    const hy = this.headBaseY;
    if (state === 'falling') {
      this.leftBrow.visible = false;
      this.rightBrow.visible = false;
    } else if (state === 'shocked') {
      this.leftBrow.visible = true;
      this.rightBrow.visible = true;
      this.leftBrow.position.y = hy + 0.195;
      this.rightBrow.position.y = hy + 0.195;
      this.leftBrow.rotation.z = 0.10;
      this.rightBrow.rotation.z = -0.10;
    } else if (state === 'charging' || state === 'slap') {
      this.leftBrow.visible = true;
      this.rightBrow.visible = true;
      this.leftBrow.position.y = hy + 0.135;
      this.rightBrow.position.y = hy + 0.135;
      this.leftBrow.rotation.z = -0.32;
      this.rightBrow.rotation.z = 0.32;
    } else {
      this.leftBrow.visible = true;
      this.rightBrow.visible = true;
      this.leftBrow.position.y = hy + 0.146;
      this.rightBrow.position.y = hy + 0.146;
      this.leftBrow.rotation.z = -0.21;
      this.rightBrow.rotation.z = 0.21;
    }
  }

  drawFace(state = 'normal') {
    if (this.currentFaceState === state) return;
    this.currentFaceState = state;
    this.sync3DBrows(state);
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

    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Pulse Champion floor halo if active
    if (this.championRingMesh) {
      const pulse = 1.0 + Math.sin(elapsedTime * 4.5) * 0.06;
      this.championRingMesh.scale.set(pulse, pulse, 1);
      this.championRingMesh.material.opacity = 0.56 + Math.sin(elapsedTime * 4.5) * 0.22;
    }

    if (this.inTPose) {
      this.root.rotation.y = this.facingAngle;
      this.root.position.copy(this.pos);
      return;
    }

    // 1. Falling off edge animation
    if (this.isFalling) {
      this.fallProgress += dt;
      this.vel.y -= 24.0 * dt;
      this.pos.addScaledVector(this.vel, dt);
      this.root.position.copy(this.pos);

      if (this.contactShadowMesh) this.contactShadowMesh.visible = false;
      if (this.championRingMesh) this.championRingMesh.visible = false;

      this.root.rotation.x += 4.5 * dt;
      this.root.rotation.y += 6.0 * dt;
      this.root.rotation.z += 3.5 * dt;

      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = Math.sin(elapsedTime * 25) * 1.4;
        this.rightArm.rotation.x = -Math.sin(elapsedTime * 25) * 1.4;
      }

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
      this.sweatDrop.position.y = 2.52 + Math.sin(elapsedTime * 12) * 0.08;

      this.bodyGroup.rotation.z = Math.sin(elapsedTime * 14) * 0.24;
      this.bodyGroup.rotation.x = -0.22;
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = -0.6 + Math.sin(elapsedTime * 18) * 0.9;
        this.rightArm.rotation.x = -0.6 + Math.cos(elapsedTime * 18) * 0.9;
      }
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

    // Natural Eye Blinking Cycle
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

    // 7. Waddling vs. Sumo Idle Breathing Stance
    const speedMagnitude = Math.sqrt(this.vel.x * this.vel.x + this.vel.z * this.vel.z);
    if (speedMagnitude > 0.2 && !this.isTeetering) {
      this.waddleCycle += speedMagnitude * dt * 7.5;

      this.bodyGroup.rotation.z = Math.sin(this.waddleCycle) * 0.13;
      this.bodyGroup.rotation.y = Math.cos(this.waddleCycle) * 0.08;
      if (!this.isCharging) {
        this.bodyGroup.rotation.x = this.isDashing ? 0.22 : 0.08;
        this.bodyGroup.position.y = Math.abs(Math.sin(this.waddleCycle)) * 0.05;
      }

      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.position.y = Math.max(0, Math.sin(this.waddleCycle)) * 0.18;
        this.rightLeg.position.y = Math.max(0, -Math.sin(this.waddleCycle)) * 0.18;
      }

      if (this.topknot) {
        this.topknot.rotation.z = -Math.sin(this.waddleCycle) * 0.18;
        this.topknot.rotation.x = this.topknotBaseRotX + Math.cos(this.waddleCycle * 2) * 0.08;
      }

      if (Math.sin(this.waddleCycle) > 0.95 && this.particles && Math.random() < 0.3) {
        this.particles.emitDustPuff(this.pos);
      }
    } else if (!this.isTeetering) {
      const breath = Math.sin(elapsedTime * 3.0 + this.idlePhase);
      this.bodyGroup.rotation.z = Math.sin(elapsedTime * 1.5 + this.idlePhase) * 0.02;
      this.bodyGroup.rotation.y = Math.cos(elapsedTime * 1.3 + this.idlePhase) * 0.025;
      if (!this.isCharging) {
        this.bodyGroup.rotation.x = 0.02 + breath * 0.015;
        this.bodyGroup.position.y = (breath - 1) * 0.018;
      }

      if (this.bellyMesh) {
        const bPulse = 1.0 + breath * 0.018;
        this.bellyMesh.scale.set(bPulse, 1.0 - breath * 0.008, bPulse);
      }

      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.position.y = 0;
        this.rightLeg.position.y = 0;
      }

      if (this.topknot) {
        this.topknot.rotation.z = Math.sin(elapsedTime * 2.0 + this.idlePhase) * 0.03;
        this.topknot.rotation.x = this.topknotBaseRotX + breath * 0.03;
      }
    }

    // 8. Harite Open-Palm Thrust Slap Animation
    if (this.leftArm && this.rightArm) {
      if (this.slapTimer > 0) {
        this.slapTimer -= dt;
        if (this.stunTimer <= 0 && !this.isTeetering && !this.isCharging) {
          this.drawFace(this.slapTimer > 0.05 ? 'slap' : 'normal');
        }
        const slapPhase = Math.sin(elapsedTime * 30);
        const lThrust = Math.max(0, slapPhase);
        const rThrust = Math.max(0, -slapPhase);
        this.leftArm.position.z = -0.01 + lThrust * 0.34;
        this.rightArm.position.z = -0.01 + rThrust * 0.34;
        if (!this.isTeetering) {
          this.leftArm.rotation.x = -0.55 - lThrust * 0.65;
          this.rightArm.rotation.x = -0.55 - rThrust * 0.65;
        }
      } else {
        this.leftArm.position.z = -0.01;
        this.rightArm.position.z = -0.01;
        if (!this.isTeetering) {
          const guardSway = Math.sin(elapsedTime * 3.0 + this.idlePhase) * 0.05;
          const baseForward = this.isDashing ? -0.82 : -0.26;
          this.leftArm.rotation.x = baseForward + guardSway;
          this.rightArm.rotation.x = baseForward - guardSway;
        }
      }
    }

    // 9. Root orientation and position
    this.root.rotation.y = this.facingAngle;
    this.root.position.copy(this.pos);
  }
}
