class NutritionManager {
  init() {
    this.render();
  }

  render() {
    const settings = Storage.getSettings();
    const todayData = Storage.getTodayNutrition();

    // 1. Calories
    const calTarget = settings.calorieTarget || 2500;
    const calCurrent = todayData.calories || 0;
    const calPct = Math.min(100, Math.round((calCurrent / calTarget) * 100));

    const calEl = document.getElementById('macro-calories-val');
    if (calEl) calEl.textContent = calCurrent.toLocaleString();

    const calTargetEl = document.getElementById('macro-calories-target');
    if (calTargetEl) calTargetEl.textContent = calTarget.toLocaleString();

    const calBar = document.getElementById('macro-calories-bar');
    if (calBar) calBar.style.width = `${calPct}%`;

    // 2. Protein
    const protTarget = settings.proteinTarget || 160;
    const protCurrent = todayData.protein || 0;
    const protPct = Math.min(100, Math.round((protCurrent / protTarget) * 100));
    const protEl = document.getElementById('macro-protein-val');
    if (protEl) protEl.textContent = `${protCurrent} / ${protTarget}g`;
    const protBar = document.getElementById('macro-protein-bar');
    if (protBar) protBar.style.width = `${protPct}%`;

    // 3. Carbs
    const carbTarget = settings.carbTarget || 270;
    const carbCurrent = todayData.carbs || 0;
    const carbPct = Math.min(100, Math.round((carbCurrent / carbTarget) * 100));
    const carbEl = document.getElementById('macro-carbs-val');
    if (carbEl) carbEl.textContent = `${carbCurrent} / ${carbTarget}g`;
    const carbBar = document.getElementById('macro-carbs-bar');
    if (carbBar) carbBar.style.width = `${carbPct}%`;

    // 4. Fat
    const fatTarget = settings.fatTarget || 65;
    const fatCurrent = todayData.fat || 0;
    const fatPct = Math.min(100, Math.round((fatCurrent / fatTarget) * 100));
    const fatEl = document.getElementById('macro-fat-val');
    if (fatEl) fatEl.textContent = `${fatCurrent} / ${fatTarget}g`;
    const fatBar = document.getElementById('macro-fat-bar');
    if (fatBar) fatBar.style.width = `${fatPct}%`;

    // 5. Water
    const waterTarget = settings.waterTarget || 3000;
    const waterCurrent = todayData.water || 0;
    const waterPct = Math.min(100, Math.round((waterCurrent / waterTarget) * 100));

    const waterEl = document.getElementById('water-val');
    if (waterEl) waterEl.textContent = `${(waterCurrent / 1000).toFixed(2)} L`;
    const waterTargetEl = document.getElementById('water-target-val');
    if (waterTargetEl) waterTargetEl.textContent = `${(waterTarget / 1000).toFixed(1)} L`;

    const waterBar = document.getElementById('water-progress-bar');
    if (waterBar) waterBar.style.width = `${waterPct}%`;

    const waterGlassFill = document.getElementById('water-glass-fill');
    if (waterGlassFill) waterGlassFill.style.height = `${waterPct}%`;

    // 6. Habit Heatmap Calendar & Streak
    this.renderActivityCalendar();
  }

  addWater(amountMl) {
    Storage.addWater(amountMl);
    sound.playTone(520, 'sine', 0.1, 0.2);
    this.render();
    if (window.streak) streak.triggerActivityCheck();
  }

  resetWater() {
    if (confirm('Bugünkü su tüketimini sıfırlamak istiyor musunuz?')) {
      Storage.saveTodayNutrition({ water: 0 });
      this.render();
    }
  }

  openEditMacrosModal() {
    const modal = document.getElementById('modal-edit-nutrition');
    const today = Storage.getTodayNutrition();

    document.getElementById('edit-calories-input').value = today.calories || '';
    document.getElementById('edit-protein-input').value = today.protein || '';
    document.getElementById('edit-carbs-input').value = today.carbs || '';
    document.getElementById('edit-fat-input').value = today.fat || '';

    modal.classList.remove('hidden');
  }

  saveMacrosFromModal() {
    const calories = parseInt(document.getElementById('edit-calories-input').value, 10) || 0;
    const protein = parseInt(document.getElementById('edit-protein-input').value, 10) || 0;
    const carbs = parseInt(document.getElementById('edit-carbs-input').value, 10) || 0;
    const fat = parseInt(document.getElementById('edit-fat-input').value, 10) || 0;

    Storage.saveTodayNutrition({ calories, protein, carbs, fat });
    document.getElementById('modal-edit-nutrition').classList.add('hidden');
    sound.playTone(660, 'sine', 0.1, 0.2);
    this.render();
    if (window.streak) streak.triggerActivityCheck();
  }

  quickAddMacro(type, amount) {
    const today = Storage.getTodayNutrition();
    const updated = {};
    updated[type] = Math.max(0, (today[type] || 0) + amount);
    Storage.saveTodayNutrition(updated);
    sound.playTone(700, 'sine', 0.08, 0.15);
    this.render();
    if (window.streak) streak.triggerActivityCheck();
  }

  renderActivityCalendar() {
    const container = document.getElementById('activity-heatmap-grid');
    if (!container) return;

    const workouts = Storage.getWorkouts();
    const workoutDates = new Set(workouts.map(w => w.date));

    // Render current month days (e.g. 30/31 days)
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
}

const nutrition = new NutritionManager();
window.nutrition = nutrition;
