# BecaBecaBahasa — Project Reference

## Overview
Language learning PWA teaching **Portuguese (pt-PT)**, **Indonesian (id-ID)**, and **French (fr-FR)** through interactive flashcard-style exercises. UI language is either Portuguese or Indonesian. Fully offline-capable (Service Worker). Deployed on Cloudflare Pages.

## Tech Stack
- **Vanilla JS** — no frameworks, no build step for the app itself
- **Web Speech API** — TTS (`speak()`) and speech recognition (`startRecognition()`)
- **LocalStorage** — persists UI language choice (`lingua_ui_lang`)
- **Service Worker** (`sw.js`) — stale-while-revalidate caching; cache name stamped at deploy time by `build.js` via `CF_PAGES_COMMIT_SHA`
- **Cloudflare Pages** — build command runs `node build.js`, then serves `pwa/` folder

## File Structure
```
pwa/
├── index.html          # Single div#app; loads scripts in order: data → i18n → speech → exercises → app
├── manifest.json       # PWA manifest (theme #58CC02 green)
├── sw.js               # Service Worker with __BUILD_VERSION__ placeholder
├── css/style.css       # All styles; CSS vars for colors/radius/shadow
├── js/
│   ├── data.js         # LANGUAGES, LEVELS, LESSONS, IMAGE_MAP, EXAMPLE_MAP, RESOURCES
│   ├── i18n.js         # I18N object + LANG_NAMES; t(key) and langName(id) helpers
│   ├── speech.js       # speak(), startRecognition(), stopRecognition(), checkPronunciation()
│   ├── exercises.js    # renderExercise(), setupExerciseListeners(), per-type render/setup, esc()
│   └── app.js          # state, render(), navigate(), screen renderers, attachListeners()
├── icons/icon.svg
└── images/             # See IMAGE_MAP section below
build.js                # Stamps sw.js version (runs during Cloudflare deploy)
```

## State (app.js)
```js
const state = {
  screen: 'native-lang-select',  // current screen
  uiLang: 'pt-PT',               // learner's native / UI language
  language: null,                 // { id, flag } target language being learned
  level: null,                    // selected LEVELS id string
  lessonIndex: 0,
  exerciseIndex: 0,
  score: 0,
  scored: [],        // indexed by exerciseIndex; true when exercise has been answered
  usedAnswers: [],   // word-match answers used so far this lesson (reset on lesson start)
  answered: false,
  isCorrect: null,
  correctAnswer: null,
};
```

## Screen Flow
`native-lang-select` → `language-select` → `section-select` → `level-select` → `lesson-list` → `lesson` → `complete`
Also: `section-select` → `resources`

Navigation via `navigate(screen, patch)` — resets `answered/isCorrect/correctAnswer`, stops speech recognition, calls `render()`.

## Exercise Types & Builders (data.js)

All builders produce objects consumed by `exercises.js`:

```js
// Multiple choice: "How do you say X in {lang}?" — options are target-lang words
mc(target, ptTrans, idTrans, options[4])

// Multiple choice meaning: "What does X mean?" — options are UI-lang meanings
mcM(target, ptTrans, idTrans, ptOptions[4], idOptions[4])

// Multiple choice instruction: custom bilingual question, fixed options, answer by index
// No target word — instruction IS the question. translation:{} is set internally.
mcI(ptInstruction, idInstruction, options[], answerIndex)

// Type answer: user types the target word (case-insensitive match)
ta(target, ptTrans, idTrans)

// Listening: auto-plays TTS, shows options after play — options are UI-lang meanings
// TTS is generated at runtime via Web Speech API (no audio files).
// Correct answer = ex.translation[uiLang]. For self-referential courses (e.g. PT learning PT),
// set ptTrans = target so the correct answer matches the audio phrase exactly.
li(target, ptTrans, idTrans, ptOptions[4], idOptions[4])

// Speaking: auto-plays TTS, user speaks via mic — fuzzy match via checkPronunciation()
sp(target, ptTrans, idTrans)

// Tutorial: translated instruction box + target-language example box + one selectable option
// instruction translated (pt+id); exampleDesc is always target-language (plain string)
// Always scores as correct. Locks option + shows Continue when going back.
// Shows ex.target image from IMAGE_MAP if available.
tut(ptInstruction, idInstruction, exampleDesc, target, ptTrans, idTrans)

// Tutorial Read: translated instruction + scrollable reading passage + always-visible Continue button
// No answer interaction. Marks scored + advances on Continue. No feedback bar.
tutRead(ptInstruction, idInstruction, text)

// Word Match: sentence prompt + 8-option 2-column word bank
// answer is locked in state.usedAnswers after each question (correct or wrong pick).
// Locks all + shows Continue when going back (state.scored check).
// Shows ex.target (= answer) image from IMAGE_MAP if available.
wm(sentence, answer, wordBank[8], ptTrans, idTrans)

// True/False: reading passage + one true/false question per exercise
// Uses opt-btn buttons in 2-column grid. data-answer="true"|"false" attribute.
// Locks correct answer with .used class + shows Continue when going back.
tf(sentence, answer, text)   // answer: 'true' | 'false'
```

**Correct answer logic (`getCorrectAnswer` in exercises.js):**
- `mc` `word` type → `ex.target`
- `mc` `meaning` type → `ex.translation[uiLang]`
- `mc` `instruction` type → `ex.target` (= `options[answerIndex]`)
- `ta` → `ex.target`
- `li` → `ex.translation[uiLang]`
- `sp` → always passes via "try later" or fuzzy match
- `tutorial` → always passes (`onAnswer(true)`)
- `tutorial-read` → always passes (direct `advanceExercise()`, no feedback bar)
- `word-match` → `ex.answer`
- `true-false` → `ex.answer` (`'true'` or `'false'`); correct label shown in feedback

**`getQuestion` in exercises.js** — for `questionType: 'instruction'`, returns `ex.instruction[uiLang]` with pt-PT fallback. For `word`/`meaning`, uses i18n templates as before.

## Go-Back Locking Pattern

All exercise types that support going back implement the same pattern:

```js
// In renderXxx:
const alreadyAnswered = !!state.scored[state.exerciseIndex];
// → disable all option buttons when alreadyAnswered
// → render <button class="btn-continue" id="btn-continue"> when alreadyAnswered
// → for wm: also applies .used class to previously-used answers
// → for tf: also applies .used class to the correct answer button

// In setupXxx:
if (state.scored[state.exerciseIndex]) return;
// attachListeners() in app.js wires #btn-continue → advanceExercise automatically
```

`tutorial-read` is always available (Continue always shown) — scoring guard is inside the click handler.

## Lesson Data Structure (data.js)

```js
const LESSONS = {
  'pt-PT': {
    'ACESSO': [
      {
        id: 'pt-greetings',           // unique kebab-case string
        title: 'lessonGreetings',     // i18n key (or plain string)
        subtitle: 'lessonGreetingsSub',
        // locked: true,              // optional — greyed out 🔒, not clickable
        exercises: [ mc(...), li(...), ta(...), sp(...), mcM(...) ]
      },
      // more lessons...
      {
        id: 'pt-word-matching',
        title: 'lessonWordMatching',
        subtitle: 'lessonWordMatchingSub',
        exercises: [
          tut('Lê as frases...', 'Baca kalimat...', 'O que se usa para...', 'pasta', 'pasta', 'map'),
          wm('sentence', 'answer', ['word1',...,'word8'], 'ptTrans', 'idTrans'),
          // 4 more wm()...
        ]
      },
      {
        id: 'pt-true-false',
        title: 'lessonTrueFalse',
        subtitle: 'lessonTrueFalseSub',
        exercises: [
          tutRead('Lê o texto...', 'Baca teks...', readingText),
          tf('sentence', 'true'|'false', readingText),
          // 3 more tf()...
        ]
      },
    ],
    'CIPLE': [],   // EMPTY — A2
    // ...
  },
};
```

**Note on tutRead/tf with shared text:** Use an IIFE to avoid repeating the long string:
```js
(() => {
  const _t = 'long reading text...';
  return { id: '...', title: '...', subtitle: '...', exercises: [tutRead(..., _t), tf(..., _t), ...] };
})(),
```

## Levels
| Language | Levels (id → CEFR) |
|---|---|
| pt-PT | ACESSO→A1, CIPLE→A2, DEPLE→B1, DIPLE→B2, DAPLE→C1, DUPLE→C2 |
| id-ID | BIPA 1→A1, BIPA 2→A2, BIPA 3→B1, BIPA 4→B2, BIPA 5→C1, BIPA 6→C2 |
| fr-FR | DELF A1→A1, DELF A2→A2, DELF B1→B1, DELF B2→B2, DALF C1→C1, DALF C2→C2 |

**Level is "locked" (greyed out) if `LESSONS[lang][level].length === 0`.**

## Lesson Locking
- Individual lessons: add `locked: true` → greyed out with 🔒 icon and "Em breve"/"Segera hadir"
- Not clickable — `attachListeners` uses `.lesson-card:not(.locked)[data-lesson]`
- Levels locked when `LESSONS[lang][level].length === 0`

## Current Content Status
| Language | Level | Status |
|---|---|---|
| pt-PT | ACESSO (A1) | ✅ 11 lessons: greetings, numbers (0–20), colors, food, family, body, verbs, places, questions, word-matching, true-false |
| pt-PT | CIPLE–DUPLE (A2–C2) | ❌ All empty |
| id-ID | BIPA 1 (A1) | ✅ 8 lessons |
| id-ID | BIPA 2–6 (A2–C2) | ⚠️ 1 lesson each |
| fr-FR | DELF A1 | ✅ 8 lessons (mirrors PT-A1 topics) |
| fr-FR | DELF A2–DALF C2 | ❌ All empty |

## i18n System (i18n.js)

`t(key)` looks up `I18N[state.uiLang][key]`. UI languages: `pt-PT` and `id-ID` only.

**All lesson title keys:**
`lessonGreetings/Sub`, `lessonNumbers/Sub`, `lessonColors/Sub`, `lessonFood/Sub`, `lessonFamily/Sub`, `lessonBody/Sub`, `lessonVerbs/Sub`, `lessonPlaces/Sub`, `lessonQuestions/Sub`, `lessonPhrases/Sub`, `lessonWordMatching/Sub`, `lessonTrueFalse/Sub`

**Exercise-specific keys:**
- `tutExample` — "Exemplo" / "Contoh" (tutorial example label)
- `trueLabel` — "Verdadeiro" / "Benar"
- `falseLabel` — "Falso" / "Salah"

**Rule:** All new i18n keys must be added to **both** `I18N['pt-PT']` and `I18N['id-ID']`.

**Plain strings work too:** `t()` returns the key itself if not found, so lesson titles/subtitles can be raw strings.

## IMAGE_MAP (data.js)
Maps `ex.target` → image path. Shown on MC, TA, tutorial (`tut`), and word-match (`wm`) exercises via `getExImg(ex)`.

**Image base URL:** `https://pub-1bc4ce0f925641ae898fdc545e16dddf.r2.dev/` (Cloudflare R2). Images are no longer in the `pwa/images/` local folder.

**Categories:** greetings, numbers (0–20 selected), question words, clothing (chinelos/cachecol/guarda-chuva/mochila/pasta/casaco), family, colors, body parts, food/drink, verbs, places.

**Special entry:** `'Uma manhã preguiçosa'` → `Wake up.png` — used by the `mcI` exercise in pt-true-false (target = correct option string).

## EXAMPLE_MAP (data.js)
Maps `ex.target` → example sentence shown in exercises.
- Plain string: one language
- Object `{ 'pt-PT': '...', 'fr-FR': '...' }`: same spelling in multiple target languages

## RESOURCES (data.js)
Reference tables in the "Resources" section:
```js
{ icon, title, source, sections: [{ heading, cols?, rows?, notes? }] }
```

## CSS Design Tokens (style.css)
```css
--green: #58CC02    /* correct, primary CTA */
--green-light: #e5f9c0
--blue:  #1CB0F6    /* secondary, focus, standalone btn-continue */
--blue-light: #d7f1fd
--red:   #FF4B4B    /* wrong answer */
--red-light: #ffe0e0
--purple:#CE82FF    /* speaking screen */
--yellow:#FFD900    /* XP pill */
--gray-1: #afafaf   /* muted text */
--gray-2: #e5e5e5   /* locked .opt-btn.used background, borders */
--gray-3: #f7f7f7   /* default backgrounds */
--radius: 16px
```

**Key CSS classes:**
- `.options` — flex column, gap 10px
- `.options-grid` — 2-column CSS grid (used by word-match and true-false)
- `.opt-btn` — full-width option button (white bg, gray border)
- `.opt-btn.correct` — green highlight
- `.opt-btn.wrong` — red highlight
- `.opt-btn.used` — grey bg (#e5e5e5), grey text, no hover (locked used answer)
- `.tut-instruction` — blue-light background instruction box
- `.tut-example` — grey background example box (`.tut-example-label` + `.tut-example-desc`)
- `.tut-reading` — grey background scrollable reading passage (max-height 45vh)
- `.tf-question` — left-aligned, 1.1rem, font-weight 700 (TF question sentence)
- `.btn-continue` — blue background by default; overridden green/red inside `.feedback-bar`
- `.feedback-bar.correct/.wrong` — bottom bar with icon, label, continue button

## Speech (speech.js)
- `speak(text, lang)` — Web Speech API TTS at rate 0.85; iOS workaround with 100ms delay. **No audio files** — speech is synthesized at runtime by the browser/OS voice pack.
- `startRecognition(lang, onResult, onEnd)` — STT; `onResult(heard)` with transcript
- `checkPronunciation(heard, target)` — fuzzy: passes if normalized strings match or one contains the other
- Speaking exercises have a "Try later" button that always passes (`onAnswer(true)`)
- Listening exercises: `setupListening` calls `speak(ex.target, state.language.id)` — audio is always the `target` word/phrase

## Service Worker & Deploy
- `sw.js` uses `__BUILD_VERSION__` placeholder replaced by `build.js` at deploy time
- Cache strategy: network-first for HTML, stale-while-revalidate for CSS/JS
- Images are served from Cloudflare R2 (external URL) — not cached by the SW, not in `_headers`

## PT/ Folder (not yet integrated)
`C:\Users\andre\Desktop\APP\PT\` contains official CAPLE exam JSON files (A1–C1). Types: `dialogue_completion`, `word_matching`, `reading_comprehension`, `gap_fill_verb`, `gap_fill_grammar`. Source material only — not integrated into the PWA.
