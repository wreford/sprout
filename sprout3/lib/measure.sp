-- measure: units and conversions between them: lengths, weights, volumes, areas, times, speeds and sizes of data,
-- with temperatures and angles. A unit is a short name such as "km", "mi", "lb", "cup" or "km/h"; cups, pints and
-- gallons are American, "uk-pt" and "uk-gal" British. Each unit is kept as its name, how many of the kind's base unit
-- it is (metres, kilograms, litres, square metres, seconds, metres a second, bytes) and what it measures.

table : [
  ["mm", 0.001, "length"], ["cm", 0.01, "length"], ["m", 1, "length"], ["km", 1000, "length"], ["in", 0.0254, "length"]
  ["ft", 0.3048, "length"], ["yd", 0.9144, "length"], ["mi", 1609.344, "length"], ["nmi", 1852, "length"]
  ["mg", 0.000001, "weight"], ["g", 0.001, "weight"], ["kg", 1, "weight"], ["t", 1000, "weight"], ["oz", 0.028349523125, "weight"]
  ["lb", 0.45359237, "weight"], ["st", 6.35029318, "weight"]
  ["ml", 0.001, "volume"], ["l", 1, "volume"], ["tsp", 0.00492892159375, "volume"], ["tbsp", 0.01478676478125, "volume"]
  ["floz", 0.0295735295625, "volume"], ["cup", 0.2365882365, "volume"], ["pt", 0.473176473, "volume"], ["qt", 0.946352946, "volume"]
  ["gal", 3.785411784, "volume"], ["uk-pt", 0.56826125, "volume"], ["uk-gal", 4.54609, "volume"]
  ["cm2", 0.0001, "area"], ["m2", 1, "area"], ["ha", 10000, "area"], ["km2", 1000000, "area"], ["sqft", 0.09290304, "area"]
  ["acre", 4046.8564224, "area"], ["sqmi", 2589988.110336, "area"]
  ["ms", 0.001, "time"], ["s", 1, "time"], ["min", 60, "time"], ["h", 3600, "time"], ["day", 86400, "time"], ["week", 604800, "time"]
  ["year", 31557600, "time"]
  ["m/s", 1, "speed"], ["km/h", 0.2777777777777778, "speed"], ["mph", 0.44704, "speed"], ["knot", 0.5144444444444445, "speed"], ["ft/s", 0.3048, "speed"]
  ["B", 1, "data"], ["KB", 1024, "data"], ["MB", 1048576, "data"], ["GB", 1073741824, "data"], ["TB", 1099511627776, "data"]
]

-- value in one unit turned into another of the same kind (false if they measure different things)
-- e.g. measure convert [10, "km", "mi"] → 6.2137119224
-- e.g. measure convert [2, "cup", "ml"] → 473.176473
-- e.g. measure convert [1, "kg", "km"] → false
convert : [value from to |
  a : table find [u | u @ 1 = from]
  b : table find [u | u @ 1 = to]
  ((a != false) and (b != false)) [(a @ 3 = (b @ 3)) [value * (a @ 2) / (b @ 2)] else [false]] else [false]
]

-- what a unit measures
-- e.g. measure kind-of "knot" → speed
kind-of : [unit | found : table find [u | u @ 1 = unit], (found != false) [found @ 3] else [false]]

-- the units for one kind of thing, smallest first, for a picker
-- e.g. measure units "length" → [mm, cm, m, km, in, ft, yd, mi, nmi]
units : [kind | table keep [u | u @ 3 = kind] collect [u | u @ 1]]

-- a temperature turned from one scale to another: "C", "F" or "K"
-- e.g. measure temperature [100, "C", "F"] → 212
-- e.g. measure temperature [-40, "F", "C"] → -40
temperature : [value from to |
  celsius : match [from, ["C", value, "F", value - 32 * 5 / 9, "K", value - 273.15, any, false]]
  (celsius != false) [match [to, ["C", celsius, "F", celsius * 9 / 5 + 32, "K", celsius + 273.15, any, false]]] else [false]
]

-- an angle in radians turned to degrees
-- e.g. measure degrees pi → 180
degrees : [radians | radians * 180 / pi]

-- an angle in degrees turned to radians
-- e.g. measure radians 90 → 1.5707963268
radians : [angle | angle * pi / 180]

-- a size in bytes, as people read it
-- e.g. measure bytes 1536 → 1.5 KB
-- e.g. measure bytes 3221225472 → 3 GB
bytes : [n |
  names : ["B", "KB", "MB", "GB", "TB"]
  k : range 4 count [i | n >= (1024 pow i)]
  (k = 0) [n str .. " B"] else [(n / (1024 pow k) * 10 round / 10) str .. " " .. (names @ (k + 1))]
]

-- a length of time in hours, minutes and seconds, leaving out what's zero
-- e.g. measure duration 3725 → 1h 2m 5s
-- e.g. measure duration 7200 → 2h
duration : [seconds |
  whole : seconds round
  parts : [[whole / 86400 floor, "d"], [whole % 86400 / 3600 floor, "h"], [whole % 3600 / 60 floor, "m"], [whole % 60, "s"]]
  shown : parts keep [[k, unit] | k > 0] collect [[k, unit] | k str .. unit] join " "
  (shown = "") ["0s"] else [shown]
]

-- a running pace: minutes and seconds for each km (or mile) at distance covered in seconds
-- e.g. measure pace [5, 1650] → 5:30
pace : [distance seconds | each : seconds / distance round, secs : each % 60 pad-left [2, "0"], "[each / 60 floor]:[secs]"]
