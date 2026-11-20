-- ACE ledger: the atoms live in SQLite, done is derived in Sprout, and every step is written to an event log.
-- Each run is one day on site: the first workable atom is closed, and the closure is logged.
-- The database is kept in this browser, so run it again and the project moves on a day.
-- (To start over, clear the database in the State tab.)

-- the tables, made once
db run "create table if not exists atoms (id text primary key, name text, closed integer)"
db run "create table if not exists links (atom text, needs text)"
db run "create table if not exists events (n integer primary key autoincrement, day integer, atom text, note text)"

-- the first time, fill them in: atoms, and what each one requires
empty : db query "select count(*) as n from atoms" first n = 0
empty
  db run "insert into atoms values ('permit', 'Excavation permit', 1), ('survey', 'Survey and layout', 0), ('dig', 'Excavate pedestal', 0), ('rebar', 'Rebar delivered', 0), ('place', 'Place rebar', 0), ('inspect', 'Pre-pour inspection', 0), ('pour', 'Pour concrete', 0)"
  db run "insert into links values ('dig', 'permit'), ('dig', 'survey'), ('place', 'dig'), ('place', 'rebar'), ('inspect', 'place'), ('pour', 'inspect')"

has : [xs want | xs keep [x | x = want] length > 0]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
needs-of : [want | db query ["select needs from links where atom = ?", [want]] collect [l | l needs]]

-- derive what can be worked from the rows: done is never a column we trust on its own
workable-in : [rows |
  done : rows keep [a | a closed = 1] collect [a | a id]
  rows keep [a | a closed = 0 and (needs-of (a id) keep [x | has [done, x] not] length = 0)]
]

-- today: close the first workable atom, and write it down
this-day : db query "select count(*) as n from events" first n + 1
today : workable-in (db query "select id, name, closed from atoms order by rowid") first
today != false
  db run ["update atoms set closed = 1 where id = ?", [today id]]
  db run ["insert into events (day, atom, note) values (?, ?, ?)", [this-day, today id, "closed " .. (today name)]]

-- the state of the job, read back from the database
after : db query "select id, name, closed from atoms order by rowid"
next-up : workable-in after collect [a | a id]
"== day [this-day] ==" print
after each [a |
  mark : a closed = 1 ["\[x]"] else [has [next-up, a id] ["\[>]"] else ["\[ ]"]]
  "[mark] [pad [a name, 22]] needs " .. (needs-of (a id) fold ["nothing", [s x | s = "nothing" [x] else [s .. ", " .. x]]]) print
]
"" print
"== the event log, newest first ==" print
db query "select day, note from events order by n desc limit 5" each [e | "day [e day]  [e note]" print]
next-up length = 0
  "" print
  "the pedestal is finished" print
