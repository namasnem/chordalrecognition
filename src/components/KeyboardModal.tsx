import { CANONICAL_NOTES } from "../lib/chords";
import "./KeyboardModal.css";

export type KeyboardMode = "input" | "omitted";

type KeyboardModalProps = {
  isOpen: boolean;
  mode: KeyboardMode;
  onClose: () => void;
  onModeChange: (mode: KeyboardMode) => void;
  onToggleNote: (pc: number) => void;
};

const NOTE_PCS = CANONICAL_NOTES.map((_, index) => index);

export default function KeyboardModal({
  isOpen,
  mode,
  onClose,
  onModeChange,
  onToggleNote,
}: KeyboardModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Keyboard Interface</h2>
          <button className="modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-mode">
          <span>Add to:</span>
          <button
            type="button"
            className={mode === "input" ? "mode-button active" : "mode-button"}
            onClick={() => onModeChange("input")}
          >
            Input Chord
          </button>
          <button
            type="button"
            className={mode === "omitted" ? "mode-button active" : "mode-button"}
            onClick={() => onModeChange("omitted")}
          >
            Omitted Notes
          </button>
        </div>
        <div className="keyboard-grid">
          {NOTE_PCS.map((pc) => (
            <button
              key={pc}
              type="button"
              className="keyboard-key"
              onClick={() => onToggleNote(pc)}
            >
              {CANONICAL_NOTES[pc]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
