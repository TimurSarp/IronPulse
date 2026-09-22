class MetricsManager {
  init() {
    this.render();
  }

  render() {
    const metrics = Storage.getMetrics();
    const weights = metrics.weights || [];
    const measurements = metrics.measurements || [];

    // Current and 7-day avg weight
    const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
    const movingAvg = this.calculate7DayMovingAverage(weights);

    const currentWeightEl = document.getElementById('metric-current-weight');
    if (currentWeightEl) {
      currentWeightEl.textContent = latestWeight ? `${latestWeight.weight} kg` : '—';
    }

    const movingAvgEl = document.getElementById('metric-7d-avg-weight');
    if (movingAvgEl) {
      movingAvgEl.textContent = movingAvg ? `${movingAvg.toFixed(1)} kg` : '—';
    }

    // Delta compared to first entry
    const deltaEl = document.getElementById('metric-weight-delta');
    if (deltaEl && weights.length > 1) {
      const diff = (latestWeight.weight - weights[0].weight).toFixed(1);
      const isMinus = diff < 0;
      deltaEl.textContent = `${diff > 0 ? '+' : ''}${diff} kg (${weights.length} kayıt)`;
      deltaEl.className = `text-xs font-semibold ${isMinus ? 'text-cyan-400' : 'text-amber-400'}`;
    }

    // Render Measurements Table
    this.renderMeasurementsTable(measurements);

    // Render Weight History Table
    this.renderWeightHistoryTable(weights);
  }

  calculate7DayMovingAverage(weights) {
    if (!weights || weights.length === 0) return null;
    const last7 = weights.slice(-7);
    const sum = last7.reduce((acc, curr) => acc + curr.weight, 0);
    return sum / last7.length;
  }

  renderMeasurementsTable(measurements) {
    const container = document.getElementById('measurements-summary-container');
    if (!container) return;

    if (measurements.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-zinc-500 text-xs">
          Henüz vücut ölçüsü kaydedilmedi.
        </div>
      `;
      return;
    }

    const latest = measurements[measurements.length - 1];
    const prev = measurements.length > 1 ? measurements[measurements.length - 2] : null;

    const parts = [
      { key: 'biceps', label: 'Kol (Biceps)' },
      { key: 'chest', label: 'Göğüs' },
      { key: 'waist', label: 'Bel' },
      { key: 'hips', label: 'Kalça' },
      { key: 'thigh', label: 'Bacak' },
      { key: 'calf', label: 'Kalf' }
    ];

    container.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        ${parts.map(p => {
          const val = latest[p.key] || 0;
          let diffStr = '';
          if (prev && prev[p.key]) {
            const diff = (val - prev[p.key]).toFixed(1);
            if (diff != 0) {
              const color = diff > 0 ? 'text-emerald-400' : 'text-rose-400';
              diffStr = `<span class="text-[10px] font-bold ${color}">${diff > 0 ? '+' : ''}${diff} cm</span>`;
            }
          }

          return `
            <div class="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl">
              <span class="text-[11px] text-zinc-400 block mb-0.5">${p.label}</span>
              <div class="flex items-baseline justify-between">
                <span class="text-base font-bold text-zinc-100">${val > 0 ? `${val} cm` : '—'}</span>
                ${diffStr}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <p class="text-[10px] text-zinc-500 text-right mt-2">Son Güncelleme: ${latest.date}</p>
    `;
  }

  renderWeightHistoryTable(weights) {
    const container = document.getElementById('weight-history-list');
    if (!container) return;

    if (weights.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-zinc-500 text-xs">
          Kilo geçmişi bulunmuyor.
        </div>
      `;
      return;
    }

    const reversed = [...weights].reverse().slice(0, 7);
    container.innerHTML = reversed.map(w => `
      <div class="flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs">
        <div>
          <span class="font-medium text-zinc-300">${w.date}</span>
          ${w.note ? `<span class="text-[10px] text-zinc-500 block">${w.note}</span>` : ''}
        </div>
        <span class="font-bold text-zinc-100 text-sm">${w.weight} kg</span>
      </div>
    `).join('');
  }

  openAddWeightModal() {
    const modal = document.getElementById('modal-add-weight');
    const input = document.getElementById('weight-input-val');
    const dateInput = document.getElementById('weight-input-date');
    const noteInput = document.getElementById('weight-input-note');

    dateInput.value = new Date().toISOString().split('T')[0];
    input.value = '';
    noteInput.value = '';

    modal.classList.remove('hidden');
    input.focus();
  }

  saveWeightFromModal() {
    const weightVal = parseFloat(document.getElementById('weight-input-val').value);
    const dateVal = document.getElementById('weight-input-date').value;
    const noteVal = document.getElementById('weight-input-note').value;

    if (!weightVal || isNaN(weightVal) || weightVal <= 20 || weightVal >= 300) {
      alert('Lütfen geçerli bir kilo değeri girin (örn: 78.5)');
      return;
    }

    Storage.addWeight(weightVal, dateVal, noteVal);
    document.getElementById('modal-add-weight').classList.add('hidden');
    sound.playTone(600, 'sine', 0.1, 0.2);

    this.render();

    // Trigger charts reload
    if (window.appCharts) {
      window.appCharts.renderAll();
    }
  }

  openAddMeasureModal() {
    const modal = document.getElementById('modal-add-measure');
    const dateInput = document.getElementById('measure-input-date');
    dateInput.value = new Date().toISOString().split('T')[0];

    // Prefill with latest if available
    const metrics = Storage.getMetrics();
    const latest = metrics.measurements?.length > 0 ? metrics.measurements[metrics.measurements.length - 1] : {};

    document.getElementById('measure-biceps').value = latest.biceps || '';
    document.getElementById('measure-chest').value = latest.chest || '';
    document.getElementById('measure-waist').value = latest.waist || '';
    document.getElementById('measure-hips').value = latest.hips || '';
    document.getElementById('measure-thigh').value = latest.thigh || '';
    document.getElementById('measure-calf').value = latest.calf || '';

    modal.classList.remove('hidden');
  }

  saveMeasureFromModal() {
    const data = {
      date: document.getElementById('measure-input-date').value,
      biceps: document.getElementById('measure-biceps').value,
      chest: document.getElementById('measure-chest').value,
      waist: document.getElementById('measure-waist').value,
      hips: document.getElementById('measure-hips').value,
      thigh: document.getElementById('measure-thigh').value,
      calf: document.getElementById('measure-calf').value
    };

    Storage.addMeasurement(data);
    document.getElementById('modal-add-measure').classList.add('hidden');
    sound.playTone(600, 'sine', 0.1, 0.2);
    this.render();
  }
}

const metrics = new MetricsManager();
window.metrics = metrics;
