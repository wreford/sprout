-- daytime: time in a game world: the hour, day and night, the light and sky, weekdays, seasons, and the stages things grow
-- through. Distilled from the TaskIAP games: 59 of the 319 have days and nights or weather, 30 seasons, 18 crops.

-- the hour (0 up to 24) after seconds, when a day lasts day-length seconds and starts at start-hour
-- e.g. daytime hour [90, 120, 6]
hour : [seconds day-length start-hour | seconds / day-length * 24 + start-hour % 24]

-- the part of the day an hour falls in: night, dawn, day or dusk
-- e.g. daytime part 18.5
part : [h | cond [h < 5, "night", h < 7, "dawn", h < 18, "day", h < 20, "dusk", any, "night"]]

-- how light it is at an hour, from 0 at night to 1 by day, rising through dawn and falling through dusk
-- e.g. daytime light 6
light : [h | cond [h < 5, 0, h < 7, h - 5 / 2, h < 18, 1, h < 20, 20 - h / 2, any, 0]]

-- the sky's colour at an hour: deep blue at night, orange at dawn and dusk, blue by day
-- e.g. daytime sky 12
sky : [h | p : part h, cond [p = "night", #10162b, p = "day", #6fa8e8, any, #f08a5d]]

-- the season of a day (day 1 the first of spring), seasons lasting length days
-- e.g. daytime season [40, 28]
season : [day length | ["spring", "summer", "autumn", "winter"] @ (day - 1 / length floor % 4 + 1)]

-- the weekday of a day (day 1 a Monday)
-- e.g. daytime weekday 10
weekday : [day | ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] @ (day - 1 % 7 + 1)]

-- which stage something has reached, planted at planted, when its stages last lengths seconds each: 1 at first, one
-- more than the number of stages once it's ready (a crop, a building, a cake in the oven)
-- e.g. daytime stage [0, 25, [10, 10, 10]]
stage : [planted now lengths | ends : lengths numbered collect [[i, l] | lengths take i sum], ends count [e | now - planted >= e] + 1]

-- is it ready?
-- e.g. daytime ripe [0, 25, [10, 10, 10]]
ripe : [planted now lengths | now - planted >= (lengths sum)]
