class WorkoutManager {
  constructor() {
    this.activeSession = null;
    this.sessionTimerInterval = null;
    this.wakeLock = null;
  }

  init() {
    this.activeSession = Storage.getActiveWorkout();
    if (this.activeSession) {
      this.startSessionTimer();
      this.requestWakeLock();
    }
    this.renderNextRoutineCard();
    this.renderTemplates();
    this.renderWorkoutHistory();
  }

  // --- WAKE LOCK (Screen Awake) ---
  async requestWakeLock() {
    const settings = Storage.getSettings();
    if (!settings.wakeLockEnabled) return;

    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  // --- WORKOUT SESSION LOGIC ---
  startNewWorkout(templateId = null, customName = null) {
    let name = customName || 'Serbest Antrenman';
    let initialExercises = [];

    if (templateId) {
      const templates = Storage.getTemplates();
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
        name = tmpl.name;
        initialExercises = tmpl.exercises.map(te => {
          const sets = [];
          for (let i = 0; i < (te.defaultSets || 3); i++) {
            sets.push({
              id: 's_' + Date.now() + '_' + i,
              type: i === 0 ? 'W' : 'R', // First set warmup hint
              weight: '',
              reps: '',
              completed: false
            });
          }
          return {
            exerciseId: te.exerciseId,
            sets: sets
          };
        });
      }
    }

    this.activeSession = {
      id: 'ws_' + Date.now(),
      name: name,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      startTimestamp: Date.now(),
      exercises: initialExercises,
      notes: ''
    };

    Storage.saveActiveWorkout(this.activeSession);
    this.startSessionTimer();
    this.requestWakeLock();
    this.renderActiveWorkout();
    this.showActiveWorkoutView();
    if (window.IronPulseApp && IronPulseApp.switchTab) {
      IronPulseApp.switchTab('workout');
    } else if (window.app && app.switchTab) {
      app.switchTab('workout');
    }
    this.renderNextRoutineCard();
  }

  startRoutineWorkout(dayIndex = null) {
    const routine = Storage.getRoutine();
    if (!routine || !routine.days || routine.days.length === 0) {
      return this.startNewWorkout(null, 'Serbest Antrenman');
    }

    const idx = (dayIndex !== null && dayIndex >= 0 && dayIndex < routine.days.length)
      ? dayIndex
      : (routine.currentIndex || 0);
    const currentDay = routine.days[idx] || routine.days[0];

    const allExercises = Storage.getExercises();
    const initialExercises = [];

    (currentDay.exercises || []).forEach(routineEx => {
      let matchedEx = allExercises.find(e => 
        (routineEx.exerciseId && e.id === routineEx.exerciseId) || 
        e.name.toLowerCase() === routineEx.name.toLowerCase()
      );
      if (!matchedEx) {
        matchedEx = Storage.saveExercise({
          name: routineEx.name,
          muscle: routineEx.muscle || currentDay.muscle || 'Genel',
          equipment: 'Serbest Ağırlık',
          category: 'Kişisel'
        });
      }

      const sets = [];
      const setCount = routineEx.sets || 3;
      for (let s = 0; s < setCount; s++) {
        sets.push({
          id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) + '_' + s,
          type: s === 0 ? 'W' : 'R',
          weight: '',
          reps: '',
          completed: false
        });
      }

      initialExercises.push({
        exerciseId: matchedEx.id,
        sets: sets
      });
    });

    this.activeSession = {
      id: 'ws_' + Date.now(),
      name: currentDay.title,
      isRoutine: true,
      routineDayIndex: idx,
      routineDayId: currentDay.id,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      startTimestamp: Date.now(),
      exercises: initialExercises,
      notes: `${currentDay.muscle || ''} odaklı sıralı rutin`
    };

    Storage.saveActiveWorkout(this.activeSession);
    this.startSessionTimer();
    this.requestWakeLock();
    this.renderActiveWorkout();
    this.showActiveWorkoutView();
    if (window.IronPulseApp && IronPulseApp.switchTab) {
      IronPulseApp.switchTab('workout');
    } else if (window.app && app.switchTab) {
      app.switchTab('workout');
    }
    this.renderNextRoutineCard();
  }

  startSessionTimer() {
    if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);
    const updateTime = () => {
      if (!this.activeSession) return;
      const elapsedSec = Math.floor((Date.now() - this.activeSession.startTimestamp) / 1000);
      const hours = Math.floor(elapsedSec / 3600);
      const mins = Math.floor((elapsedSec % 3600) / 60);
      const secs = elapsedSec % 60;
      
      const timeStr = hours > 0
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const el = document.getElementById('active-workout-duration');
      if (el) el.textContent = timeStr;

      const cardEl = document.getElementById('card-active-session-duration');
      if (cardEl) cardEl.textContent = timeStr;
    };

    updateTime();
    this.sessionTimerInterval = setInterval(updateTime, 1000);
  }

  addExerciseToActiveWorkout(exerciseId) {
    if (!this.activeSession) return;

    const sets = [
      { id: 's_' + Date.now() + '_0', type: 'W', weight: '', reps: '', completed: false },
      { id: 's_' + Date.now() + '_1', type: 'R', weight: '', reps: '', completed: false },
      { id: 's_' + Date.now() + '_2', type: 'R', weight: '', reps: '', completed: false }
    ];

    this.activeSession.exercises.push({
      exerciseId: exerciseId,
      sets: sets
    });

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  removeExerciseFromActiveWorkout(index) {
    if (!this.activeSession) return;
    if (confirm('Bu egzersizi antrenmandan çıkarmak istiyor musunuz?')) {
      this.activeSession.exercises.splice(index, 1);
      Storage.saveActiveWorkout(this.activeSession);
      this.renderActiveWorkout();
    }
  }

  addSet(exerciseIndex) {
    if (!this.activeSession) return;
    const ex = this.activeSession.exercises[exerciseIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    
    ex.sets.push({
      id: 's_' + Date.now(),
      type: 'R',
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : '',
      completed: false
    });

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  removeSet(exerciseIndex, setIndex) {
    if (!this.activeSession) return;
    this.activeSession.exercises[exerciseIndex].sets.splice(setIndex, 1);
    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  toggleSetComplete(exerciseIndex, setIndex) {
    if (!this.activeSession) return;
    const set = this.activeSession.exercises[exerciseIndex].sets[setIndex];
    set.completed = !set.completed;

    if (set.completed) {
      sound.playTone(880, 'sine', 0.12, 0.2);
      // Automatically start rest timer if enabled
      const settings = Storage.getSettings();
      if (settings.defaultRestSeconds > 0) {
        timer.start(settings.defaultRestSeconds);
      }
    }

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  updateSetValue(exerciseIndex, setIndex, field, value) {
    if (!this.activeSession) return;
    this.activeSession.exercises[exerciseIndex].sets[setIndex][field] = value;
    Storage.saveActiveWorkout(this.activeSession);
  }

  cycleSetType(exerciseIndex, setIndex) {
    if (!this.activeSession) return;
    const types = ['R', 'W', 'D', 'F'];
    const current = this.activeSession.exercises[exerciseIndex].sets[setIndex].type || 'R';
    const nextIdx = (types.indexOf(current) + 1) % types.length;
    this.activeSession.exercises[exerciseIndex].sets[setIndex].type = types[nextIdx];
    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  finishWorkout() {
    if (!this.activeSession) return;

    // Calculate volume and completed sets
    let totalVolume = 0;
    let completedSetsCount = 0;

    (this.activeSession.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        if (set.completed) {
          completedSetsCount++;
          const w = parseFloat(set.weight) || 0;
          const r = parseFloat(set.reps) || 0;
          totalVolume += w * r;
        }
      });
    });

    const elapsedMinutes = Math.max(1, Math.round((Date.now() - (this.activeSession.startTimestamp || Date.now())) / 60000));
    
    this.activeSession.endTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    this.activeSession.durationMinutes = elapsedMinutes;
    this.activeSession.totalVolume = Math.round(totalVolume);
    this.activeSession.totalSets = completedSetsCount;

    // 1. Save to workout log
    Storage.saveWorkout(this.activeSession);

    // 2. If this was a routine workout, automatically advance to next workout in rotation!
    if (this.activeSession && this.activeSession.isRoutine) {
      Storage.advanceRoutineCycle();
    }

    // 3. Clear active session in storage
    Storage.saveActiveWorkout(null);

    // 4. Clear timer interval and release wake lock
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }
    this.releaseWakeLock();

    // 5. Sound chime
    if (window.sound) sound.playSuccessChime();

    // 6. Show celebratory finish modal with copy of session
    const finishedCopy = { ...this.activeSession };
    this.showFinishModal(finishedCopy);

    // 7. CRITICAL FIX: Clear memory reference and hide active workout view
    this.activeSession = null;
    this.hideActiveWorkoutView();

    // 8. Re-render UI
    this.renderWorkoutHistory();
    this.renderTemplates();
    this.renderNextRoutineCard();
    if (window.streak) streak.triggerActivityCheck();
  }

  cancelWorkout() {
    if (confirm('Aktif antrenmanı iptal etmek istediğinize emin misiniz? Kaydedilmemiş veriler silinecektir.')) {
      Storage.saveActiveWorkout(null);
      this.activeSession = null;
      if (this.sessionTimerInterval) {
        clearInterval(this.sessionTimerInterval);
        this.sessionTimerInterval = null;
      }
      this.releaseWakeLock();
      this.hideActiveWorkoutView();
      this.renderNextRoutineCard();
      if (window.IronPulseApp && IronPulseApp.showToast) {
        IronPulseApp.showToast('Antrenman iptal edildi', 'info');
      }
    }
  }

  showActiveWorkoutView() {
    document.getElementById('view-workout-active').classList.remove('hidden');
    document.getElementById('view-workout-home').classList.add('hidden');
  }

  hideActiveWorkoutView() {
    document.getElementById('view-workout-active').classList.add('hidden');
    document.getElementById('view-workout-home').classList.remove('hidden');
  }

  // --- RENDER METHODS ---
  renderNextRoutineCard() {
    const targetContainers = [
      document.getElementById('daily-routine-widget'),
      document.getElementById('workout-routine-widget')
    ].filter(Boolean);

    if (targetContainers.length === 0) return;

    // --- CASE A: An active workout is already in progress ---
    if (this.activeSession) {
      const elapsedSec = Math.floor((Date.now() - (this.activeSession.startTimestamp || Date.now())) / 1000);
      const hours = Math.floor(elapsedSec / 3600);
      const mins = Math.floor((elapsedSec % 3600) / 60);
      const secs = elapsedSec % 60;
      const timeStr = hours > 0
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const activeCardHtml = `
        <div class="card-oled rounded-2xl p-4 border border-emerald-500/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 relative overflow-hidden shadow-xl glow-emerald">
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider">Antrenman Devam Ediyor</span>
            </div>
            <span class="font-mono text-xs font-bold text-emerald-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800" id="card-active-session-duration">
              ${timeStr}
            </span>
          </div>

          <h3 class="text-xl font-black text-white font-heading mb-1">
            ${this.activeSession.name}
          </h3>
          <p class="text-xs text-zinc-400 mb-4">
            ${(this.activeSession.exercises || []).length} Egzersiz • Seans şu anda aktif durumda
          </p>

          <div class="flex gap-2 mb-2">
            <button class="btn-card-finish-workout flex-1 py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95">
              <i data-lucide="check" class="w-4 h-4 stroke-[3]"></i> Antrenmanı Bitir
            </button>
            <button class="btn-card-view-workout flex-1 py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95">
              <i data-lucide="dumbbell" class="w-4 h-4 text-emerald-400"></i> Setleri Gör
            </button>
          </div>

          <div class="text-center pt-1">
            <button class="btn-card-cancel-workout text-[11px] text-zinc-500 hover:text-rose-400 transition font-medium">
              Antrenmanı İptal Et
            </button>
          </div>
        </div>
      `;

      targetContainers.forEach(container => {
        container.innerHTML = activeCardHtml;
      });

      if (window.lucide) window.lucide.createIcons();

      document.querySelectorAll('.btn-card-finish-workout').forEach(btn => {
        btn.onclick = () => this.finishWorkout();
      });

      document.querySelectorAll('.btn-card-view-workout').forEach(btn => {
        btn.onclick = () => {
          if (window.IronPulseApp && IronPulseApp.switchTab) IronPulseApp.switchTab('workout');
          else if (window.app && app.switchTab) app.switchTab('workout');
        };
      });

      document.querySelectorAll('.btn-card-cancel-workout').forEach(btn => {
        btn.onclick = () => this.cancelWorkout();
      });

      return;
    }

    // --- CASE B: Normal Next Routine Card ---
    const routine = Storage.getRoutine();
    if (!routine || !routine.days || routine.days.length === 0) return;

    const weeklyDone = Storage.getWeeklyCompletedWorkoutCount();
    const weeklyTarget = routine.weeklyTargetDays || 4;
    const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyTarget) * 100));

    let currentIndex = parseInt(routine.currentIndex, 10);
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= routine.days.length) {
      currentIndex = 0;
    }

    const currentDay = routine.days[currentIndex];
    const nextIndex = (currentIndex + 1) % routine.days.length;
    const nextDay = routine.days[nextIndex];


    const exercisePills = (currentDay.exercises || []).map(ex => {
      return `<span class="inline-flex items-center text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded-lg">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
        ${ex.name} <span class="text-zinc-500 ml-1">(${ex.sets || 3}s)</span>
      </span>`;
    }).join('');

    const daySelectOptions = routine.days.map((d, i) => {
      const isSelected = i === currentIndex ? 'selected' : '';
      return `<option value="${i}" ${isSelected}>${i + 1}. Gün: ${d.title} (${d.muscle || ''})</option>`;
    }).join('');

    const cardHtml = `
      <div class="card-oled rounded-2xl p-4 border border-emerald-500/40 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 relative overflow-hidden shadow-xl glow-emerald">
        <div class="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Top Badge & Settings Icon -->
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 border border-emerald-500/30">
              <i data-lucide="repeat" class="w-3 h-3"></i> Sıralı Rutin • ${currentIndex + 1} / ${routine.days.length}
            </span>
            <span class="text-[10px] text-zinc-300 font-medium bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
              ${currentDay.muscle || 'Hedef'} Odaklı
            </span>
          </div>

          <button class="btn-trigger-routine-settings text-zinc-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-zinc-800/80 transition" title="Rutin Ayarları">
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Day Title & Subtitle -->
        <div class="mb-3">
          <span class="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wide block mb-0.5">Sıradaki Antrenmanın</span>
          <h3 class="text-xl font-black text-white font-heading tracking-tight">
            ${currentDay.title}
          </h3>
          <p class="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span class="text-zinc-500">Sonraki Sırada:</span>
            <span class="text-zinc-300 font-semibold">${nextDay.title}</span>
          </p>
        </div>

        <!-- Exercises Planned -->
        <div class="flex flex-wrap gap-1.5 mb-3.5">
          ${exercisePills}
        </div>

        <!-- Weekly Target Progress Bar -->
        <div class="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 mb-3.5">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <span class="text-zinc-400 font-medium flex items-center gap-1">
              <i data-lucide="target" class="w-3.5 h-3.5 text-emerald-400"></i> Bu Haftaki Hedef
            </span>
            <span class="font-extrabold text-zinc-200">${weeklyDone} / ${weeklyTarget} Gün Tamamlandı <span class="text-emerald-400 text-[11px] font-bold">(%${weeklyPct})</span></span>
          </div>
          <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full progress-bar-fill transition-all duration-500" style="width: ${weeklyPct}%"></div>
          </div>
        </div>

        <!-- 1-Click Launch Button -->
        <button class="btn-start-routine-direct w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98" data-day-index="${currentIndex}">
          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
          Antrenmanı Başlat (${currentDay.title})
        </button>

        <!-- Quick Day Selector / Manual Override & Empty Workout -->
        <div class="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px]">
          <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <span class="text-zinc-500 whitespace-nowrap">Sırayı Seç:</span>
            <select class="select-quick-routine-day bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-emerald-500 truncate w-full max-w-[175px]">
              ${daySelectOptions}
            </select>
          </div>
          <button class="btn-start-empty-direct text-zinc-500 hover:text-zinc-300 whitespace-nowrap font-medium transition flex items-center gap-1">
            <i data-lucide="plus" class="w-3 h-3"></i> Serbest
          </button>
        </div>
      </div>
    `;

    targetContainers.forEach(container => {
      container.innerHTML = cardHtml;
    });

    if (window.lucide) window.lucide.createIcons();

    // Rebind listeners across rendered cards
    document.querySelectorAll('.btn-start-routine-direct').forEach(btn => {
      btn.onclick = () => {
        const dayIdx = parseInt(btn.dataset.dayIndex, 10);
        this.startRoutineWorkout(dayIdx);
      };
    });

    document.querySelectorAll('.btn-trigger-routine-settings').forEach(btn => {
      btn.onclick = () => {
        if (window.app && window.app.openRoutineSettingsModal) {
          window.app.openRoutineSettingsModal();
        }
      };
    });

    document.querySelectorAll('.select-quick-routine-day').forEach(select => {
      select.onchange = (e) => {
        const newIdx = parseInt(e.target.value, 10);
        Storage.setRoutineIndex(newIdx);
        this.renderNextRoutineCard();
      };
    });

    document.querySelectorAll('.btn-start-empty-direct').forEach(btn => {
      btn.onclick = () => {
        this.startNewWorkout(null, 'Serbest Antrenman');
      };
    });
  }

  renderTemplates() {
    const container = document.getElementById('templates-container');
    if (!container) return;

    const templates = Storage.getTemplates();
    const exercises = Storage.getExercises();

    container.innerHTML = templates.map(t => {
      const exerciseNames = t.exercises.slice(0, 3).map(te => {
        const found = exercises.find(e => e.id === te.exerciseId);
        return found ? found.name : 'Egzersiz';
      }).join(', ') + (t.exercises.length > 3 ? ` ve +${t.exercises.length - 3} daha` : '');

      return `
        <div class="card-oled p-4 rounded-2xl relative overflow-hidden group border border-zinc-800/80 hover:border-emerald-500/40">
          <div class="flex items-start justify-between mb-2">
            <div>
              <span class="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-zinc-800 text-emerald-400 mb-1.5">${t.category || 'Şablon'}</span>
              <h3 class="font-bold text-base text-zinc-100">${t.name}</h3>
            </div>
            <button class="delete-template-btn text-zinc-500 hover:text-rose-400 p-1" data-id="${t.id}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-zinc-400 mb-4 line-clamp-1">${exerciseNames}</p>
          <button class="start-template-btn w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black font-semibold text-sm flex items-center justify-center gap-2 transition" data-id="${t.id}">
            <i data-lucide="play" class="w-4 h-4 fill-current"></i>
            Antrenmanı Başlat
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Bind listeners
    container.querySelectorAll('.start-template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.startNewWorkout(btn.dataset.id);
      });
    });

    container.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
          Storage.deleteTemplate(btn.dataset.id);
          this.renderTemplates();
        }
      });
    });
  }

  renderWorkoutHistory() {
    const container = document.getElementById('workout-history-container');
    if (!container) return;

    const workouts = Storage.getWorkouts();
    if (workouts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-zinc-500 text-sm">
          <i data-lucide="dumbbell" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
          Henüz tamamlanmış antrenman yok.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = workouts.slice(0, 10).map(w => {
      let exerciseCount = w.exercises ? w.exercises.length : 0;
      return `
        <div class="card-oled p-4 rounded-xl border border-zinc-800/60 mb-2.5">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold text-sm text-zinc-100">${w.name}</h4>
              <p class="text-xs text-zinc-400">${w.date} • ${w.durationMinutes || 45} dk • ${exerciseCount} Egzersiz</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-emerald-400">${(w.totalVolume || 0).toLocaleString()} kg</span>
              <p class="text-[10px] text-zinc-500">Toplam Hacim</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  renderActiveWorkout() {
    if (!this.activeSession) return;

    const titleEl = document.getElementById('active-workout-title');
    if (titleEl) titleEl.textContent = this.activeSession.name;

    const container = document.getElementById('active-exercises-list');
    if (!container) return;

    const allExercises = Storage.getExercises();

    container.innerHTML = this.activeSession.exercises.map((exItem, exIdx) => {
      const exerciseMeta = allExercises.find(e => e.id === exItem.exerciseId) || { name: 'Egzersiz', muscle: 'Genel' };
      const ghostSets = Storage.getPreviousExerciseValues(exItem.exerciseId);

      const setsHtml = exItem.sets.map((s, sIdx) => {
        const ghost = (ghostSets && ghostSets[sIdx]) 
          ? `${ghostSets[sIdx].weight}kg × ${ghostSets[sIdx].reps}` 
          : '—';

        // Type badge colors
        const typeBadge = {
          'R': { text: 'Çalışma', class: 'bg-zinc-800 text-zinc-200' },
          'W': { text: 'Isınma', class: 'bg-amber-500/20 text-amber-300' },
          'D': { text: 'Drop', class: 'bg-cyan-500/20 text-cyan-300' },
          'F': { text: 'Failure', class: 'bg-rose-500/20 text-rose-300' }
        }[s.type || 'R'];

        return `
          <tr class="border-b border-zinc-800/40 text-xs ${s.completed ? 'bg-emerald-500/5' : ''}">
            <td class="py-2 px-1 text-center font-bold text-zinc-400">${sIdx + 1}</td>
            <td class="py-2 px-1 text-center">
              <button class="cycle-type-btn px-1.5 py-0.5 rounded text-[10px] font-bold ${typeBadge.class}" data-ex="${exIdx}" data-set="${sIdx}">
                ${s.type || 'R'}
              </button>
            </td>
            <td class="py-2 px-1 text-center ghost-val text-[11px]">${ghost}</td>
            <td class="py-2 px-1 text-center">
              <input type="number" step="0.5" placeholder="0" value="${s.weight || ''}" 
                class="set-weight-input w-14 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center text-sm font-semibold text-zinc-100 focus:border-emerald-500 focus:outline-none" 
                data-ex="${exIdx}" data-set="${sIdx}">
            </td>
            <td class="py-2 px-1 text-center">
              <input type="number" step="1" placeholder="0" value="${s.reps || ''}" 
                class="set-reps-input w-12 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center text-sm font-semibold text-zinc-100 focus:border-emerald-500 focus:outline-none" 
                data-ex="${exIdx}" data-set="${sIdx}">
            </td>
            <td class="py-2 px-1 text-center">
              <button class="toggle-set-btn w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition check-bounce ${s.completed ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-200'}" 
                data-ex="${exIdx}" data-set="${sIdx}">
                <i data-lucide="check" class="w-4 h-4 ${s.completed ? 'stroke-[3]' : ''}"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="card-oled rounded-2xl p-3.5 mb-4 border border-zinc-800/80">
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">${exerciseMeta.muscle}</span>
              <h4 class="font-bold text-sm text-zinc-100 mt-1">${exerciseMeta.name}</h4>
            </div>
            <div class="flex items-center gap-1">
              <button class="open-1rm-btn p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg" title="1RM Hesaplayıcı" data-name="${exerciseMeta.name}">
                <i data-lucide="calculator" class="w-4 h-4"></i>
              </button>
              <button class="remove-ex-btn p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg" data-ex="${exIdx}">
                <i data-lucide="more-vertical" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] text-zinc-500 border-b border-zinc-800">
                  <th class="py-1 px-1 text-center w-6">SET</th>
                  <th class="py-1 px-1 text-center w-10">TÜR</th>
                  <th class="py-1 px-1 text-center">ÖNCEKİ</th>
                  <th class="py-1 px-1 text-center w-16">KG</th>
                  <th class="py-1 px-1 text-center w-14">TEKRAR</th>
                  <th class="py-1 px-1 text-center w-10">DURUM</th>
                </tr>
              </thead>
              <tbody>
                ${setsHtml}
              </tbody>
            </table>
          </div>

          <div class="mt-3 flex gap-2">
            <button class="add-set-btn flex-1 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800 rounded-lg flex items-center justify-center gap-1 transition" data-ex="${exIdx}">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              Set Ekle
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach row events
    container.querySelectorAll('.toggle-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleSetComplete(parseInt(btn.dataset.ex), parseInt(btn.dataset.set));
      });
    });

    container.querySelectorAll('.cycle-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cycleSetType(parseInt(btn.dataset.ex), parseInt(btn.dataset.set));
      });
    });

    container.querySelectorAll('.set-weight-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.updateSetValue(parseInt(input.dataset.ex), parseInt(input.dataset.set), 'weight', e.target.value);
      });
    });

    container.querySelectorAll('.set-reps-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.updateSetValue(parseInt(input.dataset.ex), parseInt(input.dataset.set), 'reps', e.target.value);
      });
    });

    container.querySelectorAll('.add-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addSet(parseInt(btn.dataset.ex));
      });
    });

    container.querySelectorAll('.remove-ex-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeExerciseFromActiveWorkout(parseInt(btn.dataset.ex));
      });
    });

    container.querySelectorAll('.open-1rm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.open1RMModal(btn.dataset.name);
      });
    });
  }

  // --- 1RM CALCULATOR ---
  open1RMModal(exerciseName = '') {
    const modal = document.getElementById('modal-1rm');
    const title = document.getElementById('1rm-exercise-name');
    if (title) title.textContent = exerciseName || '1RM Hesaplayıcı';
    if (modal) modal.classList.remove('hidden');
    this.calc1RM();
  }

  calc1RM() {
    const weight = parseFloat(document.getElementById('1rm-weight-input')?.value || 0);
    const reps = parseFloat(document.getElementById('1rm-reps-input')?.value || 0);

    if (weight > 0 && reps > 0) {
      // Epley formula: 1RM = w * (1 + r/30)
      const epley = Math.round(weight * (1 + reps / 30));
      // Brzycki formula: 1RM = w * (36 / (37 - r))
      const brzycki = reps < 37 ? Math.round(weight * (36 / (37 - reps))) : epley;

      const oneRm = Math.round((epley + brzycki) / 2);

      const resultEl = document.getElementById('1rm-result-val');
      if (resultEl) resultEl.textContent = `${oneRm} kg`;

      // Percentage breakdown
      const percentages = [
        { pct: 95, reps: 2 },
        { pct: 90, reps: 4 },
        { pct: 85, reps: 6 },
        { pct: 80, reps: 8 },
        { pct: 75, reps: 10 },
        { pct: 70, reps: 12 }
      ];

      const pctContainer = document.getElementById('1rm-percentages');
      if (pctContainer) {
        pctContainer.innerHTML = percentages.map(p => `
          <div class="flex items-center justify-between text-xs py-1 border-b border-zinc-800">
            <span class="text-zinc-400">%${p.pct} (~${p.reps} Tekrar)</span>
            <span class="font-bold text-zinc-200">${Math.round(oneRm * (p.pct / 100))} kg</span>
          </div>
        `).join('');
      }
    }
  }

  showFinishModal(session) {
    const modal = document.getElementById('modal-workout-finish');
    if (!modal) return;

    document.getElementById('finish-summary-name').textContent = session.name;
    document.getElementById('finish-summary-volume').textContent = `${(session.totalVolume || 0).toLocaleString()} kg`;
    document.getElementById('finish-summary-duration').textContent = `${session.durationMinutes} dk`;
    document.getElementById('finish-summary-sets').textContent = session.totalSets || 0;

    modal.classList.remove('hidden');
  }
}

const workout = new WorkoutManager();
window.workout = workout;
