// IronPulse Streak & Daily Completion Tracking System
const STREAK_KEY = 'ironpulse_streak_state';

class StreakManager {
  constructor() {
    const isHardReset = typeof localStorage !== 'undefined' && localStorage.getItem('ironpulse_hard_reset_done') === 'true';
    this.state = {
      currentStreak: isHardReset ? 0 : 7,
      lastActiveDate: isHardReset ? null : new Date().toISOString().split('T')[0],
      isBroken: false,
      savedStreakBeforeBreak: isHardReset ? 0 : 7
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
        this.state = JSON.parse(raw);
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

  // Check if today has at least one qualifying activity (Workout, Nutrition, or Tasks)
  isTodayActive() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Antrenman yapıldı mı?
    const workouts = window.Storage ? window.Storage.getWorkouts() : [];
    const hasWorkoutToday = workouts.some(w => w.date === today);
    if (hasWorkoutToday) return true;

    // 2. Beslenme girildi mi? (Kalori veya su girişi yapıldı mı?)
    const nutritionToday = window.Storage ? window.Storage.getTodayNutrition() : null;
    if (nutritionToday && ((nutritionToday.calories && nutritionToday.calories > 0) || (nutritionToday.water && nutritionToday.water > 0))) {
      return true;
    }

    // 3. İş görevlerinden herhangi biri tamamlandı mı?
    const tasks = window.Storage ? window.Storage.getTasks() : [];
    const hasCompletedTask = tasks.some(t => {
      if (t.type === 'checkbox') return t.completed;
      if (t.type === 'numeric') return (t.current || 0) >= (t.target || 1);
      return false;
    });
    if (hasCompletedTask) return true;

    return false;
  }

  evaluateTodayActivity() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If last active was before yesterday and wasn't today, and streak wasn't already broken
    if (this.state.lastActiveDate && this.state.lastActiveDate !== today && this.state.lastActiveDate !== yesterday) {
      if (!this.state.isBroken && this.state.currentStreak > 0) {
        // Streak is broken!
        this.state.savedStreakBeforeBreak = this.state.currentStreak;
        this.state.currentStreak = 0;
        this.state.isBroken = true;
        this.saveState();
      }
    }

    // If today is active, ensure streak is alive
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

  // Open the "Ezik misin?" recovery modal
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

  // User clicked "Evet" to recover streak
  recoverStreak() {
    this.state.currentStreak = this.state.savedStreakBeforeBreak || 1;
    this.state.isBroken = false;
    this.state.lastActiveDate = new Date().toISOString().split('T')[0];
    this.saveState();

    if (window.sound) window.sound.playSuccessChime();
    this.closeRecoveryModal();
    this.render();

    if (window.IronPulseApp) {
      window.IronPulseApp.showToast('Strike başarıyla kurtarıldı! Seri kaldığı yerden devam ediyor.', 'success');
    }
  }

  // User clicked "Hayır" to start fresh
  resetStreak() {
    this.state.currentStreak = 0;
    this.state.savedStreakBeforeBreak = 0;
    this.state.isBroken = false;
    this.saveState();
    this.closeRecoveryModal();
    this.render();
  }

  // Simulate break for testing purpose
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
              <span class="text-[10px] text-zinc-400">Dün hiçbir görev tamamlanmadı.</span>
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
    container.innerHTML = `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/30">
        <div class="flex items-center gap-2.5">
          <span class="fire-animated text-2xl">🔥</span>
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base font-black text-amber-300 font-heading">${streakCount} Günlük Seri</span>
              <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Aktif</span>
            </div>
            <p class="text-[11px] text-zinc-300 font-medium">
              ${streakCount > 0 ? `<span class="text-amber-400 font-bold">${streakCount} gündür hiç bozmadın!</span>` : 'Bugün antrenman, beslenme veya iş tamamlayarak seriyi başlat!'}
            </p>
          </div>
        </div>
        <button id="btn-test-break-streak" class="text-[10px] text-zinc-500 hover:text-zinc-400 p-1" title="Test amaçlı seriyi boz">
          <i data-lucide="zap-off" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Button to let user test breaking the streak immediately
    document.getElementById('btn-test-break-streak')?.addEventListener('click', () => {
      this.breakStreakForTest();
    });
  }
}

const streak = new StreakManager();
window.streak = streak;
