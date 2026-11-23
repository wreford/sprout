// node blog.js: Sprout's blog (decision 136) from blog/*.md, newest first, into blog.html and an Atom feed, blog.xml.
// A post is a file YYYY-MM-DD-name.md: "# Title", a blank line, then a few short paragraphs with `code` and [links](/x/).
const fs = require("fs"), path = require("path"), dir = path.join(__dirname, "blog");
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = t => esc(t).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
const posts = fs.readdirSync(dir).filter(f => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).sort().reverse().map(f => {
  const [head, ...rest] = fs.readFileSync(path.join(dir, f), "utf8").trim().split(/\n\s*\n/);
  return { id: f.slice(0, -3), date: f.slice(0, 10), title: head.replace(/^#\s*/, "").trim(), paras: rest.map(p => p.replace(/\s*\n\s*/g, " ")) };
});
const day = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const style = fs.readFileSync(path.join(__dirname, "index.html"), "utf8").match(/<style>[\s\S]*?<\/style>/)[0]
  .replace("</style>", "article{margin:0 0 34px}article h2{font-size:16px;text-transform:none;letter-spacing:0;color:var(--fg);margin:0 0 4px}article time{color:var(--fg3);font-size:12px}article p{margin:6px 0 0}\n</style>");
fs.writeFileSync(path.join(__dirname, "blog.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Sprout's blog: every change to the language, its library and its consoles, in a few lines.">
<title>Sprout blog</title>
<link rel="alternate" type="application/atom+xml" title="Sprout blog" href="blog.xml">
${style}</head><body>
<main>
<h1><a href="./">Sprout</a> blog</h1>
<p class="lede">Every change to Sprout, its library and its consoles, in a few lines. <a href="blog.xml">Feed</a>.</p>
${posts.map(p => `<article id="${p.id}"><h2><a href="#${p.id}">${inline(p.title)}</a></h2><time datetime="${p.date}">${day(p.date)}</time>
${p.paras.map(t => `<p>${inline(t)}</p>`).join("\n")}</article>`).join("\n")}
<footer>Sprout 3 &middot; the blog (decision 136) &middot; <a href="./">home</a></footer>
</main>
</body></html>
`);
const site = "https://taskiap.com/sprout3/";
fs.writeFileSync(path.join(__dirname, "blog.xml"), `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>Sprout blog</title><link href="${site}blog.html"/><link rel="self" href="${site}blog.xml"/><id>${site}blog.html</id>
<updated>${posts.length ? posts[0].date : "2026-11-23"}T12:00:00Z</updated><author><name>Sprout</name></author>
${posts.map(p => `<entry><title>${esc(p.title)}</title><link href="${site}blog.html#${p.id}"/><id>${site}blog.html#${p.id}</id><updated>${p.date}T12:00:00Z</updated>
<content type="html">${esc(p.paras.map(t => `<p>${inline(t)}</p>`).join(""))}</content></entry>`).join("\n")}
</feed>
`);
console.log("blog:", posts.length, "posts");
