import { useEffect, useRef, useState } from "react";

type MidiConnectorProps = {
  onNoteOn: (pc: number) => void;
};

export default function MidiConnector({ onNoteOn }: MidiConnectorProps) {
  const [status, setStatus] = useState("not connected");
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const createMidiMessageHandler = (callback: (pc: number) => void) => {
    return (event: MIDIMessageEvent) => {
      const [statusByte, note, velocity] = event.data;
      const command = statusByte & 0xf0;
      if (command === 0x90 && velocity > 0) {
        callback(note % 12);
      }
    };
  };

  const attachInputHandlers = (access: MIDIAccess) => {
    access.inputs.forEach((input) => {
      input.onmidimessage = createMidiMessageHandler(onNoteOn);
    });
  };

  const handleConnect = async () => {
    if (!navigator.requestMIDIAccess) {
      setStatus("MIDI not supported");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      midiAccessRef.current = access;
      setStatus("connected");
      
      // Attach handlers to existing inputs
      attachInputHandlers(access);

      // Listen for state changes (devices connected/disconnected after initial request)
      access.onstatechange = (event) => {
        const port = event.port;
        if (port.type === "input") {
          if (port.state === "connected") {
            // Attach handler to newly connected input
            (port as MIDIInput).onmidimessage = createMidiMessageHandler(onNoteOn);
          } else if (port.state === "disconnected") {
            // Clean up handler for disconnected input
            (port as MIDIInput).onmidimessage = null;
          }
        }
      };
    } catch (error) {
      setStatus("connection failed");
      console.error("MIDI connection error:", error);
    }
  };

  // Clean up MIDI access on unmount
  useEffect(() => {
    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
        midiAccessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []);

  return (
    <div className="midi-block">
      <button className="action-button" type="button" onClick={handleConnect}>
        Connect MIDI
      </button>
      <span className="midi-status">MIDI: {status}</span>
    </div>
  );
}
