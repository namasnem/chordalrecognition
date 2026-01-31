import { useEffect, useMemo, useState } from "react";
import KeyboardModal, { KeyboardMode } from "./components/KeyboardModal";
import MidiConnector from "./components/MidiConnector";
import {
  buildChordMap,
  parseCsv,
  pcToCanonical,
  setDifference,
  setFromArray,
  setIsSubset,
  type ChordDef,
} from "./lib/chords";
import csvUrl from "./chords/chord_dictionary.csv?url";
import "./App.css";

type AnswerResult = {
  isCorrect: boolean;
  extra: number[];
  missing: number[];
  userNotes: string[];
};

export default function App() {
  const [chords, setChords] = useState<Record<string, ChordDef>>({});
  const [targetSymbol, setTargetSymbol] = useState("Cm7");
  const [inputNotesPc, setInputNotesPc] = useState<Set<number>>(new Set());
  const [omittedNotesPc, setOmittedNotesPc] = useState<Set<number>>(new Set());
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("input");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error(`Failed to load chord dictionary: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const parsed = parseCsv(text);
        if (!parsed || parsed.length === 0) {
          throw new Error("Chord dictionary is empty or invalid");
        }
        const mapped = buildChordMap(parsed);
        setChords(mapped);
        if (!mapped[targetSymbol]) {
          const firstSymbol = parsed[0]?.symbol;
          if (firstSymbol) {
            setTargetSymbol(firstSymbol);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load chord dictionary";
        setLoadError(message);
        console.error("CSV load error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const targetChord = chords[targetSymbol];

  const inputNotes = useMemo(
    () => Array.from(inputNotesPc).sort((a, b) => a - b).map(pcToCanonical),
    [inputNotesPc]
  );

  const omittedNotes = useMemo(
    () => Array.from(omittedNotesPc).sort((a, b) => a - b).map(pcToCanonical),
    [omittedNotesPc]
  );

  const toggleNote = (pc: number, target: "input" | "omitted") => {
    if (target === "input") {
      setInputNotesPc((prev) => {
        const next = new Set(prev);
        if (next.has(pc)) {
          next.delete(pc);
        } else {
          next.add(pc);
        }
        return next;
      });
    } else {
      setOmittedNotesPc((prev) => {
        const next = new Set(prev);
        if (next.has(pc)) {
          next.delete(pc);
        } else {
          next.add(pc);
        }
        return next;
      });
    }
  };

  const handleAnswer = () => {
    if (!targetChord) {
      return;
    }

    const targetSetPc = setFromArray(targetChord.notesNeutralPc);
    const allowedMissingPc = new Set([...targetChord.omitNeutralPc, ...omittedNotesPc]);
    const userSetPc = inputNotesPc;

    const extra = setDifference(userSetPc, targetSetPc);
    const missing = setDifference(targetSetPc, userSetPc);
    const isCorrect = extra.length === 0 && setIsSubset(new Set(missing), allowedMissingPc);

    setAnswerResult({
      isCorrect,
      extra,
      missing,
      userNotes: inputNotes,
    });
  };

  const omittedSuggestions = targetChord?.omitNeutralPc ?? [];

  return (
    <div className="app">
      <div className="card">
        <h1>Chordal Recognition</h1>
        {loadError && (
          <div className="error-banner">
            <strong>Error:</strong> {loadError}
          </div>
        )}
        {isLoading ? (
          <div className="loading-message">Loading chord dictionary...</div>
        ) : (
          <>
        <div className="target-chord">{targetSymbol}</div>

        <div className="label">Input Chord</div>
        <div className="chip-row">
          {inputNotes.length === 0 ? (
            <span className="chip chip-empty">Select notes</span>
          ) : (
            inputNotes.map((note) => (
              <span key={note} className="chip">
                {note}
              </span>
            ))
          )}
        </div>

        <button className="action-button" type="button" onClick={() => setIsKeyboardOpen(true)}>
          Open Keyboard Interface
        </button>

        <MidiConnector onNoteOn={(pc) => toggleNote(pc, "input")} />

        <button className="action-button strong" type="button" onClick={handleAnswer}>
          Answer
        </button>

        <div className="label">Input Commonly Omitted Chords</div>
        <div className="chip-row">
          {omittedSuggestions.length === 0 ? (
            <span className="chip chip-empty">No suggested omissions</span>
          ) : (
            omittedSuggestions.map((pc) => {
              const note = pcToCanonical(pc);
              const selected = omittedNotesPc.has(pc);
              return (
                <button
                  key={note}
                  type="button"
                  className={selected ? "chip selectable selected" : "chip selectable"}
                  onClick={() => toggleNote(pc, "omitted")}
                >
                  {note}
                </button>
              );
            })
          )}
        </div>

        {omittedNotes.length > 0 && (
          <div className="omitted-summary">Omitted selected: {omittedNotes.join(" ")}</div>
        )}

        {answerResult && targetChord && (
          <div className="answer-panel">
            <div className={answerResult.isCorrect ? "answer-status correct" : "answer-status incorrect"}>
              {answerResult.isCorrect ? "Correct" : "Incorrect"}
            </div>
            <div className="answer-grid">
              <div>
                <h3>Chord Details</h3>
                <p>
                  <strong>Spelled:</strong> {targetChord.notesSpelled.join(" ") || "—"}
                </p>
                <p>
                  <strong>Neutral:</strong> {targetChord.notesNeutral.join(" ") || "—"}
                </p>
                <p>
                  <strong>Commonly omitted (spelled):</strong> {targetChord.omitSpelled.join(" ") || "—"}
                </p>
                <p>
                  <strong>Commonly omitted (neutral):</strong> {targetChord.omitNeutral.join(" ") || "—"}
                </p>
              </div>
              <div>
                <h3>Your Input</h3>
                <p>
                  <strong>Input notes:</strong> {answerResult.userNotes.join(" ") || "—"}
                </p>
                <p>
                  <strong>Extra notes:</strong> {answerResult.extra.map(pcToCanonical).join(" ") || "—"}
                </p>
                <p>
                  <strong>Missing notes:</strong> {answerResult.missing.map(pcToCanonical).join(" ") || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      <KeyboardModal
        isOpen={isKeyboardOpen}
        mode={keyboardMode}
        onClose={() => setIsKeyboardOpen(false)}
        onModeChange={setKeyboardMode}
        onToggleNote={(pc) => toggleNote(pc, keyboardMode)}
      />
    </div>
  );
}
