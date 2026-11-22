-- undo: going back. A history is a list of earlier states, the newest first, as a puzzle, an editor or a drawing
-- keeps them: push the state before each change, and go back one step at a time.

-- the history with a state put on top, keeping at most most of them
-- e.g. undo push [[2, 1], 3, 10] → [3, 2, 1]
-- e.g. undo push [[2, 1], 3, 2] → [3, 2]
push : [history state most | [state] .. (history take (most - 1))]

-- the state that going back would give (false when there's none)
-- e.g. undo peek [3, 2, 1] → 3
-- e.g. undo peek [] → false
peek : [history | history @ 1]

-- the history without the state on top
-- e.g. undo pop [3, 2, 1] → [2, 1]
pop : [history | history drop 1]

-- is there anything to go back to?
-- e.g. undo can [] → false
can : [history | history length > 0]

-- one step back from the state now: [state, history], the state now kept when there's nothing to go back to
-- e.g. undo back [[3, 2, 1], 9] → [state : 3, history : [2, 1]]
-- e.g. undo back [[], 9] → [state : 9, history : []]
back : [history current | (history length > 0) [[state : history @ 1, history : history drop 1]] else [[state : current, history : history]]]
