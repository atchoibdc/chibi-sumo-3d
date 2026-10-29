import { SUMO_ROSTER } from './roster.js';

export class LandingManager {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.landingScreen = document.getElementById('landing-screen');
    this.gridContainer = document.getElementById('landing-roster-grid');
    this.selectedCountEl = document.getElementById('selected-count-badge');
    this.startBtn = document.getElementById('btn-start-brawl');
    this.championBanner = document.getElementById('champion-picked-banner');

    // Default: select the first 10 wrestlers
    this.selectedIds = new Set(SUMO_ROSTER.slice(0, 10).map(s => s.id));
    this.championId = 'sumo_ross'; // Default champion

    this.init();
  }

  init() {
    this.renderCards();
    this.setupQuickButtons();
    this.updateUI();

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        if (this.selectedIds.size < 2) {
          alert('Please select at least 2 wrestlers for the battle!');
          return;
        }
        if (this.selectedIds.size > 10) {
          alert('Maximum 10 wrestlers can enter the Dohyo!');
          return;
        }

        const selectedWrestlers = SUMO_ROSTER.filter(s => this.selectedIds.has(s.id));
        this.hide();
        this.callbacks.onStartMatch(selectedWrestlers, this.championId);
      });
    }
  }

  renderCards() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    SUMO_ROSTER.forEach(sumo => {
      const card = document.createElement('div');
      card.className = 'landing-card';
      card.id = `landing-card-${sumo.id}`;

      const colorHex = '#' + sumo.mawashiColor.toString(16).padStart(6, '0');

      card.innerHTML = `
        <div class="card-top-row">
          <div class="card-avatar" style="background: ${colorHex};">
            <span class="card-avatar-knot"></span>
          </div>
          <div class="card-meta">
            <h3 class="card-name">${sumo.name}</h3>
            <span class="card-title">${sumo.title}</span>
          </div>
          <div class="card-select-box" id="checkbox-${sumo.id}">
            <span class="check-icon">✓</span>
          </div>
        </div>

        <div class="card-archetype">
          <span class="archetype-badge">${sumo.personality}</span>
        </div>

        <div class="card-stats">
          <div class="stat-bar-group">
            <span class="stat-label">Mass</span>
            <div class="stat-track">
              <div class="stat-fill mass" style="width: ${Math.round((sumo.mass / 1.6) * 100)}%;"></div>
            </div>
          </div>
          <div class="stat-bar-group">
            <span class="stat-label">Speed</span>
            <div class="stat-track">
              <div class="stat-fill speed" style="width: ${Math.round((sumo.speed / 1.5) * 100)}%;"></div>
            </div>
          </div>
          <div class="stat-bar-group">
            <span class="stat-label">Aggro</span>
            <div class="stat-track">
              <div class="stat-fill aggro" style="width: ${Math.round((sumo.aggression / 1.6) * 100)}%;"></div>
            </div>
          </div>
        </div>

        <button class="btn-champion-pick" id="btn-champ-${sumo.id}">
          <span class="star-icon">⭐</span> Root For Champion
        </button>
      `;

      // Card click toggles selection
      card.addEventListener('click', (e) => {
        // If clicking on champion button, don't toggle selection
        if (e.target.closest('.btn-champion-pick')) {
          e.stopPropagation();
          this.setChampion(sumo.id);
          return;
        }

        this.toggleSelection(sumo.id);
      });

      this.gridContainer.appendChild(card);
    });
  }

  setupQuickButtons() {
    const btnSelect10 = document.getElementById('btn-quick-10');
    if (btnSelect10) {
      btnSelect10.addEventListener('click', () => {
        this.selectedIds = new Set(SUMO_ROSTER.slice(0, 10).map(s => s.id));
        this.updateUI();
      });
    }

    const btnRandom6 = document.getElementById('btn-quick-random6');
    if (btnRandom6) {
      btnRandom6.addEventListener('click', () => {
        const shuffled = [...SUMO_ROSTER].sort(() => Math.random() - 0.5);
        this.selectedIds = new Set(shuffled.slice(0, 6).map(s => s.id));
        this.updateUI();
      });
    }

    const btnRandom10 = document.getElementById('btn-quick-random10');
    if (btnRandom10) {
      btnRandom10.addEventListener('click', () => {
        const shuffled = [...SUMO_ROSTER].sort(() => Math.random() - 0.5);
        this.selectedIds = new Set(shuffled.slice(0, 10).map(s => s.id));
        this.updateUI();
      });
    }

    const btnSelectAll = document.getElementById('btn-quick-all');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        // Up to max 10
        this.selectedIds = new Set(SUMO_ROSTER.slice(0, 10).map(s => s.id));
        this.updateUI();
      });
    }

    const btnClear = document.getElementById('btn-quick-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.selectedIds.clear();
        this.updateUI();
      });
    }
  }

  toggleSelection(id) {
    if (this.selectedIds.has(id)) {
      if (this.selectedIds.size <= 2) {
        alert('You need at least 2 wrestlers to battle!');
        return;
      }
      this.selectedIds.delete(id);
    } else {
      if (this.selectedIds.size >= 10) {
        alert('Maximum 10 wrestlers can enter the Dohyo!');
        return;
      }
      this.selectedIds.add(id);
    }
    this.updateUI();
  }

  setChampion(id) {
    this.championId = id;
    // Auto-select champion if not already selected
    if (!this.selectedIds.has(id)) {
      if (this.selectedIds.size < 10) {
        this.selectedIds.add(id);
      }
    }
    this.updateUI();
  }

  updateUI() {
    // 1. Update cards selected state
    SUMO_ROSTER.forEach(sumo => {
      const card = document.getElementById(`landing-card-${sumo.id}`);
      const btnChamp = document.getElementById(`btn-champ-${sumo.id}`);
      if (!card) return;

      const isSelected = this.selectedIds.has(sumo.id);
      const isChamp = this.championId === sumo.id;

      card.classList.toggle('selected', isSelected);
      card.classList.toggle('champion-card', isChamp);

      if (btnChamp) {
        btnChamp.innerHTML = isChamp ? '⭐ YOUR CHAMPION' : '⭐ Root For Champion';
        btnChamp.classList.toggle('active', isChamp);
      }
    });

    // 2. Update count badge
    if (this.selectedCountEl) {
      this.selectedCountEl.textContent = `${this.selectedIds.size} / 10 WRESTLERS`;
    }

    // 3. Update Champion Banner
    if (this.championBanner) {
      const champ = SUMO_ROSTER.find(s => s.id === this.championId);
      if (champ) {
        const colorHex = '#' + champ.mawashiColor.toString(16).padStart(6, '0');
        this.championBanner.innerHTML = `
          <span class="champ-label">YOUR CHAMPION:</span>
          <span class="champ-avatar" style="background: ${colorHex};"></span>
          <span class="champ-name">${champ.name}</span>
          <span class="champ-title">${champ.title}</span>
        `;
      }
    }

    // 4. Update Start Button state
    if (this.startBtn) {
      const valid = this.selectedIds.size >= 2 && this.selectedIds.size <= 10;
      this.startBtn.disabled = !valid;
      this.startBtn.style.opacity = valid ? '1' : '0.5';
    }
  }

  show() {
    if (this.landingScreen) {
      this.landingScreen.classList.remove('hidden');
      this.updateUI();
    }
  }

  hide() {
    if (this.landingScreen) {
      this.landingScreen.classList.add('hidden');
    }
  }
}
