# 🗣️ Talk & Play · Habla y Juega

A bilingual (English / Spanish) speech and language game that runs in any web browser (iPad, Chromebook, laptop) and is driven by **YouTube videos** or picture scenes.

It targets:

| Goal | How the game does it |
|---|---|
| **WH comprehension** (who/what/where/when/why) answered in **3–5 words** | The student builds a sentence on a TouchChat-style AAC board using a **predictable chart frame** ("The ___ is kicking." / "El ___ está pateando."). The answer and the 3–5 word length are checked automatically. |
| **Binary questions** | Big yes/no or this-or-that picture buttons ("Is it a ball or a book?"). |
| **Formulating questions** from a picture scene | "Ask a WHERE question about the picture." The student must start with a question word and use 3–5 words ("Where is the ball?" / "¿Dónde está la pelota?"). |
| **Articulation: CVC, VCV, CVCV** | Word cards in English and Spanish with a spoken model, slow syllable model, record and play back, and clinician scoring (correct / close / try again). |
| **Predictable chart writing** | Every correct sentence is added to the lesson's chart with the student's name, so a group builds a chart together. It can be printed. |
| **Data collection** | Every trial is saved with independent / with cues / incorrect. A summary by skill is shown and can be exported as a CSV for IEP progress notes. |

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

## Using it with a real TouchChat device

The on-screen board uses the Modified Fitzgerald Key colors and core words, like TouchChat:
- Yellow: people
- Green: actions
- Orange: things
- Blue: describing words
- Purple: questions

Press **🇺🇸 EN / 🇲🇽 ES** on the board to switch languages.

If the student uses their own device, open **⚙️ Settings** and turn on **"Student answers on their own TouchChat device"**. The on-screen board is hidden and you score each answer with the clinician buttons.

## Settings

- **Prompt language:** bilingual, English only, or Spanish only.
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
| `js/data/vocab.js` | AAC board words and categories, English and Spanish |
| `js/data/artic-words.js` | CVC / VCV / CVCV word lists |
| `css/styles.css` | Colors and sizes |

Privacy: everything (lessons, charts, data) is saved only in the browser on that device. Nothing is sent to a server. The exception is YouTube, which loads the videos (using the privacy-enhanced `youtube-nocookie.com` player).
