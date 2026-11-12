/**
 * MINDHARBOR - Core Application Controller
 * Handles SPA navigation, modals, toasts, onboarding wizard, daily check-in module,
 * personalized dashboard, theme management, and settings.
 */

(function (window) {
  'use strict';

  const affirmations = [
    { quote: "You don't have to carry the whole semester in one day. Focus on this single breath.", author: "Campus Mindfulness" },
    { quote: "Rest is not a reward you earn; it is a vital prerequisite for deep learning and creativity.", author: "MindHarbor Reflection" },
    { quote: "Small, consistent ripples of healthy habits create vast oceans of peace and resilience.", author: "Daily Wellness" },
    { quote: "Honor your limits without apology. Saying no to extra pressure is saying yes to your peace.", author: "Student Anchor" },
    { quote: "Your academic worth is not measured by exhaustion. Treat yourself with the gentleness of a dear friend.", author: "Campus Wellness" },
    { quote: "Progress is rarely linear. Celebrate the days you simply showed up and tried.", author: "MindHarbor Anchor" }
  ];

  const App = {
    currentTab: 'dashboard',
    theme: 'light',

    init() {
      // 1. Load theme
      this.initTheme();

      // 2. Check onboarding
      this.checkOnboarding();

      // 3. Initialize submodules
      if (window.MoodModule) window.MoodModule.init();
      if (window.HabitsModule) window.HabitsModule.init();
      if (window.JournalModule) window.JournalModule.init();
      if (window.GoalsModule) window.GoalsModule.init();
      if (window.AnalyticsModule) window.AnalyticsModule.init();

      // 4. Initialize Check-in module & Dashboard
      this.initCheckinModule();
      this.initSettingsModule();
      this.renderDashboard();

      // 5. Global events & navigation
      this.bindNavigation();
      this.bindModals();
      this.bindGlobalActions();

      // 6. Listen to storage changes to refresh dashboard
      MindStorage.on('profile:updated', () => {
        this.updateProfileUI();
        this.renderDashboard();
      });
      MindStorage.on('moods:updated', () => this.renderDashboard());
      MindStorage.on('habitLogs:updated', () => this.renderDashboard());
      MindStorage.on('checkins:updated', () => this.renderDashboard());
      MindStorage.on('goals:updated', () => this.renderDashboard());
      MindStorage.on('storage:imported', () => {
        this.updateProfileUI();
        this.renderDashboard();
        this.showToast('All data successfully loaded!', 'success');
      });
      MindStorage.on('storage:reset', () => {
        this.updateProfileUI();
        this.renderDashboard();
        this.showToast('Application reset to clean state.', 'info');
      });

      this.updateProfileUI();
    },

    // -------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------
    bindNavigation() {
      const navLinks = document.querySelectorAll('[data-target-tab]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.dataset.targetTab;
          if (target) {
            this.switchTab(target);
          }
        });
      });

      // Mobile drawer toggle
      const mobileMenuBtn = document.getElementById('btn-mobile-menu');
      const sidebar = document.getElementById('app-sidebar');
      const sidebarBackdrop = document.getElementById('sidebar-backdrop');

      if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          if (sidebarBackdrop) sidebarBackdrop.classList.toggle('visible');
        });
      }

      if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
          if (sidebar) sidebar.classList.remove('open');
          sidebarBackdrop.classList.remove('visible');
        });
      }
    },

    switchTab(tabId) {
      const sections = document.querySelectorAll('.app-view-section');
      const navLinks = document.querySelectorAll('[data-target-tab]');

      // Close mobile drawer if open
      const sidebar = document.getElementById('app-sidebar');
      const sidebarBackdrop = document.getElementById('sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('visible');

      let targetSection = document.getElementById(`view-${tabId}`);
      if (!targetSection) {
        targetSection = document.getElementById('view-dashboard');
        tabId = 'dashboard';
      }

      sections.forEach(sec => sec.classList.remove('active-view'));
      targetSection.classList.add('active-view');

      navLinks.forEach(link => {
        if (link.dataset.targetTab === tabId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      this.currentTab = tabId;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger redraw of charts if moving to analytics or dashboard
      if (tabId === 'analytics' && window.AnalyticsModule) {
        setTimeout(() => window.AnalyticsModule.refreshAll(), 50);
      } else if (tabId === 'dashboard') {
        this.renderDashboard();
      }
    },

    // -------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // -------------------------------------------------------------
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast-pill toast-${type}`;

      let icon = 'ph-info';
      if (type === 'success') icon = 'ph-check-circle-bold';
      if (type === 'warning') icon = 'ph-warning-circle-bold';
      if (type === 'error') icon = 'ph-x-circle-bold';

      toast.innerHTML = `
        <i class="ph ${icon}"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
      `;

      container.appendChild(toast);

      // Slide in
      setTimeout(() => toast.classList.add('visible'), 20);

      // Slide out and remove
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 350);
      }, 3500);
    },

    // -------------------------------------------------------------
    // MODAL DIALOGS
    // -------------------------------------------------------------
    bindModals() {
      // Backdrop click & close buttons
      document.querySelectorAll('.app-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal.id);
          }
        });

        modal.querySelectorAll('.modal-close-x, .btn-modal-cancel').forEach(btn => {
          btn.addEventListener('click', () => {
            this.closeModal(modal.id);
          });
        });
      });

      // Escape key
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const openModals = document.querySelectorAll('.app-modal.active');
          openModals.forEach(m => this.closeModal(m.id));
        }
      });
    },

    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        const activeModals = document.querySelectorAll('.app-modal.active');
        if (activeModals.length === 0) {
          document.body.style.overflow = '';
        }
      }
    },

    // -------------------------------------------------------------
    // ONBOARDING
    // -------------------------------------------------------------
    checkOnboarding() {
      const profile = MindStorage.getProfile();
      if (!profile) {
        this.openModal('modal-onboarding');
      }
    },

    // -------------------------------------------------------------
    // THEME MANAGEMENT
    // -------------------------------------------------------------
    initTheme() {
      const settings = MindStorage.getSettings();
      const savedTheme = settings.theme || 'light';
      this.applyTheme(savedTheme);

      const themeToggleBtn = document.getElementById('btn-toggle-theme');
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
          const nextTheme = this.theme === 'light' ? 'dark' : 'light';
          this.applyTheme(nextTheme);
          MindStorage.saveSettings({ theme: nextTheme });
          this.showToast(`Switched to ${nextTheme === 'dark' ? 'Night Serenity' : 'Dawn Calm'} mode.`, 'info');
        });
      }
    },

    applyTheme(theme) {
      this.theme = theme;
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      const icon = document.querySelector('#btn-toggle-theme i');
      if (icon) {
        icon.className = theme === 'dark' ? 'ph ph-sun-bold' : 'ph ph-moon-bold';
      }
    },

    // -------------------------------------------------------------
    // PROFILE UI
    // -------------------------------------------------------------
    updateProfileUI() {
      const profile = MindStorage.getProfile() || {
        name: 'Mindful Scholar',
        university: 'University Wellness',
        major: 'General Studies',
        year: 'Student'
      };

      const nameEls = document.querySelectorAll('.user-display-name');
      const uniEls = document.querySelectorAll('.user-display-school');
      const avatarEls = document.querySelectorAll('.user-display-avatar');

      nameEls.forEach(el => { el.textContent = profile.name; });
      uniEls.forEach(el => { el.textContent = `${profile.university} • ${profile.major || ''}`; });
      avatarEls.forEach(el => {
        el.textContent = (profile.name || 'M').charAt(0).toUpperCase();
      });
    },

    // -------------------------------------------------------------
    // PERSONALIZED DASHBOARD
    // -------------------------------------------------------------
    renderDashboard() {
      const profile = MindStorage.getProfile() || { name: 'Friend' };
      const todayStr = MindStorage.formatDate();

      // Greeting based on time
      const greetingEl = document.getElementById('dash-greeting-text');
      if (greetingEl) {
        const hour = new Date().getHours();
        let timeGreeting = 'Good morning';
        if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
        else if (hour >= 17) timeGreeting = 'Good evening';
        greetingEl.textContent = `${timeGreeting}, ${profile.name}`;
      }

      // Affirmation Quote
      const quoteTextEl = document.getElementById('dash-affirmation-text');
      const quoteAuthorEl = document.getElementById('dash-affirmation-author');
      if (quoteTextEl && quoteAuthorEl) {
        const randQuote = affirmations[Math.floor(Math.random() * affirmations.length)];
        quoteTextEl.textContent = `“${randQuote.quote}”`;
        quoteAuthorEl.textContent = `— ${randQuote.author}`;
      }

      // Check today's mood
      const todayMood = MindStorage.getMoodByDate(todayStr);
      const moodBoxEl = document.getElementById('dash-mood-status-box');
      if (moodBoxEl) {
        if (todayMood) {
          const meta = window.MoodModule?.moodMeta[todayMood.score] || { name: 'Balanced', emoji: '✨', color: '#5E8C71', bg: '#EBF3EE' };
          moodBoxEl.innerHTML = `
            <div class="dash-status-badge" style="background: ${meta.bg}; color: ${meta.color}">
              <span class="dash-status-emoji">${meta.emoji}</span>
              <div>
                <strong>${meta.name} (Level ${todayMood.score}/5)</strong>
                <p class="text-sm">Logged for today &bull; Sleep: ${todayMood.sleepHours || 7}h</p>
              </div>
            </div>
            <button class="btn btn-sm btn-outline mt-2" onclick="App.switchTab('mood')">Update Mood Entry</button>
          `;
        } else {
          moodBoxEl.innerHTML = `
            <p class="text-muted text-sm mb-2">You haven't logged your mood yet today.</p>
            <button class="btn btn-sm btn-primary" onclick="App.switchTab('mood')"><i class="ph ph-heart"></i> Log Today's Mood</button>
          `;
        }
      }

      // Today's Habits Quick Check
      const habits = MindStorage.getHabits();
      const habitProgressContainer = document.getElementById('dash-habits-quick-list');
      const habitProgressPercentEl = document.getElementById('dash-habit-progress-percent');
      const habitProgressBarEl = document.getElementById('dash-habit-progress-bar');

      if (habitProgressContainer) {
        if (habits.length === 0) {
          habitProgressContainer.innerHTML = `
            <p class="text-muted text-sm">No habits active yet.</p>
            <button class="btn btn-sm btn-outline mt-1" onclick="App.switchTab('habits')">+ Add First Habit</button>
          `;
          if (habitProgressPercentEl) habitProgressPercentEl.textContent = '0%';
          if (habitProgressBarEl) habitProgressBarEl.style.width = '0%';
        } else {
          let doneCount = 0;
          let quickListHtml = '';

          // Show top 3-4 habits
          habits.slice(0, 4).forEach(h => {
            const isDone = MindStorage.isHabitCompleted(h.id, todayStr);
            if (isDone) doneCount++;

            quickListHtml += `
              <div class="dash-habit-quick-item ${isDone ? 'done' : ''}">
                <button type="button" class="btn-check-square ${isDone ? 'checked' : ''}" data-habit="${h.id}">
                  <i class="ph ${isDone ? 'ph-check-bold' : 'ph-square'}"></i>
                </button>
                <span class="dash-habit-title ${isDone ? 'line-through' : ''}">${escapeHtml(h.title)}</span>
              </div>
            `;
          });

          habitProgressContainer.innerHTML = quickListHtml;

          // Wire checkboxes
          habitProgressContainer.querySelectorAll('.btn-check-square').forEach(btn => {
            btn.addEventListener('click', () => {
              const habitId = btn.dataset.habit;
              const completed = MindStorage.toggleHabitCompletion(habitId, todayStr);
              if (completed && window.confetti) {
                window.confetti({ particleCount: 20, spread: 45, origin: { y: 0.85 } });
              }
            });
          });

          const pct = Math.round((doneCount / habits.length) * 100);
          if (habitProgressPercentEl) habitProgressPercentEl.textContent = `${pct}% done (${doneCount}/${habits.length})`;
          if (habitProgressBarEl) habitProgressBarEl.style.width = `${pct}%`;
        }
      }

      // Goals Snapshot
      const goals = MindStorage.getGoals();
      const dashGoalsList = document.getElementById('dash-goals-snippet');
      if (dashGoalsList) {
        if (goals.length === 0) {
          dashGoalsList.innerHTML = `
            <p class="text-muted text-sm">No active weekly goals.</p>
            <button class="btn btn-sm btn-outline mt-1" onclick="App.switchTab('goals')">+ Set Weekly Goal</button>
          `;
        } else {
          const activeGoals = goals.filter(g => !g.completed).slice(0, 3);
          if (activeGoals.length === 0) {
            dashGoalsList.innerHTML = `<p class="text-success text-sm"><i class="ph ph-check-circle"></i> All weekly goals achieved!</p>`;
          } else {
            let html = '';
            activeGoals.forEach(g => {
              const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
              html += `
                <div class="dash-goal-row">
                  <div class="dash-goal-info">
                    <span class="dash-goal-title">${escapeHtml(g.title)}</span>
                    <span class="text-xs text-muted">${g.currentValue}/${g.targetValue} ${escapeHtml(g.unit || '')}</span>
                  </div>
                  <div class="dash-goal-bar-bg">
                    <div class="dash-goal-bar-fill" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            });
            dashGoalsList.innerHTML = html;
          }
        }
      }

      // Recent Journal Snippet
      const journals = MindStorage.getJournals();
      const dashJournalSnippet = document.getElementById('dash-journal-snippet');
      if (dashJournalSnippet) {
        if (journals.length === 0) {
          dashJournalSnippet.innerHTML = `
            <p class="text-muted text-sm">No reflections written yet.</p>
            <button class="btn btn-sm btn-outline mt-1" onclick="App.switchTab('journal')"><i class="ph ph-pencil"></i> Write First Entry</button>
          `;
        } else {
          const latest = journals[0];
          const preview = latest.content.length > 110 ? latest.content.substring(0, 110) + '...' : latest.content;
          dashJournalSnippet.innerHTML = `
            <div class="dash-journal-preview-card" onclick="JournalModule.openReaderModal(MindStorage.getJournalById('${latest.id}'))">
              <span class="text-xs text-muted mb-1 d-block"><i class="ph ph-calendar"></i> ${latest.date} &bull; ${escapeHtml(latest.category || 'Reflection')}</span>
              <strong>${escapeHtml(latest.title)}</strong>
              <p class="text-sm text-muted mt-1">${escapeHtml(preview)}</p>
            </div>
          `;
        }
      }

      // Today's Check-in Shortcut Banner
      const todayCheckin = MindStorage.getCheckinByDate(todayStr);
      const checkinAlert = document.getElementById('dash-checkin-alert');
      if (checkinAlert) {
        if (todayCheckin) {
          checkinAlert.innerHTML = `
            <div class="alert-box alert-success">
              <i class="ph ph-sparkle"></i>
              <span>Today's wellness check-in completed (${todayCheckin.sleepHours}h sleep &bull; ${todayCheckin.waterGlasses} glasses water).</span>
              <button class="btn btn-xs btn-outline ml-auto" onclick="App.switchTab('checkin')">View Check-in</button>
            </div>
          `;
        } else {
          checkinAlert.innerHTML = `
            <div class="alert-box alert-info">
              <i class="ph ph-heartbeat"></i>
              <span>Take 60 seconds to complete your daily wellness check-in.</span>
              <button class="btn btn-xs btn-primary ml-auto" onclick="App.switchTab('checkin')">Check-In Now</button>
            </div>
          `;
        }
      }
    },

    // -------------------------------------------------------------
    // DAILY WELLNESS CHECK-IN MODULE
    // -------------------------------------------------------------
    initCheckinModule() {
      const todayStr = MindStorage.formatDate();
      const dateInput = document.getElementById('checkin-date-input');
      if (dateInput) {
        dateInput.value = todayStr;
        dateInput.addEventListener('change', (e) => {
          this.loadCheckinForDate(e.target.value);
        });
      }

      // Water counter buttons
      const waterValEl = document.getElementById('checkin-water-val');
      const waterMinusBtn = document.getElementById('checkin-water-minus');
      const waterPlusBtn = document.getElementById('checkin-water-plus');
      let currentWater = 4;

      if (waterMinusBtn && waterPlusBtn && waterValEl) {
        waterMinusBtn.addEventListener('click', () => {
          currentWater = Math.max(0, currentWater - 1);
          waterValEl.textContent = `${currentWater} glasses`;
          document.getElementById('checkin-water-input').value = currentWater;
          this.updateWaterGlassesUI(currentWater);
        });

        waterPlusBtn.addEventListener('click', () => {
          currentWater = Math.min(16, currentWater + 1);
          waterValEl.textContent = `${currentWater} glasses`;
          document.getElementById('checkin-water-input').value = currentWater;
          this.updateWaterGlassesUI(currentWater);
        });
      }

      // Sliders real-time values
      const sleepSlider = document.getElementById('checkin-sleep-hours');
      const sleepDisplay = document.getElementById('checkin-sleep-val');
      if (sleepSlider && sleepDisplay) {
        sleepSlider.addEventListener('input', (e) => {
          sleepDisplay.textContent = `${e.target.value} hrs`;
        });
      }

      const stressSlider = document.getElementById('checkin-stress-level');
      const stressDisplay = document.getElementById('checkin-stress-val');
      if (stressSlider && stressDisplay) {
        stressSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          let label = 'Moderate';
          if (val <= 3) label = 'Low / Peaceful';
          else if (val >= 8) label = 'High / Overwhelmed';
          stressDisplay.textContent = `${val}/10 (${label})`;
        });
      }

      // Form submission
      const checkinForm = document.getElementById('checkin-form');
      if (checkinForm) {
        checkinForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleCheckinSubmit();
        });
      }

      this.loadCheckinForDate(todayStr);
      this.renderCheckinHistory();

      MindStorage.on('checkins:updated', () => {
        this.renderCheckinHistory();
      });
    },

    updateWaterGlassesUI(count) {
      const container = document.getElementById('checkin-water-icons');
      if (!container) return;
      let html = '';
      for (let i = 1; i <= 8; i++) {
        const isFilled = i <= count;
        html += `<i class="ph ${isFilled ? 'ph-drop-fill' : 'ph-drop'} ${isFilled ? 'water-filled' : 'water-empty'}"></i>`;
      }
      container.innerHTML = html;
    },

    loadCheckinForDate(dateStr) {
      const checkin = MindStorage.getCheckinByDate(dateStr);
      const sleepSlider = document.getElementById('checkin-sleep-hours');
      const sleepDisplay = document.getElementById('checkin-sleep-val');
      const qualitySelect = document.getElementById('checkin-sleep-quality');
      const waterValEl = document.getElementById('checkin-water-val');
      const waterInput = document.getElementById('checkin-water-input');
      const activityInput = document.getElementById('checkin-activity-mins');
      const stressSlider = document.getElementById('checkin-stress-level');
      const stressDisplay = document.getElementById('checkin-stress-val');
      const focusInput = document.getElementById('checkin-focus-hours');
      const gratitudeInput = document.getElementById('checkin-gratitude');
      const banner = document.getElementById('checkin-existing-banner');
      const submitBtn = document.getElementById('checkin-submit-btn');

      if (checkin) {
        if (banner) banner.style.display = 'flex';
        if (submitBtn) submitBtn.innerHTML = `<i class="ph ph-check"></i> Update Check-in for ${dateStr}`;

        if (sleepSlider) {
          sleepSlider.value = checkin.sleepHours || 7;
          if (sleepDisplay) sleepDisplay.textContent = `${sleepSlider.value} hrs`;
        }
        if (qualitySelect) qualitySelect.value = checkin.sleepQuality || 3;
        if (waterInput && waterValEl) {
          waterInput.value = checkin.waterGlasses || 4;
          waterValEl.textContent = `${checkin.waterGlasses || 4} glasses`;
          this.updateWaterGlassesUI(checkin.waterGlasses || 4);
        }
        if (activityInput) activityInput.value = checkin.activityMinutes || 30;
        if (stressSlider) {
          stressSlider.value = checkin.stressLevel || 5;
          if (stressDisplay) stressDisplay.textContent = `${stressSlider.value}/10`;
        }
        if (focusInput) focusInput.value = checkin.focusHours || 3;
        if (gratitudeInput) gratitudeInput.value = checkin.gratitude || '';
      } else {
        if (banner) banner.style.display = 'none';
        if (submitBtn) submitBtn.innerHTML = `<i class="ph ph-check-circle"></i> Save Daily Check-in`;

        if (sleepSlider) {
          sleepSlider.value = 7.5;
          if (sleepDisplay) sleepDisplay.textContent = '7.5 hrs';
        }
        if (qualitySelect) qualitySelect.value = 4;
        if (waterInput && waterValEl) {
          waterInput.value = 5;
          waterValEl.textContent = '5 glasses';
          this.updateWaterGlassesUI(5);
        }
        if (activityInput) activityInput.value = 30;
        if (stressSlider) {
          stressSlider.value = 4;
          if (stressDisplay) stressDisplay.textContent = '4/10';
        }
        if (focusInput) focusInput.value = 3;
        if (gratitudeInput) gratitudeInput.value = '';
      }
    },

    handleCheckinSubmit() {
      const dateInput = document.getElementById('checkin-date-input');
      const sleepSlider = document.getElementById('checkin-sleep-hours');
      const qualitySelect = document.getElementById('checkin-sleep-quality');
      const waterInput = document.getElementById('checkin-water-input');
      const activityInput = document.getElementById('checkin-activity-mins');
      const stressSlider = document.getElementById('checkin-stress-level');
      const focusInput = document.getElementById('checkin-focus-hours');
      const gratitudeInput = document.getElementById('checkin-gratitude');

      const dateStr = dateInput ? dateInput.value : MindStorage.formatDate();

      const entry = {
        date: dateStr,
        sleepHours: sleepSlider ? parseFloat(sleepSlider.value) : 7,
        sleepQuality: qualitySelect ? parseInt(qualitySelect.value, 10) : 3,
        waterGlasses: waterInput ? parseInt(waterInput.value, 10) : 4,
        activityMinutes: activityInput ? parseInt(activityInput.value, 10) : 30,
        stressLevel: stressSlider ? parseInt(stressSlider.value, 10) : 4,
        focusHours: focusInput ? parseFloat(focusInput.value) : 3,
        gratitude: gratitudeInput ? gratitudeInput.value.trim() : ''
      };

      MindStorage.saveCheckin(entry);

      if (window.confetti) {
        window.confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }

      this.showToast(`Daily check-in saved for ${dateStr}!`, 'success');
      this.loadCheckinForDate(dateStr);
    },

    renderCheckinHistory() {
      const container = document.getElementById('checkin-history-container');
      if (!container) return;

      const checkins = MindStorage.getCheckins();
      if (checkins.length === 0) {
        container.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon-circle"><i class="ph ph-heartbeat"></i></div>
            <h4>No check-ins recorded</h4>
            <p class="text-muted">Take a mindful moment to record your sleep, water, and feelings today.</p>
          </div>
        `;
        return;
      }

      let html = '';
      checkins.slice(0, 10).forEach(chk => {
        html += `
          <div class="checkin-history-card">
            <div class="checkin-card-header">
              <span class="checkin-card-date"><i class="ph ph-calendar"></i> ${chk.date}</span>
              <span class="badge-pill ${chk.stressLevel <= 4 ? 'badge-success' : 'badge-warning'}">
                Stress: ${chk.stressLevel}/10
              </span>
            </div>
            <div class="checkin-metrics-grid">
              <div class="checkin-metric-cell">
                <i class="ph ph-moon"></i>
                <div>
                  <strong>${chk.sleepHours} hrs</strong>
                  <span class="text-xs text-muted">Sleep</span>
                </div>
              </div>
              <div class="checkin-metric-cell">
                <i class="ph ph-drop"></i>
                <div>
                  <strong>${chk.waterGlasses} cups</strong>
                  <span class="text-xs text-muted">Water</span>
                </div>
              </div>
              <div class="checkin-metric-cell">
                <i class="ph ph-activity"></i>
                <div>
                  <strong>${chk.activityMinutes} min</strong>
                  <span class="text-xs text-muted">Activity</span>
                </div>
              </div>
              <div class="checkin-metric-cell">
                <i class="ph ph-timer"></i>
                <div>
                  <strong>${chk.focusHours || 0} hrs</strong>
                  <span class="text-xs text-muted">Focus</span>
                </div>
              </div>
            </div>
            ${chk.gratitude ? `
              <div class="checkin-gratitude-snippet">
                <i class="ph ph-sparkle text-muted"></i>
                <p class="text-sm font-italic">“${escapeHtml(chk.gratitude)}”</p>
              </div>
            ` : ''}
          </div>
        `;
      });

      container.innerHTML = html;
    },

    // -------------------------------------------------------------
    // SETTINGS & DATA CONTROLS
    // -------------------------------------------------------------
    initSettingsModule() {
      // Profile form
      const profileForm = document.getElementById('settings-profile-form');
      if (profileForm) {
        // Load current
        const profile = MindStorage.getProfile() || {};
        const nameInput = document.getElementById('profile-name-input');
        const uniInput = document.getElementById('profile-uni-input');
        const majorInput = document.getElementById('profile-major-input');
        const yearSelect = document.getElementById('profile-year-select');

        if (nameInput) nameInput.value = profile.name || '';
        if (uniInput) uniInput.value = profile.university || '';
        if (majorInput) majorInput.value = profile.major || '';
        if (yearSelect) yearSelect.value = profile.year || 'Junior (3rd Year)';

        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const updated = {
            name: nameInput ? nameInput.value.trim() : 'Scholar',
            university: uniInput ? uniInput.value.trim() : 'College',
            major: majorInput ? majorInput.value.trim() : '',
            year: yearSelect ? yearSelect.value : ''
          };
          MindStorage.saveProfile(updated);
          this.showToast('Profile updated successfully!', 'success');
        });
      }

      // Export JSON
      const exportBtn = document.getElementById('btn-export-json');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          MindStorage.exportData();
          this.showToast('Backup JSON downloaded successfully!', 'success');
        });
      }

      // Import JSON file
      const importInput = document.getElementById('import-json-file');
      const importBtn = document.getElementById('btn-trigger-import');
      if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
          importInput.click();
        });

        importInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const res = MindStorage.importData(event.target.result);
            if (res.success) {
              this.showToast('Backup restored successfully!', 'success');
            } else {
              this.showToast('Error importing file: ' + res.error, 'error');
            }
          };
          reader.readAsText(file);
          importInput.value = '';
        });
      }

      // Load Demo Data
      const demoBtn = document.getElementById('btn-load-demo-data');
      if (demoBtn) {
        demoBtn.addEventListener('click', () => {
          if (confirm('Load sample college student wellness records? This will populate realistic moods, habits, and journals.')) {
            MindStorage.loadDemoData();
            this.showToast('Sample wellness records loaded!', 'success');
            this.switchTab('dashboard');
          }
        });
      }

      // Reset All Data button
      const resetBtn = document.getElementById('btn-reset-all-data');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.openModal('modal-confirm-reset');
        });
      }

      const confirmResetBtn = document.getElementById('btn-execute-confirmed-reset');
      if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
          MindStorage.resetAllData();
          this.closeModal('modal-confirm-reset');
          this.showToast('All data has been reset to a clean slate.', 'info');
          this.switchTab('dashboard');
        });
      }

      // Onboarding wizard form submit
      const onboardForm = document.getElementById('onboarding-form');
      if (onboardForm) {
        onboardForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('onboard-name-input')?.value.trim() || 'Scholar';
          const uni = document.getElementById('onboard-uni-input')?.value.trim() || 'University';
          const major = document.getElementById('onboard-major-input')?.value.trim() || '';

          MindStorage.saveProfile({
            name: name,
            university: uni,
            major: major,
            year: 'Undergraduate'
          });

          this.closeModal('modal-onboarding');
          this.showToast(`Welcome to MindHarbor, ${name}!`, 'success');
        });
      }

      const onboardDemoBtn = document.getElementById('btn-onboard-load-demo');
      if (onboardDemoBtn) {
        onboardDemoBtn.addEventListener('click', () => {
          MindStorage.loadDemoData();
          this.closeModal('modal-onboarding');
          this.showToast('Welcome to MindHarbor! Sample data loaded.', 'success');
          this.switchTab('dashboard');
        });
      }
    },

    // -------------------------------------------------------------
    // GLOBAL ACTIONS (e.g. Quick Log FAB, Affirmation shuffle)
    // -------------------------------------------------------------
    bindGlobalActions() {
      // Affirmation shuffle button
      const shuffleBtn = document.getElementById('btn-shuffle-affirmation');
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
          const quoteTextEl = document.getElementById('dash-affirmation-text');
          const quoteAuthorEl = document.getElementById('dash-affirmation-author');
          if (quoteTextEl && quoteAuthorEl) {
            const rand = affirmations[Math.floor(Math.random() * affirmations.length)];
            quoteTextEl.style.opacity = '0';
            setTimeout(() => {
              quoteTextEl.textContent = `“${rand.quote}”`;
              quoteAuthorEl.textContent = `— ${rand.author}`;
              quoteTextEl.style.opacity = '1';
            }, 180);
          }
        });
      }

      // Quick Action Floating Button / Header Action
      const quickLogBtn = document.getElementById('btn-quick-log');
      if (quickLogBtn) {
        quickLogBtn.addEventListener('click', () => {
          this.switchTab('mood');
        });
      }
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

  window.App = App;

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
})(window);

