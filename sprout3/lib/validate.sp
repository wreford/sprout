-- validate: checks on what people type, before it's used: email and web addresses, card numbers and ISBNs with their
-- check digits, numbers, real dates, phone numbers, colour codes, IP addresses, usernames, lengths and how strong a
-- password is. Each answers true or false, except password-gaps, which says what a password still needs.

-- does text look like an email address?
-- e.g. validate email "ada@example.com" → true
-- e.g. validate email "ada@example" → false
email : [line | line trim parse [some none-of "@ ", "@", some none-of "@ .", some [".", some none-of "@ ."]]]

-- does a card number pass the Luhn check? Spaces and dashes are ignored
-- e.g. validate luhn "4111 1111 1111 1111" → true
-- e.g. validate luhn "4111 1111 1111 1112" → false
luhn : [line |
  ds : line chars keep [c | (c != " ") and (c != "-")]
  ok : (ds length >= 2) and (ds all [c | "0123456789" chars has c])
  ok [ds reverse numbered collect [[i, c] | v : c number, (i % 2 = 0) [v * 2 - ((v * 2 > 9) [9] else [0])] else [v]] sum % 10 = 0] else [false]
]

-- is text an ISBN, 10 or 13 digits long, with the right check digit? Dashes and spaces are ignored
-- e.g. validate isbn "978-0-306-40615-7" → true
-- e.g. validate isbn "0-306-40615-2" → true
-- e.g. validate isbn "0-306-40615-3" → false
isbn : [line |
  ds : line upper chars keep [c | "0123456789X" chars has c]
  vals : ds collect [c | (c = "X") [10] else [c number]]
  thirteen : (ds length = 13) and ((ds has "X") not) and (vals numbered collect [[i, v] | v * ((i % 2 = 0) [3] else [1])] sum % 10 = 0)
  ten : (ds length = 10) and ((ds take 9 has "X") not) and (vals numbered collect [[i, v] | v * (11 - i)] sum % 11 = 0)
  thirteen or ten
]

-- does text look like a web address, http or https, with a host?
-- e.g. validate url "https://taskiap.com/sprout3/" → true
-- e.g. validate url "taskiap dot com" → false
url : [line | line trim parse ["http", maybe "s", "://", some none-of "/ .", some [".", some none-of "/ ."], maybe-some any-char]]

-- is text a number?
-- e.g. validate numeric "-3.14" → true
-- e.g. validate numeric "3.14.15" → false
numeric : [line | line number != false]

-- is text a whole number?
-- e.g. validate integer "-42" → true
-- e.g. validate integer "4.2" → false
integer : [line | line trim parse [maybe "-", some digit]]

-- is text a real date, written year-month-day?
-- e.g. validate real-date "2024-02-29" → true
-- e.g. validate real-date "2026-02-29" → false
real-date : [line |
  found : line trim parse [repeat [4, digit] as "year", "-", repeat [2, digit] as "month", "-", repeat [2, digit] as "day"]
  (found != false) [
    yy : found year number
    mm : found month number
    dd : found day number
    (mm >= 1) and (mm <= 12) [(dd >= 1) and (dd <= (calendar days-in [yy, mm]))] else [false]
  ] else [false]
]

-- does text look like a phone number: 8 to 15 digits, with spaces, dashes, brackets or a leading +?
-- e.g. validate phone "+61 412 345 678" → true
phone : [line |
  ds : line chars keep [c | "0123456789" chars has c]
  (line chars all [c | "0123456789 -()+" chars has c]) and (ds length >= 8) and (ds length <= 15)
]

-- is text a colour written #rgb or #rrggbb?
-- e.g. validate colour-code "#ff8800" → true
-- e.g. validate colour-code "#ff88" → false
colour-code : [line | line lower parse ["#", one-of [repeat [6, one-of "0123456789abcdef"], repeat [3, one-of "0123456789abcdef"]]]]

-- is text an IP address: four numbers from 0 to 255, with dots between?
-- e.g. validate ip "192.168.0.1" → true
-- e.g. validate ip "256.1.1.1" → false
ip : [line | parts : line split ".", (parts length = 4) and (parts all [p | (p parse [some digit]) [p number <= 255] else [false]])]

-- is text a username: 3 to 20 letters, digits or underscores, starting with a letter?
-- e.g. validate username "ada_99" → true
-- e.g. validate username "9lives" → false
username : [line | (line length >= 3) and (line length <= 20) and (line parse [letter, maybe-some one-of [letter-or-digit, "_"]])]

-- is something filled in: not empty and not only spaces?
-- e.g. validate filled "  " → false
filled : [line | line trim != ""]

-- is text's length within bounds, a pair of fewest x most?
-- e.g. validate fits ["Ada", 3x20] → true
fits : [line bounds | (line length >= (bounds x)) and (line length <= (bounds y))]

-- what a password still needs to be strong, in words; nothing when it's strong
-- e.g. validate password-gaps "hunter2" → [at least 12 characters, a capital letter, a symbol]
-- e.g. validate password-gaps "Correct-Horse-7" → []
password-gaps : [secret |
  cs : secret chars
  checks : [
    [secret length >= 12, "at least 12 characters"]
    [cs count [c | (c lower = c) and (c upper != c)] > 0, "a small letter"]
    [cs count [c | (c upper = c) and (c lower != c)] > 0, "a capital letter"]
    [cs count [c | "0123456789" chars has c] > 0, "a digit"]
    [cs count [c | (c lower = (c upper)) and (("0123456789 " chars has c) not)] > 0, "a symbol"]
  ]
  checks keep [[ok, said] | ok not] collect [[ok, said] | said]
]

-- is a password strong, needing nothing more?
-- e.g. validate strong "Correct-Horse-7" → true
strong : [secret | password-gaps secret = []]
