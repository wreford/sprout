-- graph: things joined by arrows: tasks and the tasks they lead to, rooms and their doors, pages and their links. A
-- graph is a list of edges, each [from, to], or [from, to, cost] when an edge has a cost; a node is any text or number.
-- Find what a node leads to and what leads to it, an order to do things in, the way from one node to another, the
-- cheapest and the longest way, and a loop when there is one.

-- every node, in the order the edges first name them
-- e.g. graph nodes [["a", "b"], ["b", "c"], ["a", "c"]] → [a, b, c]
nodes : [edges | edges collect-flat [edge | [edge @ 1, edge @ 2]] distinct]

-- the nodes one arrow on from a node
-- e.g. graph next [[["a", "b"], ["a", "c"], ["b", "c"]], "a"] → [b, c]
next : [edges node | edges keep [edge | edge @ 1 = node] collect [edge | edge @ 2]]

-- every node a node leads to, near or far, the nearest first (the node itself only when a loop leads back to it)
-- e.g. graph reach [[["a", "b"], ["b", "c"], ["d", "a"]], "a"] → [b, c]
reach : [edges node |
  spread : [found frontier |
    (frontier length = 0) [found] else [
      fresh : frontier collect-flat [n | next [edges, n]] distinct keep [n | (found has n) not]
      spread [found .. fresh, fresh]
    ]
  ]
  spread [[], [node]]
]

-- every node that leads to a node, near or far, the nearest first: all it waits on
-- e.g. graph reached-by [[["a", "b"], ["b", "c"], ["d", "a"]], "c"] → [b, a, d]
reached-by : [edges node | reach [edges collect [edge | [edge @ 2, edge @ 1]], node]]

-- the nodes no arrow leads to: where things can begin
-- e.g. graph starts [["a", "b"], ["c", "b"], ["b", "d"]] → [a, c]
starts : [edges | targets : edges collect [edge | edge @ 2], nodes edges keep [n | (targets has n) not]]

-- every node in an order where each comes after all the nodes that lead to it, or false when a loop makes that
-- impossible (an order to do tasks in, to load files in, to learn skills in)
-- e.g. graph order [["dig", "pour"], ["pour", "frame"], ["dig", "drain"]] → [dig, pour, drain, frame]
-- e.g. graph order [["a", "b"], ["b", "a"]] → false
order : [edges |
  place : [placed waiting |
    ready : waiting keep [n | edges all [edge | (edge @ 2 != n) or (placed has (edge @ 1))]]
    cond [
      waiting length = 0, placed
      ready length = 0, false
      any, place [placed .. ready, waiting keep [n | (ready has n) not]]
    ]
  ]
  place [[], nodes edges]
]

-- the way from one node to another in the fewest arrows, as the nodes along it, or false when there's none
-- e.g. graph path [[["a", "b"], ["b", "c"], ["a", "d"], ["d", "e"], ["e", "c"]], "a", "c"] → [a, b, c]
-- e.g. graph path [[["a", "b"]], "b", "a"] → false
path : [edges from to |
  -- each node reached is kept as an entry: [node, the node it was reached from]
  entry-for : [entries node | entries find [entry | entry @ 1 = node]]
  search : [reached frontier |
    cond [
      entry-for [reached, to] != false, reached
      frontier length = 0, false
      any, (
        steps : frontier collect-flat [node | next [edges, node] collect [onward | [onward, node]]]
        fresh : steps keep [step | entry-for [reached, step @ 1] = false] distinct-by [step | step @ 1]
        search [reached .. fresh, fresh collect [step | step @ 1]]
      )
    ]
  ]
  reached : search [[[from, from]], [from]]
  back : [node trail | (node = from) [[from] .. trail] else [back [entry-for [reached, node] @ 2, [node] .. trail]]]
  (reached != false) [back [to, []]] else [false]
]

-- the cheapest way from one node to another along edges with costs: [way, total], or false when there's none
-- e.g. graph cheapest [[["home", "shop", 5], ["shop", "park", 2], ["home", "park", 9]], "home", "park"] → [way : [home, shop, park], total : 7]
cheapest : [edges from to |
  -- each entry is [node, the cost to reach it, the node before it]: settled holds the nodes whose cheapest cost is
  -- known, and open the nodes reached by some way so far
  entry-for : [entries node | entries find [entry | entry @ 1 = node]]
  settle : [settled open |
    (open length = 0) or (entry-for [settled, to] != false) [settled] else [
      best : open smallest-by [entry | entry @ 2]
      onward : edges keep [edge | edge @ 1 = (best @ 1)] collect [edge | [edge @ 2, best @ 2 + (edge @ 3), best @ 1]]
      still-open : open .. onward keep [entry | (entry @ 1 != (best @ 1)) and (entry-for [settled, entry @ 1] = false)]
      settle [settled .. [best], still-open]
    ]
  ]
  settled : settle [[], [[from, 0, from]]]
  back : [node trail | (node = from) [[from] .. trail] else [back [entry-for [settled, node] @ 3, [node] .. trail]]]
  arrival : entry-for [settled, to]
  (arrival != false) [[way : back [to, []], total : arrival @ 2]] else [false]
]

-- the longest way through a graph with no loops, each node counting for what weight gives it: [way, total], or false
-- when there's a loop (with each task's days as its weight, a project's critical path)
-- e.g. graph longest [[[1, 2], [2, 4], [1, 3], [3, 4]], [n | n]] → [way : [1, 3, 4], total : 8]
longest : [edges weight |
  sorted : order edges
  -- each entry is [node, the longest total of a way that ends at it, the node before it on that way], made in order
  entry-for : [entries node | entries find [entry | entry @ 1 = node]]
  add-entry : [entries node |
    leads : edges keep [edge | edge @ 2 = node] collect [edge | entry-for [entries, edge @ 1]]
    heaviest : leads largest-by [entry | entry @ 2]
    (leads length = 0) [entries .. [[node, weight node, node]]] else [entries .. [[node, heaviest @ 2 + (weight node), heaviest @ 1]]]
  ]
  (sorted != false) [
    table : sorted fold [[], add-entry]
    finish : table largest-by [entry | entry @ 2]
    back : [node trail | before-it : entry-for [table, node] @ 3, (before-it = node) [[node] .. trail] else [back [before-it, [node] .. trail]]]
    [way : back [finish @ 1, []], total : finish @ 2]
  ] else [false]
]

-- a loop in the graph, as the nodes round it, or false when there's none: why there's no order
-- e.g. graph loop [["a", "b"], ["b", "c"], ["c", "b"], ["c", "d"]] → [b, c]
-- e.g. graph loop [["a", "b"], ["b", "c"]] → false
loop : [edges |
  -- take away, again and again, the edges that can't be on a loop: those from a node nothing leads to, or to a node
  -- that leads nowhere; every edge left is on a loop or between loops
  peel : [remaining |
    kept : remaining keep [edge | (remaining any [other | other @ 2 = (edge @ 1)]) and (remaining any [other | other @ 1 = (edge @ 2)])]
    (kept length = (remaining length)) [remaining] else [peel kept]
  ]
  ring : peel edges
  walk : [trail n | (trail has n) [trail drop (trail index-of n - 1)] else [walk [trail .. [n], ring find [edge | edge @ 1 = n] @ 2]]]
  (ring length > 0) [walk [[], ring @ 1 @ 1]] else [false]
]
