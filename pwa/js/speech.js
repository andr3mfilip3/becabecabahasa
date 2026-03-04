// ── Text-to-Speech ────────────────────────────────────────
function speak(text, lang) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.85;
  // Small delay so iOS doesn't swallow the first utterance
  setTimeout(() => window.speechSynthesis.speak(utt), 100);
}

// ── Speech Recognition ────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

let _recognition = null;

function startRecognition(lang, onResult, onEnd) {
  if (!hasSpeechRecognition) { onEnd(null); return; }

  if (_recognition) {
    try { _recognition.stop(); } catch (_) {}
  }

  _recognition = new SpeechRecognition();
  _recognition.lang = lang;
  _recognition.interimResults = false;
  _recognition.maxAlternatives = 1;

  _recognition.onresult = e => {
    const heard = e.results[0][0].transcript;
    onResult(heard);
  };

  _recognition.onerror = () => onEnd(null);
  _recognition.onend = () => onEnd(null);

  _recognition.start();
}

function stopRecognition() {
  if (_recognition) {
    try { _recognition.stop(); } catch (_) {}
    _recognition = null;
  }
}

// ── Pronunciation check ───────────────────────────────────
// Returns true if the heard text is close enough to the target.
function checkPronunciation(heard, target) {
  if (!heard) return false;
  const norm = s => s.toLowerCase().trim().replace(/[?.!,]/g, '');
  const h = norm(heard);
  const t = norm(target);
  return h === t || h.includes(t) || t.includes(h);
}
