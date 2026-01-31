import { useEffect, useRef } from "react";
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management: focus the modal when it opens
  useEffect(() => {
    if (!isOpen) return;

    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <h2 id="modal-title">Keyboard Interface</h2>
          <button 
            className="modal-close" 
            type="button" 
            onClick={onClose}
            aria-label="Close keyboard interface"
          >
            Close
          </button>
        </div>
        <div className="modal-mode" role="group" aria-label="Selection mode">
          <span id="mode-label">Add to:</span>
          <button
            type="button"
            className={mode === "input" ? "mode-button active" : "mode-button"}
            onClick={() => onModeChange("input")}
            aria-pressed={mode === "input"}
            aria-describedby="mode-label"
          >
            Input Chord
          </button>
          <button
            type="button"
            className={mode === "omitted" ? "mode-button active" : "mode-button"}
            onClick={() => onModeChange("omitted")}
            aria-pressed={mode === "omitted"}
            aria-describedby="mode-label"
          >
            Omitted Notes
          </button>
        </div>
        <div className="keyboard-grid" role="group" aria-label="Note selection keyboard">
          {NOTE_PCS.map((pc) => (
            <button
              key={pc}
              type="button"
              className="keyboard-key"
              onClick={() => onToggleNote(pc)}
              aria-label={`Toggle note ${CANONICAL_NOTES[pc]}`}
            >
              {CANONICAL_NOTES[pc]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
