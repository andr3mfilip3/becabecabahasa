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
    case 'tutorial-read':   return renderTutorialRead(exercise);
    case 'word-match':      return renderWM(exercise);
    case 'true-false':      return renderTF(exercise);
    case 'gap-fill':               return renderGF(exercise);
    case 'dialogue-completion':    return renderDC(exercise);
    default: return '';
  }
}

function setupExerciseListeners(exercise, onAnswer) {
  switch (exercise.type) {
    case 'multiple-choice': setupMC(exercise, onAnswer);           break;
    case 'type-answer':     setupTA(exercise, onAnswer);           break;
    case 'listening':       setupListening(exercise, onAnswer);    break;
    case 'speaking':        setupSpeaking(exercise, onAnswer);     break;
    case 'tutorial':        setupTutorial(exercise, onAnswer);     break;
    case 'tutorial-read':   setupTutorialRead(exercise, onAnswer); break;
    case 'word-match':      setupWM(exercise, onAnswer);           break;
    case 'true-false':      setupTF(exercise, onAnswer);           break;
    case 'gap-fill':               setupGF(exercise, onAnswer);     break;
    case 'dialogue-completion':    setupDC(exercise, onAnswer);     break;
  }
}

// ── Helpers ───────────────────────────────────────────────

function getQuestion(ex) {
  const uiLang = state.uiLang;
  const trans  = ex.translation[uiLang];
  const lName  = langName(state.language.id);

  switch (ex.type) {
    case 'multiple-choice':
      if (ex.questionType === 'instruction')
        return ex.instruction[uiLang] || ex.instruction['pt-PT'];
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
  const instruction     = ex.instruction[state.uiLang] || ex.instruction['pt-PT'];
  const alreadyAnswered = !!state.scored[state.exerciseIndex];
  const img = getExImg(ex);
  return `
    <p class="tut-instruction">${esc(instruction)}</p>
    <div class="tut-example">
      <span class="tut-example-label">${esc(t('tutExample'))}:</span>
      <p class="tut-example-desc">${esc(ex.exampleDesc)}</p>
    </div>
    ${img}
    ${img ? '<div class="ex-gap"></div>' : '<div class="spacer"></div>'}
    <div class="options">
      <button class="opt-btn" data-opt="${esc(ex.target)}"${alreadyAnswered ? ' disabled' : ''}>${esc(ex.target)}</button>
    </div>
    ${alreadyAnswered ? `<button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>` : ''}
  `;
}

function setupTutorial(ex, onAnswer) {
  if (state.scored[state.exerciseIndex]) return; // already answered — attachListeners handles btn-continue
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

// ── Word Match ────────────────────────────────────────────

function renderWM(ex) {
  const used            = state.usedAnswers || [];
  const alreadyAnswered = !!state.scored[state.exerciseIndex];
  const img = getExImg(ex);
  const opts = ex.wordBank.map(word => {
    const isUsed   = used.includes(word);
    const disabled = alreadyAnswered || isUsed;
    return `<button class="opt-btn${isUsed ? ' used' : ''}" data-opt="${esc(word)}"${disabled ? ' disabled' : ''}>${esc(word)}</button>`;
  }).join('');
  return `
    <div class="tut-example">
      <p class="tut-example-desc">${esc(ex.sentence)}</p>
    </div>
    ${img}
    ${img ? '<div class="ex-gap"></div>' : '<div class="spacer"></div>'}
    <div class="options options-grid">
      ${opts}
    </div>
    ${alreadyAnswered ? `<button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>` : ''}
  `;
}

function setupWM(ex, onAnswer) {
  if (state.scored[state.exerciseIndex]) return; // already answered — attachListeners handles btn-continue
  document.querySelectorAll('.opt-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.opt;
      const isRight = chosen === ex.answer;
      document.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.opt === ex.answer) b.classList.add('correct');
        else if (b === btn && !isRight)  b.classList.add('wrong');
      });
      state.usedAnswers.push(ex.answer);
      onAnswer(isRight, ex.answer);
    });
  });
}

// ── Tutorial Read ─────────────────────────────────────────

function renderTutorialRead(ex) {
  return `
    <p class="tut-instruction">${esc(ex.instruction[state.uiLang] || ex.instruction['pt-PT'])}</p>
    <div class="tut-reading">
      <p>${esc(ex.text)}</p>
    </div>
    <div class="spacer"></div>
    <button class="btn-continue" id="btn-tut-read">${esc(t('continue'))}</button>
  `;
}

function setupTutorialRead(ex, onAnswer) {
  const btn = document.getElementById('btn-tut-read');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!state.scored[state.exerciseIndex]) {
      state.score += 1;
      state.scored[state.exerciseIndex] = true;
    }
    advanceExercise();
  });
}

// ── True / False ──────────────────────────────────────────

function renderTF(ex) {
  const alreadyAnswered = !!state.scored[state.exerciseIndex];
  const correctLabel = ex.answer === 'true' ? t('trueLabel') : t('falseLabel');
  return `
    <div class="tut-reading">
      <p>${esc(ex.text)}</p>
    </div>
    <p class="tf-question">${esc(ex.sentence)}</p>
    <div class="spacer"></div>
    <div class="options">
      <button class="opt-btn${alreadyAnswered && ex.answer === 'true'  ? ' used' : ''}" data-answer="true"${alreadyAnswered ? ' disabled' : ''}>${esc(t('trueLabel'))}</button>
      <button class="opt-btn${alreadyAnswered && ex.answer === 'false' ? ' used' : ''}" data-answer="false"${alreadyAnswered ? ' disabled' : ''}>${esc(t('falseLabel'))}</button>
    </div>
    ${alreadyAnswered ? `<button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>` : ''}
  `;
}

function setupTF(ex, onAnswer) {
  if (state.scored[state.exerciseIndex]) return; // attachListeners handles btn-continue
  document.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen  = btn.dataset.answer;
      const isRight = chosen === ex.answer;
      document.querySelectorAll('.opt-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === ex.answer)            b.classList.add('correct');
        else if (b === btn && !isRight)                b.classList.add('wrong');
      });
      const correctLabel = ex.answer === 'true' ? t('trueLabel') : t('falseLabel');
      onAnswer(isRight, correctLabel);
    });
  });
}

// ── Gap Fill ──────────────────────────────────────────────

function gfTextHtml(text, questions, selected, alreadyAnswered) {
  return esc(text).replace(/\((\d+)\)\s*______/g, (match, id) => {
    const q = questions.find(q => q.id === id);
    if (!q) return match;
    if (alreadyAnswered) {
      return `<span class="gf-blank correct">${esc(q.answer)}</span>`;
    }
    const val = selected[id];
    return val
      ? `<span class="gf-blank filled" data-gap="${id}">${esc(val)}</span>`
      : `<span class="gf-blank empty" data-gap="${id}">__(${id})__</span>`;
  });
}

function renderGF(ex) {
  const alreadyAnswered = !!state.scored[state.exerciseIndex];
  const instruction = ex.instruction[state.uiLang] || ex.instruction['pt-PT'];
  const optionGroups = ex.questions.map(q => `
    <div class="gf-group">
      <span class="gf-label">${q.id}</span>
      <div class="gf-chips">
        ${q.options.map(o => `<button class="gf-chip" data-gap="${q.id}" data-val="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
    </div>
  `).join('');

  return `
    <p class="tut-instruction">${esc(instruction)}</p>
    <div class="gf-text">${gfTextHtml(ex.text, ex.questions, {}, alreadyAnswered)}</div>
    ${alreadyAnswered
      ? `<button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>`
      : `<div class="gf-groups">${optionGroups}</div>
         <button class="btn-check" id="gf-check" disabled>${esc(t('check'))}</button>`
    }
  `;
}

function setupGF(ex, onAnswer) {
  if (state.scored[state.exerciseIndex]) return;
  const selected = {};
  const checkBtn = document.getElementById('gf-check');

  const updateBlank = (id, val) => {
    const span = document.querySelector(`.gf-blank[data-gap="${id}"]`);
    if (span) { span.textContent = val; span.className = 'gf-blank filled'; }
  };

  document.querySelectorAll('.gf-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const { gap, val } = chip.dataset;
      document.querySelectorAll(`.gf-chip[data-gap="${gap}"]`).forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selected[gap] = val;
      updateBlank(gap, val);
      checkBtn.disabled = !ex.questions.every(q => selected[q.id]);
    });
  });

  checkBtn.addEventListener('click', () => {
    const allCorrect = ex.questions.every(q => selected[q.id] === q.answer);
    document.querySelectorAll('.gf-chip').forEach(chip => {
      chip.disabled = true;
      const q = ex.questions.find(q => q.id === chip.dataset.gap);
      if (chip.dataset.val === q.answer)            chip.classList.add('correct');
      else if (chip.classList.contains('selected')) chip.classList.add('wrong');
    });
    ex.questions.forEach(q => {
      const span = document.querySelector(`.gf-blank[data-gap="${q.id}"]`);
      if (span) {
        span.textContent = selected[q.id] || q.answer;
        span.className = `gf-blank ${selected[q.id] === q.answer ? 'correct' : 'wrong'}`;
      }
    });
    checkBtn.disabled = true;
    onAnswer(allCorrect, null);
  });
}

// ── Dialogue Completion ───────────────────────────────────

function renderDC(ex) {
  const alreadyAnswered = !!state.scored[state.exerciseIndex];
  const instruction = ex.instruction[state.uiLang] || ex.instruction['pt-PT'];

  const dialogueHtml = ex.dialogue.map(({ speaker, line, gapId, exampleLabel }) => {
    if (exampleLabel) {
      return `
        <div class="dc-line dc-example">
          <span class="dc-speaker">${esc(speaker)}:</span>
          <span class="dc-text"><span class="dc-badge">(Exemplo) ${esc(exampleLabel)}</span> ${esc(line)}</span>
        </div>`;
    }
    if (gapId) {
      const slot = alreadyAnswered
        ? `<span class="dc-blank correct">${esc(ex.answers[gapId])}</span>`
        : `<span class="dc-blank empty" data-gap="${gapId}">(${gapId})</span>`;
      return `
        <div class="dc-line">
          <span class="dc-speaker">${esc(speaker)}:</span>
          <span class="dc-text">${slot}</span>
        </div>`;
    }
    return `
      <div class="dc-line">
        <span class="dc-speaker">${esc(speaker)}:</span>
        <span class="dc-text">${esc(line)}</span>
      </div>`;
  }).join('');

  const optionsHtml = ex.options.map(opt => `
    <button class="dc-option" data-label="${esc(opt.label)}">
      <span class="dc-opt-label">${esc(opt.label)}</span>
      <span class="dc-opt-text">${esc(opt.text)}</span>
    </button>`).join('');

  return `
    <p class="tut-instruction">${esc(instruction)}</p>
    <p class="dc-context">${esc(ex.context)}</p>
    <div class="dc-dialogue">${dialogueHtml}</div>
    ${alreadyAnswered
      ? `<button class="btn-continue" id="btn-continue">${esc(t('continue'))}</button>`
      : `<div class="dc-options">${optionsHtml}</div>
         <button class="btn-check" id="dc-check" disabled>${esc(t('check'))}</button>`
    }
  `;
}

function setupDC(ex, onAnswer) {
  if (state.scored[state.exerciseIndex]) return;

  const filled  = {};   // gapId → option label
  const checkBtn = document.getElementById('dc-check');
  let activeGap = null;

  const gapIds = Object.keys(ex.answers);

  const updateCheck = () => {
    checkBtn.disabled = !gapIds.every(id => filled[id]);
  };

  const refreshOptionStyles = () => {
    document.querySelectorAll('.dc-option').forEach(opt => {
      opt.classList.toggle('used', Object.values(filled).includes(opt.dataset.label));
    });
  };

  // Click blank → activate it
  document.querySelectorAll('.dc-blank.empty').forEach(blank => {
    blank.addEventListener('click', () => {
      document.querySelectorAll('.dc-blank').forEach(b => b.classList.remove('active'));
      blank.classList.add('active');
      activeGap = blank.dataset.gap;
    });
  });

  // Click option → fill active blank (or auto-pick next empty)
  document.querySelectorAll('.dc-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (!activeGap) {
        const next = document.querySelector('.dc-blank.empty:not(.active)') ||
                     document.querySelector('.dc-blank.empty');
        if (!next) return;
        activeGap = next.dataset.gap;
      }

      const label = opt.dataset.label;

      // If this option was already assigned elsewhere, clear that blank
      const prevGap = Object.keys(filled).find(id => filled[id] === label);
      if (prevGap && prevGap !== activeGap) {
        delete filled[prevGap];
        const prevSpan = document.querySelector(`.dc-blank[data-gap="${prevGap}"]`);
        if (prevSpan) { prevSpan.textContent = `(${prevGap})`; prevSpan.className = 'dc-blank empty'; }
      }

      filled[activeGap] = label;
      const span = document.querySelector(`.dc-blank[data-gap="${activeGap}"]`);
      if (span) { span.textContent = label; span.className = 'dc-blank filled active'; }

      // Auto-advance active to next empty blank
      const nextEmpty = document.querySelector('.dc-blank.empty:not(.active)');
      document.querySelectorAll('.dc-blank').forEach(b => b.classList.remove('active'));
      if (nextEmpty) { nextEmpty.classList.add('active'); activeGap = nextEmpty.dataset.gap; }
      else activeGap = null;

      refreshOptionStyles();
      updateCheck();
    });
  });

  checkBtn.addEventListener('click', () => {
    const allCorrect = gapIds.every(id => filled[id] === ex.answers[id]);

    document.querySelectorAll('.dc-blank[data-gap]').forEach(span => {
      const id = span.dataset.gap;
      span.className = `dc-blank ${filled[id] === ex.answers[id] ? 'correct' : 'wrong'}`;
    });
    document.querySelectorAll('.dc-option').forEach(opt => {
      opt.disabled = true;
      const label = opt.dataset.label;
      const usedGap = Object.keys(filled).find(id => filled[id] === label);
      if (usedGap) {
        opt.classList.add(filled[usedGap] === ex.answers[usedGap] ? 'correct' : 'wrong');
      }
    });
    checkBtn.disabled = true;
    onAnswer(allCorrect, null);
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
