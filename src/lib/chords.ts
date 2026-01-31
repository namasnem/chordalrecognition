export type ChordDef = {
  symbol: string;
  notesSpelled: string[];
  notesNeutral: string[];
  omitSpelled: string[];
  omitNeutral: string[];
  notesNeutralPc: number[];
  omitNeutralPc: number[];
};

const LETTER_TO_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const PC_TO_CANONICAL: Record<number, string> = {
  0: "C",
  1: "C#",
  2: "D",
  3: "Eb",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "Ab",
  9: "A",
  10: "Bb",
  11: "B",
};

export const CANONICAL_NOTES = Object.values(PC_TO_CANONICAL);

export function pcToCanonical(pc: number): string {
  return PC_TO_CANONICAL[((pc % 12) + 12) % 12];
}

export function noteToPc(note: string): number {
  if (!note) {
    return 0;
  }
  const letter = note[0]?.toUpperCase();
  const base = LETTER_TO_PC[letter] ?? 0;
  let offset = 0;
  for (const char of note.slice(1)) {
    if (char === "#") {
      offset += 1;
    } else if (char === "b") {
      offset -= 1;
    }
  }
  return ((base + offset) % 12 + 12) % 12;
}

export function normalizeNotes(notes: string[]): string[] {
  return notes.map((note) => pcToCanonical(noteToPc(note)));
}

export function parseCsv(csvText: string): ChordDef[] {
  const lines = csvText.trim().split(/\r?\n/);
  const [, ...rows] = lines;
  return rows
    .map((row) => row.split(","))
    .filter((parts) => parts.length >= 7)
    .map((parts) => {
      const [symbol, , , notesSpelledRaw, notesNeutralRaw, omitSpelledRaw, omitNeutralRaw] = parts;
      const notesSpelled = notesSpelledRaw ? notesSpelledRaw.split(" ").filter(Boolean) : [];
      const notesNeutral = notesNeutralRaw ? notesNeutralRaw.split(" ").filter(Boolean) : [];
      const omitSpelled = omitSpelledRaw ? omitSpelledRaw.split(" ").filter(Boolean) : [];
      const omitNeutral = omitNeutralRaw ? omitNeutralRaw.split(" ").filter(Boolean) : [];
      const notesNeutralPc = notesNeutral.map(noteToPc);
      const omitNeutralPc = omitNeutral.map(noteToPc);
      return {
        symbol,
        notesSpelled,
        notesNeutral,
        omitSpelled,
        omitNeutral,
        notesNeutralPc,
        omitNeutralPc,
      };
    });
}

export function buildChordMap(chords: ChordDef[]): Record<string, ChordDef> {
  return chords.reduce<Record<string, ChordDef>>((acc, chord) => {
    acc[chord.symbol] = chord;
    return acc;
  }, {});
}

export function setFromArray(values: number[]): Set<number> {
  return new Set(values);
}

export function setDifference(a: Set<number>, b: Set<number>): number[] {
  return Array.from(a).filter((item) => !b.has(item));
}

export function setIsSubset(a: Set<number>, b: Set<number>): boolean {
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}
