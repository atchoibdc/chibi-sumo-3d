import * as THREE from 'three';
import './style.css';
import { sound } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Dohyo } from './dohyo.js';
import { ChibiSumo } from './chibi.js';
import { SumoPhysics } from './physics.js';
import { AIController } from './ai.js';
import { SpectatorCamera } from './camera.js';
import { UIManager } from './ui.js';
import { LandingManager } from './landing.js';
import { SUMO_ROSTER } from './roster.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('game-canvas-container');
    this.simSpeed = 1.0;
    this.activeRoster = SUMO_ROSTER.slice(0, 10); // Default 10 fighters
    this.championId = 'sumo_ross';
    this.sumos = [];
    this.matchActive = false;
    this.matchStartTime = 0;
    this.matchDuration = 0;

    this.initThree();
    this.initGameSystems();
    this.setupEventListeners();

    // Start with Landing Page visible over scenic 3D blue-sky Sakura arena with showcase wrestlers
    this.spawnShowcaseSumos();
    this.spectatorCam.setMode('orbit');
    this.landing.show();
    window.__sumoApp = this;

    this.timer = new THREE.Timer();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Vibrant Blue-Sky Scene & Soft Horizon Aerial Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5ec8ff);
    this.scene.fog = new THREE.FogExp2(0xd4f1ff, 0.0036);

    // 2. Camera (extended far plane so sky dome, islets & clouds never clip)
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 18, 24);

    // 3. WebGL Renderer with sRGB output & soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);

    // 4. Procedural Vivid Blue Sky Dome & Sun Disc
    this.createSkyDome();

    // 5. Crisp Sunlit Daylight Rig (Sky Hemisphere + Warm Sun + Azure Rim)
    const hemiLight = new THREE.HemisphereLight(0x9be4ff, 0xf3c68f, 1.05);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff8e8, 1.75);
    dirLight.position.set(20, 32, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 90;
    const d = 22;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x66d9ff, 0.65);
    rimLight.position.set(-18, 14, -16);
    this.scene.add(rimLight);
  }

  createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(240, 32, 24);
    const sunDir = new THREE.Vector3(20, 26, -30).normalize();

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenithColor: { value: new THREE.Color(0x1464d8) },
        uMidSkyColor: { value: new THREE.Color(0x4cc3ff) },
        uHorizonColor: { value: new THREE.Color(0xe2f6ff) },
        uNadirColor: { value: new THREE.Color(0xb6e3ff) },
        uSunColor: { value: new THREE.Color(0xfff6d6) },
        uSunDir: { value: sunDir }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uZenithColor;
        uniform vec3 uMidSkyColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uNadirColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        varying vec3 vWorldPos;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = dir.y;

          // Smooth multi-stop blue sky gradient
          vec3 col;
          if (h >= 0.0) {
            float t1 = smoothstep(0.0, 0.34, h);
            float t2 = smoothstep(0.28, 0.92, h);
            col = mix(uHorizonColor, uMidSkyColor, t1);
            col = mix(col, uZenithColor, t2);
          } else {
            col = mix(uHorizonColor, uNadirColor, smoothstep(0.0, -0.35, h));
          }

          // Warm solar halo & crisp sun disc
          float sunAmt = max(dot(dir, uSunDir), 0.0);
          col += uSunColor * pow(sunAmt, 10.0) * 0.24;
          col = mix(col, uSunColor, smoothstep(0.9965, 0.9988, sunAmt));

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);
  }

  initGameSystems() {
    this.particles = new ParticleSystem(this.scene);
    this.dohyo = new Dohyo(this.scene, this.particles);
    this.spectatorCam = new SpectatorCamera(this.camera, this.renderer.domElement);
    this.ai = new AIController(this.dohyo);

    this.physics = new SumoPhysics(
      this.dohyo,
      this.particles,
      (fallenSumo, killerId) => this.onSumoEliminated(fallenSumo, killerId)
    );

    this.ui = new UIManager({
      onRestart: () => this.startNewMatch(),
      onOpenLanding: () => {
        this.matchActive = false;
        this.spawnShowcaseSumos();
        this.landing.show();
        this.spectatorCam.setMode('orbit');
      },
      onSpeedChange: (speed) => { this.simSpeed = speed; },
      onCameraModeChange: (mode) => { this.spectatorCam.setMode(mode); },
      onToggleMute: () => sound.toggleMute(),
      onSelectSumo: (sumo) => {
        this.spectatorCam.setMode('follow', sumo);
      }
    });

    this.landing = new LandingManager({
      onStartMatch: (selectedWrestlers, championId) => {
        this.activeRoster = selectedWrestlers;
        this.championId = championId;
        this.startNewMatch();
      }
    });
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Sound unlock on first user pointer click
    const unlockAudio = () => {
      sound.ensureContext();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  clearSumos() {
    this.sumos.forEach(s => {
      this.scene.remove(s.root);
    });
    this.sumos = [];
  }

  // Spawn idle breathing wrestlers on the Dohyo while browsing the Landing Screen
  spawnShowcaseSumos() {
    this.clearSumos();
    this.particles.clear();
    this.dohyo.reset();

    const previewList = SUMO_ROSTER.slice(0, 6);
    const radius = 5.2;
    previewList.forEach((config, idx) => {
      const angle = (idx / previewList.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const facingAngle = Math.atan2(-x, -z);

      const sumo = new ChibiSumo(
        this.scene,
        {
          ...config,
          x,
          z,
          angle: facingAngle,
          isChampion: config.id === this.championId
        },
        this.particles
      );
      this.sumos.push(sumo);
    });
  }

  startNewMatch() {
    // 1. Hide victory modal & landing screen
    this.ui.hideVictory();
    this.landing.hide();

    // 2. Clean up existing sumos
    this.clearSumos();
    this.particles.clear();
    this.dohyo.reset();

    // 3. Spawn selected wrestlers at safe inner radius
    const count = this.activeRoster.length;
    const spawnRadius = this.dohyo.initialRadius * 0.48;

    this.activeRoster.forEach((config, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * spawnRadius;
      const z = Math.sin(angle) * spawnRadius;

      // Face inward toward center
      const facingAngle = Math.atan2(-x, -z);

      const sumo = new ChibiSumo(
        this.scene,
        {
          ...config,
          x,
          z,
          angle: facingAngle,
          isChampion: config.id === this.championId
        },
        this.particles
      );

      this.sumos.push(sumo);
    });

    // 4. Update UI & Match State
    this.ui.renderRoster(this.sumos, this.championId);
    this.ui.updateRingRadius(this.dohyo.currentRadius, this.dohyo.initialRadius, this.sumos.length);
    this.matchActive = true;
    this.matchStartTime = performance.now();
    this.spectatorCam.setMode('action');

    // 5. Play countdown / match start sound & banner
    sound.playWoodClapper(1.0);
    setTimeout(() => sound.playWoodClapper(1.2), 220);
    setTimeout(() => sound.playWoodClapper(1.5), 440);

    const champ = this.activeRoster.find(s => s.id === this.championId);
    const champText = champ ? ` Rooting for: ${champ.name}! ⭐` : '';

    this.ui.showAnnouncement('HAKKEYOI...', `NOKOTTA! 💥 FIGHT!${champText}`, 1800);
  }

  // CORE MECHANIC: Ring reduces every time 1 character falls!
  onSumoEliminated(fallenSumo, killerId) {
    this.ui.markEliminated(fallenSumo);

    // Screen shake from the dramatic knockout
    this.spectatorCam.triggerShake(0.85);

    // Credit killer with a KO point
    if (killerId) {
      const killer = this.sumos.find(s => s.id === killerId);
      if (killer) {
        killer.kills += 1;
        this.ui.updateKills(killer.id, killer.kills);
      }
    }

    const aliveSumos = this.sumos.filter(s => s.isAlive && !s.isFalling);
    const survivors = aliveSumos.length;
    const initialCount = this.activeRoster.length;

    if (survivors > 1) {
      // 1. Calculate new contracted ring radius
      const fraction = (survivors - 1) / (initialCount - 1);
      const minRadius = 5.5;
      const maxRadius = this.dohyo.initialRadius;
      const newRadius = minRadius + (maxRadius - minRadius) * Math.pow(fraction, 0.75);

      // 2. Trigger Dohyo physical crumble and smooth boundary shrink
      this.dohyo.shrinkTo(newRadius);
      sound.playRingCrumble();
      this.spectatorCam.triggerShake(1.1);

      // 3. UI Alert
      this.ui.showAnnouncement(
        `SUMO OUT! ${survivors} REMAIN`,
        `DOHYO CRUMBLES & SHRINKS TO ${(newRadius * 2).toFixed(1)}m!`,
        1800,
        true
      );
      this.ui.updateRingRadius(newRadius, this.dohyo.initialRadius, survivors);

    } else if (survivors === 1) {
      // TOURNAMENT CHAMPION FOUND!
      const winner = aliveSumos[0];
      this.matchActive = false;
      this.matchDuration = (performance.now() - this.matchStartTime) / 1000;

      sound.playGong();
      sound.playCrowdCheer();
      this.spectatorCam.triggerShake(1.4);

      const isChampion = this.championId === winner.id;
      const victoryTitle = isChampion ? `🏆 YOUR CHAMPION ${winner.name} WINS!` : '🏆 YOKOZUNA CHAMPION!';

      this.ui.showAnnouncement(
        victoryTitle,
        `${winner.name} CONQUERS THE RING!`,
        2400
      );

      setTimeout(() => {
        this.ui.showVictory(winner, this.matchDuration, this.championId);
      }, 1800);

    } else {
      // Draw / Sudden death: auto restart after short delay
      this.matchActive = false;
      this.ui.showAnnouncement('DOUBLE RING OUT!', 'SUDDEN DEATH RESTART!', 2200);
      setTimeout(() => {
        this.startNewMatch();
      }, 2300);
    }
  }

  animate(timestamp) {
    requestAnimationFrame(this.animate);

    this.timer.update(timestamp);
    const rawDt = Math.min(this.timer.getDelta(), 0.1);
    const dt = rawDt * this.simSpeed;
    const elapsedTime = this.timer.getElapsed();

    // 1. Update AI decisions & Physics only during an active match
    if (this.matchActive) {
      this.ai.update(this.sumos, dt);
      this.physics.update(this.sumos, dt);
    }

    // 2. Update Chibi Sumo Animations & Meshes (including idle showcase breathing)
    this.sumos.forEach(s => s.update(dt, elapsedTime));

    // 3. Update Ring, Sakura Petals, Clouds & Banners
    this.dohyo.update(dt, elapsedTime);

    // 4. Update Particle Systems
    this.particles.update(dt);

    // 5. Update Dynamic Spectator Camera (gentle orbit if on landing page)
    if (!this.matchActive && this.landing && !this.landing.landingScreen.classList.contains('hidden')) {
      this.spectatorCam.orbitAngles.theta += 0.18 * rawDt;
    }
    this.spectatorCam.update(this.sumos, this.dohyo, dt);

    // 6. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
