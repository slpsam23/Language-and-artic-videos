/* More articulation targets: multisyllabic words (3, 4, 5 syllables), consonant
   clusters, R words (Spanish tap and trill, English R), and sounds in isolation.
   parts = syllables (or cluster + rest for one-syllable cluster words).
   Add words by appending to a list. */
(function (SG) {
  'use strict';

  function w(word, emoji, parts, target) {
    var o = { word: word, emoji: emoji, parts: parts };
    if (target) o.target = target;
    return o;
  }
  var en = SG.ARTIC.en, es = SG.ARTIC.es;

  /* ---------- Multisyllabic ---------- */
  en.multi3 = [
    w('banana', '🍌', ['ba', 'na', 'na']), w('elephant', '🐘', ['el', 'e', 'phant']), w('dinosaur', '🦕', ['di', 'no', 'saur']),
    w('butterfly', '🦋', ['but', 'ter', 'fly']), w('computer', '💻', ['com', 'pu', 'ter']), w('tomato', '🍅', ['to', 'ma', 'to']),
    w('kangaroo', '🦘', ['kan', 'ga', 'roo']), w('hamburger', '🍔', ['ham', 'bur', 'ger']), w('octopus', '🐙', ['oc', 'to', 'pus']),
    w('telephone', '☎️', ['tel', 'e', 'phone']), w('potato', '🥔', ['po', 'ta', 'to']), w('bicycle', '🚲', ['bi', 'cy', 'cle']),
    w('umbrella', '☂️', ['um', 'brel', 'la']), w('ladybug', '🐞', ['la', 'dy', 'bug']), w('pineapple', '🍍', ['pine', 'ap', 'ple'])
  ];
  en.multi4 = [
    w('watermelon', '🍉', ['wa', 'ter', 'mel', 'on']), w('caterpillar', '🐛', ['cat', 'er', 'pil', 'lar']),
    w('helicopter', '🚁', ['hel', 'i', 'cop', 'ter']), w('alligator', '🐊', ['al', 'li', 'ga', 'tor']),
    w('macaroni', '🍝', ['mac', 'a', 'ro', 'ni']), w('avocado', '🥑', ['av', 'o', 'ca', 'do']),
    w('television', '📺', ['tel', 'e', 'vi', 'sion']), w('motorcycle', '🏍️', ['mo', 'tor', 'cy', 'cle']),
    w('calculator', '🧮', ['cal', 'cu', 'la', 'tor']), w('thermometer', '🌡️', ['ther', 'mom', 'e', 'ter'])
  ];
  en.multi5 = [
    w('hippopotamus', '🦛', ['hip', 'po', 'pot', 'a', 'mus']), w('refrigerator', '🧊', ['re', 'frig', 'er', 'a', 'tor']),
    w('Tyrannosaurus', '🦖', ['Ty', 'ran', 'no', 'saur', 'us']), w('electricity', '⚡', ['e', 'lec', 'tric', 'i', 'ty']),
    w('imagination', '🌈', ['i', 'mag', 'i', 'na', 'tion']), w('university', '🎓', ['u', 'ni', 'ver', 'si', 'ty']),
    w('vocabulary', '📚', ['vo', 'cab', 'u', 'lar', 'y']), w('auditorium', '🏛️', ['au', 'di', 'to', 'ri', 'um'])
  ];
  es.multi3 = [
    w('zapato', '👟', ['za', 'pa', 'to']), w('pelota', '⚽', ['pe', 'lo', 'ta']), w('camisa', '👕', ['ca', 'mi', 'sa']),
    w('conejo', '🐰', ['co', 'ne', 'jo']), w('manzana', '🍎', ['man', 'za', 'na']), w('paloma', '🕊️', ['pa', 'lo', 'ma']),
    w('cabeza', '🙆', ['ca', 'be', 'za']), w('gallina', '🐔', ['ga', 'lli', 'na']), w('tortuga', '🐢', ['tor', 'tu', 'ga']),
    w('ventana', '🪟', ['ven', 'ta', 'na']), w('plátano', '🍌', ['plá', 'ta', 'no']), w('muñeca', '🪆', ['mu', 'ñe', 'ca']),
    w('tomate', '🍅', ['to', 'ma', 'te'])
  ];
  es.multi4 = [
    w('mariposa', '🦋', ['ma', 'ri', 'po', 'sa']), w('elefante', '🐘', ['e', 'le', 'fan', 'te']),
    w('chocolate', '🍫', ['cho', 'co', 'la', 'te']), w('bicicleta', '🚲', ['bi', 'ci', 'cle', 'ta']),
    w('caramelo', '🍬', ['ca', 'ra', 'me', 'lo']), w('teléfono', '☎️', ['te', 'lé', 'fo', 'no']),
    w('zanahoria', '🥕', ['za', 'na', 'ho', 'ria']), w('aguacate', '🥑', ['a', 'gua', 'ca', 'te']),
    w('calabaza', '🎃', ['ca', 'la', 'ba', 'za']), w('cocodrilo', '🐊', ['co', 'co', 'dri', 'lo']),
    w('mariquita', '🐞', ['ma', 'ri', 'qui', 'ta']), w('hamburguesa', '🍔', ['ham', 'bur', 'gue', 'sa']),
    w('televisión', '📺', ['te', 'le', 'vi', 'sión'])
  ];
  es.multi5 = [
    w('hipopótamo', '🦛', ['hi', 'po', 'pó', 'ta', 'mo']), w('refrigerador', '🧊', ['re', 'fri', 'ge', 'ra', 'dor']),
    w('computadora', '💻', ['com', 'pu', 'ta', 'do', 'ra']), w('helicóptero', '🚁', ['he', 'li', 'cóp', 'te', 'ro']),
    w('calculadora', '🧮', ['cal', 'cu', 'la', 'do', 'ra']), w('motocicleta', '🏍️', ['mo', 'to', 'ci', 'cle', 'ta']),
    w('abecedario', '🔤', ['a', 'be', 'ce', 'da', 'rio'])
  ];

  /* ---------- Consonant clusters (target = the cluster) ---------- */
  en.clusters = [
    // s-clusters
    w('star', '⭐', ['st', 'ar'], 'st'), w('spoon', '🥄', ['sp', 'oon'], 'sp'), w('skate', '⛸️', ['sk', 'ate'], 'sk'),
    w('snake', '🐍', ['sn', 'ake'], 'sn'), w('smile', '😊', ['sm', 'ile'], 'sm'), w('sled', '🛷', ['sl', 'ed'], 'sl'),
    w('swim', '🏊', ['sw', 'im'], 'sw'),
    // l-clusters
    w('block', '🧱', ['bl', 'ock'], 'bl'), w('blue', '🔵', ['bl', 'ue'], 'bl'), w('plane', '✈️', ['pl', 'ane'], 'pl'),
    w('clock', '🕐', ['cl', 'ock'], 'cl'), w('flag', '🚩', ['fl', 'ag'], 'fl'), w('glove', '🧤', ['gl', 'ove'], 'gl'),
    // r-clusters
    w('bread', '🍞', ['br', 'ead'], 'br'), w('tree', '🌳', ['tr', 'ee'], 'tr'), w('train', '🚂', ['tr', 'ain'], 'tr'),
    w('drum', '🥁', ['dr', 'um'], 'dr'), w('crab', '🦀', ['cr', 'ab'], 'cr'), w('grapes', '🍇', ['gr', 'apes'], 'gr'),
    w('frog', '🐸', ['fr', 'og'], 'fr'), w('prince', '🤴', ['pr', 'ince'], 'pr'),
    // 3-consonant clusters
    w('splash', '💦', ['spl', 'ash'], 'spl'), w('screw', '🔩', ['scr', 'ew'], 'scr'), w('street', '🛣️', ['str', 'eet'], 'str'),
    // final clusters
    w('nest', '🪺', ['ne', 'st'], '-st'), w('ghost', '👻', ['gho', 'st'], '-st'), w('tent', '⛺', ['te', 'nt'], '-nt'),
    w('milk', '🥛', ['mi', 'lk'], '-lk'), w('hand', '✋', ['ha', 'nd'], '-nd')
  ];
  es.clusters = [
    w('blusa', '👚', ['blu', 'sa'], 'bl'), w('brazo', '💪', ['bra', 'zo'], 'br'), w('libro', '📖', ['li', 'bro'], 'br'),
    w('plato', '🍽️', ['pla', 'to'], 'pl'), w('playa', '🏖️', ['pla', 'ya'], 'pl'), w('princesa', '👸', ['prin', 'ce', 'sa'], 'pr'),
    w('tren', '🚂', ['tren'], 'tr'), w('tres', '3️⃣', ['tres'], 'tr'), w('dragón', '🐉', ['dra', 'gón'], 'dr'),
    w('clavo', '🔩', ['cla', 'vo'], 'cl'), w('crayón', '🖍️', ['cra', 'yón'], 'cr'), w('grillo', '🦗', ['gri', 'llo'], 'gr'),
    w('globo', '🎈', ['glo', 'bo'], 'gl'), w('flor', '🌸', ['flor'], 'fl'), w('fresa', '🍓', ['fre', 'sa'], 'fr'),
    w('bicicleta', '🚲', ['bi', 'ci', 'cle', 'ta'], 'cl'), w('cocodrilo', '🐊', ['co', 'co', 'dri', 'lo'], 'dr')
  ];

  /* ---------- R words ---------- */
  en.r = [
    w('red', '🟥', ['red'], 'r'), w('rain', '🌧️', ['rain'], 'r'), w('ring', '💍', ['ring'], 'r'), w('rose', '🌹', ['rose'], 'r'),
    w('rabbit', '🐰', ['rab', 'bit'], 'r'), w('rocket', '🚀', ['rock', 'et'], 'r'), w('carrot', '🥕', ['car', 'rot'], 'r'),
    w('car', '🚗', ['car'], 'r-vocalic'), w('star', '⭐', ['star'], 'r-vocalic'), w('bird', '🐦', ['bird'], 'r-vocalic'),
    w('ear', '👂', ['ear'], 'r-vocalic'), w('door', '🚪', ['door'], 'r-vocalic'), w('four', '4️⃣', ['four'], 'r-vocalic'),
    w('chair', '🪑', ['chair'], 'r-vocalic'), w('flower', '🌸', ['flow', 'er'], 'r-vocalic')
  ];
  es.r = [
    // tap /ɾ/ – r suave (between vowels, end of a syllable)
    w('pera', '🍐', ['pe', 'ra'], 'r-tap'), w('toro', '🐂', ['to', 'ro'], 'r-tap'), w('loro', '🦜', ['lo', 'ro'], 'r-tap'),
    w('cara', '😀', ['ca', 'ra'], 'r-tap'), w('oreja', '👂', ['o', 're', 'ja'], 'r-tap'), w('mariposa', '🦋', ['ma', 'ri', 'po', 'sa'], 'r-tap'),
    w('mar', '🌊', ['mar'], 'r-tap'), w('tambor', '🥁', ['tam', 'bor'], 'r-tap'), w('collar', '📿', ['co', 'llar'], 'r-tap'),
    w('árbol', '🌳', ['ár', 'bol'], 'r-tap'),
    // trill /r/ – r fuerte (start of a word, rr, after n/l/s)
    w('rana', '🐸', ['ra', 'na'], 'r-trill'), w('ratón', '🐭', ['ra', 'tón'], 'r-trill'), w('rosa', '🌹', ['ro', 'sa'], 'r-trill'),
    w('rojo', '🟥', ['ro', 'jo'], 'r-trill'), w('regalo', '🎁', ['re', 'ga', 'lo'], 'r-trill'), w('reloj', '⌚', ['re', 'loj'], 'r-trill'),
    w('perro', '🐕', ['pe', 'rro'], 'r-trill'), w('carro', '🚗', ['ca', 'rro'], 'r-trill'), w('burro', '🫏', ['bu', 'rro'], 'r-trill'),
    w('torre', '🗼', ['to', 'rre'], 'r-trill'), w('gorra', '🧢', ['go', 'rra'], 'r-trill')
  ];

  /* Word types shown in the Articulation tab, in order. cv = show C/V letters. */
  SG.ARTIC_TYPES = {
    cvc: { label: 'CVC', cv: true }, vcv: { label: 'VCV', cv: true }, cvcv: { label: 'CVCV', cv: true },
    multi3: { label: '3 syllables' }, multi4: { label: '4 syllables' }, multi5: { label: '5 syllables' },
    clusters: { label: 'Consonant clusters' }, r: { label: 'R words' }
  };
  // Older code and lessons look labels up here.
  SG.SHAPES = {};
  Object.keys(SG.ARTIC_TYPES).forEach(function (k) { SG.SHAPES[k] = SG.ARTIC_TYPES[k].label; });

  SG.SOUND_LABELS = {
    'r-tap': 'r suave – tap /ɾ/', 'r-trill': 'rr fuerte – trill /r/', 'r': 'R – beginning (prevocalic)', 'r-vocalic': 'R – vocalic (er, ar, or…)'
  };

  /* Spanish R: trill at the start of a word, after n/l/s, or written rr; tap elsewhere. */
  function spanishR(word) {
    var s = SG.norm(word), out = [];
    if (/^r|rr|[nls]r/.test(s)) out.push('r-trill');
    if (/[^nlsr]r(?!r)/.test(s.replace(/^r/, '_'))) out.push('r-tap');
    return out;
  }
  /* English R: before a vowel = prevocalic, otherwise vocalic. */
  function englishR(word) {
    var s = SG.norm(word), out = [];
    if (/r[aeiouy]/.test(s)) out.push('r');
    if (/r(?![aeiouy])|r$/.test(s) || /[aeiou]r/.test(s) && !/r[aeiouy]/.test(s)) out.push('r-vocalic');
    return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
  }

  /* Target sounds in a word, for the sound filter. */
  var VOWELS = /^[aeiouáéíóúüy]+/i;
  SG.articSounds = function (item, type, lang) {
    var p = item.parts || [];
    var raw;
    if (type === 'cvc') raw = [p[0], p[2]];
    else if (type === 'vcv') raw = [p[1]];
    else raw = p.map(function (syl) {
      var m = String(syl).match(/^[^aeiouáéíóúüy]+/i);
      return m ? m[0] : '';
    });
    var sounds = raw.filter(Boolean).map(function (s) {
      s = s.toLowerCase();
      if (s.length === 2 && s[0] === s[1] && s !== 'rr') s = s[0];
      return VOWELS.test(s) ? '' : s;
    }).filter(Boolean);
    if (item.target && item.target.indexOf('r') !== 0) sounds.push(item.target);
    // Replace plain r letters with tap/trill (Spanish) or prevocalic/vocalic (English).
    sounds = sounds.filter(function (s) { return s !== 'r' && s !== 'rr'; });
    if (/r/i.test(item.word)) sounds = sounds.concat(lang === 'es' ? spanishR(item.word) : englishR(item.word));
    return sounds.filter(function (x, i, a) { return a.indexOf(x) === i; });
  };

  /* Which parts to highlight on the card. */
  SG.articHighlight = function (item, type, sound) {
    var parts = item.parts || [];
    var t = sound || item.target;
    if (!t) return [];
    var key = t === 'r-tap' || t === 'r-trill' || t === 'r' || t === 'r-vocalic' ? 'r' : t.replace(/^-/, '');
    var hits = [];
    parts.forEach(function (part, i) { if (SG.norm(part).indexOf(key) !== -1) hits.push(i); });
    if (t === 'r-trill') hits = hits.filter(function (i) { return /^r|rr/i.test(parts[i]) || i === 0; });
    return hits;
  };

  /* ---------- Sounds in isolation ---------- */
  function s(id, show, emoji, cue, name) { return { id: id, show: show, emoji: emoji, cue: cue, name: name || '/' + show + '/' }; }
  SG.ISO_SOUNDS = {
    en: [
      s('p', 'p', '🍿', 'Lips together, then pop! (popcorn sound)'), s('b', 'b', '🫧', 'Lips together, pop with your voice on (bubble sound)'),
      s('m', 'm', '😋', 'Lips together and hum (yummy sound)'), s('t', 't', '⏰', 'Tongue tip behind your top teeth, tap (ticking clock)'),
      s('d', 'd', '🥁', 'Tongue tip up, tap with your voice on (drum sound)'), s('n', 'n', '👃', 'Tongue tip up, hum through your nose'),
      s('k', 'k', '😮‍💨', 'Back of your tongue up, little cough sound'), s('g', 'g', '🥤', 'Back of your tongue up, voice on (gulp)'),
      s('f', 'f', '🐱', 'Top teeth on bottom lip, blow (angry cat)'), s('v', 'v', '🚗', 'Top teeth on bottom lip, buzz (car engine)'),
      s('s', 's', '🐍', 'Teeth together, smile, blow (snake sound)'), s('z', 'z', '🐝', 'Teeth together, buzz (bee sound)'),
      s('sh', 'sh', '🤫', 'Lips round, blow (quiet sound)'), s('ch', 'ch', '🚂', 'Lips round, little sneeze (choo-choo)'),
      s('j', 'j', '🤸', 'Lips round, voice on (jumping sound)'), s('l', 'l', '🎵', 'Tongue tip up behind top teeth, sing (la la)'),
      s('r', 'r', '🏴‍☠️', 'Tongue pulled back, lips a little round (pirate “arrr”)'), s('th', 'th', '👅', 'Tongue between your teeth, blow'),
      s('w', 'w', '😗', 'Lips round like a kiss, then open'), s('h', 'h', '🐶', 'Mouth open, breathe out (tired puppy)'),
      s('y', 'y', '😃', 'Smile, middle of your tongue up (yes!)')
    ],
    es: [
      s('p', 'p', '🍿', 'Labios juntos y ¡pop! (palomitas)'), s('b', 'b', '🫧', 'Labios juntos, con voz (burbuja)'),
      s('m', 'm', '😋', 'Labios juntos, ¡mmm! (rico)'), s('t', 't', '⏰', 'Punta de la lengua detrás de los dientes de arriba (reloj tic-tac)'),
      s('d', 'd', '🦷', 'Punta de la lengua en los dientes de arriba, con voz'), s('n', 'n', '👃', 'Lengua arriba, el aire sale por la nariz'),
      s('ñ', 'ñ', '👶', 'Lengua arriba en el medio (ñaña, ñaña)'), s('k', 'k', '😮‍💨', 'Atrás de la lengua arriba, como una tos', '/k/ (c, qu)'),
      s('g', 'g', '🥤', 'Atrás de la lengua arriba, con voz (glu-glu)'), s('f', 'f', '🐱', 'Dientes de arriba en el labio de abajo, sopla (gato enojado)'),
      s('s', 's', '🐍', 'Dientes juntos, sonríe y sopla (la serpiente)'), s('ch', 'ch', '🚂', 'Labios redondos, como estornudo (chu-chu del tren)'),
      s('j', 'j', '😮‍💨', 'Sonido de la garganta, como cansado (ja-ja)'), s('l', 'l', '🎵', 'Punta de la lengua arriba, canta (la la)'),
      s('y', 'y', '😃', 'Sonríe, lengua arriba en el medio (yo)', '/y/ (y, ll)'),
      s('r-tap', 'r', '🍐', 'La punta de la lengua toca UNA vez detrás de los dientes de arriba (pera)', 'r suave – tap /ɾ/'),
      s('r-trill', 'rr', '🏍️', 'La punta de la lengua vibra como un motor (brrrum)', 'rr fuerte – trill /r/')
    ]
  };

  /* CV syllables for the "Syllables" practice level. */
  var EN_VOWELS = ['a', 'ee', 'oo', 'o', 'ay'];
  var ES_SPELL = {
    k: ['ca', 'que', 'qui', 'co', 'cu'], g: ['ga', 'gue', 'gui', 'go', 'gu'],
    'r-tap': ['ara', 'ere', 'iri', 'oro', 'uru'], 'r-trill': ['ra', 're', 'ri', 'ro', 'ru'], y: ['ya', 'ye', 'yi', 'yo', 'yu']
  };
  SG.isoSyllables = function (soundId, lang) {
    if (lang === 'es') {
      if (ES_SPELL[soundId]) return ES_SPELL[soundId];
      return ['a', 'e', 'i', 'o', 'u'].map(function (v) { return soundId + v; });
    }
    if (soundId === 'r-vocalic') return ['ar', 'er', 'or', 'ear', 'air'];
    return EN_VOWELS.map(function (v) { return soundId + v; });
  };
})(window.SG);
