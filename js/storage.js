// IronPulse LocalStorage & State Management System
// Version 1.0.0 with automated migrations and zero backend dependency

const STORAGE_KEYS = {
  VERSION: 'ironpulse_version',
  WORKOUTS: 'ironpulse_workouts',
  TEMPLATES: 'ironpulse_templates',
  EXERCISES: 'ironpulse_exercises',
  TASKS: 'ironpulse_tasks',
  METRICS: 'ironpulse_metrics',
  NUTRITION: 'ironpulse_nutrition',
  SETTINGS: 'ironpulse_settings',
  ACTIVE_WORKOUT: 'ironpulse_active_session',
  ROUTINE: 'ironpulse_routine'
};

const CURRENT_SCHEMA_VERSION = 2;

// Default initial exercises database
const DEFAULT_EXERCISES = [
  { id: 'ex_bench_press', name: 'Barbell Bench Press', muscle: 'Göğüs', equipment: 'Barbell', category: 'Compound' },
  { id: 'ex_inc_db_press', name: 'Incline Dumbbell Press', muscle: 'Göğüs', equipment: 'Dumbbell', category: 'Compound' },
  { id: 'ex_cable_fly', name: 'Cable Chest Fly', muscle: 'Göğüs', equipment: 'Kablo', category: 'İzole' },
  { id: 'ex_lat_pulldown', name: 'Lat Pulldown', muscle: 'Sırt', equipment: 'Kablo', category: 'Compound' },
  { id: 'ex_bb_row', name: 'Barbell Bent Over Row', muscle: 'Sırt', equipment: 'Barbell', category: 'Compound' },
  { id: 'ex_seated_cable_row', name: 'Seated Cable Row', muscle: 'Sırt', equipment: 'Kablo', category: 'Compound' },
  { id: 'ex_ohp', name: 'Overhead Press (OHP)', muscle: 'Omuz', equipment: 'Barbell', category: 'Compound' },
  { id: 'ex_lateral_raise', name: 'Dumbbell Lateral Raise', muscle: 'Omuz', equipment: 'Dumbbell', category: 'İzole' },
  { id: 'ex_face_pull', name: 'Cable Face Pull', muscle: 'Omuz', equipment: 'Kablo', category: 'İzole' },
  { id: 'ex_squat', name: 'Barbell Back Squat', muscle: 'Bacak', equipment: 'Barbell', category: 'Compound' },
  { id: 'ex_rdl', name: 'Romanian Deadlift (RDL)', muscle: 'Bacak', equipment: 'Barbell', category: 'Compound' },
  { id: 'ex_leg_press', name: 'Leg Press', muscle: 'Bacak', equipment: 'Makine', category: 'Compound' },
  { id: 'ex_leg_curl', name: 'Lying Leg Curl', muscle: 'Bacak', equipment: 'Makine', category: 'İzole' },
  { id: 'ex_calf_raise', name: 'Standing Calf Raise', muscle: 'Bacak', equipment: 'Makine', category: 'İzole' },
  { id: 'ex_bb_curl', name: 'Barbell Biceps Curl', muscle: 'Kol', equipment: 'Barbell', category: 'İzole' },
  { id: 'ex_hammer_curl', name: 'Hammer Curl', muscle: 'Kol', equipment: 'Dumbbell', category: 'İzole' },
  { id: 'ex_triceps_pushdown', name: 'Triceps Rope Pushdown', muscle: 'Kol', equipment: 'Kablo', category: 'İzole' },
  { id: 'ex_skullcrusher', name: 'EZ-Bar Skullcrusher', muscle: 'Kol', equipment: 'Barbell', category: 'İzole' },
  { id: 'ex_plank', name: 'Hanging Leg Raise / Plank', muscle: 'Karın', equipment: 'Vücut Ağırlığı', category: 'İzole' }
];

// Default Workout Templates
const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl_ppl_push',
    name: 'Push (İtiş) - Göğüs / Omuz / Triceps',
    category: 'PPL',
    exercises: [
      { exerciseId: 'ex_bench_press', defaultSets: 4 },
      { exerciseId: 'ex_inc_db_press', defaultSets: 3 },
      { exerciseId: 'ex_ohp', defaultSets: 3 },
      { exerciseId: 'ex_lateral_raise', defaultSets: 4 },
      { exerciseId: 'ex_triceps_pushdown', defaultSets: 4 }
    ]
  },
  {
    id: 'tmpl_ppl_pull',
    name: 'Pull (Çekiş) - Sırt / Arka Omuz / Biceps',
    category: 'PPL',
    exercises: [
      { exerciseId: 'ex_lat_pulldown', defaultSets: 4 },
      { exerciseId: 'ex_bb_row', defaultSets: 4 },
      { exerciseId: 'ex_seated_cable_row', defaultSets: 3 },
      { exerciseId: 'ex_face_pull', defaultSets: 4 },
      { exerciseId: 'ex_bb_curl', defaultSets: 3 },
      { exerciseId: 'ex_hammer_curl', defaultSets: 3 }
    ]
  },
  {
    id: 'tmpl_ppl_legs',
    name: 'Legs (Bacak) - Quad / Hamstring / Kalf',
    category: 'PPL',
    exercises: [
      { exerciseId: 'ex_squat', defaultSets: 4 },
      { exerciseId: 'ex_rdl', defaultSets: 4 },
      { exerciseId: 'ex_leg_press', defaultSets: 3 },
      { exerciseId: 'ex_leg_curl', defaultSets: 3 },
      { exerciseId: 'ex_calf_raise', defaultSets: 4 }
    ]
  }
];

// Default Starter Tasks (showing both Checkbox and Numeric target capability)
const DEFAULT_TASKS = [
  {
    id: 'task_demo_1',
    title: 'Önemli müşteri e-postaları ve mesajları yanıtla',
    type: 'checkbox', // 'checkbox' or 'numeric'
    category: 'İş',
    completed: false,
    recurring: true,
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'task_demo_2',
    title: 'İş Geliştirme / Satış Soğuk Aramaları',
    type: 'numeric',
    category: 'İş',
    current: 4,
    target: 15,
    unit: 'Görüşme',
    recurring: true,
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'task_demo_3',
    title: 'Mesleki Kitap / Makale Okuma',
    type: 'numeric',
    category: 'Gelişim',
    current: 12,
    target: 25,
    unit: 'Sayfa',
    recurring: true,
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'task_demo_4',
    title: 'Gün sonu kasa / finans raporu kontrolü',
    type: 'checkbox',
    category: 'Finans',
    completed: false,
    recurring: true,
    lastResetDate: new Date().toISOString().split('T')[0]
  }
];

// Default Settings
const DEFAULT_SETTINGS = {
  restTimerSound: true,
  restTimerVibrate: true,
  defaultRestSeconds: 90,
  wakeLockEnabled: true,
  unitSystem: 'kg',
  calorieTarget: 2500,
  proteinTarget: 160,
  carbTarget: 270,
  fatTarget: 65,
  waterTarget: 3000,
  themeColor: '#10b981',
  themeName: 'Zümrüt Yeşili',
  themeId: 'emerald'
};

// Default 4-Day Rotating Routine Split (Göğüs, Omuz, Sırt, Bacak)
const DEFAULT_ROUTINE = {
  enabled: true,
  weeklyTargetDays: 4,
  currentIndex: 0,
  days: [
    {
      id: 'day_chest',
      title: '1. Gün: Göğüs',
      muscle: 'Göğüs',
      exercises: [
        { name: 'Barbell Bench Press', muscle: 'Göğüs', sets: 4 },
        { name: 'Incline Dumbbell Press', muscle: 'Göğüs', sets: 3 },
        { name: 'Cable Chest Fly', muscle: 'Göğüs', sets: 3 },
        { name: 'Triceps Rope Pushdown', muscle: 'Kol', sets: 3 }
      ]
    },
    {
      id: 'day_shoulder',
      title: '2. Gün: Omuz',
      muscle: 'Omuz',
      exercises: [
        { name: 'Overhead Press (OHP)', muscle: 'Omuz', sets: 4 },
        { name: 'Dumbbell Lateral Raise', muscle: 'Omuz', sets: 4 },
        { name: 'Cable Face Pull', muscle: 'Omuz', sets: 3 },
        { name: 'EZ-Bar Skullcrusher', muscle: 'Kol', sets: 3 }
      ]
    },
    {
      id: 'day_back',
      title: '3. Gün: Sırt',
      muscle: 'Sırt',
      exercises: [
        { name: 'Lat Pulldown', muscle: 'Sırt', sets: 4 },
        { name: 'Barbell Bent Over Row', muscle: 'Sırt', sets: 4 },
        { name: 'Seated Cable Row', muscle: 'Sırt', sets: 3 },
        { name: 'Barbell Biceps Curl', muscle: 'Kol', sets: 3 }
      ]
    },
    {
      id: 'day_legs',
      title: '4. Gün: Bacak',
      muscle: 'Bacak',
      exercises: [
        { name: 'Barbell Back Squat', muscle: 'Bacak', sets: 4 },
        { name: 'Romanian Deadlift (RDL)', muscle: 'Bacak', sets: 4 },
        { name: 'Leg Press', muscle: 'Bacak', sets: 3 },
        { name: 'Standing Calf Raise', muscle: 'Bacak', sets: 4 }
      ]
    }
  ]
};

const Storage = {
  init() {
    try {
      this.checkAndRepairIntegrity();

      const isHardReset = localStorage.getItem('ironpulse_hard_reset_done') === 'true';
      const version = parseInt(localStorage.getItem(STORAGE_KEYS.VERSION) || '0', 10);
      if (version === 0) {
        // First time initialization
        if (!isHardReset) {
          this.seedInitialData();
        }
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
      } else if (version < CURRENT_SCHEMA_VERSION) {
        // Safe upgrade with automatic pre-migration snapshot
        this.createPreMigrationBackup(version);
        this.migrate(version, CURRENT_SCHEMA_VERSION);
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());
      }

      // Always ensure new keys & new exercises from updates exist non-destructively
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
      console.log(`[IronPulse Storage] Created pre-migration safety backup for schema v${oldVersion}`);
    } catch (e) {
      console.warn('[IronPulse Storage] Could not save pre-migration snapshot:', e);
    }
  },

  migrate(fromVersion, toVersion) {
    console.log(`[IronPulse Migration] Migrating user data safely from v${fromVersion} to v${toVersion}...`);

    // Migration Step 1 -> 2
    if (fromVersion < 2) {
      // 1. Ensure Routine is present and normalized
      const routine = this.get(STORAGE_KEYS.ROUTINE, null);
      if (!routine || !routine.days || routine.days.length === 0) {
        this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
      } else {
        if (typeof routine.currentIndex !== 'number') routine.currentIndex = 0;
        if (!routine.weeklyTargetDays) routine.weeklyTargetDays = 4;
        this.set(STORAGE_KEYS.ROUTINE, routine);
      }

      // 2. Safely merge settings without wiping user's preferences
      const currentSettings = this.get(STORAGE_KEYS.SETTINGS, {});
      const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
      this.set(STORAGE_KEYS.SETTINGS, mergedSettings);

      console.log('[IronPulse Migration] Schema v2 upgrade complete.');
    }

    // Future version steps (e.g. if (fromVersion < 3) { ... }) can be added here seamlessly!
  },

  ensureDefaultKeys() {
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES)) {
      this.set(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      this.set(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORKOUTS)) {
      this.set(STORAGE_KEYS.WORKOUTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.METRICS)) {
      this.set(STORAGE_KEYS.METRICS, {});
    }
    if (!localStorage.getItem(STORAGE_KEYS.NUTRITION)) {
      this.set(STORAGE_KEYS.NUTRITION, {});
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUTINE)) {
      this.set(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
    }
  },

  syncOfficialExercises() {
    try {
      const userExercises = this.get(STORAGE_KEYS.EXERCISES, []);
      let updated = false;

      DEFAULT_EXERCISES.forEach(defaultEx => {
        const exists = userExercises.some(e => e.id === defaultEx.id || e.name.toLowerCase() === defaultEx.name.toLowerCase());
        if (!exists) {
          userExercises.push(defaultEx);
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
          console.warn(`[IronPulse Storage] Repaired corrupted key: ${k}`);
          localStorage.removeItem(k);
        }
      }
    });
  },

  seedInitialData() {
    if (localStorage.getItem('ironpulse_hard_reset_done') === 'true') {
      this.ensureDefaultKeys();
      return;
    }
    this.ensureDefaultKeys();
    // Seed a couple of realistic past workouts so charts look alive immediately on fresh install
    if (this.getWorkouts().length === 0) {
      const samplePastWorkouts = this.generateSampleWorkouts();
      this.set(STORAGE_KEYS.WORKOUTS, samplePastWorkouts);
    }
    if (Object.keys(this.getMetrics()).length === 0) {
      const sampleMetrics = this.generateSampleMetrics();
      this.set(STORAGE_KEYS.METRICS, sampleMetrics);
    }
    if (Object.keys(this.get(STORAGE_KEYS.NUTRITION, {})).length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const starterNutrition = {};
      starterNutrition[today] = {
        calories: 1850,
        protein: 135,
        carbs: 190,
        fat: 52,
        water: 2000
      };
      this.set(STORAGE_KEYS.NUTRITION, starterNutrition);
    }
  },

  // Generates 4 sample past workouts across the last 2 weeks
  generateSampleWorkouts() {
    const today = new Date();
    const workouts = [];
    const dates = [-10, -7, -4, -1];
    
    dates.forEach((dOffset, idx) => {
      const wDate = new Date(today);
      wDate.setDate(wDate.getDate() + dOffset);
      const isPush = idx % 2 === 0;

      workouts.push({
        id: 'workout_seed_' + (idx + 1),
        name: isPush ? 'Push (İtiş) A' : 'Pull (Çekiş) B',
        date: wDate.toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '19:15',
        durationMinutes: 75,
        exercises: isPush ? [
          {
            exerciseId: 'ex_bench_press',
            sets: [
              { type: 'W', weight: 50, reps: 10, completed: true },
              { type: 'R', weight: 75 + (idx * 2.5), reps: 8, completed: true },
              { type: 'R', weight: 80 + (idx * 2.5), reps: 6, completed: true },
              { type: 'R', weight: 80 + (idx * 2.5), reps: 6, completed: true }
            ]
          },
          {
            exerciseId: 'ex_inc_db_press',
            sets: [
              { type: 'R', weight: 26, reps: 10, completed: true },
              { type: 'R', weight: 28, reps: 8, completed: true },
              { type: 'R', weight: 28, reps: 8, completed: true }
            ]
          },
          {
            exerciseId: 'ex_lateral_raise',
            sets: [
              { type: 'R', weight: 12, reps: 12, completed: true },
              { type: 'R', weight: 12, reps: 12, completed: true },
              { type: 'D', weight: 8, reps: 15, completed: true }
            ]
          }
        ] : [
          {
            exerciseId: 'ex_lat_pulldown',
            sets: [
              { type: 'W', weight: 45, reps: 12, completed: true },
              { type: 'R', weight: 65 + (idx * 2.5), reps: 10, completed: true },
              { type: 'R', weight: 70 + (idx * 2.5), reps: 8, completed: true },
              { type: 'R', weight: 70 + (idx * 2.5), reps: 8, completed: true }
            ]
          },
          {
            exerciseId: 'ex_bb_row',
            sets: [
              { type: 'R', weight: 60, reps: 10, completed: true },
              { type: 'R', weight: 65, reps: 8, completed: true },
              { type: 'R', weight: 65, reps: 8, completed: true }
            ]
          },
          {
            exerciseId: 'ex_bb_curl',
            sets: [
              { type: 'R', weight: 30, reps: 10, completed: true },
              { type: 'R', weight: 32.5, reps: 8, completed: true }
            ]
          }
        ]
      });
    });

    return workouts;
  },

  generateSampleMetrics() {
    const today = new Date();
    const weights = [];
    // 14 days of realistic weight log around 78kg
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const randomNoise = (Math.sin(i) * 0.4) + (Math.random() * 0.2 - 0.1);
      const weight = parseFloat((78.8 - (i * 0.05) + randomNoise).toFixed(1));
      weights.push({
        id: 'weight_' + i,
        date: d.toISOString().split('T')[0],
        weight: weight,
        note: i === 0 ? 'Bugünkü sabah tartısı' : ''
      });
    }

    const measurements = [
      {
        id: 'measure_1',
        date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        biceps: 37.5,
        chest: 103.0,
        waist: 82.5,
        hips: 99.0,
        thigh: 58.0,
        calf: 38.0
      },
      {
        id: 'measure_2',
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        biceps: 38.2,
        chest: 104.5,
        waist: 81.8,
        hips: 98.5,
        thigh: 58.5,
        calf: 38.2
      }
    ];

    return { weights, measurements };
  },

  // Generic Get & Set
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing ${key} from storage:`, e);
      return false;
    }
  },

  // Exercises
  getExercises() {
    return this.get(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
  },
  saveExercise(exercise) {
    const exercises = this.getExercises();
    const existingIdx = exercises.findIndex(e => e.id === exercise.id);
    if (existingIdx >= 0) {
      exercises[existingIdx] = exercise;
    } else {
      exercises.push(exercise);
    }
    this.set(STORAGE_KEYS.EXERCISES, exercises);
    return exercises;
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

  // Ghost Values for Progressive Overload
  getPreviousExerciseValues(exerciseId) {
    const workouts = this.getWorkouts();
    for (const w of workouts) {
      const match = w.exercises?.find(e => e.exerciseId === exerciseId);
      if (match && match.sets && match.sets.length > 0) {
        return match.sets.filter(s => s.completed !== false);
      }
    }
    return null;
  },

  // Tasks (Work & Daily Goals)
  getTasks() {
    const tasks = this.get(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    const today = new Date().toISOString().split('T')[0];
    
    // Auto daily reset for recurring tasks
    let changed = false;
    tasks.forEach(task => {
      if (task.recurring && task.lastResetDate !== today) {
        task.lastResetDate = today;
        if (task.type === 'checkbox') {
          task.completed = false;
        } else if (task.type === 'numeric') {
          task.current = 0;
        }
        changed = true;
      }
    });

    if (changed) {
      this.set(STORAGE_KEYS.TASKS, tasks);
    }
    return tasks;
  },
  saveTasks(tasks) {
    this.set(STORAGE_KEYS.TASKS, tasks);
    return tasks;
  },
  addTask(task) {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
    return tasks;
  },
  updateTask(updatedTask) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === updatedTask.id);
    if (idx >= 0) {
      tasks[idx] = updatedTask;
      this.saveTasks(tasks);
    }
    return tasks;
  },
  deleteTask(id) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== id);
    this.saveTasks(tasks);
    return tasks;
  },

  // Metrics (Weight & Measurements)
  getMetrics() {
    const m = this.get(STORAGE_KEYS.METRICS, { weights: [], measurements: [] });
    if (!m.weights) m.weights = [];
    if (!m.measurements) m.measurements = [];
    return m;
  },
  addWeight(weight, date = null, note = '') {
    const metrics = this.getMetrics();
    const entryDate = date || new Date().toISOString().split('T')[0];
    // Remove if entry exists for same date or update
    const existingIdx = metrics.weights.findIndex(w => w.date === entryDate);
    const newEntry = {
      id: 'w_' + Date.now(),
      date: entryDate,
      weight: parseFloat(weight),
      note: note
    };
    if (existingIdx >= 0) {
      metrics.weights[existingIdx] = newEntry;
    } else {
      metrics.weights.push(newEntry);
    }
    metrics.weights.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.set(STORAGE_KEYS.METRICS, metrics);
    return metrics;
  },
  addMeasurement(data) {
    const metrics = this.getMetrics();
    const newEntry = {
      id: 'm_' + Date.now(),
      date: data.date || new Date().toISOString().split('T')[0],
      biceps: parseFloat(data.biceps || 0),
      chest: parseFloat(data.chest || 0),
      waist: parseFloat(data.waist || 0),
      hips: parseFloat(data.hips || 0),
      thigh: parseFloat(data.thigh || 0),
      calf: parseFloat(data.calf || 0)
    };
    metrics.measurements.push(newEntry);
    metrics.measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.set(STORAGE_KEYS.METRICS, metrics);
    return metrics;
  },

  // Nutrition & Water
  getNutritionData() {
    return this.get(STORAGE_KEYS.NUTRITION, {});
  },
  getTodayNutrition() {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getNutritionData();
    return data[today] || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
  },
  saveTodayNutrition(values) {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getNutritionData();
    data[today] = { ...this.getTodayNutrition(), ...values };
    this.set(STORAGE_KEYS.NUTRITION, data);
    return data[today];
  },
  addWater(amountMl) {
    const current = this.getTodayNutrition();
    const updated = { ...current, water: Math.max(0, (current.water || 0) + amountMl) };
    return this.saveTodayNutrition(updated);
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
    const workouts = this.getWorkouts();
    const now = new Date();
    // Calculate Monday of current week
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const mondayStr = monday.toISOString().split('T')[0];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const sundayStr = sunday.toISOString().split('T')[0];

    return workouts.filter(w => {
      const d = w.date;
      return d >= mondayStr && d <= sundayStr;
    }).length;
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
        tasks: this.get(STORAGE_KEYS.TASKS, []),
        metrics: this.get(STORAGE_KEYS.METRICS, {}),
        nutrition: this.get(STORAGE_KEYS.NUTRITION, {}),
        routine: this.get(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE),
        settings: this.get(STORAGE_KEYS.SETTINGS, {})
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `ironpulse_backup_${dateStr}.json`);
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
      if (parsed.data.tasks) this.set(STORAGE_KEYS.TASKS, parsed.data.tasks);
      if (parsed.data.metrics) this.set(STORAGE_KEYS.METRICS, parsed.data.metrics);
      if (parsed.data.nutrition) this.set(STORAGE_KEYS.NUTRITION, parsed.data.nutrition);
      if (parsed.data.routine) this.set(STORAGE_KEYS.ROUTINE, parsed.data.routine);
      if (parsed.data.settings) this.set(STORAGE_KEYS.SETTINGS, parsed.data.settings);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  hardReset() {
    try {
      localStorage.setItem('ironpulse_hard_reset_done', 'true');
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_SCHEMA_VERSION.toString());

      this.set(STORAGE_KEYS.WORKOUTS, []);
      this.remove(STORAGE_KEYS.ACTIVE_WORKOUT);
      this.set(STORAGE_KEYS.METRICS, { weights: [], measurements: [] });
      this.set(STORAGE_KEYS.NUTRITION, {});
      this.set(STORAGE_KEYS.TASKS, []);

      const cleanStreak = {
        currentStreak: 0,
        lastActiveDate: null,
        isBroken: false,
        savedStreakBeforeBreak: 0
      };
      localStorage.setItem('ironpulse_streak_state', JSON.stringify(cleanStreak));

      const routine = this.get(STORAGE_KEYS.ROUTINE, DEFAULT_ROUTINE);
      if (routine) {
        routine.currentIndex = 0;
        this.set(STORAGE_KEYS.ROUTINE, routine);
      }

      this.ensureDefaultKeys();
      this.syncOfficialExercises();

      console.log('[IronPulse Storage] Hard reset completed successfully. Clean state created.');
      return true;
    } catch (err) {
      console.error('[IronPulse Storage] Hard reset error:', err);
      return false;
    }
  }
};

window.Storage = Storage;
