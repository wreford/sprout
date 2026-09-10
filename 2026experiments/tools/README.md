# tools

## qa-bot.cjs — Blended Zebra autoplay QA bot

Plays full runs of `/zebra/` with the game's own Coach AI and reports on two
things the game must always satisfy:

1. **Never stuck.** A watchdog hashes the screen + run + battle state every
   tick. If nothing changes for ~9s the run is failed with a full state dump
   (screen, hand, energy, foe, visible buttons) and a screenshot. The bot also
   has its own escape hatch, counted separately as `harness nudges`, so a bot
   blind spot can never be mistaken for a game stall.
2. **Hard but progressing.** Reports floors reached, what killed each run,
   fight lengths, turns spent past the sunset rule, low-HP turns, and coverage
   of enemy traits / signature actions / fight kinds.

### Run it

```bash
# serve the repo root first
python3 -m http.server 8899

NODE_PATH=/opt/node22/lib/node_modules node tools/qa-bot.cjs [runs] [maxFloor]
node tools/qa-bot.cjs 6 30
```

### Reading the report

- `STALLS: NONE` is the pass condition. Anything else is a release blocker.
- Median floor is the difficulty dial. The bot plays worse than a human (it
  blends at random and never spends the skill tree), so treat its median as a
  floor, not a ceiling. Target: nobody reaches the cap, deaths spread across a
  range rather than clustering on one wall.
- A wall shows up as every run dying on the same floor — that is how the
  floor-5 boss was caught (0/12 wins) before the boss curve was rebalanced.
- `longest fight` climbing past ~12 turns means fights are dragging into the
  sunset rule and the damage curve needs a look.
