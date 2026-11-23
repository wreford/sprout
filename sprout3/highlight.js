// Sprout syntax highlighting, shared by the playground (play.html), Greenhouse (ide.html), the SilverEye guide and the
// pocket console's program sheet. It reads one line the way Sprout 3's tokenizer does (tokensOf), works out what each
// word is doing there (rolesOf), and line() turns that into HTML. The editors use the tokens too: to find the numbers
// and colours to drag, the names to rename, and the word under the pointer.
(function (root) {
"use strict";
const escapeHTML = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const WORD_STOP = " \t[](),|:\"";
const NUMBER = /^-?\d+(\.\d+)?$/;
const sprout = () => root.Sprout3;

// the words the game layer gives a game (live3.js and the consoles): its screen, drawing, sound and saving
const HOST_WORDS = new Set(["W", "H", "me", "saved", "clear", "rect", "circle", "line", "text", "sprite", "tiles", "ring", "glow",
  "gradient", "view", "block", "model", "hold", "flash", "fog", "light", "sky", "beam", "beep", "shake", "sound", "hiss", "buzz"]);

// ===================================================================== tokens
// A token is { kind, start, end }: its text is line.slice(start, end). The kinds are space, comment, text, literal,
// number, word, open ([ or (), close (] or )), comma, colon and bar. A literal has its form (pair, colour, date ...).
// A text token has its inserts, each [ ] inside it read as code: { start, end, tokens }, and its escapes (\n, \[ ...)
// as the offsets where they start.
function tokensOf(line, from = 0, to = line.length) {
  const tokens = [];
  let at = from;
  while (at < to) {
    const char = line[at], start = at;
    if (char === " " || char === "\t") {
      while (at < to && (line[at] === " " || line[at] === "\t")) at++;
      tokens.push({ kind: "space", start, end: at });
    } else if (char === "-" && line[at + 1] === "-") {
      tokens.push({ kind: "comment", start, end: to });
      at = to;
    } else if (char === '"') {
      const text = readText(line, at, to);
      tokens.push(text);
      at = text.end;
    } else if (char === "[" || char === "(") {
      tokens.push({ kind: "open", start, end: ++at });
    } else if (char === "]" || char === ")") {
      tokens.push({ kind: "close", start, end: ++at });
    } else if (char === ",") {
      tokens.push({ kind: "comma", start, end: ++at });
    } else if (char === ":") {
      tokens.push({ kind: "colon", start, end: ++at });
    } else if (char === "|") {
      tokens.push({ kind: "bar", start, end: ++at });
    } else {
      const literal = sprout() && sprout().lexLiteral(line, at);
      if (literal) {
        at += literal.length;
        tokens.push({ kind: literal.form === "percent" ? "number" : "literal", form: literal.form, start, end: at });
        continue;
      }
      while (at < to && !WORD_STOP.includes(line[at]) && !(line[at] === "-" && line[at + 1] === "-" && at > start)) at++;
      const word = line.slice(start, at);
      if (NUMBER.test(word)) tokens.push({ kind: "number", start, end: at });
      // a trailing ! is its own word, as Sprout reads it: hello! is hello ! (decision 67)
      else if (word.length > 1 && word.endsWith("!")) tokens.push({ kind: "word", start, end: at - 1 }, { kind: "word", start: at - 1, end: at });
      else tokens.push({ kind: "word", start, end: at });
    }
  }
  return tokens;
}

// a text, from its opening quote to its closing one (or to the end of the line, if it is never closed)
function readText(line, start, to) {
  const inserts = [], escapes = [];
  let at = start + 1;
  while (at < to && line[at] !== '"') {
    if (line[at] === "\\") { escapes.push(at); at += 2; continue; }
    if (line[at] === "[") {
      // an insert runs to its matching ], and never past a quote
      let depth = 1, close = at + 1;
      while (close < to && line[close] !== '"') {
        if (line[close] === "[") depth++;
        else if (line[close] === "]") depth--;
        if (depth === 0) break;
        close++;
      }
      const closed = close < to && line[close] === "]";
      inserts.push({ start: at, end: closed ? close + 1 : close, closed, tokens: tokensOf(line, at + 1, close) });
      at = closed ? close + 1 : close;
      continue;
    }
    at++;
  }
  const closed = at < to && line[at] === '"';
  return { kind: "text", start, end: closed ? at + 1 : Math.min(at, to), closed, inserts, escapes };
}

// ===================================================================== what each word is doing
// Each token's role on its line: "define" (a name given a value, before :), "input" (a cell's input, named before |),
// "module" (a library module or kit), "module-word" (one of that module's words, right after it), "host" (a word the
// game layer gives a game), "known" (a word Sprout knows), "constant" (true, false and !), or "" for anything else.
function rolesOf(tokens, line, knownWords) {
  const known = knownWords || defaultKnownWords(), inputs = inputTokens(tokens, line);
  const nextSolid = i => { for (let j = i + 1; j < tokens.length; j++) if (tokens[j].kind !== "space") return tokens[j]; return null; };
  let previousWord = null;
  return tokens.map((token, i) => {
    if (token.kind === "space") return "";
    if (token.kind !== "word") { previousWord = null; return ""; }
    const word = line.slice(token.start, token.end), before = previousWord;
    previousWord = word;
    if (inputs.has(i)) return "input";
    const next = nextSolid(i);
    if (next && next.kind === "colon") return "define";
    if (word === "true" || word === "false" || word === "!") return "constant";
    if (isModule(word)) return "module";
    if (before && moduleWords(before).has(word)) return "module-word";
    if (HOST_WORDS.has(word)) return "host";
    if (known.has(word)) return "known";
    return "";
  });
}

// the words a [ ... | names as its inputs, all on this line: [g | ...], [x y : 0 | ...], [[i, item] | ...]
function inputTokens(tokens, line) {
  const inputs = new Set();
  tokens.forEach((token, i) => {
    if (token.kind !== "open" || line[token.start] !== "[") return;
    let depth = 0;
    for (let j = i + 1; j < tokens.length; j++) {
      const kind = tokens[j].kind;
      if (kind === "open") depth++;
      else if (kind === "close") { if (depth === 0) return; depth--; }
      else if (kind === "bar" && depth === 0) {
        // the names before |, but not a default's value: in [y : 0 |], y is an input and 0 its default
        let afterColon = false;
        for (let k = i + 1; k < j; k++) {
          if (tokens[k].kind === "colon") afterColon = true;
          else if (tokens[k].kind === "word") { if (!afterColon) inputs.add(k); afterColon = false; }
          else if (tokens[k].kind !== "space") afterColon = false;
        }
        return;
      }
    }
  });
  return inputs;
}

// ===================================================================== library modules and kits
// A module's words are the names its source binds at the start of a line. Wrapped libraries (libs.js) are modules too.
// The stdlib's modules are read from their sources, never through Sprout's globals, which would compile them.
let moduleWordLists = null;
function moduleSources() {
  const stdlib = (sprout() && sprout().stdlib) || {};
  return [stdlib.SOURCES || {}, stdlib.KITS || {}];
}
function moduleWords(name) {
  if (!moduleWordLists) {
    moduleWordLists = new Map();
    for (const sources of moduleSources()) for (const module of Object.keys(sources))
      moduleWordLists.set(module, new Set([...sources[module].matchAll(/^([a-z][\w?!-]*)\s*:/gim)].map(match => match[1])));
  }
  if (!moduleWordLists.has(name)) moduleWordLists.set(name, globalCellWords(name));
  return moduleWordLists.get(name);
}
// a word of Sprout's own that is a record of words, as lick (read, write), stack and json are: its fields
function globalCellWords(name) {
  const libraries = sprout() && sprout().libraries;
  if (libraries && Object.prototype.hasOwnProperty.call(libraries.LIBRARIES, name)) return wrappedLibraryWords(libraries.LIBRARIES[name]);
  const globals = sprout() && sprout().globals;
  if (!name || !globals || !Object.prototype.hasOwnProperty.call(globals, name)) return new Set();
  try { const value = globals[name]; return new Set(value && typeof value.fieldNames === "function" ? value.fieldNames() : []); } catch (e) { return new Set(); }
}
// a wrapped library's words, asked of a stand-in for the library: reading its global would load it, or log that it is
// still loading
function wrappedLibraryWords(library) {
  try { return new Set(Object.keys(library.words(new Proxy(function () {}, { get: () => () => {}, apply: () => ({}) })))); } catch (e) { return new Set(); }
}
function isModule(word) {
  if (moduleWordLists === null) moduleWords("");
  if (moduleSources().some(sources => Object.prototype.hasOwnProperty.call(sources, word))) return true;
  const libraries = sprout() && sprout().libraries;
  return !!(libraries && Object.prototype.hasOwnProperty.call(libraries.LIBRARIES, word));
}

let knownCache = null;
function defaultKnownWords() {
  // every word Sprout itself knows, asked once and then kept
  if (!knownCache) knownCache = sprout() && sprout().knownWords ? sprout().knownWords() : new Set();
  return knownCache;
}

// ===================================================================== HTML
const ROLE_CLASS = { define: "d", input: "p", module: "a m", "module-word": "a mw", host: "a h", known: "a", constant: "k" };
const span = (cls, text) => `<i class="${cls}">${escapeHTML(text)}</i>`;

// One line of Sprout in, HTML out. With no list of words given, every word Sprout knows is highlighted as known.
function line(text, knownWords) {
  return tokensHTML(text, tokensOf(text), knownWords || defaultKnownWords());
}
function tokensHTML(text, tokens, known) {
  const roles = rolesOf(tokens, text, known);
  let html = "";
  tokens.forEach((token, i) => {
    const source = text.slice(token.start, token.end);
    if (token.kind === "comment") html += span("c", source);
    else if (token.kind === "text") html += textHTML(text, token, known);
    else if (token.kind === "literal") html += span("l", source);
    else if (token.kind === "number") html += span("n", source);
    else if (token.kind === "colon" || token.kind === "bar") html += span("o", source);
    else if (token.kind === "word" && ROLE_CLASS[roles[i]]) html += span(ROLE_CLASS[roles[i]], source);
    else html += escapeHTML(source);
  });
  return html;
}
// a text: its plain parts, its escapes (as licks write their outlines, "garden\n  pip 9") and its inserts, read as code
function textHTML(text, token, known) {
  let html = "", plain = "", at = token.start;
  const flush = () => { if (plain) html += span("s", plain); plain = ""; };
  const insertAt = new Map(token.inserts.map(insert => [insert.start, insert])), escapes = new Set(token.escapes);
  while (at < token.end) {
    const insert = insertAt.get(at);
    if (insert) {
      flush();
      // an insert's tokens hold their places on the whole line, so they are written from it
      html += `<i class="tp">[${tokensHTML(text, insert.tokens, known)}${insert.closed ? "]" : ""}</i>`;
      at = insert.end;
    } else if (escapes.has(at)) {
      flush();
      html += span("s e", text.slice(at, at + 2));
      at += 2;
    } else plain += text[at++];
  }
  flush();
  return html;
}
root.Sprout3Highlight = { line, esc: escapeHTML, tokensOf, rolesOf, moduleWords, isModule, HOST_WORDS };
})(typeof window !== "undefined" ? window : globalThis);
