/**
 * MINDHARBOR - Habit Tracker Module
 * Handles custom habit creation, editing, deletion, multi-day completion logging, and streak analytics.
 */

(function (window) {
  'use strict';

  const HabitsModule = {
    activeCategory: 'all',

    categoryIcons: {
      Mind: 'ph-flower-lotus',
      Physical: 'ph-sneaker-move',
      Academic: 'ph-books',
      Sleep: 'ph-moon-stars',
      Health: 'ph-drop',
      Social: 'ph-users-three'
    },

    init() {
      this.bindEvents();
      this.renderHabits();
      this.renderSummary();

      MindStorage.on('habits:updated', () => {
        this.renderHabits();
        this.renderSummary();
      });
      MindStorage.on('habitLogs:updated', () => {
        this.renderHabits();
        this.renderSummary();
      });
      MindStorage.on('storage:imported', () => {
        this.renderHabits();
        this.renderSummary();
      });
      MindStorage.on('storage:reset', () => {
        this.renderHabits();
        this.renderSummary();
      });
    },

    bindEvents() {
      // Add habit button
      const addBtn = document.getElementById('btn-add-habit');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.openHabitModal();
        });
      }

      // Habit Form submit
      const form = document.getElementById('habit-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleHabitSubmit();
        });
      }

      // Category filter buttons
      const catButtons = document.querySelectorAll('.habit-cat-btn');
      catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          catButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeCategory = btn.dataset.category || 'all';
          this.renderHabits();
        });
      });
    },

    openHabitModal(habit = null) {
      const modal = document.getElementById('habit-modal');
      const form = document.getElementById('habit-form');
      const titleEl = document.getElementById('habit-modal-title');
      const idInput = document.getElementById('habit-id-input');
      const nameInput = document.getElementById('habit-name-input');
      const catSelect = document.getElementById('habit-cat-select');
      const targetInput = document.getElementById('habit-target-input');
      const reminderInput = document.getElementById('habit-reminder-input');

      if (!modal || !form) return;

      if (habit) {
        if (titleEl) titleEl.textContent = 'Edit Wellness Habit';
        if (idInput) idInput.value = habit.id;
        if (nameInput) nameInput.value = habit.title;
        if (catSelect) catSelect.value = habit.category;
        if (targetInput) targetInput.value = habit.targetWeekly || 7;
        if (reminderInput) reminderInput.value = habit.reminder || '';
      } else {
        if (titleEl) titleEl.textContent = 'Create New Wellness Habit';
        form.reset();
        if (idInput) idInput.value = '';
        if (targetInput) targetInput.value = 7;
      }

      window.App.openModal('habit-modal');
    },

    handleHabitSubmit() {
      const idInput = document.getElementById('habit-id-input');
      const nameInput = document.getElementById('habit-name-input');
      const catSelect = document.getElementById('habit-cat-select');
      const targetInput = document.getElementById('habit-target-input');
      const reminderInput = document.getElementById('habit-reminder-input');

      const title = nameInput ? nameInput.value.trim() : '';
      if (!title) {
        window.App.showToast('Please enter a habit name.', 'warning');
        return;
      }

      const category = catSelect ? catSelect.value : 'Mind';
      const icon = this.categoryIcons[category] || 'ph-sparkle';

      const habitData = {
        id: idInput && idInput.value ? idInput.value : undefined,
        title: title,
        category: category,
        icon: icon,
        targetWeekly: targetInput ? parseInt(targetInput.value, 10) : 7,
        reminder: reminderInput ? reminderInput.value.trim() : ''
      };

      MindStorage.saveHabit(habitData);
      window.App.closeModal('habit-modal');
      window.App.showToast(habitData.id ? 'Habit updated successfully!' : 'New habit created!', 'success');
    },

    // Get array of last 7 dates for weekly grid: [6 days ago, ..., today]
    getLast7Days() {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push({
          dateStr: MindStorage.formatDate(d),
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: d.getDate(),
          isToday: i === 0
        });
      }
      return days;
    },

    renderSummary() {
      const habits = MindStorage.getHabits();
      const todayStr = MindStorage.formatDate();

      const totalCountEl = document.getElementById('habit-summary-total');
      const completedTodayEl = document.getElementById('habit-summary-today');
      const topStreakEl = document.getElementById('habit-summary-top-streak');
      const rateEl = document.getElementById('habit-summary-rate');

      if (!totalCountEl) return;

      const totalHabits = habits.length;
      let completedToday = 0;
      let maxStreak = 0;
      let topStreakName = 'None';
      let totalCompletions30 = 0;

      habits.forEach(h => {
        if (MindStorage.isHabitCompleted(h.id, todayStr)) {
          completedToday++;
        }
        const streakData = MindStorage.calculateHabitStreak(h.id);
        if (streakData.currentStreak > maxStreak) {
          maxStreak = streakData.currentStreak;
          topStreakName = h.title;
        }
        totalCompletions30 += streakData.completionRate30Days;
      });

      const avgRate = totalHabits > 0 ? Math.round(totalCompletions30 / totalHabits) : 0;
      const todayRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

      totalCountEl.textContent = totalHabits;
      completedTodayEl.textContent = `${completedToday} / ${totalHabits} (${todayRate}%)`;
      topStreakEl.textContent = maxStreak > 0 ? `${maxStreak} days (${topStreakName})` : '0 days';
      if (rateEl) rateEl.textContent = `${avgRate}%`;
    },

    renderHabits() {
      const container = document.getElementById('habits-list-container');
      if (!container) return;

      let habits = MindStorage.getHabits();
      if (this.activeCategory !== 'all') {
        habits = habits.filter(h => h.category.toLowerCase() === this.activeCategory.toLowerCase());
      }

      if (habits.length === 0) {
        container.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon-circle"><i class="ph ph-sparkle"></i></div>
            <h4>No habits in this category</h4>
            <p class="text-muted">Start small! Even 5 minutes of mindful breathwork or a glass of water builds momentum.</p>
            <button class="btn btn-primary" onclick="HabitsModule.openHabitModal()"><i class="ph ph-plus"></i> Add Your First Habit</button>
          </div>
        `;
        return;
      }

      const weekDays = this.getLast7Days();
      const todayStr = MindStorage.formatDate();

      let html = '';
      habits.forEach(habit => {
        const streak = MindStorage.calculateHabitStreak(habit.id);
        const isDoneToday = MindStorage.isHabitCompleted(habit.id, todayStr);
        const iconClass = habit.icon || this.categoryIcons[habit.category] || 'ph-sparkle';

        // 7-day checkboxes
        let dayGridHtml = '';
        weekDays.forEach(wd => {
          const isDone = MindStorage.isHabitCompleted(habit.id, wd.dateStr);
          const cellClass = `habit-day-toggle ${isDone ? 'done' : ''} ${wd.isToday ? 'is-today' : ''}`;

          dayGridHtml += `
            <div class="habit-day-cell">
              <span class="habit-day-label">${wd.dayName[0]}</span>
              <button type="button" class="${cellClass}" data-habit="${habit.id}" data-date="${wd.dateStr}" title="${wd.dayName} ${wd.dateStr}: ${isDone ? 'Completed' : 'Not completed'}">
                <i class="ph ${isDone ? 'ph-check-bold' : 'ph-circle'}"></i>
              </button>
            </div>
          `;
        });

        html += `
          <div class="habit-card ${isDoneToday ? 'habit-card-done' : ''}" data-id="${habit.id}">
            <div class="habit-main-row">
              <div class="habit-info-group">
                <div class="habit-icon-avatar cat-${habit.category.toLowerCase()}">
                  <i class="ph ${iconClass}"></i>
                </div>
                <div class="habit-text-block">
                  <div class="habit-title-line">
                    <h4>${escapeHtml(habit.title)}</h4>
                    <span class="badge-pill cat-badge cat-badge-${habit.category.toLowerCase()}">${habit.category}</span>
                  </div>
                  ${habit.reminder ? `<p class="habit-reminder"><i class="ph ph-bell"></i> ${escapeHtml(habit.reminder)}</p>` : ''}
                </div>
              </div>

              <!-- Streak & Quick Check -->
              <div class="habit-quick-action">
                <div class="habit-streak-pill" title="Current streak: ${streak.currentStreak} days | Longest: ${streak.bestStreak} days">
                  <i class="ph ph-flame-bold flame-icon ${streak.currentStreak > 0 ? 'active' : ''}"></i>
                  <span class="streak-count">${streak.currentStreak}</span>
                  <span class="streak-text">streak</span>
                </div>

                <button type="button" class="btn habit-today-check-btn ${isDoneToday ? 'btn-done' : 'btn-outline'}" data-habit="${habit.id}" data-date="${todayStr}">
                  <i class="ph ${isDoneToday ? 'ph-check-circle-fill' : 'ph-circle'}"></i>
                  <span>${isDoneToday ? 'Done Today' : 'Mark Done'}</span>
                </button>

                <div class="habit-dropdown-menu">
                  <button type="button" class="btn-icon edit-habit-btn" data-id="${habit.id}" title="Edit habit">
                    <i class="ph ph-pencil-simple"></i>
                  </button>
                  <button type="button" class="btn-icon delete-habit-btn" data-id="${habit.id}" title="Delete habit">
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 7-Day History Track -->
            <div class="habit-week-track">
              <div class="habit-week-caption">
                <span>Last 7 Days Progress</span>
                <span class="habit-rate-caption">${streak.completionRate30Days}% 30-day rate &bull; ${streak.totalCompletions} total</span>
              </div>
              <div class="habit-week-grid">
                ${dayGridHtml}
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Bind toggle buttons
      container.querySelectorAll('.habit-day-toggle, .habit-today-check-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const habitId = btn.dataset.habit;
          const dateStr = btn.dataset.date;
          const nowDone = MindStorage.toggleHabitCompletion(habitId, dateStr);

          if (nowDone && dateStr === todayStr && window.confetti) {
            window.confetti({
              particleCount: 25,
              spread: 50,
              origin: { y: 0.85 }
            });
            window.App.showToast('Habit checked off! Keep the streak thriving!', 'success');
          }
        });
      });

      // Bind edit & delete
      container.querySelectorAll('.edit-habit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const habit = MindStorage.getHabits().find(h => h.id === btn.dataset.id);
          if (habit) this.openHabitModal(habit);
        });
      });

      container.querySelectorAll('.delete-habit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const habit = MindStorage.getHabits().find(h => h.id === btn.dataset.id);
          const name = habit ? habit.title : 'this habit';
          if (confirm(`Delete "${name}" and all its logs?`)) {
            MindStorage.deleteHabit(btn.dataset.id);
            window.App.showToast(`Habit "${name}" deleted.`, 'info');
          }
        });
      });
    }
  };

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.HabitsModule = HabitsModule;
})(window);

