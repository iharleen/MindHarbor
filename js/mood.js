/**
 * MINDHARBOR - Mood Tracker & Calendar Module
 * Handles mood entry creation/update, deletion, emotional tags, calendar view, and history filtering.
 */

(function (window) {
  'use strict';

  const MoodModule = {
    selectedDate: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(), // 0-indexed

    moodMeta: {
      5: { name: 'Thriving', color: '#5E8C71', bg: '#EBF3EE', icon: 'ph-sun-dim', emoji: '✨' },
      4: { name: 'Good', color: '#7BA68D', bg: '#F2F7F4', icon: 'ph-smiley', emoji: '🌿' },
      3: { name: 'Balanced', color: '#3D7B80', bg: '#E4F2F3', icon: 'ph-scales', emoji: '⚖️' },
      2: { name: 'Low', color: '#D99863', bg: '#FDF6EE', icon: 'ph-cloud-rain', emoji: '🌧️' },
      1: { name: 'Overwhelmed', color: '#C86D74', bg: '#FCEEF0', icon: 'ph-lightning', emoji: '⚡' }
    },

    init() {
      this.selectedDate = MindStorage.formatDate();
      this.bindEvents();
      this.renderMoodFormForDate(this.selectedDate);
      this.renderCalendar();
      this.renderHistory();

      // Listen to storage changes
      MindStorage.on('moods:updated', () => {
        this.renderCalendar();
        this.renderHistory();
        this.renderMoodFormForDate(this.selectedDate);
      });
      MindStorage.on('storage:imported', () => {
        this.renderCalendar();
        this.renderHistory();
        this.renderMoodFormForDate(this.selectedDate);
      });
      MindStorage.on('storage:reset', () => {
        this.renderCalendar();
        this.renderHistory();
        this.renderMoodFormForDate(this.selectedDate);
      });
    },

    bindEvents() {
      // Date input change
      const dateInput = document.getElementById('mood-entry-date');
      if (dateInput) {
        dateInput.value = this.selectedDate;
        dateInput.addEventListener('change', (e) => {
          this.selectedDate = e.target.value;
          this.renderMoodFormForDate(this.selectedDate);
        });
      }

      // Mood score selector buttons (1-5)
      const moodScoreButtons = document.querySelectorAll('.mood-score-btn');
      moodScoreButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          moodScoreButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          const score = btn.dataset.score;
          const scoreInput = document.getElementById('mood-score-input');
          if (scoreInput) scoreInput.value = score;

          // Update helper text
          const meta = this.moodMeta[score];
          const helper = document.getElementById('mood-score-label');
          if (helper && meta) {
            helper.textContent = `${meta.emoji} ${meta.name} (Level ${score}/5)`;
            helper.style.color = meta.color;
          }
        });
      });

      // Emotion tag toggles
      const emotionTags = document.querySelectorAll('#emotion-tags-container .pill-tag');
      emotionTags.forEach(tag => {
        tag.addEventListener('click', () => {
          tag.classList.toggle('active');
        });
      });

      // Factor tag toggles
      const factorTags = document.querySelectorAll('#factor-tags-container .pill-tag');
      factorTags.forEach(tag => {
        tag.addEventListener('click', () => {
          tag.classList.toggle('active');
        });
      });

      // Sleep & Energy sliders real-time display
      const sleepSlider = document.getElementById('mood-sleep-hours');
      const sleepDisplay = document.getElementById('mood-sleep-val');
      if (sleepSlider && sleepDisplay) {
        sleepSlider.addEventListener('input', (e) => {
          sleepDisplay.textContent = `${e.target.value} hrs`;
        });
      }

      const energySlider = document.getElementById('mood-energy-level');
      const energyDisplay = document.getElementById('mood-energy-val');
      if (energySlider && energyDisplay) {
        energySlider.addEventListener('input', (e) => {
          energyDisplay.textContent = `${e.target.value}/5`;
        });
      }

      // Save Mood Form Submit
      const moodForm = document.getElementById('mood-entry-form');
      if (moodForm) {
        moodForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleMoodFormSubmit();
        });
      }

      // Delete Mood Button in Form
      const deleteBtn = document.getElementById('mood-form-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Delete the mood entry for ${this.selectedDate}?`)) {
            MindStorage.deleteMood(this.selectedDate);
            window.App.showToast(`Mood entry for ${this.selectedDate} removed.`, 'info');
            this.renderMoodFormForDate(this.selectedDate);
          }
        });
      }

      // Calendar Navigation
      const prevMonthBtn = document.getElementById('cal-prev-month');
      const nextMonthBtn = document.getElementById('cal-next-month');
      const todayCalBtn = document.getElementById('cal-today-btn');

      if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
          this.calendarMonth--;
          if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
          }
          this.renderCalendar();
        });
      }

      if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
          this.calendarMonth++;
          if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
          }
          this.renderCalendar();
        });
      }

      if (todayCalBtn) {
        todayCalBtn.addEventListener('click', () => {
          const now = new Date();
          this.calendarYear = now.getFullYear();
          this.calendarMonth = now.getMonth();
          this.selectedDate = MindStorage.formatDate(now);
          const dateInput = document.getElementById('mood-entry-date');
          if (dateInput) dateInput.value = this.selectedDate;
          this.renderCalendar();
          this.renderMoodFormForDate(this.selectedDate);
        });
      }

      // History Filter
      const historyFilter = document.getElementById('mood-history-filter');
      if (historyFilter) {
        historyFilter.addEventListener('change', () => {
          this.renderHistory();
        });
      }
    },

    renderMoodFormForDate(dateStr) {
      const existing = MindStorage.getMoodByDate(dateStr);
      const submitBtn = document.getElementById('mood-form-submit-btn');
      const deleteBtn = document.getElementById('mood-form-delete-btn');
      const banner = document.getElementById('mood-existing-banner');

      // Clear selections first
      const moodScoreButtons = document.querySelectorAll('.mood-score-btn');
      moodScoreButtons.forEach(b => b.classList.remove('selected'));
      document.querySelectorAll('#emotion-tags-container .pill-tag').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#factor-tags-container .pill-tag').forEach(t => t.classList.remove('active'));

      const noteInput = document.getElementById('mood-note-input');
      const sleepSlider = document.getElementById('mood-sleep-hours');
      const sleepDisplay = document.getElementById('mood-sleep-val');
      const energySlider = document.getElementById('mood-energy-level');
      const energyDisplay = document.getElementById('mood-energy-val');
      const scoreInput = document.getElementById('mood-score-input');
      const scoreLabel = document.getElementById('mood-score-label');

      if (existing) {
        // Populate existing
        if (banner) {
          banner.style.display = 'flex';
          banner.innerHTML = `<i class="ph ph-note-pencil"></i> Editing existing mood entry for <strong>${dateStr}</strong>. Changes will overwrite.`;
        }
        if (submitBtn) submitBtn.innerHTML = `<i class="ph ph-check"></i> Update Mood Entry`;
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';

        // Set score
        if (scoreInput) scoreInput.value = existing.score;
        const matchingBtn = document.querySelector(`.mood-score-btn[data-score="${existing.score}"]`);
        if (matchingBtn) matchingBtn.classList.add('selected');
        const meta = this.moodMeta[existing.score];
        if (scoreLabel && meta) {
          scoreLabel.textContent = `${meta.emoji} ${meta.name} (Level ${existing.score}/5)`;
          scoreLabel.style.color = meta.color;
        }

        // Emotions
        if (Array.isArray(existing.emotions)) {
          existing.emotions.forEach(emotion => {
            const tag = document.querySelector(`#emotion-tags-container .pill-tag[data-tag="${emotion}"]`);
            if (tag) tag.classList.add('active');
          });
        }

        // Factors
        if (Array.isArray(existing.factors)) {
          existing.factors.forEach(factor => {
            const tag = document.querySelector(`#factor-tags-container .pill-tag[data-tag="${factor}"]`);
            if (tag) tag.classList.add('active');
          });
        }

        // Sleep & Energy
        if (sleepSlider) {
          sleepSlider.value = existing.sleepHours || 7;
          if (sleepDisplay) sleepDisplay.textContent = `${sleepSlider.value} hrs`;
        }
        if (energySlider) {
          energySlider.value = existing.energy || 3;
          if (energyDisplay) energyDisplay.textContent = `${energySlider.value}/5`;
        }

        // Note
        if (noteInput) noteInput.value = existing.note || '';
      } else {
        // Fresh entry
        if (banner) banner.style.display = 'none';
        if (submitBtn) submitBtn.innerHTML = `<i class="ph ph-heart"></i> Save Mood Entry`;
        if (deleteBtn) deleteBtn.style.display = 'none';

        // Default to score 4 (Good) or 3 (Balanced)
        const defaultScore = 4;
        if (scoreInput) scoreInput.value = defaultScore;
        const defaultBtn = document.querySelector(`.mood-score-btn[data-score="${defaultScore}"]`);
        if (defaultBtn) defaultBtn.classList.add('selected');
        const meta = this.moodMeta[defaultScore];
        if (scoreLabel && meta) {
          scoreLabel.textContent = `${meta.emoji} ${meta.name} (Level ${defaultScore}/5)`;
          scoreLabel.style.color = meta.color;
        }

        if (sleepSlider) {
          sleepSlider.value = 7.5;
          if (sleepDisplay) sleepDisplay.textContent = '7.5 hrs';
        }
        if (energySlider) {
          energySlider.value = 4;
          if (energyDisplay) energyDisplay.textContent = '4/5';
        }
        if (noteInput) noteInput.value = '';
      }
    },

    handleMoodFormSubmit() {
      const dateInput = document.getElementById('mood-entry-date');
      const scoreInput = document.getElementById('mood-score-input');
      const noteInput = document.getElementById('mood-note-input');
      const sleepSlider = document.getElementById('mood-sleep-hours');
      const energySlider = document.getElementById('mood-energy-level');

      const dateStr = dateInput ? dateInput.value : this.selectedDate;
      const score = scoreInput ? parseInt(scoreInput.value, 10) : 3;

      if (!dateStr) {
        window.App.showToast('Please select a valid date.', 'error');
        return;
      }

      if (!score || score < 1 || score > 5) {
        window.App.showToast('Please pick a mood level from 1 to 5.', 'warning');
        return;
      }

      // Collect active emotions
      const emotions = [];
      document.querySelectorAll('#emotion-tags-container .pill-tag.active').forEach(t => {
        emotions.push(t.dataset.tag || t.textContent.trim());
      });

      // Collect active factors
      const factors = [];
      document.querySelectorAll('#factor-tags-container .pill-tag.active').forEach(t => {
        factors.push(t.dataset.tag || t.textContent.trim());
      });

      const entry = {
        date: dateStr,
        score: score,
        moodName: this.moodMeta[score].name,
        emotions: emotions,
        factors: factors,
        sleepHours: sleepSlider ? parseFloat(sleepSlider.value) : 7,
        energy: energySlider ? parseInt(energySlider.value, 10) : 3,
        note: noteInput ? noteInput.value.trim() : ''
      };

      const saved = MindStorage.saveMood(entry);

      if (window.confetti && score >= 4) {
        window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }

      window.App.showToast(`Mood entry saved for ${saved.date}!`, 'success');
      this.renderMoodFormForDate(saved.date);
    },

    renderCalendar() {
      const container = document.getElementById('mood-calendar-grid');
      const titleEl = document.getElementById('cal-month-title');
      if (!container) return;

      const year = this.calendarYear;
      const month = this.calendarMonth;

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      if (titleEl) {
        titleEl.textContent = `${monthNames[month]} ${year}`;
      }

      // First day of month
      const firstDay = new Date(year, month, 1);
      const startDayIndex = firstDay.getDay(); // 0 is Sunday
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Today
      const todayStr = MindStorage.formatDate();

      // Build day cells
      let html = '';

      // Day headers
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(dh => {
        html += `<div class="cal-header-cell">${dh}</div>`;
      });

      // Empty lead cells
      for (let i = 0; i < startDayIndex; i++) {
        html += `<div class="cal-day-cell cal-empty"></div>`;
      }

      // Month days
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const moodEntry = MindStorage.getMoodByDate(dStr);
        const isToday = dStr === todayStr;
        const isSelected = dStr === this.selectedDate;

        let moodDotHtml = '';
        let cellClass = 'cal-day-cell';
        if (isToday) cellClass += ' cal-today';
        if (isSelected) cellClass += ' cal-selected';

        if (moodEntry) {
          const meta = this.moodMeta[moodEntry.score] || this.moodMeta[3];
          cellClass += ' has-mood';
          moodDotHtml = `
            <div class="cal-mood-indicator" style="background-color: ${meta.bg}; color: ${meta.color}; border-color: ${meta.color}">
              <span class="cal-mood-emoji">${meta.emoji}</span>
              <span class="cal-mood-score">${moodEntry.score}</span>
            </div>
          `;
        }

        html += `
          <div class="${cellClass}" data-date="${dStr}">
            <span class="cal-day-num">${day}</span>
            ${moodDotHtml}
          </div>
        `;
      }

      container.innerHTML = html;

      // Add click events to days
      container.querySelectorAll('.cal-day-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
          const clickedDate = cell.dataset.date;
          this.selectedDate = clickedDate;
          const dateInput = document.getElementById('mood-entry-date');
          if (dateInput) dateInput.value = clickedDate;

          container.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('cal-selected'));
          cell.classList.add('cal-selected');

          this.renderMoodFormForDate(clickedDate);

          // If entry exists, optionally show quick preview modal or scroll to form
          const entry = MindStorage.getMoodByDate(clickedDate);
          if (entry) {
            this.showMoodDetailModal(entry);
          }
        });
      });
    },

    showMoodDetailModal(entry) {
      const modal = document.getElementById('mood-detail-modal');
      if (!modal) return;

      const meta = this.moodMeta[entry.score] || this.moodMeta[3];
      const contentEl = modal.querySelector('.modal-content-body');
      if (!contentEl) return;

      const emotionsHtml = entry.emotions && entry.emotions.length > 0
        ? entry.emotions.map(e => `<span class="pill-badge">${e}</span>`).join(' ')
        : '<span class="text-muted">None specified</span>';

      const factorsHtml = entry.factors && entry.factors.length > 0
        ? entry.factors.map(f => `<span class="pill-badge pill-secondary">${f}</span>`).join(' ')
        : '<span class="text-muted">None specified</span>';

      contentEl.innerHTML = `
        <div class="mood-detail-header" style="background: ${meta.bg}; border-left: 4px solid ${meta.color}">
          <div class="mood-detail-score-box" style="color: ${meta.color}">
            <span class="mood-detail-emoji">${meta.emoji}</span>
            <h3>${meta.name}</h3>
            <span class="badge-pill" style="background: ${meta.color}; color: #fff">${entry.score} / 5</span>
          </div>
          <div class="mood-detail-meta">
            <p><strong>Date:</strong> ${entry.date}</p>
            <p><strong>Sleep:</strong> ${entry.sleepHours || 7} hrs &bull; <strong>Energy:</strong> ${entry.energy || 3}/5</p>
          </div>
        </div>

        <div class="mood-detail-section">
          <h4>Emotions Logged</h4>
          <div class="tags-group">${emotionsHtml}</div>
        </div>

        <div class="mood-detail-section">
          <h4>Influencing Factors</h4>
          <div class="tags-group">${factorsHtml}</div>
        </div>

        ${entry.note ? `
          <div class="mood-detail-section">
            <h4>Reflections & Notes</h4>
            <div class="mood-detail-note-card">
              <i class="ph ph-quotes text-muted"></i>
              <p>${entry.note.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        ` : ''}

        <div class="modal-actions-footer">
          <button type="button" class="btn btn-outline" id="modal-edit-mood-btn"><i class="ph ph-pencil-simple"></i> Edit in Form</button>
          <button type="button" class="btn btn-danger-outline" id="modal-delete-mood-btn"><i class="ph ph-trash"></i> Delete Entry</button>
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
        </div>
      `;

      // Wire modal buttons
      const editBtn = contentEl.querySelector('#modal-edit-mood-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          window.App.closeModal('mood-detail-modal');
          const dateInput = document.getElementById('mood-entry-date');
          if (dateInput) {
            dateInput.value = entry.date;
            this.selectedDate = entry.date;
            this.renderMoodFormForDate(entry.date);
            dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }

      const delBtn = contentEl.querySelector('#modal-delete-mood-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`Are you sure you want to delete the mood entry for ${entry.date}?`)) {
            MindStorage.deleteMood(entry.id);
            window.App.closeModal('mood-detail-modal');
            window.App.showToast(`Mood entry for ${entry.date} deleted.`, 'info');
          }
        });
      }

      const closeBtn = contentEl.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          window.App.closeModal('mood-detail-modal');
        });
      }

      window.App.openModal('mood-detail-modal');
    },

    renderHistory() {
      const container = document.getElementById('mood-history-list');
      const filterSelect = document.getElementById('mood-history-filter');
      if (!container) return;

      const filterVal = filterSelect ? filterSelect.value : 'all';
      let moods = MindStorage.getMoods();

      if (filterVal !== 'all') {
        moods = moods.filter(m => m.score === parseInt(filterVal, 10));
      }

      if (moods.length === 0) {
        container.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon-circle"><i class="ph ph-calendar-blank"></i></div>
            <h4>No mood entries found</h4>
            <p class="text-muted">No logs match the selected filter. Try logging your mood for today or switching the filter.</p>
          </div>
        `;
        return;
      }

      let html = '';
      moods.forEach(entry => {
        const meta = this.moodMeta[entry.score] || this.moodMeta[3];
        const emotionPills = (entry.emotions || []).map(e => `<span class="pill-mini">${e}</span>`).join('');
        const factorPills = (entry.factors || []).map(f => `<span class="pill-mini pill-factor">${f}</span>`).join('');

        html += `
          <div class="mood-history-card" data-id="${entry.id}" data-date="${entry.date}">
            <div class="mood-history-left" style="border-left-color: ${meta.color}">
              <div class="mood-history-avatar" style="background: ${meta.bg}; color: ${meta.color}">
                <span>${meta.emoji}</span>
              </div>
              <div class="mood-history-info">
                <div class="mood-history-title-row">
                  <h4>${meta.name} <span class="mood-badge" style="background: ${meta.bg}; color: ${meta.color}">${entry.score}/5</span></h4>
                  <span class="mood-history-date">${entry.date}</span>
                </div>
                <div class="mood-history-tags">
                  ${emotionPills}
                  ${factorPills}
                </div>
                ${entry.note ? `<p class="mood-history-snippet">${escapeHtml(entry.note)}</p>` : ''}
              </div>
            </div>
            <div class="mood-history-actions">
              <button type="button" class="btn-icon view-history-btn" title="View Details" data-date="${entry.date}">
                <i class="ph ph-eye"></i>
              </button>
              <button type="button" class="btn-icon edit-history-btn" title="Edit Entry" data-date="${entry.date}">
                <i class="ph ph-pencil-simple"></i>
              </button>
              <button type="button" class="btn-icon delete-history-btn" title="Delete Entry" data-id="${entry.id}">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Event handlers for history cards
      container.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const date = btn.dataset.date;
          const entry = MindStorage.getMoodByDate(date);
          if (entry) this.showMoodDetailModal(entry);
        });
      });

      container.querySelectorAll('.edit-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const date = btn.dataset.date;
          this.selectedDate = date;
          const dateInput = document.getElementById('mood-entry-date');
          if (dateInput) {
            dateInput.value = date;
            this.renderMoodFormForDate(date);
            dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });

      container.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('Are you sure you want to delete this mood record?')) {
            MindStorage.deleteMood(id);
            window.App.showToast('Mood entry deleted.', 'info');
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

  window.MoodModule = MoodModule;
})(window);

