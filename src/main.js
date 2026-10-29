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

    // Start with Landing Page visible over scenic 3D arena
    this.spectatorCam.setMode('orbit');
    this.landing.show();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Scene with atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e111a);
    this.scene.fog = new THREE.FogExp2(0x0e111a, 0.016);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 18, 24);

    // 3. WebGL Renderer with soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Design
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x1a1a2e, 0.7);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    dirLight.position.set(16, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 70;
    const d = 18;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x7209b7, 0.85);
    rimLight.position.set(-16, 12, -16);
    this.scene.add(rimLight);
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

  startNewMatch() {
    // 1. Hide victory modal & landing screen
    this.ui.hideVictory();
    this.landing.hide();

    // 2. Clean up existing sumos
    this.sumos.forEach(s => {
      this.scene.remove(s.root);
    });
    this.sumos = [];
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
          angle: facingAngle
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

  animate() {
    requestAnimationFrame(this.animate);

    const rawDt = Math.min(this.clock.getDelta(), 0.1);
    const dt = rawDt * this.simSpeed;
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update AI decisions
    if (this.matchActive) {
      this.ai.update(this.sumos, dt);
    }

    // 2. Update Sumo Physics & Collisions
    this.physics.update(this.sumos, dt);

    // 3. Update Chibi Sumo Animations & Meshes
    this.sumos.forEach(s => s.update(dt, elapsedTime));

    // 4. Update Ring & Shrink Animations
    this.dohyo.update(dt, elapsedTime);

    // 5. Update Particle Systems
    this.particles.update(dt);

    // 6. Update Dynamic Spectator Camera (gentle orbit if on landing page)
    if (!this.matchActive && this.landing && !this.landing.landingScreen.classList.contains('hidden')) {
      this.spectatorCam.orbitAngles.theta += 0.2 * rawDt;
    }
    this.spectatorCam.update(this.sumos, this.dohyo, dt);

    // 7. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
