-- music: notes, scales and chords, and keeping time: the frequency of a note for beep, notes by name ("C4", "F#3",
-- "Bb5") or by MIDI number (A4 is 69), scales and chords from a root, transposing, and beats, bars and snapping times
-- to the beat.

letters : [["C", 0], ["D", 2], ["E", 4], ["F", 5], ["G", 7], ["A", 9], ["B", 11]]
sharps : ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
scale-steps : [
  major : [0, 2, 4, 5, 7, 9, 11], minor : [0, 2, 3, 5, 7, 8, 10], pentatonic : [0, 2, 4, 7, 9], minor-pentatonic : [0, 3, 5, 7, 10]
  blues : [0, 3, 5, 6, 7, 10], chromatic : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
]
chord-steps : [
  major : [0, 4, 7], minor : [0, 3, 7], seventh : [0, 4, 7, 10], major-seventh : [0, 4, 7, 11], minor-seventh : [0, 3, 7, 10]
  diminished : [0, 3, 6], augmented : [0, 4, 8], sus4 : [0, 5, 7]
]

-- the MIDI number of a note name
-- e.g. music midi "A4" → 69
-- e.g. music midi "C#4" → 61
midi : [note |
  cs : note chars
  base : letters find [[l, s] | l = (cs @ 1 upper)] @ 2
  shift : match [cs @ 2, ["#", 1, "b", -1, any, 0]]
  octave : cs drop ((shift = 0) [1] else [2]) join "" number
  octave + 1 * 12 + base + shift
]

-- the name of a MIDI number, with sharps
-- e.g. music name-of 61 → C#4
name-of : [m | sharps @ (m % 12 + 1) .. ((m / 12 floor - 1) str)]

-- the frequency of a note, by name or MIDI number, in hertz (for beep)
-- e.g. music frequency "A4" → 440
-- e.g. music frequency "C4" → 261.6255653006
-- e.g. music frequency 81 → 880
frequency : [note | m : (note kind = "number") [note] else [midi note], 2 pow (m - 69 / 12) * 440]

-- the notes of a scale from a root: major, minor, pentatonic, minor-pentatonic, blues or chromatic
-- e.g. music scale ["C4", "major"] → [C4, D4, E4, F4, G4, A4, B4]
-- e.g. music scale ["A3", "minor-pentatonic"] → [A3, C4, D4, E4, G4]
scale : [root kind | m : midi root, scale-steps get-in [kind] collect [s | name-of (m + s)]]

-- the notes of a chord from a root: major, minor, seventh, major-seventh, minor-seventh, diminished, augmented or sus4
-- e.g. music chord ["G3", "seventh"] → [G3, B3, D4, F4]
chord : [root kind | m : midi root, chord-steps get-in [kind] collect [s | name-of (m + s)]]

-- a note moved up (or down) some semitones
-- e.g. music transpose ["E4", 3] → G4
transpose : [note steps | name-of (midi note + steps)]

-- how many semitones from one note up to another
-- e.g. music interval ["C4", "G4"] → 7
interval : [a b | midi b - (midi a)]

-- how long one beat lasts at a tempo, in seconds
-- e.g. music beat 120 → 0.5
beat : [bpm | 60 / bpm]

-- which beat it is now, counting from 1
-- e.g. music beat-at [120, 2.6] → 6
beat-at : [bpm now | now * bpm / 60 floor + 1]

-- which bar and which beat in it it is now, as bar x beat
-- e.g. music bar-beat [120, 4, 2.6] → 2x2
bar-beat : [bpm per-bar now | k : now * bpm / 60 floor, pair [k / per-bar floor + 1, k % per-bar + 1]]

-- a time snapped to the nearest step of a beat cut into division parts
-- e.g. music quantize [1.13, 120, 4] → 1.125
quantize : [time bpm division | step : 60 / bpm / division, time / step round * step]

-- notes one beat apart as [time, frequency], ready to play with beep
-- e.g. music melody [["A4", "A5"], 120] → [[0, 440], [0.5, 880]]
melody : [notes bpm | notes numbered collect [[i, n] | [i - 1 * (60 / bpm), frequency n]]]
