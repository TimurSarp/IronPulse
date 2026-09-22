// IronPulse Theme Manager
// Supports 7 preset color palettes and a custom color picker with live CSS variable injection.

const PRESET_THEMES = [
  { id: 'emerald', name: 'Zümrüt Yeşili', color: '#10b981', secondary: '#34d399' },
  { id: 'blue', name: 'Siber Mavi', color: '#3b82f6', secondary: '#60a5fa' },
  { id: 'cyan', name: 'Neon Turkuaz', color: '#06b6d4', secondary: '#22d3ee' },
  { id: 'purple', name: 'Hiper Mor', color: '#a855f7', secondary: '#c084fc' },
  { id: 'red', name: 'Volkan Kırmızı', color: '#ef4444', secondary: '#f87171' },
  { id: 'orange', name: 'Ateş Turuncu', color: '#f97316', secondary: '#fb923c' },
  { id: 'gold', name: 'Şampiyon Altın', color: '#eab308', secondary: '#fde047' }
];

class ThemeManager {
  constructor() {
    this.currentThemeId = 'emerald';
    this.currentColor = '#10b981';
    this.currentName = 'Zümrüt Yeşili';
  }

  init() {
    const settings = (window.Storage && Storage.getSettings) ? Storage.getSettings() : {};
    const savedColor = settings.themeColor || '#10b981';
    const savedName = settings.themeName || 'Zümrüt Yeşili';
    const savedId = settings.themeId || 'emerald';

    this.applyTheme(savedColor, savedName, savedId, false);
    this.renderThemeSettingsUI();
  }

  hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  lightenDarkenColor(hex, amt) {
    let usePound = false;
    if (hex[0] === '#') {
      hex = hex.slice(1);
      usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  applyTheme(color, name = 'Özel Renk', themeId = 'custom', shouldSave = true) {
    this.currentColor = color;
    this.currentName = name;
    this.currentThemeId = themeId;

    const rgb = this.hexToRgb(color);
    const secondary = this.lightenDarkenColor(color, 35);

    // 1. Inject or update CSS override block
    let styleEl = document.getElementById('ironpulse-dynamic-theme-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ironpulse-dynamic-theme-style';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      :root {
        --primary-color: ${color};
        --primary-secondary: ${secondary};
        --primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
        --primary-light: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15);
        --primary-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4);
        --primary-glow: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35);
      }

      /* Primary text colors */
      .text-emerald-400, .text-emerald-300 {
        color: ${color} !important;
      }
      .hover\\:text-emerald-400:hover, .hover\\:text-emerald-300:hover {
        color: ${secondary} !important;
      }

      /* Primary backgrounds */
      .bg-emerald-500, .bg-emerald-400 {
        background-color: ${color} !important;
      }
      .hover\\:bg-emerald-400:hover, .hover\\:bg-emerald-500:hover {
        background-color: ${secondary} !important;
      }
      .bg-emerald-500\\/5, .bg-emerald-500\\/10, .bg-emerald-500\\/15, .bg-emerald-500\\/20, .bg-emerald-500\\/25 {
        background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important;
      }

      /* Primary borders */
      .border-emerald-500, .border-emerald-500\\/30, .border-emerald-500\\/40, .border-emerald-500\\/50, .border-emerald-500\\/60 {
        border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
      }

      /* Gradients */
      .from-emerald-500 {
        --tw-gradient-from: ${color} var(--tw-gradient-from-position) !important;
        --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) var(--tw-gradient-to-position) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      .to-emerald-400, .to-teal-400 {
        --tw-gradient-to: ${secondary} var(--tw-gradient-to-position) !important;
      }

      /* Shadows & Glow */
      .glow-emerald {
        box-shadow: 0 0 25px -5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
      }
      .shadow-emerald-500\\/25, .shadow-emerald-500\\/20 {
        box-shadow: 0 10px 15px -3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
      }

      /* Navigation active tab highlight */
      .bottom-nav-btn.text-emerald-400 {
        color: ${color} !important;
      }

      /* Routine badges & table checks */
      .toggle-set-btn.bg-emerald-500 {
        background-color: ${color} !important;
      }
      .check-bounce.bg-emerald-500 {
        background-color: ${color} !important;
      }
      .progress-bar-fill.bg-emerald-400 {
        background-color: ${color} !important;
      }
    `;

    // 2. Persist in settings
    if (shouldSave && window.Storage && Storage.saveSettings) {
      Storage.saveSettings({
        themeColor: color,
        themeName: name,
        themeId: themeId
      });
    }

    // 3. Update Settings UI elements if present
    this.updateThemeSettingsUI();
  }

  renderThemeSettingsUI() {
    const container = document.getElementById('preset-themes-container');
    if (!container) return;

    container.innerHTML = PRESET_THEMES.map(t => {
      const isSelected = this.currentThemeId === t.id || this.currentColor.toLowerCase() === t.color.toLowerCase();
      return `
        <button type="button" class="btn-theme-preset p-2 rounded-xl border flex items-center gap-2 transition ${isSelected ? 'border-zinc-300 bg-zinc-800 ring-2 ring-white/20' : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'}" 
          data-id="${t.id}" data-color="${t.color}" data-name="${t.name}">
          <span class="w-4 h-4 rounded-full shadow-sm flex-shrink-0" style="background-color: ${t.color}"></span>
          <span class="text-[11px] font-bold text-zinc-200 truncate">${t.name}</span>
        </button>
      `;
    }).join('');

    // Attach click listeners to presets
    container.querySelectorAll('.btn-theme-preset').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const color = btn.dataset.color;
        const name = btn.dataset.name;
        this.applyTheme(color, name, id, true);
        if (window.IronPulseApp && IronPulseApp.showToast) {
          IronPulseApp.showToast(`Tema değiştirildi: ${name}`, 'success');
        }
      };
    });

    // Color picker
    const picker = document.getElementById('setting-custom-color-picker');
    if (picker) {
      picker.value = this.currentColor;
      picker.oninput = (e) => {
        const newColor = e.target.value;
        this.applyTheme(newColor, 'Özel Renk', 'custom', true);
      };
    }

    this.updateThemeSettingsUI();
  }

  updateThemeSettingsUI() {
    const activeNameEl = document.getElementById('active-theme-name');
    if (activeNameEl) {
      activeNameEl.textContent = this.currentName;
    }

    const hexLabel = document.getElementById('custom-color-hex-label');
    if (hexLabel) {
      hexLabel.textContent = this.currentColor.toUpperCase();
    }

    const previewEl = document.getElementById('setting-custom-color-preview');
    if (previewEl) {
      previewEl.style.backgroundColor = this.currentColor;
    }

    const picker = document.getElementById('setting-custom-color-picker');
    if (picker) {
      picker.value = this.currentColor;
    }

    // Update preset button active rings
    document.querySelectorAll('.btn-theme-preset').forEach(btn => {
      const isSelected = this.currentThemeId === btn.dataset.id || this.currentColor.toLowerCase() === btn.dataset.color.toLowerCase();
      if (isSelected) {
        btn.classList.add('border-zinc-300', 'bg-zinc-800', 'ring-2', 'ring-white/20');
        btn.classList.remove('border-zinc-800', 'bg-zinc-900/80');
      } else {
        btn.classList.remove('border-zinc-300', 'bg-zinc-800', 'ring-2', 'ring-white/20');
        btn.classList.add('border-zinc-800', 'bg-zinc-900/80');
      }
    });
  }
}

const theme = new ThemeManager();
window.theme = theme;
