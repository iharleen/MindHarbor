# MINDHARBOR — Student Wellness & Habit Tracker

> A serene, private, and client-side wellness sanctuary designed specifically for college and university students to track moods, cultivate healthy habits, reflect in a confidential journal, perform daily check-ins, achieve wellness goals, and visualize emotional patterns.

---

## 🌟 Key Highlights & Philosophy

- **100% Client-Side Privacy**: All journals, mood logs, habit checklists, and wellness records remain stored solely in the user's browser via the `LocalStorage` sandbox. Zero remote servers, zero trackers, zero data leakage.
- **Thoughtful Student Aesthetics**: Calming lavender, sage green, muted teal, and warm off-white color palette with dedicated Dawn Calm (Light) and Night Serenity (Dark) themes.
- **Genuine, Zero-Fabrication Analytics**: Visualizations and consistency metrics are computed strictly from real self-reported records.
- **Zero Paid Dependencies**: Built completely with vanilla HTML5, CSS3, modular JavaScript, Chart.js, Phosphor Icons, and Canvas Confetti.
- **GitHub Pages Ready**: Zero build steps, zero bundlers, all asset paths are relative and statically deployable out of the box.

---

## 📱 Application Sections & Features

### 1. Personalized Dashboard
- **Time-Contextual Greetings**: Dynamic greeting responding to the hour of the day (`Good morning / afternoon / evening, [Name]`).
- **Daily Mindful Affirmation**: Curated student affirmations with an instant shuffle generator.
- **Today's Mood Snapshot**: Real-time status indicator showing today's logged state or a quick prompt to log.
- **Habits Momentum**: Direct checklist for today's habits with instant checkbox toggles and a progress percentage bar.
- **Weekly Goals Snapshot**: Visual progress bars showing progress on active weekly targets.
- **Recent Reflection**: Quick snippet of the latest journal entry with instant reader modal access.
- **Daily Check-In Alert Banner**: Non-intrusive reminder to complete the 60-second daily check-in.

### 2. Daily Mood Tracker
- **Standardized 1–5 Scale**:
  - `5`: ✨ Thriving (Emerald/Sage)
  - `4`: 🌿 Good (Soft Sage)
  - `3`: ⚖️ Balanced (Muted Teal)
  - `2`: 🌧️ Low (Warm Amber)
  - `1`: ⚡ Overwhelmed (Soft Rose)
- **Single Entry per Date**: Selecting an existing date automatically pre-populates the form with an informative banner and switches the action to *Update Entry*.
- **Emotion Tags**: Multi-select pills (`Calm`, `Hopeful`, `Motivated`, `Focused`, `Energetic`, `Grateful`, `Stressed`, `Anxious`, `Lonely`, `Fatigued`, `Overwhelmed`, `Proud`).
- **Influencing Life Factors**: Multi-select pills (`Academics`, `Sleep`, `Physical Health`, `Social & Friends`, `Finances`, `Personal Routine`, `Weather`).
- **Granular Controls**: Sleep duration slider (3–12 hrs) and energy level slider (1–5).
- **Reflections**: Freeform textarea to capture nuances and reflections.

### 3. Mood Calendar & History
- **Interactive Monthly Calendar Grid**: Shows month view with navigation controls (Previous, Next, Today).
- **Visual Mood Badges**: Days with logged moods display color-coded emoji indicators and score ratings.
- **Calendar Day Click**: Opens a comprehensive detail modal showing all logged emotions, factors, and notes with direct *Edit in Form* and *Delete* actions.
- **History Feed**: Filterable by mood score (All, 5, 4, 3, 2, 1) with individual cards, tags, snippets, and action buttons.

### 4. Habit Tracker with Custom Habits & Streaks
- **Custom Habit Creation**: Title, category (`Mind`, `Physical`, `Academic`, `Sleep`, `Health`, `Social`), weekly target days, and custom reminder notes.
- **7-Day Trailing Grid**: Interactive checkboxes for the last 7 days (`Sun` through `Sat`), allowing retroactive completion or easy updates.
- **Real Streak Calculations**:
  - Current streak (consecutive days completed up to today or yesterday).
  - Best streak (longest uninterrupted streak in recorded history).
  - Total completions count.
  - 30-day completion rate percentage.
- **Micro-Interactions**: Celebratory canvas confetti on completion!

### 5. Private Sanctuary Journal
- **Confidentiality Notice**: Prominently informs students that reflections are sandboxed inside browser LocalStorage.
- **Mindful Writing Prompts**: Random generator to unblock students with reflective, gentle questions.
- **Live Search & Category Filtering**: Search across titles, content, and tags in real time.
- **Word Count & Reading Time**: Automatic live word counter in the editor and calculated reading duration in the reader modal.
- **Full-Screen Reader Modal**: Beautiful editorial typography using Newsreader serif font for peaceful reading.

### 6. Daily Wellness Check-In
- **Hydration Tracker**: Interactive stepper with visual cup droplet icons (0 to 16 glasses).
- **Sleep Metrics**: Sleep duration slider and 5-star restfulness rating.
- **Stress Level**: Academic stress rating slider (1–10) with descriptive labels.
- **Deep Study / Focus Hours**: Study time logging to correlate academic load with well-being.
- **Daily Gratitude Prompt**: Dedicated prompt to capture daily positive anchors.
- **Check-In History**: Compact timeline feed of recent daily check-in records.

### 7. Weekly Wellness Goals
- **Target Tracking**: Current progress vs. target value with custom units (e.g. `5 nights`, `4 sessions`, `10 glasses`).
- **Interactive Stepper Buttons**: Quick `+` and `-` buttons to adjust progress directly from the card.
- **Completion State**: Automatically triggers celebratory confetti upon reaching 100%.
- **Filter Tabs**: View `All`, `Active`, or `Completed` goals.

### 8. Interactive Wellness Analytics (Chart.js)
- **Informational Wellness Index**: An informational 0–100 score computed from mood consistency (35%), habit completion rate (35%), and sleep/stress balance (30%).
  > *Medical Disclaimer Notice: This wellness score is an application-generated informational indicator based exclusively on your self-reported logs to help guide personal reflection. It is not a clinical assessment, medical diagnosis, or psychological evaluation.*
- **4 Key Stat Cards**: 14-day average mood, average nightly sleep, average stress level, and active habits count.
- **Mood Trend Trajectory**: Line chart on a strict 1–5 scale with 7-day and 30-day view switches.
- **Habit Consistency Rates**: Horizontal bar chart visualizing 30-day consistency across all active habits.
- **Sleep & Stress Correlation**: Multi-metric spline chart comparing sleep hours against academic stress levels and activity.
- **Emotional States Breakdown**: Doughnut chart presenting the most frequent emotions logged.

### 9. Profile, Privacy & Application Settings
- **Student Profile**: Name, university, major, and academic year.
- **Theme Switcher**: Dawn Calm (Light) and Night Serenity (Dark) modes.
- **Data Export**: Downloads clean, human-readable JSON backup (`mindharbor_backup_YYYY-MM-DD.json`).
- **Data Restore**: Import and restore a previously exported JSON backup file with format validation.
- **Explore with Demo Data**: Pre-populates 20 days of realistic college student history (ideal for testing, previews, and exploration).
- **Confirmed Full Reset**: Double-confirmation dialog to safely wipe data when desired.
- **Student Mental Health Resources**: Instant directory tailored for Indian students featuring the Government of India's **Tele-MANAS** (14416 / 1800-891-4416, 24/7 free support, https://telemanas.mohfw.gov.in/), **KIRAN** (1800-599-0019), Vandrevala Foundation, and NIMHANS, alongside clearly segregated US-only resources (988 Lifeline and Crisis Text Line).

---

## 📂 Project Architecture

```
MindHarbor/
├── index.html          # Semantic HTML shell, accessibility labels, views & modals
├── css/
│   └── style.css       # Complete design system, responsive grids, variables & themes
├── js/
│   ├── storage.js      # LocalStorage layer, pub-sub event bus, import/export, demo data
│   ├── mood.js         # Daily mood logging, calendar grid & history feed
│   ├── habits.js       # Habit routines, 7-day grid, streak algorithms & summary stats
│   ├── journal.js      # Private journal CRUD, search, word counts, prompts & reader
│   ├── goals.js        # Weekly wellness goals, steppers, and progress bars
│   ├── charts.js       # Chart.js instances, analytics, and wellness score index
│   └── app.js          # SPA navigation router, modals, toasts, check-in & dashboard
└── README.md           # Documentation, user guide & engineering summary
```

---

## 🚀 Running the Project Locally

Because MindHarbor uses standard web technologies without server-side dependencies:

1. Clone or open the repository folder in your favorite editor.
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
3. Alternatively, serve via a local development server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node npx
   npx serve .
   ```
4. Visit `http://localhost:8000` in your browser.

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In your repository settings, navigate to **Pages** (under Code and automation).
3. Set the source to **Deploy from a branch**.
4. Select `main` (or `master`) and folder `/ (root)`.
5. Click **Save**. Within moments, your MindHarbor sanctuary will be live on GitHub Pages!

---

## 🔒 Privacy & Data Guarantee

- **No Remote Telemetry**: No third-party analytics trackers, cookies, or tracking pixels are included.
- **Storage Scope**: All data is stored in the browser's origin-scoped `localStorage`.
- **Local Control**: You can backup or clear your data at any time from the **Profile & Settings** view.

