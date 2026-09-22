class ChartsManager {
  constructor() {
    this.weightChart = null;
    this.exerciseChart = null;
    this.volumeChart = null;
    this.muscleChart = null;
  }

  init() {
    this.populateExerciseDropdown();
    this.renderAll();
  }

  renderAll() {
    if (!window.Chart) {
      console.warn('Chart.js not loaded yet');
      return;
    }

    this.renderWeightChart();
    this.renderExerciseProgressChart();
    this.renderVolumeLoadChart();
    this.renderMuscleDistributionChart();
  }

  // --- 1. WEIGHT & 7-DAY MOVING AVG CHART ---
  renderWeightChart() {
    const canvas = document.getElementById('canvas-weight-trend');
    if (!canvas) return;

    const metrics = Storage.getMetrics();
    const weights = metrics.weights || [];

    if (weights.length === 0) return;

    const labels = weights.map(w => {
      const parts = w.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    const dataPoints = weights.map(w => w.weight);

    // Calculate 7-day moving avg array
    const movingAverages = [];
    for (let i = 0; i < weights.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowSlice = weights.slice(windowStart, i + 1);
      const avg = windowSlice.reduce((sum, item) => sum + item.weight, 0) / windowSlice.length;
      movingAverages.push(parseFloat(avg.toFixed(2)));
    }

    if (this.weightChart) this.weightChart.destroy();

    const ctx = canvas.getContext('2d');
    this.weightChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Günlük Kilo (kg)',
            data: dataPoints,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 3,
            tension: 0.1
          },
          {
            label: '7 Günlük Ort. (kg)',
            data: movingAverages,
            borderColor: '#10b981',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            labels: { color: '#a1a1aa', font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: '#1f1f23' },
            ticks: { color: '#71717a', font: { size: 10 } }
          },
          y: {
            grid: { color: '#1f1f23' },
            ticks: { color: '#71717a', font: { size: 10 } }
          }
        }
      }
    });
  }

  // --- 2. EXERCISE PROGRESS CHART ---
  populateExerciseDropdown() {
    const select = document.getElementById('exercise-chart-select');
    if (!select) return;

    const exercises = Storage.getExercises();
    select.innerHTML = exercises.map(ex => `
      <option value="${ex.id}">${ex.name} (${ex.muscle})</option>
    `).join('');

    select.addEventListener('change', () => {
      this.renderExerciseProgressChart();
    });
  }

  renderExerciseProgressChart() {
    const canvas = document.getElementById('canvas-exercise-progress');
    const select = document.getElementById('exercise-chart-select');
    if (!canvas || !select) return;

    const exerciseId = select.value;
    const workouts = Storage.getWorkouts(); // sorted descending

    // Reverse to chronological order
    const chronoWorkouts = [...workouts].reverse();

    const labels = [];
    const maxWeights = [];
    const estimated1RMs = [];

    chronoWorkouts.forEach(w => {
      const match = w.exercises?.find(e => e.exerciseId === exerciseId);
      if (match && match.sets) {
        let maxWeightInSession = 0;
        let max1RMInSession = 0;

        match.sets.forEach(s => {
          if (s.completed !== false && s.weight && s.reps) {
            const wVal = parseFloat(s.weight);
            const rVal = parseFloat(s.reps);
            if (wVal > maxWeightInSession) maxWeightInSession = wVal;
            // Epley 1RM
            const epley = wVal * (1 + rVal / 30);
            if (epley > max1RMInSession) max1RMInSession = Math.round(epley);
          }
        });

        if (maxWeightInSession > 0) {
          const parts = w.date.split('-');
          labels.push(`${parts[2]}/${parts[1]}`);
          maxWeights.push(maxWeightInSession);
          estimated1RMs.push(max1RMInSession);
        }
      }
    });

    if (this.exerciseChart) this.exerciseChart.destroy();

    const ctx = canvas.getContext('2d');

    if (labels.length === 0) {
      // Empty placeholder
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

    this.exerciseChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Maks. Ağırlık (kg)',
            data: maxWeights,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            tension: 0.3
          },
          {
            label: 'Tahmini 1RM (kg)',
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
          label: 'Hacim / Tonaj (kg)',
          data: volumes,
          backgroundColor: '#8b5cf6',
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
      'Kol': 0,
      'Karın': 0
    };

    workouts.forEach(w => {
      w.exercises?.forEach(eItem => {
        const meta = exercises.find(ex => ex.id === eItem.exerciseId);
        const muscle = meta ? meta.muscle : 'Genel';
        const completedSets = eItem.sets?.filter(s => s.completed !== false).length || 0;
        if (counts[muscle] !== undefined) {
          counts[muscle] += completedSets;
        } else {
          counts['Genel'] = (counts['Genel'] || 0) + completedSets;
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
        labels: labels,
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: [
            '#10b981', // Emerald
            '#06b6d4', // Cyan
            '#8b5cf6', // Violet
            '#f59e0b', // Amber
            '#f43f5e', // Rose
            '#3b82f6'  // Blue
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
