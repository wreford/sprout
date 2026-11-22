-- story: branching scenes and talk. A story is a record of scenes; a scene is [text, choices], and a choice is
-- [label, to], or [label, to, needs] when it needs a flag set first. Flags are a list of names. Distilled from the
-- TaskIAP story and dating games: 31 of the 319 offer choices.

-- the choices open in a scene, given the flags set
-- e.g. story open [[start : [text : "A door.", choices : [["Open it", "hall"], ["Pick the lock", "vault", "lockpick"]]]], "start", []] length
open : [tale scene flags | tale get-in [scene] choices keep [c | (c length < 3) or (flags has (c @ 3))]]

-- the scene a choice leads to
-- e.g. story go [[["Open it", "hall"]], 1]
go : [choices k | choices @ k @ 2]

-- flags with name set (once)
-- e.g. story flag [["met-guard"], "has-key"]
flag : [flags name | (flags has name) [flags] else [flags .. [name]]]

-- text typing itself out: what shows after elapsed seconds at per-second letters a second
-- e.g. story typed ["Hello there", 0.5, 10]
typed : [text elapsed per-second | text chars take (elapsed * per-second floor) join ""]

-- has all the text typed out yet?
-- e.g. story typed-all ["Hello", 0.4, 10]
typed-all : [text elapsed per-second | elapsed * per-second >= (text length)]
