// IronPulse Streak & Weekly Strength Bonus System
const STREAK_KEY = 'ironpulse_streak_state';

class StreakManager {
  constructor() {
    this.state = {
      currentStreak: 0,
      lastActiveDate: null,
      isBroken: false,
      savedStreakBeforeBreak: 0,
      bonusCount: 0
    };
  }

  init() {
    this.loadState();
    this.evaluateTodayActivity();
    this.render();
  }

  loadState() {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) {
      try {
        this.state = { ...this.state, ...JSON.parse(raw) };
      } catch (e) {
        console.error('Streak parse error:', e);
      }
    } else {
      this.saveState();
    }
  }

  saveState() {
    localStorage.setItem(STREAK_KEY, JSON.stringify(this.state));
  }

  // Check if today has a completed real workout or daily walking goal
  isTodayActive() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Antrenman yapıldı mı? (Gerçek antrenman, baseline hariç)
    const workouts = window.Storage ? window.Storage.getWorkouts() : [];
    const hasWorkoutToday = workouts.some(w => !w.isBaseline && w.date === today);
    if (hasWorkoutToday) return true;

    // 2. Günlük yürüyüş hedefi tamamlandı mı?
    if (window.Storage && window.Storage.getTodayWalking) {
      const walk = window.Storage.getTodayWalking();
      const targetKm = window.Storage.getSettings().dailyKmTarget || 5.0;
      if (walk && walk.km >= targetKm) return true;
    }

    return false;
  }

  evaluateTodayActivity() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (this.state.lastActiveDate && this.state.lastActiveDate !== today && this.state.lastActiveDate !== yesterday) {
      if (!this.state.isBroken && this.state.currentStreak > 0) {
        this.state.savedStreakBeforeBreak = this.state.currentStreak;
        this.state.currentStreak = 0;
        this.state.isBroken = true;
        this.saveState();
      }
    }

    if (this.isTodayActive()) {
      if (!this.state.isBroken && this.state.lastActiveDate !== today) {
        this.state.currentStreak = (this.state.currentStreak || 0) + 1;
        this.state.lastActiveDate = today;
        this.saveState();
      }
    }
  }

  triggerActivityCheck() {
    const today = new Date().toISOString().split('T')[0];
    if (this.isTodayActive()) {
      if (this.state.lastActiveDate !== today && !this.state.isBroken) {
        this.state.currentStreak = (this.state.currentStreak || 0) + 1;
      }
      this.state.lastActiveDate = today;
      this.saveState();
      this.render();
    }
  }

  // Awards +1 extra bonus streak for weekly super strength progression (after calibration)
  awardWeeklyStrengthBonus() {
    this.state.currentStreak = (this.state.currentStreak || 0) + 1;
    this.state.bonusCount = (this.state.bonusCount || 0) + 1;
    this.state.lastActiveDate = new Date().toISOString().split('T')[0];
    this.saveState();
    this.render();
  }

  openRecoveryModal() {
    const modal = document.getElementById('modal-streak-recovery');
    if (modal) {
      modal.classList.remove('hidden');
      const prevEl = document.getElementById('recovery-prev-streak-count');
      if (prevEl) prevEl.textContent = this.state.savedStreakBeforeBreak || 1;
    }
  }

  closeRecoveryModal() {
    const modal = document.getElementById('modal-streak-recovery');
    if (modal) modal.classList.add('hidden');
  }

  recoverStreak() {
    this.state.currentStreak = this.state.savedStreakBeforeBreak || 1;
    this.state.isBroken = false;
    this.state.lastActiveDate = new Date().toISOString().split('T')[0];
    this.saveState();

    if (window.sound) window.sound.playSuccessChime();
    this.closeRecoveryModal();
    this.render();

    if (window.IronPulseApp) {
      window.IronPulseApp.showToast('Strike kurtarıldı! Seri kaldığı yerden devam ediyor.', 'success');
    }
  }

  resetStreak() {
    this.state.currentStreak = 0;
    this.state.savedStreakBeforeBreak = 0;
    this.state.isBroken = false;
    this.saveState();
    this.closeRecoveryModal();
    this.render();
  }

  breakStreakForTest() {
    this.state.savedStreakBeforeBreak = this.state.currentStreak || 7;
    this.state.currentStreak = 0;
    this.state.isBroken = true;
    this.saveState();
    this.render();
  }

  render() {
    const container = document.getElementById('streak-display-container');
    if (!container) return;

    if (this.state.isBroken) {
      container.innerHTML = `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <div class="flex items-center gap-2">
            <span class="text-xl">💔</span>
            <div>
              <span class="text-xs font-bold text-rose-400 block">Strike Bozuldu!</span>
              <span class="text-[10px] text-zinc-400">Dün antrenman veya yürüyüş hedefi tamamlanmadı.</span>
            </div>
          </div>
          <button id="btn-open-streak-recovery" class="py-1.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs shadow-lg shadow-rose-500/20 transition active:scale-95">
            Kurtar
          </button>
        </div>
      `;

      document.getElementById('btn-open-streak-recovery')?.addEventListener('click', () => {
        this.openRecoveryModal();
      });
      return;
    }

    const streakCount = this.state.currentStreak || 0;
    const realWorkouts = window.Storage ? window.Storage.getRealCompletedWorkoutsCount() : 0;
    const isCalibrated = realWorkouts >= 6;
    const bonusBadge = (this.state.bonusCount || 0) > 0
      ? `<span class="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">+${this.state.bonusCount} Güç Bonusu</span>`
      : '';

    const calibrationSubtext = isCalibrated
      ? `<span class="text-emerald-400 font-semibold">Güç Bonusu Aktif:</span> Haftalık yüksek gelişimde +1 ekstra seri!`
      : `<span class="text-zinc-400">Güç Bonusu Kalibrasyonu: <strong class="text-amber-300">${realWorkouts}/6</strong> antrenman (Baz veri toplanıyor)</span>`;

    container.innerHTML = `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/30">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="fire-animated text-2xl flex-shrink-0">🔥</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-base font-black text-amber-300 font-heading">${streakCount} Strike</span>
              <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Seri</span>
              ${bonusBadge}
            </div>
            <p class="text-[10px] text-zinc-300 mt-0.5 leading-snug">
              ${calibrationSubtext}
            </p>
          </div>
        </div>
        <button id="btn-test-break-streak" class="text-[10px] text-zinc-500 hover:text-zinc-400 p-1 flex-shrink-0" title="Test amaçlı seriyi boz">
          <i data-lucide="zap-off" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btn-test-break-streak')?.addEventListener('click', () => {
      this.breakStreakForTest();
    });
  }
}

const streak = new StreakManager();
window.streak = streak;
