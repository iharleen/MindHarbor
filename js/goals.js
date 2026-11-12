/**
 * MINDHARBOR - Weekly Wellness Goals Module
 * Manages wellness targets, progress increments, milestone achievements, and celebrations.
 */

(function (window) {
  'use strict';

  const GoalsModule = {
    activeFilter: 'all', // 'all', 'active', 'completed'

    categoryIcons: {
      'Mindfulness': 'ph-flower-lotus',
      'Study Life Balance': 'ph-scales',
      'Physical Health': 'ph-heartbeat',
      'Sleep Routine': 'ph-moon-stars',
      'Digital Detox': 'ph-device-mobile-slash',
      'Nutrition': 'ph-apple-logo'
    },

    init() {
      this.bindEvents();
      this.renderGoals();
      this.renderSummary();

      MindStorage.on('goals:updated', () => {
        this.renderGoals();
        this.renderSummary();
      });
      MindStorage.on('storage:imported', () => {
        this.renderGoals();
        this.renderSummary();
      });
      MindStorage.on('storage:reset', () => {
        this.renderGoals();
        this.renderSummary();
      });
    },

    bindEvents() {
      // Add Goal Button
      const addBtn = document.getElementById('btn-add-goal');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.openGoalModal();
        });
      }

      // Goal Form Submit
      const form = document.getElementById('goal-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleGoalSubmit();
        });
      }

      // Filter tabs
      const filterBtns = document.querySelectorAll('.goals-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeFilter = btn.dataset.filter || 'all';
          this.renderGoals();
        });
      });
    },

    openGoalModal(goal = null) {
      const modal = document.getElementById('goal-modal');
      const form = document.getElementById('goal-form');
      const titleEl = document.getElementById('goal-modal-title');
      const idInput = document.getElementById('goal-id-input');
      const titleInput = document.getElementById('goal-title-input');
      const catSelect = document.getElementById('goal-category-select');
      const targetInput = document.getElementById('goal-target-input');
      const currentInput = document.getElementById('goal-current-input');
      const unitInput = document.getElementById('goal-unit-input');
      const notesInput = document.getElementById('goal-notes-input');

      if (!modal || !form) return;

      if (goal) {
        if (titleEl) titleEl.textContent = 'Edit Wellness Goal';
        if (idInput) idInput.value = goal.id;
        if (titleInput) titleInput.value = goal.title;
        if (catSelect) catSelect.value = goal.category;
        if (targetInput) targetInput.value = goal.targetValue;
        if (currentInput) currentInput.value = goal.currentValue || 0;
        if (unitInput) unitInput.value = goal.unit || 'times';
        if (notesInput) notesInput.value = goal.notes || '';
      } else {
        if (titleEl) titleEl.textContent = 'Set Weekly Wellness Goal';
        form.reset();
        if (idInput) idInput.value = '';
        if (targetInput) targetInput.value = 5;
        if (currentInput) currentInput.value = 0;
        if (unitInput) unitInput.value = 'sessions';
      }

      window.App.openModal('goal-modal');
    },

    handleGoalSubmit() {
      const idInput = document.getElementById('goal-id-input');
      const titleInput = document.getElementById('goal-title-input');
      const catSelect = document.getElementById('goal-category-select');
      const targetInput = document.getElementById('goal-target-input');
      const currentInput = document.getElementById('goal-current-input');
      const unitInput = document.getElementById('goal-unit-input');
      const notesInput = document.getElementById('goal-notes-input');

      const title = titleInput ? titleInput.value.trim() : '';
      if (!title) {
        window.App.showToast('Please enter a goal title.', 'warning');
        return;
      }

      const targetVal = targetInput ? Math.max(1, parseInt(targetInput.value, 10)) : 1;
      const currentVal = currentInput ? Math.max(0, parseInt(currentInput.value, 10)) : 0;

      const goalData = {
        id: idInput && idInput.value ? idInput.value : undefined,
        title: title,
        category: catSelect ? catSelect.value : 'Mindfulness',
        targetValue: targetVal,
        currentValue: currentVal,
        unit: unitInput ? unitInput.value.trim() : 'times',
        completed: currentVal >= targetVal,
        notes: notesInput ? notesInput.value.trim() : '',
        weekOf: MindStorage.formatDate()
      };

      MindStorage.saveGoal(goalData);
      window.App.closeModal('goal-modal');
      window.App.showToast(goalData.id ? 'Goal updated!' : 'New weekly goal saved!', 'success');
    },

    renderSummary() {
      const goals = MindStorage.getGoals();
      const activeEl = document.getElementById('goals-summary-active');
      const completedEl = document.getElementById('goals-summary-completed');
      const rateEl = document.getElementById('goals-summary-rate');

      if (!activeEl) return;

      const completed = goals.filter(g => g.completed || (g.currentValue >= g.targetValue)).length;
      const total = goals.length;
      const active = total - completed;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      activeEl.textContent = active;
      completedEl.textContent = completed;
      if (rateEl) rateEl.textContent = `${rate}%`;
    },

    renderGoals() {
      const container = document.getElementById('goals-list-container');
      if (!container) return;

      let goals = MindStorage.getGoals();

      if (this.activeFilter === 'active') {
        goals = goals.filter(g => !g.completed && (g.currentValue < g.targetValue));
      } else if (this.activeFilter === 'completed') {
        goals = goals.filter(g => g.completed || (g.currentValue >= g.targetValue));
      }

      if (goals.length === 0) {
        container.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon-circle"><i class="ph ph-target"></i></div>
            <h4>No goals match this view</h4>
            <p class="text-muted">Set gentle, realistic weekly goals to nurture your peace of mind and academic balance.</p>
            <button class="btn btn-primary" onclick="GoalsModule.openGoalModal()"><i class="ph ph-plus"></i> Set a Goal</button>
          </div>
        `;
        return;
      }

      let html = '';
      goals.forEach(goal => {
        const isDone = goal.completed || (goal.currentValue >= goal.targetValue);
        const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
        const iconClass = this.categoryIcons[goal.category] || 'ph-target';

        html += `
          <div class="goal-card ${isDone ? 'goal-completed' : ''}" data-id="${goal.id}">
            <div class="goal-card-top">
              <div class="goal-icon-badge">
                <i class="ph ${iconClass}"></i>
              </div>
              <div class="goal-header-text">
                <div class="goal-title-row">
                  <h4>${escapeHtml(goal.title)}</h4>
                  ${isDone ? `<span class="badge-pill badge-success"><i class="ph ph-check-circle"></i> Completed</span>` : ''}
                </div>
                <span class="badge-pill cat-badge">${escapeHtml(goal.category)}</span>
              </div>
              <div class="goal-menu-btns">
                <button type="button" class="btn-icon edit-goal-btn" data-id="${goal.id}" title="Edit Goal">
                  <i class="ph ph-pencil-simple"></i>
                </button>
                <button type="button" class="btn-icon delete-goal-btn" data-id="${goal.id}" title="Delete Goal">
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            </div>

            ${goal.notes ? `<p class="goal-notes-text"><i class="ph ph-lightbulb"></i> ${escapeHtml(goal.notes)}</p>` : ''}

            <!-- Progress Bar -->
            <div class="goal-progress-section">
              <div class="goal-progress-meta">
                <span>Progress: <strong>${goal.currentValue}</strong> / ${goal.targetValue} ${escapeHtml(goal.unit || '')}</span>
                <span class="goal-percent-text">${percent}%</span>
              </div>
              <div class="goal-progress-bar-bg">
                <div class="goal-progress-bar-fill" style="width: ${percent}%;"></div>
              </div>
            </div>

            <!-- Controls row -->
            <div class="goal-controls-row">
              <div class="goal-stepper-btns">
                <button type="button" class="btn-stepper step-down" data-id="${goal.id}" title="Decrease progress" ${goal.currentValue <= 0 ? 'disabled' : ''}>
                  <i class="ph ph-minus"></i>
                </button>
                <button type="button" class="btn-stepper step-up" data-id="${goal.id}" title="Increment progress">
                  <i class="ph ph-plus"></i>
                </button>
              </div>

              <button type="button" class="btn ${isDone ? 'btn-outline' : 'btn-primary-soft'} toggle-goal-done-btn" data-id="${goal.id}">
                <i class="ph ${isDone ? 'ph-arrow-counter-clockwise' : 'ph-check-bold'}"></i>
                <span>${isDone ? 'Mark Active' : 'Complete Goal'}</span>
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Bind Stepper buttons
      container.querySelectorAll('.step-up').forEach(btn => {
        btn.addEventListener('click', () => {
          const goal = MindStorage.updateGoalProgress(btn.dataset.id, 1);
          if (goal && goal.completed && window.confetti) {
            window.confetti({ particleCount: 30, spread: 55, origin: { y: 0.8 } });
            window.App.showToast(`🎉 Goal "${goal.title}" achieved! Outstanding work!`, 'success');
          }
        });
      });

      container.querySelectorAll('.step-down').forEach(btn => {
        btn.addEventListener('click', () => {
          MindStorage.updateGoalProgress(btn.dataset.id, -1);
        });
      });

      // Bind Toggle Complete
      container.querySelectorAll('.toggle-goal-done-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const goals = MindStorage.getGoals();
          const goal = goals.find(g => g.id === btn.dataset.id);
          if (!goal) return;

          if (goal.completed) {
            goal.completed = false;
            goal.currentValue = Math.min(goal.currentValue, Math.max(0, goal.targetValue - 1));
          } else {
            goal.completed = true;
            goal.currentValue = goal.targetValue;
            if (window.confetti) {
              window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
            }
            window.App.showToast(`Goal "${goal.title}" marked as complete!`, 'success');
          }
          MindStorage.saveGoal(goal);
        });
      });

      // Bind Edit & Delete
      container.querySelectorAll('.edit-goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const goals = MindStorage.getGoals();
          const goal = goals.find(g => g.id === btn.dataset.id);
          if (goal) this.openGoalModal(goal);
        });
      });

      container.querySelectorAll('.delete-goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const goals = MindStorage.getGoals();
          const goal = goals.find(g => g.id === btn.dataset.id);
          const title = goal ? goal.title : 'this goal';
          if (confirm(`Delete the goal "${title}"?`)) {
            MindStorage.deleteGoal(btn.dataset.id);
            window.App.showToast(`Goal "${title}" removed.`, 'info');
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

  window.GoalsModule = GoalsModule;
})(window);

