const POSTS = [
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
    tags: ["constraints", "weather", "scheduling"],
    summary: "Weather windows, crane slots, permit expiries. Half the schedule can't be rescheduled."
  },
  {
    slug: "the-welder-is-on-vacation",
    title: "The Only Qualified Welder Is on Vacation",
    date: "2026-09-10",
    tags: ["resources", "people", "scheduling"],
    summary: "Resource-loaded schedules track roles. Jobs get stopped by people."
  },
  {
    slug: "write-the-story-once",
    title: "Write the Story Once",
    date: "2026-09-10",
    tags: ["capture", "field", "software"],
    summary: "The daily log already contains the schedule update, the RFI, and the claim file. We retype it five times."
  },
  {
    slug: "one-spine",
    title: "One Spine",
    date: "2026-09-10",
    tags: ["wbs", "integration", "cost"],
    summary: "Estimate, schedule, cost, work packages — four copies of the same breakdown, drifting."
  },
  {
    slug: "green-costs-a-name",
    title: "Green Should Cost a Name",
    date: "2026-09-10",
    tags: ["reporting", "trust", "quality"],
    summary: "Status colors are free, so they lie. Signatures aren't."
  },
  {
    slug: "sci-cci",
    title: "Two Numbers Your Project Doesn't Track",
    date: "2026-09-10",
    tags: ["metrics", "evm", "certainty", "sci", "cci"],
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

  function chipList(post) {
    return post.tags.map(t => '<span class="chip small">' + t + "</span>").join("");
  }

  function renderList() {
    const shown = active ? sorted.filter(p => p.tags.includes(active)) : sorted;
    if (!shown.length) {
      listEl.innerHTML = '<li class="empty-note">Nothing filed under this tag yet.</li>';
      return;
    }
    listEl.innerHTML = shown.map(p =>
      "<li><article>" +
      '<time class="entry-date" datetime="' + p.date + '">' + p.date + "</time>" +
      '<h2 class="entry-title"><a href="notes/' + p.slug + '.html">' + p.title + "</a></h2>" +
      '<p class="entry-summary">' + p.summary + "</p>" +
      '<div class="entry-tags">' + chipList(p) + "</div>" +
      "</article></li>"
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
