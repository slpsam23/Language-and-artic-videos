# 🗣️ Talk & Play · Habla y Juega

A bilingual (English / Spanish) speech and language game that runs in any web browser (iPad, Chromebook, laptop) and is driven by **YouTube videos** or picture scenes.

It targets:

| Goal | How the game does it |
|---|---|
| **WH comprehension** (who/what/where/when/why) answered in **3–5 words** | The student builds a sentence on an AAC board set up like their own (TouchChat, LAMP, TD Snap, Proloquo2Go) using a **predictable chart frame** ("The ___ is kicking." / "El ___ está pateando."). The answer and the 3–5 word length are checked automatically. |
| **Binary questions** | Big yes/no or this-or-that picture buttons ("Is it a ball or a book?"). |
| **Formulating questions** from a picture scene | "Ask a WHERE question about the picture." The student must start with a question word and use 3–5 words ("Where is the ball?" / "¿Dónde está la pelota?"). |
| **Articulation** | Practice from **sound in isolation** → **syllables** → **words** in English and Spanish. Word types: CVC, VCV, CVCV, **3, 4 and 5 syllables**, **consonant clusters** (s-, l-, r-clusters, 3-consonant and final clusters; Spanish bl, br, pl, tr…), and **R words** (Spanish **tap r suave** and **trill rr fuerte**; English beginning and vocalic R). Filter by target sound, which is highlighted on the card. Each card has a spoken model, a slow syllable model, record and play back, and clinician scoring (correct / close / try again). |
| **Predictable chart writing** | Every correct sentence is added to the lesson's chart with the student's name, so a group builds a chart together. It can be printed. |
| **Data collection** | Every trial is saved with independent / with cues / incorrect. A summary by skill is shown and can be exported as a CSV for IEP progress notes. |

## ✨ Let Claude write the questions (works with Claude Pro)

In **🛠️ Build**, open **"Make a lesson with Claude from a YouTube video"**:

1. Paste the YouTube link and pick the language levels and languages.
2. Copy the transcript from YouTube and paste it in. On youtube.com, click **…more** under the video → **Show transcript** → select the lines → copy. For videos with little talking, add notes about what happens on screen.
3. Press **📋 Copy request**, open Claude, paste, and send. You can also attach screenshots of the video.
4. Paste Claude's answer back and press **✨ Make the lesson**.

**Silent videos (no transcript):** in step 2 choose **🤫 Silent video**:
1. Press **▶ Load video** and play it.
2. Tap **📍 Mark this moment** at each moment you want a question about, and type or dictate what happens ("the dog jumps in the pool"). The exact times are saved, so the finished lesson pauses there.
3. **On a computer (Chrome or Edge):** press **📸 Turn on picture capture** and choose "This tab". Each mark then also saves a picture of the video. **📋 Copy picture sheet** (or Download) gives you one numbered image to attach in Claude, so Claude can see the scenes.
4. **On an iPad:** screen capture isn't allowed. Take a screenshot (top button + volume up) at each mark and attach those in Claude instead.

You get a draft lesson that stops at the right times, in English and Spanish, with questions for each level. **Check every question before saving.** Only the video's words go to Claude, never student names or data.

### Language levels

Set each student's level in **⚙️ → Student setup**. Each question can be tagged with a level, either by Claude or in the activity editor. A student only gets questions at their level, plus untagged ones.

| Level | Questions |
|---|---|
| 1 – Emerging | Yes/no, this-or-that, concrete *what/who*; 1–2 word answers |
| 2 – Developing | *who, what, where*; 3-word answers |
| 3 – Expanding | adds *when* and asking questions; 3–5 word answers |
| 4 – Advanced | *why/how*, predicting, inferring; 4–6 word answers |

### Copy the student's real board

In **⚙️ → Customize the board → 📸 Fill the board from screenshots or a typed list**:

- **From screenshots:** screenshot the home page (and folders) on the student's device. Copy the request, attach the screenshots in Claude, and paste the answer back.
- **Typed list (no AI):** one line per row of buttons, separated by commas. You can also paste from a spreadsheet.

Then fix any differences with the button editor.

## Articulation tips

- **Sound in isolation:** the computer voice can't say a sound by itself (it says "ess" for *s*). So press **🎙️ Record your model** once per sound. Your recording is saved on that device and plays as the model every time. **🐢 In syllables** plays the sound in syllables instead.
- **Tap vs. trill:** choose Español → *Target sound* → **r suave – tap** or **rr fuerte – trill**. Words are sorted by Spanish rules: trill at the start of a word, after *n/l/s*, or written *rr*; tap everywhere else.
- **Add your own words** in `js/data/artic-more.js` (multisyllabic, clusters, R words) or `js/data/artic-words.js` (CVC, VCV, CVCV).

## Real pictures instead of emoji

In **🛠️ Build**, press **📷 Upload picture** for the lesson's scene. Each question can also have its own picture, so a story can have a new scene for every question. Pictures are shrunk automatically and saved inside the lesson. Video lessons use the paused video as the picture.

Where to get pictures:
- **Your own photos.** On an iPad, the upload button can open the camera or photo library.
- **Screenshots** from the YouTube video.
- **An AI picture maker.** Claude writes a picture description with each lesson (shown under the picture field). Copy it into a free image tool such as Microsoft Designer / Copilot, Google Gemini, ChatGPT, Canva, or Adobe Express, then upload the result. Claude itself doesn't make pictures.
- **Your district's symbol or scene library** (Boardmaker, SymbolStix, etc.), if you have a license.

Uploaded pictures aren't included in share links, because they would make the link too long. Use **⬇️ Export JSON** to share lessons with pictures.

## How YouTube makes it dynamic

Each lesson can be linked to **any YouTube video**. You add questions at timestamps. The video plays, **pauses itself at each timestamp**, shows the question with the AAC board, and continues after the student answers. The paused video frame becomes the picture scene. Questions without a timestamp are asked after the video ends.

To make a lesson (no coding needed):

1. Open the **🛠️ Build** tab.
2. Paste a YouTube link and press **Load video**.
3. Play the video and pause where you want a question.
4. Click **+ WH question**, **+ Yes/No or choice**, **+ Ask-a-question**, or **+ Articulation word**, then press **⏱ Use current video time**.
5. Fill in the English and Spanish text and tick the correct answer.
6. Press **💾 Save lesson**.

**Sharing:** **🔗 Copy share link** puts the whole lesson inside a link, so families can practice at home with no account. **⬇️ Export JSON** / **⬆️ Import lessons** move lessons between devices.

## Matching the student's AAC system

Open **⚙️ Settings** (or tap the 🗂️ button at the top). Pick:

- **AAC program**, which sets how the board behaves:
  - **TouchChat (WordPower)**: category folders, returns to Home after each word, activity-word row on.
  - **LAMP Words for Life**: words stay in fixed spots for motor planning, activity-word row off, 84 Full or 84 1-Hit.
  - **TD Snap Motor Plan**: fixed spots, activity-word row off.
  - **TD Snap Core First**: expandable grids.
  - **Proloquo2Go (Crescendo)**: many grid sizes.
  - **Other**: your own board.
- **Grid size**: common sizes for that program, or **Custom rows × columns** to match the device exactly.
- **Language**:
  - **English**, or **Español**.
  - **Both**: a 🇺🇸/🇲🇽 switch appears on the board, and questions are shown in both languages.
- **Layout**: core words + category folders (2-hit), or all words on one page (1-hit).
- **Activity-word row**: on or off. Turn it off to make the student find words through their motor plan. Lesson words that aren't on the board then appear under **⭐ Lesson words**.

**Each student gets their own setup.** Type the student's name at the top first, and their program, grid, language, and buttons are saved for them.

**Customize the board** (below the AAC settings):
- Tap any button to change its word, picture, or color.
- Turn a button into a folder, or add new pages.
- Use **↔ Swap with…** to move words to the same spots as on the student's device.
- English and Spanish boards are edited separately.

These are practice layouts in the *style* of each program. They are not the official vocabulary files from PRC-Saltillo, Tobii Dynavox, or AssistiveWare, so the starting word positions won't match the device until you customize them.

If the student uses their real device during the game, turn on **"Student answers on their own AAC device"**. The on-screen board is hidden and you score each answer.

## Settings

- **Support levels:**
  1. The frame is already filled in and the student picks the answer word.
  2. The model chart is shown and the student builds the whole sentence.
  3. Independent, with no model (a Help button is still available).
- Spoken feedback for each word, reading questions aloud automatically, speech rate, and the English and Spanish voices.

After 2 missed tries, the model with the answer appears so the student can copy it. That trial is recorded as "with cues."

## Put it online with GitHub Pages (free)

1. On GitHub, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**, then select the branch and the `/ (root)` folder. Save.
3. After about a minute your game is live at `https://<your-username>.github.io/Language-and-artic-videos/`.

Pages must use **https** so the microphone (recording) and YouTube work.

To try it on your own computer, run `python3 -m http.server` in this folder and open http://localhost:8000. Opening `index.html` directly as a file can stop YouTube videos from playing.

## Customizing

| File | What to change |
|---|---|
| `js/data/lessons.js` | Built-in lessons for everyone (paste exported JSON here) |
| `js/data/vocab.js` | Starting AAC words and categories, English and Spanish |
| `js/aac.js` | AAC program presets and grid sizes |
| `js/data/artic-words.js` | CVC / VCV / CVCV word lists |
| `css/styles.css` | Colors and sizes |

Privacy: everything (lessons, charts, data) is saved only in the browser on that device. Nothing is sent to a server. The exception is YouTube, which loads the videos (using the privacy-enhanced `youtube-nocookie.com` player).
