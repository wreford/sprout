-- pad: the buttons of a handheld as a game reads them: which way the arrows point, and whether a button is in. The
-- buttons are a record like the frame's input held, pressed and released (decision 121): [left : true, one : true].
-- Read held buttons to walk and pressed ones to step through a menu, so that one press moves one place.

-- which way the arrows point, as a pair across and down
-- e.g. pad way [left : true, down : true] → -1x1
-- e.g. pad way [one : true] → 0x0
way : [buttons | pair [(buttons "right" [1] else [0]) - (buttons "left" [1] else [0]), (buttons "down" [1] else [0]) - (buttons "up" [1] else [0])]]

-- the arrows across alone: -1, 0 or 1, for a game that only goes left and right
-- e.g. pad across [right : true] → 1
across : [buttons | way buttons x]

-- the arrows up and down alone: -1 up, 1 down
-- e.g. pad upward [up : true] → -1
upward : [buttons | way buttons y]

-- is button one or button two in? ("press 1 or 2")
-- e.g. pad either [two : true] → true
-- e.g. pad either [left : true] → false
either : [buttons | (buttons "one") or (buttons "two")]

-- is any button or arrow in at all?
-- e.g. pad any-in [] → false
any-in : [buttons | buttons keys length > 0]
