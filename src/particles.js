import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.rockDebris = [];
    this.shockwaves = [];

    // Shared geometries and materials for performance
    this.puffGeo = new THREE.SphereGeometry(0.18, 5, 5);
    this.puffMat = new THREE.MeshBasicMaterial({
      color: 0xeadfcf,
      transparent: true,
      opacity: 0.65
    });

    this.sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffd23f,
      transparent: true,
      opacity: 0.9
    });

    this.starGeo = new THREE.OctahedronGeometry(0.2, 0);

    this.rockGeo = new THREE.DodecahedronGeometry(0.35, 0);
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.9,
      flatShading: true
    });

    this.shockwaveGeo = new THREE.RingGeometry(0.2, 0.5, 32);
    this.shockwaveGeo.rotateX(-Math.PI / 2);
  }

  // Little dust puff when waddling/running
  emitDustPuff(pos) {
    const mesh = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
    mesh.position.set(pos.x + (Math.random() - 0.5) * 0.2, pos.y + 0.1, pos.z + (Math.random() - 0.5) * 0.2);
    const scale = 0.5 + Math.random() * 0.5;
    mesh.scale.set(scale, scale, scale);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6),
      rot: new THREE.Vector3(Math.random() * 2, Math.random() * 2, Math.random() * 2),
      growth: 1.8,
      fadeRate: 1.8,
      life: 1.0
    });
  }

  // Steam / energy sparks when a chibi is charging up a super push
  emitChargeSpark(pos, color = 0xffd23f) {
    const mat = this.sparkMat.clone();
    mat.color.setHex(color);
    const mesh = new THREE.Mesh(this.sparkGeo, mat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.6 + Math.random() * 0.5;
    mesh.position.set(pos.x + Math.cos(angle) * dist, pos.y + 0.1 + Math.random() * 0.3, pos.z + Math.sin(angle) * dist);
    this.scene.add(mesh);

    // Sparks swirl inward and upward toward the chibi center
    const toCenter = new THREE.Vector3(pos.x - mesh.position.x, 1.2, pos.z - mesh.position.z).normalize().multiplyScalar(2.2);

    this.particles.push({
      mesh,
      vel: toCenter,
      rot: new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4),
      growth: 0.2,
      fadeRate: 2.2,
      life: 1.0
    });
  }

  // Comic hit stars and expanding shockwave ring on heavy collision
  emitClashFX(pos, force = 1.0) {
    // 1. Expanding Ground Shockwave Ring
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const shockMesh = new THREE.Mesh(this.shockwaveGeo, shockMat);
    shockMesh.position.set(pos.x, pos.y + 0.05, pos.z);
    this.scene.add(shockMesh);

    this.shockwaves.push({
      mesh: shockMesh,
      scale: 0.3,
      maxScale: 2.2 * Math.min(force, 2.0),
      speed: 8.0,
      opacity: 0.8
    });

    // 2. Comic Impact Stars flying outwards
    const starCount = Math.floor(5 + force * 4);
    for (let i = 0; i < starCount; i++) {
      const starMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xffeb3b : 0xff5722,
        transparent: true,
        opacity: 0.95
      });
      const star = new THREE.Mesh(this.starGeo, starMat);
      star.position.set(pos.x, pos.y + 0.5 + (Math.random() - 0.5) * 0.4, pos.z);
      this.scene.add(star);

      const angle = (i / starCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2.5 + Math.random() * 3.5 * force;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh: star,
        vel,
        rot: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        growth: 0.5,
        fadeRate: 2.5,
        life: 1.0,
        gravity: 6.0
      });
    }
  }

  // Dramatic ring crumbling rock chunks and dust clouds when ring shrinks
  emitRingCrumble(centerPos, fromRadius, toRadius) {
    const chunkCount = 35;
    for (let i = 0; i < chunkCount; i++) {
      const angle = (i / chunkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r = toRadius + (fromRadius - toRadius) * Math.random();
      const x = centerPos.x + Math.cos(angle) * r;
      const z = centerPos.z + Math.sin(angle) * r;

      // 3D rock chunk
      const rock = new THREE.Mesh(this.rockGeo, this.rockMat);
      rock.position.set(x, centerPos.y + 0.1, z);
      const scale = 0.5 + Math.random() * 0.9;
      rock.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
      this.scene.add(rock);

      const outwardDir = new THREE.Vector3(Math.cos(angle), -0.2, Math.sin(angle)).normalize();
      const speed = 1.0 + Math.random() * 2.5;

      this.rockDebris.push({
        mesh: rock,
        vel: new THREE.Vector3(
          outwardDir.x * speed,
          0.5 + Math.random() * 1.5,
          outwardDir.z * speed
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        gravity: 12.0,
        life: 2.5
      });

      // Companion dust puff
      if (i % 2 === 0) {
        this.emitDustPuff(new THREE.Vector3(x, centerPos.y, z));
      }
    }
  }

  update(dt) {
    // 1. Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.fadeRate * dt;

      if (p.gravity) {
        p.vel.y -= p.gravity * dt;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.rot.x * dt;
      p.mesh.rotation.y += p.rot.y * dt;
      p.mesh.rotation.z += p.rot.z * dt;

      if (p.growth) {
        const s = p.mesh.scale.x + p.growth * dt;
        p.mesh.scale.set(s, s, s);
      }

      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.life);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry !== this.puffGeo && p.mesh.geometry !== this.sparkGeo && p.mesh.geometry !== this.starGeo) {
          p.mesh.geometry.dispose();
        }
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 2. Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += sw.speed * dt;
      sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);
      sw.opacity -= 1.8 * dt;
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0 || sw.scale >= sw.maxScale) {
        this.scene.remove(sw.mesh);
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update crumbling rock debris
    for (let i = this.rockDebris.length - 1; i >= 0; i--) {
      const r = this.rockDebris[i];
      r.life -= dt;
      r.vel.y -= r.gravity * dt;
      r.mesh.position.addScaledVector(r.vel, dt);
      r.mesh.rotation.x += r.rotVel.x * dt;
      r.mesh.rotation.y += r.rotVel.y * dt;
      r.mesh.rotation.z += r.rotVel.z * dt;

      if (r.life <= 0 || r.mesh.position.y < -15) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        this.rockDebris.splice(i, 1);
      }
    }
  }

  clear() {
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      if (p.mesh.material) p.mesh.material.dispose();
    });
    this.particles = [];

    this.shockwaves.forEach(sw => {
      this.scene.remove(sw.mesh);
      if (sw.mesh.material) sw.mesh.material.dispose();
    });
    this.shockwaves = [];

    this.rockDebris.forEach(r => {
      this.scene.remove(r.mesh);
    });
    this.rockDebris = [];
  }
}
