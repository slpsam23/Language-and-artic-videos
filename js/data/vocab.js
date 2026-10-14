/* AAC board vocabulary, laid out like a TouchChat-style core board.
   Each item: [word, emoji, part of speech]. Part of speech drives the
   Modified Fitzgerald Key colours (see css/styles.css .pos-*).

   To add words: drop another [word, emoji, pos] row into a category.
   pos options: pronoun, verb, noun, describe, question, small, social, negate, time, place, person */
(function (SG) {
  'use strict';

  SG.VOCAB = {
    en: [
      { id: 'core', label: 'Core', items: [
        ['I', '🙋', 'pronoun'], ['you', '👉', 'pronoun'], ['he', '👦', 'pronoun'], ['she', '👧', 'pronoun'],
        ['it', '📦', 'pronoun'], ['they', '👥', 'pronoun'], ['we', '🧑‍🤝‍🧑', 'pronoun'],
        ['is', '🟰', 'verb'], ['are', '🟰', 'verb'], ['see', '👀', 'verb'], ['want', '🤲', 'verb'],
        ['like', '❤️', 'verb'], ['go', '➡️', 'verb'], ['eat', '🍽️', 'verb'], ['play', '🧸', 'verb'],
        ['have', '✋', 'verb'], ['sleep', '😴', 'verb'], ['help', '🆘', 'verb'],
        ['the', '', 'small'], ['a', '', 'small'], ['an', '', 'small'], ['in', '📥', 'small'],
        ['on', '🔛', 'small'], ['at', '📍', 'small'], ['with', '🤝', 'small'], ['and', '➕', 'small'],
        ['not', '🚫', 'negate'], ['yes', '✅', 'social'], ['no', '❌', 'social'],
        ['what', '❓', 'question'], ['who', '🧑', 'question'], ['where', '🗺️', 'question'],
        ['when', '⏰', 'question'], ['why', '🤔', 'question'], ['how', '🛠️', 'question'],
        ['can', '💪', 'verb'], ['do', '✔️', 'verb'], ['does', '✔️', 'verb']
      ] },
      { id: 'people', label: 'People', items: [
        ['boy', '👦', 'person'], ['girl', '👧', 'person'], ['mom', '👩', 'person'], ['dad', '👨', 'person'],
        ['Mom', '👩', 'person'], ['Dad', '👨', 'person'], ['baby', '👶', 'person'],
        ['teacher', '🧑‍🏫', 'person'], ['friend', '🧑‍🤝‍🧑', 'person'], ['grandma', '👵', 'person'], ['grandpa', '👴', 'person']
      ] },
      { id: 'places', label: 'Places', items: [
        ['home', '🏠', 'place'], ['school', '🏫', 'place'], ['park', '🌳', 'place'], ['store', '🏪', 'place'],
        ['kitchen', '🍳', 'place'], ['bed', '🛏️', 'place'], ['table', '🪑', 'place'], ['pool', '🏊', 'place'],
        ['car', '🚗', 'place'], ['bathroom', '🛁', 'place']
      ] },
      { id: 'actions', label: 'Actions', items: [
        ['eating', '🍽️', 'verb'], ['drinking', '🥤', 'verb'], ['playing', '⚽', 'verb'], ['running', '🏃', 'verb'],
        ['jumping', '🤸', 'verb'], ['sleeping', '😴', 'verb'], ['reading', '📖', 'verb'], ['swimming', '🏊', 'verb'],
        ['kicking', '🦵', 'verb'], ['washing', '🧼', 'verb'], ['cooking', '🍳', 'verb'], ['sitting', '🪑', 'verb'],
        ['eats', '🍽️', 'verb'], ['sleeps', '😴', 'verb'], ['reads', '📖', 'verb']
      ] },
      { id: 'things', label: 'Things', items: [
        ['ball', '⚽', 'noun'], ['dog', '🐕', 'noun'], ['cat', '🐈', 'noun'], ['book', '📖', 'noun'],
        ['apple', '🍎', 'noun'], ['pizza', '🍕', 'noun'], ['milk', '🥛', 'noun'], ['water', '💧', 'noun'],
        ['cookie', '🍪', 'noun'], ['toy', '🧸', 'noun'], ['bird', '🐦', 'noun'], ['tree', '🌳', 'noun'],
        ['snack', '🥨', 'noun'], ['cup', '🥤', 'noun']
      ] },
      { id: 'describe', label: 'Describe', items: [
        ['big', '🐘', 'describe'], ['little', '🐭', 'describe'], ['happy', '😀', 'describe'], ['sad', '😢', 'describe'],
        ['hot', '🔥', 'describe'], ['cold', '🧊', 'describe'], ['red', '🟥', 'describe'], ['blue', '🟦', 'describe'],
        ['green', '🟩', 'describe'], ['yellow', '🟨', 'describe'], ['fast', '💨', 'describe'], ['slow', '🐢', 'describe']
      ] },
      { id: 'time', label: 'Time', items: [
        ['morning', '🌅', 'time'], ['night', '🌙', 'time'], ['today', '📅', 'time'], ['now', '⏱️', 'time'],
        ['lunch', '🥪', 'time'], ['bedtime', '🛏️', 'time']
      ] }
    ],
    es: [
      { id: 'core', label: 'Básico', items: [
        ['yo', '🙋', 'pronoun'], ['tú', '👉', 'pronoun'], ['él', '👦', 'pronoun'], ['ella', '👧', 'pronoun'],
        ['ellos', '👥', 'pronoun'], ['nosotros', '🧑‍🤝‍🧑', 'pronoun'],
        ['es', '🟰', 'verb'], ['está', '🟰', 'verb'], ['están', '🟰', 'verb'], ['veo', '👀', 'verb'],
        ['quiero', '🤲', 'verb'], ['me', '🙋', 'pronoun'], ['gusta', '❤️', 'verb'], ['va', '➡️', 'verb'],
        ['come', '🍽️', 'verb'], ['juega', '🧸', 'verb'], ['tiene', '✋', 'verb'], ['duerme', '😴', 'verb'],
        ['ayuda', '🆘', 'verb'],
        ['el', '', 'small'], ['la', '', 'small'], ['un', '', 'small'], ['una', '', 'small'],
        ['en', '📍', 'small'], ['con', '🤝', 'small'], ['y', '➕', 'small'], ['de', '', 'small'],
        ['no', '❌', 'negate'], ['sí', '✅', 'social'],
        ['qué', '❓', 'question'], ['quién', '🧑', 'question'], ['dónde', '🗺️', 'question'],
        ['cuándo', '⏰', 'question'], ['por qué', '🤔', 'question'], ['cómo', '🛠️', 'question'],
        ['puede', '💪', 'verb'], ['hay', '👆', 'verb']
      ] },
      { id: 'people', label: 'Personas', items: [
        ['niño', '👦', 'person'], ['niña', '👧', 'person'], ['mamá', '👩', 'person'], ['papá', '👨', 'person'],
        ['bebé', '👶', 'person'], ['maestra', '🧑‍🏫', 'person'], ['amigo', '🧑‍🤝‍🧑', 'person'],
        ['abuela', '👵', 'person'], ['abuelo', '👴', 'person']
      ] },
      { id: 'places', label: 'Lugares', items: [
        ['casa', '🏠', 'place'], ['escuela', '🏫', 'place'], ['parque', '🌳', 'place'], ['tienda', '🏪', 'place'],
        ['cocina', '🍳', 'place'], ['cama', '🛏️', 'place'], ['mesa', '🪑', 'place'], ['piscina', '🏊', 'place'],
        ['carro', '🚗', 'place'], ['baño', '🛁', 'place']
      ] },
      { id: 'actions', label: 'Acciones', items: [
        ['comiendo', '🍽️', 'verb'], ['bebiendo', '🥤', 'verb'], ['jugando', '⚽', 'verb'], ['corriendo', '🏃', 'verb'],
        ['saltando', '🤸', 'verb'], ['durmiendo', '😴', 'verb'], ['leyendo', '📖', 'verb'], ['nadando', '🏊', 'verb'],
        ['pateando', '🦵', 'verb'], ['lavando', '🧼', 'verb'], ['cocinando', '🍳', 'verb'], ['sentado', '🪑', 'verb']
      ] },
      { id: 'things', label: 'Cosas', items: [
        ['pelota', '⚽', 'noun'], ['perro', '🐕', 'noun'], ['gato', '🐈', 'noun'], ['libro', '📖', 'noun'],
        ['manzana', '🍎', 'noun'], ['pizza', '🍕', 'noun'], ['leche', '🥛', 'noun'], ['agua', '💧', 'noun'],
        ['galleta', '🍪', 'noun'], ['juguete', '🧸', 'noun'], ['pájaro', '🐦', 'noun'], ['árbol', '🌳', 'noun'],
        ['merienda', '🥨', 'noun'], ['taza', '☕', 'noun']
      ] },
      { id: 'describe', label: 'Describir', items: [
        ['grande', '🐘', 'describe'], ['pequeño', '🐭', 'describe'], ['feliz', '😀', 'describe'], ['triste', '😢', 'describe'],
        ['caliente', '🔥', 'describe'], ['frío', '🧊', 'describe'], ['fría', '🧊', 'describe'], ['rojo', '🟥', 'describe'],
        ['azul', '🟦', 'describe'], ['verde', '🟩', 'describe'], ['amarillo', '🟨', 'describe'],
        ['rápido', '💨', 'describe'], ['lento', '🐢', 'describe']
      ] },
      { id: 'time', label: 'Tiempo', items: [
        ['mañana', '🌅', 'time'], ['noche', '🌙', 'time'], ['hoy', '📅', 'time'], ['ahora', '⏱️', 'time'],
        ['almuerzo', '🥪', 'time']
      ] }
    ]
  };

  /* Words that can start a question (normalised: no accents, lower case). */
  SG.QUESTION_STARTERS = {
    en: ['what', 'who', 'where', 'when', 'why', 'how', 'which', 'is', 'are', 'can', 'do', 'does', 'did', 'will', 'was', 'were'],
    es: ['que', 'quien', 'quienes', 'donde', 'cuando', 'por', 'como', 'cual', 'cuantos', 'cuantas',
         'es', 'esta', 'estan', 'puede', 'hay', 'tiene', 'quieres', 'te', 'el', 'la']
  };

  /* Helper words offered on the fringe row when formulating questions. */
  SG.QUESTION_HELPERS = {
    en: ['is', 'are', 'the', 'a', 'doing', 'can', 'do'],
    es: ['está', 'es', 'el', 'la', 'haciendo', 'puede']
  };

  SG.WH_WORDS = {
    who: SG.L('who', 'quién'), what: SG.L('what', 'qué'), where: SG.L('where', 'dónde'),
    when: SG.L('when', 'cuándo'), why: SG.L('why', 'por qué'), how: SG.L('how', 'cómo')
  };

  /* word -> {emoji, pos} lookup so fringe tiles get the right colour. */
  var index = { en: {}, es: {} };
  ['en', 'es'].forEach(function (lang) {
    SG.VOCAB[lang].forEach(function (cat) {
      cat.items.forEach(function (it) {
        var key = SG.norm(it[0]);
        if (!index[lang][key]) index[lang][key] = { emoji: it[1], pos: it[2] };
      });
    });
  });
  SG.lookupWord = function (word, lang) {
    return index[lang][SG.norm(word)] || null;
  };
})(window.SG);
