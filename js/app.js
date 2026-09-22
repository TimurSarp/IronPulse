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

    // 4. Initialize submodules
    if (window.streak) streak.init();
    timer.init();
    workout.init();
    tasks.init();
    nutrition.init();
    metrics.init();
    charts.init();
    this.renderQuote();

    // 4. Bind UI & Events
    this.bindNavigation();
    this.bindModals();
    this.bindSettings();
    this.bindGlobalActions();

    // 5. Restore active workout view if session was in progress
    if (workout.activeSession) {
      this.switchTab('workout');
      workout.showActiveWorkoutView();
    }

    // 6. Refresh Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    console.log('IronPulse PWA initialized successfully.');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.log('Service Worker registration failed:', err);
          });
      });
    }
  }

  // --- NAVIGATION CONTROLLER ---
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

    // Hide all tab screens
    document.querySelectorAll('.tab-screen').forEach(screen => {
      screen.classList.add('hidden');
    });

    // Show target screen
    const targetEl = document.getElementById(`screen-${tabName}`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Update Bottom Navigation Active Styles
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

    // If switching to metrics/charts, trigger chart resize/redraw
    if (tabName === 'metrics') {
      setTimeout(() => {
        charts.renderAll();
      }, 50);
    } else if (tabName === 'tasks') {
      tasks.render();
    } else if (tabName === 'daily') {
      this.renderQuote();
      if (window.streak) streak.render();
      nutrition.renderActivityCalendar();
      workout.renderNextRoutineCard();
    } else if (tabName === 'nutrition') {
      nutrition.render();
    } else if (tabName === 'workout') {
      workout.renderNextRoutineCard();
      workout.renderTemplates();
      workout.renderWorkoutHistory();
    } else if (tabName === 'settings') {
      if (window.theme) theme.renderThemeSettingsUI();
    }
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
    document.getElementById('btn-start-empty-workout')?.addEventListener('click', () => {
      workout.startNewWorkout(null, 'Serbest Antrenman');
    });

    document.getElementById('btn-finish-workout')?.addEventListener('click', () => {
      workout.finishWorkout();
    });

    document.getElementById('btn-cancel-workout')?.addEventListener('click', () => {
      workout.cancelWorkout();
    });

    document.getElementById('modal-finish-close')?.addEventListener('click', () => {
      document.getElementById('modal-workout-finish').classList.add('hidden');
      this.switchTab('daily');
      workout.renderNextRoutineCard();
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

    // Filter exercises by muscle pill
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

    // Search exercise input
    document.getElementById('search-exercise-input')?.addEventListener('input', (e) => {
      const activeFilterBtn = document.querySelector('.filter-muscle-btn.bg-emerald-500');
      const muscle = activeFilterBtn ? activeFilterBtn.dataset.muscle : 'all';
      this.renderExerciseSelectionList(muscle, e.target.value);
    });

    // CREATE NEW TEMPLATE MODAL
    document.getElementById('btn-open-new-template-modal')?.addEventListener('click', () => {
      this.openNewTemplateModal();
    });

    document.getElementById('modal-new-template-close')?.addEventListener('click', () => {
      document.getElementById('modal-new-template').classList.add('hidden');
    });

    document.getElementById('btn-add-custom-template-row')?.addEventListener('click', () => {
      if (!this.customTemplateRows) this.customTemplateRows = [];
      this.customTemplateRows.push({ name: '', muscle: 'Göğüs', sets: 3 });
      this.renderCustomTemplateRows();
    });

    document.getElementById('btn-save-new-template')?.addEventListener('click', () => {
      this.saveNewTemplate();
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

    // TASKS (İŞ VE GÖREVLER)
    document.getElementById('btn-open-add-task-modal')?.addEventListener('click', () => {
      tasks.openAddTaskModal();
    });

    document.getElementById('modal-add-task-close')?.addEventListener('click', () => {
      tasks.closeAddTaskModal();
    });

    document.getElementById('btn-save-task')?.addEventListener('click', () => {
      tasks.saveNewTaskFromModal();
    });

    document.getElementById('btn-reset-tasks-daily')?.addEventListener('click', () => {
      tasks.resetAllToday();
    });

    document.querySelectorAll('input[name="task-type-radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        tasks.updateTaskTypeForm();
      });
    });

    document.querySelectorAll('.task-filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.task-filter-pill').forEach(b => {
          b.classList.remove('bg-cyan-500', 'text-black');
          b.classList.add('bg-zinc-800', 'text-zinc-400');
        });
        btn.classList.add('bg-cyan-500', 'text-black');
        btn.classList.remove('bg-zinc-800', 'text-zinc-400');

        tasks.currentFilter = btn.dataset.filter;
        tasks.render();
      });
    });

    // 1RM CALCULATOR MODAL
    document.getElementById('modal-1rm-close')?.addEventListener('click', () => {
      document.getElementById('modal-1rm').classList.add('hidden');
    });

    document.getElementById('1rm-weight-input')?.addEventListener('input', () => workout.calc1RM());
    document.getElementById('1rm-reps-input')?.addEventListener('input', () => workout.calc1RM());

    // NUTRITION & WATER
    document.getElementById('btn-add-water-250')?.addEventListener('click', () => nutrition.addWater(250));
    document.getElementById('btn-add-water-500')?.addEventListener('click', () => nutrition.addWater(500));
    document.getElementById('btn-reset-water')?.addEventListener('click', () => nutrition.resetWater());

    document.getElementById('btn-open-edit-nutrition')?.addEventListener('click', () => nutrition.openEditMacrosModal());
    document.getElementById('modal-nutrition-close')?.addEventListener('click', () => {
      document.getElementById('modal-edit-nutrition').classList.add('hidden');
    });
    document.getElementById('btn-save-nutrition')?.addEventListener('click', () => nutrition.saveMacrosFromModal());

    // Quick add macros (+20g protein, etc.)
    document.querySelectorAll('.quick-macro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        nutrition.quickAddMacro(btn.dataset.macro, parseInt(btn.dataset.val, 10));
      });
    });

    // METRICS (WEIGHT & MEASUREMENT)
    document.getElementById('btn-open-add-weight')?.addEventListener('click', () => metrics.openAddWeightModal());
    document.getElementById('modal-weight-close')?.addEventListener('click', () => {
      document.getElementById('modal-add-weight').classList.add('hidden');
    });
    document.getElementById('btn-save-weight')?.addEventListener('click', () => metrics.saveWeightFromModal());

    document.getElementById('btn-open-add-measure')?.addEventListener('click', () => metrics.openAddMeasureModal());
    document.getElementById('modal-measure-close')?.addEventListener('click', () => {
      document.getElementById('modal-add-measure').classList.add('hidden');
    });
    document.getElementById('btn-save-measure')?.addEventListener('click', () => metrics.saveMeasureFromModal());

    // ROUTINE SPLIT SETTINGS MODAL
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
        <div class="py-8 text-center text-zinc-500 text-xs">
          Egzersiz bulunamadı.
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
        this.showToast('Egzersiz antrenmana eklendi', 'success');
      });
    });
  }

  openNewTemplateModal() {
    const modal = document.getElementById('modal-new-template');
    const nameInput = document.getElementById('new-template-name');
    const catSelect = document.getElementById('new-template-category');

    if (nameInput) nameInput.value = '';
    if (catSelect) catSelect.value = 'Özel Program';

    // Start with 3 custom rows ready to edit
    this.customTemplateRows = [
      { name: 'Barbell Bench Press', muscle: 'Göğüs', sets: 4 },
      { name: 'Incline Dumbbell Press', muscle: 'Göğüs', sets: 3 },
      { name: 'Cable Chest Fly', muscle: 'Göğüs', sets: 3 }
    ];

    this.renderCustomTemplateRows();
    if (modal) modal.classList.remove('hidden');
  }

  renderCustomTemplateRows() {
    const container = document.getElementById('new-template-custom-exercises-list');
    if (!container) return;

    if (!this.customTemplateRows || this.customTemplateRows.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-zinc-500 text-xs">
          Henüz egzersiz eklenmedi. Yukarıdaki "+ Hareket Ekle" butonuna basın.
        </div>
      `;
      return;
    }

    const muscleOptions = ['Göğüs', 'Sırt', 'Omuz', 'Biceps', 'Triceps', 'Bacak', 'Kalf', 'Karın', 'Genel'];

    container.innerHTML = this.customTemplateRows.map((row, idx) => `
      <div class="card-oled p-2.5 rounded-xl border border-zinc-800/90 flex items-center gap-2">
        <div class="flex-1 min-w-0">
          <input type="text" value="${row.name || ''}" placeholder="Hareket Adı (Örn: Dips, Incline Curl)" 
            class="row-name-input w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500 mb-1.5" 
            data-idx="${idx}">
          <div class="flex items-center gap-2">
            <select class="row-muscle-select bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-[11px] text-zinc-300 focus:outline-none flex-1" data-idx="${idx}">
              ${muscleOptions.map(m => `<option value="${m}" ${m === row.muscle ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <div class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5">
              <span class="text-[10px] text-zinc-400 font-bold">Set:</span>
              <input type="number" min="1" max="15" value="${row.sets || 3}" 
                class="row-sets-input w-10 bg-transparent text-center text-xs font-bold text-emerald-400 focus:outline-none" data-idx="${idx}">
            </div>
          </div>
        </div>
        <button type="button" class="btn-remove-template-row p-2 text-zinc-500 hover:text-rose-400 rounded-lg transition flex-shrink-0" data-idx="${idx}">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach row events
    container.querySelectorAll('.row-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(input.dataset.idx, 10);
        if (this.customTemplateRows[idx]) {
          this.customTemplateRows[idx].name = e.target.value;
        }
      });
    });

    container.querySelectorAll('.row-muscle-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.idx, 10);
        if (this.customTemplateRows[idx]) {
          this.customTemplateRows[idx].muscle = e.target.value;
        }
      });
    });

    container.querySelectorAll('.row-sets-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(input.dataset.idx, 10);
        if (this.customTemplateRows[idx]) {
          this.customTemplateRows[idx].sets = parseInt(e.target.value, 10) || 3;
        }
      });
    });

    container.querySelectorAll('.btn-remove-template-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.customTemplateRows.splice(idx, 1);
        this.renderCustomTemplateRows();
      });
    });
  }

  saveNewTemplate() {
    const nameInput = document.getElementById('new-template-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      alert('Lütfen şablon için bir isim girin.');
      return;
    }

    const catSelect = document.getElementById('new-template-category');
    const category = catSelect ? catSelect.value.trim() : 'Özel';

    // Filter valid rows
    const validRows = (this.customTemplateRows || []).filter(r => r.name && r.name.trim() !== '');

    if (validRows.length === 0) {
      alert('Lütfen en az 1 egzersiz adı yazın.');
      return;
    }

    const allExercises = Storage.getExercises();
    const templateExercises = [];

    validRows.forEach(row => {
      const trimmedName = row.name.trim();
      let match = allExercises.find(e => e.name.toLowerCase() === trimmedName.toLowerCase());

      if (!match) {
        // Automatically register new custom exercise
        match = {
          id: 'ex_custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          name: trimmedName,
          muscle: row.muscle || 'Genel',
          equipment: 'Serbest',
          category: 'Özel'
        };
        Storage.saveExercise(match);
      }

      templateExercises.push({
        exerciseId: match.id,
        defaultSets: parseInt(row.sets, 10) || 3
      });
    });

    const newTmpl = {
      id: 'tmpl_' + Date.now(),
      name: name,
      category: category,
      exercises: templateExercises
    };

    Storage.saveTemplate(newTmpl);
    document.getElementById('modal-new-template')?.classList.add('hidden');
    workout.renderTemplates();
    this.showToast('Özel antrenman şablonu başarıyla oluşturuldu!', 'success');
  }

  // --- SETTINGS CONTROLLER ---
  bindSettings() {
    const settings = Storage.getSettings();

    // Populate inputs
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) soundToggle.checked = settings.restTimerSound;

    const vibrateToggle = document.getElementById('setting-vibrate-toggle');
    if (vibrateToggle) vibrateToggle.checked = settings.restTimerVibrate;

    const wakeLockToggle = document.getElementById('setting-wakelock-toggle');
    if (wakeLockToggle) wakeLockToggle.checked = settings.wakeLockEnabled;

    const restInput = document.getElementById('setting-rest-input');
    if (restInput) restInput.value = settings.defaultRestSeconds;

    const calInput = document.getElementById('setting-target-cal');
    if (calInput) calInput.value = settings.calorieTarget;

    const protInput = document.getElementById('setting-target-prot');
    if (protInput) protInput.value = settings.proteinTarget;

    const carbInput = document.getElementById('setting-target-carb');
    if (carbInput) carbInput.value = settings.carbTarget;

    const fatInput = document.getElementById('setting-target-fat');
    if (fatInput) fatInput.value = settings.fatTarget;

    const waterInput = document.getElementById('setting-target-water');
    if (waterInput) waterInput.value = settings.waterTarget;

    // Save settings button
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      Storage.saveSettings({
        restTimerSound: soundToggle.checked,
        restTimerVibrate: vibrateToggle.checked,
        wakeLockEnabled: wakeLockToggle.checked,
        defaultRestSeconds: parseInt(restInput.value, 10) || 90,
        calorieTarget: parseInt(calInput.value, 10) || 2500,
        proteinTarget: parseInt(protInput.value, 10) || 160,
        carbTarget: parseInt(carbInput.value, 10) || 270,
        fatTarget: parseInt(fatInput.value, 10) || 65,
        waterTarget: parseInt(waterInput.value, 10) || 3000
      });
      nutrition.render();
      this.showToast('Ayarlar başarıyla kaydedildi', 'success');
    });

    // EXPORT JSON BACKUP
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      Storage.exportFullBackup();
      this.showToast('Yedek JSON dosyası indirildi', 'success');
    });

    // IMPORT JSON BACKUP
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-backup')?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = Storage.importBackup(event.target.result);
        if (res.success) {
          this.showToast('Yedek başarıyla geri yüklendi! Sayfa yenileniyor...', 'success');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert('Geri yükleme hatası: ' + res.error);
        }
      };
      reader.readAsText(file);
    });
  }

  // --- ORDERED ROTATING ROUTINE CONTROLLERS ---
  openRoutineSettingsModal() {
    const modal = document.getElementById('modal-routine-settings');
    if (!modal) return;

    this.editingRoutine = JSON.parse(JSON.stringify(Storage.getRoutine()));
    
    // Set weekly days input
    const daysInput = document.getElementById('routine-weekly-days-input');
    if (daysInput) daysInput.value = this.editingRoutine.weeklyTargetDays || 4;

    this.renderRoutineDayPicker();
    this.renderRoutineDaysEditor();

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
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
        <button type="button" class="btn-select-routine-pointer p-2.5 rounded-xl border text-left transition flex items-center justify-between ${isCurrent ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}" data-idx="${idx}">
          <div class="min-w-0 pr-1">
            <span class="text-[10px] font-bold block uppercase text-zinc-500">${idx + 1}. Sıra</span>
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

    const muscleOptions = ['Göğüs', 'Omuz', 'Sırt', 'Bacak', 'Kol', 'Karın', 'Tüm Vücut'];

    container.innerHTML = this.editingRoutine.days.map((day, dayIdx) => {
      const exercisesListHtml = (day.exercises || []).map((ex, exIdx) => `
        <div class="flex items-center gap-2 mb-2 bg-zinc-950/70 p-2 rounded-xl border border-zinc-850">
          <input type="text" value="${ex.name || ''}" placeholder="Hareket Adı (Örn: Incline Dumbbell Press)" 
            class="input-routine-ex-name flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            data-day="${dayIdx}" data-ex="${exIdx}">
          
          <div class="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5">
            <span class="text-[10px] text-zinc-500 font-bold">Set:</span>
            <input type="number" min="1" max="10" value="${ex.sets || 3}" 
              class="input-routine-ex-sets w-8 bg-transparent text-center text-xs font-bold text-emerald-400 focus:outline-none"
              data-day="${dayIdx}" data-ex="${exIdx}">
          </div>

          <button type="button" class="btn-remove-routine-ex p-1 text-zinc-500 hover:text-rose-400 rounded transition" data-day="${dayIdx}" data-ex="${exIdx}" title="Hareketi Sil">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `).join('');

      return `
        <div class="card-oled rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-900/50">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black flex items-center justify-center flex-shrink-0">
                ${dayIdx + 1}
              </span>
              <input type="text" value="${day.title || ''}" placeholder="Gün Başlığı (Örn: 1. Gün: Göğüs)" 
                class="input-routine-day-title flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500" 
                data-day="${dayIdx}">
            </div>

            <div class="flex items-center gap-1 ml-2">
              <select class="select-routine-day-muscle bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-[11px] text-zinc-300 focus:outline-none" data-day="${dayIdx}">
                ${muscleOptions.map(m => `<option value="${m}" ${m === day.muscle ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              ${this.editingRoutine.days.length > 1 ? `
                <button type="button" class="btn-remove-routine-day p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition" data-day="${dayIdx}" title="Günü Sil">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Exercises for this day -->
          <div class="mb-2">
            ${exercisesListHtml.length > 0 ? exercisesListHtml : '<p class="text-[11px] text-zinc-500 py-1">Bu gün için henüz hareket eklenmedi.</p>'}
          </div>

          <!-- Add Exercise to Day Button -->
          <button type="button" class="btn-add-routine-ex-to-day w-full py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-dashed border-zinc-750 text-zinc-400 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition" data-day="${dayIdx}">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            Bu Güne Hareket Ekle
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Event listeners
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
            muscle: this.editingRoutine.days[d].muscle || 'Genel',
            sets: 3
          });
          this.renderRoutineDaysEditor();
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
    const dayNumber = this.editingRoutine.days.length + 1;
    this.editingRoutine.days.push({
      id: 'day_' + Date.now(),
      title: `${dayNumber}. Gün: Yeni Bölge`,
      muscle: 'Genel',
      exercises: [
        { name: 'Temel Hareket', muscle: 'Genel', sets: 4 }
      ]
    });
    this.renderRoutineDayPicker();
    this.renderRoutineDaysEditor();
  }

  resetDefaultRoutine() {
    if (confirm('Rutin ayarlarını varsayılan 4 günlük programa (Göğüs - Omuz - Sırt - Bacak) sıfırlamak istediğinize emin misiniz?')) {
      this.editingRoutine = JSON.parse(JSON.stringify(DEFAULT_ROUTINE));
      const daysInput = document.getElementById('routine-weekly-days-input');
      if (daysInput) daysInput.value = this.editingRoutine.weeklyTargetDays || 4;
      this.renderRoutineDayPicker();
      this.renderRoutineDaysEditor();
    }
  }

  saveRoutineSettingsFromModal() {
    if (!this.editingRoutine || !this.editingRoutine.days || this.editingRoutine.days.length === 0) {
      this.showToast('En az bir gün bulunmalıdır.', 'error');
      return;
    }

    const weeklyDaysInput = document.getElementById('routine-weekly-days-input');
    const targetDays = weeklyDaysInput ? (parseInt(weeklyDaysInput.value, 10) || 4) : 4;
    this.editingRoutine.weeklyTargetDays = Math.max(1, Math.min(7, targetDays));

    if (this.editingRoutine.currentIndex >= this.editingRoutine.days.length) {
      this.editingRoutine.currentIndex = 0;
    }

    Storage.saveRoutine(this.editingRoutine);
    workout.renderNextRoutineCard();
    this.closeRoutineSettingsModal();
    this.showToast('Sıralı antrenman rutini kaydedildi!', 'success');
  }

  bindGlobalActions() {
    // Enable Web Audio on first user interaction anywhere
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
