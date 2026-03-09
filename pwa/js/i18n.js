// UI strings keyed by interface language.
// {word}, {lang}, {target} are placeholders replaced at render time.

const I18N = {
  'pt-PT': {
    // Native lang selector (bilingual — shown before user picks)
    nativeLangTitle:   'Qual é a sua língua nativa?',
    nativeLangSub:     'Escolha para continuar',

    // Language select
    whatToLearn:       'O que quer aprender?',
    chooseLang:        'Escolha o idioma alvo',

    // Section select
    courses:           'Cursos',
    coursesSub:        'Lições interativas',
    resources:         'Recursos',
    resourcesSub:      'Materiais de estudo',

    // Level select
    lessonsLabel:      'lições',
    comingSoon:        'Em breve',

    // Lesson list
    lessonWord:        'Lição',
    lessonsTitle:      'Lições',

    // Exercise questions
    questionWord:      'Como se diz "{word}" em {lang}?',
    questionMeaning:   'O que significa "{target}"?',
    questionType:      'Escreva "{word}" em {lang}',
    questionListen:    'O que significa isto?',
    questionSpeak:     'Diga isto em voz alta',

    // Example sentence
    example:           'Exemplo',

    // Inputs
    typeHere:          'Escreva aqui…',
    check:             'Verificar',

    // Listening
    tapToHear:         'Toque para ouvir',
    tapToReplay:       'Toque novamente para repetir',

    // Speaking
    hearPronun:        '🔊 Ouvir pronúncia',
    tapToSpeak:        'Toque para falar',
    tapToStop:         'Toque para parar',
    noSpeech:          'Nenhuma fala detetada. Tente de novo ou salte.',
    speechUnsupported: 'Reconhecimento de voz não disponível neste navegador.',
    skip:              'Saltar',
    markDone:          'Marcar como feito',
    heard:             'Ouvido:',
    tryLater:          'Tento mais tarde',

    // Feedback
    correct:           'Correto!',
    incorrect:         'Incorreto',
    answer:            'Resposta:',
    continue:          'Continuar',

    // Complete
    greatJob:          'Ótimo trabalho!',
    keepGoing:         'Continue a praticar!',
    outOf:             'de',
    correctSuffix:     'corretas',
    backToLessons:     'Voltar às Lições',
    tryAgain:          'Tentar Novamente',

    // Lesson titles
    lessonGreetings:      'Saudações',
    lessonGreetingsSub:   'Olá, Obrigado, Adeus…',
    lessonNumbers:        'Números',
    lessonNumbersSub:     '1 a 100',
    lessonPhrases:        'Frases Essenciais',
    lessonPhrasesSub:     'Onde?, Tudo bem?, Desculpe…',
    lessonColors:         'Cores',
    lessonColorsSub:      'Vermelho, Azul, Verde…',
    lessonFood:           'Comida & Bebida',
    lessonFoodSub:        'Arroz, Frango, Água…',
    lessonFamily:         'Família',
    lessonFamilySub:      'Pai, Mãe, Avô…',
    lessonVerbs:          'Verbos',
    lessonVerbsSub:       'Comer, Beber, Trabalhar…',
    lessonPlaces:         'Lugares',
    lessonPlacesSub:      'Mercado, Escola, Parque…',
    lessonQuestions:      'Palavras Interrogativas',
    lessonQuestionsSub:   'Quem, Quando, Como…',
    lessonBody:           'Corpo',
    lessonBodySub:        'Cabeça, Olho, Nariz…',
    lessonWordMatching:    'Correspondência de Palavras',
    lessonWordMatchingSub: 'Escolha a palavra certa…',
    lessonTrueFalse:       'Verdadeiro ou Falso',
    lessonTrueFalseSub:    'Lê e responde V ou F…',
    lessonGapFill:         'Preencher a Gramática',
    lessonGapFillSub:      'Preenche os espaços com a palavra correta…',
    lessonDialogue:        'Diálogo',
    lessonDialogueSub:     'Completa o diálogo com a opção correta…',
    tutExample:            'Exemplo',
    trueLabel:             'Verdadeiro',
    falseLabel:            'Falso',
  },

  'id-ID': {
    // Native lang selector
    nativeLangTitle:   'Apa bahasa asli Anda?',
    nativeLangSub:     'Pilih untuk melanjutkan',

    // Language select
    whatToLearn:       'Apa yang ingin dipelajari?',
    chooseLang:        'Pilih bahasa target Anda',

    // Section select
    courses:           'Kursus',
    coursesSub:        'Pelajaran interaktif',
    resources:         'Sumber Daya',
    resourcesSub:      'Materi belajar',

    // Level select
    lessonsLabel:      'pelajaran',
    comingSoon:        'Segera hadir',

    // Lesson list
    lessonWord:        'Pelajaran',
    lessonsTitle:      'Pelajaran',

    // Exercise questions
    questionWord:      'Bagaimana "{word}" dalam {lang}?',
    questionMeaning:   'Apa arti "{target}"?',
    questionType:      'Ketik "{word}" dalam {lang}',
    questionListen:    'Apa artinya ini?',
    questionSpeak:     'Ucapkan ini dengan keras',

    // Example sentence
    example:           'Contoh',

    // Inputs
    typeHere:          'Ketik di sini…',
    check:             'Periksa',

    // Listening
    tapToHear:         'Ketuk untuk mendengar',
    tapToReplay:       'Ketuk lagi untuk memutar ulang',

    // Speaking
    hearPronun:        '🔊 Dengar pengucapan',
    tapToSpeak:        'Ketuk untuk berbicara',
    tapToStop:         'Ketuk untuk berhenti',
    noSpeech:          'Tidak ada suara terdeteksi. Coba lagi atau lewati.',
    speechUnsupported: 'Pengenalan suara tidak didukung di browser ini.',
    skip:              'Lewati',
    markDone:          'Tandai selesai',
    heard:             'Terdengar:',
    tryLater:          'Coba lain kali',

    // Feedback
    correct:           'Benar!',
    incorrect:         'Salah',
    answer:            'Jawaban:',
    continue:          'Lanjutkan',

    // Complete
    greatJob:          'Bagus sekali!',
    keepGoing:         'Terus semangat!',
    outOf:             'dari',
    correctSuffix:     'benar',
    backToLessons:     'Kembali ke Pelajaran',
    tryAgain:          'Coba Lagi',

    // Lesson titles
    lessonGreetings:      'Salam',
    lessonGreetingsSub:   'Halo, Terima kasih, Selamat tinggal…',
    lessonNumbers:        'Angka',
    lessonNumbersSub:     '1 sampai 100',
    lessonPhrases:        'Frasa Dasar',
    lessonPhrasesSub:     'Di mana?, Apa kabar?, Maaf…',
    lessonColors:         'Warna',
    lessonColorsSub:      'Merah, Biru, Hijau…',
    lessonFood:           'Makanan & Minuman',
    lessonFoodSub:        'Nasi, Ayam, Air…',
    lessonFamily:         'Keluarga',
    lessonFamilySub:      'Ayah, Ibu, Kakek…',
    lessonVerbs:          'Kata Kerja',
    lessonVerbsSub:       'Makan, Minum, Bekerja…',
    lessonPlaces:         'Tempat',
    lessonPlacesSub:      'Pasar, Sekolah, Kantor…',
    lessonQuestions:      'Kata Tanya',
    lessonQuestionsSub:   'Siapa, Kapan, Bagaimana…',
    lessonBody:           'Tubuh',
    lessonBodySub:        'Kepala, Mata, Hidung…',
    lessonWordMatching:    'Pencocokan Kata',
    lessonWordMatchingSub: 'Pilih kata yang tepat…',
    lessonTrueFalse:       'Benar atau Salah',
    lessonTrueFalseSub:    'Baca dan jawab B atau S…',
    lessonGapFill:         'Isi Tata Bahasa',
    lessonGapFillSub:      'Isi titik-titik dengan kata yang tepat…',
    lessonDialogue:        'Dialog',
    lessonDialogueSub:     'Lengkapi dialog dengan pilihan yang tepat…',
    tutExample:            'Contoh',
    trueLabel:             'Benar',
    falseLabel:            'Salah',
  },
};

// Display name of each target language, shown in the UI language.
const LANG_NAMES = {
  'pt-PT': { 'pt-PT': 'Português', 'id-ID': 'Bahasa Portugis' },
  'id-ID': { 'pt-PT': 'Indonésio',            'id-ID': 'Bahasa Indonesia' },
  'fr-FR': { 'pt-PT': 'Francês',              'id-ID': 'Bahasa Prancis'  },
};

function t(key) {
  return (I18N[state.uiLang] || I18N['pt-PT'])[key] || key;
}

function langName(langId) {
  return (LANG_NAMES[langId] || {})[state.uiLang] || langId;
}
