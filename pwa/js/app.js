// ── State ─────────────────────────────────────────────────
const state = {
  screen: 'native-lang-select',
  uiLang: 'pt-PT',   // learner's native / interface language
  language: null,    // target language being learned
  level: null,       // selected proficiency level id
  lessonIndex: 0,
  exerciseIndex: 0,
  score: 0,
  scored: [],        // tracks which exercise indices have been scored
  usedAnswers: [],   // tracks word-match answers used so far in the lesson
  answered: false,
  isCorrect: null,
  correctAnswer: null,
};

// ── Boot ──────────────────────────────────────────────────
(function init() {
  const saved = localStorage.getItem('lingua_ui_lang');
  if (saved && I18N[saved]) {
    state.uiLang = saved;
    state.screen = 'language-select';
  }
  render();
})();

// ── Navigation ────────────────────────────────────────────
function navigate(screen, patch = {}) {
  stopRecognition();
  Object.assign(state, {
    screen,
    answered: false,
    isCorrect: null,
    correctAnswer: null,
  }, patch);
  render();
}

// ── Render ────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch (state.screen) {
    case 'native-lang-select': app.innerHTML = renderNativeLangSelect(); break;
    case 'language-select':    app.innerHTML = renderLanguageSelect();    break;
    case 'section-select':     app.innerHTML = renderSectionSelect();     break;
    case 'level-select':       app.innerHTML = renderLevelSelect();       break;
    case 'lesson-list':        app.innerHTML = renderLessonList();        break;
    case 'lesson':             app.innerHTML = renderLesson();            break;
    case 'complete':           app.innerHTML = renderComplete();          break;
    case 'resources':          app.innerHTML = renderResources();         break;
  }
  attachListeners();
}

// ── Native Language Select (first launch) ─────────────────
function renderNativeLangSelect() {
  return `
    <div class="screen native-lang-screen">
      <div class="native-lang-logo">💬</div>
      <div>
        <h1 class="native-lang-title">
          Qual é a sua língua nativa?<br>
          <span>Apa bahasa asli Anda?</span>
        </h1>
      </div>
      <div class="native-lang-options">
        <button class="native-lang-btn" data-ui-lang="pt-PT">
          <span class="nlb-flag">🇵🇹</span>
          <span>Português</span>
        </button>
        <button class="native-lang-btn" data-ui-lang="id-ID">
          <span class="nlb-flag">🇮🇩</span>
          <span>Bahasa Indonesia</span>
        </button>
      </div>
    </div>
  `;
}

// ── Target Language Select ────────────────────────────────
function renderLanguageSelect() {
  const cards = LANGUAGES.map(lang => `
    <div class="lang-card" data-lang="${lang.id}">
      <span class="lang-flag">${lang.flag}</span>
      <div class="lang-info">
        <strong>${esc(langName(lang.id))}</strong>
      </div>
      <span class="lang-chevron">›</span>
    </div>
  `).join('');

  return `
    <div class="screen">
      <div class="lang-header">
        <div class="lang-header-top">
          <button class="btn-settings" id="btn-settings" title="Settings">⚙️</button>
        </div>
        <h1>${esc(t('whatToLearn'))}</h1>
        <p>${esc(t('chooseLang'))}</p>
      </div>
      <div class="lang-list">${cards}</div>
    </div>
  `;
}

// ── Section Select ────────────────────────────────────────
function renderSectionSelect() {
  const lang = state.language;
  return `
    <div class="screen">
      <div class="list-header">
        <button class="btn-back" data-nav="language-select">‹</button>
        <h2>${lang.flag} ${esc(langName(lang.id))}</h2>
      </div>
      <div class="section-list">
        <div class="section-card" data-section="courses">
          <span class="section-icon">🎓</span>
          <div class="section-info">
            <strong>${esc(t('courses'))}</strong>
            <span>${esc(t('coursesSub'))}</span>
          </div>
          <span class="lang-chevron">›</span>
        </div>
        <div class="section-card" data-section="resources">
          <span class="section-icon">📚</span>
          <div class="section-info">
            <strong>${esc(t('resources'))}</strong>
            <span>${esc(t('resourcesSub'))}</span>
          </div>
          <span class="lang-chevron">›</span>
        </div>
      </div>
    </div>
  `;
}

// ── Level Select ──────────────────────────────────────────
function renderLevelSelect() {
  const lang   = state.language;
  const levels = LEVELS[lang.id] || [];
  const rows = levels.map(lv => {
    const count = (LESSONS[lang.id][lv.id] || []).length;
    const sub   = count > 0
      ? `${lv.cefr} · ${count} ${t('lessonsLabel')}`
      : `${lv.cefr} · ${t('comingSoon')}`;
    return `
      <div class="level-card${count === 0 ? ' locked' : ''}" data-level="${esc(lv.id)}">
        <div class="level-badge">${esc(lv.cefr)}</div>
        <div class="level-info">
          <strong>${esc(lv.id)}</strong>
          <span>${esc(sub)}</span>
        </div>
        ${count > 0 ? '<span class="lang-chevron">›</span>' : ''}
      </div>`;
  }).join('');

  return `
    <div class="screen">
      <div class="list-header">
        <button class="btn-back" data-nav="section-select">‹</button>
        <h2>${lang.flag} ${esc(t('courses'))}</h2>
      </div>
      <div class="level-list">${rows}</div>
    </div>
  `;
}

// ── Resources ─────────────────────────────────────────────
function renderResources() {
  const lang = state.language;
  const list = RESOURCES[lang.id] || [];

  const cards = list.map(res => {
    const sections = res.sections.map(sec => {
      const notesHTML = (sec.notes || [])
        .map(n => `<p class="res-note">${esc(n)}</p>`)
        .join('');
      const tableHTML = sec.rows ? `
        <table class="res-table">
          ${sec.cols ? `<thead><tr>${sec.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>` : ''}
          <tbody>${sec.rows.map(row =>
            `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`
          ).join('')}</tbody>
        </table>` : '';
      return `
        <div class="res-section">
          <div class="res-section-heading">${esc(sec.heading)}</div>
          ${notesHTML}${tableHTML}
        </div>`;
    }).join('');

    return `
      <div class="res-card">
        <div class="res-card-header">
          <span class="res-icon">${res.icon}</span>
          <div>
            <strong class="res-title">${esc(res.title)}</strong>
            <span class="res-source">${esc(res.source)}</span>
          </div>
        </div>
        ${sections}
      </div>`;
  }).join('');

  return `
    <div class="screen">
      <div class="list-header">
        <button class="btn-back" data-nav="section-select">‹</button>
        <h2>${lang.flag} ${esc(t('resources'))}</h2>
      </div>
      <div class="res-content">${cards}</div>
    </div>
  `;
}

// ── Lesson List ───────────────────────────────────────────
function renderLessonList() {
  const lang    = state.language;
  const lessons = LESSONS[lang.id][state.level] || [];
  const rows = lessons.map((lesson, i) => `
    <div class="lesson-card${lesson.locked ? ' locked' : ''}" data-lesson="${i}">
      <div class="lesson-num">${lesson.locked ? '🔒' : i + 1}</div>
      <div class="lesson-info">
        <strong>${esc(t(lesson.title))}</strong>
        <span>${esc(lesson.locked ? t('comingSoon') : t(lesson.subtitle))}</span>
      </div>
      ${lesson.locked ? '' : '<span class="lesson-play">▶</span>'}
    </div>
  `).join('');

  return `
    <div class="screen">
      <div class="list-header">
        <button class="btn-back" data-nav="level-select">‹</button>
        <h2>${lang.flag} ${esc(state.level)}</h2>
      </div>
      <div class="lesson-list">${rows}</div>
    </div>
  `;
}

// ── Lesson ────────────────────────────────────────────────
function renderLesson() {
  const lesson = LESSONS[state.language.id][state.level][state.lessonIndex];
  const ex     = lesson.exercises[state.exerciseIndex];
  const total  = lesson.exercises.length;

  return `
    <div class="screen">
      <div class="lesson-topbar">
        ${state.exerciseIndex === 0
          ? `<button class="btn-back" data-nav="lesson-list">‹</button>`
          : `<button class="btn-back" id="btn-prev-exercise">‹</button>`}
        <div class="lesson-topbar-mid">
          <span class="lesson-pill">⭐ ${esc(t(lesson.title))}</span>
          <span class="lesson-counter">${esc(t('lessonWord'))} ${state.exerciseIndex + 1} / ${total}</span>
        </div>
        <button class="btn-back" data-nav="lesson-list">✕</button>
      </div>
      <div class="exercise-area">
        ${renderExercise(ex)}
      </div>
      ${state.answered ? buildFeedbackBar() : ''}
    </div>
  `;
}

// ── Complete ──────────────────────────────────────────────
function renderComplete() {
  const total   = LESSONS[state.language.id][state.level][state.lessonIndex].exercises.length;
  const pct     = Math.round((state.score / total) * 100);
  const passed  = pct >= 60;
  const perfect = state.score === total;
  const xp      = state.score * 10;
  const r = 52, cx = 65, cy = 65;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const buttons = perfect
    ? `
      <div class="complete-actions">
        <button class="btn-home" id="btn-home">${esc(t('backToLessons'))}</button>
        <button class="btn-home btn-resources" id="btn-resources">${esc(t('resources'))}</button>
      </div>`
    : `
      <div class="complete-actions">
        <button class="btn-home btn-try-again" id="btn-try-again">${esc(t('tryAgain'))}</button>
        <div class="complete-row">
          <button class="btn-home" id="btn-home">${esc(t('backToLessons'))}</button>
          <button class="btn-home btn-resources" id="btn-resources">${esc(t('resources'))}</button>
        </div>
      </div>`;

  return `
    <div class="complete-screen">
      <div class="complete-emoji">${passed ? '🏆' : '💪'}</div>
      <div class="complete-title">${esc(t(passed ? 'greatJob' : 'keepGoing'))}</div>
      <div class="complete-sub">${state.score} ${esc(t('outOf'))} ${total} ${esc(t('correctSuffix'))}</div>
      <div class="score-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e5e5" stroke-width="12"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                  stroke="${passed ? '#58CC02' : '#FF9600'}" stroke-width="12"
                  stroke-linecap="round"
                  stroke-dasharray="${circ.toFixed(2)}"
                  stroke-dashoffset="${offset.toFixed(2)}"
                  style="transform:rotate(-90deg);transform-origin:65px 65px"/>
        </svg>
        <span class="score-pct" style="color:${passed ? '#58CC02' : '#FF9600'}">${pct}%</span>
      </div>
      <div class="xp-pill">⭐ +${xp} XP</div>
      ${buttons}
    </div>
  `;
}

// ── Feedback bar ──────────────────────────────────────────
function buildFeedbackBar() {
  const ok  = state.isCorrect;
  const ans = state.correctAnswer || '';
  return `
    <div class="feedback-bar ${ok ? 'correct' : 'wrong'}">
      <div class="feedback-row">
        <span class="feedback-icon">${ok ? '✅' : '❌'}</span>
        <div>
          <div class="feedback-label">${esc(t(ok ? 'correct' : 'incorrect'))}</div>
          ${!ok && ans ? `<div class="feedback-answer">${esc(t('answer'))} ${esc(ans)}</div>` : ''}
        </div>
      </div>
      <button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>
    </div>
  `;
}

// ── Answer handling ───────────────────────────────────────
function handleAnswer(isCorrect, correctAnswer) {
  state.answered      = true;
  state.isCorrect     = isCorrect;
  state.correctAnswer = correctAnswer;
  if (isCorrect && !state.scored[state.exerciseIndex]) state.score += 1;
  state.scored[state.exerciseIndex] = true;

  // Append feedback without re-rendering the exercise
  const screen = document.querySelector('.screen');
  const old    = screen.querySelector('.feedback-bar');
  if (old) old.remove();
  screen.insertAdjacentHTML('beforeend', buildFeedbackBar());
  document.getElementById('btn-continue').addEventListener('click', advanceExercise);
}

function goToPrevExercise() {
  if (state.exerciseIndex > 0) {
    navigate('lesson', { exerciseIndex: state.exerciseIndex - 1, score: state.score });
  }
}

function advanceExercise() {
  const lesson  = LESSONS[state.language.id][state.level][state.lessonIndex];
  const nextIdx = state.exerciseIndex + 1;
  if (nextIdx >= lesson.exercises.length) {
    navigate('complete');
  } else {
    navigate('lesson', { lessonIndex: state.lessonIndex, exerciseIndex: nextIdx, score: state.score });
  }
}

// ── Event wiring ──────────────────────────────────────────
function attachListeners() {
  // Native language buttons
  document.querySelectorAll('[data-ui-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.uiLang = btn.dataset.uiLang;
      localStorage.setItem('lingua_ui_lang', state.uiLang);
      navigate('language-select');
    });
  });

  // Settings cog — re-open native lang picker
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => navigate('native-lang-select'));
  }

  // Target language cards
  document.querySelectorAll('.lang-card[data-lang]').forEach(card => {
    card.addEventListener('click', () => {
      const lang = LANGUAGES.find(l => l.id === card.dataset.lang);
      navigate('section-select', { language: lang });
    });
  });

  // Section cards (Courses / Resources)
  document.querySelectorAll('.section-card[data-section]').forEach(card => {
    card.addEventListener('click', () => {
      navigate(card.dataset.section === 'courses' ? 'level-select' : 'resources');
    });
  });

  // Level cards
  document.querySelectorAll('.level-card:not(.locked)[data-level]').forEach(card => {
    card.addEventListener('click', () => {
      navigate('lesson-list', { level: card.dataset.level });
    });
  });

  // Lesson cards
  document.querySelectorAll('.lesson-card:not(.locked)[data-lesson]').forEach(card => {
    card.addEventListener('click', () => {
      navigate('lesson', { lessonIndex: Number(card.dataset.lesson), exerciseIndex: 0, score: 0, scored: [], usedAnswers: [] });
    });
  });

  // Generic back/nav buttons
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  // Prev exercise (lesson screen)
  const prevExBtn = document.getElementById('btn-prev-exercise');
  if (prevExBtn) prevExBtn.addEventListener('click', goToPrevExercise);

  // Continue (lesson screen)
  const continueBtn = document.getElementById('btn-continue');
  if (continueBtn) continueBtn.addEventListener('click', advanceExercise);

  // Back to lessons (complete screen)
  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) homeBtn.addEventListener('click', () => navigate('lesson-list'));

  // Try again (complete screen)
  const tryAgainBtn = document.getElementById('btn-try-again');
  if (tryAgainBtn) tryAgainBtn.addEventListener('click', () =>
    navigate('lesson', { exerciseIndex: 0, score: 0, scored: [], usedAnswers: [] })
  );

  // Resources (complete screen)
  const resourcesBtn = document.getElementById('btn-resources');
  if (resourcesBtn) resourcesBtn.addEventListener('click', () => navigate('resources'));

  // Exercise interactions
  if (state.screen === 'lesson' && !state.answered) {
    const ex = LESSONS[state.language.id][state.level][state.lessonIndex].exercises[state.exerciseIndex];
    setupExerciseListeners(ex, handleAnswer);
  }
}
