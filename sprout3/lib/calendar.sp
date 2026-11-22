-- calendar: dates for apps: how long months are, leap years, a month laid out in weeks for a calendar view, weeks of
-- the year, ages, how long ago something was, the nth weekday of a month, repeating events and Easter. Dates are
-- Sprout's own (2026-11-20), and weeks start on Monday.

week-days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
month-names : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

-- is year a leap year?
-- e.g. calendar leap 2024 → true
-- e.g. calendar leap 1900 → false
leap : [year | (year % 4 = 0) and ((year % 100 != 0) or (year % 400 = 0))]

-- how many days a month has
-- e.g. calendar days-in [2026, 2] → 28
-- e.g. calendar days-in [2024, 2] → 29
days-in : [year month | day-one : date [year, month, 1], day-one add-months 1 - day-one]

-- a date's year, month and day
-- e.g. calendar parts 2026-11-20 → [year : 2026, month : 11, day : 20]
parts : [when | [y, m, d] : when, [year : y, month : m, day : d]]

-- the name of a month, from its number
-- e.g. calendar month-name 11 → November
month-name : [m | month-names @ m]

-- a date's weekday as a number, Monday 1 to Sunday 7
-- e.g. calendar weekday-number 2026-11-20 → 5
weekday-number : [when | week-days index-of (when weekday)]

-- the weeks of a month, for a calendar view: lists of seven days, Monday first, false where a day belongs to the
-- month before or after
-- e.g. calendar month [2026, 11] length → 6
-- e.g. calendar month [2026, 11] @ 1 → [false, false, false, false, false, false, 2026-11-01]
month : [year m |
  day-one : date [year, m, 1]
  cells : range (weekday-number day-one - 1) collect [k | false] .. (range (days-in [year, m]) collect [k | day-one + (k - 1)])
  cells .. (range (7 - (cells length % 7) % 7) collect [k | false]) chunks 7
]

-- the week of the year a date falls in (ISO weeks: week 1 holds the year's first Thursday)
-- e.g. calendar week-of 2026-11-20 → 47
week-of : [when |
  thursday : when + (4 - (weekday-number when))
  [y, m, d] : thursday
  thursday - (date [y, 1, 1]) / 7 floor + 1
]

-- which quarter of the year a date is in
-- e.g. calendar quarter 2026-11-20 → 4
quarter : [when | [y, m, d] : when, m - 1 / 3 floor + 1]

-- how old someone born on one date is on another, in whole years
-- e.g. calendar age [1990-06-15, 2026-11-20] → 36
-- e.g. calendar age [1990-12-25, 2026-11-20] → 35
age : [born today |
  [by, bm, bd] : born
  [y, m, d] : today
  y - by - ((((m < bm) or ((m = bm) and (d < bd)))) [1] else [0])
]

-- how long ago something was, in words, from the seconds since it happened (negative seconds are still to come)
-- e.g. calendar ago 7200 → 2 hours ago
-- e.g. calendar ago 30 → just now
-- e.g. calendar ago -172800 → in 2 days
ago : [seconds |
  s : seconds abs
  units : [[31557600, "year"], [2629800, "month"], [604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"]]
  found : units find [[size, name] | s >= size]
  (found != false) [
    k : s / (found @ 1) floor
    plural : (k = 1) [""] else ["s"]
    said : k str .. " " .. (found @ 2) .. plural
    (seconds < 0) ["in " .. said] else [said .. " ago"]
  ] else ["just now"]
]

-- the nth weekday of a month, such as the fourth Thursday of November; n of -1 is the last one
-- e.g. calendar nth-weekday [2026, 11, "Thursday", 4] → 2026-11-26
-- e.g. calendar nth-weekday [2026, 5, "Monday", -1] → 2026-05-25
nth-weekday : [year m day-name n |
  want : week-days index-of day-name
  (n > 0) [
    day-one : date [year, m, 1]
    day-one + (want - (weekday-number day-one) % 7) + (n - 1 * 7)
  ] else [
    final : date [year, m, 1] add-months 1 - 1
    final - (weekday-number final - want % 7) - (0 - n - 1 * 7)
  ]
]

-- the first date after a day that falls on a weekday
-- e.g. calendar next [2026-11-20, "Monday"] → 2026-11-23
next : [when day-name | gap : week-days index-of day-name - (weekday-number when) % 7, when + ((gap = 0) [7] else [gap])]

-- every date from one to another, both included
-- e.g. calendar days [2026-11-20, 2026-11-23] → [2026-11-20, 2026-11-21, 2026-11-22, 2026-11-23]
days : [from to | range (to - from + 1) collect [k | from + (k - 1)]]

-- how many weekdays, Monday to Friday, there are from one date to another, both included
-- e.g. calendar workdays [2026-11-20, 2026-11-27] → 6
workdays : [from to | days [from, to] count [d | weekday-number d <= 5]]

-- a repeating event: the dates from start, every step days, that fall from one date to another
-- e.g. calendar every [2026-11-02, 14, 2026-11-01, 2026-12-31] → [2026-11-02, 2026-11-16, 2026-11-30, 2026-12-14, 2026-12-28]
every : [start step from to |
  skip : (from - start / step) ceil max 0
  iterate [start + (skip * step), [d | d + step]] take-while [d | d <= to]
]

-- the date of Easter Sunday in a year
-- e.g. calendar easter 2026 → 2026-04-05
-- e.g. calendar easter 2025 → 2025-04-20
easter : [year |
  a : year % 19
  b : year / 100 floor
  c : year % 100
  d : b / 4 floor
  e : b % 4
  f : b + 8 / 25 floor
  g : b - f + 1 / 3 floor
  h : a * 19 + b - d - g + 15 % 30
  i : c / 4 floor
  k : c % 4
  l : e * 2 + 32 + (i * 2) - h - k % 7
  m : a + (h * 11) + (l * 22) / 451 floor
  n : h + l - (m * 7) + 114
  date [year, n / 31 floor, n % 31 + 1]
]

-- is a date a Saturday or a Sunday?
-- e.g. calendar weekend 2026-11-21 → true
weekend : [when | weekday-number when >= 6]

-- the Monday that starts a date's week
-- e.g. calendar week-start 2026-11-20 → 2026-11-16
week-start : [when | when - (weekday-number when - 1)]

-- the last day of a date's month
-- e.g. calendar month-end 2026-02-10 → 2026-02-28
month-end : [when | [y, m, d] : when, date [y, m, 1] add-months 1 - 1]

-- a date written out in full
-- e.g. calendar written 2026-11-20 → Friday 20 November 2026
written : [when | [y, m, d] : when, "[when weekday] [d] [month-names @ m] [y]"]
