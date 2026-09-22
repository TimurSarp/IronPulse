class RestTimer {
  constructor() {
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.intervalId = null;
    this.isRunning = false;
    this.floatingEl = null;
    this.modalEl = null;
  }

  init() {
    this.floatingEl = document.getElementById('floating-timer');
    this.modalEl = document.getElementById('timer-modal');
    this.updateUI();
  }

  start(seconds) {
    this.stop();
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.isRunning = true;

    sound.init();

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.showFloatingWidget();
    this.updateUI();
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;

      const settings = Storage.getSettings();
      // Tick sound on last 3 seconds
      if (this.remainingSeconds <= 3 && this.remainingSeconds > 0) {
        if (settings.restTimerSound) sound.playTick();
      }

      this.updateUI();

      if (this.remainingSeconds === 0) {
        this.onFinish();
      }
    }
  }

  onFinish() {
    this.stop();
    const settings = Storage.getSettings();

    if (settings.restTimerSound) {
      sound.playFinishChime();
    }
    if (settings.restTimerVibrate) {
      sound.vibrate([250, 100, 250, 100, 400]);
    }

    // Flash timer widget
    if (this.floatingEl) {
      this.floatingEl.classList.add('bg-emerald-500', 'text-black');
      setTimeout(() => {
        this.floatingEl.classList.remove('bg-emerald-500', 'text-black');
        this.hideFloatingWidget();
      }, 3500);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.updateUI();
  }

  addTime(seconds) {
    this.remainingSeconds = Math.max(0, this.remainingSeconds + seconds);
    this.totalSeconds = Math.max(this.totalSeconds, this.remainingSeconds);
    this.updateUI();
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateUI() {
    const formatted = this.formatTime(this.remainingSeconds);

    // Floating widget display
    const floatTimeEl = document.getElementById('floating-timer-time');
    if (floatTimeEl) floatTimeEl.textContent = formatted;

    // Modal display
    const modalTimeEl = document.getElementById('modal-timer-time');
    if (modalTimeEl) modalTimeEl.textContent = formatted;

    // Progress percentage
    const progress = this.totalSeconds > 0 
      ? ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100 
      : 0;
    const barEl = document.getElementById('timer-progress-bar');
    if (barEl) barEl.style.width = `${progress}%`;
  }

  showFloatingWidget() {
    if (this.floatingEl) {
      this.floatingEl.classList.remove('hidden');
    }
  }

  hideFloatingWidget() {
    if (this.floatingEl && !this.isRunning) {
      this.floatingEl.classList.add('hidden');
    }
  }

  openModal() {
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }
}

const timer = new RestTimer();
window.timer = timer;
