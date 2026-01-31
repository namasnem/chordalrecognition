# Codex Instructions — Chordal Recognition App (based on provided mock-up)

## 0) Goal
Build a single-page web application that matches the mock-up layout and teaches/validates chord-tone recognition.

The UI shows a **target chord symbol** (large), the user enters notes (by clicking an on-screen keyboard or via MIDI), then presses **Answer** to see:
- Correct / incorrect
- The chord’s **actual spelled notes** (may include double sharps/flats)
- The chord’s **neutralised notes** (single accidental only) used for matching
- The chord’s **commonly omitted notes** (as notes, not intervals)

Data source: `chord_dictionary.csv` (generated alongside this file).

---

## 1) Required files & tech choice
Use React + TypeScript (Vite or Next.js is fine).

Minimum:
- `src/App.tsx` (or `pages/index.tsx` in Next)
- `src/chords/chord_dictionary.csv` (bundle it or load it as a static asset)
- `src/lib/chords.ts` (CSV parsing + chord matching + note normalisation)
- `src/components/*` (UI components)

Optional but recommended:
- `src/components/KeyboardModal.tsx`
- `src/components/MidiConnector.tsx`

---

## 2) Visual specification (match the mock-up)
### Background
- Full viewport background: very light grey with a subtle dotted pattern.
- Centre a large rounded rectangle “card” (blue fill) with generous padding.
- Card corner radius: large (very rounded, like iOS cards).

### Typography
- Title: `Chordal Recognition` in a serif font (Times/Georgia-like).
- Target chord: very large serif, bold (as in mock-up), centred.

### Sections (vertical order)
1. Title
2. Target chord symbol (large)
3. Label: `Input Chord`
4. Row of green note chips (square-ish rounded rectangles)
5. Button: `Open Keyboard Interface` (red/orange rounded rectangle)
6. Button: `Connect MIDI` (red/orange rounded rectangle)
7. **Answer button** (add; place below the MIDI button; same style family but can be darker/stronger)
8. Label: `Input Commonly Omitted Chords` (keep the label as written in the mock-up)
9. Row of green note chips for omitted notes

### Chips
- Note chips: green background, black text, bold, centred.
- Use fixed chip size (roughly square), with small corner radius.

### Buttons
- Rounded rectangle buttons, red/orange fill, black text.
- Centre aligned, stacked vertically, with spacing.

---

## 3) Data format (CSV)
The file `chord_dictionary.csv` has these columns:
- `chord_symbol` (e.g. `Cm7`, `F#M9#11`, `Baug`, `Eb7b9b13`)
- `root` (e.g. `C`, `F#`, `Eb`)
- `type` (internal type label)
- `notes_spelled` (space-separated note names; may include double accidentals, e.g. `F##`)
- `notes_neutral` (space-separated notes canonicalised to single accidental only, e.g. `G`)
- `commonly_omitted_spelled` (space-separated; may be blank)
- `commonly_omitted_neutral` (space-separated; may be blank)
- `aliases` (optional; ` | ` separated)

**Neutralised notes are what you use for matching user input.**
**Spelled notes are what you reveal after the user presses Answer.**

---

## 4) Note normalisation rules
### Canonical note names for neutral matching
Use this fixed mapping by pitch class:
- 0 C
- 1 C#
- 2 D
- 3 Eb
- 4 E
- 5 F
- 6 F#
- 7 G
- 8 Ab
- 9 A
- 10 Bb
- 11 B

This guarantees: only `#`, `b`, or natural — never double accidentals — and all enharmonic equivalents collapse.

### Input acceptance
User input may arrive as:
- On-screen keyboard taps (you control the names)
- MIDI note numbers (convert to pitch class)
- (Optional) typed text (if you add it later)

Always convert to **pitch class** first, then to canonical names above.

---

## 5) App behaviour
### 5.1 Target chord
- Choose a default target chord at load (e.g. `Cm7`).
- Add a “random chord” feature later if desired; not required.

### 5.2 Input Chord row (top row)
This row is the notes the user is claiming as the chord tones they played/identified.

Implementation:
- Maintain `inputNotesPc: Set<number>` and also a displayed `inputNotesNeutral: string[]` (sorted or insertion-order).
- Tapping a note toggles it (add/remove).
- Display them as green chips.

### 5.3 “Input Commonly Omitted Chords” row (bottom row)
This row represents notes the user is claiming were *omitted* (for learning/analysis), and also allows the app to treat missing tones as acceptable.

Implementation:
- Maintain `omittedNotesPc: Set<number>` similarly.
- The user toggles omitted notes via UI (chips, or by tapping suggestions).

Populate suggestions:
- Once a target chord is selected, fetch its `commonly_omitted_neutral` list from the CSV and display them as suggested chips.
- When the user taps a suggested chip, add it to `omittedNotesPc`.

(You can also show these suggestions before Answer; that’s consistent with the mock-up label.)

### 5.4 Open Keyboard Interface
- Opens a modal with a clickable on-screen piano keyboard.
- Clicking keys toggles notes into the **Input Chord** row by default.
- Add a small toggle inside the modal: `Add to: [Input Chord] / [Omitted Notes]`.

### 5.5 Connect MIDI
Use the Web MIDI API:
- Request access.
- Listen for `noteon` and `noteoff`.
- On `noteon`, add that pitch class to Input Chord set (or “currently held notes” mode).
- Provide a small status line: `MIDI: connected` / `not connected`.

---

## 6) Answer button logic (required)
When the user presses **Answer**:

### 6.1 Load the target chord definition
From the CSV row matching `targetChordSymbol`.

Let:
- `targetSetPc` = pitch classes of `notes_neutral`
- `allowedMissingPc` = pitch classes of `commonly_omitted_neutral` UNION `omittedNotesPc` chosen by user
- `userSetPc` = pitch classes of Input Chord row

### 6.2 Correctness test (simple and robust)
Declare **correct** if all of these hold:
1) `userSetPc` is a subset of `targetSetPc`
2) Any notes missing from `targetSetPc` are all within `allowedMissingPc`

Formally:
- `extra = userSetPc - targetSetPc` must be empty
- `missing = targetSetPc - userSetPc` must be subset of `allowedMissingPc`

(Optionally, enforce a minimum of 2 notes to prevent trivial answers.)

### 6.3 Post-answer reveal (must do this)
Show:
- Target chord symbol (already shown)
- `notes_spelled` exactly as stored (may include `##` or `bb`)
- `notes_neutral` (single accidental)
- `commonly_omitted_spelled` and `commonly_omitted_neutral`

Also show:
- User input neutral notes
- Extra notes (if any)
- Missing notes (if any)

Do NOT neutralise the displayed `notes_spelled` after Answer.

---

## 7) Chord-finding mode (optional but good for the app)
In addition to training “target chord” checking, implement a recogniser:
- Given `userSetPc`, scan all CSV chords and rank candidates.

Ranking idea:
- Score = matchedTonesCount - 2*extraCount - missingNonOmittableCount
- Prefer chords with no extra tones and no missing non-omittable tones.
- Return top 5 candidate chord symbols.

Display candidates after Answer in a small list.

This is optional; the mock-up doesn’t require it, but it aligns with a “Chordal Recognition” tool.

---

## 8) Parsing the CSV
You can parse CSV using:
- A small CSV parser (e.g. `papaparse`) OR
- A minimal custom split (safe because we used simple columns; note strings are space-separated)

Store in a dictionary:
- `bySymbol: Record<string, ChordDef>`

Where `ChordDef` includes:
- `symbol`
- `notesSpelled: string[]`
- `notesNeutral: string[]`
- `omitSpelled: string[]`
- `omitNeutral: string[]`

Convert `notesNeutral` to pitch classes once on load for speed.

---

## 9) Acceptance checklist
- UI visually matches the mock-up: dotted background, big rounded blue card, title, big chord, two input rows, keyboard and MIDI buttons, **Answer button**
- Enharmonic neutralisation uses only single accidentals for matching
- After Answer: display the **actual spelled chord** (including double sharps/flats when present in `notes_spelled`)
- CSV drives chord definitions and omission lists
- Note chips toggle cleanly and always display canonical note names (neutral) in the input rows
