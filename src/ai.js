import * as THREE from 'three';
import { sound } from './audio.js';

export class AIController {
  constructor(dohyo) {
    this.dohyo = dohyo;
    // Map of sumo.id -> AI runtime state
    this.states = new Map();
  }

  registerSumo(sumo) {
    this.states.set(sumo.id, {
      state: 'DECIDING',
      targetId: null,
      stateTimer: Math.random() * 0.8,
      chargeBuild: 0,
      turnSpeed: 6.0 * sumo.speed,
      desiredAngle: sumo.facingAngle,
      circleDir: Math.random() > 0.5 ? 1 : -1,
      cooldown: 0.5 + Math.random() * 0.8
    });
  }

  update(sumos, dt) {
    const liveSumos = sumos.filter(s => s.isAlive && !s.isFalling);
    const ringR = this.dohyo.currentRadius;

    liveSumos.forEach(sumo => {
      let ai = this.states.get(sumo.id);
      if (!ai) {
        this.registerSumo(sumo);
        ai = this.states.get(sumo.id);
      }

      if (sumo.stunTimer > 0) return; // Stunned from clash

      ai.stateTimer -= dt;
      if (ai.cooldown > 0) ai.cooldown -= dt;

      const distFromCenter = Math.sqrt(sumo.pos.x * sumo.pos.x + sumo.pos.z * sumo.pos.z);

      // CRITICAL EMERGENCY: If pushed near the rim, urgently seek ring center!
      if (distFromCenter > ringR - 2.0 && !sumo.isDashing) {
        ai.state = 'SEEK_CENTER';
      }

      // State Machine
      switch (ai.state) {
        case 'SEEK_CENTER': {
          // Steer directly towards (0, 0)
          const toCenter = new THREE.Vector2(-sumo.pos.x, -sumo.pos.z).normalize();
          ai.desiredAngle = Math.atan2(toCenter.x, toCenter.y);

          // Full power drive towards center
          const moveSpeed = 4.8 * sumo.speed;
          sumo.vel.x += Math.sin(sumo.facingAngle) * moveSpeed * dt * 8.0;
          sumo.vel.z += Math.cos(sumo.facingAngle) * moveSpeed * dt * 8.0;

          // If safe inside ring, resume normal tactics
          if (distFromCenter < ringR - 2.5) {
            ai.state = 'DECIDING';
            ai.stateTimer = 0.2;
          }
          break;
        }

        case 'DECIDING': {
          // Choose best target
          ai.targetId = this.selectBestTarget(sumo, liveSumos, ringR);
          if (!ai.targetId) {
            ai.state = 'WANDER';
            ai.stateTimer = 1.0;
            break;
          }

          // Decide whether to Charge Dash or Stalk & Push
          const roll = Math.random();
          if (roll < 0.45 * sumo.aggression && ai.cooldown <= 0) {
            ai.state = 'CHARGE_WINDUP';
            ai.stateTimer = 0.4 + Math.random() * 0.45;
            ai.chargeBuild = 0;
            sumo.isCharging = true;
          } else {
            ai.state = 'STALK_TARGET';
            ai.stateTimer = 1.0 + Math.random() * 1.5;
          }
          break;
        }

        case 'STALK_TARGET': {
          const target = liveSumos.find(s => s.id === ai.targetId);
          if (!target || !target.isAlive || target.isFalling) {
            ai.state = 'DECIDING';
            break;
          }

          const dx = target.pos.x - sumo.pos.x;
          const dz = target.pos.z - sumo.pos.z;
          const distToTarget = Math.sqrt(dx * dx + dz * dz);

          // Desired angle: align so sumo pushes target toward the ring rim
          ai.desiredAngle = Math.atan2(dx, dz);

          // Move towards target with waddle velocity
          const moveSpeed = 3.8 * sumo.speed;
          sumo.vel.x += Math.sin(sumo.facingAngle) * moveSpeed * dt * 6.0;
          sumo.vel.z += Math.cos(sumo.facingAngle) * moveSpeed * dt * 6.0;

          // In close quarters, transition to rapid push or charge
          if (distToTarget < 2.2 && ai.cooldown <= 0 && Math.random() < 0.3) {
            ai.state = 'CHARGE_WINDUP';
            ai.stateTimer = 0.35 + Math.random() * 0.3;
            ai.chargeBuild = 0;
            sumo.isCharging = true;
          }

          if (ai.stateTimer <= 0) {
            ai.state = 'DECIDING';
          }
          break;
        }

        case 'CHARGE_WINDUP': {
          const target = liveSumos.find(s => s.id === ai.targetId);
          if (target && target.isAlive) {
            const dx = target.pos.x - sumo.pos.x;
            const dz = target.pos.z - sumo.pos.z;
            ai.desiredAngle = Math.atan2(dx, dz);
          }

          // Build up charge power
          ai.chargeBuild += dt * 2.5;
          sumo.chargeAmount = Math.min(1.0, ai.chargeBuild);

          // Brake during windup
          sumo.vel.multiplyScalar(0.85);

          if (ai.stateTimer <= 0) {
            // UNLEASH SUPER DASH!
            sumo.isCharging = false;
            sumo.isDashing = true;
            sumo.dashTimer = 0.45;
            ai.cooldown = 1.5 / sumo.aggression;

            const dashPower = (8.5 + sumo.chargeAmount * 7.5) * (sumo.speed * 0.75 + 0.35);
            sumo.vel.x = Math.sin(sumo.facingAngle) * dashPower;
            sumo.vel.z = Math.cos(sumo.facingAngle) * dashPower;

            sound.playSuperDash();

            ai.state = 'RECOVER';
            ai.stateTimer = 0.6;
          }
          break;
        }

        case 'RECOVER': {
          if (ai.stateTimer <= 0) {
            ai.state = 'DECIDING';
          }
          break;
        }

        default: {
          ai.state = 'DECIDING';
          break;
        }
      }

      // Smoothly rotate facing angle toward desired angle
      let angleDiff = ai.desiredAngle - sumo.facingAngle;
      // Normalize between -PI and PI
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      sumo.facingAngle += angleDiff * Math.min(1.0, ai.turnSpeed * dt);
    });
  }

  // Tactical target scoring: prioritize sumos close to the edge or nearest
  selectBestTarget(self, liveSumos, ringR) {
    let bestTarget = null;
    let highestScore = -Infinity;

    liveSumos.forEach(other => {
      if (other.id === self.id) return;

      const dx = other.pos.x - self.pos.x;
      const dz = other.pos.z - self.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const otherDistCenter = Math.sqrt(other.pos.x * other.pos.x + other.pos.z * other.pos.z);
      // Edge vulnerability score: sumos close to ring boundary are prime targets!
      const edgeVulnerability = (otherDistCenter / ringR) * 25.0;

      // Distance penalty: closer opponents are easier to engage
      const proximityScore = 30.0 / (dist + 0.5);

      // Mass advantage bonus
      const massScore = (self.mass / other.mass) * 8.0;

      const totalScore = proximityScore + edgeVulnerability + massScore + (Math.random() * 5);

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestTarget = other.id;
      }
    });

    return bestTarget;
  }
}
