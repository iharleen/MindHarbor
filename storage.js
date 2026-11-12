/**
 * MINDHARBOR - Data Storage & Persistence Module
 * Manages localStorage, pub-sub events, data validation, import/export, and demo data.
 */

(function (window) {
  'use strict';

  const KEYS = {
    PROFILE: 'mh_profile',
    MOODS: 'mh_moods',
    HABITS: 'mh_habits',
    HABIT_LOGS: 'mh_habit_logs',
    JOURNALS: 'mh_journals',
    CHECKINS: 'mh_checkins',
    GOALS: 'mh_goals',
    SETTINGS: 'mh_settings',
    INITIALIZED: 'mh_initialized_flag'
  };

  const listeners = {};

  const MindStorage = {
    KEYS,

    // Event Bus for cross-module communication
    on(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },

    off(event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
      if (listeners[event]) {
        listeners[event].forEach(cb => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in MindStorage event listener for ${event}:`, err);
          }
        });
      }
    },

    // Raw getters & setters
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error(`Failed to get key "${key}" from localStorage:`, e);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        this.emit(`change:${key}`, value);
        return true;
      } catch (e) {
        console.error(`Failed to set key "${key}" in localStorage:`, e);
        return false;
      }
    },

    // Helper: generate unique ID
    uid() {
      return 'mh_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    },

    // Helper: format Date to YYYY-MM-DD
    formatDate(dateObj = new Date()) {
      const d = new Date(dateObj);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // -------------------------------------------------------------
    // PROFILE
    // -------------------------------------------------------------
    getProfile() {
      return this.get(KEYS.PROFILE, null);
    },

    saveProfile(profileData) {
      const current = this.getProfile() || {};
      const updated = {
        ...current,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      if (!updated.createdAt) updated.createdAt = new Date().toISOString();
      this.set(KEYS.PROFILE, updated);
      this.emit('profile:updated', updated);
      return updated;
    },

    // -------------------------------------------------------------
    // MOODS
    // -------------------------------------------------------------
    getMoods() {
      return this.get(KEYS.MOODS, []);
    },

    getMoodByDate(dateStr) {
      const moods = this.getMoods();
      return moods.find(m => m.date === dateStr) || null;
    },

    saveMood(entry) {
      const moods = this.getMoods();
      const dateStr = entry.date || this.formatDate();
      const existingIdx = moods.findIndex(m => m.date === dateStr);

      const moodRecord = {
        id: existingIdx >= 0 ? moods[existingIdx].id : this.uid(),
        date: dateStr,
        score: Number(entry.score) || 3, // 1 to 5
        moodName: entry.moodName || this.getMoodLabel(Number(entry.score) || 3),
        emotions: Array.isArray(entry.emotions) ? entry.emotions : [],
        sleepHours: Number(entry.sleepHours) || 7,
        energy: Number(entry.energy) || 3,
        factors: Array.isArray(entry.factors) ? entry.factors : [],
        note: entry.note ? entry.note.trim() : '',
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        moods[existingIdx] = moodRecord;
      } else {
        moods.push(moodRecord);
      }

      // Keep sorted by date descending
      moods.sort((a, b) => b.date.localeCompare(a.date));
      this.set(KEYS.MOODS, moods);
      this.emit('moods:updated', moods);
      return moodRecord;
    },

    deleteMood(idOrDate) {
      let moods = this.getMoods();
      moods = moods.filter(m => m.id !== idOrDate && m.date !== idOrDate);
      this.set(KEYS.MOODS, moods);
      this.emit('moods:updated', moods);
      return true;
    },

    getMoodLabel(score) {
      switch (Number(score)) {
        case 5: return 'Thriving';
        case 4: return 'Good';
        case 3: return 'Balanced';
        case 2: return 'Low';
        case 1: return 'Overwhelmed';
        default: return 'Balanced';
      }
    },

    // -------------------------------------------------------------
    // HABITS & HABIT LOGS
    // -------------------------------------------------------------
    getHabits() {
      return this.get(KEYS.HABITS, []);
    },

    getHabitLogs() {
      return this.get(KEYS.HABIT_LOGS, {});
    },

    saveHabit(habitData) {
      const habits = this.getHabits();
      if (habitData.id) {
        const idx = habits.findIndex(h => h.id === habitData.id);
        if (idx >= 0) {
          habits[idx] = {
            ...habits[idx],
            ...habitData,
            updatedAt: new Date().toISOString()
          };
          this.set(KEYS.HABITS, habits);
          this.emit('habits:updated', habits);
          return habits[idx];
        }
      }

      const newHabit = {
        id: this.uid(),
        title: habitData.title.trim(),
        category: habitData.category || 'Mind',
        icon: habitData.icon || 'ph-sparkle',
        frequency: habitData.frequency || 'Daily',
        targetWeekly: Number(habitData.targetWeekly) || 7,
        reminder: habitData.reminder || '',
        createdAt: new Date().toISOString()
      };

      habits.push(newHabit);
      this.set(KEYS.HABITS, habits);
      this.emit('habits:updated', habits);
      return newHabit;
    },

    deleteHabit(id) {
      let habits = this.getHabits();
      habits = habits.filter(h => h.id !== id);
      this.set(KEYS.HABITS, habits);

      // Clean logs for deleted habit
      const logs = this.getHabitLogs();
      if (logs[id]) {
        delete logs[id];
        this.set(KEYS.HABIT_LOGS, logs);
      }

      this.emit('habits:updated', habits);
      this.emit('habitLogs:updated', logs);
      return true;
    },

    toggleHabitCompletion(habitId, dateStr = this.formatDate()) {
      const logs = this.getHabitLogs();
      if (!logs[habitId]) logs[habitId] = {};

      const currentStatus = !!logs[habitId][dateStr];
      if (currentStatus) {
        delete logs[habitId][dateStr];
      } else {
        logs[habitId][dateStr] = true;
      }

      this.set(KEYS.HABIT_LOGS, logs);
      this.emit('habitLogs:updated', logs);
      return !currentStatus;
    },

    isHabitCompleted(habitId, dateStr = this.formatDate()) {
      const logs = this.getHabitLogs();
      return !!(logs[habitId] && logs[habitId][dateStr]);
    },

    // Calculate streaks for a given habit
    calculateHabitStreak(habitId) {
      const logs = this.getHabitLogs();
      const habitLog = logs[habitId] || {};
      const completedDates = Object.keys(habitLog).filter(d => habitLog[d]).sort();

      if (completedDates.length === 0) {
        return { currentStreak: 0, bestStreak: 0, totalCompletions: 0, completionRate30Days: 0 };
      }

      const dateSet = new Set(completedDates);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check current streak backwards from today or yesterday
      let currentStreak = 0;
      let checkDate = new Date(today);

      const todayStr = this.formatDate(checkDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = this.formatDate(yesterday);

      // If not done today, streak may still be alive if completed yesterday
      if (!dateSet.has(todayStr)) {
        if (dateSet.has(yesterdayStr)) {
          checkDate = yesterday;
        } else {
          checkDate = null;
        }
      }

      if (checkDate) {
        while (true) {
          const formatted = this.formatDate(checkDate);
          if (dateSet.has(formatted)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak across history
      let bestStreak = 0;
      let tempStreak = 0;
      let lastDate = null;

      completedDates.forEach(dateStr => {
        const curDate = new Date(dateStr + 'T00:00:00');
        if (!lastDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        lastDate = curDate;
      });

      // 30 days completion rate
      let countLast30 = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (dateSet.has(this.formatDate(d))) {
          countLast30++;
        }
      }
      const completionRate30Days = Math.round((countLast30 / 30) * 100);

      return {
        currentStreak,
        bestStreak,
        totalCompletions: completedDates.length,
        completionRate30Days
      };
    },

    // -------------------------------------------------------------
    // JOURNAL ENTRIES
    // -------------------------------------------------------------
    getJournals() {
      return this.get(KEYS.JOURNALS, []);
    },

    getJournalById(id) {
      const journals = this.getJournals();
      return journals.find(j => j.id === id) || null;
    },

    saveJournal(entry) {
      const journals = this.getJournals();
      const content = entry.content || '';
      const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;

      if (entry.id) {
        const idx = journals.findIndex(j => j.id === entry.id);
        if (idx >= 0) {
          journals[idx] = {
            ...journals[idx],
            title: entry.title.trim() || 'Untitled Journal',
            content: content,
            date: entry.date || this.formatDate(),
            moodScore: Number(entry.moodScore) || 3,
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            category: entry.category || 'Personal Reflection',
            wordCount: words,
            updatedAt: new Date().toISOString()
          };
          this.set(KEYS.JOURNALS, journals);
          this.emit('journals:updated', journals);
          return journals[idx];
        }
      }

      const newJournal = {
        id: this.uid(),
        title: entry.title ? entry.title.trim() : 'Reflections for ' + (entry.date || this.formatDate()),
        content: content,
        date: entry.date || this.formatDate(),
        moodScore: Number(entry.moodScore) || 3,
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        category: entry.category || 'Personal Reflection',
        wordCount: words,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      journals.unshift(newJournal);
      this.set(KEYS.JOURNALS, journals);
      this.emit('journals:updated', journals);
      return newJournal;
    },

    deleteJournal(id) {
      let journals = this.getJournals();
      journals = journals.filter(j => j.id !== id);
      this.set(KEYS.JOURNALS, journals);
      this.emit('journals:updated', journals);
      return true;
    },

    // -------------------------------------------------------------
    // DAILY CHECK-INS
    // -------------------------------------------------------------
    getCheckins() {
      return this.get(KEYS.CHECKINS, []);
    },

    getCheckinByDate(dateStr) {
      const checkins = this.getCheckins();
      return checkins.find(c => c.date === dateStr) || null;
    },

    saveCheckin(entry) {
      const checkins = this.getCheckins();
      const dateStr = entry.date || this.formatDate();
      const existingIdx = checkins.findIndex(c => c.date === dateStr);

      const checkinRecord = {
        id: existingIdx >= 0 ? checkins[existingIdx].id : this.uid(),
        date: dateStr,
        sleepHours: Number(entry.sleepHours) || 7,
        sleepQuality: Number(entry.sleepQuality) || 3, // 1-5
        waterGlasses: Number(entry.waterGlasses) || 0, // 0-16
        activityMinutes: Number(entry.activityMinutes) || 0, // min
        stressLevel: Number(entry.stressLevel) || 3, // 1-10
        focusHours: Number(entry.focusHours) || 0, // study hrs
        gratitude: entry.gratitude ? entry.gratitude.trim() : '',
        mindfulMoment: entry.mindfulMoment ? entry.mindfulMoment.trim() : '',
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        checkins[existingIdx] = checkinRecord;
      } else {
        checkins.push(checkinRecord);
      }

      checkins.sort((a, b) => b.date.localeCompare(a.date));
      this.set(KEYS.CHECKINS, checkins);
      this.emit('checkins:updated', checkins);
      return checkinRecord;
    },

    // -------------------------------------------------------------
    // WELLNESS GOALS
    // -------------------------------------------------------------
    getGoals() {
      return this.get(KEYS.GOALS, []);
    },

    saveGoal(goalData) {
      const goals = this.getGoals();
      if (goalData.id) {
        const idx = goals.findIndex(g => g.id === goalData.id);
        if (idx >= 0) {
          goals[idx] = {
            ...goals[idx],
            ...goalData,
            updatedAt: new Date().toISOString()
          };
          this.set(KEYS.GOALS, goals);
          this.emit('goals:updated', goals);
          return goals[idx];
        }
      }

      const newGoal = {
        id: this.uid(),
        title: goalData.title.trim(),
        category: goalData.category || 'Mindfulness',
        targetValue: Number(goalData.targetValue) || 1,
        currentValue: Number(goalData.currentValue) || 0,
        unit: goalData.unit || 'times',
        weekOf: goalData.weekOf || this.formatDate(),
        completed: !!goalData.completed,
        notes: goalData.notes ? goalData.notes.trim() : '',
        createdAt: new Date().toISOString()
      };

      goals.push(newGoal);
      this.set(KEYS.GOALS, goals);
      this.emit('goals:updated', goals);
      return newGoal;
    },

    updateGoalProgress(id, delta) {
      const goals = this.getGoals();
      const goal = goals.find(g => g.id === id);
      if (!goal) return null;

      goal.currentValue = Math.max(0, (goal.currentValue || 0) + delta);
      if (goal.currentValue >= goal.targetValue) {
        goal.completed = true;
      } else {
        goal.completed = false;
      }
      goal.updatedAt = new Date().toISOString();

      this.set(KEYS.GOALS, goals);
      this.emit('goals:updated', goals);
      return goal;
    },

    deleteGoal(id) {
      let goals = this.getGoals();
      goals = goals.filter(g => g.id !== id);
      this.set(KEYS.GOALS, goals);
      this.emit('goals:updated', goals);
      return true;
    },

    // -------------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------------
    getSettings() {
      return this.get(KEYS.SETTINGS, {
        theme: 'light',
        calmMode: true,
        affirmations: true
      });
    },

    saveSettings(newSettings) {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      this.set(KEYS.SETTINGS, updated);
      this.emit('settings:updated', updated);
      return updated;
    },

    // -------------------------------------------------------------
    // EXPORT & IMPORT & RESET
    // -------------------------------------------------------------
    exportData() {
      const payload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        application: 'MINDHARBOR - Student Wellness & Habit Tracker',
        privacyNotice: 'All data is stored purely in client-side LocalStorage.',
        data: {
          profile: this.getProfile(),
          moods: this.getMoods(),
          habits: this.getHabits(),
          habitLogs: this.getHabitLogs(),
          journals: this.getJournals(),
          checkins: this.getCheckins(),
          goals: this.getGoals(),
          settings: this.getSettings()
        }
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `mindharbor_backup_${this.formatDate()}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    },

    importData(jsonContent) {
      try {
        const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
        if (!parsed || !parsed.data) {
          throw new Error('Invalid MindHarbor backup file format.');
        }

        const d = parsed.data;
        if (d.profile) this.set(KEYS.PROFILE, d.profile);
        if (Array.isArray(d.moods)) this.set(KEYS.MOODS, d.moods);
        if (Array.isArray(d.habits)) this.set(KEYS.HABITS, d.habits);
        if (d.habitLogs) this.set(KEYS.HABIT_LOGS, d.habitLogs);
        if (Array.isArray(d.journals)) this.set(KEYS.JOURNALS, d.journals);
        if (Array.isArray(d.checkins)) this.set(KEYS.CHECKINS, d.checkins);
        if (Array.isArray(d.goals)) this.set(KEYS.GOALS, d.goals);
        if (d.settings) this.set(KEYS.SETTINGS, d.settings);

        this.emit('storage:imported', true);
        return { success: true };
      } catch (err) {
        console.error('Data import failed:', err);
        return { success: false, error: err.message };
      }
    },

    resetAllData() {
      try {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        this.emit('storage:reset', true);
        return true;
      } catch (e) {
        console.error('Reset failed:', e);
        return false;
      }
    },

    // -------------------------------------------------------------
    // DEMO DATA GENERATOR (Realistic Student Journey)
    // -------------------------------------------------------------
    loadDemoData() {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Profile
      const demoProfile = {
        name: 'Avery Chen',
        university: 'Pacific Coast University',
        major: 'Cognitive Science & Design',
        year: 'Junior (3rd Year)',
        avatar: 'avatar-leaf',
        sleepTarget: 8,
        waterTarget: 8,
        bio: 'Balancing midterms, design studio deadlines, and daily mindfulness.',
        createdAt: new Date(now.getTime() - 25 * 86400000).toISOString()
      };
      this.set(KEYS.PROFILE, demoProfile);

      // Habits
      const demoHabits = [
        {
          id: 'hab_1',
          title: 'Morning Sunlight & Walk',
          category: 'Physical',
          icon: 'ph-sun-dim',
          frequency: 'Daily',
          targetWeekly: 7,
          reminder: '7:30 AM before campus transit',
          createdAt: new Date(now.getTime() - 20 * 86400000).toISOString()
        },
        {
          id: 'hab_2',
          title: '10-Minute Breathwork / Meditation',
          category: 'Mindfulness',
          icon: 'ph-flower-lotus',
          frequency: 'Daily',
          targetWeekly: 6,
          reminder: 'Midday reset between classes',
          createdAt: new Date(now.getTime() - 20 * 86400000).toISOString()
        },
        {
          id: 'hab_3',
          title: 'Drink 8 Glasses of Water',
          category: 'Health',
          icon: 'ph-drop',
          frequency: 'Daily',
          targetWeekly: 7,
          reminder: 'Refill bottle at library fountain',
          createdAt: new Date(now.getTime() - 20 * 86400000).toISOString()
        },
        {
          id: 'hab_4',
          title: 'No Social Media in Bed',
          category: 'Sleep',
          icon: 'ph-moon-stars',
          frequency: 'Daily',
          targetWeekly: 5,
          reminder: 'Phone plugged in across the desk at 10:30 PM',
          createdAt: new Date(now.getTime() - 15 * 86400000).toISOString()
        },
        {
          id: 'hab_5',
          title: 'Review Lecture Notes (Pomodoro)',
          category: 'Academic',
          icon: 'ph-books',
          frequency: 'Daily',
          targetWeekly: 5,
          reminder: '25 min study session daily',
          createdAt: new Date(now.getTime() - 15 * 86400000).toISOString()
        }
      ];
      this.set(KEYS.HABITS, demoHabits);

      // Generate 20 days of realistic habit logs, moods, check-ins
      const habitLogs = {
        hab_1: {},
        hab_2: {},
        hab_3: {},
        hab_4: {},
        hab_5: {}
      };
      const moods = [];
      const checkins = [];

      const moodNarratives = [
        { score: 5, name: 'Thriving', emotions: ['Grateful', 'Focused', 'Energetic'], factors: ['Sleep', 'Academics'], note: 'Finished my design critique with stellar peer feedback. Coffee with Maya afterward felt rejuvenating!' },
        { score: 4, name: 'Good', emotions: ['Calm', 'Productive', 'Rested'], factors: ['Health', 'Social'], note: 'Walked to the botanical garden between lectures. Good energy all afternoon.' },
        { score: 3, name: 'Balanced', emotions: ['Thoughtful', 'Content'], factors: ['Academics', 'Routine'], note: 'Steady Tuesday. Long library session but made solid progress on research paper.' },
        { score: 2, name: 'Low', emotions: ['Fatigued', 'Overwhelmed', 'Anxious'], factors: ['Sleep', 'Academics'], note: 'Slept poorly due to room heating noise. Felt brain fog during stats lecture.' },
        { score: 4, name: 'Good', emotions: ['Motivated', 'Social'], factors: ['Social', 'Personal'], note: 'Study group at campus café was fun and clarifying. Feeling confident for the quiz.' },
        { score: 3, name: 'Balanced', emotions: ['Calm', 'Mellow'], factors: ['Personal'], note: 'Quiet rainy Thursday. Caught up on laundry and listened to ambient lo-fi.' },
        { score: 5, name: 'Thriving', emotions: ['Proud', 'Hopeful', 'Energetic'], factors: ['Health', 'Personal'], note: 'Hit 8 hours of sleep and completed my weekend hike trail. Nature does wonders.' }
      ];

      for (let i = 19; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = this.formatDate(d);

        // Habit completions with realistic patterns
        const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (Math.random() > 0.2) habitLogs.hab_1[dateStr] = true;
        if (Math.random() > 0.28) habitLogs.hab_2[dateStr] = true;
        if (Math.random() > 0.15) habitLogs.hab_3[dateStr] = true;
        if (Math.random() > 0.3) habitLogs.hab_4[dateStr] = true;
        if (!isWeekend && Math.random() > 0.2) habitLogs.hab_5[dateStr] = true;

        // Mood
        const template = moodNarratives[i % moodNarratives.length];
        const variance = (Math.random() > 0.6 ? 1 : 0) * (Math.random() > 0.5 ? 1 : -1);
        let finalScore = Math.max(1, Math.min(5, template.score + variance));

        moods.push({
          id: 'mood_' + dateStr,
          date: dateStr,
          score: finalScore,
          moodName: this.getMoodLabel(finalScore),
          emotions: template.emotions,
          sleepHours: Math.round((6.5 + Math.random() * 2) * 10) / 10,
          energy: Math.max(1, Math.min(5, finalScore)),
          factors: template.factors,
          note: template.note,
          updatedAt: new Date(d.getTime() + 72000000).toISOString()
        });

        // Checkin
        checkins.push({
          id: 'chk_' + dateStr,
          date: dateStr,
          sleepHours: Math.round((6.5 + Math.random() * 2) * 10) / 10,
          sleepQuality: Math.max(2, Math.min(5, Math.round(finalScore + (Math.random() - 0.5)))),
          waterGlasses: Math.floor(5 + Math.random() * 4),
          activityMinutes: Math.floor(20 + Math.random() * 45),
          stressLevel: Math.max(1, Math.min(10, Math.round((6 - finalScore) * 2 + Math.random() * 2))),
          focusHours: isWeekend ? 1.5 : Math.round((3 + Math.random() * 3) * 10) / 10,
          gratitude: i % 2 === 0 ? 'The gentle morning breeze and a hot matcha latte.' : 'Helpful campus peer tutor who explained matrix equations.',
          mindfulMoment: 'Paused at the fountain for 3 deep diaphragmatic breaths.',
          updatedAt: new Date(d.getTime() + 75000000).toISOString()
        });
      }

      this.set(KEYS.HABIT_LOGS, habitLogs);
      this.set(KEYS.MOODS, moods);
      this.set(KEYS.CHECKINS, checkins);

      // Journals
      const demoJournals = [
        {
          id: 'jrn_1',
          title: 'Navigating Mid-Semester Overwhelm & Finding Anchors',
          content: 'Lately my schedule has felt tight with projects, lab reports, and part-time student mentoring. Today I took a deliberate 45-minute pause without my laptop. I sat by the university quad fountain, sketched some tree silhouettes, and reminded myself that grades are a snapshot of learning, not my self-worth. When I returned to my desk, my focus was twice as sharp and my chest felt noticeably lighter.',
          date: this.formatDate(new Date(now.getTime() - 2 * 86400000)),
          moodScore: 4,
          tags: ['Academic Balance', 'Mindfulness', 'Self-Compassion'],
          category: 'Personal Reflection',
          wordCount: 78,
          createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
          updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString()
        },
        {
          id: 'jrn_2',
          title: 'The Surprising Power of Evening Wind-Downs',
          content: 'Started moving my phone to the shelf on the other side of the bedroom at 10 PM. The first two nights were strangely uncomfortable — my hand automatically reached for the bedside table to scroll Reddit or Discord. But last night I read 15 pages of Ursula Le Guin instead. Woke up without that groggy morning dread. It feels like reclaiming stolen hours of peace.',
          date: this.formatDate(new Date(now.getTime() - 5 * 86400000)),
          moodScore: 5,
          tags: ['Sleep Hygiene', 'Digital Detox', 'Habit Experiment'],
          category: 'Habit Discovery',
          wordCount: 76,
          createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
          updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString()
        },
        {
          id: 'jrn_3',
          title: 'Accepting Low Energy Days without Self-Criticism',
          content: 'Rainy Tuesday and my motivation was near zero. In freshman year I would have beaten myself up and forced an 8-hour cram session. Today I honored my body: did 30 minutes of gentle yoga, cooked warm ginger soup, and tackled just one critical assignment. Tomorrow is a new slate.',
          date: this.formatDate(new Date(now.getTime() - 10 * 86400000)),
          moodScore: 3,
          tags: ['Gentle Acceptance', 'Rest', 'Growth'],
          category: 'Emotional Wellness',
          wordCount: 61,
          createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
          updatedAt: new Date(now.getTime() - 10 * 86400000).toISOString()
        }
      ];
      this.set(KEYS.JOURNALS, demoJournals);

      // Goals
      const demoGoals = [
        {
          id: 'goal_1',
          title: 'Consistent 7.5+ Hours Sleep for 5 Nights',
          category: 'Sleep Routine',
          targetValue: 5,
          currentValue: 4,
          unit: 'nights',
          weekOf: this.formatDate(),
          completed: false,
          notes: 'Keep bedroom cool (67°F) and read fiction before turning off light.',
          createdAt: new Date(now.getTime() - 4 * 86400000).toISOString()
        },
        {
          id: 'goal_2',
          title: 'Daily Outdoor Walk / Sunlight Session',
          category: 'Physical Health',
          targetValue: 6,
          currentValue: 6,
          unit: 'days',
          weekOf: this.formatDate(),
          completed: true,
          notes: 'Great for circadian rhythm reset and easing eye strain.',
          createdAt: new Date(now.getTime() - 5 * 86400000).toISOString()
        },
        {
          id: 'goal_3',
          title: 'Mindful Study Breaks (No Phone)',
          category: 'Digital Detox',
          targetValue: 4,
          currentValue: 3,
          unit: 'sessions',
          weekOf: this.formatDate(),
          completed: false,
          notes: 'Step away from screen during 5-minute Pomodoro breaks.',
          createdAt: new Date(now.getTime() - 3 * 86400000).toISOString()
        }
      ];
      this.set(KEYS.GOALS, demoGoals);

      this.set(KEYS.INITIALIZED, true);
      this.emit('storage:imported', true);
      return true;
    }
  };

  window.MindStorage = MindStorage;
})(window);

