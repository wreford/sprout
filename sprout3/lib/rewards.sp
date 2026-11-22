-- rewards: what brings players back: streaks, stars, grades, best scores, achievements, and saved progress kept up to
-- date. Distilled from the TaskIAP games: 118 of the 319 save progress, 42 count streaks, 25 award achievements.

-- points for a right answer on a streak: each one in a row adds a tenth more, up to double
-- e.g. rewards streak-points [100, 4]
streak-points : [base streak | 1 + (streak - 1 * 0.1) min 2 * base round]

-- a daily streak: from the day last played and today (day numbers), the streak now: kept today, one more the next
-- day, back to 1 after a gap
-- e.g. rewards day-streak [41, 42, 6]
day-streak : [last-day today streak | cond [today = last-day, streak, today = (last-day + 1), streak + 1, any, 1]]

-- stars for a score: one for each mark it reaches
-- e.g. rewards stars [720, [300, 600, 900]]
stars : [score marks | marks count [m | score >= m]]

-- a letter grade for a share right (0 to 1)
-- e.g. rewards grade 0.83
grade : [share | cond [share >= 0.9, "A", share >= 0.8, "B", share >= 0.7, "C", share >= 0.6, "D", any, "F"]]

-- a best-scores table with a new score in its place, kept to the top n
-- e.g. rewards top [[900, 500, 200], 600, 3]
top : [scores score n | scores .. [score] sort reverse take n]

-- the achievements just earned: rules are [name, test] pairs, each test given the stats; have holds those earned
-- e.g. rewards earned [[["First steps", [s | s steps >= 1]], ["Marathon", [s | s steps >= 1000]]], [steps : 12], []]
earned : [rules stats have | rules keep [[name, test] | ((have has name) not) and (test stats)] collect [[name, test] | name]]

-- saved progress brought up to date: every field the defaults have, with the saved value where there is one (and
-- whatever the defaults no longer have, left behind)
-- e.g. rewards restore [[sound : true, speed : 1, level : 1], [speed : 2, colour : "red"]]
restore : [defaults saved | defaults keys fold [defaults, [acc k | (saved has-field k) [acc set-in [[k], saved get-in [k]]] else [acc]]]]
