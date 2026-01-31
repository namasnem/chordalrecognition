import { useState } from "react";

type MidiConnectorProps = {
  onNoteOn: (pc: number) => void;
};

export default function MidiConnector({ onNoteOn }: MidiConnectorProps) {
  const [status, setStatus] = useState("not connected");

  const handleConnect = async () => {
    if (!navigator.requestMIDIAccess) {
      setStatus("MIDI not supported");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      setStatus("connected");
      access.inputs.forEach((input) => {
        input.onmidimessage = (event) => {
          const [statusByte, note, velocity] = event.data;
          const command = statusByte & 0xf0;
          if (command === 0x90 && velocity > 0) {
            onNoteOn(note % 12);
          }
        };
      });
    } catch (error) {
      setStatus("connection failed");
    }
  };

  return (
    <div className="midi-block">
      <button className="action-button" type="button" onClick={handleConnect}>
        Connect MIDI
      </button>
      <span className="midi-status">MIDI: {status}</span>
    </div>
  );
}
