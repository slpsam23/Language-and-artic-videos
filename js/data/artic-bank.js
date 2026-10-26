/* Real-word bank for articulation: picturable, child-friendly words, chosen so each
   sound has words at the beginning, middle and end, at different syllable lengths.
   One word per line:  word  emoji  syllables-split-by-hyphens  [fix:sound@position=sound,...]
   "fix" corrects spelling surprises, e.g. nose  fix:s@final=z  (the s in "nose" sounds like z).
   The game works out the sound positions and syllable counts by itself. */
(function (SG) {
  'use strict';

  function parse(text) {
    return text.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && l.charAt(0) !== '#'; })
      .map(function (line) {
        var bits = line.split(/\s+/);
        var item = { word: bits[0], emoji: bits[1], parts: bits[2].split('-') };
        var fix = bits.slice(3).join(' ').match(/^fix:(.+)$/);
        if (fix) {
          item.fix = {};
          fix[1].split(',').forEach(function (pair) {
            var kv = pair.split('=');
            item.fix[kv[0]] = kv[1] === 'none' ? null : kv[1];
          });
        }
        return item;
      });
  }

  SG.ARTIC.en.bank = parse(`
    # p
    pie 🥧 pie
    pan 🍳 pan
    pear 🍐 pear
    pool 🏊 pool
    popcorn 🍿 pop-corn
    pumpkin 🎃 pump-kin
    pancake 🥞 pan-cake
    pineapple 🍍 pine-ap-ple
    apple 🍎 ap-ple
    hippo 🦛 hip-po
    zipper 🤐 zip-per
    teepee ⛺ tee-pee
    ship 🚢 ship
    jeep 🚙 jeep
    rope 🪢 rope
    cap 🧢 cap
    sheep 🐑 sheep
    # b
    bee 🐝 bee
    boat ⛵ boat
    bear 🐻 bear
    button 🔘 but-ton
    bubble 🫧 bub-ble
    ribbon 🎀 rib-bon
    cabin 🛖 cab-in
    robot 🤖 ro-bot
    tub 🛁 tub
    web 🕸️ web
    crab 🦀 crab
    sub 🥪 sub
    # m
    mouse 🐭 mouse
    mitten 🧤 mit-ten
    mailbox 📫 mail-box
    hammer 🔨 ham-mer
    camel 🐪 cam-el
    lemon 🍋 lem-on
    swimming 🏊 swim-ming
    drum 🥁 drum
    broom 🧹 broom
    arm 💪 arm
    ham 🍖 ham
    thumb 👍 thumb
    # t
    toe 🦶 toe
    tooth 🦷 tooth
    table 🪑 ta-ble
    tomato 🍅 to-ma-to
    water 💧 wa-ter
    kitten 🐱 kit-ten
    guitar 🎸 gui-tar
    boat ⛵ boat
    coat 🧥 coat
    foot 🦶 foot
    heart ❤️ heart
    rabbit 🐰 rab-bit
    # d
    dice 🎲 dice
    door 🚪 door
    duck 🦆 duck
    dinosaur 🦕 di-no-saur
    ladder 🪜 lad-der
    radio 📻 ra-di-o
    spider 🕷️ spi-der
    slide 🛝 slide
    cloud ☁️ cloud
    bread 🍞 bread
    salad 🥗 sal-ad
    # n
    nose 👃 nose fix:s@final=z
    nest 🪺 nest
    nail 💅 nail
    necklace 📿 neck-lace
    noodles 🍜 noo-dles fix:s@final=z
    peanut 🥜 pea-nut
    honey 🍯 hon-ey
    penny 🪙 pen-ny
    banana 🍌 ba-na-na
    sun ☀️ sun
    phone 📱 phone
    spoon 🥄 spoon
    train 🚂 train
    rain 🌧️ rain
    lion 🦁 li-on
    balloon 🎈 bal-loon
    # k
    car 🚗 car
    cow 🐄 cow
    cup 🥤 cup
    candle 🕯️ can-dle
    camera 📷 cam-er-a
    bucket 🪣 buck-et
    pocket 👖 pock-et
    turkey 🦃 tur-key
    rocket 🚀 rock-et
    chicken 🐔 chick-en
    bike 🚲 bike
    cake 🎂 cake
    book 📖 book
    sock 🧦 sock
    # g
    goat 🐐 goat
    gift 🎁 gift
    girl 👧 girl
    game 🎮 game
    gorilla 🦍 go-ril-la
    goldfish 🐠 gold-fish
    dragon 🐉 drag-on
    wagon 🛒 wag-on
    yogurt 🥛 yo-gurt
    bug 🐛 bug
    pig 🐖 pig
    bag 👜 bag
    frog 🐸 frog
    hotdog 🌭 hot-dog
    # f
    fork 🍴 fork
    fire 🔥 fire
    fox 🦊 fox
    five 5️⃣ five
    football 🏈 foot-ball
    feather 🪶 feath-er
    coffee ☕ cof-fee
    waffle 🧇 waf-fle
    sofa 🛋️ so-fa
    elephant 🐘 el-e-phant
    leaf 🍃 leaf
    knife 🔪 knife
    giraffe 🦒 gi-raffe fix:g=j
    # v
    van 🚐 van
    vest 🦺 vest
    vase 🏺 vase
    violin 🎻 vi-o-lin
    volcano 🌋 vol-ca-no
    vegetables 🥦 veg-e-ta-bles fix:g=j,s@final=z
    oven ♨️ ov-en
    seven 7️⃣ sev-en
    shovel 🪏 shov-el
    river 🏞️ riv-er
    glove 🧤 glove
    dove 🕊️ dove
    wave 🌊 wave
    stove 🔥 stove
    # s
    soup 🍲 soup
    seal 🦭 seal
    saw 🪚 saw
    sandwich 🥪 sand-wich
    seesaw 🛝 see-saw
    salad 🥗 sal-ad
    pencil ✏️ pen-cil
    baseball ⚾ base-ball
    dinosaur 🦕 di-no-saur
    bicycle 🚲 bi-cy-cle
    mouse 🐭 mouse
    horse 🐴 horse
    house 🏠 house
    juice 🧃 juice
    dress 👗 dress
    octopus 🐙 oc-to-pus
    # z
    zebra 🦓 ze-bra
    zoo 🦁 zoo
    zero 0️⃣ ze-ro
    zipper 🤐 zip-per
    lizard 🦎 liz-ard
    puzzle 🧩 puz-zle
    scissors ✂️ scis-sors fix:s@medial=z,s@final=z
    raisins 🍇 rai-sins fix:s@medial=z,s@final=z
    cheese 🧀 cheese fix:s@final=z
    rose 🌹 rose fix:s@final=z
    prize 🏆 prize
    bees 🐝 bees fix:s@final=z
    # sh
    shoe 👟 shoe
    shell 🐚 shell
    shirt 👕 shirt
    shark 🦈 shark
    shower 🚿 show-er
    sunshine ☀️ sun-shine
    seashell 🐚 sea-shell
    cushion 🛋️ cush-ion
    fish 🐟 fish
    brush 🪥 brush
    dish 🍽️ dish
    toothbrush 🪥 tooth-brush
    # ch
    chair 🪑 chair
    cherry 🍒 cher-ry
    chips 🍟 chips
    chocolate 🍫 choc-o-late
    teacher 🧑‍🏫 teach-er
    peaches 🍑 peach-es fix:s@final=z
    kitchen 🍳 kitch-en
    watch ⌚ watch
    beach 🏖️ beach
    peach 🍑 peach
    couch 🛋️ couch
    lunch 🍱 lunch
    # j
    jam 🍓 jam
    jet ✈️ jet
    jar 🫙 jar
    juice 🧃 juice
    jellyfish 🪼 jel-ly-fish
    pajamas 🩳 pa-ja-mas fix:s@final=z
    magic 🪄 mag-ic fix:g=j
    angel 👼 an-gel fix:g=j
    engine 🚂 en-gine fix:g=j
    bridge 🌉 bridge
    cage 🐦 cage
    orange 🍊 or-ange
    badge 📛 badge
    # l
    lamp 💡 lamp
    leg 🦵 leg
    lock 🔒 lock
    lollipop 🍭 lol-li-pop
    ladybug 🐞 la-dy-bug
    yellow 💛 yel-low
    pillow 🛏️ pil-low
    melon 🍈 mel-on
    jelly 🍮 jel-ly
    ball ⚽ ball
    bell 🔔 bell
    doll 🪆 doll
    owl 🦉 owl
    snail 🐌 snail
    wheel 🛞 wheel
    camel 🐪 cam-el
    # r
    rainbow 🌈 rain-bow
    raccoon 🦝 rac-coon
    ruler 📏 rul-er
    parrot 🦜 par-rot
    cherry 🍒 cher-ry
    arrow 🏹 ar-row
    giraffe 🦒 gi-raffe fix:g=j
    strawberry 🍓 straw-ber-ry
    hair 💇 hair
    pear 🍐 pear
    deer 🦌 deer
    corn 🌽 corn
    turtle 🐢 tur-tle
    # th
    thumb 👍 thumb
    thorn 🌹 thorn
    thermometer 🌡️ ther-mom-e-ter
    bathtub 🛁 bath-tub
    birthday 🎂 birth-day
    toothpaste 🪥 tooth-paste
    bath 🛁 bath
    teeth 🦷 teeth
    mouth 👄 mouth
    moth 🦋 moth
    # w
    worm 🪱 worm
    wolf 🐺 wolf
    whale 🐳 whale
    web 🕸️ web
    window 🪟 win-dow
    watermelon 🍉 wa-ter-mel-on
    sandwich 🥪 sand-wich
    flower 🌸 flow-er
    sidewalk 🛣️ side-walk fix:-lk@final=k
    # h
    hand ✋ hand
    hat 🎩 hat
    horse 🐴 horse
    hammer 🔨 ham-mer
    honey 🍯 hon-ey
    helicopter 🚁 hel-i-cop-ter
    beehive 🐝 bee-hive
    doghouse 🏠 dog-house
    playhouse 🏠 play-house
    # y
    yo-yo 🪀 yo-yo
    yarn 🧶 yarn
    yawn 🥱 yawn
    yolk 🍳 yolk fix:l@final=none,-lk@final=k
    crayon 🖍️ cray-on
    kayak 🛶 kay-ak
    backyard 🏡 back-yard
    # more 2-3 syllable words to fill gaps
    microphone 🎤 mi-cro-phone
    medicine 💊 med-i-cine
    newspaper 📰 news-pa-per fix:s@medial=z
    firefighter 🧑‍🚒 fire-fight-er
    family 👪 fam-i-ly
    sunflower 🌻 sun-flow-er
    sandcastle 🏰 sand-cas-tle
    saxophone 🎷 sax-o-phone
    shoelaces 👟 shoe-lac-es fix:s@final=z
    zucchini 🥒 zuc-chi-ni
    zookeeper 🦓 zoo-keep-er
    thunder ⛈️ thun-der
    thirsty 🥤 thirst-y
    thunderstorm ⛈️ thun-der-storm
    mammoth 🦣 mam-moth
    woodpecker 🐦 wood-peck-er
    valentine 💌 val-en-tine
    vampire 🧛 vam-pire
    video 📹 vid-e-o
    teacup ☕ tea-cup
    ketchup 🍅 ketch-up
    bedroom 🛏️ bed-room
    bathroom 🛁 bath-room
    museum 🏛️ mu-se-um
    lemonade 🍋 lem-on-ade
    ostrich 🐦 os-trich
    cabbage 🥬 cab-bage
    luggage 🧳 lug-gage
    sponge 🧽 sponge
    bathtub 🛁 bath-tub
  `);

  SG.ARTIC.es.bank = parse(`
    # p
    piña 🍍 pi-ña
    pájaro 🐦 pá-ja-ro
    pollo 🐔 po-llo
    payaso 🤡 pa-ya-so
    paraguas ☂️ pa-ra-guas
    pie 🦶 pie
    sapo 🐸 sa-po
    sopa 🥣 so-pa
    lápiz ✏️ lá-piz
    capa 🦸 ca-pa
    mapa 🗺️ ma-pa
    # b
    boca 👄 bo-ca
    barco ⛵ bar-co
    bota 👢 bo-ta
    vaso 🥛 va-so
    ballena 🐳 ba-lle-na
    burbuja 🫧 bur-bu-ja
    abeja 🐝 a-be-ja
    caballo 🐴 ca-ba-llo
    nube ☁️ nu-be
    lobo 🐺 lo-bo
    uva 🍇 u-va
    # m
    mono 🐒 mo-no
    moto 🏍️ mo-to
    mano ✋ ma-no
    mesa 🪑 me-sa
    mago 🧙 ma-go
    cama 🛏️ ca-ma
    paloma 🕊️ pa-lo-ma
    camisa 👕 ca-mi-sa
    goma 🧽 go-ma
    # t
    taza ☕ ta-za
    toro 🐂 to-ro
    tijeras ✂️ ti-je-ras
    tortuga 🐢 tor-tu-ga
    gato 🐈 ga-to
    pato 🦆 pa-to
    plato 🍽️ pla-to
    zapato 👟 za-pa-to
    # d
    dedo ☝️ de-do
    dado 🎲 da-do
    dientes 🦷 dien-tes
    delfín 🐬 del-fín
    doctor 🧑‍⚕️ doc-tor
    dinosaurio 🦕 di-no-sau-rio
    nido 🪺 ni-do
    helado 🍦 he-la-do
    candado 🔒 can-da-do
    soldado 💂 sol-da-do
    red 🕸️ red
    pared 🧱 pa-red
    # n
    nariz 👃 na-riz
    naranja 🍊 na-ran-ja
    nieve ❄️ nie-ve
    nube ☁️ nu-be
    luna 🌙 lu-na
    cuna 🛏️ cu-na
    ventana 🪟 ven-ta-na
    cocina 🍳 co-ci-na
    pan 🍞 pan
    tren 🚂 tren
    avión ✈️ a-vión
    camión 🚚 ca-mión
    limón 🍋 li-món
    botón 🔘 bo-tón
    corazón ❤️ co-ra-zón
    # ñ
    ñu 🐃 ñu
    ñandú 🐦 ñan-dú
    niño 👦 ni-ño
    piña 🍍 pi-ña
    uña 💅 u-ña
    araña 🕷️ a-ra-ña
    montaña ⛰️ mon-ta-ña
    muñeca 🪆 mu-ñe-ca
    pañuelo 🤧 pa-ñue-lo
    # k
    casa 🏠 ca-sa
    cara 😀 ca-ra
    queso 🧀 que-so
    coche 🚗 co-che
    cuchara 🥄 cu-cha-ra
    caballo 🐴 ca-ba-llo
    vaca 🐄 va-ca
    foca 🦭 fo-ca
    mosca 🪰 mos-ca
    taco 🌮 ta-co
    chaqueta 🧥 cha-que-ta
    # g
    gallo 🐓 ga-llo
    galleta 🍪 ga-lle-ta
    gorila 🦍 go-ri-la
    gusano 🪱 gu-sa-no
    gorro 🧢 go-rro
    jugo 🧃 ju-go
    fuego 🔥 fue-go
    hormiga 🐜 hor-mi-ga
    tortuga 🐢 tor-tu-ga
    regalo 🎁 re-ga-lo
    lago 🏞️ la-go
    # f
    foca 🦭 fo-ca
    foco 💡 fo-co
    falda 👗 fal-da
    fantasma 👻 fan-tas-ma
    fútbol ⚽ fút-bol
    café ☕ ca-fé
    jirafa 🦒 ji-ra-fa
    elefante 🐘 e-le-fan-te
    sofá 🛋️ so-fá
    teléfono ☎️ te-lé-fo-no
    delfín 🐬 del-fín
    # s
    sol ☀️ sol
    silla 🪑 si-lla
    sandía 🍉 san-dí-a
    serpiente 🐍 ser-pien-te
    cebolla 🧅 ce-bo-lla
    cereza 🍒 ce-re-za
    sombrero 👒 som-bre-ro
    oso 🐻 o-so
    beso 💋 be-so
    vaso 🥛 va-so
    rosa 🌹 ro-sa
    tos 🤧 tos
    tres 3️⃣ tres
    dos 2️⃣ dos
    nuez 🌰 nuez
    autobús 🚌 au-to-bús
    arroz 🍚 a-rroz
    nariz 👃 na-riz
    lápiz ✏️ lá-piz
    # ch
    chile 🌶️ chi-le
    chancla 🩴 chan-cla
    chocolate 🍫 cho-co-la-te
    chaqueta 🧥 cha-que-ta
    chupete 🍼 chu-pe-te
    leche 🥛 le-che
    coche 🚗 co-che
    ocho 8️⃣ o-cho
    noche 🌙 no-che
    mochila 🎒 mo-chi-la
    cuchara 🥄 cu-cha-ra
    # j
    jugo 🧃 ju-go
    jabón 🧼 ja-bón
    jirafa 🦒 ji-ra-fa
    juguete 🧸 ju-gue-te
    jamón 🍖 ja-món
    ojo 👁️ o-jo
    ajo 🧄 a-jo
    hoja 🍃 ho-ja
    oreja 👂 o-re-ja
    conejo 🐰 co-ne-jo
    espejo 🪞 es-pe-jo
    reloj ⌚ re-loj
    # l
    luna 🌙 lu-na
    león 🦁 le-ón
    libro 📖 li-bro
    limón 🍋 li-món
    lobo 🐺 lo-bo
    loro 🦜 lo-ro
    ola 🌊 o-la
    pelota ⚽ pe-lo-ta
    helado 🍦 he-la-do
    paleta 🍭 pa-le-ta
    sol ☀️ sol
    árbol 🌳 ár-bol
    papel 📄 pa-pel
    pastel 🎂 pas-tel
    caracol 🐌 ca-ra-col
    # y / ll
    llave 🔑 lla-ve
    yoyo 🪀 yo-yo
    lluvia 🌧️ llu-via
    yema 🍳 ye-ma
    silla 🪑 si-lla
    pollo 🐔 po-llo
    playa 🏖️ pla-ya
    estrella ⭐ es-tre-lla
    tortilla 🫓 tor-ti-lla
    payaso 🤡 pa-ya-so
    # r suave (tap)
    pera 🍐 pe-ra
    loro 🦜 lo-ro
    oreja 👂 o-re-ja
    jirafa 🦒 ji-ra-fa
    cereza 🍒 ce-re-za
    tijeras ✂️ ti-je-ras
    pájaro 🐦 pá-ja-ro
    naranja 🍊 na-ran-ja
    mar 🌊 mar
    flor 🌸 flor
    doctor 🧑‍⚕️ doc-tor
    tenedor 🍴 te-ne-dor
    collar 📿 co-llar
    # rr fuerte (trill)
    rey 👑 rey
    ropa 👕 ro-pa
    rueda 🛞 rue-da
    rata 🐀 ra-ta
    ratón 🐭 ra-tón
    regalo 🎁 re-ga-lo
    perro 🐕 pe-rro
    zorro 🦊 zo-rro
    gorro 🧢 go-rro
    arroz 🍚 a-rroz
    guitarra 🎸 gui-ta-rra
    pizarra 🧑‍🏫 pi-za-rra
    # más palabras para llenar huecos
    té ☕ té
    diez 🔟 diez
    flan 🍮 flan
    dinero 💵 di-ne-ro
    dibujo 🖼️ di-bu-jo
    durazno 🍑 du-raz-no
    lechuga 🥬 le-chu-ga
    lagarto 🦎 la-gar-to
    linterna 🔦 lin-ter-na
    navidad 🎄 na-vi-dad
    ciudad 🏙️ ciu-dad
    fogata 🔥 fo-ga-ta
    llavero 🔑 lla-ve-ro
    rodilla 🦵 ro-di-lla
    girasol 🌻 gi-ra-sol
    tiburón 🦈 ti-bu-rón
    nadador 🏊 na-da-dor
    chicle 🍬 chi-cle
  `);

  // Apply each word's sound corrections to the same word in the other lists too.
  ['en', 'es'].forEach(function (lang) {
    var fixes = {};
    SG.ARTIC[lang].bank.forEach(function (it) { if (it.fix) fixes[SG.norm(it.word)] = it.fix; });
    Object.keys(SG.ARTIC[lang]).forEach(function (type) {
      SG.ARTIC[lang][type].forEach(function (it) {
        var f = fixes[SG.norm(it.word)];
        if (f && !it.fix) it.fix = f;
      });
    });
  });

  SG.ARTIC_TYPES.bank = { label: 'More real words' };
  SG.SHAPES.bank = 'More real words';
})(window.SG);
