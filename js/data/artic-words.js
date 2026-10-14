/* Articulation word lists by syllable shape.
   Each item: { word, emoji, parts }
     - CVC / VCV: parts = the three sound segments (consonant/vowel/consonant etc.)
     - CVCV: parts = the two syllables
   Add more words by appending to a list. */
(function (SG) {
  'use strict';

  function w(word, emoji, parts) { return { word: word, emoji: emoji, parts: parts }; }

  SG.ARTIC = {
    en: {
      cvc: [
        w('cat', '🐈', ['c', 'a', 't']), w('dog', '🐕', ['d', 'o', 'g']), w('sun', '☀️', ['s', 'u', 'n']),
        w('hat', '🎩', ['h', 'a', 't']), w('bed', '🛏️', ['b', 'e', 'd']), w('cup', '🥤', ['c', 'u', 'p']),
        w('pig', '🐖', ['p', 'i', 'g']), w('bus', '🚌', ['b', 'u', 's']), w('map', '🗺️', ['m', 'a', 'p']),
        w('fish', '🐟', ['f', 'i', 'sh']), w('man', '👨', ['m', 'a', 'n']), w('book', '📖', ['b', 'oo', 'k']),
        w('top', '🔝', ['t', 'o', 'p']), w('bat', '🦇', ['b', 'a', 't']), w('pen', '🖊️', ['p', 'e', 'n']),
        w('mop', '🧹', ['m', 'o', 'p'])
      ],
      vcv: [
        w('away', '👋', ['a', 'w', 'ay']), w('achoo', '🤧', ['a', 'ch', 'oo']), w('okay', '👌', ['o', 'k', 'ay']),
        w('echo', '🗣️', ['e', 'ch', 'o']), w('oboe', '🎵', ['o', 'b', 'oe']), w('emu', '🐦', ['e', 'm', 'u']),
        w('Abby', '👧', ['A', 'bb', 'y']), w('Ivy', '🌿', ['I', 'v', 'y'])
      ],
      cvcv: [
        w('baby', '👶', ['ba', 'by']), w('puppy', '🐶', ['pu', 'ppy']), w('bunny', '🐰', ['bu', 'nny']),
        w('cookie', '🍪', ['coo', 'kie']), w('pony', '🐴', ['po', 'ny']), w('money', '💵', ['mo', 'ney']),
        w('mommy', '👩', ['mo', 'mmy']), w('daddy', '👨', ['da', 'ddy']), w('kitty', '🐱', ['ki', 'tty']),
        w('tuna', '🐟', ['tu', 'na']), w('happy', '😀', ['ha', 'ppy']), w('potty', '🚽', ['po', 'tty']),
        w('teddy', '🧸', ['te', 'ddy']), w('bubble', '🫧', ['bu', 'bble'])
      ]
    },
    es: {
      cvc: [
        w('sol', '☀️', ['s', 'o', 'l']), w('pan', '🍞', ['p', 'a', 'n']), w('mar', '🌊', ['m', 'a', 'r']),
        w('sal', '🧂', ['s', 'a', 'l']), w('luz', '💡', ['l', 'u', 'z']), w('pez', '🐟', ['p', 'e', 'z']),
        w('gol', '⚽', ['g', 'o', 'l']), w('col', '🥬', ['c', 'o', 'l']), w('tos', '🤧', ['t', 'o', 's']),
        w('red', '🕸️', ['r', 'e', 'd']), w('mil', '1️⃣', ['m', 'i', 'l'])
      ],
      vcv: [
        w('ojo', '👁️', ['o', 'j', 'o']), w('uva', '🍇', ['u', 'v', 'a']), w('oso', '🐻', ['o', 's', 'o']),
        w('ola', '🌊', ['o', 'l', 'a']), w('uno', '1️⃣', ['u', 'n', 'o']), w('ajo', '🧄', ['a', 'j', 'o']),
        w('uña', '💅', ['u', 'ñ', 'a']), w('ala', '🕊️', ['a', 'l', 'a']), w('ama', '❤️', ['a', 'm', 'a'])
      ],
      cvcv: [
        w('mamá', '👩', ['ma', 'má']), w('papá', '👨', ['pa', 'pá']), w('casa', '🏠', ['ca', 'sa']),
        w('mesa', '🪑', ['me', 'sa']), w('gato', '🐈', ['ga', 'to']), w('pato', '🦆', ['pa', 'to']),
        w('luna', '🌙', ['lu', 'na']), w('sopa', '🥣', ['so', 'pa']), w('boca', '👄', ['bo', 'ca']),
        w('vaca', '🐄', ['va', 'ca']), w('mano', '✋', ['ma', 'no']), w('taza', '☕', ['ta', 'za']),
        w('cama', '🛏️', ['ca', 'ma']), w('bebé', '👶', ['be', 'bé']), w('perro', '🐕', ['pe', 'rro'])
      ]
    }
  };

  SG.SHAPES = { cvc: 'CVC', vcv: 'VCV', cvcv: 'CVCV' };

  /* Consonant "target sounds" in a word, used for the sound filter. */
  var VOWELS = /^[aeiouáéíóúüy]+/i;
  SG.articSounds = function (item, shape) {
    var p = item.parts || [];
    var raw;
    if (shape === 'cvc') raw = [p[0], p[2]];
    else if (shape === 'vcv') raw = [p[1]];
    else raw = p.map(function (syl) {
      var m = String(syl).match(/^[^aeiouáéíóúüy]+/i);
      return m ? m[0] : '';
    });
    return raw.filter(Boolean).map(function (s) {
      s = s.toLowerCase();
      // pp -> p, bb -> b; Spanish "rr" (trill) is its own target, so keep it.
      if (s.length === 2 && s[0] === s[1] && s !== 'rr') s = s[0];
      return VOWELS.test(s) ? '' : s;
    }).filter(Boolean);
  };
})(window.SG);
