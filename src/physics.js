import * as THREE from 'three';
import { sound } from './audio.js';

export class SumoPhysics {
  constructor(dohyo, particles, onEliminationCallback) {
    this.dohyo = dohyo;
    this.particles = particles;
    this.onEliminationCallback = onEliminationCallback;

    // Last attacker mapping for kill credit
    this.lastAttackerMap = new Map();
  }

  update(sumos, dt) {
    const liveSumos = sumos.filter(s => s.isAlive && !s.isFalling);

    // 1. Sumo vs Sumo Collision Resolution
    for (let i = 0; i < liveSumos.length; i++) {
      for (let j = i + 1; j < liveSumos.length; j++) {
        this.resolveCollision(liveSumos[i], liveSumos[j]);
      }
    }

    // 2. Movement, Ring Boundary, & Teeter/Fall Checks
    for (let i = 0; i < sumos.length; i++) {
      const sumo = sumos[i];
      if (!sumo.isAlive) continue;

      if (!sumo.isFalling) {
        // Integrate horizontal velocity
        sumo.pos.x += sumo.vel.x * dt;
        sumo.pos.z += sumo.vel.z * dt;

        // Ground friction & damping
        const friction = sumo.isDashing ? 0.96 : 0.90;
        sumo.vel.x *= Math.pow(friction, dt * 60);
        sumo.vel.z *= Math.pow(friction, dt * 60);

        // Ring Boundary Check
        const distFromCenter = Math.sqrt(sumo.pos.x * sumo.pos.x + sumo.pos.z * sumo.pos.z);
        const ringR = this.dohyo.currentRadius;

        // Check if teetering on the edge (danger zone)
        if (distFromCenter > ringR - 1.2 && distFromCenter <= ringR + 0.85) {
          sumo.isTeetering = true;
          // Apply teeter drag and inward balancing effort
          sumo.vel.multiplyScalar(0.92);
          if (distFromCenter > 0.001) {
            sumo.vel.x -= (sumo.pos.x / distFromCenter) * 4.0 * dt;
            sumo.vel.z -= (sumo.pos.z / distFromCenter) * 4.0 * dt;
          }
        } else if (distFromCenter <= ringR - 1.2) {
          sumo.isTeetering = false;
        }

        // Check if pushed completely off the ring!
        if (distFromCenter > ringR + 0.85) {
          this.triggerFall(sumo);
        }
      }
    }
  }

  resolveCollision(s1, s2) {
    const dx = s2.pos.x - s1.pos.x;
    const dz = s2.pos.z - s1.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = s1.radius + s2.radius;

    if (dist < minDist && dist > 0.001) {
      // Normal vector from s1 to s2
      const nx = dx / dist;
      const nz = dz / dist;

      // Overlap separation
      const overlap = minDist - dist;
      const totalMass = s1.mass + s2.mass;
      const m1Ratio = s2.mass / totalMass;
      const m2Ratio = s1.mass / totalMass;

      s1.pos.x -= nx * overlap * m1Ratio;
      s1.pos.z -= nz * overlap * m1Ratio;
      s2.pos.x += nx * overlap * m2Ratio;
      s2.pos.z += nz * overlap * m2Ratio;

      // Relative velocity along collision normal
      const kx = s1.vel.x - s2.vel.x;
      const kz = s1.vel.z - s2.vel.z;
      const relVel = kx * nx + kz * nz;

      // Only resolve if moving towards each other
      if (relVel > 0) {
        // Base impulse with elasticity
        const restitution = 0.75;
        let impulse = (1 + restitution) * relVel / (1 / s1.mass + 1 / s2.mass);

        // Power boost if someone was charging / dashing
        let force1 = 1.0;
        let force2 = 1.0;

        if (s1.isDashing) {
          impulse *= 1.6;
          force2 *= 1.8;
          this.lastAttackerMap.set(s2.id, s1.id);
          s2.stunTimer = 0.35;
          s2.drawFace('shocked');
        }
        if (s2.isDashing) {
          impulse *= 1.6;
          force1 *= 1.8;
          this.lastAttackerMap.set(s1.id, s2.id);
          s1.stunTimer = 0.35;
          s1.drawFace('shocked');
        }

        // Apply impulse
        s1.vel.x -= (impulse / s1.mass) * nx * force1;
        s1.vel.z -= (impulse / s1.mass) * nz * force1;
        s2.vel.x += (impulse / s2.mass) * nx * force2;
        s2.vel.z += (impulse / s2.mass) * nz * force2;

        // Comedic Harite Slaps
        s1.slapTimer = 0.35;
        s2.slapTimer = 0.35;

        // Squash-and-stretch belly bounce
        const intensity = Math.min(Math.abs(impulse) / 10.0 + 0.5, 2.5);
        s1.applySquash(1.2 + intensity * 0.1, 0.75 - intensity * 0.08, 1.2 + intensity * 0.1);
        s2.applySquash(1.2 + intensity * 0.1, 0.75 - intensity * 0.08, 1.2 + intensity * 0.1);

        // Sound & Clash Juice
        sound.playBellyBump(intensity);

        const contactX = s1.pos.x + nx * s1.radius;
        const contactZ = s1.pos.z + nz * s1.radius;
        this.particles.emitClashFX(new THREE.Vector3(contactX, 0.5, contactZ), intensity);
      }
    }
  }

  triggerFall(sumo) {
    if (sumo.isFalling) return;
    sumo.isFalling = true;
    sumo.isTeetering = false;
    sumo.drawFace('falling');

    // Give a little outward push as they tumble
    const outwardDir = new THREE.Vector3(sumo.pos.x, 0, sumo.pos.z).normalize();
    sumo.vel.x = outwardDir.x * 3.5;
    sumo.vel.z = outwardDir.z * 3.5;
    sumo.vel.y = 1.8; // Little comedic hop before the plunge

    // Fall sound effect
    sound.playFall();

    // Check who pushed them
    const killerId = this.lastAttackerMap.get(sumo.id);

    // Call elimination callback
    if (this.onEliminationCallback) {
      this.onEliminationCallback(sumo, killerId);
    }
  }
}
