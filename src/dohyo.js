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
    this.height = 3.5; // Raised platform height

    // Visual elements
    this.platformMesh = null;
    this.tawaraBorderGroup = null;
    this.warningRingMesh = null;
    this.cornerPolesGroup = null;
    this.floatingClouds = [];
    this.floatingLanterns = [];

    // Concentric ring tiers for physical drop/crumble
    this.ringTiers = [];

    this.init();
    this.scene.add(this.group);
  }

  init() {
    this.createMainPlatform();
    this.createTawaraBorder(this.currentRadius);
    this.createShikiriSen();
    this.createWarningRing();
    this.createEnvironmentDecorations();
  }

  createMainPlatform() {
    // 1. Clay top surface
    const clayTopGeo = new THREE.CylinderGeometry(this.initialRadius, this.initialRadius * 1.04, this.height, 64);
    
    // Procedural sand/clay canvas texture for the ring
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Sand clay base gradient
    const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
    grad.addColorStop(0, '#e8c99e');
    grad.addColorStop(0.7, '#d6ad7a');
    grad.addColorStop(0.95, '#bc915a');
    grad.addColorStop(1.0, '#8f6535');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle rake rings (sand ripples)
    ctx.strokeStyle = 'rgba(140, 95, 45, 0.2)';
    ctx.lineWidth = 3;
    for (let r = 80; r < 500; r += 28) {
      ctx.beginPath();
      ctx.arc(512, 512, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Two white starting lines (shikiri-sen) in texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(512 - 70, 512 - 90, 140, 14);
    ctx.fillRect(512 - 70, 512 + 76, 140, 14);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const clayMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.05
    });

    const baseStoneMat = new THREE.MeshStandardMaterial({
      color: 0x4a3b32,
      roughness: 0.95,
      flatShading: true
    });

    const materials = [baseStoneMat, clayMat, baseStoneMat];
    this.platformMesh = new THREE.Mesh(clayTopGeo, materials);
    this.platformMesh.position.y = -this.height / 2;
    this.platformMesh.receiveShadow = true;
    this.group.add(this.platformMesh);

    // Stone foundation pedestal below
    const foundationGeo = new THREE.CylinderGeometry(this.initialRadius * 1.05, this.initialRadius * 0.7, 8.0, 16);
    foundationGeo.rotateY(Math.PI / 16);
    const foundationMat = new THREE.MeshStandardMaterial({
      color: 0x2b221d,
      roughness: 0.9,
      flatShading: true
    });
    const foundationMesh = new THREE.Mesh(foundationGeo, foundationMat);
    foundationMesh.position.y = -this.height - 4.0;
    foundationMesh.receiveShadow = true;
    this.group.add(foundationMesh);
  }

  // Traditional straw bales (tawara) lining the perimeter
  createTawaraBorder(radius) {
    if (this.tawaraBorderGroup) {
      this.group.remove(this.tawaraBorderGroup);
    }

    this.tawaraBorderGroup = new THREE.Group();
    const baleCount = Math.floor(radius * 3.4);
    const baleGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 8);
    baleGeo.rotateZ(Math.PI / 2);

    const baleMat = new THREE.MeshStandardMaterial({
      color: 0xd4a359,
      roughness: 0.9
    });

    for (let i = 0; i < baleCount; i++) {
      const angle = (i / baleCount) * Math.PI * 2;
      const mesh = new THREE.Mesh(baleGeo, baleMat);
      mesh.position.set(Math.cos(angle) * (radius - 0.25), 0.08, Math.sin(angle) * (radius - 0.25));
      mesh.rotation.y = -angle;
      mesh.castShadow = true;
      this.tawaraBorderGroup.add(mesh);
    }

    this.group.add(this.tawaraBorderGroup);
  }

  createShikiriSen() {
    // 3D raised white starting lines
    const lineGeo = new THREE.BoxGeometry(2.4, 0.02, 0.22);
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4
    });

    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.position.set(0, 0.015, -1.6);
    line1.receiveShadow = true;
    this.group.add(line1);

    const line2 = new THREE.Mesh(lineGeo, lineMat);
    line2.position.set(0, 0.015, 1.6);
    line2.receiveShadow = true;
    this.group.add(line2);
  }

  createWarningRing() {
    // Glowing neon red/gold danger boundary ring
    const ringGeo = new THREE.RingGeometry(this.currentRadius - 0.2, this.currentRadius + 0.1, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4d4d,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.warningRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.warningRingMesh.position.y = 0.03;
    this.group.add(this.warningRingMesh);
  }

  createEnvironmentDecorations() {
    // 1. Four corner festival pillars with traditional colors:
    // East: Blue/Green (Aofusa), South: Red (Akafusa), West: White (Shirofusa), North: Black/Purple (Kurofusa)
    const corners = [
      { angle: Math.PI * 0.25, color: 0x3a86ff, name: 'East/Ao' },
      { angle: Math.PI * 0.75, color: 0xff006e, name: 'South/Aka' },
      { angle: Math.PI * 1.25, color: 0xffffff, name: 'West/Shiro' },
      { angle: Math.PI * 1.75, color: 0x8338ec, name: 'North/Kuro' }
    ];

    this.cornerPolesGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.28, 0.35, 7.0, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5 }); // Lacquered vermilion red

    const roofGeo = new THREE.ConeGeometry(0.8, 0.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });

    corners.forEach(c => {
      const poleHolder = new THREE.Group();
      const dist = this.initialRadius * 1.25;
      poleHolder.position.set(Math.cos(c.angle) * dist, 1.5, Math.sin(c.angle) * dist);

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.castShadow = true;
      poleHolder.add(pole);

      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 3.6;
      poleHolder.add(roof);

      // Hanging silk tassel
      const tasselGeo = new THREE.CylinderGeometry(0.12, 0.28, 2.2, 8);
      const tasselMat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.3 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.position.y = 2.0;
      poleHolder.add(tassel);

      // Warm glowing lantern on each pole
      const lanternGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.65, 8);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffa500,
        emissiveIntensity: 0.6,
        roughness: 0.4
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(0, 1.2, 0.5);
      poleHolder.add(lantern);

      this.cornerPolesGroup.add(poleHolder);
    });
    this.group.add(this.cornerPolesGroup);

    // 2. Scenic floating clouds below the island
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xedf2f4,
      transparent: true,
      opacity: 0.45
    });
    for (let i = 0; i < 18; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numPuffs; j++) {
        const puffGeo = new THREE.SphereGeometry(2.0 + Math.random() * 3.0, 7, 7);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((j - numPuffs / 2) * 2.5, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2.0);
        cloudGroup.add(puff);
      }
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 24.0 + Math.random() * 18.0;
      cloudGroup.position.set(
        Math.cos(angle) * dist,
        -10.0 - Math.random() * 8.0,
        Math.sin(angle) * dist
      );
      this.group.add(cloudGroup);
      this.floatingClouds.push({
        group: cloudGroup,
        speed: 0.05 + Math.random() * 0.08,
        angle: angle,
        dist: dist
      });
    }

    // 3. Floating celebratory paper lanterns slowly hovering around
    for (let i = 0; i < 8; i++) {
      const lanternGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xff5400,
        emissive: 0xff3b00,
        emissiveIntensity: 0.7,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(lanternGeo, lanternMat);
      const angle = (i / 8) * Math.PI * 2;
      const dist = this.initialRadius * 1.45 + Math.random() * 2.0;
      mesh.position.set(Math.cos(angle) * dist, 1.0 + Math.random() * 3.5, Math.sin(angle) * dist);
      this.group.add(mesh);
      this.floatingLanterns.push({
        mesh,
        baseY: mesh.position.y,
        angle,
        dist,
        bobSpeed: 1.5 + Math.random(),
        rotSpeed: 0.3 + Math.random() * 0.5
      });
    }
  }

  // Trigger ring reduction when a sumo falls
  shrinkTo(newRadius) {
    if (newRadius >= this.currentRadius) return;
    const oldRadius = this.currentRadius;
    this.targetRadius = Math.max(newRadius, 4.0);
    this.isShrinking = true;

    // Trigger physical crumbling debris along the outer rim being shed
    if (this.particles) {
      this.particles.emitRingCrumble(new THREE.Vector3(0, 0, 0), oldRadius, this.targetRadius);
    }
  }

  reset() {
    this.currentRadius = this.initialRadius;
    this.targetRadius = this.initialRadius;
    this.isShrinking = false;
    this.platformMesh.scale.set(1, 1, 1);
    this.createTawaraBorder(this.initialRadius);
    this.updateWarningRing(this.initialRadius);
  }

  updateWarningRing(radius) {
    if (!this.warningRingMesh) return;
    const s = radius / this.initialRadius;
    this.warningRingMesh.scale.set(s, s, s);
  }

  update(dt, elapsedTime) {
    // 1. Smoothly shrink platform if shrinking active
    if (this.isShrinking) {
      this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, this.targetRadius, dt * this.shrinkSpeed);

      // Re-scale platform top and straw bales inward together
      const s = this.currentRadius / this.initialRadius;
      this.platformMesh.scale.set(s, 1.0, s);
      if (this.tawaraBorderGroup) {
        this.tawaraBorderGroup.scale.set(s, 1.0, s);
      }

      this.updateWarningRing(this.currentRadius);

      // If near target, snap and rebuild tawara border
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
      const pulse = 0.3 + 0.25 * Math.sin(elapsedTime * 6.0);
      this.warningRingMesh.material.opacity = pulse;
    }

    // 3. Animate scenic floating clouds
    this.floatingClouds.forEach(c => {
      c.angle += c.speed * dt * 0.15;
      c.group.position.x = Math.cos(c.angle) * c.dist;
      c.group.position.z = Math.sin(c.angle) * c.dist;
    });

    // 4. Animate hovering paper lanterns
    this.floatingLanterns.forEach(l => {
      l.mesh.position.y = l.baseY + Math.sin(elapsedTime * l.bobSpeed) * 0.4;
      l.mesh.rotation.y += l.rotSpeed * dt;
    });
  }
}
