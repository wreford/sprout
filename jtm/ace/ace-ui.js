/**
 * ACE UI 2.0 — Monte Carlo first
 *
 * The probability distribution IS the interface.
 * See the spread → ask why → find the risk → resolve it → watch the curve shift.
 *
 * Depends on ACE (ace-core.js), ACE_Schedule (ace-schedule.js), ACE_Data (ace-data.js).
 */

const ACE_UI = (function () {
  'use strict';

  var simMonth = 0, simPlaying = false, simSpeed = 1;
  var mcResults = null, mcPrev = null;
  var selectedRisk = null;        // risk atom id being inspected
  var selectedAtom = null;        // atom card overlay
  var view = 'mc';                // mc | graph | gantt | terminal
  var lastF = performance.now();

  // ── Init ────────────────────────────────────────────────────

  /** Boot the UI */
  function init() {
    render();
    runMC(1000);
    requestAnimationFrame(loop);
    document.addEventListener('keydown', onKey);
  }

  // ── Monte Carlo ─────────────────────────────────────────────

  /** Run MC and store results */
  function runMC(n) {
    mcPrev = mcResults;
    mcResults = ACE_Schedule.monteCarlo(n || 1000);
  }

  // ── Main Loop ───────────────────────────────────────────────

  function loop(now) {
    var dt = (now - lastF) / 1000; lastF = now;
    if (simPlaying) {
      simMonth = Math.min(ACE_Data.PLANT.dur, simMonth + dt * simSpeed * 0.5);
      updateSim();
    }
    requestAnimationFrame(loop);
  }

  /** Advance simulation: complete workable atoms, check risks */
  function updateSim() {
    var workable = ACE.workable();
    workable.forEach(function (a) {
      var dur = ACE_Schedule.durations[a.id];
      if (dur && simMonth >= (dur._start || 0) + dur.likely) {
        ACE.complete(a.id, 'M' + Math.round(simMonth));
      }
    });
    ACE.settle();
    // Check risks
    ACE.query({ type: 'risk' }).forEach(function (r) {
      if (!r._complete && r.tags.indexOf('fired') < 0 && simMonth >= (r._triggerMonth || 999)) {
        if (Math.random() < (r._probability || 0)) {
          r.tags.push('fired');
          runMC(1000);
        }
      }
    });
    renderContent();
  }

  // ── Render ──────────────────────────────────────────────────

  /** Full page render */
  function render() {
    var root = document.getElementById('app');
    root.innerHTML = renderHeader() + '<div class="ace-body">' + renderNav() + '<div class="ace-content" id="content"></div></div>';
    wireHeader();
    wireNav();
    renderContent();
  }

  /** Header bar */
  function renderHeader() {
    return '<div class="ace-hdr">' +
      '<span class="ace-title">ACE</span>' +
      '<button id="btn-play" class="hbtn">' + (simPlaying ? 'Pause' : 'Play') + '</button>' +
      '<button id="btn-speed" class="hbtn">' + simSpeed + 'x</button>' +
      '<input type="range" id="scrub" min="0" max="' + ACE_Data.PLANT.dur + '" value="' + simMonth + '" step="0.1" class="scrub">' +
      '<span class="hmo">M' + Math.round(simMonth) + ' / ' + ACE_Data.PLANT.dur + '</span>' +
      '<span class="hinfo">' + ACE.all().length + ' atoms</span>' +
      '</div>';
  }

  /** View switcher nav */
  function renderNav() {
    var tabs = [
      { id: 'mc', label: 'Monte Carlo' },
      { id: 'graph', label: 'Atoms' },
      { id: 'gantt', label: 'Schedule' },
      { id: 'terminal', label: 'Terminal' }
    ];
    return '<div class="ace-nav">' + tabs.map(function (t) {
      return '<button class="nav-btn' + (view === t.id ? ' active' : '') + '" data-view="' + t.id + '">' + t.label + '</button>';
    }).join('') + '</div>';
  }

  /** Route to active view */
  function renderContent() {
    var el = document.getElementById('content');
    if (!el) return;
    switch (view) {
      case 'mc': renderMC(el); break;
      case 'graph': renderGraph(el); break;
      case 'gantt': renderGantt(el); break;
      case 'terminal': renderTerminal(el); break;
    }
  }

  // ── MC View (Hero) ──────────────────────────────────────────

  /** The main event: Monte Carlo probability distributions */
  function renderMC(el) {
    if (!mcResults) { el.innerHTML = '<p>Running simulation...</p>'; return; }

    var p = mcResults;
    var spread = p.p80.finish - p.p50.finish;
    var spreadColor = spread <= ACE_Data.PLANT.dur * 0.08 ? 'var(--green)' :
                      spread <= ACE_Data.PLANT.dur * 0.15 ? 'var(--amber)' : 'var(--red)';

    var html = '';

    // Confidence summary — the headline
    html += '<div class="mc-headline">';
    html += '<div class="mc-h-label">Schedule Forecast</div>';
    html += '<div class="mc-h-row">';
    html += '<div class="mc-stat"><div class="mc-stat-v" style="color:var(--green)">M' + Math.round(p.p50.finish) + '</div><div class="mc-stat-l">P50</div></div>';
    html += '<div class="mc-stat"><div class="mc-stat-v" style="color:var(--amber)">M' + Math.round(p.p80.finish) + '</div><div class="mc-stat-l">P80</div></div>';
    html += '<div class="mc-stat"><div class="mc-stat-v" style="color:' + spreadColor + '">+' + Math.round(spread) + 'mo</div><div class="mc-stat-l">spread</div></div>';
    html += '</div>';

    // Shift indicator
    if (mcPrev) {
      var shift = Math.round(p.p50.finish) - Math.round(mcPrev.p50.finish);
      if (shift !== 0) {
        html += '<div class="mc-shift" style="color:' + (shift > 0 ? 'var(--red)' : 'var(--green)') + '">P50 shifted ' + (shift > 0 ? '+' : '') + shift + ' months</div>';
      }
    }
    html += '</div>';

    // Histogram
    html += '<div class="mc-hist-wrap"><canvas id="mc-hist" class="mc-canvas"></canvas></div>';

    // What's driving the spread — sensitivity
    html += '<div class="mc-drivers">';
    html += '<div class="mc-d-title">What drives the spread</div>';
    var risks = ACE.query({ type: 'risk' }).sort(function (a, b) {
      return (b._probability || 0) * (b._impact || 0) - (a._probability || 0) * (a._impact || 0);
    });
    risks.slice(0, 8).forEach(function (r) {
      var ev = ((r._probability || 0) * (r._impact || 0)).toFixed(1);
      var fired = r.tags.indexOf('fired') >= 0;
      html += '<div class="mc-risk' + (fired ? ' fired' : '') + (r.id === selectedRisk ? ' selected' : '') + '" data-risk="' + r.id + '">';
      html += '<span class="mc-r-name">' + r.name + '</span>';
      html += '<span class="mc-r-prob">' + Math.round((r._probability || 0) * 100) + '%</span>';
      html += '<span class="mc-r-impact">+' + (r._impact || 0) + 'mo</span>';
      html += '<span class="mc-r-ev">EV=' + ev + '</span>';
      if (fired) html += '<span class="mc-r-fired">[FIRED]</span>';
      html += '</div>';
    });
    html += '</div>';

    // Quick KPIs
    var cpm = ACE_Schedule.cpm();
    var ev = ACE.summary();
    html += '<div class="mc-kpis">';
    html += kpi('Atoms', ev.atoms);
    html += kpi('Complete', ev.complete + '/' + ev.atoms);
    html += kpi('Progress', ev.percent + '%');
    html += kpi('Workable', ev.workable);
    html += kpi('Critical', cpm.criticalPath ? cpm.criticalPath.length : '--');
    html += kpi('Month', 'M' + Math.round(simMonth));
    html += '</div>';

    el.innerHTML = html;

    // Draw histogram after DOM update
    setTimeout(function () { drawHistogram(); }, 20);

    // Wire risk clicks
    el.querySelectorAll('[data-risk]').forEach(function (row) {
      row.addEventListener('click', function () {
        selectedRisk = row.dataset.risk;
        showAtomCard(selectedRisk);
      });
    });
  }

  function kpi(label, value) {
    return '<div class="mc-kpi"><div class="mc-kpi-v">' + value + '</div><div class="mc-kpi-l">' + label + '</div></div>';
  }

  /** Draw MC histogram on canvas */
  function drawHistogram() {
    var cv = document.getElementById('mc-hist');
    if (!cv || !mcResults) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = cv.clientWidth, ch = cv.clientHeight;
    cv.width = cw * dpr; cv.height = ch * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    var results = mcResults.results;
    var minF = results[0].finish, maxF = results[results.length - 1].finish;
    var range = maxF - minF || 1;
    var bins = Math.min(40, Math.max(12, Math.round(range)));
    var counts = new Array(bins).fill(0);
    var maxCount = 0;

    results.forEach(function (r) {
      var idx = Math.min(bins - 1, Math.floor((r.finish - minF) / range * bins));
      counts[idx]++;
      if (counts[idx] > maxCount) maxCount = counts[idx];
    });

    var pad = { l: 10, r: 10, t: 10, b: 24 };
    var pw = cw - pad.l - pad.r, ph = ch - pad.t - pad.b;

    // Background
    c.fillStyle = '#221c10';
    c.fillRect(0, 0, cw, ch);

    // Bars
    var bw = pw / bins;
    for (var i = 0; i < bins; i++) {
      var x = pad.l + i * bw;
      var h = maxCount > 0 ? (counts[i] / maxCount) * ph : 0;
      var mo = minF + (i + 0.5) / bins * range;

      // Color by percentile
      if (mo <= mcResults.p50.finish) c.fillStyle = '#2f7d4f';
      else if (mo <= mcResults.p80.finish) c.fillStyle = '#a87718';
      else if (mo <= mcResults.p90.finish) c.fillStyle = '#b13d2c';
      else c.fillStyle = '#6c3020';

      c.fillRect(x + 1, pad.t + ph - h, bw - 2, h);
    }

    // Percentile lines
    [
      { v: mcResults.p10, label: 'P10', color: '#2f7d4f' },
      { v: mcResults.p50, label: 'P50', color: '#e8dcc8' },
      { v: mcResults.p80, label: 'P80', color: '#a87718' },
      { v: mcResults.p90, label: 'P90', color: '#b13d2c' }
    ].forEach(function (p) {
      var x = pad.l + ((p.v.finish - minF) / range) * pw;
      c.strokeStyle = p.color;
      c.lineWidth = 1.5;
      c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(x, pad.t); c.lineTo(x, pad.t + ph); c.stroke();
      c.setLineDash([]);
      c.fillStyle = p.color;
      c.font = '10px IBM Plex Mono, monospace';
      c.textAlign = 'center';
      c.fillText(p.label, x, pad.t + ph + 14);
    });

    // Month labels
    c.fillStyle = '#6a6050';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'center';
    for (var m = Math.ceil(minF / 12) * 12; m <= maxF; m += 12) {
      var mx = pad.l + ((m - minF) / range) * pw;
      c.fillText('M' + m, mx, pad.t + ph + 22);
    }
  }

  // ── Graph View ──────────────────────────────────────────────

  /** Atom list with search and type filter */
  function renderGraph(el) {
    var html = '<div class="graph-controls">';
    html += '<input type="text" id="graph-search" placeholder="Search atoms..." class="g-search" value="">';
    html += '<select id="graph-type" class="g-filter"><option value="">All types</option>';
    var types = {};
    ACE.all().forEach(function (a) { types[a.type] = (types[a.type] || 0) + 1; });
    Object.keys(types).sort().forEach(function (t) {
      html += '<option value="' + t + '">' + t + ' (' + types[t] + ')</option>';
    });
    html += '</select></div>';

    html += '<div id="graph-list" class="graph-list">';
    html += renderAtomList(ACE.all().slice(0, 50));
    html += '</div>';

    el.innerHTML = html;

    // Wire search/filter
    var search = document.getElementById('graph-search');
    var typeFilter = document.getElementById('graph-type');
    function update() {
      var f = {};
      if (search.value.trim()) f.search = search.value.trim();
      if (typeFilter.value) f.type = typeFilter.value;
      var results = ACE.query(f).slice(0, 80);
      document.getElementById('graph-list').innerHTML = renderAtomList(results);
      wireAtomClicks();
    }
    search.addEventListener('input', update);
    typeFilter.addEventListener('change', update);
    wireAtomClicks();
  }

  function renderAtomList(atoms) {
    return atoms.map(function (a) {
      var status = a._complete ? 'done' : 'open';
      return '<div class="atom-row" data-atom="' + a.id + '">' +
        '<span class="a-dot ' + status + '"></span>' +
        '<span class="a-id">' + a.id + '</span>' +
        '<span class="a-name">' + a.name + '</span>' +
        '<span class="a-type">' + a.type + '</span>' +
        '<span class="a-kind">' + a.kind + '</span>' +
        '</div>';
    }).join('');
  }

  function wireAtomClicks() {
    document.querySelectorAll('[data-atom]').forEach(function (row) {
      row.addEventListener('click', function () { showAtomCard(row.dataset.atom); });
    });
  }

  // ── Gantt View ──────────────────────────────────────────────

  /** Simple Gantt from CPM data */
  function renderGantt(el) {
    el.innerHTML = '<canvas id="gantt-cv" class="gantt-canvas"></canvas>';
    setTimeout(drawGantt, 20);
  }

  function drawGantt() {
    var cv = document.getElementById('gantt-cv');
    if (!cv) return;
    var cpm = ACE_Schedule.cpm();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = cv.clientWidth, ch = cv.clientHeight;
    cv.width = cw * dpr; cv.height = ch * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    c.fillStyle = '#faf7ee';
    c.fillRect(0, 0, cw, ch);

    var phases = ACE.query({ type: 'phase' });
    if (!phases.length) { c.fillStyle = '#9a9077'; c.font = '12px IBM Plex Mono'; c.fillText('No phase atoms found', 20, 30); return; }

    var maxFinish = cpm.projectFinish || ACE_Data.PLANT.dur;
    var labelW = 90, padR = 10, padT = 20, padB = 16;
    var chartW = cw - labelW - padR, chartH = ch - padT - padB;
    var rowH = Math.min(28, chartH / phases.length);

    // Grid
    c.strokeStyle = '#ede7d6'; c.lineWidth = 0.5;
    for (var m = 0; m <= maxFinish; m += 12) {
      var x = labelW + (m / maxFinish) * chartW;
      c.beginPath(); c.moveTo(x, padT); c.lineTo(x, padT + chartH); c.stroke();
      c.fillStyle = '#9a9077'; c.font = '9px IBM Plex Mono, monospace'; c.textAlign = 'center';
      c.fillText('M' + m, x, padT + chartH + 12);
    }

    // Phase bars
    phases.forEach(function (p, i) {
      var start = cpm.finishes[p.id] ? cpm.finishes[p.id] - (ACE_Schedule.durations[p.id] ? ACE_Schedule.durations[p.id].likely : 0) : 0;
      var finish = cpm.finishes[p.id] || 0;
      var y = padT + i * rowH;
      var x0 = labelW + (start / maxFinish) * chartW;
      var x1 = labelW + (finish / maxFinish) * chartW;
      var bh = rowH * 0.65;
      var by = y + (rowH - bh) / 2;

      // Label
      c.fillStyle = '#544c3a'; c.font = '10px IBM Plex Mono, monospace'; c.textAlign = 'right';
      c.fillText(p.name.slice(0, 12), labelW - 6, by + bh * 0.7);

      // Bar
      var onCrit = cpm.criticalPath && cpm.criticalPath.indexOf(p.id) >= 0;
      c.fillStyle = onCrit ? '#a8401f44' : '#2c5d7833';
      c.fillRect(x0, by, x1 - x0, bh);
      // Progress fill
      var pct = ACE.percentComplete(p.id) / 100;
      c.fillStyle = onCrit ? '#a8401f' : '#2c5d78';
      c.fillRect(x0, by, (x1 - x0) * pct, bh);

      if (onCrit) {
        c.strokeStyle = '#a8401f'; c.lineWidth = 1.5;
        c.strokeRect(x0, by, x1 - x0, bh);
      }
    });

    // Current month line
    var cmx = labelW + (simMonth / maxFinish) * chartW;
    c.strokeStyle = '#a8401f'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cmx, padT - 4); c.lineTo(cmx, padT + chartH + 4); c.stroke();
    c.fillStyle = '#a8401f'; c.font = 'bold 10px IBM Plex Mono'; c.textAlign = 'center';
    c.fillText('M' + Math.round(simMonth), cmx, padT - 6);
  }

  // ── Terminal ────────────────────────────────────────────────

  var termLines = ['ACE 2.0 -- Atomic Constraint Engine', 'Type "help" for commands.', ''];
  var termCmdHistory = [], termHistIdx = -1;

  function renderTerminal(el) {
    el.innerHTML = '<div class="term" id="term-out">' + termLines.join('\n') + '</div>' +
      '<input class="term-in" id="term-in" placeholder="C:\\NDX>" autofocus>';

    var inp = document.getElementById('term-in');
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var cmd = inp.value.trim();
        if (cmd) { termCmdHistory.push(cmd); termHistIdx = termCmdHistory.length; }
        execCmd(cmd);
        inp.value = '';
      }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (termHistIdx > 0) { termHistIdx--; inp.value = termCmdHistory[termHistIdx]; } }
      if (e.key === 'ArrowDown') { e.preventDefault(); if (termHistIdx < termCmdHistory.length - 1) { termHistIdx++; inp.value = termCmdHistory[termHistIdx]; } else { termHistIdx = termCmdHistory.length; inp.value = ''; } }
      if (e.key === 'Tab') {
        e.preventDefault();
        var cmds = ['query', 'atom', 'risks', 'mc', 'forecast', 'status', 'workable', 'settle', 'complete', 'export', 'help', 'clear'];
        var v = inp.value.trim().toLowerCase();
        var matches = cmds.filter(function (c) { return c.indexOf(v) === 0; });
        if (matches.length === 1) inp.value = matches[0] + ' ';
        else if (matches.length > 1) termPrint(matches.join('  '));
      }
    });
  }

  function termPrint(text) {
    termLines.push(text);
    var out = document.getElementById('term-out');
    if (out) { out.textContent = termLines.join('\n'); out.scrollTop = out.scrollHeight; }
  }

  function execCmd(cmd) {
    termPrint('> ' + cmd);
    var parts = cmd.split(/\s+/);
    var verb = (parts[0] || '').toLowerCase();

    if (verb === 'help') termPrint('Commands: query <type>, atom <id>, risks, mc [n], forecast, status, workable, settle, complete <id>, export json|csv, clear');
    else if (verb === 'clear') { termLines.length = 0; var out = document.getElementById('term-out'); if (out) out.textContent = ''; }
    else if (verb === 'status') { var s = ACE.summary(); termPrint('Atoms: ' + s.atoms + '  Complete: ' + s.complete + '  Progress: ' + s.percent + '%  Workable: ' + s.workable); }
    else if (verb === 'risks') { ACE.query({ type: 'risk' }).forEach(function (r) { termPrint(r.id + '  ' + r.name + '  P=' + Math.round((r._probability || 0) * 100) + '%  +' + (r._impact || 0) + 'mo' + (r.tags.indexOf('fired') >= 0 ? '  [FIRED]' : '')); }); }
    else if (verb === 'forecast' || verb === 'mc') {
      var n = parseInt(parts[1]) || 1000;
      runMC(n);
      termPrint('Monte Carlo (' + n + ' runs):  P50=M' + Math.round(mcResults.p50.finish) + '  P80=M' + Math.round(mcResults.p80.finish) + '  P90=M' + Math.round(mcResults.p90.finish));
    }
    else if (verb === 'workable') { ACE.workable().forEach(function (a) { termPrint(a.id + '  ' + a.name); }); }
    else if (verb === 'settle') { var n = ACE.settle(); termPrint('Settled: ' + n + ' atoms changed'); }
    else if (verb === 'complete' && parts[1]) { var ok = ACE.complete(parts[1], 'terminal'); ACE.settle(); termPrint(ok ? parts[1] + ' cleared' : 'Cannot clear ' + parts[1]); if (ok) runMC(1000); }
    else if (verb === 'atom' && parts[1]) {
      var a = ACE.get(parts[1]);
      if (!a) { termPrint('Not found: ' + parts[1]); return; }
      termPrint(JSON.stringify({ id: a.id, name: a.name, type: a.type, kind: a.kind, tags: a.tags, complete: a._complete, requires: a.requires, contains: a.contains }, null, 2));
    }
    else if (verb === 'query') {
      var f = {};
      if (parts[1]) f.type = parts[1];
      var r = ACE.query(f);
      termPrint(r.length + ' results');
      r.slice(0, 20).forEach(function (a) { termPrint(a.id + '  ' + a.name + '  [' + a.type + '] ' + (a._complete ? 'DONE' : 'OPEN')); });
      if (r.length > 20) termPrint('... +' + (r.length - 20) + ' more');
    }
    else if (verb === 'export') {
      if (parts[1] === 'json') { var blob = new Blob([JSON.stringify(ACE.exportJSON(), null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ace-atoms.json'; a.click(); termPrint('Exported JSON'); }
      else if (parts[1] === 'csv') { var csv = 'id,name,type,kind,complete\n'; ACE.all().forEach(function (a) { csv += a.id + ',"' + a.name + '",' + a.type + ',' + a.kind + ',' + (a._complete ? 'Y' : 'N') + '\n'; }); var blob2 = new Blob([csv], { type: 'text/csv' }); var a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob2); a2.download = 'ace-atoms.csv'; a2.click(); termPrint('Exported CSV'); }
      else termPrint('export json | export csv');
    }
    else if (cmd.trim()) termPrint('Unknown: ' + verb + '. Type "help".');
  }

  // ── Atom Card Overlay ───────────────────────────────────────

  function showAtomCard(id) {
    var a = ACE.get(id);
    if (!a) return;
    selectedAtom = id;

    var html = '<div class="card-overlay" id="card-ov"><div class="card-modal">';

    // Breadcrumb
    var anc = ACE.ancestors(id);
    if (anc.length) {
      html += '<div class="card-crumb">' + anc.map(function (aid) {
        var p = ACE.get(aid);
        return '<span class="crumb-link" data-goto="' + aid + '">' + (p ? p.name : aid) + '</span>';
      }).join(' > ') + ' > <b>' + a.name + '</b></div>';
    }

    // Header
    html += '<h3>' + a.id + ' -- ' + a.name + '</h3>';

    // Tags
    if (a.tags.length) {
      html += '<div class="card-tags">' + a.tags.map(function (t) {
        return '<span class="tag-pill">' + t + '</span>';
      }).join('') + '</div>';
    }

    // Fields
    html += '<div class="card-fields">';
    html += field('Type', a.type);
    html += field('Kind', a.kind);
    html += field('Status', a._complete ? 'COMPLETE' : 'OPEN');
    html += field('Progress', ACE.percentComplete(id) + '%');
    if (a._evidence) html += field('Evidence', a._evidence);
    if (a._narrative) html += field('Narrative', a._narrative);
    // Type-specific
    if (a._probability !== undefined) html += field('Probability', Math.round(a._probability * 100) + '%');
    if (a._impact !== undefined) html += field('Impact', '+' + a._impact + ' months');
    html += '</div>';

    // Requires
    if (a.requires.length) {
      html += '<div class="card-section">Requires (' + a.requires.length + ')</div>';
      a.requires.forEach(function (rid) {
        var r = ACE.get(rid);
        html += '<div class="card-link" data-goto="' + rid + '"><span class="a-dot ' + (r && r._complete ? 'done' : 'open') + '"></span>' + rid + (r ? ' -- ' + r.name : '') + '</div>';
      });
    }

    // Contains
    if (a.contains.length) {
      html += '<div class="card-section">Contains (' + a.contains.length + ')</div>';
      a.contains.forEach(function (cid) {
        var ch = ACE.get(cid);
        html += '<div class="card-link" data-goto="' + cid + '"><span class="a-dot ' + (ch && ch._complete ? 'done' : 'open') + '"></span>' + cid + (ch ? ' -- ' + ch.name : '') + '</div>';
      });
    }

    // Who requires this atom
    var depBy = ACE.all().filter(function (x) { return x.requires.indexOf(id) >= 0; });
    if (depBy.length) {
      html += '<div class="card-section">Required by (' + depBy.length + ')</div>';
      depBy.forEach(function (d) {
        html += '<div class="card-link" data-goto="' + d.id + '"><span class="a-dot ' + (d._complete ? 'done' : 'open') + '"></span>' + d.id + ' -- ' + d.name + '</div>';
      });
    }

    // Source JSON
    html += '<div class="card-section" style="margin-top:10px"><button class="src-btn" id="src-toggle">[Source]</button></div>';
    var src = JSON.stringify({ id: a.id, name: a.name, type: a.type, kind: a.kind, tags: a.tags, requires: a.requires, contains: a.contains, complete: a._complete }, null, 2);
    html += '<pre class="card-src" id="card-src" style="display:none">' + syntaxHL(src) + '</pre>';

    // Manual completion button
    if (a.kind === 'manual' && !a._complete) {
      html += '<button class="complete-btn" id="btn-complete">Clear this atom</button>';
    }

    html += '</div></div>';

    // Insert overlay
    var ov = document.createElement('div');
    ov.innerHTML = html;
    document.body.appendChild(ov.firstChild);

    // Wire events
    document.getElementById('card-ov').addEventListener('click', function (e) {
      if (e.target.id === 'card-ov') closeCard();
      var goto = e.target.closest('[data-goto]');
      if (goto) { closeCard(); showAtomCard(goto.dataset.goto); }
    });
    var srcBtn = document.getElementById('src-toggle');
    if (srcBtn) srcBtn.addEventListener('click', function () {
      var src = document.getElementById('card-src');
      src.style.display = src.style.display === 'none' ? 'block' : 'none';
    });
    var compBtn = document.getElementById('btn-complete');
    if (compBtn) compBtn.addEventListener('click', function () {
      ACE.complete(id, 'M' + Math.round(simMonth), 'Manually cleared');
      ACE.settle();
      runMC(1000);
      closeCard();
      renderContent();
    });
  }

  function field(label, value) {
    return '<div class="card-field"><span class="cf-l">' + label + '</span><span class="cf-v">' + value + '</span></div>';
  }

  function syntaxHL(json) {
    return json.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/"([^"]+)":/g, '<span style="color:#a8401f">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span style="color:#b8cfbb">"$1"</span>')
      .replace(/: (\d+)/g, ': <span style="color:#d6c391">$1</span>')
      .replace(/: (true|false)/g, ': <span style="color:#a89bdb">$1</span>');
  }

  function closeCard() {
    var ov = document.getElementById('card-ov');
    if (ov) ov.remove();
    selectedAtom = null;
  }

  // ── Wiring ──────────────────────────────────────────────────

  function wireHeader() {
    document.getElementById('btn-play').addEventListener('click', function () {
      simPlaying = !simPlaying;
      this.textContent = simPlaying ? 'Pause' : 'Play';
    });
    document.getElementById('btn-speed').addEventListener('click', function () {
      simSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : simSpeed === 5 ? 10 : 1;
      this.textContent = simSpeed + 'x';
    });
    document.getElementById('scrub').addEventListener('input', function () {
      simMonth = parseFloat(this.value);
      simPlaying = false;
      document.getElementById('btn-play').textContent = 'Play';
      renderContent();
    });
  }

  function wireNav() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        view = btn.dataset.view;
        render();
      });
    });
  }

  function onKey(e) {
    if (e.key === 'Escape') closeCard();
  }

  return { init: init };
})();
