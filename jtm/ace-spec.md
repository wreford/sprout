# ACE — Atomic Constraint Engine
## Specification v0.2

### The atom

```
{
  id:       string          // unique (IWP-0042, CON-0017)
  name:     string          // human-readable
  type:     string          // iwp, cwp, cwa, constraint, risk, rfi, action,
                            //   material, procedure, contract, system, milestone, flex
  kind:     manual | derived
  tags:     string[]        // free labels: ["concrete","nuclear","critical-path"]
  requires: id[]            // prerequisites — horizontal dependencies
  contains: id[]            // children — vertical hierarchy
}
```

That is the whole atom. Everything else is a view.

### Two completion kinds

- **manual** — a person clears it with evidence. Narrative optional or required depending on tags.
- **derived** — computed from the graph. Done when all `requires` AND all `contains` are done. Narrative auto-generated.

### Three link types

- **contains** — parent-child tree. One parent only. Carries rollup math.
- **requires** — dependency arrows. No cycles. Carries schedule/critical path.
- **tag** — free labels. Carry no math. Used for filtering and views.

No other link types. "blocks", "enables", "cleared-by", "waits-on" are all just `requires` from different angles.

### Completion engine

```
function settle(atoms):
  loop until nothing changes:
    for each atom where kind == derived:
      atom.complete = all(complete(x) for x in atom.requires)
                   && all(complete(x) for x in atom.contains)
```

Guarantees: progress never reverses, loops can't cheat, one pass suffices in DAGs.

### Schedule

```
finish(a) = duration(a) + max(finish(x) for x in a.requires)
critical_path = atoms where float == 0
```

Duration is optional. Only activities have it. When present: `[min, likely, max]` for Monte Carlo.

### Monte Carlo

```
for run in 1..N:
  sample durations from ranges
  roll shared risks once per run
  walk CPM
  record finish date and total cost
→ P10, P50, P80, P90
```

### Cost

Cost is a VIEW, not a property. Derived from workforce × rates × time.
Four categories: labor, indirect, materials, equipment (lump sums).
EVM: earned = rollup(completed_weight / total_weight) × budget.

### Narrative

Narrative is a tag, not a completion kind. Any atom tagged `narrative-required`
or `narrative-optional` records text with state changes.

- manual completion → narrative captures evidence
- derived completion → narrative auto-generated
- triage resolution → narrative required

### Tags that matter (start with these)

- `critical-path` — on the longest chain
- `regulatory` — requires CNSC approval
- `narrative-required` — must have narrative on completion
- `awp` — part of AWP hierarchy
- `nuclear` — CSA N286 quality

Add more when someone actually needs them.

### Constraint-free IWPs

An IWP is workable when everything it `requires` is complete.
No hardcoded 5-category check. The graph handles it.
"Rebar not delivered" is a constraint atom that the IWP requires.

### API

```
ACE.query({type, tag, status, search})
ACE.settle()
ACE.cpm()
ACE.monteCarlo(n)
ACE.create(spec)
ACE.complete(id, evidence, narrative?)
ACE.link(from, rel, to)
ACE.export(format)    // json, csv, xer, pdf
ACE.summary()         // for LLM context
```

### What this is NOT

- Not a database — atoms live in memory
- Not a server — runs in the browser
- Not P6 — no Gantt editing or resource leveling
- Not BIM — 3D is illustrative

### What makes it different

- One primitive (atom) instead of separate systems
- Completion is derived, never stored
- Monte Carlo is native, not bolted on
- Narrative is first-class
- Text is source — the JSON IS the model
