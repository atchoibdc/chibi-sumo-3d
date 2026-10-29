import * as THREE from 'three';

export class SpectatorCamera {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Modes: 'action', 'orbit', 'follow', 'topdown'
    this.mode = 'action';
    this.targetSumo = null;

    // Camera smoothing targets
    this.currentPos = new THREE.Vector3(0, 18, 22);
    this.targetPos = new THREE.Vector3(0, 18, 22);
    this.lookAtTarget = new THREE.Vector3(0, 1.5, 0);
    this.currentLookAt = new THREE.Vector3(0, 1.5, 0);

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;

    // Orbit user control
    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };
    this.orbitAngles = { theta: 0, phi: Math.PI * 0.3 };
    this.orbitDist = 24;

    this.setupOrbitListeners();
  }

  setMode(mode, targetSumo = null) {
    this.mode = mode;
    if (targetSumo) this.targetSumo = targetSumo;
  }

  triggerShake(intensity = 0.5) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1.6);
  }

  setupOrbitListeners() {
    this.domElement.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    this.domElement.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.previousMouse.x = e.clientX;
      this.previousMouse.y = e.clientY;

      if (this.mode === 'orbit') {
        this.orbitAngles.theta -= dx * 0.008;
        this.orbitAngles.phi = Math.max(0.1, Math.min(Math.PI * 0.45, this.orbitAngles.phi - dy * 0.008));
      }
    });

    this.domElement.addEventListener('wheel', (e) => {
      if (this.mode === 'orbit') {
        this.orbitDist = Math.max(8, Math.min(45, this.orbitDist + e.deltaY * 0.02));
      }
    }, { passive: true });
  }

  update(sumos, dohyo, dt) {
    const liveSumos = sumos.filter(s => s.isAlive && !s.isFalling);

    // 1. Compute desired position based on mode
    switch (this.mode) {
      case 'action': {
        // Compute bounding box / centroid of remaining live sumos
        if (liveSumos.length > 0) {
          let cx = 0, cz = 0;
          let maxDist = 0;
          liveSumos.forEach(s => {
            cx += s.pos.x;
            cz += s.pos.z;
          });
          cx /= liveSumos.length;
          cz /= liveSumos.length;

          liveSumos.forEach(s => {
            const d = Math.sqrt((s.pos.x - cx) ** 2 + (s.pos.z - cz) ** 2);
            if (d > maxDist) maxDist = d;
          });

          // Zoom in as ring shrinks and sumos become fewer
          const baseHeight = 9.0 + maxDist * 1.2 + dohyo.currentRadius * 0.4;
          const baseDist = 12.0 + maxDist * 1.4 + dohyo.currentRadius * 0.5;

          this.targetPos.set(cx * 0.4, baseHeight, cz * 0.4 + baseDist);
          this.lookAtTarget.set(cx * 0.6, 1.2, cz * 0.6);
        } else {
          this.targetPos.set(0, 16, 22);
          this.lookAtTarget.set(0, 1.2, 0);
        }
        break;
      }

      case 'orbit': {
        const x = this.orbitDist * Math.sin(this.orbitAngles.phi) * Math.sin(this.orbitAngles.theta);
        const y = this.orbitDist * Math.cos(this.orbitAngles.phi);
        const z = this.orbitDist * Math.sin(this.orbitAngles.phi) * Math.cos(this.orbitAngles.theta);
        this.targetPos.set(x, y, z);
        this.lookAtTarget.set(0, 1.5, 0);
        break;
      }

      case 'follow': {
        if (this.targetSumo && this.targetSumo.isAlive) {
          const s = this.targetSumo;
          const angle = s.facingAngle;
          // Position behind and slightly above the target sumo
          const behindDist = 5.5;
          const height = 4.2;
          this.targetPos.set(
            s.pos.x - Math.sin(angle) * behindDist,
            s.pos.y + height,
            s.pos.z - Math.cos(angle) * behindDist
          );
          this.lookAtTarget.set(s.pos.x, s.pos.y + 1.2, s.pos.z);
        } else {
          // If followed sumo was eliminated, fallback to action mode
          this.mode = 'action';
        }
        break;
      }

      case 'topdown': {
        const height = dohyo.currentRadius * 2.3 + 8.0;
        this.targetPos.set(0, height, 0.1);
        this.lookAtTarget.set(0, 0, 0);
        break;
      }
    }

    // 2. Smooth damping interpolation
    const lerpSpeed = this.mode === 'orbit' ? 12.0 : 4.5;
    this.currentPos.lerp(this.targetPos, dt * lerpSpeed);
    this.currentLookAt.lerp(this.lookAtTarget, dt * lerpSpeed);

    // 3. Screen shake calculation
    let shakeOffset = new THREE.Vector3(0, 0, 0);
    if (this.shakeIntensity > 0) {
      shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    // 4. Apply to camera
    this.camera.position.copy(this.currentPos).add(shakeOffset);
    this.camera.lookAt(this.currentLookAt);
  }
}
