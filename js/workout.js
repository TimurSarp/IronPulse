class WorkoutManager {
  constructor() {
    this.activeSession = null;
    this.sessionTimerInterval = null;
    this.wakeLock = null;
    this.focusedExerciseIndex = 0;
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
    this.renderActivityCalendar();
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
          const count = te.defaultSets || 3;
          for (let i = 0; i < count; i++) {
            sets.push({
              id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) + '_' + i,
              type: 'R',
              weight: '', // Always empty initially as requested
              reps: '',   // Always empty initially as requested
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

    this.focusedExerciseIndex = 0;
    Storage.saveActiveWorkout(this.activeSession);
    this.startSessionTimer();
    this.requestWakeLock();
    this.enterFocusWorkoutMode();
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

    // If Legs day is empty, open the Routine Editor directly so user can add exercises
    if (!currentDay.exercises || currentDay.exercises.length === 0) {
      if (window.app && window.app.openRoutineSettingsModal) {
        window.app.openRoutineSettingsModal(idx);
        window.app.showToast(`${currentDay.title} günü için önce hareket ekleyin`, 'info');
      }
      return;
    }

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
          category: 'Kişisel',
          defaultIncrement: 2.5
        });
      }

      const sets = [];
      const setCount = routineEx.sets || 3;
      for (let s = 0; s < setCount; s++) {
        sets.push({
          id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) + '_' + s,
          type: 'R',
          weight: '', // Empty input box - user fills it
          reps: '',   // Empty input box - user fills it
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
      notes: `${currentDay.muscle || ''} PPL antrenmanı`
    };

    this.focusedExerciseIndex = 0;
    Storage.saveActiveWorkout(this.activeSession);
    this.startSessionTimer();
    this.requestWakeLock();
    this.enterFocusWorkoutMode();
  }

  enterFocusWorkoutMode() {
    this.renderActiveWorkout();
    this.showActiveWorkoutView();
    if (window.IronPulseApp && IronPulseApp.switchTab) {
      IronPulseApp.switchTab('daily');
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
      { id: 's_' + Date.now() + '_0', type: 'R', weight: '', reps: '', completed: false },
      { id: 's_' + Date.now() + '_1', type: 'R', weight: '', reps: '', completed: false },
      { id: 's_' + Date.now() + '_2', type: 'R', weight: '', reps: '', completed: false }
    ];

    this.activeSession.exercises.push({
      exerciseId: exerciseId,
      sets: sets
    });

    this.focusedExerciseIndex = this.activeSession.exercises.length - 1;
    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  removeExerciseFromActiveWorkout(index) {
    if (!this.activeSession) return;
    if (confirm('Bu hareketi antrenmandan çıkarmak istiyor musunuz?')) {
      this.activeSession.exercises.splice(index, 1);
      if (this.focusedExerciseIndex >= this.activeSession.exercises.length) {
        this.focusedExerciseIndex = Math.max(0, this.activeSession.exercises.length - 1);
      }
      Storage.saveActiveWorkout(this.activeSession);
      this.renderActiveWorkout();
    }
  }

  addSet(exerciseIndex) {
    if (!this.activeSession) return;
    const ex = this.activeSession.exercises[exerciseIndex];

    ex.sets.push({
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'R',
      weight: '',
      reps: '',
      completed: false
    });

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  removeSet(exerciseIndex, setIndex) {
    if (!this.activeSession) return;
    const ex = this.activeSession.exercises[exerciseIndex];
    if (ex.sets.length <= 1) return;
    ex.sets.splice(setIndex, 1);
    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  // Quick Stepper for Weight (+2.5kg / -2.5kg etc.)
  // If the box is currently empty, it starts from the reference/previous weight and applies the step!
  stepSetWeight(exerciseIndex, setIndex, delta) {
    if (!this.activeSession) return;
    const exItem = this.activeSession.exercises[exerciseIndex];
    const set = exItem.sets[setIndex];
    const analysis = Storage.getExerciseAnalysis(exItem.exerciseId);

    // Find fallback base weight: either previous set in this session, or reference session weight
    let baseWeight = 20;
    if (setIndex > 0 && parseFloat(exItem.sets[setIndex - 1].weight) > 0) {
      baseWeight = parseFloat(exItem.sets[setIndex - 1].weight);
    } else if (analysis && analysis.referenceSession) {
      baseWeight = analysis.referenceSession.weight;
    }

    const currentVal = parseFloat(set.weight);
    let newVal;
    if (isNaN(currentVal) || set.weight === '') {
      // Box was empty! Start from baseWeight + delta (or if tapping +, add delta to baseWeight)
      newVal = Math.max(0, parseFloat((baseWeight + delta).toFixed(2)));
    } else {
      newVal = Math.max(0, parseFloat((currentVal + delta).toFixed(2)));
    }

    set.weight = newVal;
    // If reps is still empty, also prefill reference reps so user doesn't have to type both unless they want to
    if (set.reps === '' || isNaN(parseFloat(set.reps))) {
      if (setIndex > 0 && parseFloat(exItem.sets[setIndex - 1].reps) > 0) {
        set.reps = parseFloat(exItem.sets[setIndex - 1].reps);
      } else if (analysis && analysis.target) {
        set.reps = delta > 0 && !analysis.target.isWeightUp
          ? Math.max(8, (analysis.referenceSession?.reps || 10) - 2)
          : (analysis.referenceSession?.reps || 10);
      }
    }

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  // Quick Stepper for Reps (+1 / -1 rep)
  // If the box is currently empty, it starts from the reference/previous reps and adds/subtracts 1!
  stepSetReps(exerciseIndex, setIndex, delta) {
    if (!this.activeSession) return;
    const exItem = this.activeSession.exercises[exerciseIndex];
    const set = exItem.sets[setIndex];
    const analysis = Storage.getExerciseAnalysis(exItem.exerciseId);

    let baseReps = 10;
    if (setIndex > 0 && parseFloat(exItem.sets[setIndex - 1].reps) > 0) {
      baseReps = parseFloat(exItem.sets[setIndex - 1].reps);
    } else if (analysis && analysis.referenceSession) {
      baseReps = analysis.referenceSession.reps;
    }

    const currentVal = parseInt(set.reps, 10);
    let newVal;
    if (isNaN(currentVal) || set.reps === '') {
      newVal = Math.max(1, baseReps + delta);
    } else {
      newVal = Math.max(1, currentVal + delta);
    }

    set.reps = newVal;
    // If weight is still empty, automatically set the reference weight so 1 tap is enough!
    if (set.weight === '' || isNaN(parseFloat(set.weight))) {
      if (setIndex > 0 && parseFloat(exItem.sets[setIndex - 1].weight) > 0) {
        set.weight = parseFloat(exItem.sets[setIndex - 1].weight);
      } else if (analysis && analysis.referenceSession) {
        set.weight = analysis.referenceSession.weight;
      }
    }

    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  // Quick fill a single set or all incomplete sets of an exercise with given weight & reps
  fillExerciseSets(exerciseIndex, weight, reps, onlyFirstIncomplete = true) {
    if (!this.activeSession) return;
    const exItem = this.activeSession.exercises[exerciseIndex];
    if (!exItem || !exItem.sets) return;

    if (onlyFirstIncomplete) {
      const targetSet = exItem.sets.find(s => !s.completed) || exItem.sets[0];
      if (targetSet) {
        targetSet.weight = weight;
        targetSet.reps = reps;
      }
    } else {
      exItem.sets.forEach(s => {
        if (!s.completed) {
          s.weight = weight;
          s.reps = reps;
        }
      });
    }

    if (window.sound) sound.playTone(620, 'sine', 0.06, 0.12);
    Storage.saveActiveWorkout(this.activeSession);
    this.renderActiveWorkout();
  }

  toggleSetComplete(exerciseIndex, setIndex) {
    if (!this.activeSession) return;
    const exItem = this.activeSession.exercises[exerciseIndex];
    const set = exItem.sets[setIndex];

    // If user clicks complete while weight or reps is empty, check if previous set has values or alert
    if (!set.completed && (set.weight === '' || set.reps === '')) {
      if (setIndex > 0 && exItem.sets[setIndex - 1].weight !== '' && exItem.sets[setIndex - 1].reps !== '') {
        set.weight = exItem.sets[setIndex - 1].weight;
        set.reps = exItem.sets[setIndex - 1].reps;
      } else {
        if (window.IronPulseApp) {
          window.IronPulseApp.showToast('Önce KG ve Tekrar girin veya hızlı (+ / Hedef) butonlarına dokunun', 'info');
        }
        return;
      }
    }

    set.completed = !set.completed;

    if (set.completed) {
      if (window.sound) sound.playTone(880, 'sine', 0.12, 0.2);
      const settings = Storage.getSettings();
      if (settings.defaultRestSeconds > 0 && window.timer) {
        timer.start(settings.defaultRestSeconds);
      }

      // Check if all sets of this exercise are now completed -> auto-advance focus to next exercise!
      const allDone = exItem.sets.every(s => s.completed);
      if (allDone && exerciseIndex < this.activeSession.exercises.length - 1) {
        this.focusedExerciseIndex = exerciseIndex + 1;
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

    let totalVolume = 0;
    let completedSetsCount = 0;

    (this.activeSession.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        const w = parseFloat(set.weight) || 0;
        const r = parseFloat(set.reps) || 0;
        if (set.completed || (w > 0 && r > 0)) {
          set.completed = true;
          completedSetsCount++;
          totalVolume += w * r;
        }
      });
    });

    if (completedSetsCount === 0) {
      if (!confirm('Hiçbir sete KG ve Tekrar girilmedi. Antrenmanı yine de bitirmek istiyor musunuz?')) {
        return;
      }
    }

    const elapsedMinutes = Math.max(1, Math.round((Date.now() - (this.activeSession.startTimestamp || Date.now())) / 60000));

    this.activeSession.endTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    this.activeSession.durationMinutes = elapsedMinutes;
    this.activeSession.totalVolume = Math.round(totalVolume);
    this.activeSession.totalSets = completedSetsCount;

    // 1. Save to workout log
    Storage.saveWorkout(this.activeSession);

    // 2. Advance PPL cycle if routine workout
    if (this.activeSession && this.activeSession.isRoutine) {
      Storage.advanceRoutineCycle();
    }

    // 3. Normal daily streak check
    if (window.streak) streak.triggerActivityCheck();

    // 4. Evaluate Weekly Super Strength Bonus (+1 Extra Streak after 6-workout calibration)
    const bonusEval = Storage.evaluateWeeklyStrengthBonus(this.activeSession);
    if (bonusEval && bonusEval.awarded && window.streak) {
      streak.awardWeeklyStrengthBonus();
    }

    // 5. Clear active session
    Storage.saveActiveWorkout(null);

    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }
    this.releaseWakeLock();

    if (window.sound) sound.playSuccessChime();

    const finishedCopy = { ...this.activeSession, bonusEval };
    this.activeSession = null;
    this.hideActiveWorkoutView();

    this.showFinishModal(finishedCopy);

    this.renderWorkoutHistory();
    this.renderTemplates();
    this.renderNextRoutineCard();
    this.renderActivityCalendar();
    if (window.charts) charts.renderAll();
  }

  cancelWorkout() {
    if (confirm('Aktif antrenmanı iptal etmek istediğinize emin misiniz? Girilen setler kaydedilmeyecektir.')) {
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
    document.getElementById('view-daily-preworkout')?.classList.add('hidden');
    document.getElementById('view-workout-active')?.classList.remove('hidden');
  }

  hideActiveWorkoutView() {
    document.getElementById('view-workout-active')?.classList.add('hidden');
    document.getElementById('view-daily-preworkout')?.classList.remove('hidden');
  }

  // --- PRE-WORKOUT ROUTINE CARD (Shown when user opens site at the gym) ---
  renderNextRoutineCard() {
    const targetContainers = [
      document.getElementById('daily-routine-widget'),
      document.getElementById('workout-routine-widget')
    ].filter(Boolean);

    if (targetContainers.length === 0) return;

    const routine = Storage.getRoutine();
    if (!routine || !routine.days || routine.days.length === 0) return;

    const weeklyDone = Storage.getWeeklyCompletedWorkoutCount();
    const weeklyTarget = routine.weeklyTargetDays || 3;
    const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyTarget) * 100));

    let currentIndex = parseInt(routine.currentIndex, 10);
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= routine.days.length) {
      currentIndex = 0;
    }

    const currentDay = routine.days[currentIndex];
    const allExercises = Storage.getExercises();

    // Quick PPL Day Switcher Tabs (Push / Pull / Legs)
    const pplTabsHtml = routine.days.map((d, i) => {
      const isActive = i === currentIndex;
      return `
        <button type="button" class="btn-quick-switch-ppl flex-1 py-2 px-2 rounded-xl text-xs font-extrabold transition border ${
          isActive
            ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20'
            : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        }" data-day-index="${i}">
          ${d.title}
        </button>
      `;
    }).join('');

    // Build exercise preview rows with Previous & Calculated Target
    let exercisesPreviewHtml = '';
    if (!currentDay.exercises || currentDay.exercises.length === 0) {
      exercisesPreviewHtml = `
        <div class="p-4 rounded-xl bg-zinc-900/80 border border-dashed border-zinc-700 text-center my-3">
          <p class="text-xs text-zinc-300 font-semibold mb-1">${currentDay.title} günü henüz boş</p>
          <p class="text-[11px] text-zinc-500 mb-3">Bu güne yapmak istediğin bacak hareketlerini siteden hemen ekleyebilirsin.</p>
          <button type="button" class="btn-edit-this-routine-day py-2 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-emerald-500 hover:text-black transition" data-day-index="${currentIndex}">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            ${currentDay.title} Hareketlerini Ekle
          </button>
        </div>
      `;
    } else {
      exercisesPreviewHtml = `
        <div class="space-y-2 my-3">
          ${currentDay.exercises.map((ex, idx) => {
            const matchedEx = allExercises.find(e =>
              (ex.exerciseId && e.id === ex.exerciseId) ||
              e.name.toLowerCase() === ex.name.toLowerCase()
            );
            const exId = matchedEx ? matchedEx.id : ex.exerciseId;
            const analysis = exId ? Storage.getExerciseAnalysis(exId) : null;

            const prevText = analysis && analysis.referenceSession
              ? `${analysis.referenceSession.weight}kg × ${analysis.referenceSession.reps}`
              : '—';

            let targetBadge = '';
            if (analysis && analysis.target) {
              const t = analysis.target;
              if (t.isWeightUp) {
                targetBadge = `<span class="text-[11px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">🔥 Hedef: ${t.weight}kg × ${t.reps} (+${analysis.recommendedIncrement}kg)</span>`;
              } else {
                targetBadge = `<span class="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">🎯 Hedef: ${t.weight}kg × ${t.reps}</span>`;
              }
            } else {
              targetBadge = `<span class="text-[10px] text-zinc-500">İlk kayıt</span>`;
            }

            return `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90">
                <div class="min-w-0 pr-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-black text-zinc-500">${idx + 1}.</span>
                    <span class="text-xs font-bold text-zinc-100 truncate">${ex.name}</span>
                    <span class="text-[10px] text-zinc-500">(${ex.sets || 3} set)</span>
                  </div>
                  <span class="text-[10px] text-zinc-400 block mt-0.5">Önceki: <strong class="text-zinc-200">${prevText}</strong></span>
                </div>
                <div class="flex-shrink-0 text-right">
                  ${targetBadge}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const cardHtml = `
      <div class="card-oled rounded-2xl p-4 border border-emerald-500/40 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 relative overflow-hidden shadow-xl glow-emerald">
        <!-- Top Row: PPL Badge & Edit Button -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 border border-emerald-500/30">
              <i data-lucide="dumbbell" class="w-3 h-3"></i> SIRADAKİ GÜN (${currentIndex + 1}/${routine.days.length})
            </span>
          </div>
          <button class="btn-trigger-routine-settings text-xs text-zinc-400 hover:text-emerald-400 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1 transition" data-day-index="${currentIndex}">
            <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i> Hareketleri Düzenle
          </button>
        </div>

        <!-- Fast PPL Day Switcher (Push / Pull / Legs) -->
        <div class="flex gap-1.5 mb-3">
          ${pplTabsHtml}
        </div>

        <!-- Current Day Header -->
        <div class="flex items-baseline justify-between">
          <div>
            <h3 class="text-xl font-black text-white font-heading tracking-tight">
              ${currentDay.title}
            </h3>
            <p class="text-[11px] text-zinc-400">${currentDay.muscle || 'PPL Programı'}</p>
          </div>
          <span class="text-[11px] font-bold text-zinc-400">Haftalık: <strong class="text-emerald-400">${weeklyDone}/${weeklyTarget}</strong></span>
        </div>

        <!-- Planned Exercises & Smart Targets Preview -->
        ${exercisesPreviewHtml}

        <!-- 1-Click Start Workout CTA -->
        <button class="btn-start-routine-direct w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98" data-day-index="${currentIndex}">
          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
          ${currentDay.title} Antrenmanına Başla
        </button>
      </div>
    `;

    targetContainers.forEach(container => {
      container.innerHTML = cardHtml;
    });

    if (window.lucide) window.lucide.createIcons();

    // Bind events
    document.querySelectorAll('.btn-quick-switch-ppl').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.dayIndex, 10);
        Storage.setRoutineIndex(idx);
        this.renderNextRoutineCard();
      };
    });

    document.querySelectorAll('.btn-start-routine-direct').forEach(btn => {
      btn.onclick = () => {
        const dayIdx = parseInt(btn.dataset.dayIndex, 10);
        this.startRoutineWorkout(dayIdx);
      };
    });

    document.querySelectorAll('.btn-trigger-routine-settings, .btn-edit-this-routine-day').forEach(btn => {
      btn.onclick = () => {
        const dayIdx = parseInt(btn.dataset.dayIndex, 10);
        if (window.app && window.app.openRoutineSettingsModal) {
          window.app.openRoutineSettingsModal(isNaN(dayIdx) ? null : dayIdx);
        }
      };
    });
  }

  // --- ACTIVE WORKOUT RENDERER (Focus Mode, Empty Inputs, Instant Steppers, Smart Target & Trend) ---
  renderActiveWorkout() {
    if (!this.activeSession) return;

    const titleEl = document.getElementById('active-workout-title');
    if (titleEl) titleEl.textContent = this.activeSession.name;

    const container = document.getElementById('active-exercises-list');
    if (!container) return;

    const allExercises = Storage.getExercises();

    // Calculate overall session set completion progress
    let totalSets = 0;
    let doneSets = 0;
    this.activeSession.exercises.forEach(ex => {
      (ex.sets || []).forEach(s => {
        totalSets++;
        if (s.completed) doneSets++;
      });
    });

    const progressEl = document.getElementById('active-workout-progress-text');
    if (progressEl) {
      progressEl.textContent = `${doneSets} / ${totalSets} Set`;
    }

    // Quick Exercise Jump Bar (so user can tap to jump directly to any exercise)
    const jumpBarHtml = `
      <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        ${this.activeSession.exercises.map((exItem, idx) => {
          const exMeta = allExercises.find(e => e.id === exItem.exerciseId) || { name: 'Hareket' };
          const allSetsDone = exItem.sets && exItem.sets.length > 0 && exItem.sets.every(s => s.completed);
          const isFocused = idx === this.focusedExerciseIndex;
          return `
            <button type="button" class="btn-jump-exercise px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 flex items-center gap-1.5 border transition ${
              allSetsDone
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : isFocused
                ? 'bg-zinc-100 text-black border-white shadow'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }" data-ex="${idx}">
              <span>${idx + 1}. ${exMeta.name}</span>
              ${allSetsDone ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    const exercisesCardsHtml = this.activeSession.exercises.map((exItem, exIdx) => {
      const exerciseMeta = allExercises.find(e => e.id === exItem.exerciseId) || { name: 'Hareket', muscle: 'Genel', defaultIncrement: 2.5 };
      const analysis = Storage.getExerciseAnalysis(exItem.exerciseId);
      const stepKg = analysis?.recommendedIncrement || exerciseMeta.defaultIncrement || 2.5;
      const isFocused = exIdx === this.focusedExerciseIndex;
      const allSetsCompleted = exItem.sets && exItem.sets.length > 0 && exItem.sets.every(s => s.completed);

      // Trend badge styling
      let trendBadgeHtml = '';
      if (analysis && analysis.hasData) {
        if (analysis.trendStatus === 'up') {
          trendBadgeHtml = `<span class="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">📈 ${analysis.trendLabel}</span>`;
        } else if (analysis.trendStatus === 'down') {
          trendBadgeHtml = `<span class="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">📉 ${analysis.trendLabel}</span>`;
        } else {
          trendBadgeHtml = `<span class="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">⚖️ ${analysis.trendLabel}</span>`;
        }
      } else {
        trendBadgeHtml = `<span class="text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-lg">İlk Kayıt</span>`;
      }

      const outlierNoteHtml = (analysis && analysis.outliersIgnoredCount > 0)
        ? `<span class="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded" title="Aşırı iyi/kötü sapma gösteren ${analysis.outliersIgnoredCount} seans ortalama hesabından çıkarıldı">🛡️ ${analysis.outliersIgnoredCount} uç seans filtrelendi</span>`
        : '';

      // Pre-exercise Intelligence Panel (Önceki vs Bugünkü Hedef + Tek Tıkla Doldur)
      let intelligenceBannerHtml = '';
      if (analysis && analysis.hasData && analysis.referenceSession && analysis.target) {
        const ref = analysis.referenceSession;
        const tgt = analysis.target;
        intelligenceBannerHtml = `
          <div class="bg-zinc-900/95 border ${tgt.isWeightUp ? 'border-amber-500/40' : 'border-emerald-500/30'} rounded-xl p-3 mb-3">
            <div class="grid grid-cols-2 gap-2 pb-2 mb-2 border-b border-zinc-800/80">
              <div>
                <span class="text-[10px] text-zinc-400 uppercase font-bold block">Önceki Seans (Baz)</span>
                <span class="text-sm font-extrabold text-zinc-100">${ref.weight} kg × ${ref.reps} tekrar</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] ${tgt.isWeightUp ? 'text-amber-400' : 'text-emerald-400'} uppercase font-extrabold block">
                  ${tgt.isWeightUp ? '🔥 Ağırlık Artış Hedefi' : '🎯 Bugünkü Hedef'}
                </span>
                <span class="text-sm font-black ${tgt.isWeightUp ? 'text-amber-300' : 'text-emerald-300'}">
                  ${tgt.weight} kg × ${tgt.reps} tekrar
                </span>
              </div>
            </div>

            <p class="text-[11px] text-zinc-300 mb-2.5 flex items-center justify-between gap-1 flex-wrap">
              <span>💡 ${tgt.reason}</span>
              ${outlierNoteHtml}
            </p>

            <!-- 1-Tap Quick Fill Actions -->
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="btn-quick-fill-set py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95"
                data-ex="${exIdx}" data-w="${ref.weight}" data-r="${ref.reps}">
                ↺ Öncekini Yaz (${ref.weight}×${ref.reps})
              </button>
              <button type="button" class="btn-quick-fill-set py-1.5 px-2.5 rounded-lg ${tgt.isWeightUp ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'} text-[11px] font-extrabold flex items-center justify-center gap-1 transition active:scale-95"
                data-ex="${exIdx}" data-w="${tgt.weight}" data-r="${tgt.reps}">
                ⚡ Hedefi Yaz (${tgt.weight}×${tgt.reps})
              </button>
            </div>
          </div>
        `;
      }

      const refPlaceholderW = analysis?.referenceSession?.weight || '';
      const refPlaceholderR = analysis?.target?.reps || analysis?.referenceSession?.reps || '';

      const setsHtml = exItem.sets.map((s, sIdx) => {
        return `
          <div class="p-2.5 rounded-xl border mb-2 transition ${
            s.completed
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-zinc-900/70 border-zinc-800/90'
          }">
            <div class="flex items-center justify-between gap-1.5">
              <!-- Set Number -->
              <div class="flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-lg ${s.completed ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300'} text-xs font-black flex items-center justify-center">
                  ${sIdx + 1}
                </span>
              </div>

              <!-- KG Input + Quick -/+ Buttons -->
              <div class="flex items-center gap-1">
                <button type="button" class="btn-step-kg w-7 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs flex items-center justify-center active:scale-90 transition"
                  data-ex="${exIdx}" data-set="${sIdx}" data-delta="${-stepKg}" title="-${stepKg} kg">
                  -${stepKg}
                </button>
                <div class="relative">
                  <input type="number" step="0.5" placeholder="${refPlaceholderW ? refPlaceholderW + 'kg' : 'KG'}" value="${s.weight !== undefined && s.weight !== null ? s.weight : ''}"
                    class="set-weight-input w-16 bg-zinc-950 border border-zinc-700 rounded-lg py-1.5 text-center text-sm font-black text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    data-ex="${exIdx}" data-set="${sIdx}">
                </div>
                <button type="button" class="btn-step-kg w-7 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-extrabold text-xs flex items-center justify-center active:scale-90 transition"
                  data-ex="${exIdx}" data-set="${sIdx}" data-delta="${stepKg}" title="+${stepKg} kg">
                  +${stepKg}
                </button>
              </div>

              <span class="text-zinc-600 font-bold text-xs">×</span>

              <!-- Reps Input + Quick -1/+1 Buttons -->
              <div class="flex items-center gap-1">
                <button type="button" class="btn-step-reps w-7 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs flex items-center justify-center active:scale-90 transition"
                  data-ex="${exIdx}" data-set="${sIdx}" data-delta="-1" title="-1 tekrar">
                  -1
                </button>
                <div>
                  <input type="number" step="1" placeholder="${refPlaceholderR ? refPlaceholderR + 't' : 'Tekrar'}" value="${s.reps !== undefined && s.reps !== null ? s.reps : ''}"
                    class="set-reps-input w-14 bg-zinc-950 border border-zinc-700 rounded-lg py-1.5 text-center text-sm font-black text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    data-ex="${exIdx}" data-set="${sIdx}">
                </div>
                <button type="button" class="btn-step-reps w-7 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-extrabold text-xs flex items-center justify-center active:scale-90 transition"
                  data-ex="${exIdx}" data-set="${sIdx}" data-delta="1" title="+1 tekrar">
                  +1
                </button>
              </div>

              <!-- Complete Set Check Button -->
              <button type="button" class="toggle-set-btn w-9 h-8 rounded-xl flex items-center justify-center transition check-bounce flex-shrink-0 ${
                s.completed
                  ? 'bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }" data-ex="${exIdx}" data-set="${sIdx}" title="Seti Tamamla">
                <i data-lucide="check" class="w-4 h-4 ${s.completed ? 'stroke-[3]' : ''}"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div id="active-ex-card-${exIdx}" class="card-oled rounded-2xl p-3.5 mb-4 border transition ${
          isFocused
            ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/5'
            : allSetsCompleted
            ? 'border-emerald-500/20 opacity-85'
            : 'border-zinc-800/80'
        }">
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-2 mb-2.5">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">${exIdx + 1}. ${exerciseMeta.muscle}</span>
                ${trendBadgeHtml}
              </div>
              <h4 class="font-black text-base text-white mt-1">${exerciseMeta.name}</h4>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="open-1rm-btn p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg" title="1RM Hesaplayıcı" data-name="${exerciseMeta.name}">
                <i data-lucide="calculator" class="w-4 h-4"></i>
              </button>
              <button type="button" class="remove-ex-btn p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg" data-ex="${exIdx}" title="Hareketi Çıkar">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Pre-Exercise Target & Development Intelligence -->
          ${intelligenceBannerHtml}

          <!-- Sets Rows -->
          <div>
            ${setsHtml}
          </div>

          <!-- Add / Remove Set Footer -->
          <div class="mt-2 flex gap-2">
            <button type="button" class="add-set-btn flex-1 py-1.5 text-xs font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-1 transition" data-ex="${exIdx}">
              <i data-lucide="plus" class="w-3.5 h-3.5 text-emerald-400"></i> Set Ekle
            </button>
            ${exItem.sets.length > 1 ? `
              <button type="button" class="remove-last-set-btn py-1.5 px-3 text-xs font-semibold text-zinc-500 hover:text-rose-400 bg-zinc-900 border border-zinc-800 rounded-xl transition" data-ex="${exIdx}">
                Set Sil
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = jumpBarHtml + exercisesCardsHtml;

    if (window.lucide) window.lucide.createIcons();

    // Bind events
    container.querySelectorAll('.btn-jump-exercise').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.ex, 10);
        this.focusedExerciseIndex = idx;
        this.renderActiveWorkout();
        const card = document.getElementById(`active-ex-card-${idx}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    container.querySelectorAll('.btn-quick-fill-set').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex, 10);
        const w = parseFloat(btn.dataset.w);
        const r = parseInt(btn.dataset.r, 10);
        this.fillExerciseSets(exIdx, w, r, false);
      });
    });

    container.querySelectorAll('.btn-step-kg').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex, 10);
        const setIdx = parseInt(btn.dataset.set, 10);
        const delta = parseFloat(btn.dataset.delta);
        this.stepSetWeight(exIdx, setIdx, delta);
      });
    });

    container.querySelectorAll('.btn-step-reps').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex, 10);
        const setIdx = parseInt(btn.dataset.set, 10);
        const delta = parseInt(btn.dataset.delta, 10);
        this.stepSetReps(exIdx, setIdx, delta);
      });
    });

    container.querySelectorAll('.toggle-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleSetComplete(parseInt(btn.dataset.ex, 10), parseInt(btn.dataset.set, 10));
      });
    });

    container.querySelectorAll('.set-weight-input').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateSetValue(parseInt(input.dataset.ex, 10), parseInt(input.dataset.set, 10), 'weight', e.target.value);
      });
    });

    container.querySelectorAll('.set-reps-input').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateSetValue(parseInt(input.dataset.ex, 10), parseInt(input.dataset.set, 10), 'reps', e.target.value);
      });
    });

    container.querySelectorAll('.add-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addSet(parseInt(btn.dataset.ex, 10));
      });
    });

    container.querySelectorAll('.remove-last-set-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = parseInt(btn.dataset.ex, 10);
        const ex = this.activeSession.exercises[exIdx];
        if (ex && ex.sets.length > 1) {
          this.removeSet(exIdx, ex.sets.length - 1);
        }
      });
    });

    container.querySelectorAll('.remove-ex-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeExerciseFromActiveWorkout(parseInt(btn.dataset.ex, 10));
      });
    });

    container.querySelectorAll('.open-1rm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.open1RMModal(btn.dataset.name);
      });
    });
  }

  renderTemplates() {
    const container = document.getElementById('templates-container');
    if (!container) return;

    const routine = Storage.getRoutine();
    if (!routine || !routine.days) return;

    container.innerHTML = routine.days.map((day, idx) => {
      const exList = (day.exercises || []).map(e => `${e.name} (${e.sets || 3}s)`).join(' • ');
      return `
        <div class="card-oled p-4 rounded-2xl border border-zinc-800/80 hover:border-emerald-500/40">
          <div class="flex items-start justify-between mb-2">
            <div>
              <span class="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-500/15 text-emerald-400 mb-1">PPL • ${idx + 1}. GÜN</span>
              <h3 class="font-bold text-base text-zinc-100">${day.title}</h3>
            </div>
            <button class="edit-ppl-day-btn text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800" data-idx="${idx}">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Düzenle
            </button>
          </div>
          <p class="text-xs text-zinc-400 mb-3">${exList || 'Henüz hareket eklenmedi (Düzenle butonundan ekleyebilirsin)'}</p>
          <button class="start-ppl-day-btn w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs flex items-center justify-center gap-2 transition" data-idx="${idx}">
            <i data-lucide="play" class="w-4 h-4 fill-current"></i>
            ${day.title} Antrenmanını Başlat
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    container.querySelectorAll('.start-ppl-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.startRoutineWorkout(parseInt(btn.dataset.idx, 10));
      });
    });

    container.querySelectorAll('.edit-ppl-day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.app && window.app.openRoutineSettingsModal) {
          window.app.openRoutineSettingsModal(parseInt(btn.dataset.idx, 10));
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
          Henüz tamamlanmış antrenman yok.
        </div>
      `;
      return;
    }

    const allExercises = Storage.getExercises();

    container.innerHTML = workouts.slice(0, 12).map(w => {
      const exerciseCount = w.exercises ? w.exercises.length : 0;
      const summaryPills = (w.exercises || []).slice(0, 4).map(exItem => {
        const meta = allExercises.find(e => e.id === exItem.exerciseId);
        const name = meta ? meta.name : 'Hareket';
        const bestSet = (exItem.sets || []).reduce((best, s) => {
          return (parseFloat(s.weight) || 0) > (parseFloat(best?.weight) || 0) ? s : best;
        }, null);
        return bestSet
          ? `<span class="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded">${name}: ${bestSet.weight}×${bestSet.reps}</span>`
          : '';
      }).join('');

      return `
        <div class="card-oled p-3.5 rounded-xl border border-zinc-800/70 mb-2.5">
          <div class="flex items-center justify-between mb-1.5">
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-sm text-zinc-100">${w.name}</h4>
                ${w.isBaseline ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">Referans</span>' : ''}
              </div>
              <p class="text-[11px] text-zinc-400">${w.date} • ${w.durationMinutes || 45} dk • ${exerciseCount} Hareket</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-extrabold text-emerald-400">${(w.totalVolume || 0).toLocaleString()} kg</span>
              <p class="text-[10px] text-zinc-500">Toplam Tonaj</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1 mt-1">
            ${summaryPills}
          </div>
        </div>
      `;
    }).join('');
  }

  renderActivityCalendar() {
    const container = document.getElementById('activity-heatmap-grid');
    if (!container) return;

    const workouts = Storage.getWorkouts().filter(w => !w.isBaseline);
    const workoutDates = new Set(workouts.map(w => w.date));

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDateStr = now.toISOString().split('T')[0];

    let html = '';
    let completedInMonth = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dateStr = dayDate.toISOString().split('T')[0];
      const hasWorkout = workoutDates.has(dateStr);
      const isToday = dateStr === todayDateStr;

      if (hasWorkout) completedInMonth++;

      let bgClass = 'bg-zinc-900 border-zinc-800 text-zinc-600';
      if (hasWorkout) {
        bgClass = 'bg-emerald-500 border-emerald-400 text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.4)]';
      } else if (isToday) {
        bgClass = 'bg-zinc-800 border-cyan-400 text-cyan-400 font-bold';
      }

      html += `
        <div class="heat-cell border flex flex-col items-center justify-center text-[10px] ${bgClass}" title="${dateStr}">
          <span>${day}</span>
        </div>
      `;
    }

    container.innerHTML = html;

    const monthName = now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    const monthTitle = document.getElementById('heatmap-month-title');
    if (monthTitle) monthTitle.textContent = monthName.toUpperCase();

    const countEl = document.getElementById('heatmap-month-count');
    if (countEl) countEl.textContent = `${completedInMonth} Antrenman`;
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
      const epley = Math.round(weight * (1 + reps / 30));
      const brzycki = reps < 37 ? Math.round(weight * (36 / (37 - reps))) : epley;
      const oneRm = Math.round((epley + brzycki) / 2);

      const resultEl = document.getElementById('1rm-result-val');
      if (resultEl) resultEl.textContent = `${oneRm} kg`;

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

    const bonusBanner = document.getElementById('finish-bonus-streak-banner');
    if (bonusBanner) {
      if (session.bonusEval && session.bonusEval.awarded) {
        bonusBanner.className = 'mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold';
        bonusBanner.innerHTML = `🔥 ${session.bonusEval.message}`;
        bonusBanner.classList.remove('hidden');
      } else if (session.bonusEval && session.bonusEval.message) {
        bonusBanner.className = 'mb-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]';
        bonusBanner.innerHTML = session.bonusEval.message;
        bonusBanner.classList.remove('hidden');
      } else {
        bonusBanner.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
  }
}

const workout = new WorkoutManager();
window.workout = workout;
