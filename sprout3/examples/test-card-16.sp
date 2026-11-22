-- SPROUT·16's test card (decision 125): colour bars in 512 colours, the ui kit on the wider screen, and a chime from
-- the 16-bit voices. Press 1 to hear the song again.
start : [song : "chime", n : 0]
songs : [
  chime : [
    bpm : 120, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 - - . .", 1]
    harmony : music track ["E4 G4 C5 E5 - - . .", 1]
    bass : music track ["C3 - G2 - C3 - . .", 1]
  ]
]
update : [g | again : g input pressed "one", g with [n : g n + 1, song : again ["again [g n]"] else ["chime"]]]
blob : ["..kk..", ".kwwk.", "kwwwwk", "kwwwwk", ".kwwk.", "..kk.."]
draw : [g |
  clear #000000
  range 32 each [i | rect [i * 10, 20, 10, 60, rgb [i * 8, 40, 255 - (i * 8)]]]
  range 32 each [i | rect [i * 10, 80, 10, 30, rgb [255, i * 8, 0]]]
  ui banner ["SPROUT 16", 140, 16, #ffcc00]
  ui strip ["320 X 224", "512 COLOURS", "ECHO", #000000, #e8202c]
  sprite [blob, 148, 168, [k : #000000, w : #ffffff], false, 4]
  ui blink ["PRESS 1 FOR THE CHIME", 210, #ffffff, g clock]
]
