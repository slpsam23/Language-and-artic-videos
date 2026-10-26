/* Built-in lessons. The easiest way to make your own is the Lesson Builder
   tab in the app (it saves in your browser and can export JSON). To ship a
   lesson to everyone who uses your GitHub Pages site, paste the exported
   JSON into this list.

   LESSON FORMAT
   {
     id: 'unique-id',
     title: { en: '...', es: '...' },
     video: 'https://www.youtube.com/watch?v=XXXXXXXXXXX'   // optional; any YouTube link or 11-char ID
     scene: '🌳👦⚽🐕',                // emoji "picture scene" used when there is no video
     image: 'https://...png',          // optional picture scene image instead of emoji
     description: { en: '...', es: '...' },
     activities: [ ... ]
   }

   ACTIVITY TYPES (every activity may have `at`: seconds into the video to pause and ask)
   - WH comprehension, answered with a 3-5 word predictable-chart sentence:
     { type: 'wh', wh: 'who', question: {en, es}, frame: {en: 'The ___ is kicking', es: 'El ___ está pateando'},
       choices: [{ en, es, emoji, correct: true }, ...], min: 3, max: 5 }
   - Binary (yes/no or this-or-that):
     { type: 'binary', question: {en, es}, choices: [{en, es, emoji, correct}, {en, es, emoji}] }
   - Formulate a question about the picture scene:
     { type: 'formulate', cue: 'where', prompt: {en, es}, example: {en, es}, choices: [scene words...] }
   - Articulation word from the scene:
     { type: 'artic', emoji, word: {en, es}, shape: {en: 'cvc', es: 'cvcv'}, parts: {en: [...], es: [...]}, trials: 3 }
*/
(function (SG) {
  'use strict';

  function c(en, es, emoji, correct) { return { en: en, es: es, emoji: emoji, correct: !!correct }; }
  var YES_NO_YES = [c('yes', 'sí', '👍', true), c('no', 'no', '👎')];
  var YES_NO_NO = [c('yes', 'sí', '👍'), c('no', 'no', '👎', true)];

  SG.BUILTIN_LESSONS = [
    {
      id: 'builtin-park',
      builtin: true,
      title: SG.L('At the Park', 'En el parque'),
      description: SG.L('A boy kicks a ball and his dog runs at the park.',
                        'Un niño patea una pelota y su perro corre en el parque.'),
      video: '',
      scene: '🌳👦⚽🐕☀️',
      image: 'img/scenes/park.svg',
      activities: [
        { type: 'wh', wh: 'who', question: SG.L('Who is kicking the ball?', '¿Quién está pateando la pelota?'),
          frame: SG.L('The ___ is kicking', 'El ___ está pateando'),
          choices: [c('boy', 'niño', '👦', true), c('dog', 'perro', '🐕'), c('baby', 'bebé', '👶')] },
        { type: 'wh', wh: 'where', question: SG.L('Where are they?', '¿Dónde están?'),
          frame: SG.L('They are at the ___', 'Están en el ___'),
          choices: [c('park', 'parque', '🌳', true), c('pool', 'piscina', '🏊'), c('store', 'tienda', '🏪')] },
        { type: 'wh', wh: 'what', question: SG.L('What is the dog doing?', '¿Qué está haciendo el perro?'),
          frame: SG.L('The dog is ___', 'El perro está ___'),
          choices: [c('running', 'corriendo', '🏃', true), c('sleeping', 'durmiendo', '😴'), c('eating', 'comiendo', '🍽️')] },
        { type: 'binary', question: SG.L('Is the dog happy?', '¿Está feliz el perro?'), choices: YES_NO_YES },
        { type: 'binary', question: SG.L('Is the boy kicking a ball or a book?', '¿El niño patea una pelota o un libro?'),
          choices: [c('ball', 'pelota', '⚽', true), c('book', 'libro', '📖')] },
        { type: 'formulate', cue: 'where',
          prompt: SG.L('Ask a WHERE question about the picture.', 'Haz una pregunta con DÓNDE sobre la imagen.'),
          example: SG.L('Where is the ball?', '¿Dónde está la pelota?'),
          choices: [c('ball', 'pelota', '⚽'), c('dog', 'perro', '🐕'), c('boy', 'niño', '👦')] },
        { type: 'artic', emoji: '🐕', word: SG.L('dog', 'perro'), shape: SG.L('cvc', 'cvcv'),
          parts: { en: ['d', 'o', 'g'], es: ['pe', 'rro'] }, trials: 3 }
      ]
    },
    {
      id: 'builtin-snack',
      builtin: true,
      title: SG.L('Snack Time', 'La merienda'),
      description: SG.L('A girl eats a cookie and drinks milk in the kitchen.',
                        'Una niña come una galleta y toma leche en la cocina.'),
      video: '',
      scene: '🍳👧🍪🥛',
      image: 'img/scenes/snack.svg',
      activities: [
        { type: 'wh', wh: 'who', question: SG.L('Who is eating?', '¿Quién está comiendo?'),
          frame: SG.L('The ___ is eating', 'La ___ está comiendo'),
          choices: [c('girl', 'niña', '👧', true), c('mom', 'mamá', '👩'), c('teacher', 'maestra', '🧑‍🏫')] },
        { type: 'wh', wh: 'what', question: SG.L('What does she eat?', '¿Qué come ella?'),
          frame: SG.L('She eats a ___', 'Ella come una ___'),
          choices: [c('cookie', 'galleta', '🍪', true), c('pizza', 'pizza', '🍕'), c('apple', 'manzana', '🍎')] },
        { type: 'wh', wh: 'where', question: SG.L('Where is she?', '¿Dónde está ella?'),
          frame: SG.L('She is in the ___', 'Está en la ___'),
          choices: [c('kitchen', 'cocina', '🍳', true), c('park', 'parque', '🌳'), c('school', 'escuela', '🏫')] },
        { type: 'binary', question: SG.L('Is the milk cold?', '¿Está fría la leche?'), choices: YES_NO_YES },
        { type: 'binary', question: SG.L('Is she drinking milk or water?', '¿Ella toma leche o agua?'),
          choices: [c('milk', 'leche', '🥛', true), c('water', 'agua', '💧')] },
        { type: 'formulate', cue: 'what',
          prompt: SG.L('Ask a WHAT question about the picture.', 'Haz una pregunta con QUÉ sobre la imagen.'),
          example: SG.L('What is she eating?', '¿Qué está comiendo?'),
          choices: [c('eating', 'comiendo', '🍽️'), c('drinking', 'bebiendo', '🥤'), c('she', 'ella', '👧')] },
        { type: 'artic', emoji: '☕', word: SG.L('cup', 'taza'), shape: SG.L('cvc', 'cvcv'),
          parts: { en: ['c', 'u', 'p'], es: ['ta', 'za'] }, trials: 3 }
      ]
    },
    {
      id: 'builtin-bedtime',
      builtin: true,
      title: SG.L('Bedtime', 'La hora de dormir'),
      description: SG.L('Dad reads a book at night and the boy goes to sleep in bed.',
                        'Papá lee un libro en la noche y el niño se duerme en la cama.'),
      video: '',
      scene: '🌙👨📖👦🛏️',
      image: 'img/scenes/bedtime.svg',
      activities: [
        { type: 'wh', wh: 'who', question: SG.L('Who is reading?', '¿Quién está leyendo?'),
          frame: SG.L('___ is reading', '___ está leyendo'),
          choices: [c('Dad', 'papá', '👨', true), c('Mom', 'mamá', '👩'), c('baby', 'bebé', '👶')] },
        { type: 'wh', wh: 'what', question: SG.L('What is the boy doing?', '¿Qué está haciendo el niño?'),
          frame: SG.L('The boy is ___', 'El niño está ___'),
          choices: [c('sleeping', 'durmiendo', '😴', true), c('jumping', 'saltando', '🤸'), c('eating', 'comiendo', '🍽️')] },
        { type: 'wh', wh: 'when', question: SG.L('When does he sleep?', '¿Cuándo duerme él?'),
          frame: SG.L('He sleeps at ___', 'Duerme en la ___'),
          choices: [c('night', 'noche', '🌙', true), c('morning', 'mañana', '🌅')] },
        { type: 'wh', wh: 'where', question: SG.L('Where is the boy?', '¿Dónde está el niño?'),
          frame: SG.L('He is in ___', 'Está en la ___'),
          choices: [c('bed', 'cama', '🛏️', true), c('kitchen', 'cocina', '🍳'), c('school', 'escuela', '🏫')] },
        { type: 'binary', question: SG.L('Is it morning?', '¿Es de mañana?'), choices: YES_NO_NO },
        { type: 'binary', question: SG.L('Is the boy happy or sad?', '¿El niño está feliz o triste?'),
          choices: [c('happy', 'feliz', '😀', true), c('sad', 'triste', '😢')] },
        { type: 'formulate', cue: 'who',
          prompt: SG.L('Ask a WHO question about the picture.', 'Haz una pregunta con QUIÉN sobre la imagen.'),
          example: SG.L('Who is reading?', '¿Quién está leyendo?'),
          choices: [c('reading', 'leyendo', '📖'), c('sleeping', 'durmiendo', '😴'), c('book', 'libro', '📖')] },
        { type: 'artic', emoji: '🛏️', word: SG.L('bed', 'cama'), shape: SG.L('cvc', 'cvcv'),
          parts: { en: ['b', 'e', 'd'], es: ['ca', 'ma'] }, trials: 3 }
      ]
    }
  ];
})(window.SG);
