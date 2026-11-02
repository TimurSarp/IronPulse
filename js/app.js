class App {
  constructor() {
    this.currentTab = 'daily';
  }

  init() {
    // 1. Initialize Storage and Schema
    Storage.init();

    // 2. Initialize Theme Manager
    if (window.theme) theme.init();

    // 3. Register Service Worker for PWA
    this.registerServiceWorker();

    // 4. Initialize Sport Submodules
    if (window.streak) streak.init();
    timer.init();
    workout.init();
    charts.init();
    this.renderWalkingWidget();
    this.renderQuote();

    // 5. Bind UI & Events
    this.bindNavigation();
    this.bindModals();
    this.bindWalkingEvents();
    this.bindSettings();
    this.bindGlobalActions();

    // 6. Restore active workout focus view if session was in progress
    if (workout.activeSession) {
      this.switchTab('daily');
      workout.renderActiveWorkout();
      workout.showActiveWorkoutView();
    }

    // 7. Refresh Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('IronPulse PPL v3.0 initialized.');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            if (reg.update) reg.update();
            reg.addEventListener('updatefound', () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.log('Service Worker registration failed:', err);
          });

        let isRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!isRefreshing) {
            isRefreshing = true;
            window.location.reload();
          }
        });
      });
    }
  }

  // --- NAVIGATION CONTROLLER (4 Pure Sport Tabs) ---
  bindNavigation() {
    const navButtons = document.querySelectorAll('.bottom-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    document.querySelectorAll('.tab-screen').forEach(screen => {
      screen.classList.add('hidden');
    });

    const targetEl = document.getElementById(`screen-${tabName}`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
      const isTarget = btn.dataset.tab === tabName;
      if (isTarget) {
        btn.classList.add('text-emerald-400');
        btn.classList.remove('text-zinc-500');
      } else {
        btn.classList.remove('text-emerald-400');
        btn.classList.add('text-zinc-500');
      }
    });

    if (tabName === 'daily') {
      if (workout.activeSession) {
        workout.showActiveWorkoutView();
        workout.renderActiveWorkout();
      } else {
        workout.hideActiveWorkoutView();
        if (window.streak) streak.render();
        workout.renderNextRoutineCard();
        this.renderWalkingWidget();
        workout.renderActivityCalendar();
        this.renderQuote();
      }
    } else if (tabName === 'workout') {
      workout.renderTemplates();
      workout.renderWorkoutHistory();
    } else if (tabName === 'metrics') {
      setTimeout(() => {
        charts.renderAll();
      }, 40);
    } else if (tabName === 'settings') {
      if (window.theme) theme.renderThemeSettingsUI();
    }
  }

  // --- DAILY WALKING (KM <-> STEPS, 174cm / 43 EU Shoe) ---
  renderWalkingWidget() {
    const todayWalk = Storage.getTodayWalking();
    const settings = Storage.getSettings();
    const targetKm = settings.dailyKmTarget || 5.0;
    const targetSteps = Storage.kmToSteps(targetKm);

    const currentKm = todayWalk.km || 0;
    const currentSteps = todayWalk.steps || Storage.kmToSteps(currentKm);
    const pct = Math.min(100, Math.round((currentKm / targetKm) * 100));

    const kmDisplay = document.getElementById('walking-current-km');
    if (kmDisplay) kmDisplay.textContent = `${currentKm.toFixed(2)} km`;

    const stepsDisplay = document.getElementById('walking-current-steps');
    if (stepsDisplay) stepsDisplay.textContent = `≈ ${currentSteps.toLocaleString('tr-TR')} adım`;

    const targetDisplay = document.getElementById('walking-target-summary');
    if (targetDisplay) targetDisplay.textContent = `Hedef: ${targetKm} km (≈ ${targetSteps.toLocaleString('tr-TR')} adım)`;

    const barEl = document.getElementById('walking-progress-bar');
    if (barEl) barEl.style.width = `${pct}%`;

    const kmInput = document.getElementById('walking-input-km');
    if (kmInput && document.activeElement !== kmInput) {
      kmInput.value = currentKm > 0 ? currentKm : '';
    }

    const stepsInput = document.getElementById('walking-input-steps');
    if (stepsInput && document.activeElement !== stepsInput) {
      stepsInput.value = currentSteps > 0 ? currentSteps : '';
    }
  }

  bindWalkingEvents() {
    const kmInput = document.getElementById('walking-input-km');
    const stepsInput = document.getElementById('walking-input-steps');

    // Two-way live conversion when typing KM
    kmInput?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        if (stepsInput) stepsInput.value = Storage.kmToSteps(val);
      } else if (e.target.value === '') {
        if (stepsInput) stepsInput.value = '';
      }
    });

    // Two-way live conversion when typing Steps
    stepsInput?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0) {
        if (kmInput) kmInput.value = Storage.stepsToKm(val);
      } else if (e.target.value === '') {
        if (kmInput) kmInput.value = '';
      }
    });

    // Save button for KM / Steps
    document.getElementById('btn-save-walking')?.addEventListener('click', () => {
      const kmVal = parseFloat(kmInput?.value);
      const stepsVal = parseInt(stepsInput?.value, 10);

      if (!isNaN(kmVal) && kmVal >= 0) {
        Storage.saveTodayWalkingKm(kmVal);
      } else if (!isNaN(stepsVal) && stepsVal >= 0) {
        Storage.saveTodayWalkingSteps(stepsVal);
      } else {
        Storage.saveTodayWalkingKm(0);
      }

      if (window.sound) sound.playTone(640, 'sine', 0.08, 0.15);
      this.renderWalkingWidget();
      if (window.streak) streak.triggerActivityCheck();
      this.showToast('Günlük yürüyüş kaydedildi!', 'success');
    });

    // Quick +KM buttons
    document.querySelectorAll('.btn-quick-add-km').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseFloat(btn.dataset.km || 1);
        Storage.addTodayWalkingKm(delta);
        if (window.sound) sound.playTone(680, 'sine', 0.08, 0.15);
        this.renderWalkingWidget();
        if (window.streak) streak.triggerActivityCheck();
      });
    });

    document.getElementById('btn-reset-walking')?.addEventListener('click', () => {
      Storage.saveTodayWalkingKm(0);
      if (kmInput) kmInput.value = '';
      if (stepsInput) stepsInput.value = '';
      this.renderWalkingWidget();
    });
  }

  renderQuote() {
    if (!window.quotes) return;
    const item = window.quotes.getRandomQuote();
    const textEl = document.getElementById('daily-quote-text');
    const authorEl = document.getElementById('daily-quote-author');
    if (textEl && item) textEl.textContent = `"${item.quote}"`;
    if (authorEl && item) authorEl.textContent = `— ${item.author}`;
  }

  // --- MODALS & GLOBAL ACTIONS ---
  bindModals() {
    // REST TIMER MODAL
    document.getElementById('floating-timer')?.addEventListener('click', () => {
      timer.openModal();
    });

    document.getElementById('modal-timer-close')?.addEventListener('click', () => {
      timer.closeModal();
    });

    document.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = parseInt(btn.dataset.sec, 10);
        timer.start(sec);
      });
    });

    document.getElementById('timer-btn-add15')?.addEventListener('click', () => timer.addTime(15));
    document.getElementById('timer-btn-sub15')?.addEventListener('click', () => timer.addTime(-15));
    document.getElementById('timer-btn-stop')?.addEventListener('click', () => timer.stop());

    // WORKOUT ACTIONS
    document.getElementById('btn-finish-workout')?.addEventListener('click', () => {
      workout.finishWorkout();
    });

    document.getElementById('btn-cancel-workout')?.addEventListener('click', () => {
      workout.cancelWorkout();
    });

    document.getElementById('modal-finish-close')?.addEventListener('click', () => {
      document.getElementById('modal-workout-finish').classList.add('hidden');
      this.switchTab('daily');
    });

    // ADD EXERCISE TO ACTIVE WORKOUT MODAL
    const addExModal = document.getElementById('modal-select-exercise');
    document.getElementById('btn-add-exercise-to-workout')?.addEventListener('click', () => {
      this.renderExerciseSelectionList();
      addExModal.classList.remove('hidden');
    });

    document.getElementById('modal-select-exercise-close')?.addEventListener('click', () => {
      addExModal.classList.add('hidden');
    });

    document.querySelectorAll('.filter-muscle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-muscle-btn').forEach(b => {
          b.classList.remove('bg-emerald-500', 'text-black');
          b.classList.add('bg-zinc-800', 'text-zinc-400');
        });
        btn.classList.add('bg-emerald-500', 'text-black');
        btn.classList.remove('bg-zinc-800', 'text-zinc-400');

        this.renderExerciseSelectionList(btn.dataset.muscle, document.getElementById('search-exercise-input')?.value);
      });
    });

    document.getElementById('search-exercise-input')?.addEventListener('input', (e) => {
      const activeFilterBtn = document.querySelector('.filter-muscle-btn.bg-emerald-500');
      const muscle = activeFilterBtn ? activeFilterBtn.dataset.muscle : 'all';
      this.renderExerciseSelectionList(muscle, e.target.value);
    });

    // Quick add custom exercise inside modal-select-exercise
    document.getElementById('btn-create-custom-ex-inline')?.addEventListener('click', () => {
      const searchInput = document.getElementById('search-exercise-input');
      const customName = (searchInput?.value || '').trim() || prompt('Yeni hareket adı:');
      if (!customName) return;
      const newEx = Storage.saveExercise({
        name: customName,
        muscle: 'Genel',
        equipment: 'Serbest',
        category: 'Özel',
        defaultIncrement: 2.5
      });
      workout.addExerciseToActiveWorkout(newEx.id);
      addExModal.classList.add('hidden');
      this.showToast(`${customName} antrenmana eklendi`, 'success');
    });

    // MOTIVASYON SÖZÜ YENİLE
    document.getElementById('btn-refresh-quote')?.addEventListener('click', () => {
      this.renderQuote();
    });

    // STREAK KURTARMA ("EZİK MİSİN?")
    document.getElementById('btn-confirm-recover-streak')?.addEventListener('click', () => {
      if (window.streak) streak.recoverStreak();
    });
    document.getElementById('btn-cancel-recover-streak')?.addEventListener('click', () => {
      if (window.streak) streak.resetStreak();
    });

    // 1RM CALCULATOR MODAL
    document.getElementById('modal-1rm-close')?.addEventListener('click', () => {
      document.getElementById('modal-1rm').classList.add('hidden');
    });

    document.getElementById('1rm-weight-input')?.addEventListener('input', () => workout.calc1RM());
    document.getElementById('1rm-reps-input')?.addEventListener('input', () => workout.calc1RM());

    // PPL ROUTINE SETTINGS MODAL
    document.getElementById('btn-open-ppl-editor')?.addEventListener('click', () => {
      this.openRoutineSettingsModal();
    });

    document.getElementById('modal-routine-close')?.addEventListener('click', () => {
      this.closeRoutineSettingsModal();
    });

    document.getElementById('btn-add-routine-day')?.addEventListener('click', () => {
      this.addRoutineDay();
    });

    document.getElementById('btn-reset-default-routine')?.addEventListener('click', () => {
      this.resetDefaultRoutine();
    });

    document.getElementById('btn-save-routine-settings')?.addEventListener('click', () => {
      this.saveRoutineSettingsFromModal();
    });
  }

  renderExerciseSelectionList(muscleFilter = 'all', searchQuery = '') {
    const container = document.getElementById('exercise-selection-list');
    if (!container) return;

    let exercises = Storage.getExercises();

    if (muscleFilter && muscleFilter !== 'all') {
      exercises = exercises.filter(e => e.muscle === muscleFilter);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      exercises = exercises.filter(e => e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q));
    }

    if (exercises.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-zinc-500 text-xs">
          Eşleşen hareket bulunamadı. Yukarıdaki "+ Özel Ekle" butonuna basarak hemen oluşturabilirsin.
        </div>
      `;
      return;
    }

    container.innerHTML = exercises.map(ex => `
      <div class="flex items-center justify-between p-3 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 rounded-xl mb-2 transition cursor-pointer select-ex-row" data-id="${ex.id}">
        <div>
          <h5 class="text-sm font-semibold text-zinc-100">${ex.name}</h5>
          <span class="text-[10px] text-emerald-400 font-medium">${ex.muscle} • ${ex.equipment || 'Serbest'}</span>
        </div>
        <button class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <i data-lucide="plus" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    container.querySelectorAll('.select-ex-row').forEach(row => {
      row.addEventListener('click', () => {
        workout.addExerciseToActiveWorkout(row.dataset.id);
        document.getElementById('modal-select-exercise').classList.add('hidden');
        this.showToast('Hareket antrenmana eklendi', 'success');
      });
    });
  }

  // --- SETTINGS CONTROLLER ---
  bindSettings() {
    const settings = Storage.getSettings();

    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) soundToggle.checked = settings.restTimerSound;

    const vibrateToggle = document.getElementById('setting-vibrate-toggle');
    if (vibrateToggle) vibrateToggle.checked = settings.restTimerVibrate;

    const wakeLockToggle = document.getElementById('setting-wakelock-toggle');
    if (wakeLockToggle) wakeLockToggle.checked = settings.wakeLockEnabled;

    const restInput = document.getElementById('setting-rest-input');
    if (restInput) restInput.value = settings.defaultRestSeconds;

    const kmTargetInput = document.getElementById('setting-target-km');
    if (kmTargetInput) kmTargetInput.value = settings.dailyKmTarget || 5.0;

    const repCeilingInput = document.getElementById('setting-rep-ceiling');
    if (repCeilingInput) repCeilingInput.value = settings.repTargetCeiling || 12;

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      Storage.saveSettings({
        restTimerSound: soundToggle ? soundToggle.checked : true,
        restTimerVibrate: vibrateToggle ? vibrateToggle.checked : true,
        wakeLockEnabled: wakeLockToggle ? wakeLockToggle.checked : true,
        defaultRestSeconds: parseInt(restInput?.value, 10) || 90,
        dailyKmTarget: parseFloat(kmTargetInput?.value) || 5.0,
        repTargetCeiling: parseInt(repCeilingInput?.value, 10) || 12
      });
      this.renderWalkingWidget();
      workout.renderNextRoutineCard();
      this.showToast('Ayarlar kaydedildi', 'success');
    });

    // EXPORT JSON BACKUP
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      Storage.exportFullBackup();
      this.showToast('Yedek JSON dosyası indirildi', 'success');
    });

    // IMPORT JSON BACKUP
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-backup')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = Storage.importBackup(event.target.result);
        if (res.success) {
          this.showToast('Yedek başarıyla geri yüklendi! Sayfa yenileniyor...', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert('Geri yükleme hatası: ' + res.error);
        }
      };
      reader.readAsText(file);
    });

    // HARD RESET
    const hardResetModal = document.getElementById('modal-hard-reset');
    document.getElementById('btn-hard-reset')?.addEventListener('click', () => {
      hardResetModal?.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-hard-reset')?.addEventListener('click', () => {
      hardResetModal?.classList.add('hidden');
    });

    hardResetModal?.addEventListener('click', (e) => {
      if (e.target === hardResetModal) hardResetModal.classList.add('hidden');
    });

    document.getElementById('btn-confirm-hard-reset')?.addEventListener('click', () => {
      hardResetModal?.classList.add('hidden');
      const success = Storage.hardReset();
      if (success) {
        this.showToast('Sıfırlandı! PPL başlangıç referansları yüklendi.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    });

    // FORCE CACHE REFRESH
    document.getElementById('btn-force-refresh-cache')?.addEventListener('click', async () => {
      this.showToast('Önbellek temizleniyor, güncel sürüm alınıyor...', 'info');
      try {
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (let reg of regs) {
            await reg.unregister();
          }
        }
      } catch (e) {
        console.warn('Cache clear error:', e);
      }
      setTimeout(() => {
        window.location.href = window.location.pathname + '?refresh=' + Date.now();
      }, 500);
    });
  }

  // --- PPL ROUTINE EDITOR MODAL ---
  openRoutineSettingsModal(focusDayIdx = null) {
    const modal = document.getElementById('modal-routine-settings');
    if (!modal) return;

    this.editingRoutine = JSON.parse(JSON.stringify(Storage.getRoutine()));

    const daysInput = document.getElementById('routine-weekly-days-input');
    if (daysInput) daysInput.value = this.editingRoutine.weeklyTargetDays || 3;

    this.renderRoutineDayPicker();
    this.renderRoutineDaysEditor();

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();

    if (focusDayIdx !== null && focusDayIdx >= 0) {
      setTimeout(() => {
        const dayCard = document.getElementById(`routine-editor-day-${focusDayIdx}`);
        if (dayCard) dayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  closeRoutineSettingsModal() {
    const modal = document.getElementById('modal-routine-settings');
    if (modal) modal.classList.add('hidden');
  }

  renderRoutineDayPicker() {
    const container = document.getElementById('routine-day-picker-container');
    if (!container || !this.editingRoutine || !this.editingRoutine.days) return;

    container.innerHTML = this.editingRoutine.days.map((day, idx) => {
      const isCurrent = idx === this.editingRoutine.currentIndex;
      return `
        <button type="button" class="btn-select-routine-pointer p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
          isCurrent
            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }" data-idx="${idx}">
          <div class="min-w-0 pr-1">
            <span class="text-[10px] font-bold block uppercase text-zinc-500">${idx + 1}. Gün</span>
            <span class="text-xs font-extrabold truncate block text-zinc-100">${day.title}</span>
          </div>
          ${isCurrent ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>' : ''}
        </button>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    container.querySelectorAll('.btn-select-routine-pointer').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.editingRoutine.currentIndex = idx;
        this.renderRoutineDayPicker();
      };
    });
  }

  renderRoutineDaysEditor() {
    const container = document.getElementById('routine-days-editor-list');
    if (!container || !this.editingRoutine || !this.editingRoutine.days) return;

    const muscleOptions = ['Göğüs / Omuz / Triceps', 'Sırt / Arka Omuz / Biceps', 'Bacak', 'Göğüs', 'Sırt', 'Omuz', 'Kol', 'Tüm Vücut'];

    container.innerHTML = this.editingRoutine.days.map((day, dayIdx) => {
      const exercisesListHtml = (day.exercises || []).map((ex, exIdx) => `
        <div class="flex items-center gap-1.5 mb-2 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800">
          <input type="text" value="${ex.name || ''}" placeholder="Hareket Adı (Örn: Squat, Leg Press)"
            class="input-routine-ex-name flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
            data-day="${dayIdx}" data-ex="${exIdx}">

          <div class="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
            <span class="text-[10px] text-zinc-500 font-bold">Set:</span>
            <input type="number" min="1" max="10" value="${ex.sets || 3}"
              class="input-routine-ex-sets w-8 bg-transparent text-center text-xs font-bold text-emerald-400 focus:outline-none"
              data-day="${dayIdx}" data-ex="${exIdx}">
          </div>

          <button type="button" class="btn-remove-routine-ex p-1.5 text-zinc-500 hover:text-rose-400 rounded transition" data-day="${dayIdx}" data-ex="${exIdx}" title="Hareketi Sil">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      `).join('');

      return `
        <div id="routine-editor-day-${dayIdx}" class="card-oled rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-900/50">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                ${dayIdx + 1}
              </span>
              <input type="text" value="${day.title || ''}" placeholder="Gün Başlığı (Örn: Push / Pull / Legs)"
                class="input-routine-day-title flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
                data-day="${dayIdx}">
            </div>

            <div class="flex items-center gap-1 ml-2">
              <select class="select-routine-day-muscle bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-[10px] text-zinc-300 focus:outline-none max-w-[115px]" data-day="${dayIdx}">
                ${muscleOptions.map(m => `<option value="${m}" ${m === day.muscle ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              ${this.editingRoutine.days.length > 1 ? `
                <button type="button" class="btn-remove-routine-day p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition" data-day="${dayIdx}" title="Günü Sil">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="mb-2">
            ${exercisesListHtml.length > 0 ? exercisesListHtml : '<p class="text-[11px] text-zinc-400 py-2 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">Bu gün için henüz hareket yok. Aşağıdaki butondan hemen ekleyebilirsin.</p>'}
          </div>

          <button type="button" class="btn-add-routine-ex-to-day w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition" data-day="${dayIdx}">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            + ${day.title} Gününe Hareket Ekle
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    container.querySelectorAll('.input-routine-day-title').forEach(input => {
      input.addEventListener('input', (e) => {
        const d = parseInt(input.dataset.day, 10);
        if (this.editingRoutine.days[d]) this.editingRoutine.days[d].title = e.target.value;
      });
    });

    container.querySelectorAll('.select-routine-day-muscle').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const d = parseInt(sel.dataset.day, 10);
        if (this.editingRoutine.days[d]) this.editingRoutine.days[d].muscle = e.target.value;
      });
    });

    container.querySelectorAll('.input-routine-ex-name').forEach(input => {
      input.addEventListener('input', (e) => {
        const d = parseInt(input.dataset.day, 10);
        const ex = parseInt(input.dataset.ex, 10);
        if (this.editingRoutine.days[d] && this.editingRoutine.days[d].exercises[ex]) {
          this.editingRoutine.days[d].exercises[ex].name = e.target.value;
        }
      });
    });

    container.querySelectorAll('.input-routine-ex-sets').forEach(input => {
      input.addEventListener('change', (e) => {
        const d = parseInt(input.dataset.day, 10);
        const ex = parseInt(input.dataset.ex, 10);
        if (this.editingRoutine.days[d] && this.editingRoutine.days[d].exercises[ex]) {
          this.editingRoutine.days[d].exercises[ex].sets = parseInt(e.target.value, 10) || 3;
        }
      });
    });

    container.querySelectorAll('.btn-remove-routine-ex').forEach(btn => {
      btn.onclick = () => {
        const d = parseInt(btn.dataset.day, 10);
        const ex = parseInt(btn.dataset.ex, 10);
        if (this.editingRoutine.days[d] && this.editingRoutine.days[d].exercises) {
          this.editingRoutine.days[d].exercises.splice(ex, 1);
          this.renderRoutineDaysEditor();
        }
      };
    });

    container.querySelectorAll('.btn-add-routine-ex-to-day').forEach(btn => {
      btn.onclick = () => {
        const d = parseInt(btn.dataset.day, 10);
        if (this.editingRoutine.days[d]) {
          if (!this.editingRoutine.days[d].exercises) this.editingRoutine.days[d].exercises = [];
          this.editingRoutine.days[d].exercises.push({
            name: '',
            muscle: this.editingRoutine.days[d].muscle === 'Bacak' ? 'Bacak' : 'Genel',
            sets: 3
          });
          this.renderRoutineDaysEditor();
          // Auto-focus the newly added input
          const inputs = container.querySelectorAll(`.input-routine-ex-name[data-day="${d}"]`);
          if (inputs.length > 0) inputs[inputs.length - 1].focus();
        }
      };
    });

    container.querySelectorAll('.btn-remove-routine-day').forEach(btn => {
      btn.onclick = () => {
        const d = parseInt(btn.dataset.day, 10);
        if (confirm('Bu günü rutinden silmek istediğinize emin misiniz?')) {
          this.editingRoutine.days.splice(d, 1);
          if (this.editingRoutine.currentIndex >= this.editingRoutine.days.length) {
            this.editingRoutine.currentIndex = 0;
          }
          this.renderRoutineDayPicker();
          this.renderRoutineDaysEditor();
        }
      };
    });
  }

  addRoutineDay() {
    if (!this.editingRoutine || !this.editingRoutine.days) return;
    this.editingRoutine.days.push({
      id: 'day_' + Date.now(),
      title: `Yeni Gün`,
      muscle: 'Genel',
      exercises: []
    });
    this.renderRoutineDayPicker();
    this.renderRoutineDaysEditor();
  }

  resetDefaultRoutine() {
    if (confirm('Rutin ayarlarını varsayılan Push - Pull - Legs (PPL) programına sıfırlamak istediğinize emin misiniz?')) {
      this.editingRoutine = JSON.parse(JSON.stringify(window.DEFAULT_ROUTINE));
      const daysInput = document.getElementById('routine-weekly-days-input');
      if (daysInput) daysInput.value = this.editingRoutine.weeklyTargetDays || 3;
      this.renderRoutineDayPicker();
      this.renderRoutineDaysEditor();
    }
  }

  saveRoutineSettingsFromModal() {
    if (!this.editingRoutine || !this.editingRoutine.days || this.editingRoutine.days.length === 0) {
      this.showToast('En az bir gün bulunmalıdır.', 'error');
      return;
    }

    // Filter out empty exercise rows and register any new custom exercises in database
    const allExercises = Storage.getExercises();
    this.editingRoutine.days.forEach(day => {
      day.exercises = (day.exercises || [])
        .filter(ex => ex.name && ex.name.trim() !== '')
        .map(ex => {
          const cleanName = ex.name.trim();
          let matched = allExercises.find(e =>
            (ex.exerciseId && e.id === ex.exerciseId) ||
            e.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (!matched) {
            matched = Storage.saveExercise({
              name: cleanName,
              muscle: day.muscle === 'Bacak' ? 'Bacak' : (ex.muscle || 'Genel'),
              equipment: 'Serbest',
              category: 'PPL',
              defaultIncrement: day.muscle === 'Bacak' ? 5 : 2.5
            });
          }
          return {
            ...ex,
            name: cleanName,
            exerciseId: matched.id,
            sets: parseInt(ex.sets, 10) || 3
          };
        });
    });

    const weeklyDaysInput = document.getElementById('routine-weekly-days-input');
    const targetDays = weeklyDaysInput ? (parseInt(weeklyDaysInput.value, 10) || 3) : 3;
    this.editingRoutine.weeklyTargetDays = Math.max(1, Math.min(7, targetDays));

    if (this.editingRoutine.currentIndex >= this.editingRoutine.days.length) {
      this.editingRoutine.currentIndex = 0;
    }

    Storage.saveRoutine(this.editingRoutine);
    workout.renderNextRoutineCard();
    workout.renderTemplates();
    charts.renderAll();
    this.closeRoutineSettingsModal();
    this.showToast('PPL programı ve hareketler kaydedildi!', 'success');
  }

  bindGlobalActions() {
    const unlockAudio = () => {
      sound.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none transform -translate-y-2';
      document.body.appendChild(toast);
    }

    const bg = type === 'success' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-100 border border-zinc-700';
    toast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 transition-all duration-300 pointer-events-none ${bg}`;
    toast.textContent = message;

    toast.classList.remove('opacity-0', '-translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', '-translate-y-2');
    }, 2800);
  }
}

function launchApp() {
  if (!window.IronPulseApp) {
    window.IronPulseApp = new App();
    window.app = window.IronPulseApp;
    window.IronPulseApp.init();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', launchApp);
} else {
  launchApp();
}
