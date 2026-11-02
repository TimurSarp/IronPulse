// IronPulse LocalStorage, PPL Routine & Outlier-Resistant Progression Engine
// Version 3.0.0 - Pure Gym (Push/Pull/Legs) + Smart Progression + Walking KM/Steps Tracker

const STORAGE_KEYS = {
  VERSION: 'ironpulse_version',
  WORKOUTS: 'ironpulse_workouts',
  TEMPLATES: 'ironpulse_templates',
  EXERCISES: 'ironpulse_exercises',
  SETTINGS: 'ironpulse_settings',
  ACTIVE_WORKOUT: 'ironpulse_active_session',
  ROUTINE: 'ironpulse_routine',
  WALKING: 'ironpulse_walking'
};

const CURRENT_SCHEMA_VERSION = 3;

// Biometric Walking Constants for User: 174 cm height, 43 EU shoe size (~27.5 cm foot)
// Step length = 174 * 0.415 ≈ 72.21 cm + shoe factor ≈ 0.73m per step (1,370 steps per km)
const WALKING_BIOMETRICS = {
  heightCm: 174,
  shoeSizeEU: 43,
  stepLengthMeters: 0.73,
  stepsPerKm: 1370
};

// Default PPL Exercises with User's Exact Baselines (kg x sets x reps)
const DEFAULT_EXERCISES = [
  // PUSH DAY
  { id: 'ex_bench', name: 'Bench', muscle: 'Göğüs', equipment: 'Barbell', category: 'Compound', defaultIncrement: 2.5, baseline: { weight: 60, sets: 3, reps: 11 } },
  { id: 'ex_incline_bench', name: 'İncline bench', muscle: 'Göğüs', equipment: 'Barbell/Dumbbell', category: 'Compound', defaultIncrement: 2.5, baseline: { weight: 40, sets: 3, reps: 11 } },
  { id: 'ex_cable', name: 'Cable', muscle: 'Göğüs', equipment: 'Kablo', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 25, sets: 3, reps: 11 } },
  { id: 'ex_shoulder_press', name: 'Shoulder press', muscle: 'Omuz', equipment: 'Dumbbell', category: 'Compound', defaultIncrement: 2.5, baseline: { weight: 15, sets: 3, reps: 12 } },
  { id: 'ex_lateral_raise', name: 'Lateral raise', muscle: 'Omuz', equipment: 'Dumbbell', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 7.5, sets: 3, reps: 12 } },
  { id: 'ex_pushdown', name: 'Pushdown', muscle: 'Kol', equipment: 'Kablo', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 30, sets: 3, reps: 12 } },

  // PULL DAY
  { id: 'ex_db_row', name: 'Dumbell row', muscle: 'Sırt', equipment: 'Dumbbell', category: 'Compound', defaultIncrement: 2.5, baseline: { weight: 22.5, sets: 3, reps: 10 } },
  { id: 'ex_lat_pull', name: 'Lat pull', muscle: 'Sırt', equipment: 'Kablo', category: 'Compound', defaultIncrement: 5, baseline: { weight: 60, sets: 3, reps: 10 } },
  { id: 'ex_seated_cable_row', name: 'Seated cable row', muscle: 'Sırt', equipment: 'Kablo', category: 'Compound', defaultIncrement: 5, baseline: { weight: 60, sets: 3, reps: 8 } },
  { id: 'ex_facepull', name: 'Facepul', muscle: 'Omuz', equipment: 'Kablo', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 45, sets: 3, reps: 8 } },
  { id: 'ex_db_curl', name: 'Dumbell curl', muscle: 'Kol', equipment: 'Dumbbell', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 15, sets: 3, reps: 8 } },
  { id: 'ex_hammer', name: 'Hammer', muscle: 'Kol', equipment: 'Dumbbell', category: 'İzole', defaultIncrement: 2.5, baseline: { weight: 10, sets: 3, reps: 9 } },

  // OPTIONAL LEGS LIBRARY (for quick selection when user fills Legs day)
  { id: 'ex_squat', name: 'Squat', muscle: 'Bacak', equipment: 'Barbell', category: 'Compound', defaultIncrement: 5, baseline: null },
  { id: 'ex_leg_press', name: 'Leg Press', muscle: 'Bacak', equipment: 'Makine', category: 'Compound', defaultIncrement: 10, baseline: null },
  { id: 'ex_leg_extension', name: 'Leg Extension', muscle: 'Bacak', equipment: 'Makine', category: 'İzole', defaultIncrement: 5, baseline: null },
  { id: 'ex_leg_curl', name: 'Leg Curl', muscle: 'Bacak', equipment: 'Makine', category: 'İzole', defaultIncrement: 5, baseline: null },
  { id: 'ex_rdl', name: 'Romanian Deadlift', muscle: 'Bacak', equipment: 'Barbell', category: 'Compound', defaultIncrement: 5, baseline: null },
  { id: 'ex_calf_raise', name: 'Calf Raise', muscle: 'Bacak', equipment: 'Makine', category: 'İzole', defaultIncrement: 5, baseline: null }
];

// Default 3-Day PPL Rotating Routine Split (Push - Pull - Legs)
const DEFAULT_ROUTINE = {
  enabled: true,
  weeklyTargetDays: 3,
  currentIndex: 0,
  days: [
    {
      id: 'day_push',
      title: 'Push (İtiş)',
      muscle: 'Göğüs / Omuz / Triceps',
      exercises: [
        { exerciseId: 'ex_bench', name: 'Bench', muscle: 'Göğüs', sets: 3, refWeight: 60, refReps: 11 },
        { exerciseId: 'ex_incline_bench', name: 'İncline bench', muscle: 'Göğüs', sets: 3, refWeight: 40, refReps: 11 },
        { exerciseId: 'ex_cable', name: 'Cable', muscle: 'Göğüs', sets: 3, refWeight: 25, refReps: 11 },
        { exerciseId: 'ex_shoulder_press', name: 'Shoulder press', muscle: 'Omuz', sets: 3, refWeight: 15, refReps: 12 },
        { exerciseId: 'ex_lateral_raise', name: 'Lateral raise', muscle: 'Omuz', sets: 3, refWeight: 7.5, refReps: 12 },
        { exerciseId: 'ex_pushdown', name: 'Pushdown', muscle: 'Kol', sets: 3, refWeight: 30, refReps: 12 }
      ]
    },
    {
      id: 'day_pull',
      title: 'Pull (Çekiş)',
      muscle: 'Sırt / Arka Omuz / Biceps',
      exercises: [
        { exerciseId: 'ex_db_row', name: 'Dumbell row', muscle: 'Sırt', sets: 3, refWeight: 22.5, refReps: 10 },
        { exerciseId: 'ex_lat_pull', name: 'Lat pull', muscle: 'Sırt', sets: 3, refWeight: 60, refReps: 10 },
        { exerciseId: 'ex_seated_cable_row', name: 'Seated cable row', muscle: 'Sırt', sets: 3, refWeight: 60, refReps: 8 },
        { exerciseId: 'ex_facepull', name: 'Facepul', muscle: 'Omuz', sets: 3, refWeight: 45, refReps: 8 },
        { exerciseId: 'ex_db_curl', name: 'Dumbell curl', muscle: 'Kol', sets: 3, refWeight: 15, refReps: 8 },
        { exerciseId: 'ex_hammer', name: 'Hammer', muscle: 'Kol', sets: 3, refWeight: 10, refReps: 9 }
      ]
    },
    {
      id: 'day_legs',
      title: 'Legs (Bacak)',
      muscle: 'Bacak',
      exercises: [] // User will fill from inside the site
    }
  ]
};

// Default Templates synced with PPL
const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl_ppl_push',
    name: 'Push (İtiş)',
    category: 'PPL',
    exercises: DEFAULT_ROUTINE.days[0].exercises.map(e => ({
      exerciseId: e.exerciseId,
      defaultSets: e.sets
    }))
  },
  {
    id: 'tmpl_ppl_pull',
    name: 'Pull (Çekiş)',
    category: 'PPL',
    exercises: DEFAULT_ROUTINE.days[1].exercises.map(e => ({
      exerciseId: e.exerciseId,
      defaultSets: e.sets
    }))
  },
  {
    id: 'tmpl_ppl_legs',
    name: 'Legs (Bacak)',
    category: 'PPL',
    exercises: []
  }
];

// Default Settings
const DEFAULT_SETTINGS = {
  restTimerSound: true,
  restTimerVibrate: true,
  defaultRestSeconds: 90,
  wakeLockEnabled: true,
  unitSystem: 'kg',
  dailyKmTarget: 5.0,
  repTargetCeiling: 12, // 12 tekrar olunca ağırlık artır kuralı
  themeColor: '#10b981',
  themeName: 'Zümrüt Yeşili',
  themeId: 'emerald'
};

const Storage = {
  init() {
    try {
      this.checkAndRepairIntegrity();

      const version = parseInt(localStorage.getItem(STORAGE_KEYS.VERSION) || '0', 10);
      if (version === 0) {
        this.seedInitialData();
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
      } else if (version < CURRENT_SCHEMA_VERSION) {
        this.createPreMigrationBackup(version);
        this.migrate(version, CURRENT_SCHEMA_VERSION);
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
      }

      this.ensureDefaultKeys();
      this.syncOfficialExercises();
    } catch (err) {
      console.error('[IronPulse Storage] Init error:', err);
    }
  },

  createPreMigrationBackup(oldVersion) {
    try {
      const backup = {
        date: new Date().toISOString(),
        fromVersion: oldVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        data: {}
      };
      Object.keys(STORAGE_KEYS).forEach(k => {
        const keyVal = STORAGE_KEYS[k];
        backup.data[keyVal] = localStorage.getItem(keyVal);
      });
      localStorage.setItem(`ironpulse_pre_migration_v${oldVersion}`, JSON.stringify(backup));
    } catch (e) {
      console.warn('[IronPulse Storage] Could not save pre-migration snapshot:', e);
    }
  },

  migrate(fromVersion, toVersion) {
    console.log(`[IronPulse Migration] Upgrading schema v${fromVersion} -> v${toVersion} (Pure PPL & Baseline Setup)...`);

    if (fromVersion < 3) {
      // Remove old non-sport keys (tasks, nutrition, metrics)
      localStorage.removeItem('ironpulse_tasks');
      localStorage.removeItem('ironpulse_nutrition');
      localStorage.removeItem('ironpulse_metrics');

      // Set PPL Routine and Templates to user's new Push/Pull/Legs defaults
      this.set(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
      this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);

      // Remove old fake demo workouts if they were from v1/v2 seed ('workout_seed_1' etc.), and seed user's baseline
      const existingWorkouts = this.get(STORAGE_KEYS.WORKOUTS, []);
      const realUserWorkouts = existingWorkouts.filter(w => !w.id || !w.id.startsWith('workout_seed_'));
      if (realUserWorkouts.length === 0) {
        this.set(STORAGE_KEYS.WORKOUTS, this.generateBaselineWorkouts());
      } else {
        this.set(STORAGE_KEYS.WORKOUTS, realUserWorkouts);
      }

      const currentSettings = this.get(STORAGE_KEYS.SETTINGS, {});
      this.set(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...currentSettings });
    }
  },

  // Creates baseline reference workouts from the user's initial Push & Pull numbers
  // Marked with isBaseline: true so they serve as initial history/reference without inflating calibration count
  generateBaselineWorkouts() {
    const dPush = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const dPull = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0];

    const pushExercises = DEFAULT_ROUTINE.days[0].exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: Array.from({ length: ex.sets }, (_, idx) => ({
        id: `base_push_${ex.exerciseId}_${idx}`,
        type: 'R',
        weight: ex.refWeight,
        reps: ex.refReps,
        completed: true
      }))
    }));

    const pullExercises = DEFAULT_ROUTINE.days[1].exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: Array.from({ length: ex.sets }, (_, idx) => ({
        id: `base_pull_${ex.exerciseId}_${idx}`,
        type: 'R',
        weight: ex.refWeight,
        reps: ex.refReps,
        completed: true
      }))
    }));

    const calcVol = (exList) => exList.reduce((acc, ex) => {
      return acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0);
    }, 0);

    return [
      {
        id: 'baseline_pull_ref',
        name: 'Pull (Çekiş) • Başlangıç Referansı',
        isBaseline: true,
        routineDayId: 'day_pull',
        date: dPull,
        startTime: '18:00',
        endTime: '19:00',
        durationMinutes: 60,
        totalVolume: Math.round(calcVol(pullExercises)),
        totalSets: 18,
        exercises: pullExercises
      },
      {
        id: 'baseline_push_ref',
        name: 'Push (İtiş) • Başlangıç Referansı',
        isBaseline: true,
        routineDayId: 'day_push',
        date: dPush,
        startTime: '18:00',
        endTime: '19:00',
        durationMinutes: 60,
        totalVolume: Math.round(calcVol(pushExercises)),
        totalSets: 18,
        exercises: pushExercises
      }
    ];
  },

  ensureDefaultKeys() {
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES)) {
      this.set(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORKOUTS)) {
      this.set(STORAGE_KEYS.WORKOUTS, this.generateBaselineWorkouts());
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUTINE)) {
      this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WALKING)) {
      this.set(STORAGE_KEYS.WALKING, {});
    }
  },

  syncOfficialExercises() {
    try {
      const userExercises = this.get(STORAGE_KEYS.EXERCISES, []);
      let updated = false;

      DEFAULT_EXERCISES.forEach(defaultEx => {
        const idx = userExercises.findIndex(e => e.id === defaultEx.id || e.name.toLowerCase() === defaultEx.name.toLowerCase());
        if (idx === -1) {
          userExercises.push(defaultEx);
          updated = true;
        } else if (defaultEx.baseline && !userExercises[idx].baseline) {
          userExercises[idx].baseline = defaultEx.baseline;
          userExercises[idx].defaultIncrement = defaultEx.defaultIncrement || 2.5;
          updated = true;
        }
      });

      if (updated) {
        this.set(STORAGE_KEYS.EXERCISES, userExercises);
      }
    } catch (e) {
      console.warn('[IronPulse Storage] Could not sync official exercises:', e);
    }
  },

  checkAndRepairIntegrity() {
    Object.values(STORAGE_KEYS).forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw !== null) {
        try {
          JSON.parse(raw);
        } catch (err) {
          localStorage.removeItem(k);
        }
      }
    });
  },

  seedInitialData() {
    this.ensureDefaultKeys();
  },

  // Generic Get & Set
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Exercises
  getExercises() {
    return this.get(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
  },

  saveExercise(exercise) {
    const exercises = this.getExercises();
    if (!exercise.id) {
      exercise.id = 'ex_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    }
    const existingIdx = exercises.findIndex(e => e.id === exercise.id);
    if (existingIdx >= 0) {
      exercises[existingIdx] = { ...exercises[existingIdx], ...exercise };
    } else {
      exercises.push(exercise);
    }
    this.set(STORAGE_KEYS.EXERCISES, exercises);
    return exercise;
  },

  // Templates
  getTemplates() {
    return this.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  },

  saveTemplate(template) {
    const templates = this.getTemplates();
    const existingIdx = templates.findIndex(t => t.id === template.id);
    if (existingIdx >= 0) {
      templates[existingIdx] = template;
    } else {
      templates.push(template);
    }
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    return templates;
  },

  deleteTemplate(id) {
    let templates = this.getTemplates();
    templates = templates.filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    return templates;
  },

  // Workouts
  getWorkouts() {
    const workouts = this.get(STORAGE_KEYS.WORKOUTS, []);
    return workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getRealCompletedWorkoutsCount() {
    const workouts = this.getWorkouts();
    return workouts.filter(w => !w.isBaseline).length;
  },

  saveWorkout(workout) {
    const workouts = this.get(STORAGE_KEYS.WORKOUTS, []);
    const existingIdx = workouts.findIndex(w => w.id === workout.id);
    if (existingIdx >= 0) {
      workouts[existingIdx] = workout;
    } else {
      workouts.unshift(workout);
    }
    this.set(STORAGE_KEYS.WORKOUTS, workouts);
    return workouts;
  },

  deleteWorkout(id) {
    let workouts = this.get(STORAGE_KEYS.WORKOUTS, []);
    workouts = workouts.filter(w => w.id !== id);
    this.set(STORAGE_KEYS.WORKOUTS, workouts);
    return workouts;
  },

  // Active Workout Session
  getActiveWorkout() {
    return this.get(STORAGE_KEYS.ACTIVE_WORKOUT, null);
  },

  saveActiveWorkout(session) {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } else {
      this.set(STORAGE_KEYS.ACTIVE_WORKOUT, session);
    }
  },

  // Last recorded sets for an exercise
  getPreviousExerciseValues(exerciseId) {
    const workouts = this.getWorkouts();
    for (const w of workouts) {
      const match = w.exercises?.find(e => e.exerciseId === exerciseId);
      if (match && match.sets && match.sets.length > 0) {
        const validSets = match.sets.filter(s => s.completed !== false && (parseFloat(s.weight) > 0 || parseFloat(s.reps) > 0));
        if (validSets.length > 0) return validSets;
      }
    }
    // Fallback to exercise baseline if no workout history exists
    const exMeta = this.getExercises().find(e => e.id === exerciseId);
    if (exMeta && exMeta.baseline) {
      return Array.from({ length: exMeta.baseline.sets || 3 }, () => ({
        type: 'R',
        weight: exMeta.baseline.weight,
        reps: exMeta.baseline.reps,
        completed: true
      }));
    }
    return null;
  },

  // =========================================================================
  // SMART PROGRESSION & OUTLIER FILTERING ENGINE
  // Calculates:
  // 1. Chronological history of sessions for an exercise
  // 2. Outlier detection (ignores abnormally high ego-lift days or abnormally bad/tired days)
  // 3. Learned weight increment from previous jumps (or smart muscle-based default)
  // 4. 12-Rep Rule Target Recommendation ("Hedef: X kg x Y tekrar")
  // 5. Regular progression rate (% change vs filtered rolling baseline)
  // =========================================================================
  getExerciseAnalysis(exerciseId) {
    const allExercises = this.getExercises();
    const exMeta = allExercises.find(e => e.id === exerciseId) || {
      id: exerciseId,
      name: 'Hareket',
      muscle: 'Genel',
      defaultIncrement: 2.5,
      baseline: null
    };

    const settings = this.getSettings();
    const repCeiling = settings.repTargetCeiling || 12; // 12 tekrar kuralı

    // 1. Collect chronological session summaries for this exercise
    const workoutsChrono = [...this.getWorkouts()].reverse();
    const rawHistory = [];

    workoutsChrono.forEach(w => {
      const match = w.exercises?.find(e => e.exerciseId === exerciseId);
      if (!match || !match.sets) return;

      const workingSets = match.sets.filter(s =>
        s.completed !== false &&
        s.type !== 'W' &&
        parseFloat(s.weight) > 0 &&
        parseFloat(s.reps) > 0
      );
      const validSets = workingSets.length > 0
        ? workingSets
        : match.sets.filter(s => s.completed !== false && parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0);

      if (validSets.length === 0) return;

      // Primary working weight (mode or max weight among working sets)
      const weights = validSets.map(s => parseFloat(s.weight));
      const primaryWeight = Math.max(...weights);
      const setsAtPrimary = validSets.filter(s => parseFloat(s.weight) === primaryWeight);
      const avgRepsAtPrimary = Math.round(
        setsAtPrimary.reduce((sum, s) => sum + parseFloat(s.reps), 0) / setsAtPrimary.length
      );
      const minRepsAtPrimary = Math.min(...setsAtPrimary.map(s => parseFloat(s.reps)));
      const maxRepsAtPrimary = Math.max(...setsAtPrimary.map(s => parseFloat(s.reps)));

      // Epley 1RM score for session strength comparison: w * (1 + r/30)
      const epley1RM = parseFloat((primaryWeight * (1 + avgRepsAtPrimary / 30)).toFixed(2));
      const totalVolume = validSets.reduce((sum, s) => sum + (parseFloat(s.weight) * parseFloat(s.reps)), 0);

      rawHistory.push({
        workoutId: w.id,
        date: w.date,
        isBaseline: !!w.isBaseline,
        weight: primaryWeight,
        reps: avgRepsAtPrimary,
        minReps: minRepsAtPrimary,
        maxReps: maxRepsAtPrimary,
        setsCount: validSets.length,
        sets: validSets,
        epley1RM,
        totalVolume,
        isOutlier: false,
        outlierReason: null
      });
    });

    // If no history at all, check baseline
    if (rawHistory.length === 0 && exMeta.baseline) {
      const bw = exMeta.baseline.weight;
      const br = exMeta.baseline.reps;
      const bs = exMeta.baseline.sets || 3;
      rawHistory.push({
        workoutId: 'baseline_virtual',
        date: new Date().toISOString().split('T')[0],
        isBaseline: true,
        weight: bw,
        reps: br,
        minReps: br,
        maxReps: br,
        setsCount: bs,
        sets: Array.from({ length: bs }, () => ({ weight: bw, reps: br, type: 'R', completed: true })),
        epley1RM: parseFloat((bw * (1 + br / 30)).toFixed(2)),
        totalVolume: bw * br * bs,
        isOutlier: false,
        outlierReason: null
      });
    }

    // No data and no baseline (e.g., new Legs exercise)
    if (rawHistory.length === 0) {
      return {
        exerciseId,
        exerciseName: exMeta.name,
        muscle: exMeta.muscle,
        hasData: false,
        lastSession: null,
        referenceSession: null,
        recommendedIncrement: this.getSmartIncrement(exMeta, []),
        target: null,
        trendPct: 0,
        trendStatus: 'new',
        trendLabel: 'İlk Kez Yapılacak • Serbest Gir',
        outliersIgnoredCount: 0,
        history: []
      };
    }

    // 2. OUTLIER DETECTION (Aşırı iyi veya aşırı kötü günleri filtrele)
    // When we have >= 3 sessions, detect sessions that deviate excessively (>18% spike or >14% crash)
    // compared to local median of neighboring/recent sessions
    let outliersIgnoredCount = 0;
    if (rawHistory.length >= 3) {
      const scores = rawHistory.map(h => h.epley1RM);
      const sortedScores = [...scores].sort((a, b) => a - b);
      const median = sortedScores[Math.floor(sortedScores.length / 2)];

      // Calculate MAD (Median Absolute Deviation)
      const absDevs = scores.map(s => Math.abs(s - median)).sort((a, b) => a - b);
      const mad = Math.max(absDevs[Math.floor(absDevs.length / 2)], median * 0.04);

      rawHistory.forEach((item, idx) => {
        if (item.isBaseline) return; // Never mark initial baseline as outlier

        // Compare with local window (up to 4 surrounding sessions)
        const neighbors = rawHistory
          .filter((_, nIdx) => nIdx !== idx && Math.abs(nIdx - idx) <= 2)
          .map(n => n.epley1RM);

        if (neighbors.length >= 2) {
          const neighborAvg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
          const pctDiffFromNeighbors = ((item.epley1RM - neighborAvg) / neighborAvg) * 100;

          // If a single session spikes > 20% above neighbors OR drops > 15% below neighbors
          // while also being outside 2.8 * MAD, mark as statistical outlier
          if (pctDiffFromNeighbors > 20 && Math.abs(item.epley1RM - median) > 2.5 * mad) {
            item.isOutlier = true;
            item.outlierReason = 'Aşırı Yüksek Sapma (İstatistik Dışı)';
            outliersIgnoredCount++;
          } else if (pctDiffFromNeighbors < -15 && Math.abs(item.epley1RM - median) > 2.2 * mad) {
            item.isOutlier = true;
            item.outlierReason = 'Kötü Gün / Düşük Performans Sapması (Görmezden Gelindi)';
            outliersIgnoredCount++;
          }
        }
      });
    }

    const validHistory = rawHistory.filter(h => !h.isOutlier);
    const cleanList = validHistory.length > 0 ? validHistory : rawHistory;

    const lastActualSession = rawHistory[rawHistory.length - 1];
    const referenceSession = cleanList[cleanList.length - 1]; // Most recent non-outlier session

    // 3. LEARNED WEIGHT INCREMENT (Ne kadar artıracağını geçmişten ve kas grubundan hesapla)
    const recommendedIncrement = this.getSmartIncrement(exMeta, cleanList);

    // 4. REGULAR PROGRESSION RATE (Ortalama Gelişim Trendi)
    let trendPct = 0;
    let trendStatus = 'stable'; // 'up', 'down', 'stable'
    let trendLabel = 'Başlangıç Seviyesi (Baz Alındı)';

    if (cleanList.length >= 2) {
      const prevCleanSessions = cleanList.slice(Math.max(0, cleanList.length - 4), cleanList.length - 1);
      const prevAvg1RM = prevCleanSessions.reduce((sum, s) => sum + s.epley1RM, 0) / prevCleanSessions.length;
      trendPct = parseFloat((((referenceSession.epley1RM - prevAvg1RM) / prevAvg1RM) * 100).toFixed(1));

      if (trendPct >= 1.2) {
        trendStatus = 'up';
        trendLabel = `Düzenli Gelişim (+%${trendPct})`;
      } else if (trendPct <= -1.5) {
        trendStatus = 'down';
        trendLabel = `Güç Kaybı (%${trendPct})`;
      } else {
        trendStatus = 'stable';
        trendLabel = `Dengeli / Koruma (${trendPct >= 0 ? '+' : ''}%${trendPct})`;
      }
    }

    // 5. TARGET CALCULATION (12 Tekrar Kuralı & Kademeli Overload)
    const refWeight = referenceSession.weight;
    const refReps = referenceSession.reps;
    const refSets = referenceSession.setsCount || 3;

    let targetWeight = refWeight;
    let targetReps = refReps;
    let targetReason = '';
    let isWeightUp = false;

    if (refReps >= repCeiling) {
      // User hit 12+ reps! Time to increase weight and reset reps to 8-10 range
      targetWeight = parseFloat((refWeight + recommendedIncrement).toFixed(2));
      // Calculate ideal starting reps at new weight so 1RM is ~2-4% stronger without burning out
      const idealNewReps = Math.max(8, Math.min(10, Math.round(repCeiling - (recommendedIncrement / refWeight) * 28)));
      targetReps = idealNewReps;
      isWeightUp = true;
      targetReason = `${repCeiling} tekrar tamamlandı! +${recommendedIncrement} kg ağırlık artışı zamanı`;
    } else {
      // Under 12 reps: keep weight steady and push +1 rep (or +2 if very low and trending fast)
      targetWeight = refWeight;
      targetReps = Math.min(repCeiling, refReps + 1);
      isWeightUp = false;
      const repsLeftForWeightUp = repCeiling - targetReps;
      targetReason = repsLeftForWeightUp === 0
        ? `Bu antrenman ${repCeiling} tekrarı tamamla, sonraki antrenman +${recommendedIncrement} kg artacak!`
        : `+1 tekrar artış hedefi (${repCeiling} tekrarda ağırlık artacak)`;
    }

    return {
      exerciseId,
      exerciseName: exMeta.name,
      muscle: exMeta.muscle,
      hasData: true,
      lastSession: lastActualSession,
      referenceSession,
      recommendedIncrement,
      target: {
        weight: targetWeight,
        reps: targetReps,
        sets: refSets,
        isWeightUp,
        reason: targetReason,
        altWeight: isWeightUp ? refWeight : parseFloat((refWeight + recommendedIncrement).toFixed(2)),
        altReps: isWeightUp ? repCeiling + 1 : Math.max(8, refReps - 2)
      },
      trendPct,
      trendStatus,
      trendLabel,
      outliersIgnoredCount,
      history: rawHistory
    };
  },

  // Calculates how much weight to add based on past non-outlier weight jumps for this exercise/muscle
  getSmartIncrement(exMeta, cleanHistory) {
    const validJumps = [];

    if (cleanHistory && cleanHistory.length >= 2) {
      for (let i = 1; i < cleanHistory.length; i++) {
        const diff = parseFloat((cleanHistory[i].weight - cleanHistory[i - 1].weight).toFixed(2));
        // Ignore unrealistic jumps (> 15kg at once or tiny < 0.5kg)
        if (diff >= 1 && diff <= 12.5) {
          validJumps.push(diff);
        }
      }
    }

    if (validJumps.length > 0) {
      validJumps.sort((a, b) => a - b);
      const medianJump = validJumps[Math.floor(validJumps.length / 2)];
      // Round to nearest 1.25 or 2.5
      return Math.max(1.25, Math.round(medianJump / 1.25) * 1.25);
    }

    if (exMeta && exMeta.defaultIncrement) {
      return exMeta.defaultIncrement;
    }

    // Smart muscle & equipment defaults
    const muscle = (exMeta?.muscle || '').toLowerCase();
    const lastW = cleanHistory?.length > 0 ? cleanHistory[cleanHistory.length - 1].weight : 20;

    if (muscle.includes('bacak')) return lastW >= 60 ? 5 : 2.5;
    if (muscle.includes('sırt') && lastW >= 45) return 5;
    if (muscle.includes('omuz') || muscle.includes('kol')) return lastW < 12 ? 2.5 : 2.5;
    return 2.5;
  },

  // =========================================================================
  // WEEKLY SUPER STRENGTH BONUS STREAK EVALUATOR
  // Requires at least 6 real completed workouts (calibration period) before
  // awarding the +1 extra weekly strength bonus streak.
  // =========================================================================
  evaluateWeeklyStrengthBonus(justFinishedSession) {
    const CALIBRATION_MIN_WORKOUTS = 6;
    const realCount = this.getRealCompletedWorkoutsCount();

    if (realCount < CALIBRATION_MIN_WORKOUTS) {
      return {
        awarded: false,
        calibrated: false,
        realCount,
        requiredCount: CALIBRATION_MIN_WORKOUTS,
        message: `Gelişim Kalibrasyonu: ${realCount}/${CALIBRATION_MIN_WORKOUTS} antrenman tamamlandı (Bonus seri için baz veri toplanıyor)`
      };
    }

    // Check if bonus was already awarded this ISO week
    const currentWeekKey = this.getCurrentWeekKey();
    const lastBonusWeek = localStorage.getItem('ironpulse_last_bonus_streak_week');
    if (lastBonusWeek === currentWeekKey) {
      return {
        awarded: false,
        calibrated: true,
        alreadyAwardedThisWeek: true,
        realCount,
        requiredCount: CALIBRATION_MIN_WORKOUTS,
        message: 'Bu haftanın Süper Güçlenme Bonusu (+1 Seri) zaten kazanıldı!'
      };
    }

    // Evaluate exercises in the finished workout against their filtered prior history
    let improvedExercises = 0;
    let totalEvaluated = 0;
    let avgGainPct = 0;

    (justFinishedSession.exercises || []).forEach(exItem => {
      const analysis = this.getExerciseAnalysis(exItem.exerciseId);
      if (analysis && analysis.history && analysis.history.length >= 3) {
        const clean = analysis.history.filter(h => !h.isOutlier);
        if (clean.length >= 2) {
          totalEvaluated++;
          const latest = clean[clean.length - 1];
          const prev = clean[clean.length - 2];
          const gainPct = ((latest.epley1RM - prev.epley1RM) / prev.epley1RM) * 100;
          // Ignore crazy >25% single-day anomalies
          if (gainPct > 1.5 && gainPct <= 22) {
            improvedExercises++;
            avgGainPct += gainPct;
          }
        }
      }
    });

    if (totalEvaluated >= 2) {
      avgGainPct = avgGainPct / totalEvaluated;
    }

    // Award bonus if at least 60% of exercises showed solid clean progression and avg gain >= 2.2%
    const ratio = totalEvaluated > 0 ? (improvedExercises / totalEvaluated) : 0;
    if (totalEvaluated >= 2 && ratio >= 0.6 && avgGainPct >= 2.2) {
      localStorage.setItem('ironpulse_last_bonus_streak_week', currentWeekKey);
      return {
        awarded: true,
        calibrated: true,
        avgGainPct: parseFloat(avgGainPct.toFixed(1)),
        improvedExercises,
        totalEvaluated,
        message: `Haftalık Süper Güçlenme! Hareketlerin ${improvedExercises}/${totalEvaluated} tanesinde net güç artışı (+%${avgGainPct.toFixed(1)}) sağladın. +1 Ekstra Seri eklendi!`
      };
    }

    return {
      awarded: false,
      calibrated: true,
      realCount,
      requiredCount: CALIBRATION_MIN_WORKOUTS,
      message: 'Düzenli gelişim kaydedildi. Haftalık süper güçlenme barajı takip ediliyor.'
    };
  },

  getCurrentWeekKey() {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    return monday.toISOString().split('T')[0];
  },

  // =========================================================================
  // DAILY WALKING (KM <-> STEPS) TRACKER (174 cm, 43 EU Shoe)
  // =========================================================================
  getWalkingBiometrics() {
    return WALKING_BIOMETRICS;
  },

  kmToSteps(km) {
    const val = parseFloat(km) || 0;
    return Math.round(val * WALKING_BIOMETRICS.stepsPerKm);
  },

  stepsToKm(steps) {
    const val = parseInt(steps, 10) || 0;
    return parseFloat((val / WALKING_BIOMETRICS.stepsPerKm).toFixed(2));
  },

  getWalkingHistory() {
    return this.get(STORAGE_KEYS.WALKING, {});
  },

  getTodayWalking() {
    const today = new Date().toISOString().split('T')[0];
    const all = this.getWalkingHistory();
    return all[today] || { km: 0, steps: 0, updatedAt: null };
  },

  saveTodayWalkingKm(kmValue) {
    const today = new Date().toISOString().split('T')[0];
    const km = Math.max(0, parseFloat(parseFloat(kmValue || 0).toFixed(2)));
    const steps = this.kmToSteps(km);
    const all = this.getWalkingHistory();
    all[today] = { km, steps, updatedAt: new Date().toISOString() };
    this.set(STORAGE_KEYS.WALKING, all);
    return all[today];
  },

  saveTodayWalkingSteps(stepsValue) {
    const today = new Date().toISOString().split('T')[0];
    const steps = Math.max(0, parseInt(stepsValue || 0, 10));
    const km = this.stepsToKm(steps);
    const all = this.getWalkingHistory();
    all[today] = { km, steps, updatedAt: new Date().toISOString() };
    this.set(STORAGE_KEYS.WALKING, all);
    return all[today];
  },

  addTodayWalkingKm(deltaKm) {
    const current = this.getTodayWalking();
    const nextKm = Math.max(0, parseFloat(((current.km || 0) + deltaKm).toFixed(2)));
    return this.saveTodayWalkingKm(nextKm);
  },

  // Routine Split Management
  getRoutine() {
    const routine = this.get(STORAGE_KEYS.ROUTINE, null);
    if (!routine || !routine.days || routine.days.length === 0) {
      this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
      return JSON.parse(JSON.stringify(DEFAULT_ROUTINE));
    }
    return routine;
  },

  saveRoutine(routine) {
    this.set(STORAGE_KEYS.ROUTINE, routine);
    return routine;
  },

  advanceRoutineCycle() {
    const routine = this.getRoutine();
    if (!routine || !routine.days || routine.days.length === 0) return routine;
    routine.currentIndex = (routine.currentIndex + 1) % routine.days.length;
    this.saveRoutine(routine);
    return routine;
  },

  setRoutineIndex(idx) {
    const routine = this.getRoutine();
    if (!routine || !routine.days) return routine;
    if (idx >= 0 && idx < routine.days.length) {
      routine.currentIndex = idx;
      this.saveRoutine(routine);
    }
    return routine;
  },

  getWeeklyCompletedWorkoutCount() {
    const workouts = this.getWorkouts().filter(w => !w.isBaseline);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const mondayStr = monday.toISOString().split('T')[0];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    return workouts.filter(w => w.date >= mondayStr && w.date <= sundayStr).length;
  },

  // Settings
  getSettings() {
    const saved = this.get(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...saved };
  },

  saveSettings(newSettings) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    this.set(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  // Backup and Restore (JSON)
  exportFullBackup() {
    const backup = {
      version: CURRENT_SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        workouts: this.get(STORAGE_KEYS.WORKOUTS, []),
        templates: this.get(STORAGE_KEYS.TEMPLATES, []),
        exercises: this.get(STORAGE_KEYS.EXERCISES, []),
        routine: this.get(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE),
        walking: this.get(STORAGE_KEYS.WALKING, {}),
        settings: this.get(STORAGE_KEYS.SETTINGS, {}),
        streak: JSON.parse(localStorage.getItem('ironpulse_streak_state') || 'null')
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `ironpulse_ppl_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        throw new Error("Geçersiz yedek formatı: 'data' objesi bulunamadı.");
      }

      if (parsed.data.workouts) this.set(STORAGE_KEYS.WORKOUTS, parsed.data.workouts);
      if (parsed.data.templates) this.set(STORAGE_KEYS.TEMPLATES, parsed.data.templates);
      if (parsed.data.exercises) this.set(STORAGE_KEYS.EXERCISES, parsed.data.exercises);
      if (parsed.data.routine) this.set(STORAGE_KEYS.ROUTINE, parsed.data.routine);
      if (parsed.data.walking) this.set(STORAGE_KEYS.WALKING, parsed.data.walking);
      if (parsed.data.settings) this.set(STORAGE_KEYS.SETTINGS, parsed.data.settings);
      if (parsed.data.streak) localStorage.setItem('ironpulse_streak_state', JSON.stringify(parsed.data.streak));

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  hardReset() {
    try {
      localStorage.setItem('ironpulse_hard_reset_done', 'true');
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
      localStorage.removeItem('ironpulse_last_bonus_streak_week');

      // Reset to user's PPL baseline workouts and default PPL routine
      this.set(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
      this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
      this.set(STORAGE_KEYS.WORKOUTS, this.generateBaselineWorkouts());
      this.set(STORAGE_KEYS.WALKING, {});
      this.remove(STORAGE_KEYS.ACTIVE_WORKOUT);

      const cleanStreak = {
        currentStreak: 0,
        lastActiveDate: null,
        isBroken: false,
        savedStreakBeforeBreak: 0,
        bonusCount: 0
      };
      localStorage.setItem('ironpulse_streak_state', JSON.stringify(cleanStreak));

      this.ensureDefaultKeys();
      this.syncOfficialExercises();

      return true;
    } catch (err) {
      console.error('[IronPulse Storage] Hard reset error:', err);
      return false;
    }
  }
};

window.Storage = Storage;
window.DEFAULT_ROUTINE = DEFAULT_ROUTINE;
window.DEFAULT_EXERCISES = DEFAULT_EXERCISES;
