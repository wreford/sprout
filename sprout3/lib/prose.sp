-- prose: text tools: slugs and cases for names in code and links, initials, cutting text short, lists and numbers
-- written in English, how far apart two words are, palindromes, sentences and syllables.

plain : "abcdefghijklmnopqrstuvwxyz0123456789" chars

-- text made fit for a web address: lower case, words joined by hyphens
-- e.g. prose slug "Hello, World! 2026" → hello-world-2026
slug : [line | line lower chars collect [c | (plain has c) [c] else [" "]] join "" words join "-"]

-- text in camel case, as many programming languages name things
-- e.g. prose camel "the high score" → theHighScore
camel : [line |
  parts : slug line split "-"
  parts @ 1 .. (parts drop 1 collect [w | w capitalize] join "")
]

-- text in snake case, words joined by underscores
-- e.g. prose snake "The High Score" → the_high_score
snake : [line | slug line replace-all ["-", "_"]]

-- the first letter of each word, in capitals
-- e.g. prose initials "Ada King Lovelace" → AKL
initials : [line | line words collect [w | w chars @ 1 upper] join ""]

-- text cut to at most n letters, ending with … when something was cut
-- e.g. prose truncate ["The quick brown fox", 10] → The quick…
truncate : [line n | (line length <= n) [line] else [line chars take (n - 1) join "" trim .. "…"]]

-- extra spaces taken out: trimmed, and one space between words
-- e.g. prose tidy "  far   too    spaced  " → far too spaced
tidy : [line | line words join " "]

-- items listed in English, with "and" before the last
-- e.g. prose list-of ["tea", "cake", "jam"] → tea, cake and jam
-- e.g. prose list-of ["tea", "cake"] → tea and cake
list-of : [items | shown : items collect [i | i str], (shown length < 2) [shown join ""] else [shown all-but-last join ", " .. " and " .. (shown last)]]

-- a whole number written out in English words
-- e.g. prose spell 42 → forty-two
-- e.g. prose spell 2026 → two thousand and twenty-six
-- e.g. prose spell 1000105 → one million one hundred and five
spell : [n |
  small : ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
  tens : ["ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
  two-digits : [m | (m < 20) [small @ m] else [t : tens @ (m / 10 floor), (m % 10 = 0) [t] else [t .. "-" .. (small @ (m % 10))]]]
  three-digits : [m | h : m / 100 floor, r : m % 100, (h = 0) [two-digits r] else [(r = 0) [small @ h .. " hundred"] else [small @ h .. " hundred and " .. (two-digits r)]]]
  scales : [[1000000000, " billion"], [1000000, " million"], [1000, " thousand"], [1, ""]]
  whole : n abs floor
  groups : scales fold [[remaining : whole, out : []], [acc [size, name] |
    k : acc remaining / size floor
    (k = 0) [acc] else [[remaining : acc remaining % size, out : acc out .. [[k, three-digits k .. name]]]]
  ]] out
  joined : (groups length = 0) ["zero"] else [
    final : groups last
    ((groups length > 1) and (final @ 1 < 100)) [groups all-but-last collect [g | g @ 2] join " " .. " and " .. (final @ 2)] else [groups collect [g | g @ 2] join " "]
  ]
  (n < 0) ["minus " .. joined] else [joined]
]

-- how many letters must be added, taken away or changed to turn one word into another (Levenshtein distance)
-- e.g. prose distance ["kitten", "sitting"] → 3
distance : [a b |
  t : b chars
  a chars numbered fold [range (t length + 1) collect [j | j - 1], [row [i, ch] |
    t numbered fold [[i], [built [j, tc] | built .. [(built last + 1) min (row @ (j + 1) + 1) min (row @ j + ((ch = tc) [0] else [1]))]]]
  ]] last
]

-- how alike two words are, from 0 (nothing alike) to 1 (the same)
-- e.g. prose similar ["night", "nacht"] → 0.6
similar : [a b | longest : a length max (b length), (longest = 0) [1] else [1 - (distance [a, b] / longest)]]

-- does text read the same backwards, ignoring case, spaces and marks?
-- e.g. prose palindrome "Never odd or even" → true
palindrome : [line | letters : line lower chars keep [c | plain has c], letters = (letters reverse)]

-- how many times part appears in text, without overlaps
-- e.g. prose count-of ["banana", "an"] → 2
count-of : [line part | line split part length - 1]

-- the text between two markers, or false if the first isn't there
-- e.g. prose between ["<b>bold</b> move", "<b>", "</b>"] → bold
between : [line opening closing |
  after : line split opening
  (after length >= 2) [after drop 1 join opening split closing @ 1] else [false]
]

-- all but the last n letters hidden
-- e.g. prose mask ["4111111111111111", 4] → ************1111
mask : [line n | "*" repeat (line length - n max 0) .. (line chars drop (line length - n max 0) join "")]

-- the words in the other order
-- e.g. prose reverse-words "one two three" → three two one
reverse-words : [line | line words reverse join " "]

-- text split into sentences
-- e.g. prose sentences "Hi. How are you? Fine!" → [Hi., How are you?, Fine!]
sentences : [line | line find-all [some none-of ".!?", maybe-some one-of ".!?"] collect [s | s trim] keep [s | s != ""]]

-- about how many syllables a word has (a count of its vowel sounds)
-- e.g. prose syllables "beautiful" → 3
-- e.g. prose syllables "table" → 2
syllables : [word |
  w : word lower
  groups : w find-all [some one-of "aeiouy"] length
  silent : (w ends-with "e") and ((w ends-with "le") not) and (groups > 1)
  (silent [groups - 1] else [groups]) max 1
]
