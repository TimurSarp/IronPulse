// Web Audio API Audio Synthesizer for 100% offline sounds
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.25) {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playTick() {
    this.playTone(880, 'triangle', 0.08, 0.15);
  }

  playFinishChime() {
    this.init();
    if (!this.ctx) return;
    // Two-tone bell chime
    this.playTone(659.25, 'sine', 0.4, 0.3); // E5
    setTimeout(() => {
      this.playTone(880, 'sine', 0.7, 0.35); // A5
    }, 180);
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 1.0, 0.25); // E6
    }, 380);
  }

  playSuccessChime() {
    this.init();
    if (!this.ctx) return;
    // Triad chord progression
    this.playTone(523.25, 'sine', 0.2, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.2), 200); // G5
    setTimeout(() => this.playTone(1046.50, 'sine', 0.5, 0.25), 300); // C6
  }

  vibrate(pattern = [200, 100, 200]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration restrictions
      }
    }
  }
}

const sound = new SoundEffects();
window.sound = sound;
