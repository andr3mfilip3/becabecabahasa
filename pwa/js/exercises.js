// exercises.js — renders each exercise type and wires up its events.
// Reads state.uiLang and state.language.id for localisation.
// Calls onAnswer(isCorrect) when the user responds.

function renderExercise(exercise) {
  switch (exercise.type) {
    case 'multiple-choice': return renderMC(exercise);
    case 'type-answer':     return renderTA(exercise);
    case 'listening':       return renderListening(exercise);
    case 'speaking':        return renderSpeaking(exercise);
    case 'tutorial':        return renderTutorial(exercise);
    default: return '';
  }
}

function setupExerciseListeners(exercise, onAnswer) {
  switch (exercise.type) {
    case 'multiple-choice': setupMC(exercise, onAnswer);        break;
    case 'type-answer':     setupTA(exercise, onAnswer);        break;
    case 'listening':       setupListening(exercise, onAnswer); break;
    case 'speaking':        setupSpeaking(exercise, onAnswer);  break;
    case 'tutorial':        setupTutorial(exercise, onAnswer);  break;
  }
}

// ── Helpers ───────────────────────────────────────────────

function getQuestion(ex) {
  const uiLang = state.uiLang;
  const trans  = ex.translation[uiLang];
  const lName  = langName(state.language.id);

  switch (ex.type) {
    case 'multiple-choice':
      return ex.questionType === 'word'
        ? t('questionWord').replace('{word}', trans).replace('{lang}', lName)
        : t('questionMeaning').replace('{target}', ex.target);
    case 'type-answer':
      return t('questionType').replace('{word}', trans).replace('{lang}', lName);
    case 'listening':
      return t('questionListen');
    case 'speaking':
      return t('questionSpeak');
  }
}

function getOptions(ex) {
  if (ex.options)       return ex.options;          // target-lang words
  if (ex.optionsByLang) return ex.optionsByLang[state.uiLang];
  return [];
}

function getCorrectAnswer(ex) {
  // For 'word' MC and type-answer → correct is the target word
  // For 'meaning' MC and listening → correct is the UI-language translation
  if (ex.type === 'multiple-choice' && ex.questionType === 'meaning') {
    return ex.translation[state.uiLang];
  }
  if (ex.type === 'listening') {
    return ex.translation[state.uiLang];
  }
  return ex.target;
}

// ── Image helper ──────────────────────────────────────────

function getExImg(ex) {
  const src = IMAGE_MAP[ex.target];
  return src ? `<img class="ex-img" src="${src}" alt="">` : '';
}

// ── Example sentence helper ───────────────────────────────

function getExExample(ex) {
  const entry = EXAMPLE_MAP[ex.target];
  if (!entry) return '';
  const sentence = typeof entry === 'object'
    ? (entry[state.language.id] || entry[Object.keys(entry)[0]])
    : entry;
  if (!sentence) return '';
  return `<div class="ex-example"><span class="ex-example-icon">💬</span><span>${esc(t('example'))}: "${esc(sentence)}"</span></div>`;
}

// ── Multiple Choice ───────────────────────────────────────

function renderMC(ex) {
  const opts    = getOptions(ex);
  const img     = getExImg(ex);
  const example = getExExample(ex);
  return `
    <p class="ex-question">${esc(getQuestion(ex))}</p>
    ${img}
    ${example}
    ${img || example ? '<div class="ex-gap"></div>' : '<div class="spacer"></div>'}
    <div class="options">
      ${opts.map(o => `<button class="opt-btn" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}
    </div>
  `;
}

function setupMC(ex, onAnswer) {
  const correct = getCorrectAnswer(ex);
  document.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.opt;
      const isRight = chosen === correct;
      document.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.opt === correct)      b.classList.add('correct');
        else if (b === btn && !isRight)     b.classList.add('wrong');
      });
      onAnswer(isRight, correct);
    });
  });
}

// ── Type Answer ───────────────────────────────────────────

function renderTA(ex) {
  const img     = getExImg(ex);
  const example = getExExample(ex);
  return `
    <p class="ex-question">${esc(getQuestion(ex))}</p>
    ${img}
    ${example}
    ${img || example ? '<div class="ex-gap"></div>' : '<div class="spacer"></div>'}
    <input id="ta-input" class="type-input" type="text"
           placeholder="${esc(t('typeHere'))}"
           autocomplete="off" autocorrect="off"
           autocapitalize="off" spellcheck="false" />
    <button id="ta-check" class="btn-check" disabled>${esc(t('check'))}</button>
  `;
}

function setupTA(ex, onAnswer) {
  const input = document.getElementById('ta-input');
  const btn   = document.getElementById('ta-check');

  input.focus();
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });

  const check = () => {
    if (btn.disabled) return;
    const norm   = s => s.toLowerCase().trim();
    const isRight = norm(input.value) === norm(ex.target);
    input.disabled = true;
    btn.disabled   = true;
    onAnswer(isRight, ex.target);
  };

  btn.addEventListener('click', check);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
}

// ── Listening ─────────────────────────────────────────────

function renderListening(ex) {
  const opts = getOptions(ex);
  return `
    <p class="ex-question">${esc(getQuestion(ex))}</p>
    <button id="play-btn" class="circle-btn speaker" title="Play">🔊</button>
    <p class="listen-hint" id="listen-hint">${esc(t('tapToHear'))}</p>
    <div id="options-wrap" class="options" style="display:none">
      ${opts.map(o => `<button class="opt-btn" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}
    </div>
  `;
}

function setupListening(ex, onAnswer) {
  const playBtn = document.getElementById('play-btn');
  const hint    = document.getElementById('listen-hint');
  const optWrap = document.getElementById('options-wrap');
  const correct = getCorrectAnswer(ex);

  const play = () => {
    speak(ex.target, state.language.id);
    hint.textContent = t('tapToReplay');
    optWrap.style.display     = 'flex';
    optWrap.style.flexDirection = 'column';
  };

  playBtn.addEventListener('click', play);
  setTimeout(play, 600); // auto-play on load

  optWrap.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen  = btn.dataset.opt;
      const isRight = chosen === correct;
      optWrap.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.opt === correct) b.classList.add('correct');
        else if (b === btn && !isRight) b.classList.add('wrong');
      });
      onAnswer(isRight, correct);
    });
  });
}

// ── Speaking ──────────────────────────────────────────────

function renderSpeaking(ex) {
  const trans = ex.translation[state.uiLang];
  return `
    <p class="ex-question">${esc(getQuestion(ex))}</p>
    <p class="speaking-word">${esc(ex.target)}</p>
    <p class="ex-translation">${esc(trans)}</p>
    <button id="hear-btn" class="btn-hear">${esc(t('hearPronun'))}</button>
    <div class="spacer"></div>
    <button id="mic-btn" class="circle-btn mic" title="Record"
            ${!hasSpeechRecognition ? 'disabled' : ''}>🎤</button>
    <p id="mic-label" class="circle-btn-label">${esc(t('tapToSpeak'))}</p>
    <p id="recognized" class="recognized-text"></p>
    ${!hasSpeechRecognition
      ? `<p class="recognized-text" style="color:var(--red)">${esc(t('speechUnsupported'))}</p>`
      : ''}
    <div class="spacer"></div>
    <button id="try-later-btn" class="btn-try-later">${esc(t('tryLater'))}</button>
  `;
}

function setupSpeaking(ex, onAnswer) {
  const micBtn      = document.getElementById('mic-btn');
  const micLabel    = document.getElementById('mic-label');
  const recognized  = document.getElementById('recognized');
  const tryLaterBtn = document.getElementById('try-later-btn');
  const hearBtn     = document.getElementById('hear-btn');

  hearBtn.addEventListener('click', () => speak(ex.target, state.language.id));
  setTimeout(() => speak(ex.target, state.language.id), 400); // auto-play

  tryLaterBtn.addEventListener('click', () => onAnswer(true, ex.target), { once: true });

  if (!hasSpeechRecognition) return;

  let isRecording = false;

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecognition();
      isRecording = false;
      micBtn.classList.remove('recording');
      micLabel.textContent = t('tapToSpeak');
    } else {
      isRecording = true;
      micBtn.classList.add('recording');
      micLabel.textContent = t('tapToStop');
      recognized.textContent = '';

      startRecognition(state.language.id,
        heard => {
          recognized.textContent = `${t('heard')} "${heard}"`;
          isRecording = false;
          micBtn.classList.remove('recording');
          micLabel.textContent = t('tapToSpeak');
          onAnswer(checkPronunciation(heard, ex.target), ex.target);
        },
        () => {
          isRecording = false;
          micBtn.classList.remove('recording');
          micLabel.textContent = t('tapToSpeak');
          if (!recognized.textContent) {
            recognized.textContent = t('noSpeech');
          }
        }
      );
    }
  });
}

// ── Tutorial ──────────────────────────────────────────────

function renderTutorial(ex) {
  const instruction = ex.instruction[state.uiLang] || ex.instruction['pt-PT'];
  return `
    <p class="tut-instruction">${esc(instruction)}</p>
    <div class="tut-example">
      <span class="tut-example-label">${esc(t('tutExample'))}:</span>
      <p class="tut-example-desc">${esc(ex.exampleDesc)}</p>
    </div>
    <div class="spacer"></div>
    <div class="options">
      <button class="opt-btn" data-opt="${esc(ex.target)}">${esc(ex.target)}</button>
    </div>
  `;
}

function setupTutorial(ex, onAnswer) {
  document.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.opt === ex.target) b.classList.add('correct');
      });
      onAnswer(true, ex.target);
    });
  });
}

// ── Utility ───────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
