const POSTS = [
  {
    slug: "the-morning-question",
    title: "The Morning Question",
    date: "2026-09-11",
    tags: ["constraints", "field"],
    summary: "Which constraints, killed today, release the most work? Everything else is ceremony."
  },
  {
    slug: "the-critical-path-is-a-coin-flip",
    title: "The Critical Path Is a Coin Flip",
    date: "2026-09-11",
    tags: ["scheduling", "metrics"],
    summary: "Run the schedule a thousand times and a different path goes critical in a lot of them."
  },
  {
    slug: "assumed-true-until-checked",
    title: "Assumed True Until Checked",
    date: "2026-09-11",
    tags: ["constraints", "trust"],
    summary: "An assumption is a constraint nobody is watching."
  },
  {
    slug: "baselines-rot",
    title: "Baselines Rot",
    date: "2026-09-11",
    tags: ["scheduling", "metrics"],
    summary: "A baseline is a photo of what we believed at sanction. We report against it for years."
  },
  {
    slug: "nobody-reads-the-schedule",
    title: "Nobody Reads the Schedule",
    date: "2026-09-11",
    tags: ["scheduling", "field"],
    summary: "Five thousand activities, updated monthly, read by nobody who swings a tool."
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
    summary: "Weather windows, crane slots, permit expiries. Half the schedule can't be rescheduled."
  },
  {
    slug: "the-welder-is-on-vacation",
    title: "The Only Qualified Welder Is on Vacation",
    date: "2026-09-10",
    tags: ["field", "scheduling"],
    summary: "Resource-loaded schedules track roles. Jobs get stopped by people."
  },
  {
    slug: "write-the-story-once",
    title: "Write the Story Once",
    date: "2026-09-10",
    tags: ["field", "software"],
    summary: "The daily log already contains the schedule update, the RFI, and the claim file. We retype it five times."
  },
  {
    slug: "one-spine",
    title: "One Spine",
    date: "2026-09-10",
    tags: ["cost", "theory"],
    summary: "Estimate, schedule, cost, work packages — four copies of the same breakdown, drifting."
  },
  {
    slug: "green-costs-a-name",
    title: "Green Should Cost a Name",
    date: "2026-09-10",
    tags: ["trust", "field"],
    summary: "Status colors are free, so they lie. Signatures aren't."
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
