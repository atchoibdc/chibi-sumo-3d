import confetti from 'canvas-confetti';

export class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.rosterContainer = document.getElementById('roster-container');
    this.ringTierText = document.getElementById('ring-tier-text');
    this.announcementBox = document.getElementById('announcement-box');
    this.announcementTitle = document.getElementById('announcement-title');
    this.announcementSub = document.getElementById('announcement-sub');
    this.victoryModal = document.getElementById('victory-modal');
    this.winnerNameEl = document.getElementById('winner-name');
    this.winnerTitleEl = document.getElementById('winner-title');
    this.winnerKillsEl = document.getElementById('winner-kills');
    this.winnerBadgeEl = document.getElementById('winner-badge');
    this.matchTimeEl = document.getElementById('match-time');
    this.pickedSumoId = null;

    this.setupControlButtons();
  }

  setupControlButtons() {
    // New Match button
    const btnNewMatch = document.getElementById('btn-new-match');
    if (btnNewMatch) {
      btnNewMatch.addEventListener('click', () => this.callbacks.onRestart());
    }

    // Return to Landing / Roster Setup
    const btnOpenLanding = document.getElementById('btn-open-landing');
    if (btnOpenLanding) {
      btnOpenLanding.addEventListener('click', () => {
        this.callbacks.onOpenLanding();
      });
    }

    const btnModalRoster = document.getElementById('btn-modal-roster');
    if (btnModalRoster) {
      btnModalRoster.addEventListener('click', () => {
        this.hideVictory();
        this.callbacks.onOpenLanding();
      });
    }

    const btnRematchModal = document.getElementById('btn-rematch-modal');
    if (btnRematchModal) {
      btnRematchModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideVictory();
        this.callbacks.onRestart();
      });
    }

    if (this.victoryModal) {
      this.victoryModal.addEventListener('click', (e) => {
        if (e.target === this.victoryModal) {
          this.hideVictory();
          this.callbacks.onRestart();
        }
      });
    }

    // Speed buttons
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.dataset.speed);
        this.callbacks.onSpeedChange(speed);
      });
    });

    // Camera mode buttons
    const camButtons = document.querySelectorAll('.cam-btn');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.cam;
        this.callbacks.onCameraModeChange(mode);
      });
    });

    // Sound toggle
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.callbacks.onToggleMute();
        muteBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
        muteBtn.classList.toggle('muted', isMuted);
      });
    }
  }

  renderRoster(sumos, championId = null) {
    if (!this.rosterContainer) return;
    this.rosterContainer.innerHTML = '';

    sumos.forEach(sumo => {
      const card = document.createElement('div');
      card.className = 'sumo-card';
      card.id = `card-${sumo.id}`;

      const isChamp = championId === sumo.id;
      if (isChamp) card.classList.add('selected');

      const colorHex = '#' + sumo.mawashiColor.toString(16).padStart(6, '0');

      card.innerHTML = `
        <div class="sumo-card-avatar" style="background: ${colorHex};">
          <span class="sumo-card-topknot"></span>
        </div>
        <div class="sumo-card-info">
          <div class="sumo-card-name">${sumo.name} ${isChamp ? '⭐' : ''}</div>
          <div class="sumo-card-stats">
            <span class="sumo-trait">${sumo.personality}</span>
            <span class="sumo-kills" id="kills-${sumo.id}">0 KOs</span>
          </div>
        </div>
        <div class="sumo-card-status alive" id="status-${sumo.id}">ALIVE</div>
      `;

      // Clicking card focuses camera on this sumo
      card.addEventListener('click', () => {
        this.callbacks.onSelectSumo(sumo);
        document.querySelectorAll('.sumo-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });

      this.rosterContainer.appendChild(card);
    });
  }

  updateKills(sumoId, kills) {
    const el = document.getElementById(`kills-${sumoId}`);
    if (el) el.textContent = `${kills} KO${kills === 1 ? '' : 's'}`;
  }

  markEliminated(sumo) {
    const card = document.getElementById(`card-${sumo.id}`);
    const status = document.getElementById(`status-${sumo.id}`);
    if (card) card.classList.add('eliminated');
    if (status) {
      status.className = 'sumo-card-status out';
      status.textContent = 'RING OUT';
    }
  }

  updateRingRadius(currentR, initialR, remainingCount) {
    if (!this.ringTierText) return;
    const diameter = (currentR * 2).toFixed(1);
    this.ringTierText.innerHTML = `
      <span class="tier-label">RING DIAMETER:</span>
      <span class="tier-value">${diameter}m</span>
      <span class="tier-survivors">${remainingCount} SUMOS LEFT</span>
    `;
  }

  showAnnouncement(title, subtitle, duration = 1800, isAlert = false) {
    if (!this.announcementBox) return;
    this.announcementTitle.textContent = title;
    this.announcementSub.textContent = subtitle;
    this.announcementBox.className = 'announcement-box active' + (isAlert ? ' alert-shrink' : '');

    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => {
      this.announcementBox.className = 'announcement-box';
    }, duration);
  }

  showVictory(winner, durationSec, championId = null) {
    if (!this.victoryModal) return;

    const isChampion = championId === winner.id;
    const colorHex = '#' + winner.mawashiColor.toString(16).padStart(6, '0');
    this.winnerNameEl.innerHTML = `${winner.name} ${isChampion ? '⭐' : ''}`;
    this.winnerTitleEl.textContent = isChampion 
      ? `🎉 YOUR ROOTED CHAMPION WON! • ${winner.title}`
      : `${winner.title} • ${winner.personality}`;
    this.winnerKillsEl.textContent = `${winner.kills} Knockout${winner.kills === 1 ? '' : 's'}`;
    this.matchTimeEl.textContent = `${durationSec.toFixed(1)}s Match Duration`;

    if (this.winnerBadgeEl) {
      this.winnerBadgeEl.style.background = colorHex;
    }

    this.victoryModal.classList.add('active');

    // Confetti explosion
    try {
      confetti({
        particleCount: isChampion ? 180 : 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.7 }
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.7 }
        });
      }, 350);
    } catch (e) {
      // ignore
    }
  }

  hideVictory() {
    if (this.victoryModal) {
      this.victoryModal.classList.remove('active');
    }
  }
}
