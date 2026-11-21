-- format: numbers and text made ready to show.

-- a whole number with commas between the thousands
-- e.g. format commas 1234567
commas : [n |
  groups : n abs round str reverse chars chunks 3 collect [g | g join "" reverse]
  sign : n < 0 ["-"] else [""]
  sign .. (groups reverse join ",")
]

-- a number with a fixed number of places after the point
-- e.g. format places [3.14159, 2]
places : [n count | n fixed count]

-- a share from 0 to 1 as a percent
-- e.g. format percent 0.256
percent : [x | x * 100 round str .. "%"]

-- 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th, 21st
-- e.g. format ordinal 22
ordinal : [n |
  tens : n % 100
  ending : cond [tens between [11, 13], "th", n % 10 = 1, "st", n % 10 = 2, "nd", n % 10 = 3, "rd", any, "th"]
  n str .. ending
]

-- a count and a word, with an s when there isn't exactly one
-- e.g. format plural [3, "apple"]
plural : [n word | n = 1 ["1 [word]"] else ["[n] [word]s"]]

-- seconds as m:ss, or h:mm:ss past an hour
-- e.g. format clock 3725
clock : [seconds |
  whole : seconds round
  two : [n | n str pad-left [2, "0"]]
  h : whole / 3600 floor
  m : whole % 3600 / 60 floor
  h > 0 ["[h]:[two m]:[two (whole % 60)]"] else ["[m]:[two (whole % 60)]"]
]

-- text broken into lines no longer than width, at spaces
-- e.g. format wrap ["the quick brown fox jumps over the lazy dog", 12]
wrap : [words-text width |
  words-text words fold [[], [lines word |
    lines length = 0 [[word]] else [
      current : lines last
      current length + 1 + (word length) <= width [lines all-but-last .. [current .. " " .. word]] else [lines .. [word]]
    ]
  ]]
]

-- text in the middle of a line width wide
-- e.g. format centre ["hi", 6]
centre : [line width |
  room : width - (line length) max 0
  " " repeat (room / 2 floor) .. line .. (" " repeat (room / 2 ceil))
]

-- Every Word Capitalized
-- e.g. format title "the sprout standard library"
title : [line | line words collect [w | w capitalize] join " "]

-- a bar of blocks, value out of most, width wide
-- e.g. format bar [3, 4, 8]
bar : [value most width | filled : clamp [value / most * width round, 0, width], "#" repeat filled .. ("." repeat (width - filled))]
