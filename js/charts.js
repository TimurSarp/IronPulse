class ChartsManager {
  constructor() {
    this.exerciseChart = null;
    this.volumeChart = null;
    this.muscleChart = null;
  }

  init() {
    this.populateExerciseDropdown();
    this.renderAll();
  }

  renderAll() {
    this.populateExerciseDropdown();
    this.renderExerciseSummaryTable();

    if (!window.Chart) {
      return;
    }

    this.renderExerciseProgressChart();
    this.renderVolumeLoadChart();
    this.renderMuscleDistributionChart();
  }

  // --- 1. EXERCISE PROGRESSION & TARGET SUMMARY LIST ---
  renderExerciseSummaryTable() {
    const container = document.getElementById('exercise-progression-summary-list');
    if (!container) return;

    const routine = Storage.getRoutine();
    const allExercises = Storage.getExercises();

    // Collect exercises from PPL routine first, then any other logged exercises
    const routineExIds = new Set();
    const orderedExercises = [];

    (routine.days || []).forEach(day => {
      (day.exercises || []).forEach(re => {
        const found = allExercises.find(e =>
          (re.exerciseId && e.id === re.exerciseId) ||
          e.name.toLowerCase() === re.name.toLowerCase()
        );
        if (found && !routineExIds.has(found.id)) {
          routineExIds.add(found.id);
          orderedExercises.push({ ...found, dayTitle: day.title });
        }
      });
    });

    if (orderedExercises.length === 0) {
      container.innerHTML = `<p class="text-xs text-zinc-500 text-center py-4">Henüz kayıtlı hareket bulunmuyor.</p>`;
      return;
    }

    container.innerHTML = orderedExercises.map(ex => {
      const analysis = Storage.getExerciseAnalysis(ex.id);
      if (!analysis || !analysis.hasData) {
        return `
          <div class="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-zinc-500 font-bold uppercase">${ex.dayTitle || ex.muscle}</span>
              <h4 class="text-xs font-bold text-zinc-200">${ex.name}</h4>
            </div>
            <span class="text-[11px] text-zinc-500">Veri Yok</span>
          </div>
        `;
      }

      const ref = analysis.referenceSession;
      const tgt = analysis.target;

      let trendBadge = '';
      if (analysis.trendStatus === 'up') {
        trendBadge = `<span class="text-[10px] font-bold text-emerald-400">📈 +${analysis.trendPct}%</span>`;
      } else if (analysis.trendStatus === 'down') {
        trendBadge = `<span class="text-[10px] font-bold text-rose-400">📉 ${analysis.trendPct}%</span>`;
      } else {
        trendBadge = `<span class="text-[10px] font-semibold text-zinc-400">⚖️ Baz/Dengeli</span>`;
      }

      const outlierBadge = analysis.outliersIgnoredCount > 0
        ? `<span class="text-[9px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded ml-1">🛡️ ${analysis.outliersIgnoredCount} uç gün elendi</span>`
        : '';

      return `
        <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-extrabold text-emerald-400 uppercase">${ex.dayTitle || ex.muscle}</span>
              ${trendBadge}
              ${outlierBadge}
            </div>
            <h4 class="text-sm font-extrabold text-white truncate mt-0.5">${ex.name}</h4>
            <span class="text-[11px] text-zinc-400 block">Son Baz: <strong class="text-zinc-200">${ref.weight} kg × ${ref.reps} tekrar</strong></span>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Yeni Hedef</span>
            <span class="text-xs font-black px-2 py-1 rounded-lg inline-block mt-0.5 ${
              tgt.isWeightUp
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }">
              ${tgt.isWeightUp ? '🔥' : '🎯'} ${tgt.weight} kg × ${tgt.reps}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 2. EXERCISE PROGRESS CHART (With Outlier Filtering Visualization) ---
  populateExerciseDropdown() {
    const select = document.getElementById('exercise-chart-select');
    if (!select) return;

    const currentVal = select.value;
    const exercises = Storage.getExercises();
    select.innerHTML = exercises.map(ex => `
      <option value="${ex.id}">${ex.name} (${ex.muscle})</option>
    `).join('');

    if (currentVal && exercises.some(e => e.id === currentVal)) {
      select.value = currentVal;
    }

    if (!select.dataset.bound) {
      select.dataset.bound = 'true';
      select.addEventListener('change', () => {
        this.renderExerciseProgressChart();
      });
    }
  }

  renderExerciseProgressChart() {
    const canvas = document.getElementById('canvas-exercise-progress');
    const select = document.getElementById('exercise-chart-select');
    if (!canvas || !select) return;

    const exerciseId = select.value;
    const analysis = Storage.getExerciseAnalysis(exerciseId);

    if (this.exerciseChart) this.exerciseChart.destroy();
    const ctx = canvas.getContext('2d');

    if (!analysis || !analysis.hasData || analysis.history.length === 0) {
      this.exerciseChart = new window.Chart(ctx, {
        type: 'line',
        data: { labels: ['Kayıt Yok'], datasets: [{ label: 'Veri Yok', data: [0] }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
      return;
    }

    // Use clean (non-outlier) history for the regular progression trend line
    const cleanHistory = analysis.history.filter(h => !h.isOutlier);
    const listToPlot = cleanHistory.length > 0 ? cleanHistory : analysis.history;

    const labels = listToPlot.map(h => {
      const parts = h.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    const workingWeights = listToPlot.map(h => h.weight);
    const estimated1RMs = listToPlot.map(h => Math.round(h.epley1RM));

    this.exerciseChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Çalışma Ağırlığı (kg)',
            data: workingWeights,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            tension: 0.3
          },
          {
            label: 'Düzenli Güç / 1RM (Uç Günler Filtreli)',
            data: estimated1RMs,
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f59e0b',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#a1a1aa', font: { size: 11 } } }
        },
        scales: {
          x: { grid: { color: '#1f1f23' }, ticks: { color: '#71717a', font: { size: 10 } } },
          y: { grid: { color: '#1f1f23' }, ticks: { color: '#71717a', font: { size: 10 } } }
        }
      }
    });
  }

  // --- 3. TOTAL VOLUME LOAD (TONNAGE) ---
  renderVolumeLoadChart() {
    const canvas = document.getElementById('canvas-volume-load');
    if (!canvas) return;

    const workouts = Storage.getWorkouts();
    const lastWorkouts = [...workouts].reverse().slice(-8);

    const labels = lastWorkouts.map(w => {
      const parts = w.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    const volumes = lastWorkouts.map(w => w.totalVolume || 0);

    if (this.volumeChart) this.volumeChart.destroy();

    const ctx = canvas.getContext('2d');
    this.volumeChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Toplam Tonaj (kg)',
          data: volumes,
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#a1a1aa', font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } },
          y: { grid: { color: '#1f1f23' }, ticks: { color: '#71717a', font: { size: 10 } } }
        }
      }
    });
  }

  // --- 4. MUSCLE GROUP DISTRIBUTION ---
  renderMuscleDistributionChart() {
    const canvas = document.getElementById('canvas-muscle-distribution');
    if (!canvas) return;

    const workouts = Storage.getWorkouts();
    const exercises = Storage.getExercises();

    const counts = {
      'Göğüs': 0,
      'Sırt': 0,
      'Omuz': 0,
      'Bacak': 0,
      'Kol': 0
    };

    workouts.forEach(w => {
      w.exercises?.forEach(eItem => {
        const meta = exercises.find(ex => ex.id === eItem.exerciseId);
        const muscle = meta ? meta.muscle : 'Genel';
        const completedSets = eItem.sets?.filter(s => s.completed !== false).length || 0;
        if (counts[muscle] !== undefined) {
          counts[muscle] += completedSets;
        }
      });
    });

    const labels = Object.keys(counts).filter(k => counts[k] > 0);
    const data = labels.map(k => counts[k]);

    if (this.muscleChart) this.muscleChart.destroy();

    const ctx = canvas.getContext('2d');
    this.muscleChart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Veri Yok'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: [
            '#10b981',
            '#06b6d4',
            '#f59e0b',
            '#8b5cf6',
            '#f43f5e'
          ],
          borderWidth: 2,
          borderColor: '#0e0e13'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#a1a1aa', font: { size: 11 }, boxWidth: 12 }
          }
        },
        cutout: '65%'
      }
    });
  }
}

const charts = new ChartsManager();
window.charts = charts;
window.appCharts = charts;
