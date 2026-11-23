// Tools over Sprout code as text, shared by Greenhouse (ide.html) and the playground (play.html), and checked in Node by
// ide-tests.js. Nothing here touches the page. It needs sprout3.js and highlight.js, whose tokens it reads code with.
//   - the library's own documentation, read from the comments in its sources (libraryDoc, docAt)
//   - what an error message means, and fixes for it (explain)
//   - a formatter that never changes what a program means (format)
//   - where a name is defined (definitionsOf, definitionOf), and renaming it everywhere (rename)
//   - finding text (findAll), and the word at a place in the code (wordAt)
//   - what to suggest while typing (completions)
(function (root) {
"use strict";
const sprout = () => root.Sprout3, highlight = () => root.Sprout3Highlight;
const own = (object, key) => !!object && Object.prototype.hasOwnProperty.call(object, key);

// ===================================================================== places in the code
// lines and columns count from 0; an offset is a place in the whole text
function positionOf(code, offset) {
  const before = code.slice(0, offset), lineStart = before.lastIndexOf("\n") + 1;
  return { line: before.split("\n").length - 1, column: offset - lineStart, lineStart };
}
function offsetOf(code, line, column) {
  const lines = code.split("\n");
  let offset = 0;
  for (let i = 0; i < line && i < lines.length; i++) offset += lines[i].length + 1;
  return offset + column;
}
const lineAt = (code, line) => code.split("\n")[line] || "";

// the word at an offset (with the caret just after a word, that word), and the word just before it on its line
function wordAt(code, offset) {
  const { line, column, lineStart } = positionOf(code, offset), text = lineAt(code, line);
  const found = wordInTokens(text, highlight().tokensOf(text), column);
  return found && { ...found, start: lineStart + found.start, end: lineStart + found.end, line };
}
function wordInTokens(text, tokens, column) {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === "text") {
      for (const insert of token.inserts) if (column > insert.start && column < insert.end) return wordInTokens(text, insert.tokens, column);
      continue;
    }
    if (token.kind !== "word" || column < token.start || column > token.end) continue;
    // between two words that touch (hello!), the caret is on the second
    const next = tokens[i + 1];
    if (column === token.end && next && next.kind === "word" && next.start === column) continue;
    let j = i - 1;
    while (j >= 0 && tokens[j].kind === "space") j--;
    const before = j >= 0 && tokens[j].kind === "word" ? text.slice(tokens[j].start, tokens[j].end) : "";
    return { word: text.slice(token.start, token.end), start: token.start, end: token.end, before };
  }
  return null;
}
// is this column of a line inside a comment, or inside the plain part of a text?
function inCommentOrText(text, column) {
  for (const token of highlight().tokensOf(text)) {
    if (column <= token.start || column > token.end) continue;
    if (token.kind === "comment") return true;
    if (token.kind === "text") return !token.inserts.some(insert => column > insert.start && (column < insert.end || !insert.closed)) && !(token.closed && column === token.end);
  }
  return false;
}

// ===================================================================== the library's documentation
// A module's source opens with comment lines saying what it is for; each word has comment lines just above it, those
// starting "e.g." being examples, as in "-- e.g. arc progress [0.8, 2, 2.4] → 0.5".
function parseModule(source) {
  const words = new Map();
  let about = "", comments = [], aboutRead = false;
  for (const line of source.split("\n")) {
    const comment = /^--\s?(.*)$/.exec(line);
    if (comment) { comments.push(comment[1]); continue; }
    if (!line.trim()) {
      if (!aboutRead && comments.length) { about = comments.join(" "); aboutRead = true; }
      comments = [];
      continue;
    }
    const binding = /^([a-z][\w?!-]*)\s*:\s*(.*)$/i.exec(line);
    if (binding) {
      const inputs = (/^\[\s*([^|\]]*?)\s*\|/.exec(binding[2]) || [])[1] || "";
      words.set(binding[1], {
        name: binding[1],
        about: comments.filter(c => !/^e\.g\./.test(c)).join(" "),
        examples: comments.filter(c => /^e\.g\./.test(c)).map(c => c.replace(/^e\.g\.\s*/, "")),
        inputs: inputs ? inputs.split(/\s+/) : [],
      });
    }
    comments = [];
  }
  return { about, words };
}
// a wrapped library's words (libs.js) each come with what it does and an example; they are asked of a stand-in for the
// library, so nothing is loaded
function wrappedLibraryDocs(library) {
  const words = new Map();
  try {
    const entries = library.words(new Proxy(function () {}, { get: () => () => {}, apply: () => ({}) }));
    for (const name of Object.keys(entries)) {
      const [about, example] = Array.isArray(entries[name]) ? entries[name] : [];
      words.set(name, { name, about: about || "", examples: example ? [example] : [], inputs: [] });
    }
  } catch (e) { /* a library whose words can't be listed this way shows only its own description */ }
  return words;
}
const moduleDocsCache = new Map();
// a module's documentation: { kind: "module" | "kit" | "library", about, words }, or null for a word that isn't one
function moduleDocs(name) {
  if (moduleDocsCache.has(name)) return moduleDocsCache.get(name);
  const stdlib = sprout().stdlib || {}, libraries = sprout().libraries;
  let docs = null;
  if (own(stdlib.SOURCES, name)) docs = { kind: "module", ...parseModule(stdlib.SOURCES[name]) };
  else if (own(stdlib.KITS, name)) docs = { kind: "kit", ...parseModule(stdlib.KITS[name]) };
  else if (libraries && own(libraries.LIBRARIES, name)) {
    const library = libraries.LIBRARIES[name];
    docs = { kind: "library", about: library.title + ": " + library.about, words: wrappedLibraryDocs(library) };
  }
  moduleDocsCache.set(name, docs);
  return docs;
}
// the documentation of a module, or of one of its words: { title, kind, about, examples, inputs, words }
function libraryDoc(moduleName, word) {
  const docs = moduleDocs(moduleName);
  if (!docs) return null;
  if (!word) return { title: moduleName, kind: docs.kind, about: docs.about, examples: [], inputs: [], words: [...docs.words.keys()] };
  const entry = docs.words.get(word);
  if (!entry) return null;
  return { title: moduleName + " " + word, kind: docs.kind + " word", about: entry.about, examples: entry.examples, inputs: entry.inputs, module: moduleName };
}
// the documentation for the word at an offset in the code: a module or kit, or one of its words
function docAt(code, offset) {
  const found = wordAt(code, offset);
  if (!found) return null;
  return libraryDoc(found.word) || (found.before ? libraryDoc(found.before, found.word) : null);
}
const firstSentence = text => { const match = /^(.+?[.!?])(\s|$)/.exec(text || ""); return match ? match[1] : text || ""; };

// ===================================================================== what an error means, and how to fix it
// explain(message, line, code) gives { say, fixes }: the message in plain words, and fixes, each { label, code, line }
// with code the whole program as it would be after the fix and line (from 1) where it happened.
const changeLine = (code, line, change) => {
  const lines = code.split("\n");
  if (line < 1 || line > lines.length) return null;
  lines[line - 1] = change(lines[line - 1]);
  return lines.join("\n");
};
const codePartOf = text => { const comment = highlight().tokensOf(text).find(token => token.kind === "comment"); return comment ? text.slice(0, comment.start).replace(/\s+$/, "") : text; };
const withCodePart = (text, change) => { const code = codePartOf(text); return change(code) + text.slice(code.length); };
// the indent of the nearest line above that holds code
function indentAbove(code, line) {
  const lines = code.split("\n");
  for (let i = line - 2; i >= 0; i--) if (lines[i].trim() && !/^\s*--/.test(lines[i])) return /^\s*/.exec(lines[i])[0];
  return "";
}
// a word swapped for another, as a word in code only (not in comments or plain text): the suggestion in a "did you mean"
function swapWordOnLine(code, line, from, to) {
  const changed = changeLine(code, line, text => replaceWord(text, from, to).text);
  return changed !== code ? changed : null;
}
const EXPLANATIONS = [
  { pattern: /^a string needs a closing "/,
    say: 'Text starts and ends with a straight double quote, on one line. For a quote inside text, write \\".',
    fixes: (match, code, line) => [{ label: "Close the text at the end of line " + line, code: changeLine(code, line, text => text.replace(/\s+$/, "") + '"') }] },
  { pattern: /^a \[ in a string needs a \] to close it/,
    say: 'Inside text, [ ] puts a value in, as in "score [g score]". For a plain [ in text, write \\[.',
    fixes: (match, code, line) => [{ label: "Write \\[ for a plain bracket", code: changeLine(code, line, escapeOpenInsert) }] },
  { pattern: /^put one value inside a string's brackets/,
    say: 'Inside text, [ ] holds one value, as in "score [g score]". For a plain [ in text, write \\[.', fixes: () => [] },
  { pattern: /^a \[ needs a \] to close it/,
    say: "Each [ opens a cell, a list or a record, and needs a ] to close it. Count them on the lines above.",
    fixes: (match, code, line) => [{ label: "Add ] at the end of line " + line, code: changeLine(code, line, text => withCodePart(text, part => part + "]")) }] },
  { pattern: /^a \( needs a \) to close it/,
    say: "Each ( opens a group and needs a ) to close it.",
    fixes: (match, code, line) => [{ label: "Add ) at the end of line " + line, code: changeLine(code, line, text => withCodePart(text, part => part + ")")) }] },
  { pattern: /^this ([\])]) (doesn't match|doesn't close anything)/,
    say: "This closing bracket has no opening one before it, or it closes the other kind ( ] for [, ) for ( ).",
    fixes: (match, code, line) => [{ label: "Take out the last " + match[1] + " on line " + line, code: changeLine(code, line, text => withCodePart(text, part => { const at = part.lastIndexOf(match[1]); return at < 0 ? part : part.slice(0, at) + part.slice(at + 1); })) }] },
  { pattern: /^this line's indent doesn't line up with any line above/,
    say: "An indent opens a block under the line above it, and a line that comes back out has to line up exactly with a line above.",
    fixes: (match, code, line) => [{ label: "Line it up with the line above", code: changeLine(code, line, text => indentAbove(code, line) + text.trimStart()) }] },
  { pattern: /^a value has to follow :/,
    say: "A name and a colon need a value after them: on the same line, or indented on the lines below.", fixes: () => [] },
  { pattern: /^only a name can go before :/,
    say: "Only a name can be given a value with a colon, as in speed : 130. To compare two things, use =.", fixes: () => [] },
  { pattern: /^only names go (before \||in a pattern)/,
    say: "Before | come the names of a cell's inputs, as in [x y | x + y], or a pattern of names, as in [[x, y] | x + y].", fixes: () => [] },
  { pattern: /^"([^"]+)" isn't a word Sprout knows yet(?: \(did you mean "([^"]+)"\?\))?/,
    say: "Sprout doesn't know this word here: it isn't a name in the program, a library's or one of Sprout's own. Give it a value with name : value, or check its spelling.",
    fixes: (match, code, line) => match[2] ? [{ label: "Use " + match[2], code: swapWordOnLine(code, line, match[1], match[2]) }] : [] },
  { pattern: / doesn't know (\S+) \(did you mean ([^?]+)\?\)/,
    say: "A value was sent a message it doesn't understand. Click a value at the end of a line to see the messages it does.",
    fixes: (match, code, line) => [{ label: "Use " + match[2], code: swapWordOnLine(code, line, match[1], match[2]) }] },
  { pattern: / doesn't know /,
    say: "A value was sent a message it doesn't understand. Click a value at the end of a line to see the messages it does.", fixes: () => [] },
  { pattern: /^the game needs an update field/, wholeProgram: true,
    say: "A game is a start (the state it begins in), an update (the next state from this one) and a draw.",
    fixes: code => [{ label: "Add an update that keeps the state", code: code.replace(/\s*$/, "\n") + "update : [g | g]\n" }] },
  { pattern: /^the game needs a start field/, wholeProgram: true,
    say: "A game is a start (the state it begins in), an update (the next state from this one) and a draw.",
    fixes: code => [{ label: "Add a start", code: code.replace(/\s*$/, "\n") + "start : [t : 0]\n" }] },
  { pattern: /isn't a number/, say: "A number was wanted here, and the value given is another kind.", fixes: () => [] },
  { pattern: /(Cannot read propert|is not a function|is not defined|Maximum call stack)/i,
    say: "Sprout itself tripped here. Often a value is of a kind the word didn't expect, or a cell calls itself for ever.", fixes: () => [] },
];
// a text's first insert that is never closed gets its [ written as \[
function escapeOpenInsert(text) {
  for (const token of highlight().tokensOf(text)) {
    if (token.kind !== "text") continue;
    const open = token.inserts.find(insert => !insert.closed);
    if (open) return text.slice(0, open.start) + "\\" + text.slice(open.start);
  }
  return text;
}
function explain(message, line, code) {
  message = String(message || "");
  const lineNumber = line || +((/\(line (\d+)\)/.exec(message) || [])[1] || 0);
  for (const entry of EXPLANATIONS) {
    const match = entry.pattern.exec(message);
    if (!match) continue;
    // a fix needs the line it is for, unless it changes the program as a whole
    const fixes = lineNumber > 0 || entry.wholeProgram ? entry.fixes(match, code || "", lineNumber) : [];
    return { say: entry.say, fixes: fixes.filter(fix => fix.code && fix.code !== code).map(fix => ({ ...fix, line: lineNumber })) };
  }
  return { say: "", fixes: [] };
}

// ===================================================================== the formatter
// format(code) gives { code, changed, refused }. It indents two spaces a level, puts one space after a comma and around
// : and |, none inside brackets, trims the ends of lines and runs of blank lines, and then checks its work: if Sprout
// would read the result any differently from the original, it gives the original back, refused. Text and comments are
// left as they are.
function readingOf(code) {
  try {
    return JSON.stringify(sprout().tokenize(code).map(token => typeof token === "string" ? token : [token.kind, token.value, token.text, token.form, token.parts]));
  } catch (e) { return null; }
}
function format(code) {
  const lines = code.replace(/\r/g, "").split("\n"), levels = indentLevels(lines), before = readingOf(code);
  if (!levels || before === null) return { code, changed: false, refused: true };
  const out = [];
  lines.forEach((text, i) => {
    if (!text.trim()) { if (out.length && out[out.length - 1] !== "") out.push(""); return; }
    out.push("  ".repeat(levels[i]) + spaceLine(text.trim()));
  });
  while (out.length && out[out.length - 1] === "") out.pop();
  const result = out.join("\n") + "\n";
  if (readingOf(result) !== before) return { code, changed: false, refused: true };
  return { code: result, changed: result !== code, refused: false };
}
// each line's depth, as the tokenizer reads indents: deeper opens a level, shallower goes back to a level above (and
// must line up with it). A comment-only line takes the depth it would have. Null if the indents don't line up.
function indentLevels(lines) {
  const widthOf = text => { let width = 0; for (const char of text) { if (char === " ") width++; else if (char === "\t") width += 2; else break; } return width; };
  const stack = [], levels = [];
  for (const text of lines) {
    if (!text.trim()) { levels.push(0); continue; }
    const width = widthOf(text);
    if (/^\s*--/.test(text)) {
      let level = stack.length - 1;
      while (level > 0 && stack[level] > width) level--;
      levels.push(stack.length ? level + (width > stack[Math.max(0, level)] ? 1 : 0) : 0);
      continue;
    }
    if (!stack.length || width > stack[stack.length - 1]) stack.push(width);
    else {
      while (width < stack[stack.length - 1]) stack.pop();
      if (width !== stack[stack.length - 1]) return null;
    }
    levels.push(stack.length - 1);
  }
  return levels;
}
// one line's tokens put back with Sprout's usual spacing. Spaces are only added or taken away beside punctuation, so
// two words never run together; a comment keeps the space before it.
function spaceLine(text) {
  let out = "", previous = null, hadSpace = false;
  for (const token of highlight().tokensOf(text)) {
    if (token.kind === "space") { hadSpace = true; continue; }
    const source = text.slice(token.start, token.end);
    let gap = hadSpace ? " " : "";
    if (!previous) gap = "";
    else if (token.kind === "comment") gap = text.slice(previous.end, token.start) || " ";
    else if (token.kind === "comma") gap = "";
    else if (previous.kind === "open") gap = "";
    else if (token.kind === "close") gap = "";
    else if (previous.kind === "comma") gap = " ";
    else if (token.kind === "colon" || token.kind === "bar" || previous.kind === "colon" || previous.kind === "bar") gap = " ";
    out += gap + source;
    previous = token; hadSpace = false;
  }
  return out;
}

// ===================================================================== names: where each is defined, and renaming
// every name the code defines: { name, line, column, indent, input }: "name :" bindings (record fields among them), and
// the inputs a cell names before |
function definitionsOf(code) {
  const found = [], noWords = new Set();
  code.split("\n").forEach((text, line) => {
    const indent = /^\s*/.exec(text)[0].length;
    const visit = tokens => {
      const roles = highlight().rolesOf(tokens, text, noWords);
      tokens.forEach((token, i) => {
        if (roles[i] === "define" || roles[i] === "input") found.push({ name: text.slice(token.start, token.end), line, column: token.start, indent, input: roles[i] === "input" });
        if (token.kind === "text") token.inserts.forEach(insert => visit(insert.tokens));
      });
    };
    visit(highlight().tokensOf(text));
  });
  return found;
}
// where a name used on a line is defined: the nearest definition at or above it that could be seen from there (at the
// top level, or less indented than the use, or on the same line), else the first at the top level, else any
function definitionOf(code, name, atLine) {
  const all = definitionsOf(code).filter(definition => definition.name === name);
  if (!all.length) return null;
  const useIndent = /^\s*/.exec(lineAt(code, atLine))[0].length;
  const seen = all.filter(d => d.line <= atLine && (d.indent === 0 || d.indent < useIndent || d.line === atLine));
  return seen[seen.length - 1] || all.find(d => d.indent === 0) || all[0];
}
// every use of a name as a word in the code (in text's inserts too, but not in comments or plain text), renamed
function replaceWord(text, from, to) {
  const spans = [];
  const visit = tokens => {
    for (const token of tokens) {
      if (token.kind === "word" && text.slice(token.start, token.end) === from) spans.push(token);
      if (token.kind === "text") token.inserts.forEach(insert => visit(insert.tokens));
    }
  };
  visit(highlight().tokensOf(text));
  let out = text;
  for (const span of spans.sort((a, b) => b.start - a.start)) out = out.slice(0, span.start) + to + out.slice(span.end);
  return { text: out, count: spans.length };
}
const isName = word => /^[a-z_][\w?!*+<>=\/-]*$/i.test(word) && !word.includes("--") && !/^\d/.test(word);
function rename(code, from, to) {
  if (!isName(to)) return { code, count: 0, problem: '"' + to + '" can\'t be a name: a name starts with a letter and has no spaces or brackets' };
  if (from === to) return { code, count: 0 };
  let count = 0;
  const lines = code.split("\n").map(text => { const result = replaceWord(text, from, to); count += result.count; return result.text; });
  return { code: lines.join("\n"), count };
}

// ===================================================================== finding text
function findAll(code, query, options = {}) {
  if (!query) return [];
  const isWordChar = char => !!char && /[\w?!-]/.test(char);
  const haystack = options.matchCase ? code : code.toLowerCase(), needle = options.matchCase ? query : query.toLowerCase(), found = [];
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + Math.max(1, needle.length))) {
    if (options.wholeWord && (isWordChar(code[at - 1]) || isWordChar(code[at + needle.length]))) continue;
    found.push({ start: at, end: at + needle.length });
  }
  return found;
}

// ===================================================================== what to suggest while typing
// completions(code, caret, host) gives { start, end, prefix, source, items: [{ word, kind, about }] } for the word being
// typed: after a library module, its words; after a value the host can show (host.messagesOf(word) gives the messages
// it understands, decision 140, or null), those messages; otherwise the program's own names first, then Sprout's words,
// the game layer's and the modules. It gives null in a comment or in plain text.
function completions(code, caret, host = {}) {
  const { line, column, lineStart } = positionOf(code, caret), text = lineAt(code, line), before = text.slice(0, column);
  if (inCommentOrText(text, column)) return null;
  const prefix = (/[a-z_][\w?-]*$/i.exec(before) || [""])[0], start = caret - prefix.length;
  const previous = (/([^\s\[\](),|:"]+)\s+$/.exec(before.slice(0, before.length - prefix.length)) || [])[1] || "";
  const fits = word => word.toLowerCase().startsWith(prefix.toLowerCase()) && word !== prefix;
  const result = (source, items) => ({ start, end: caret, prefix, source, items: items.slice(0, 40) });

  const docs = previous && moduleDocs(previous);
  if (docs) {
    const items = [...docs.words.values()].filter(entry => fits(entry.name)).map(entry => ({ word: entry.name, kind: docs.kind, about: firstSentence(entry.about) }));
    if (items.length) return result("module", items);
  }
  const fields = previous && !docs && highlight().moduleWords(previous);
  if (fields && fields.size) {
    const items = [...fields].filter(fits).map(word => ({ word, kind: previous }));
    if (items.length) return result("module", items);
  }
  const messages = previous && host.messagesOf ? host.messagesOf(previous) : null;
  if (messages) {
    const items = messages.filter(fits).map(word => ({ word, kind: "message" }));
    if (items.length) return result("value", items);
  }
  if (!prefix) return null;
  const items = [], seen = new Set();
  const add = (word, kind, about) => { if (!seen.has(word) && fits(word)) { seen.add(word); items.push({ word, kind, about: about || "" }); } };
  const definitions = definitionsOf(code).filter(d => d.line !== line || d.column + d.name.length < column);
  definitions.filter(d => d.indent === 0).forEach(d => add(d.name, "name"));
  definitions.forEach(d => add(d.name, d.input ? "input" : "field"));
  const stdlib = sprout().stdlib || {};
  for (const name of [...(stdlib.names || []), ...(stdlib.kitNames || []), ...(sprout().libraries ? sprout().libraries.names : [])]) add(name, own(stdlib.KITS, name) ? "kit" : "module", firstSentence((moduleDocs(name) || {}).about));
  for (const word of highlight().HOST_WORDS) add(word, "game");
  for (const word of sprout().knownWords()) if (/^[a-z]/i.test(word)) add(word, "word");
  ["start", "update", "draw", "input", "dt", "clock", "tapped", "touching", "touch-x", "touch-y", "held", "pressed", "released"].forEach(word => add(word, "game"));
  const rank = { name: 0, field: 1, input: 1, module: 2, kit: 2, game: 3, word: 4 };
  items.sort((a, b) => (rank[a.kind] - rank[b.kind]) || a.word.length - b.word.length || (a.word < b.word ? -1 : 1));
  return items.length ? result("words", items) : null;
}

// ===================================================================== colours
// hex to hue (0 to 360), saturation and lightness (0 to 1), and back; an alpha part (#rrggbbaa) is kept aside
function hexToHsl(hex) {
  let digits = hex.slice(1);
  if (digits.length === 3) digits = digits.replace(/./g, c => c + c);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16) / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const range = max - min, saturation = lightness > 0.5 ? range / (2 - max - min) : range / (max + min);
  const hue = max === r ? (g - b) / range + (g < b ? 6 : 0) : max === g ? (b - r) / range + 2 : (r - g) / range + 4;
  return [hue * 60, saturation, lightness];
}
function hslToHex(hue, saturation, lightness) {
  const channel = n => {
    const k = (n + hue / 30) % 12, a = saturation * Math.min(lightness, 1 - lightness);
    return Math.round((lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, "0");
  };
  return "#" + channel(0) + channel(8) + channel(4);
}

root.SproutCodeTools = { positionOf, offsetOf, wordAt, inCommentOrText, libraryDoc, moduleDocs, docAt, firstSentence, explain, format, definitionsOf,
  definitionOf, rename, replaceWord, isName, findAll, completions, hexToHsl, hslToHex };
})(typeof window !== "undefined" ? window : globalThis);
