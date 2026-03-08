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
│   ├── data.js         # LANGUAGES, LEVELS, LESSONS, IMAGE_MAP, EXAMPLE_MAP, RESOURCES (~1200 lines)
│   ├── i18n.js         # I18N object + LANG_NAMES; t(key) and langName(id) helpers
│   ├── speech.js       # speak(), startRecognition(), stopRecognition(), checkPronunciation()
│   ├── exercises.js    # renderExercise(), setupExerciseListeners(), esc() utility
│   └── app.js          # state, render(), navigate(), screen renderers, attachListeners()
├── icons/icon.svg
└── images/             # See image list below
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
  scored: [],                     // array tracking which exercises were scored
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

All 5 builders produce objects consumed by `exercises.js`:

```js
// Multiple choice: "How do you say X in {lang}?" — options are target-lang words
mc(target, ptTrans, idTrans, options[4])

// Multiple choice meaning: "What does X mean?" — options are UI-lang meanings
mcM(target, ptTrans, idTrans, ptOptions[4], idOptions[4])

// Type answer: user types the target word (case-insensitive match)
ta(target, ptTrans, idTrans)

// Listening: auto-plays TTS, shows options after play — options are UI-lang meanings
li(target, ptTrans, idTrans, ptOptions[4], idOptions[4])

// Speaking: auto-plays TTS, user speaks via mic — fuzzy match via checkPronunciation()
sp(target, ptTrans, idTrans)
```

**Correct answer logic (exercises.js `getCorrectAnswer`):**
- `mc` with `questionType: 'word'` → `ex.target`
- `mc` with `questionType: 'meaning'` → `ex.translation[uiLang]`
- `ta` → `ex.target`
- `li` → `ex.translation[uiLang]`
- `sp` → always passes via "try later" or fuzzy match

## Lesson Data Structure (data.js)

```js
const LESSONS = {
  'pt-PT': {
    'ACESSO': [
      {
        id: 'pt-greetings',          // unique string
        title: 'lessonGreetings',    // i18n key
        subtitle: 'lessonGreetingsSub',
        exercises: [ mc(...), li(...), ta(...), sp(...), mcM(...), ... ]
      },
      // more lessons...
    ],
    'CIPLE': [],   // EMPTY — A2
    // ...
  },
  'id-ID': { ... },
  'fr-FR': { ... },
};
```

## Levels
| Language | Levels (id → CEFR) |
|---|---|
| pt-PT | ACESSO→A1, CIPLE→A2, DEPLE→B1, DIPLE→B2, DAPLE→C1, DUPLE→C2 |
| id-ID | BIPA 1→A1, BIPA 2→A2, BIPA 3→B1, BIPA 4→B2, BIPA 5→C1, BIPA 6→C2 |
| fr-FR | DELF A1→A1, DELF A2→A2, DELF B1→B1, DELF B2→B2, DALF C1→C1, DALF C2→C2 |

**Level is "locked" (greyed out) if `LESSONS[lang][level].length === 0`.**

## Current Content Status
| Language | Level | Status |
|---|---|---|
| pt-PT | ACESSO (A1) | ✅ 8 lessons (greetings, numbers, colors, food, family, body, verbs, places, questions) |
| pt-PT | CIPLE–DUPLE (A2–C2) | ❌ All empty |
| id-ID | BIPA 1 (A1) | ✅ 8 lessons |
| id-ID | BIPA 2 (A2) | ⚠️ 1 lesson (daily life / time/connectors) |
| id-ID | BIPA 3 (B1) | ⚠️ 1 lesson (weather & nature) |
| id-ID | BIPA 4 (B2) | ⚠️ 1 lesson (society & opinion) |
| id-ID | BIPA 5 (C1) | ⚠️ 1 lesson (academic & professional) |
| id-ID | BIPA 6 (C2) | ⚠️ 1 lesson (formal & critical) |
| fr-FR | DELF A1 | ✅ 8 lessons (mirrors PT-A1 topics) |
| fr-FR | DELF A2–DALF C2 | ❌ All empty |

## i18n System (i18n.js)

`t(key)` looks up `I18N[state.uiLang][key]`. UI languages: `pt-PT` and `id-ID` only.

**Lesson title keys available:**
`lessonGreetings`, `lessonGreetingsSub`, `lessonNumbers`, `lessonNumbersSub`, `lessonColors`, `lessonColorsSub`, `lessonFood`, `lessonFoodSub`, `lessonFamily`, `lessonFamilySub`, `lessonBody`, `lessonBodySub`, `lessonVerbs`, `lessonVerbsSub`, `lessonPlaces`, `lessonPlacesSub`, `lessonQuestions`, `lessonQuestionsSub`, `lessonPhrases`, `lessonPhrasesSub`

**For new lesson topics** without an existing key: use a plain string for `title` and `subtitle` (the `t()` function returns the key itself if not found, so strings work fine).

## IMAGE_MAP (data.js)

Maps `ex.target` → image path. Image shown on MC and TA exercises.

**Available images in `pwa/images/`:**
- **Greetings:** hello.png, goodbye.png, sorry.png, please.png, where.png, "Thank You.png", "Good Morning.png", "Good Afternoon.png", "Good Night.png", "I don't understand.png"
- **Numbers:** 1.png–10.png
- **Family:** father.png, mother.png, grandpa.png, Granma.png, husband.png, wife.png, son.png, family.png, adik.png, "Older brother_sister (kakak).png"
- **Colors:** red.png, blue.png, green.png, yellow.png, orange.png, white.png, black.png, Brown.png
- **Body:** Head.png, Nose.png, Mouth.png, Hair.png, ear.png
- **Food:** rice.png, chicken.png, fish.png, fruits.png, coffee.png, water.png, bread.png, eggs.png, meat.png
- **Verbs:** Eat.png, Drink.png, Work.png, Study.png, Read.png, Write.png, Play.png, Buy.png, Go.png, Come.png, Live.png
- **Places:** school.png, Market.png, Office.png, Park.png, Restaurant.png, Hospital.png, Church.png, Cinema.png, Library.png, Pharmacy.png, airport.png, theater.png, House.png

## EXAMPLE_MAP (data.js)

Maps `ex.target` → example sentence shown in exercises. Use plain string for one sentence, or `{ 'pt-PT': '...', 'fr-FR': '...' }` when same spelling appears in multiple target languages (e.g., `'Café'`).

## RESOURCES (data.js)

Reference tables shown in the "Resources" section. Structure:
```js
{
  id: 'pt-vocab',
  icon: '📖',
  title: 'Vocabulário Essencial',
  source: 'Source note',
  sections: [
    {
      heading: 'Section Title',
      cols: ['Col1', 'Col2', 'Col3'],   // optional table headers
      rows: [['cell', 'cell', 'cell']], // table rows
      notes: ['paragraph text'],        // optional paragraphs (no table)
    }
  ]
}
```

## How to Add New Lessons

1. **Add to `LESSONS` in `data.js`** under the right language + level key:
```js
{
  id: 'pt-clothing',           // unique, kebab-case
  title: 'Roupa',              // plain string OR i18n key
  subtitle: 'Camisa, Calças…', // plain string OR i18n key
  exercises: [
    mc('camisa', 'camisa', 'kemeja', ['camisa', 'calças', 'sapatos', 'chapéu']),
    li('calças', 'calças', 'celana', ['camisa', 'calças', 'saia', 'casaco'], ['kemeja', 'celana', 'rok', 'jaket']),
    ta('sapatos', 'sapatos', 'sepatu'),
    mcM('chapéu', 'chapéu', 'topi', ['camisa', 'calças', 'chapéu', 'cinto'], ['kemeja', 'celana', 'topi', 'ikat pinggang']),
    sp('casaco', 'casaco', 'jaket'),
  ]
}
```

2. **Optionally add to IMAGE_MAP** if you have an image:
```js
'camisa': 'images/shirt.png',
```

3. **Optionally add to EXAMPLE_MAP**:
```js
'camisa': 'Visto uma camisa branca para o trabalho.',
```

4. **For new i18n keys** (lesson title/subtitle), add to both `I18N['pt-PT']` and `I18N['id-ID']` in `i18n.js`.

## CSS Design Tokens (style.css)
```css
--green: #58CC02    /* primary CTA, correct */
--blue:  #1CB0F6    /* secondary, type input focus */
--red:   #FF4B4B    /* wrong answer */
--purple:#CE82FF    /* speaking screen */
--yellow:#FFD900    /* XP pill */
--radius: 16px
```

## Speech (speech.js)
- `speak(text, lang)` — uses Web Speech API TTS at rate 0.85; iOS workaround with 100ms delay
- `startRecognition(lang, onResult, onEnd)` — speech-to-text; `onResult(heard)` called with transcript
- `checkPronunciation(heard, target)` — fuzzy: passes if normalized strings match, or one includes the other
- Speaking exercises have a "Try later" button that always passes (onAnswer(true))

## Service Worker & Deploy
- `sw.js` uses `__BUILD_VERSION__` placeholder replaced by `build.js` at deploy time
- Cache strategy: network-first for HTML navigation, stale-while-revalidate for CSS/JS/images
- Images are NOT pre-cached in ASSETS list (they're fetched on demand and cached via stale-while-revalidate)

## PT/ Folder (not yet integrated)
`C:\Users\andre\Desktop\APP\PT\` contains official CAPLE exam JSON files (A1–C1). Types: `dialogue_completion`, `word_matching`, `reading_comprehension`, `gap_fill_verb`, `gap_fill_grammar`. These are source material, not integrated into the PWA.
