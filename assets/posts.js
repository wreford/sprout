const POSTS = [
  {
    slug: "recurring-work-is-invisible",
    title: "Recurring Work Is Invisible",
    date: "2026-09-11",
    tags: ["scheduling", "theory"],
    summary: "CPM has no verb for every Tuesday, so the scheduler draws one 200-day bar."
  },
  {
    slug: "smartphones-are-cheap",
    title: "Smartphones Are Cheap",
    date: "2026-09-11",
    tags: ["field", "software"],
    summary: "A crew-hour costs more than the phone in the foreman's pocket."
  },
  {
    slug: "sticky-cubed",
    title: "Sticky³",
    date: "2026-09-11",
    tags: ["field", "theory"],
    summary: "The sticky wall is the best scheduling interface ever shipped. Its flaw is amnesia."
  },
  {
    slug: "a-thousand-papercuts",
    title: "A Thousand Papercuts Are Still Data",
    date: "2026-09-11",
    tags: ["metrics", "field"],
    summary: "Losses below the reporting threshold are invisible by design."
  },
  {
    slug: "people-matter",
    title: "People Matter",
    date: "2026-09-11",
    tags: ["field", "trust"],
    summary: "The plan prices labor as a rate. Crews have memory."
  },
  {
    slug: "weather-is-a-bitch",
    title: "Weather Is a Bitch",
    date: "2026-09-11",
    tags: ["constraints", "scheduling"],
    summary: "The only risk with a free, public, daily probabilistic forecast — and we plan against averages."
  },
  {
    slug: "unknown-unknowns",
    title: "Unknown Unknowns",
    date: "2026-09-11",
    tags: ["metrics", "theory"],
    summary: "You can't list them. You can count their arrival rate."
  },
  {
    slug: "where-is-my-material",
    title: "Where the Hell Is My Material?",
    date: "2026-09-11",
    tags: ["field", "cost"],
    summary: "Six systems know the spool's status. The crew's question takes three phone calls."
  },
  {
    slug: "roadmaps-and-visio",
    title: "Roadmaps and Visio",
    date: "2026-09-11",
    tags: ["theory", "trust"],
    summary: "A picture that can't be queried can't be wrong. That's why it's popular."
  },
  {
    slug: "a-video-is-worth",
    title: "An Image Is Worth 1,000. A Video Is Worth…",
    date: "2026-09-11",
    tags: ["field", "trust"],
    summary: "Every dispute is an argument about what the workface looked like on a date."
  },
  {
    slug: "signatures-should-be-easy",
    title: "Signatures Should Be Easy",
    date: "2026-09-11",
    tags: ["trust", "software"],
    summary: "Expensive in logistics, cheap in meaning. Invert it."
  },
  {
    slug: "delegation-made-easy",
    title: "Delegation Made Easy",
    date: "2026-09-11",
    tags: ["trust", "field"],
    summary: "Authority lives in out-of-office replies. Make it an object with an expiry."
  },
  {
    slug: "programmable-procedures",
    title: "Programmable Procedures",
    date: "2026-09-11",
    tags: ["software", "theory"],
    summary: "A procedure in a PDF is advice. Crews run programs."
  },
  {
    slug: "the-morning-question",
    title: "The Morning Question",
    date: "2026-09-11",
    tags: ["constraints", "field"],
    summary: "Which constraints, killed today, release the most work? Nothing on site ranks that."
  },
  {
    slug: "the-critical-path-is-a-coin-flip",
    title: "The Critical Path Is a Coin Flip",
    date: "2026-09-11",
    tags: ["scheduling", "metrics"],
    summary: "The red line moves every update. The criticality percentage doesn't."
  },
  {
    slug: "assumed-true-until-checked",
    title: "Assumed True Until Checked",
    date: "2026-09-11",
    tags: ["constraints", "trust"],
    summary: "An assumption is a constraint someone chose not to verify yet."
  },
  {
    slug: "baselines-rot",
    title: "Baselines Rot",
    date: "2026-09-11",
    tags: ["scheduling", "metrics"],
    summary: "A baseline is one saved forecast with a contract stapled to it. Keep the series, score it all."
  },
  {
    slug: "nobody-reads-the-schedule",
    title: "Nobody Reads the Schedule",
    date: "2026-09-11",
    tags: ["scheduling", "field"],
    summary: "The whiteboard silently becomes the real plan, and its decisions never flow back."
  },
  {
    slug: "everything-is-a-constraint",
    title: "Everything Is a Constraint",
    date: "2026-09-10",
    tags: ["constraints", "theory", "scheduling"],
    summary: "Logic ties, materials, permits, weather, space, dose — one object wearing seven costumes."
  },
  {
    slug: "the-calendar-fights-back",
    title: "The Calendar Fights Back",
    date: "2026-09-10",
    tags: ["constraints", "scheduling"],
    summary: "Weather windows, crane slots, permit expiries. Windows break float math."
  },
  {
    slug: "the-welder-is-on-vacation",
    title: "The Only Qualified Welder Is on Vacation",
    date: "2026-09-10",
    tags: ["field", "scheduling"],
    summary: "Aggregate histograms look healthy while one named person stops the job."
  },
  {
    slug: "write-the-story-once",
    title: "Write the Story Once",
    date: "2026-09-10",
    tags: ["field", "software"],
    summary: "The daily log feeds five systems. The fix is structure at capture — ACE — not AI reading diaries."
  },
  {
    slug: "one-spine",
    title: "One Spine",
    date: "2026-09-10",
    tags: ["cost", "theory"],
    summary: "Cost, field and schedule each need a different rollup. Rollups are views; the mistake is copying."
  },
  {
    slug: "green-costs-a-name",
    title: "Green Should Cost a Name",
    date: "2026-09-10",
    tags: ["trust", "field"],
    summary: "Status colors are free, so they drift optimistic. Field quality solved this decades ago."
  },
  {
    slug: "sci-cci",
    title: "Two Numbers Your Project Doesn't Track",
    date: "2026-09-10",
    tags: ["metrics", "sci", "cci"],
    summary: "Earned value measures effort. Nothing measures whether anyone knows the ending. Two proposed indices: SCI and CCI."
  }
];

(function () {
  const listEl = document.getElementById("postList");
  const tagRow = document.getElementById("tagRow");
  if (!listEl || !tagRow) return;

  const sorted = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
  const tags = [...new Set(sorted.flatMap(p => p.tags))].sort();
  let active = null;

  function renderList() {
    const shown = active ? sorted.filter(p => p.tags.includes(active)) : sorted;
    if (!shown.length) {
      listEl.innerHTML = '<li class="empty-note">Nothing filed under this tag yet.</li>';
      return;
    }
    listEl.innerHTML = shown.map(p =>
      "<li>" +
      '<p class="entry-meta"><time datetime="' + p.date + '">' + p.date + "</time>" +
      p.tags.map(t => " · " + t).join("") + "</p>" +
      '<h2 class="entry-title"><a href="notes/' + p.slug + '.html">' + p.title + "</a></h2>" +
      '<p class="entry-summary">' + p.summary + "</p>" +
      "</li>"
    ).join("");
  }

  function renderTags() {
    tagRow.innerHTML =
      '<li><button class="chip" data-tag="" aria-pressed="' + (active === null) + '">All</button></li>' +
      tags.map(t =>
        '<li><button class="chip" data-tag="' + t + '" aria-pressed="' + (active === t) + '">' + t + "</button></li>"
      ).join("");
  }

  tagRow.addEventListener("click", e => {
    const btn = e.target.closest("button[data-tag]");
    if (!btn) return;
    active = btn.dataset.tag || null;
    renderTags();
    renderList();
  });

  renderTags();
  renderList();
})();
