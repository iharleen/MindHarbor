/**
 * MINDHARBOR - Interactive Wellness Analytics & Chart.js Module
 * Builds responsive, aesthetically tuned charts for mood trends, habit consistency,
 * metric correlations, emotion breakdowns, and an informational wellness indicator.
 */

(function (window) {
  'use strict';

  let moodTrendChart = null;
  let habitBarChart = null;
  let metricCorrChart = null;
  let emotionsDoughnutChart = null;

  const AnalyticsModule = {
    moodTrendRange: 30, // 7 or 30 days

    palette: {
      lavender: '#8B7BB5',
      lavenderLight: 'rgba(139, 123, 181, 0.15)',
      sage: '#5E8C71',
      sageLight: 'rgba(94, 140, 113, 0.15)',
      teal: '#3D7B80',
      tealLight: 'rgba(61, 123, 128, 0.15)',
      amber: '#D99863',
      rose: '#C86D74',
      gridColor: 'rgba(100, 116, 139, 0.12)',
      textColor: '#64748B'
    },

    init() {
      this.bindEvents();
      this.refreshAll();

      MindStorage.on('moods:updated', () => this.refreshAll());
      MindStorage.on('habitLogs:updated', () => this.refreshAll());
      MindStorage.on('checkins:updated', () => this.refreshAll());
      MindStorage.on('goals:updated', () => this.refreshAll());
      MindStorage.on('storage:imported', () => this.refreshAll());
      MindStorage.on('storage:reset', () => this.refreshAll());
    },

    bindEvents() {
      const range7Btn = document.getElementById('analytics-range-7');
      const range30Btn = document.getElementById('analytics-range-30');

      if (range7Btn && range30Btn) {
        range7Btn.addEventListener('click', () => {
          range7Btn.classList.add('active');
          range30Btn.classList.remove('active');
          this.moodTrendRange = 7;
          this.renderMoodTrendChart();
        });

        range30Btn.addEventListener('click', () => {
          range30Btn.classList.add('active');
          range7Btn.classList.remove('active');
          this.moodTrendRange = 30;
          this.renderMoodTrendChart();
        });
      }
    },

    refreshAll() {
      this.calculateWellnessScore();
      this.renderMoodTrendChart();
      this.renderHabitConsistencyChart();
      this.renderMetricCorrelationChart();
      this.renderEmotionsDoughnutChart();
      this.renderKeyMetricsOverview();
    },

    // -------------------------------------------------------------
    // CALCULATE WELLNESS INDEX SCORE (Informational Indicator)
    // -------------------------------------------------------------
    calculateWellnessScore() {
      const moods = MindStorage.getMoods();
      const habits = MindStorage.getHabits();
      const checkins = MindStorage.getCheckins();

      const scoreNumberEl = document.getElementById('wellness-score-num');
      const scoreBadgeEl = document.getElementById('wellness-score-badge');
      const scoreProgressEl = document.getElementById('wellness-score-circle-bar');
      const scoreDescEl = document.getElementById('wellness-score-desc');

      if (!scoreNumberEl) return;

      if (moods.length === 0 && habits.length === 0 && checkins.length === 0) {
        scoreNumberEl.textContent = '--';
        if (scoreBadgeEl) scoreBadgeEl.textContent = 'Awaiting Entries';
        if (scoreDescEl) scoreDescEl.textContent = 'Log your first mood, habit, or check-in to generate your informational wellness index.';
        if (scoreProgressEl) scoreProgressEl.style.strokeDashoffset = '283';
        return;
      }

      // 1. Mood Component (35%): average of last 14 days
      let moodComponent = 60; // baseline
      if (moods.length > 0) {
        const recentMoods = moods.slice(0, 14);
        const avgMoodScore = recentMoods.reduce((acc, m) => acc + (m.score || 3), 0) / recentMoods.length;
        moodComponent = (avgMoodScore / 5) * 100;
      }

      // 2. Habit Component (35%): 30-day average completion rate
      let habitComponent = 50;
      if (habits.length > 0) {
        let totalRates = 0;
        habits.forEach(h => {
          const streak = MindStorage.calculateHabitStreak(h.id);
          totalRates += streak.completionRate30Days;
        });
        habitComponent = totalRates / habits.length;
      }

      // 3. Sleep & Check-in Balance Component (30%)
      let balanceComponent = 70;
      if (checkins.length > 0) {
        const recentCheckins = checkins.slice(0, 14);
        let sleepPoints = 0;
        let stressPoints = 0;
        recentCheckins.forEach(c => {
          // Sleep ideal is 7-9 hours
          const sleep = c.sleepHours || 7;
          if (sleep >= 7 && sleep <= 9) sleepPoints += 100;
          else if (sleep >= 6) sleepPoints += 75;
          else sleepPoints += 50;

          // Stress (1-10, lower is better)
          const stress = c.stressLevel || 5;
          stressPoints += Math.max(10, (11 - stress) * 10);
        });
        balanceComponent = ((sleepPoints / recentCheckins.length) + (stressPoints / recentCheckins.length)) / 2;
      }

      // Weighted Total
      const compositeScore = Math.round(
        (moodComponent * 0.35) +
        (habitComponent * 0.35) +
        (balanceComponent * 0.30)
      );

      const finalScore = Math.min(100, Math.max(1, compositeScore));
      scoreNumberEl.textContent = finalScore;

      // Update SVG ring (2 * PI * r = 2 * 3.14159 * 45 ≈ 283)
      if (scoreProgressEl) {
        const circumference = 283;
        const offset = circumference - (finalScore / 100) * circumference;
        scoreProgressEl.style.strokeDashoffset = offset;
      }

      // Description & Badge
      let badgeText = 'Balanced';
      let badgeColor = '#3D7B80';
      let descText = 'Your habits and self-reported wellness logs reflect steady, mindful consistency.';

      if (finalScore >= 80) {
        badgeText = 'Thriving State';
        badgeColor = '#5E8C71';
        descText = 'Excellent momentum. Your sleep, self-care routines, and mood logs are in healthy harmony.';
      } else if (finalScore >= 65) {
        badgeText = 'Good Balance';
        badgeColor = '#7BA68D';
        descText = 'Solid routine. Keep prioritizing restorative rest and taking mindful study breaks.';
      } else if (finalScore < 50) {
        badgeText = 'Nurture Needed';
        badgeColor = '#D99863';
        descText = 'College pressures may be accumulating. Be gentle with yourself; prioritize sleep and mini-breaks today.';
      }

      if (scoreBadgeEl) {
        scoreBadgeEl.textContent = badgeText;
        scoreBadgeEl.style.backgroundColor = badgeColor + '20';
        scoreBadgeEl.style.color = badgeColor;
      }
      if (scoreDescEl) {
        scoreDescEl.textContent = descText;
      }
    },

    // -------------------------------------------------------------
    // KEY METRICS OVERVIEW CARDS
    // -------------------------------------------------------------
    renderKeyMetricsOverview() {
      const moods = MindStorage.getMoods();
      const checkins = MindStorage.getCheckins();
      const habits = MindStorage.getHabits();

      const avgMoodEl = document.getElementById('stat-avg-mood');
      const avgSleepEl = document.getElementById('stat-avg-sleep');
      const avgStressEl = document.getElementById('stat-avg-stress');
      const habitStreakEl = document.getElementById('stat-active-habits');

      if (!avgMoodEl) return;

      // Avg Mood (14 days)
      if (moods.length > 0) {
        const recent = moods.slice(0, 14);
        const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
        avgMoodEl.textContent = `${avg.toFixed(1)} / 5.0`;
      } else {
        avgMoodEl.textContent = '--';
      }

      // Avg Sleep (14 days from checkins or moods)
      const sleepData = checkins.length > 0 ? checkins : moods;
      if (sleepData.length > 0) {
        const recent = sleepData.slice(0, 14);
        const avgSleep = recent.reduce((a, b) => a + (b.sleepHours || 7), 0) / recent.length;
        avgSleepEl.textContent = `${avgSleep.toFixed(1)} hrs`;
      } else {
        avgSleepEl.textContent = '--';
      }

      // Avg Stress (Checkins 1-10)
      if (checkins.length > 0) {
        const recent = checkins.slice(0, 14);
        const avgStress = recent.reduce((a, b) => a + (b.stressLevel || 5), 0) / recent.length;
        avgStressEl.textContent = `${avgStress.toFixed(1)} / 10`;
      } else {
        avgStressEl.textContent = '--';
      }

      // Active Habits count
      if (habitStreakEl) {
        habitStreakEl.textContent = `${habits.length} habits`;
      }
    },

    // -------------------------------------------------------------
    // 1. MOOD TREND CHART (Line chart 1-5 scale)
    // -------------------------------------------------------------
    renderMoodTrendChart() {
      const canvas = document.getElementById('chart-mood-trend');
      if (!canvas || typeof Chart === 'undefined') return;

      const moods = MindStorage.getMoods();
      const daysCount = this.moodTrendRange;

      // Build continuous date labels for last N days up to today
      const labels = [];
      const dataPoints = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const moodMap = {};
      moods.forEach(m => {
        moodMap[m.date] = m;
      });

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = MindStorage.formatDate(d);
        const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        labels.push(shortLabel);
        if (moodMap[dateStr]) {
          dataPoints.push(moodMap[dateStr].score);
        } else {
          dataPoints.push(null); // allow gap or spanGaps
        }
      }

      if (moodTrendChart) moodTrendChart.destroy();

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(139, 123, 181, 0.4)');
      gradient.addColorStop(1, 'rgba(139, 123, 181, 0.02)');

      moodTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Mood Level (1 to 5)',
            data: dataPoints,
            borderColor: this.palette.lavender,
            borderWidth: 2.8,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            spanGaps: true,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: this.palette.lavender,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const score = context.parsed.y;
                  if (!score) return 'No entry logged';
                  const label = MindStorage.getMoodLabel(score);
                  return `Mood: ${score} - ${label}`;
                }
              }
            }
          },
          scales: {
            y: {
              min: 1,
              max: 5,
              ticks: {
                stepSize: 1,
                callback: function (val) {
                  switch (val) {
                    case 5: return '5 · Thriving';
                    case 4: return '4 · Good';
                    case 3: return '3 · Balanced';
                    case 2: return '2 · Low';
                    case 1: return '1 · Overwhelmed';
                    default: return val;
                  }
                },
                color: this.palette.textColor,
                font: { size: 11 }
              },
              grid: { color: this.palette.gridColor }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: this.palette.textColor,
                font: { size: 11 },
                maxTicksLimit: daysCount === 30 ? 10 : 7
              }
            }
          }
        }
      });
    },

    // -------------------------------------------------------------
    // 2. HABIT CONSISTENCY CHART (Horizontal bar chart)
    // -------------------------------------------------------------
    renderHabitConsistencyChart() {
      const canvas = document.getElementById('chart-habit-consistency');
      if (!canvas || typeof Chart === 'undefined') return;

      const habits = MindStorage.getHabits();
      if (habits.length === 0) {
        if (habitBarChart) habitBarChart.destroy();
        return;
      }

      const habitLabels = [];
      const completionRates = [];
      const backgroundColors = [
        '#8B7BB5', '#5E8C71', '#3D7B80', '#D99863', '#7BA68D', '#9381B8'
      ];

      habits.forEach((h, idx) => {
        habitLabels.push(h.title.length > 20 ? h.title.substring(0, 18) + '...' : h.title);
        const streak = MindStorage.calculateHabitStreak(h.id);
        completionRates.push(streak.completionRate30Days);
      });

      if (habitBarChart) habitBarChart.destroy();

      const ctx = canvas.getContext('2d');
      habitBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: habitLabels,
          datasets: [{
            label: '30-Day Completion Rate (%)',
            data: completionRates,
            backgroundColor: habits.map((_, i) => backgroundColors[i % backgroundColors.length]),
            borderRadius: 6,
            barThickness: 16
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return `Consistency: ${ctx.parsed.x}%`;
                }
              }
            }
          },
          scales: {
            x: {
              min: 0,
              max: 100,
              ticks: {
                callback: v => `${v}%`,
                color: this.palette.textColor
              },
              grid: { color: this.palette.gridColor }
            },
            y: {
              grid: { display: false },
              ticks: { color: this.palette.textColor, font: { size: 12 } }
            }
          }
        }
      });
    },

    // -------------------------------------------------------------
    // 3. DAILY CHECK-IN METRICS CORRELATION (Sleep vs Stress vs Energy)
    // -------------------------------------------------------------
    renderMetricCorrelationChart() {
      const canvas = document.getElementById('chart-metrics-correlation');
      if (!canvas || typeof Chart === 'undefined') return;

      const checkins = MindStorage.getCheckins().slice(0, 14).reverse();
      if (checkins.length === 0) {
        if (metricCorrChart) metricCorrChart.destroy();
        return;
      }

      const labels = checkins.map(c => {
        const d = new Date(c.date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      });

      const sleepHours = checkins.map(c => c.sleepHours || 7);
      const stressScores = checkins.map(c => c.stressLevel || 5);
      const activityMins = checkins.map(c => Math.round((c.activityMinutes || 0) / 10)); // scaled 0-10

      if (metricCorrChart) metricCorrChart.destroy();

      const ctx = canvas.getContext('2d');
      metricCorrChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Sleep (Hours)',
              data: sleepHours,
              borderColor: this.palette.sage,
              backgroundColor: this.palette.sageLight,
              borderWidth: 2.2,
              tension: 0.3,
              pointRadius: 3
            },
            {
              label: 'Stress Level (1-10)',
              data: stressScores,
              borderColor: this.palette.rose,
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.3,
              pointRadius: 3
            },
            {
              label: 'Activity (x10 min)',
              data: activityMins,
              borderColor: this.palette.teal,
              backgroundColor: 'transparent',
              borderWidth: 1.8,
              tension: 0.3,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                color: this.palette.textColor,
                font: { size: 11 }
              }
            }
          },
          scales: {
            y: {
              min: 0,
              max: 12,
              ticks: { stepSize: 2, color: this.palette.textColor },
              grid: { color: this.palette.gridColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: this.palette.textColor }
            }
          }
        }
      });
    },

    // -------------------------------------------------------------
    // 4. EMOTIONAL STATES BREAKDOWN (Doughnut Chart)
    // -------------------------------------------------------------
    renderEmotionsDoughnutChart() {
      const canvas = document.getElementById('chart-emotions-breakdown');
      if (!canvas || typeof Chart === 'undefined') return;

      const moods = MindStorage.getMoods();
      const emotionCounts = {};

      moods.forEach(m => {
        if (Array.isArray(m.emotions)) {
          m.emotions.forEach(e => {
            emotionCounts[e] = (emotionCounts[e] || 0) + 1;
          });
        }
      });

      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      if (sortedEmotions.length === 0) {
        if (emotionsDoughnutChart) emotionsDoughnutChart.destroy();
        return;
      }

      const labels = sortedEmotions.map(pair => pair[0]);
      const data = sortedEmotions.map(pair => pair[1]);

      const colors = [
        '#8B7BB5', '#5E8C71', '#3D7B80', '#D99863', '#7BA68D', '#C86D74'
      ];

      if (emotionsDoughnutChart) emotionsDoughnutChart.destroy();

      const ctx = canvas.getContext('2d');
      emotionsDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                color: this.palette.textColor,
                font: { size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  };

  window.AnalyticsModule = AnalyticsModule;
})(window);

