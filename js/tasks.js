class TasksManager {
  constructor() {
    this.currentFilter = 'all';
  }

  init() {
    this.render();
  }

  getFilteredTasks() {
    const tasks = Storage.getTasks();
    if (this.currentFilter === 'all') return tasks;
    if (this.currentFilter === 'checkbox') return tasks.filter(t => t.type === 'checkbox');
    if (this.currentFilter === 'numeric') return tasks.filter(t => t.type === 'numeric');
    return tasks.filter(t => t.category === this.currentFilter);
  }

  render() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    const allTasks = Storage.getTasks();
    const filtered = this.getFilteredTasks();

    // Compute progress stats
    let totalItems = allTasks.length;
    let completedItems = 0;

    allTasks.forEach(t => {
      if (t.type === 'checkbox' && t.completed) {
        completedItems++;
      } else if (t.type === 'numeric') {
        if ((t.current || 0) >= (t.target || 1)) {
          completedItems++;
        }
      }
    });

    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Update Progress header
    const statsCountEl = document.getElementById('tasks-stats-count');
    if (statsCountEl) statsCountEl.textContent = `${completedItems} / ${totalItems}`;

    const statsPctEl = document.getElementById('tasks-stats-pct');
    if (statsPctEl) statsPctEl.textContent = `%${completionRate}`;

    const statsBarEl = document.getElementById('tasks-stats-bar');
    if (statsBarEl) statsBarEl.style.width = `${completionRate}%`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card-oled p-8 rounded-2xl text-center border border-zinc-800/80 my-4">
          <i data-lucide="check-circle-2" class="w-10 h-10 mx-auto mb-3 text-zinc-600"></i>
          <h4 class="font-semibold text-zinc-300 mb-1">Henüz bu kategoride görev yok</h4>
          <p class="text-xs text-zinc-500 mb-4">Aşağıdaki "+ Yeni Görev / Hedef Ekle" butonundan ilk görevinizi oluşturabilirsiniz.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(task => {
      const isDone = task.type === 'checkbox' 
        ? task.completed 
        : (task.current || 0) >= (task.target || 1);

      const categoryBadge = {
        'İş': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        'Finans': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        'Gelişim': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        'Kişisel': 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      }[task.category] || 'bg-zinc-800 text-zinc-400 border-zinc-700';

      if (task.type === 'checkbox') {
        return `
          <div class="card-oled p-4 rounded-2xl border ${isDone ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-zinc-800/90'} mb-3 transition">
            <div class="flex items-start gap-3">
              <button class="task-check-toggle mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition check-bounce ${isDone ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-800 text-transparent border border-zinc-700 hover:border-zinc-500'}" data-id="${task.id}">
                <i data-lucide="check" class="w-4 h-4 stroke-[3]"></i>
              </button>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadge}">${task.category || 'Genel'}</span>
                  ${task.recurring ? '<span class="text-[10px] text-zinc-500 flex items-center gap-0.5"><i data-lucide="repeat" class="w-3 h-3"></i> Günlük</span>' : ''}
                </div>
                <p class="text-sm font-medium ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'} transition break-words">${task.title}</p>
              </div>
              <button class="task-delete-btn p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg" data-id="${task.id}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      } else {
        // Numeric Target Task
        const current = task.current || 0;
        const target = task.target || 1;
        const pct = Math.min(100, Math.round((current / target) * 100));

        return `
          <div class="card-oled p-4 rounded-2xl border ${isDone ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-zinc-800/90'} mb-3 transition">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadge}">${task.category || 'Genel'}</span>
                  <span class="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Hedef: ${target} ${task.unit || 'Adet'}</span>
                </div>
                <p class="text-sm font-medium text-zinc-100 break-words">${task.title}</p>
              </div>
              <button class="task-delete-btn p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg" data-id="${task.id}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-zinc-800/80 rounded-full h-2 mb-3 overflow-hidden">
              <div class="h-2 rounded-full progress-bar-fill ${isDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}" style="width: ${pct}%"></div>
            </div>

            <!-- Interactive Stepper & Input -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button class="num-step-btn w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-base" data-id="${task.id}" data-action="dec">
                  -
                </button>
                <div class="flex items-center gap-1">
                  <input type="number" min="0" value="${current}" 
                    class="num-current-input w-14 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-lg py-1 text-center text-sm font-bold text-zinc-100 focus:outline-none" 
                    data-id="${task.id}">
                  <span class="text-xs text-zinc-400 font-medium">/ ${target} ${task.unit || ''}</span>
                </div>
                <button class="num-step-btn w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-base" data-id="${task.id}" data-action="inc">
                  +
                </button>
              </div>
              <div class="flex items-center gap-1.5">
                <button class="quick-add-btn text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md" data-id="${task.id}" data-val="5">
                  +5
                </button>
                <span class="text-xs font-bold ${isDone ? 'text-emerald-400' : 'text-zinc-400'}">%${pct}</span>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Checkbox toggles
    container.querySelectorAll('.task-check-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleCheckboxTask(btn.dataset.id);
      });
    });

    // Delete buttons
    container.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
          Storage.deleteTask(btn.dataset.id);
          this.render();
        }
      });
    });

    // Numeric step buttons
    container.querySelectorAll('.num-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        this.stepNumericTask(btn.dataset.id, delta);
      });
    });

    // Quick add buttons (+5)
    container.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        this.stepNumericTask(btn.dataset.id, val);
      });
    });

    // Direct input change
    container.querySelectorAll('.num-current-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.setNumericValue(input.dataset.id, parseInt(e.target.value, 10) || 0);
      });
    });
  }

  toggleCheckboxTask(id) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      sound.playTone(600, 'sine', 0.1, 0.2);
      if (window.streak) streak.triggerActivityCheck();
    }
    Storage.updateTask(task);
    this.render();
  }

  stepNumericTask(id, delta) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const current = task.current || 0;
    const nextVal = Math.max(0, current + delta);
    task.current = nextVal;

    if (nextVal >= (task.target || 1) && current < (task.target || 1)) {
      sound.playSuccessChime();
      if (window.streak) streak.triggerActivityCheck();
    } else {
      sound.playTone(700, 'sine', 0.08, 0.15);
    }

    Storage.updateTask(task);
    this.render();
  }

  setNumericValue(id, value) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.current = Math.max(0, value);
    Storage.updateTask(task);
    this.render();
  }

  openAddTaskModal() {
    const modal = document.getElementById('modal-add-task');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('task-input-title').value = '';
      document.getElementById('task-input-target').value = '10';
      document.getElementById('task-input-unit').value = 'Adet';
      this.updateTaskTypeForm();
    }
  }

  closeAddTaskModal() {
    const modal = document.getElementById('modal-add-task');
    if (modal) modal.classList.add('hidden');
  }

  updateTaskTypeForm() {
    const type = document.querySelector('input[name="task-type-radio"]:checked')?.value || 'checkbox';
    const numericFields = document.getElementById('task-numeric-fields');
    if (numericFields) {
      if (type === 'numeric') {
        numericFields.classList.remove('hidden');
      } else {
        numericFields.classList.add('hidden');
      }
    }
  }

  saveNewTaskFromModal() {
    const title = document.getElementById('task-input-title')?.value.trim();
    if (!title) {
      alert('Lütfen görev veya hedef başlığını girin.');
      return;
    }

    const type = document.querySelector('input[name="task-type-radio"]:checked')?.value || 'checkbox';
    const category = document.getElementById('task-input-category')?.value || 'İş';
    const recurring = document.getElementById('task-input-recurring')?.checked ?? true;

    const newTask = {
      id: 'task_' + Date.now(),
      title: title,
      type: type,
      category: category,
      recurring: recurring,
      lastResetDate: new Date().toISOString().split('T')[0]
    };

    if (type === 'checkbox') {
      newTask.completed = false;
    } else {
      newTask.current = 0;
      newTask.target = parseInt(document.getElementById('task-input-target')?.value, 10) || 10;
      newTask.unit = document.getElementById('task-input-unit')?.value.trim() || 'Adet';
    }

    Storage.addTask(newTask);
    this.closeAddTaskModal();
    this.render();
  }

  resetAllToday() {
    if (confirm('Bugünkü tüm görev ve hedeflerin ilerlemesini sıfırlamak istiyor musunuz?')) {
      const tasks = Storage.getTasks();
      tasks.forEach(t => {
        if (t.type === 'checkbox') t.completed = false;
        if (t.type === 'numeric') t.current = 0;
      });
      Storage.saveTasks(tasks);
      this.render();
    }
  }
}

const tasks = new TasksManager();
window.tasks = tasks;
