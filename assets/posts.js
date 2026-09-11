const POSTS = [
  {
    slug: "requirements-and-data-loss",
    title: "Turnover Is a Photocopy",
    date: "2026-09-11",
    tags: ["theory", "software"],
    summary: "Born a database row, handed over as a photograph of one."
  },
  {
    slug: "recurring-work-is-invisible",
    title: "The 200-Day Bar",
    date: "2026-09-11",
    tags: ["scheduling", "theory"],
    summary: "CPM has no verb for every Tuesday. Model the rule; derive two hundred facts."
  },
  {
    slug: "smartphones-are-cheap",
    title: "Smartphones Are Cheap",
    date: "2026-09-11",
    tags: ["field", "software"],
    summary: "A crew-hour costs more than the foreman's phone."
  },
  {
    slug: "sticky-cubed",
    title: "Sticky³",
    date: "2026-09-11",
    tags: ["field", "theory"],
    summary: "The best scheduling interface ever shipped forgets by Friday."
  },
  {
    slug: "a-thousand-papercuts",
    title: "Papercuts Are Data",
    date: "2026-09-11",
    tags: ["metrics", "field"],
    summary: "Losses below the reporting threshold are invisible by design."
  },
  {
    slug: "people-matter",
    title: "Crews Have Memory",
    date: "2026-09-11",
    tags: ["field", "trust"],
    summary: "Same trade, same rate, different job. Splitting a good crew appears in no schedule."
  },
  {
    slug: "weather-is-a-bitch",
    title: "Weather Is a Bitch",
    date: "2026-09-11",
    tags: ["constraints", "scheduling"],
    summary: "The one risk whose distribution is published daily, free. We plan on averages."
  },
  {
    slug: "unknown-unknowns",
    title: "Unknown Unknowns",
    date: "2026-09-11",
    tags: ["metrics", "theory"],
    summary: "You can't list them. You can count them arriving."
  },
  {
    slug: "where-is-my-material",
    title: "Where the Hell Is My Material?",
    date: "2026-09-11",
    tags: ["field", "cost"],
    summary: "Six systems know the spool. The crew's question takes three calls."
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
    summary: "Every dispute is about what the workface looked like on a date."
  },
  {
    slug: "signatures-should-be-easy",
    title: "Signatures Should Be Easy",
    date: "2026-09-11",
    tags: ["trust", "software"],
    summary: "Expensive to give, cheap in meaning. Invert it."
  },
  {
    slug: "delegation-made-easy",
    title: "Delegation Made Easy",
    date: "2026-09-11",
    tags: ["trust", "field"],
    summary: "Authority lives in out-of-office replies."
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
    summary: "Which constraints, killed today, release the most work?"
  },
  {
    slug: "the-critical-path-is-a-coin-flip",
    title: "The Critical Path Is a Coin Flip",
    date: "2026-09-11",
    tags: ["scheduling", "metrics"],
    summary: "The red line moves every update. The percentage doesn't."
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
    summary: "A baseline is one saved forecast with a contract stapled to it."
  },
  {
    slug: "nobody-reads-the-schedule",
    title: "Nobody Reads the Schedule",
    date: "2026-09-11",
    tags: ["scheduling", "field"],
    summary: "The whiteboard becomes the real plan and never writes back."
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
    summary: "Forty days of float before a forty-one-day window is one day of float."
  },
  {
    slug: "the-welder-is-on-vacation",
    title: "The Welder Is at a Wedding",
    date: "2026-09-10",
    tags: ["field", "scheduling"],
    summary: "Aggregates hide singletons; singletons stop jobs."
  },
  {
    slug: "write-the-story-once",
    title: "Write the Story Once",
    date: "2026-09-10",
    tags: ["field", "software"],
    summary: "Structure at capture — ACE — not software reading diaries."
  },
  {
    slug: "one-spine",
    title: "One Spine",
    date: "2026-09-10",
    tags: ["cost", "theory"],
    summary: "Rollups are views. The mistake is materializing views into owned copies."
  },
  {
    slug: "green-costs-a-name",
    title: "Green Should Cost a Name",
    date: "2026-09-10",
    tags: ["trust", "field"],
    summary: "Green is often the color of nobody wanting the argument."
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
