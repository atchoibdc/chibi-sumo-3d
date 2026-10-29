import * as THREE from 'three';

export class Dohyo {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.group = new THREE.Group();

    // Radius progression: starts large, shrinks as wrestlers are eliminated
    this.initialRadius = 16.0;
    this.currentRadius = this.initialRadius;
    this.targetRadius = this.initialRadius;
    this.isShrinking = false;
    this.shrinkSpeed = 1.4;
    this.height = 1.15;

    // Visual elements
    this.platformMesh = null;
    this.islandCollarGroup = null;
    this.tawaraBorderGroup = null;
    this.warningRingMesh = null;
    this.floatingIslets = [];
    this.noboriBanners = [];
    this.floatingClouds = [];
    this.floatingLanterns = [];
    this.sakuraPetals = [];
    this.strawTexture = null;

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.strawTexture = this.createStrawTexture();
    this.createMainPlatform();
    this.createTawaraBorder(this.currentRadius);
    this.createShikiriSen();
    this.createWarningRing();
    this.createEnvironmentDecorations();
    this.createSakuraPetals();
  }

  createStrawTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e7b965';
    ctx.fillRect(0, 0, 128, 128);

    // Braided golden rice-straw fibers
    for (let y = 0; y < 128; y += 4) {
      ctx.strokeStyle = y % 8 === 0 ? 'rgba(255, 240, 190, 0.55)' : 'rgba(165, 110, 38, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y + 3);
      ctx.stroke();
    }

    // Dark rope bindings across bale
    ctx.fillStyle = '#3d2616';
    ctx.fillRect(0, 22, 128, 9);
    ctx.fillRect(0, 60, 128, 9);
    ctx.fillRect(0, 98, 128, 9);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createNoboriTexture(kanjiText, primaryHex, accentHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = primaryHex;
    ctx.fillRect(0, 0, 128, 360);

    // Festive diagonal bottom waves / stripes
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.moveTo(0, 275);
    ctx.lineTo(128, 245);
    ctx.lineTo(128, 290);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffd166';
    ctx.fillRect(0, 0, 128, 18);
    ctx.fillRect(0, 342, 128, 18);
    ctx.fillRect(8, 0, 5, 360);
    ctx.fillRect(115, 0, 5, 360);

    // White crest circle at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(64, 54, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 54, 17, 0, Math.PI * 2);
    ctx.stroke();

    // Vertical Japanese Sumo Kanji
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px "Yuji Boku", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 4;

    const chars = Array.from(kanjiText);
    const startY = 118;
    const stepY = chars.length > 3 ? 44 : 54;
    chars.forEach((ch, idx) => {
      ctx.fillText(ch, 64, startY + idx * stepY);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createMainPlatform() {
    // 1. Vibrant Sunlit Golden-Terracotta Sacred Clay Texture
    const clayTopGeo = new THREE.CylinderGeometry(this.initialRadius, this.initialRadius * 1.03, this.height, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 512);
    grad.addColorStop(0.0, '#fadfb6');
    grad.addColorStop(0.55, '#eec184');
    grad.addColorStop(0.84, '#dda05d');
    grad.addColorStop(0.95, '#f5ebd6'); // Sacred white-sand janome outer ring!
    grad.addColorStop(1.0, '#c68343');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine warm sand speckles for rich tactile feel
    for (let i = 0; i < 3500; i++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 248, 230, 0.24)' : 'rgba(165, 100, 42, 0.16)';
      ctx.fillRect(sx, sy, 2.2, 2.2);
    }

    // Concentric raked sand ripples
    ctx.strokeStyle = 'rgba(165, 102, 42, 0.18)';
    ctx.lineWidth = 2.5;
    for (let r = 72; r < 465; r += 24) {
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Subtle sacred shrine ring motif in center
    ctx.strokeStyle = 'rgba(217, 4, 41, 0.16)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(512, 512, 58, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 209, 102, 0.28)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(512, 512, 46, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    const clayMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0.04
    });

    // Warm sunlit terracotta/sandstone side wall
    const sideWallMat = new THREE.MeshStandardMaterial({
      color: 0xc88d55,
      roughness: 0.78
    });

    const materials = [sideWallMat, clayMat, sideWallMat];
    this.platformMesh = new THREE.Mesh(clayTopGeo, materials);
    this.platformMesh.position.y = -this.height / 2;
    this.platformMesh.receiveShadow = true;
    this.group.add(this.platformMesh);

    // 2. Stepped Emerald-Green Grassy Shrine Terrace & Floating Cliff Collar (scales smoothly with platformMesh!)
    this.islandCollarGroup = new THREE.Group();

    // Vermilion & Gold Shrine Waist Trim around the clay tier
    const lacquerBandGeo = new THREE.CylinderGeometry(this.initialRadius * 1.018, this.initialRadius * 1.028, 0.28, 64);
    const lacquerBandMat = new THREE.MeshStandardMaterial({
      color: 0xe01e37,
      roughness: 0.35,
      metalness: 0.14
    });
    const lacquerBand = new THREE.Mesh(lacquerBandGeo, lacquerBandMat);
    lacquerBand.position.y = -0.45;
    this.islandCollarGroup.add(lacquerBand);

    // Wide Lush Emerald-Green Grass Terrace framing the sacred Dohyo
    const grassTerraceGeo = new THREE.CylinderGeometry(this.initialRadius * 1.10, this.initialRadius * 1.05, 0.72, 64);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3ec34d,
      emissive: 0x1b4332,
      emissiveIntensity: 0.12,
      roughness: 0.74
    });
    const grassTerrace = new THREE.Mesh(grassTerraceGeo, grassMat);
    grassTerrace.position.y = -this.height - 0.36;
    grassTerrace.receiveShadow = true;
    this.islandCollarGroup.add(grassTerrace);

    // Tapered cliff rock shelf directly beneath grass terrace
    const upperCliffGeo = new THREE.CylinderGeometry(this.initialRadius * 1.04, this.initialRadius * 0.30, 5.2, 18);
    const cliffRockMat = new THREE.MeshStandardMaterial({
      color: 0x8a725e,
      roughness: 0.88,
      flatShading: true
    });
    const upperCliff = new THREE.Mesh(upperCliffGeo, cliffRockMat);
    upperCliff.position.y = -this.height - 0.72 - 2.6;
    upperCliff.receiveShadow = true;
    this.islandCollarGroup.add(upperCliff);

    this.group.add(this.islandCollarGroup);

    // 3. Narrow Central Floating Spire Root (safe inside minRadius=5.5 so falling sumos never hit it)
    const spireGeo = new THREE.ConeGeometry(4.6, 8.8, 11);
    spireGeo.rotateX(Math.PI);
    const spireMesh = new THREE.Mesh(spireGeo, cliffRockMat);
    spireMesh.position.y = -this.height - 7.8;
    this.group.add(spireMesh);
  }

  // Traditional braided golden straw bales (tawara) lining the perimeter
  createTawaraBorder(radius) {
    if (this.tawaraBorderGroup) {
      this.group.remove(this.tawaraBorderGroup);
    }

    this.tawaraBorderGroup = new THREE.Group();
    const baleCount = Math.floor(radius * 3.5);
    const baleGeo = new THREE.CapsuleGeometry(0.22, 0.42, 6, 12);
    baleGeo.rotateZ(Math.PI / 2);

    const baleMat = new THREE.MeshStandardMaterial({
      map: this.strawTexture,
      roughness: 0.82
    });

    for (let i = 0; i < baleCount; i++) {
      const angle = (i / baleCount) * Math.PI * 2;
      const mesh = new THREE.Mesh(baleGeo, baleMat);
      mesh.position.set(
        Math.cos(angle) * (radius - 0.24),
        0.09,
        Math.sin(angle) * (radius - 0.24)
      );
      mesh.rotation.y = -angle + Math.PI * 0.5; // Tangential end-to-end ring alignment!
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.tawaraBorderGroup.add(mesh);
    }

    this.group.add(this.tawaraBorderGroup);
  }

  createShikiriSen() {
    // Glossy white raised starting lines with crisp vermilion trim
    const trimGeo = new THREE.BoxGeometry(2.56, 0.018, 0.30);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });

    const lineGeo = new THREE.BoxGeometry(2.44, 0.028, 0.22);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });

    [-1.65, 1.65].forEach(zPos => {
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(0, 0.012, zPos);
      trim.receiveShadow = true;
      this.group.add(trim);

      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(0, 0.020, zPos);
      line.receiveShadow = true;
      this.group.add(line);
    });
  }

  createWarningRing() {
    const ringGeo = new THREE.RingGeometry(this.currentRadius - 0.52, this.currentRadius - 0.26, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3b5c,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.warningRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.warningRingMesh.position.y = 0.025;
    this.group.add(this.warningRingMesh);
  }

  // Helper: Build a lush blossoming 3D Sakura (Cherry Blossom) tree
  buildSakuraTree(scale = 1.0) {
    const tree = new THREE.Group();

    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x4f342a,
      roughness: 0.88,
      flatShading: true
    });

    // Curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 2.6, 8);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 1.25;
    trunk.rotation.z = 0.10;
    trunk.castShadow = true;
    tree.add(trunk);

    // Branches
    const branchDefs = [
      { pos: [-0.45, 2.35, 0.15], rot: [0.2, 0, 0.55], len: 1.4 },
      { pos: [0.50, 2.45, -0.15], rot: [-0.2, 0, -0.50], len: 1.5 },
      { pos: [0.05, 2.65, 0.35], rot: [0.45, 0, -0.10], len: 1.2 }
    ];
    branchDefs.forEach(b => {
      const bGeo = new THREE.CylinderGeometry(0.10, 0.18, b.len, 7);
      const bMesh = new THREE.Mesh(bGeo, barkMat);
      bMesh.position.set(...b.pos);
      bMesh.rotation.set(...b.rot);
      bMesh.castShadow = true;
      tree.add(bMesh);
    });

    // Multi-tone vibrant spring Sakura blossom clusters
    const blossomPalette = [0xff758f, 0xff8fa3, 0xffb3c6, 0xffccd5, 0xffe5ec];
    const puffCoords = [
      [0, 3.55, 0, 1.35],
      [-0.95, 3.05, 0.25, 1.08],
      [1.05, 3.15, -0.20, 1.12],
      [-0.45, 3.35, -0.65, 0.98],
      [0.45, 3.25, 0.72, 1.02],
      [-1.35, 2.75, -0.15, 0.82],
      [1.38, 2.85, 0.28, 0.85],
      [0.0, 3.85, 0.30, 0.90],
      [-0.55, 2.85, 0.78, 0.80]
    ];

    puffCoords.forEach(([px, py, pz, rad], idx) => {
      const bColor = blossomPalette[idx % blossomPalette.length];
      const puffMat = new THREE.MeshStandardMaterial({
        color: bColor,
        emissive: bColor,
        emissiveIntensity: 0.14,
        roughness: 0.72,
        flatShading: true
      });
      const puffGeo = new THREE.DodecahedronGeometry(rad, 1);
      puffGeo.scale(1.15, 0.82, 1.12);
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(px, py, pz);
      puff.rotation.set(idx * 0.5, idx * 0.8, 0);
      puff.castShadow = true;
      tree.add(puff);
    });

    tree.scale.setScalar(scale);
    return tree;
  }

  // Helper: Build a Floating Grassy Rock Islet Base
  buildFloatingRockBase(topRadius = 3.6, depth = 5.4) {
    const isletBase = new THREE.Group();

    // Lush emerald meadow pad
    const grassGeo = new THREE.CylinderGeometry(topRadius, topRadius * 1.05, 0.65, 14);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3ec34d,
      emissive: 0x1b4332,
      emissiveIntensity: 0.10,
      roughness: 0.76,
      flatShading: true
    });
    const grassPad = new THREE.Mesh(grassGeo, grassMat);
    grassPad.position.y = -0.30;
    grassPad.receiveShadow = true;
    isletBase.add(grassPad);

    // Scattered pink fallen blossom carpet patches on grass
    const petalPatchMat = new THREE.MeshBasicMaterial({
      color: 0xffb3c6,
      transparent: true,
      opacity: 0.65
    });
    for (let i = 0; i < 4; i++) {
      const pGeo = new THREE.CircleGeometry(0.45 + Math.random() * 0.45, 8);
      pGeo.rotateX(-Math.PI / 2);
      const patch = new THREE.Mesh(pGeo, petalPatchMat);
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const r = topRadius * (0.35 + Math.random() * 0.35);
      patch.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
      isletBase.add(patch);
    }

    // Faceted warm sandstone spire beneath grass
    const rockGeo = new THREE.ConeGeometry(topRadius * 1.04, depth, 9);
    rockGeo.rotateX(Math.PI);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8a725e,
      roughness: 0.88,
      flatShading: true
    });
    const rockSpire = new THREE.Mesh(rockGeo, rockMat);
    rockSpire.position.y = -0.60 - depth * 0.5;
    isletBase.add(rockSpire);

    return isletBase;
  }

  createEnvironmentDecorations() {
    const lacquerRedMat = new THREE.MeshStandardMaterial({
      color: 0xe01e37,
      roughness: 0.34,
      metalness: 0.12
    });
    const slateRoofMat = new THREE.MeshStandardMaterial({
      color: 0x252b42,
      roughness: 0.42,
      metalness: 0.20
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.18,
      roughness: 0.28,
      metalness: 0.68
    });

    // 1. Four Corner Floating Sakura Shrine Islets with Pillars, Tassels, Nobori Banners & Sakura Trees
    const corners = [
      { angle: Math.PI * 0.25, tassel: 0x0096ff, bannerBg: '#0077b6', bannerAccent: '#00b4d8', kanji: '大相撲', treeOffset: [1.5, -1.2] },
      { angle: Math.PI * 0.75, tassel: 0xff0054, bannerBg: '#d90429', bannerAccent: '#ff4d6d', kanji: '天下泰平', treeOffset: [-1.5, -1.1] },
      { angle: Math.PI * 1.25, tassel: 0xf8f9fa, bannerBg: '#f77f00', bannerAccent: '#fcbf49', kanji: '満員御礼', treeOffset: [-1.4, 1.3] },
      { angle: Math.PI * 1.75, tassel: 0x8338ec, bannerBg: '#7209b7', bannerAccent: '#b5179e', kanji: '横綱決戦', treeOffset: [1.4, 1.3] }
    ];

    const poleGeo = new THREE.CylinderGeometry(0.28, 0.34, 6.4, 14);
    const collarGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 14);
    const roofGeo = new THREE.ConeGeometry(1.05, 0.72, 4);
    roofGeo.rotateY(Math.PI / 4);

    corners.forEach((c, idx) => {
      const islet = new THREE.Group();
      const dist = 24.5;
      const baseY = -0.6 + (idx % 2) * 0.4;
      islet.position.set(Math.cos(c.angle) * dist, baseY, Math.sin(c.angle) * dist);

      // Grassy floating rock base
      islet.add(this.buildFloatingRockBase(3.6, 5.4));

      // Shrine Pillar facing center
      const pillarGroup = new THREE.Group();
      const inwardAngle = Math.atan2(-islet.position.x, -islet.position.z);
      pillarGroup.position.set(Math.sin(inwardAngle) * 1.1, 0, Math.cos(inwardAngle) * 1.1);
      pillarGroup.rotation.y = inwardAngle;

      const pole = new THREE.Mesh(poleGeo, lacquerRedMat);
      pole.position.y = 3.2;
      pole.castShadow = true;
      pillarGroup.add(pole);

      // Gold ornamental pillar collars
      [0.25, 3.2, 6.1].forEach(cy => {
        const col = new THREE.Mesh(collarGeo, goldTrimMat);
        col.position.y = cy;
        pillarGroup.add(col);
      });

      // Temple rooflet & gold finial
      const roof = new THREE.Mesh(roofGeo, slateRoofMat);
      roof.position.y = 6.65;
      pillarGroup.add(roof);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), goldTrimMat);
      finial.position.y = 7.10;
      pillarGroup.add(finial);

      // Traditional directional silk tassel (Fusa)
      const tasselGeo = new THREE.CylinderGeometry(0.12, 0.28, 2.0, 12);
      const tasselMat = new THREE.MeshStandardMaterial({ color: c.tassel, roughness: 0.35 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.position.set(0, 4.7, 0.52);
      pillarGroup.add(tassel);

      // Warm glowing festival lantern hanging toward arena
      const lanternGeo = new THREE.CapsuleGeometry(0.28, 0.36, 8, 12);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xff9f1c,
        emissiveIntensity: 0.65,
        roughness: 0.38
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(0, 3.2, 0.62);
      pillarGroup.add(lantern);

      islet.add(pillarGroup);

      // Waving Nobori Sumo Tournament Banner
      const bannerHolder = new THREE.Group();
      bannerHolder.position.set(-Math.sin(inwardAngle) * 0.4, 0, -Math.cos(inwardAngle) * 0.4);
      bannerHolder.rotation.y = inwardAngle;

      const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.65 });
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.6, 8), bambooMat);
      flagPole.position.y = 2.8;
      bannerHolder.add(flagPole);

      const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8), bambooMat);
      crossBar.rotation.z = Math.PI / 2;
      crossBar.position.set(0.62, 5.5, 0);
      bannerHolder.add(crossBar);

      const flagTex = this.createNoboriTexture(c.kanji, c.bannerBg, c.bannerAccent);
      const flagGeo = new THREE.PlaneGeometry(1.22, 3.4, 4, 8);
      // Shift pivot to left edge (along the pole) so wind rotation ripples cleanly
      flagGeo.translate(0.62, -1.7, 0);
      const flagMat = new THREE.MeshStandardMaterial({
        map: flagTex,
        roughness: 0.55,
        side: THREE.DoubleSide
      });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.02, 5.48, 0);
      flagMesh.castShadow = true;
      bannerHolder.add(flagMesh);
      islet.add(bannerHolder);

      this.noboriBanners.push({
        mesh: flagMesh,
        basePositions: flagGeo.attributes.position.array.slice(),
        phase: idx * 1.4
      });

      // Blossoming Sakura Tree on the islet
      const sakura = this.buildSakuraTree(0.95 + (idx % 2) * 0.12);
      sakura.position.set(c.treeOffset[0], 0, c.treeOffset[1]);
      sakura.rotation.y = idx * 1.5;
      islet.add(sakura);

      this.group.add(islet);
      this.floatingIslets.push({
        group: islet,
        baseY,
        phase: idx * 1.55,
        bobAmp: 0.28
      });
    });

    // 2. Grand Northern Vermilion Torii Gate Shrine Islet (frames the default Action Camera horizon!)
    const toriiIslet = new THREE.Group();
    const toriiBaseY = 1.6;
    toriiIslet.position.set(0, toriiBaseY, -25.8);
    toriiIslet.scale.setScalar(1.14);
    toriiIslet.add(this.buildFloatingRockBase(5.8, 7.6));

    // Build Classic Vermilion Shrine Torii Gate
    const toriiGroup = new THREE.Group();
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.8 });

    [-2.4, 2.4].forEach(tx => {
      // Black pedestal stone
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.55, 12), darkStoneMat);
      ped.position.set(tx, 0.25, 0);
      toriiGroup.add(ped);

      // Tall vermilion hashira column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 6.8, 16), lacquerRedMat);
      col.position.set(tx, 3.6, 0);
      col.castShadow = true;
      toriiGroup.add(col);
    });

    // Lower Nuki crossbeam
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.42, 0.36), lacquerRedMat);
    nuki.position.set(0, 5.4, 0);
    nuki.castShadow = true;
    toriiGroup.add(nuki);

    // Upper Shimaki & Kasagi lintel with upturned shrine eaves
    const shimaki = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.36, 0.52), lacquerRedMat);
    shimaki.position.set(0, 6.75, 0);
    toriiGroup.add(shimaki);

    const kasagi = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.32, 0.66), slateRoofMat);
    kasagi.position.set(0, 7.08, 0);
    toriiGroup.add(kasagi);

    // Upturned Kasagi wing tips
    [-3.95, 3.95].forEach(wx => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.66), slateRoofMat);
      wing.position.set(wx + Math.sign(wx) * 0.25, 7.22, 0);
      wing.rotation.z = Math.sign(wx) * 0.28;
      toriiGroup.add(wing);
    });

    // Center Gakuzuka gold-framed shrine tablet
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.15, 0.44), darkStoneMat);
    tablet.position.set(0, 6.08, 0);
    toriiGroup.add(tablet);

    const tabletFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.92, 0.48), goldTrimMat);
    tabletFrame.position.set(0, 6.08, 0);
    toriiGroup.add(tabletFrame);

    toriiIslet.add(toriiGroup);

    // Flanking Twin Blossoming Sakura Trees & Stone Lanterns on Torii Islet
    [-3.9, 3.9].forEach((sx, sIdx) => {
      const tree = this.buildSakuraTree(1.08);
      tree.position.set(sx, 0, -0.8);
      tree.rotation.y = sIdx === 0 ? 0.6 : -0.8;
      toriiIslet.add(tree);
    });

    [-1.6, 1.6].forEach(lx => {
      const toro = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 8), darkStoneMat);
      post.position.y = 0.55;
      toro.add(post);

      const lightBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffaa00, emissiveIntensity: 0.75 })
      );
      lightBox.position.y = 1.30;
      toro.add(lightBox);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.35, 4), darkStoneMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = 1.68;
      toro.add(cap);

      toro.position.set(lx, 0, 2.2);
      toriiIslet.add(toro);
    });

    this.group.add(toriiIslet);
    this.floatingIslets.push({
      group: toriiIslet,
      baseY: toriiBaseY,
      phase: 0.7,
      bobAmp: 0.22
    });

    // 3. Sunlit Fluffy White Cumulus Clouds across the Blue Sky
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.28,
      roughness: 0.86,
      metalness: 0.0
    });

    for (let i = 0; i < 26; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numPuffs; j++) {
        const rad = 2.2 + Math.random() * 3.4;
        const puffGeo = new THREE.SphereGeometry(rad, 12, 10);
        puffGeo.scale(1.22, 0.78, 1.05);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (j - (numPuffs - 1) / 2) * 2.6,
          (Math.random() - 0.3) * 1.1,
          (Math.random() - 0.5) * 2.2
        );
        cloudGroup.add(puff);
      }

      const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.20;
      const isHighSky = i % 3 === 0;
      const dist = isHighSky ? (50.0 + Math.random() * 28.0) : (38.0 + Math.random() * 24.0);
      const yPos = isHighSky ? (3.5 + Math.random() * 9.0) : (-12.5 + Math.random() * 6.0);

      cloudGroup.position.set(Math.cos(angle) * dist, yPos, Math.sin(angle) * dist);
      cloudGroup.rotation.y = -angle + Math.PI / 2;
      this.group.add(cloudGroup);

      this.floatingClouds.push({
        group: cloudGroup,
        speed: 0.03 + Math.random() * 0.05,
        angle,
        dist
      });
    }

    // 4. Festive Red-and-Gold Chochin Paper Lanterns hovering cheerfully
    for (let i = 0; i < 10; i++) {
      const lanternGroup = new THREE.Group();
      const isCrimson = i % 2 === 0;
      const lanternBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 10),
        new THREE.MeshStandardMaterial({
          color: isCrimson ? 0xff2a5f : 0xffbe0b,
          emissive: isCrimson ? 0xff0044 : 0xff8800,
          emissiveIntensity: 0.45,
          roughness: 0.45
        })
      );
      lanternBody.scale.set(1, 1.25, 1);
      lanternGroup.add(lanternBody);

      const capGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.10, 10);
      const topCap = new THREE.Mesh(capGeo, slateRoofMat);
      topCap.position.y = 0.52;
      lanternGroup.add(topCap);

      const botCap = new THREE.Mesh(capGeo, slateRoofMat);
      botCap.position.y = -0.52;
      lanternGroup.add(botCap);

      const angle = (i / 10) * Math.PI * 2 + 0.15;
      const dist = this.initialRadius * 1.34 + (i % 3) * 1.4;
      lanternGroup.position.set(
        Math.cos(angle) * dist,
        1.8 + (i % 4) * 0.9,
        Math.sin(angle) * dist
      );
      this.group.add(lanternGroup);

      this.floatingLanterns.push({
        mesh: lanternGroup,
        baseY: lanternGroup.position.y,
        bobSpeed: 1.4 + Math.random() * 0.9,
        rotSpeed: 0.35 + Math.random() * 0.4,
        phase: i * 0.8
      });
    }
  }

  // 5. Gentle Spring Breeze Drifting Sakura Petals
  createSakuraPetals() {
    const petalGeo = new THREE.PlaneGeometry(0.22, 0.14);
    const petalColors = [0xff8fab, 0xffb3c6, 0xffe5ec];
    const petalMats = petalColors.map(
      col =>
        new THREE.MeshBasicMaterial({
          color: col,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88
        })
    );

    for (let i = 0; i < 55; i++) {
      const mesh = new THREE.Mesh(petalGeo, petalMats[i % petalMats.length]);
      mesh.position.set(
        (Math.random() - 0.5) * 52,
        0.5 + Math.random() * 14,
        (Math.random() - 0.5) * 52
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.group.add(mesh);

      this.sakuraPetals.push({
        mesh,
        velX: 1.1 + Math.random() * 1.2,
        velY: -(0.45 + Math.random() * 0.55),
        velZ: 0.35 + (Math.random() - 0.5) * 0.8,
        swirlFreq: 1.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // Trigger ring reduction when a sumo falls
  shrinkTo(newRadius) {
    if (newRadius >= this.currentRadius) return;
    const oldRadius = this.currentRadius;
    this.targetRadius = Math.max(newRadius, 4.0);
    this.isShrinking = true;

    if (this.particles) {
      this.particles.emitRingCrumble(new THREE.Vector3(0, 0, 0), oldRadius, this.targetRadius);
    }
  }

  reset() {
    this.currentRadius = this.initialRadius;
    this.targetRadius = this.initialRadius;
    this.isShrinking = false;
    this.platformMesh.scale.set(1, 1, 1);
    if (this.islandCollarGroup) {
      this.islandCollarGroup.scale.set(1, 1, 1);
    }
    this.createTawaraBorder(this.initialRadius);
    this.updateWarningRing(this.initialRadius);
  }

  updateWarningRing(radius) {
    if (!this.warningRingMesh) return;
    const s = radius / this.initialRadius;
    this.warningRingMesh.scale.set(s, s, s);
  }

  update(dt, elapsedTime) {
    // 1. Smoothly shrink platform & mossy cliff collar together
    if (this.isShrinking) {
      this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, this.targetRadius, dt * this.shrinkSpeed);

      const s = this.currentRadius / this.initialRadius;
      this.platformMesh.scale.set(s, 1.0, s);
      if (this.islandCollarGroup) {
        this.islandCollarGroup.scale.set(s, 1.0, s);
      }
      if (this.tawaraBorderGroup) {
        this.tawaraBorderGroup.scale.set(s, 1.0, s);
      }

      this.updateWarningRing(this.currentRadius);

      if (Math.abs(this.currentRadius - this.targetRadius) < 0.05) {
        this.currentRadius = this.targetRadius;
        this.isShrinking = false;
        if (this.tawaraBorderGroup) {
          this.tawaraBorderGroup.scale.set(1.0, 1.0, 1.0);
        }
        this.createTawaraBorder(this.currentRadius);
      }
    }

    // 2. Animate danger warning ring pulse
    if (this.warningRingMesh) {
      this.warningRingMesh.material.opacity = 0.24 + 0.20 * Math.sin(elapsedTime * 6.0);
    }

    // 3. Gentle floating motion on outer Sakura Shrine islets
    this.floatingIslets.forEach(isl => {
      isl.group.position.y = isl.baseY + Math.sin(elapsedTime * 1.15 + isl.phase) * isl.bobAmp;
    });

    // 4. Ripple Nobori sumo tournament flags in the breeze
    this.noboriBanners.forEach(nb => {
      const posAttr = nb.mesh.geometry.attributes.position;
      const base = nb.basePositions;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        // Ripple increases with distance from flagpole (bx: 0 .. 1.24)
        const wave = Math.sin(elapsedTime * 4.8 - bx * 3.5 + by * 0.9 + nb.phase) * 0.14 * (bx / 1.24);
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
    });

    // 5. Drift sunlit cumulus clouds
    this.floatingClouds.forEach(c => {
      c.angle += c.speed * dt * 0.14;
      c.group.position.x = Math.cos(c.angle) * c.dist;
      c.group.position.z = Math.sin(c.angle) * c.dist;
      c.group.rotation.y = -c.angle + Math.PI / 2;
    });

    // 6. Animate hovering paper lanterns
    this.floatingLanterns.forEach(l => {
      l.mesh.position.y = l.baseY + Math.sin(elapsedTime * l.bobSpeed + l.phase) * 0.35;
      l.mesh.rotation.y += l.rotSpeed * dt;
    });

    // 7. Swirl ambient Sakura blossom petals across the sky
    this.sakuraPetals.forEach(p => {
      p.mesh.position.x += (p.velX + Math.sin(elapsedTime * p.swirlFreq + p.phase) * 0.65) * dt;
      p.mesh.position.y += p.velY * dt;
      p.mesh.position.z += (p.velZ + Math.cos(elapsedTime * p.swirlFreq + p.phase) * 0.65) * dt;

      p.mesh.rotation.x += 1.8 * dt;
      p.mesh.rotation.y += 2.2 * dt;
      p.mesh.rotation.z += 1.4 * dt;

      // Wrap petals back upwind / overhead when drifting out of bounds
      if (p.mesh.position.y < -4.0 || p.mesh.position.x > 28.0) {
        p.mesh.position.x = -26.0 + Math.random() * 14.0;
        p.mesh.position.y = 10.0 + Math.random() * 6.0;
        p.mesh.position.z = (Math.random() - 0.5) * 48.0;
      }
    });
  }
}
