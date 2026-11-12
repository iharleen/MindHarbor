/**
 * MINDHARBOR - Private Journal Module
 * Handles confidential local reflections, rich metadata, live search, tagging, and prompts.
 */

(function (window) {
  'use strict';

  const JournalModule = {
    searchQuery: '',
    selectedCategory: 'all',
    selectedTag: 'all',

    prompts: [
      'What is one small thing that brought you comfort or made you smile today?',
      'If you could release one pressure or academic expectation right now, what would it be?',
      'How did your mind and body communicate with you today? Did you listen to them?',
      'Write about a challenge you overcame recently, no matter how minor it seemed.',
      'What is something you appreciate about your college experience so far?',
      'Describe a moment today when you felt completely present and at peace.',
      'What boundary can you set this week to protect your mental energy and rest?',
      'What is one encouraging sentence you wish someone would tell you right now?'
    ],

    init() {
      this.bindEvents();
      this.renderJournals();
      this.renderPrompt();

      MindStorage.on('journals:updated', () => {
        this.renderJournals();
      });
      MindStorage.on('storage:imported', () => {
        this.renderJournals();
      });
      MindStorage.on('storage:reset', () => {
        this.renderJournals();
      });
    },

    bindEvents() {
      // New Entry Button
      const newBtn = document.getElementById('btn-new-journal');
      if (newBtn) {
        newBtn.addEventListener('click', () => {
          this.openEditorModal();
        });
      }

      // Prompt Refresh Button
      const promptBtn = document.getElementById('btn-refresh-prompt');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => {
          this.renderPrompt();
        });
      }

      // Use Prompt in Editor Button
      const usePromptBtn = document.getElementById('btn-use-prompt');
      if (usePromptBtn) {
        usePromptBtn.addEventListener('click', () => {
          const promptText = document.getElementById('journal-prompt-text')?.textContent || '';
          this.openEditorModal({
            title: 'Reflection: ' + promptText.substring(0, 35) + '...',
            content: `Prompt: ${promptText}\n\n`
          });
        });
      }

      // Live Search Input
      const searchInput = document.getElementById('journal-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.renderJournals();
        });
      }

      // Category Filter Select
      const catSelect = document.getElementById('journal-category-filter');
      if (catSelect) {
        catSelect.addEventListener('change', (e) => {
          this.selectedCategory = e.target.value;
          this.renderJournals();
        });
      }

      // Journal Form Submit
      const form = document.getElementById('journal-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleJournalSubmit();
        });
      }

      // Word count live tracking in editor
      const contentArea = document.getElementById('journal-content-input');
      const wordCountBadge = document.getElementById('journal-word-count-badge');
      if (contentArea && wordCountBadge) {
        contentArea.addEventListener('input', () => {
          const text = contentArea.value.trim();
          const words = text ? text.split(/\s+/).length : 0;
          wordCountBadge.textContent = `${words} words`;
        });
      }
    },

    renderPrompt() {
      const promptEl = document.getElementById('journal-prompt-text');
      if (!promptEl) return;
      const randIdx = Math.floor(Math.random() * this.prompts.length);
      promptEl.textContent = this.prompts[randIdx];
    },

    openEditorModal(initialData = null) {
      const modal = document.getElementById('journal-editor-modal');
      const form = document.getElementById('journal-form');
      const modalTitle = document.getElementById('journal-modal-title');
      const idInput = document.getElementById('journal-id-input');
      const titleInput = document.getElementById('journal-title-input');
      const contentInput = document.getElementById('journal-content-input');
      const dateInput = document.getElementById('journal-date-input');
      const catSelect = document.getElementById('journal-category-select');
      const moodSelect = document.getElementById('journal-mood-select');
      const tagsInput = document.getElementById('journal-tags-input');
      const wordCountBadge = document.getElementById('journal-word-count-badge');

      if (!modal || !form) return;

      if (initialData && initialData.id) {
        // Editing existing
        if (modalTitle) modalTitle.textContent = 'Edit Journal Entry';
        if (idInput) idInput.value = initialData.id;
        if (titleInput) titleInput.value = initialData.title || '';
        if (contentInput) contentInput.value = initialData.content || '';
        if (dateInput) dateInput.value = initialData.date || MindStorage.formatDate();
        if (catSelect) catSelect.value = initialData.category || 'Personal Reflection';
        if (moodSelect) moodSelect.value = initialData.moodScore || 3;
        if (tagsInput) tagsInput.value = (initialData.tags || []).join(', ');
        if (wordCountBadge) {
          const words = initialData.content ? initialData.content.trim().split(/\s+/).length : 0;
          wordCountBadge.textContent = `${words} words`;
        }
      } else {
        // New entry
        if (modalTitle) modalTitle.textContent = 'Write Private Reflection';
        form.reset();
        if (idInput) idInput.value = '';
        if (dateInput) dateInput.value = MindStorage.formatDate();
        if (initialData) {
          if (titleInput && initialData.title) titleInput.value = initialData.title;
          if (contentInput && initialData.content) contentInput.value = initialData.content;
        }
        if (wordCountBadge) wordCountBadge.textContent = '0 words';
      }

      window.App.openModal('journal-editor-modal');
    },

    handleJournalSubmit() {
      const idInput = document.getElementById('journal-id-input');
      const titleInput = document.getElementById('journal-title-input');
      const contentInput = document.getElementById('journal-content-input');
      const dateInput = document.getElementById('journal-date-input');
      const catSelect = document.getElementById('journal-category-select');
      const moodSelect = document.getElementById('journal-mood-select');
      const tagsInput = document.getElementById('journal-tags-input');

      const content = contentInput ? contentInput.value.trim() : '';
      if (!content) {
        window.App.showToast('Please write your reflection before saving.', 'warning');
        return;
      }

      const rawTags = tagsInput ? tagsInput.value : '';
      const tags = rawTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const entry = {
        id: idInput && idInput.value ? idInput.value : undefined,
        title: titleInput && titleInput.value ? titleInput.value.trim() : 'Reflection',
        content: content,
        date: dateInput && dateInput.value ? dateInput.value : MindStorage.formatDate(),
        category: catSelect ? catSelect.value : 'Personal Reflection',
        moodScore: moodSelect ? parseInt(moodSelect.value, 10) : 3,
        tags: tags
      };

      MindStorage.saveJournal(entry);
      window.App.closeModal('journal-editor-modal');
      window.App.showToast(entry.id ? 'Journal entry updated!' : 'Reflection saved to private journal.', 'success');
    },

    openReaderModal(entry) {
      const modal = document.getElementById('journal-reader-modal');
      if (!modal) return;

      const bodyEl = modal.querySelector('.modal-content-body');
      if (!bodyEl) return;

      const moodMeta = window.MoodModule?.moodMeta[entry.moodScore] || { name: 'Balanced', emoji: '⚖️', color: '#3D7B80' };
      const tagsHtml = (entry.tags || []).map(t => `<span class="pill-badge">${escapeHtml(t)}</span>`).join(' ');
      const words = entry.wordCount || (entry.content ? entry.content.trim().split(/\s+/).length : 0);
      const readMins = Math.max(1, Math.ceil(words / 180));

      bodyEl.innerHTML = `
        <div class="journal-reader-header">
          <div class="journal-reader-meta-line">
            <span class="badge-pill cat-badge">${escapeHtml(entry.category || 'Reflection')}</span>
            <span class="journal-reader-date"><i class="ph ph-calendar"></i> ${entry.date}</span>
            <span class="journal-reader-stats"><i class="ph ph-clock"></i> ${readMins} min read &bull; ${words} words</span>
          </div>
          <h2 class="journal-reader-title">${escapeHtml(entry.title)}</h2>
          <div class="journal-reader-mood-pill" style="color: ${moodMeta.color}">
            <span>${moodMeta.emoji} Mood at writing: ${moodMeta.name} (${entry.moodScore}/5)</span>
          </div>
        </div>

        <div class="journal-reader-content">
          ${escapeHtml(entry.content).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
        </div>

        ${tagsHtml ? `
          <div class="journal-reader-tags">
            <strong>Tags:</strong> ${tagsHtml}
          </div>
        ` : ''}

        <div class="modal-actions-footer">
          <button type="button" class="btn btn-outline" id="reader-edit-btn"><i class="ph ph-pencil"></i> Edit Entry</button>
          <button type="button" class="btn btn-danger-outline" id="reader-delete-btn"><i class="ph ph-trash"></i> Delete Entry</button>
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
        </div>
      `;

      // Handlers
      bodyEl.querySelector('#reader-edit-btn')?.addEventListener('click', () => {
        window.App.closeModal('journal-reader-modal');
        this.openEditorModal(entry);
      });

      bodyEl.querySelector('#reader-delete-btn')?.addEventListener('click', () => {
        if (confirm(`Permanently delete "${entry.title}"?`)) {
          MindStorage.deleteJournal(entry.id);
          window.App.closeModal('journal-reader-modal');
          window.App.showToast('Journal entry deleted.', 'info');
        }
      });

      bodyEl.querySelector('.modal-close-btn')?.addEventListener('click', () => {
        window.App.closeModal('journal-reader-modal');
      });

      window.App.openModal('journal-reader-modal');
    },

    renderJournals() {
      const container = document.getElementById('journal-entries-container');
      const countEl = document.getElementById('journal-count-badge');
      if (!container) return;

      let journals = MindStorage.getJournals();

      // Filter by category
      if (this.selectedCategory !== 'all') {
        journals = journals.filter(j => j.category === this.selectedCategory);
      }

      // Filter by search query
      if (this.searchQuery) {
        journals = journals.filter(j => {
          const matchTitle = (j.title || '').toLowerCase().includes(this.searchQuery);
          const matchContent = (j.content || '').toLowerCase().includes(this.searchQuery);
          const matchTags = (j.tags || []).some(t => t.toLowerCase().includes(this.searchQuery));
          return matchTitle || matchContent || matchTags;
        });
      }

      if (countEl) countEl.textContent = `${journals.length} ${journals.length === 1 ? 'entry' : 'entries'}`;

      if (journals.length === 0) {
        container.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-icon-circle"><i class="ph ph-book-open"></i></div>
            <h4>${this.searchQuery ? 'No reflections match your search' : 'Your private journal is clear and calm'}</h4>
            <p class="text-muted">${this.searchQuery ? 'Try clearing your search keyword or selecting a different category.' : 'Pour your thoughts, decompress from college deadlines, and celebrate micro-wins.'}</p>
            ${!this.searchQuery ? `<button class="btn btn-primary" onclick="JournalModule.openEditorModal()"><i class="ph ph-pencil-simple"></i> Write Your First Entry</button>` : ''}
          </div>
        `;
        return;
      }

      let html = '';
      journals.forEach(entry => {
        const moodMeta = window.MoodModule?.moodMeta[entry.moodScore] || { name: 'Balanced', emoji: '⚖️', color: '#3D7B80', bg: '#E4F2F3' };
        const preview = entry.content.length > 160 ? entry.content.substring(0, 160) + '...' : entry.content;
        const tagsHtml = (entry.tags || []).slice(0, 3).map(t => `<span class="pill-mini">${escapeHtml(t)}</span>`).join('');
        const words = entry.wordCount || entry.content.split(/\s+/).length;

        html += `
          <div class="journal-card" data-id="${entry.id}">
            <div class="journal-card-top">
              <div class="journal-card-meta">
                <span class="badge-pill cat-badge">${escapeHtml(entry.category || 'Reflection')}</span>
                <span class="journal-card-date">${entry.date}</span>
              </div>
              <div class="journal-card-mood" style="background: ${moodMeta.bg}; color: ${moodMeta.color}" title="Logged mood: ${moodMeta.name}">
                <span>${moodMeta.emoji}</span>
              </div>
            </div>

            <h4 class="journal-card-title">${escapeHtml(entry.title)}</h4>
            <p class="journal-card-snippet">${escapeHtml(preview)}</p>

            <div class="journal-card-tags">
              ${tagsHtml}
            </div>

            <div class="journal-card-footer">
              <span class="journal-word-stat">${words} words</span>
              <div class="journal-card-btns">
                <button type="button" class="btn-icon read-journal-btn" data-id="${entry.id}" title="Read full entry">
                  <i class="ph ph-book-open"></i>
                </button>
                <button type="button" class="btn-icon edit-journal-btn" data-id="${entry.id}" title="Edit entry">
                  <i class="ph ph-pencil-simple"></i>
                </button>
                <button type="button" class="btn-icon delete-journal-btn" data-id="${entry.id}" title="Delete entry">
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Event handlers
      container.querySelectorAll('.read-journal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const entry = MindStorage.getJournalById(btn.dataset.id);
          if (entry) this.openReaderModal(entry);
        });
      });

      container.querySelectorAll('.edit-journal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const entry = MindStorage.getJournalById(btn.dataset.id);
          if (entry) this.openEditorModal(entry);
        });
      });

      container.querySelectorAll('.delete-journal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const entry = MindStorage.getJournalById(btn.dataset.id);
          if (entry && confirm(`Are you sure you want to delete "${entry.title}"?`)) {
            MindStorage.deleteJournal(entry.id);
            window.App.showToast('Journal entry removed.', 'info');
          }
        });
      });

      // Clicking entire card opens reader
      container.querySelectorAll('.journal-card').forEach(card => {
        card.addEventListener('click', () => {
          const entry = MindStorage.getJournalById(card.dataset.id);
          if (entry) this.openReaderModal(entry);
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

  window.JournalModule = JournalModule;
})(window);

