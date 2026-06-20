/**
 * ACE UI — Clean single-page interface for the Atomic Constraint Engine
 *
 * Depends on ACE (ace-core.js), ACE_Schedule (ace-schedule.js), ACE_Data (ace-data.js).
 * Renders everything from ACE state. No local UI state beyond active tab and sim clock.
 */

const ACE_UI = (function () {
  'use strict';

  // ── State ───────────────────────────────────────────────────
  var activeTab = 'dashboard';
  var simMonth = 0;
  var simPlaying = false;
  var simSpeed = 1;            // months per second
  var simInterval = null;
  var overlayAtomId = null;
  var overlayEditMode = false;
  var overlayShowSource = false;
  var terminalHistory = [];
  var terminalInput = '';
  var filterText = '';
  var filterType = '';

  // ── Cached schedule data ────────────────────────────────────
  var cachedCPM = null;
  var cachedMC = null;

  /** Initialize the UI after DOM is ready */
  function init() {
    ACE_Data.load();
    cachedCPM = ACE_Schedule.cpm();
    cachedMC = ACE_Schedule.monteCarlo(1000);
    render();
    bindEvents();
    terminalHistory.push({ type: 'system', text: 'ACE 2.0 — Atomic Constraint Engine' });
    terminalHistory.push({ type: 'system', text: 'Type "help" for available commands.' });
  }

  /** Full re-render of the active view */
  function render() {
    renderTopBar();
    renderSidebar();
    renderContent();
    if (overlayAtomId) renderOverlay();
  }

  // ── Top Bar ─────────────────────────────────────────────────

  /** Render the top control bar */
  function renderTopBar() {
    var bar = document.getElementById('topbar');
    var pct = ACE.summary().percent;
    bar.innerHTML =
      '<div class="topbar-left">' +
        '<span class="topbar-title">ACE</span>' +
        '<span class="topbar-subtitle">' + ACE_Data.PLANT.name + '</span>' +
      '</div>' +
      '<div class="topbar-controls">' +
        '<button id="btn-play" class="btn-ctrl">' + (simPlaying ? '[Pause]' : '[Play]') + '</button>' +
        '<select id="sel-speed" class="sel-speed">' +
          '<option value="0.5"' + (simSpeed === 0.5 ? ' selected' : '') + '>0.5x</option>' +
          '<option value="1"' + (simSpeed === 1 ? ' selected' : '') + '>1x</option>' +
          '<option value="2"' + (simSpeed === 2 ? ' selected' : '') + '>2x</option>' +
          '<option value="4"' + (simSpeed === 4 ? ' selected' : '') + '>4x</option>' +
        '</select>' +
        '<input type="range" id="scrubber" min="0" max="' + ACE_Data.PLANT.baselineMonths + '" value="' + simMonth + '" class="scrubber" />' +
        '<span class="topbar-month">Month ' + simMonth + ' / ' + ACE_Data.PLANT.baselineMonths + '</span>' +
        '<span class="topbar-pct">' + pct + '% EV</span>' +
      '</div>';
  }

  // ── Sidebar ─────────────────────────────────────────────────

  /** Render the sidebar tab list */
  function renderSidebar() {
    var sidebar = document.getElementById('sidebar');
    var tabs = [
      { id: 'dashboard',   label: 'Dashboard' },
      { id: 'constraints', label: 'Constraints' },
      { id: 'wbs',         label: 'WBS' },
      { id: 'risks',       label: 'Risks' },
      { id: 'ask',         label: 'Ask ACE' }
    ];
    var html = '<div class="sidebar-tabs">';
    tabs.forEach(function (t) {
      var cls = t.id === activeTab ? 'sidebar-tab active' : 'sidebar-tab';
      html += '<button class="' + cls + '" data-tab="' + t.id + '">' + t.label + '</button>';
    });
    html += '</div>';

    // Summary below tabs
    var s = ACE.summary();
    html += '<div class="sidebar-summary">' +
      '<div class="sidebar-stat"><span class="stat-val">' + s.atoms + '</span><span class="stat-lbl">Atoms</span></div>' +
      '<div class="sidebar-stat"><span class="stat-val">' + s.complete + '</span><span class="stat-lbl">Done</span></div>' +
      '<div class="sidebar-stat"><span class="stat-val">' + s.workable + '</span><span class="stat-lbl">Workable</span></div>' +
    '</div>';

    // Export buttons
    html += '<div class="sidebar-export">' +
      '<button id="btn-export-json" class="btn-export">[Export JSON]</button>' +
      '<button id="btn-export-csv" class="btn-export">[Export CSV]</button>' +
    '</div>';

    sidebar.innerHTML = html;
  }

  // ── Content Router ──────────────────────────────────────────

  /** Render the main content area based on active tab */
  function renderContent() {
    var content = document.getElementById('content');
    switch (activeTab) {
      case 'dashboard':   renderDashboard(content); break;
      case 'constraints': renderConstraints(content); break;
      case 'wbs':         renderWBS(content); break;
      case 'risks':       renderRisks(content); break;
      case 'ask':         renderAskACE(content); break;
    }
  }

  // ── Dashboard ───────────────────────────────────────────────

  /** Render the dashboard: Gantt + KPIs + event feed */
  function renderDashboard(el) {
    var html = '<div class="dash-gantt"><canvas id="gantt-canvas"></canvas></div>';
    html += '<div class="dash-kpis">' + renderKPIs() + '</div>';
    html += '<div class="dash-feed">' + renderEventFeed() + '</div>';
    el.innerHTML = html;
    requestAnimationFrame(function () { drawGantt(); });
  }

  /** Build KPI row HTML */
  function renderKPIs() {
    var s = ACE.summary();
    var es = ACE_Schedule.earnedSchedule(simMonth);
    var spi = es.spi_t;
    var cpi = s.percent > 0 ? Math.min(s.percent / Math.max(1, plannedPct(simMonth)), 2.0) : 1.0;
    var p50 = cachedMC ? cachedMC.p50.finish.toFixed(1) : '--';
    var p80 = cachedMC ? cachedMC.p80.finish.toFixed(1) : '--';
    var workforce = estimateWorkforce(simMonth);

    return '<div class="kpi"><span class="kpi-val">' + s.percent + '%</span><span class="kpi-lbl">Earned Value</span></div>' +
      '<div class="kpi"><span class="kpi-val ' + (spi >= 1 ? 'kpi-good' : 'kpi-bad') + '">' + spi.toFixed(2) + '</span><span class="kpi-lbl">SPI(t)</span></div>' +
      '<div class="kpi"><span class="kpi-val ' + (cpi >= 1 ? 'kpi-good' : 'kpi-bad') + '">' + cpi.toFixed(2) + '</span><span class="kpi-lbl">CPI</span></div>' +
      '<div class="kpi"><span class="kpi-val">' + workforce + '</span><span class="kpi-lbl">Workforce</span></div>' +
      '<div class="kpi"><span class="kpi-val">' + p50 + 'mo</span><span class="kpi-lbl">P50</span></div>' +
      '<div class="kpi"><span class="kpi-val">' + p80 + 'mo</span><span class="kpi-lbl">P80</span></div>';
  }

  /** Planned percent at a given month (S-curve) */
  function plannedPct(month) {
    var t = month / ACE_Data.PLANT.baselineMonths;
    return Math.round(100 * (3 * t * t - 2 * t * t * t));
  }

  /** Rough workforce estimate based on S-curve derivative */
  function estimateWorkforce(month) {
    var t = month / ACE_Data.PLANT.baselineMonths;
    var derivative = 6 * t * (1 - t);
    return Math.round(derivative * 8500);
  }

  /** Build event feed HTML */
  function renderEventFeed() {
    var completed = ACE.query({ complete: true });
    var recent = completed.slice(-10).reverse();
    if (recent.length === 0) return '<div class="feed-empty">No events yet. Press [Play] to begin simulation.</div>';
    var html = '<div class="feed-title">Recent Events</div>';
    recent.forEach(function (a) {
      html += '<div class="feed-item"><span class="feed-type">[' + a.type + ']</span> ' +
        '<span class="feed-name" data-atom="' + a.id + '">' + a.name + '</span></div>';
    });
    return html;
  }

  // ── Gantt Chart ─────────────────────────────────────────────

  /** Draw the Gantt chart on the canvas */
  function drawGantt() {
    var canvas = document.getElementById('gantt-canvas');
    if (!canvas) return;
    var container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    var pad = { top: 30, right: 20, bottom: 25, left: 140 };

    // Clear
    ctx.fillStyle = getCSS('--paper');
    ctx.fillRect(0, 0, W, H);

    // Phases to draw
    var phases = ACE.query({ type: 'phase' });
    if (phases.length === 0) return;

    var cpmData = cachedCPM;
    var maxMonth = ACE_Data.PLANT.baselineMonths;
    var barH = Math.min(22, (H - pad.top - pad.bottom) / phases.length - 4);
    var scaleX = (W - pad.left - pad.right) / maxMonth;

    // Month grid
    ctx.strokeStyle = getCSS('--faint');
    ctx.lineWidth = 0.5;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = getCSS('--faint');
    for (var m = 0; m <= maxMonth; m += 12) {
      var x = pad.left + m * scaleX;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, H - pad.bottom);
      ctx.stroke();
      ctx.fillText('M' + m, x, H - pad.bottom + 14);
    }

    // Current month line
    var nowX = pad.left + simMonth * scaleX;
    ctx.strokeStyle = getCSS('--oxide');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nowX, pad.top);
    ctx.lineTo(nowX, H - pad.bottom);
    ctx.stroke();

    // Title
    ctx.fillStyle = getCSS('--ink');
    ctx.font = '12px "Fraunces", serif';
    ctx.fillText('Project Schedule — NDX', pad.left, 18);

    // Draw bars
    phases.forEach(function (phase, i) {
      var y = pad.top + i * (barH + 4);
      var start = cpmData.starts[phase.id] || 0;
      var finish = cpmData.finishes[phase.id] || 0;
      var bx = pad.left + start * scaleX;
      var bw = Math.max(2, (finish - start) * scaleX);

      // Label
      ctx.fillStyle = getCSS('--ink');
      ctx.font = '11px "Newsreader", serif';
      ctx.fillText(phase.name, 4, y + barH - 5);

      // Background bar
      var isOnCP = cpmData.criticalPath.indexOf(phase.id) >= 0;
      ctx.fillStyle = isOnCP ? getCSS('--red') + '33' : getCSS('--blue') + '33';
      ctx.fillRect(bx, y, bw, barH);

      // Progress fill
      var pct = ACE.percentComplete(phase.id) / 100;
      ctx.fillStyle = isOnCP ? getCSS('--red') : getCSS('--blue');
      ctx.fillRect(bx, y, bw * pct, barH);

      // Border
      ctx.strokeStyle = isOnCP ? getCSS('--red') : getCSS('--blue');
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, y, bw, barH);
    });
  }

  // ── Constraints Tab ─────────────────────────────────────────

  /** Render the constraint list with filters */
  function renderConstraints(el) {
    var types = {};
    ACE.all().forEach(function (a) { types[a.type] = true; });

    var html = '<div class="filter-bar">' +
      '<input id="filter-search" type="text" placeholder="Search atoms..." value="' + escHtml(filterText) + '" class="filter-input" />' +
      '<select id="filter-type" class="filter-select"><option value="">All Types</option>';
    Object.keys(types).sort().forEach(function (t) {
      html += '<option value="' + t + '"' + (filterType === t ? ' selected' : '') + '>' + t + '</option>';
    });
    html += '</select></div>';

    var filter = {};
    if (filterType) filter.type = filterType;
    if (filterText) filter.search = filterText;
    var atoms = ACE.query(filter);

    html += '<div class="atom-list">';
    atoms.forEach(function (a) {
      var status = a._complete ? 'done' : 'open';
      html += '<div class="atom-row" data-atom="' + a.id + '">' +
        '<span class="atom-status atom-' + status + '">[' + (a._complete ? 'x' : ' ') + ']</span>' +
        '<span class="atom-id">' + a.id + '</span>' +
        '<span class="atom-name">' + escHtml(a.name) + '</span>' +
        '<span class="atom-type">' + a.type + '</span>' +
        a.tags.slice(0, 3).map(function (t) { return '<span class="atom-tag">' + escHtml(t) + '</span>'; }).join('') +
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  // ── WBS Tab ─────────────────────────────────────────────────

  /** Render the WBS tree view */
  function renderWBS(el) {
    var root = ACE.get('NDX');
    if (!root) { el.innerHTML = '<div class="wbs-empty">No project loaded.</div>'; return; }

    var html = '<div class="wbs-tree">';
    html += renderTreeNode('NDX', 0);
    html += '</div>';
    el.innerHTML = html;
  }

  /** Recursively render a tree node */
  function renderTreeNode(id, depth) {
    var a = ACE.get(id);
    if (!a) return '';
    var indent = depth * 20;
    var pct = ACE.percentComplete(id);
    var hasChildren = a.contains.length > 0;
    var icon = hasChildren ? '[-]' : ' * ';
    var html = '<div class="tree-node" data-atom="' + id + '" style="padding-left:' + indent + 'px">' +
      '<span class="tree-icon">' + icon + '</span>' +
      '<span class="tree-id">' + id + '</span>' +
      '<span class="tree-name">' + escHtml(a.name) + '</span>' +
      '<span class="tree-pct">' + pct + '%</span>' +
    '</div>';
    a.contains.forEach(function (cid) {
      html += renderTreeNode(cid, depth + 1);
    });
    return html;
  }

  // ── Risks Tab ───────────────────────────────────────────────

  /** Render risks list and MC histogram */
  function renderRisks(el) {
    var risks = ACE.query({ type: 'risk' });

    var html = '<div class="risk-header">Risk Register</div>';
    html += '<div class="risk-list">';
    risks.forEach(function (r) {
      var prob = parseFloat(r.tags.find(function (t) { return t.startsWith('p:'); })?.replace('p:', '') || '0');
      var impact = parseFloat(r.tags.find(function (t) { return t.startsWith('impact:'); })?.replace('impact:', '') || '0');
      var score = (prob * impact).toFixed(1);
      var severity = score >= 2.0 ? 'risk-high' : score >= 1.0 ? 'risk-med' : 'risk-low';
      html += '<div class="risk-row ' + severity + '" data-atom="' + r.id + '">' +
        '<span class="risk-id">' + r.id + '</span>' +
        '<span class="risk-name">' + escHtml(r.name) + '</span>' +
        '<span class="risk-prob">P=' + (prob * 100).toFixed(0) + '%</span>' +
        '<span class="risk-impact">I=' + impact + 'mo</span>' +
        '<span class="risk-score">Score=' + score + '</span>' +
      '</div>';
    });
    html += '</div>';

    html += '<div class="mc-section">' +
      '<div class="mc-header">Monte Carlo Distribution (n=1000)</div>' +
      '<canvas id="mc-canvas" class="mc-canvas"></canvas>' +
      '<div class="mc-stats">';
    if (cachedMC) {
      html += '<span>P10: ' + cachedMC.p10.finish.toFixed(1) + 'mo</span>' +
        '<span>P50: ' + cachedMC.p50.finish.toFixed(1) + 'mo</span>' +
        '<span>P80: ' + cachedMC.p80.finish.toFixed(1) + 'mo</span>' +
        '<span>P90: ' + cachedMC.p90.finish.toFixed(1) + 'mo</span>';
    }
    html += '</div></div>';

    el.innerHTML = html;
    requestAnimationFrame(function () { drawMCHistogram(); });
  }

  /** Draw Monte Carlo histogram */
  function drawMCHistogram() {
    var canvas = document.getElementById('mc-canvas');
    if (!canvas || !cachedMC) return;
    var container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 200;

    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    var pad = { top: 10, right: 20, bottom: 30, left: 50 };
    var results = cachedMC.results;

    ctx.fillStyle = getCSS('--paper');
    ctx.fillRect(0, 0, W, H);

    // Bin the results
    var minFinish = results[0].finish;
    var maxFinish = results[results.length - 1].finish;
    var range = maxFinish - minFinish || 1;
    var numBins = Math.min(40, Math.ceil(range));
    var binWidth = range / numBins;
    var bins = new Array(numBins).fill(0);

    results.forEach(function (r) {
      var bin = Math.min(numBins - 1, Math.floor((r.finish - minFinish) / binWidth));
      bins[bin]++;
    });

    var maxBin = Math.max.apply(null, bins);
    var barW = (W - pad.left - pad.right) / numBins;
    var scaleY = (H - pad.top - pad.bottom) / maxBin;

    // Draw bars
    bins.forEach(function (count, i) {
      var x = pad.left + i * barW;
      var bh = count * scaleY;
      var y = H - pad.bottom - bh;
      var monthVal = minFinish + (i + 0.5) * binWidth;

      ctx.fillStyle = monthVal <= ACE_Data.PLANT.baselineMonths ? getCSS('--blue') : getCSS('--red');
      ctx.fillRect(x, y, barW - 1, bh);
    });

    // Baseline line
    var blX = pad.left + ((ACE_Data.PLANT.baselineMonths - minFinish) / range) * (W - pad.left - pad.right);
    ctx.strokeStyle = getCSS('--oxide');
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(blX, pad.top);
    ctx.lineTo(blX, H - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = getCSS('--ink');
    ctx.font = '10px "IBM Plex Mono", monospace';
    for (var i = 0; i <= 4; i++) {
      var mv = minFinish + (range * i / 4);
      var lx = pad.left + (i / 4) * (W - pad.left - pad.right);
      ctx.fillText(mv.toFixed(0) + 'mo', lx, H - pad.bottom + 15);
    }

    ctx.fillText('Baseline', blX - 25, pad.top + 12);
  }

  // ── Ask ACE Tab (Terminal) ──────────────────────────────────

  /** Render the Ask ACE nerd terminal */
  function renderAskACE(el) {
    var html = '<div class="terminal" id="terminal">';
    terminalHistory.forEach(function (line) {
      var cls = line.type === 'input' ? 'term-input' : line.type === 'error' ? 'term-error' : 'term-output';
      html += '<div class="' + cls + '">' + escHtml(line.text) + '</div>';
    });
    html += '</div>';
    html += '<div class="term-prompt">' +
      '<span class="term-caret">C:\\NDX&gt;</span>' +
      '<input id="term-input" type="text" class="term-field" autocomplete="off" spellcheck="false" />' +
    '</div>';
    el.innerHTML = html;

    var input = document.getElementById('term-input');
    if (input) input.focus();

    var terminal = document.getElementById('terminal');
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }

  /** Process a terminal command */
  function execCommand(cmd) {
    terminalHistory.push({ type: 'input', text: 'C:\\NDX> ' + cmd });
    var parts = cmd.trim().split(/\s+/);
    var verb = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ');

    switch (verb) {
      case 'help':
        terminalHistory.push({ type: 'system', text: 'Commands: query <filter> | atom <id> | risks | mc [n] | forecast | status | clear | help' });
        terminalHistory.push({ type: 'system', text: 'query type:phase        — list atoms by type' });
        terminalHistory.push({ type: 'system', text: 'query tag:critical-path — list atoms by tag' });
        terminalHistory.push({ type: 'system', text: 'atom MS-COD             — show atom detail' });
        terminalHistory.push({ type: 'system', text: 'risks                   — risk register summary' });
        terminalHistory.push({ type: 'system', text: 'mc 5000                 — run Monte Carlo (n iterations)' });
        terminalHistory.push({ type: 'system', text: 'forecast                — schedule forecast' });
        terminalHistory.push({ type: 'system', text: 'status                  — project summary' });
        break;

      case 'status':
        var s = ACE.summary();
        terminalHistory.push({ type: 'system', text: 'Atoms: ' + s.atoms + '  Complete: ' + s.complete + '  Progress: ' + s.percent + '%  Workable: ' + s.workable });
        var types = Object.keys(s.types).map(function (t) { return t + ':' + s.types[t]; }).join(', ');
        terminalHistory.push({ type: 'system', text: 'Types: ' + types });
        break;

      case 'query':
        var filter = {};
        if (arg.startsWith('type:')) filter.type = arg.replace('type:', '');
        else if (arg.startsWith('tag:')) filter.tag = arg.replace('tag:', '');
        else if (arg) filter.search = arg;
        var results = ACE.query(filter);
        terminalHistory.push({ type: 'system', text: results.length + ' atoms found:' });
        results.slice(0, 20).forEach(function (a) {
          terminalHistory.push({ type: 'system', text: '  ' + a.id + '  ' + a.name + '  [' + (a._complete ? 'DONE' : 'OPEN') + ']' });
        });
        if (results.length > 20) terminalHistory.push({ type: 'system', text: '  ... and ' + (results.length - 20) + ' more' });
        break;

      case 'atom':
        var a = ACE.get(arg);
        if (!a) { terminalHistory.push({ type: 'error', text: 'Unknown atom: ' + arg }); break; }
        terminalHistory.push({ type: 'system', text: 'ID:       ' + a.id });
        terminalHistory.push({ type: 'system', text: 'Name:     ' + a.name });
        terminalHistory.push({ type: 'system', text: 'Type:     ' + a.type });
        terminalHistory.push({ type: 'system', text: 'Kind:     ' + a.kind });
        terminalHistory.push({ type: 'system', text: 'Tags:     ' + (a.tags.join(', ') || 'none') });
        terminalHistory.push({ type: 'system', text: 'Requires: ' + (a.requires.join(', ') || 'none') });
        terminalHistory.push({ type: 'system', text: 'Contains: ' + (a.contains.join(', ') || 'none') });
        terminalHistory.push({ type: 'system', text: 'Parent:   ' + (a._parent || 'none') });
        terminalHistory.push({ type: 'system', text: 'Complete: ' + (a._complete ? 'YES' : 'NO') });
        terminalHistory.push({ type: 'system', text: 'Progress: ' + ACE.percentComplete(a.id) + '%' });
        break;

      case 'risks':
        var riskAtoms = ACE.query({ type: 'risk' });
        terminalHistory.push({ type: 'system', text: riskAtoms.length + ' risks:' });
        riskAtoms.forEach(function (r) {
          var prob = r.tags.find(function (t) { return t.startsWith('p:'); })?.replace('p:', '') || '?';
          var impact = r.tags.find(function (t) { return t.startsWith('impact:'); })?.replace('impact:', '') || '?';
          terminalHistory.push({ type: 'system', text: '  ' + r.id + '  P=' + prob + ' I=' + impact + 'mo  ' + r.name });
        });
        break;

      case 'mc':
        var n = parseInt(arg) || 1000;
        terminalHistory.push({ type: 'system', text: 'Running Monte Carlo with ' + n + ' iterations...' });
        cachedMC = ACE_Schedule.monteCarlo(n);
        terminalHistory.push({ type: 'system', text: 'P10=' + cachedMC.p10.finish.toFixed(1) + 'mo  P50=' + cachedMC.p50.finish.toFixed(1) + 'mo  P80=' + cachedMC.p80.finish.toFixed(1) + 'mo  P90=' + cachedMC.p90.finish.toFixed(1) + 'mo' });
        break;

      case 'forecast':
        var cpmResult = ACE_Schedule.cpm();
        var es = ACE_Schedule.earnedSchedule(simMonth);
        terminalHistory.push({ type: 'system', text: 'CPM Project Finish: ' + cpmResult.projectFinish.toFixed(1) + ' months' });
        terminalHistory.push({ type: 'system', text: 'Critical Path: ' + cpmResult.criticalPath.join(' -> ') });
        terminalHistory.push({ type: 'system', text: 'Earned Schedule: ' + es.es.toFixed(1) + 'mo  SPI(t): ' + es.spi_t.toFixed(2) });
        if (cachedMC) {
          terminalHistory.push({ type: 'system', text: 'MC P50: ' + cachedMC.p50.finish.toFixed(1) + 'mo  P80: ' + cachedMC.p80.finish.toFixed(1) + 'mo' });
        }
        break;

      case 'clear':
        terminalHistory = [];
        break;

      default:
        terminalHistory.push({ type: 'error', text: 'Unknown command: ' + verb + '. Type "help" for commands.' });
    }

    render();
  }

  /** Tab autocomplete for terminal */
  function tabComplete(partial) {
    var commands = ['query', 'atom', 'risks', 'mc', 'forecast', 'status', 'help', 'clear'];
    var parts = partial.split(/\s+/);

    if (parts.length <= 1) {
      var matches = commands.filter(function (c) { return c.startsWith(parts[0].toLowerCase()); });
      return matches.length === 1 ? matches[0] + ' ' : partial;
    }

    // Autocomplete atom IDs
    if (parts[0] === 'atom' && parts.length === 2) {
      var atomIds = ACE.all().map(function (a) { return a.id; });
      var matches2 = atomIds.filter(function (id) { return id.toLowerCase().startsWith(parts[1].toLowerCase()); });
      if (matches2.length === 1) return parts[0] + ' ' + matches2[0];
    }

    return partial;
  }

  // ── Atom Overlay ────────────────────────────────────────────

  /** Render the atom detail overlay card */
  function renderOverlay() {
    var a = ACE.get(overlayAtomId);
    if (!a) { closeOverlay(); return; }

    var existing = document.getElementById('overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'overlay';

    var ancestors = ACE.ancestors(a.id);
    var breadcrumb = ancestors.map(function (aid) {
      return '<span class="crumb" data-atom="' + aid + '">' + aid + '</span>';
    }).join(' / ');
    if (breadcrumb) breadcrumb += ' / ';

    var html = '<div class="card">';
    html += '<div class="card-header">' +
      '<span class="card-breadcrumb">' + breadcrumb + '<strong>' + a.id + '</strong></span>' +
      '<button class="card-close" id="btn-close-overlay">[X]</button>' +
    '</div>';

    html += '<h2 class="card-title">' + escHtml(a.name) + '</h2>';

    html += '<div class="card-fields">' +
      '<div class="card-field"><span class="field-lbl">Type</span><span class="field-val">' + a.type + '</span></div>' +
      '<div class="card-field"><span class="field-lbl">Kind</span><span class="field-val">' + a.kind + '</span></div>' +
      '<div class="card-field"><span class="field-lbl">Status</span><span class="field-val ' + (a._complete ? 'val-done' : 'val-open') + '">' + (a._complete ? 'Complete' : 'Open') + '</span></div>' +
      '<div class="card-field"><span class="field-lbl">Progress</span><span class="field-val">' + ACE.percentComplete(a.id) + '%</span></div>' +
    '</div>';

    // Tags as pills
    if (a.tags.length) {
      html += '<div class="card-tags">';
      a.tags.forEach(function (t) { html += '<span class="pill">' + escHtml(t) + '</span>'; });
      html += '</div>';
    }

    // Requires
    if (a.requires.length) {
      html += '<div class="card-section"><span class="section-lbl">Requires</span>';
      a.requires.forEach(function (rid) {
        var r = ACE.get(rid);
        html += '<span class="card-link" data-atom="' + rid + '">' + rid + (r ? ' - ' + escHtml(r.name) : '') + '</span>';
      });
      html += '</div>';
    }

    // Contains
    if (a.contains.length) {
      html += '<div class="card-section"><span class="section-lbl">Contains</span>';
      a.contains.forEach(function (cid) {
        var c = ACE.get(cid);
        html += '<span class="card-link" data-atom="' + cid + '">' + cid + (c ? ' - ' + escHtml(c.name) : '') + '</span>';
      });
      html += '</div>';
    }

    // Evidence / Narrative
    if (a._evidence) {
      html += '<div class="card-section"><span class="section-lbl">Evidence</span><div class="card-evidence">' + escHtml(a._evidence) + '</div></div>';
    }
    if (a._narrative) {
      html += '<div class="card-section"><span class="section-lbl">Narrative</span><div class="card-narrative">' + escHtml(a._narrative) + '</div></div>';
    }

    // Toolbar
    html += '<div class="card-toolbar">';
    html += '<button id="btn-source" class="btn-card">[Source]</button>';
    html += '<button id="btn-edit" class="btn-card">[Edit]</button>';
    html += '</div>';

    // Source view (toggleable)
    if (overlayShowSource) {
      var json = JSON.stringify(ACE.exportJSON().find(function (x) { return x.id === a.id; }), null, 2);
      html += '<pre class="card-source">' + escHtml(json) + '</pre>';
    }

    // Edit mode (toggleable)
    if (overlayEditMode) {
      var json2 = JSON.stringify(ACE.exportJSON().find(function (x) { return x.id === a.id; }), null, 2);
      html += '<div class="card-edit">' +
        '<textarea id="edit-json" class="edit-textarea">' + escHtml(json2) + '</textarea>' +
        '<button id="btn-apply" class="btn-card btn-apply">[Apply]</button>' +
      '</div>';
    }

    html += '</div>';
    overlay.innerHTML = html;

    // Click outside card to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });

    document.body.appendChild(overlay);
  }

  /** Close the overlay */
  function closeOverlay() {
    overlayAtomId = null;
    overlayEditMode = false;
    overlayShowSource = false;
    var el = document.getElementById('overlay');
    if (el) el.remove();
  }

  /** Open overlay for a given atom */
  function openOverlay(id) {
    overlayAtomId = id;
    overlayEditMode = false;
    overlayShowSource = false;
    renderOverlay();
  }

  // ── Simulation ──────────────────────────────────────────────

  /** Advance the simulation by one month */
  function simTick() {
    if (simMonth >= ACE_Data.PLANT.baselineMonths) {
      simPause();
      return;
    }
    simMonth++;

    // Auto-complete workable atoms probabilistically
    var w = ACE.workable();
    w.forEach(function (a) {
      var dur = ACE_Schedule.getDuration(a.id);
      if (dur <= 0) dur = 1;
      var chance = 1 / dur;
      if (Math.random() < chance) {
        ACE.complete(a.id, 'Simulation auto-complete at month ' + simMonth);
      }
    });

    // Complete milestones whose requirements are met
    ACE.query({ type: 'milestone', complete: false }).forEach(function (ms) {
      var allReqsDone = ms.requires.every(function (rid) { return ACE.isComplete(rid); });
      if (allReqsDone && ms.kind === 'manual') {
        ACE.complete(ms.id, 'Milestone achieved at month ' + simMonth);
      }
    });

    ACE.settle();
    render();
  }

  /** Start simulation playback */
  function simPlay() {
    if (simPlaying) return;
    simPlaying = true;
    simInterval = setInterval(simTick, 1000 / simSpeed);
    render();
  }

  /** Pause simulation */
  function simPause() {
    simPlaying = false;
    if (simInterval) clearInterval(simInterval);
    simInterval = null;
    render();
  }

  // ── Event Binding ───────────────────────────────────────────

  /** Bind all UI events via delegation */
  function bindEvents() {
    // Tab clicks
    document.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        activeTab = tab.dataset.tab;
        render();
        return;
      }

      // Atom clicks (anywhere)
      var atomEl = e.target.closest('[data-atom]');
      if (atomEl && !e.target.closest('.card-link') && !e.target.closest('.crumb') && !e.target.closest('.feed-name')) {
        openOverlay(atomEl.dataset.atom);
        return;
      }

      // Card links and crumbs
      if (e.target.closest('.card-link') || e.target.closest('.crumb') || e.target.closest('.feed-name')) {
        var id = e.target.dataset.atom || e.target.closest('[data-atom]')?.dataset.atom;
        if (id) openOverlay(id);
        return;
      }

      // Play/Pause
      if (e.target.id === 'btn-play') {
        simPlaying ? simPause() : simPlay();
        return;
      }

      // Close overlay
      if (e.target.id === 'btn-close-overlay') { closeOverlay(); return; }

      // Source toggle
      if (e.target.id === 'btn-source') {
        overlayShowSource = !overlayShowSource;
        overlayEditMode = false;
        renderOverlay();
        return;
      }

      // Edit toggle
      if (e.target.id === 'btn-edit') {
        overlayEditMode = !overlayEditMode;
        overlayShowSource = false;
        renderOverlay();
        return;
      }

      // Apply edit
      if (e.target.id === 'btn-apply') {
        var textarea = document.getElementById('edit-json');
        if (textarea) {
          try {
            var edited = JSON.parse(textarea.value);
            var existing = ACE.get(edited.id);
            if (existing) {
              existing.name = edited.name || existing.name;
              existing.tags = edited.tags || existing.tags;
              ACE.settle();
              overlayEditMode = false;
              render();
              renderOverlay();
            }
          } catch (err) {
            alert('Invalid JSON: ' + err.message);
          }
        }
        return;
      }

      // Export JSON
      if (e.target.id === 'btn-export-json') {
        downloadFile('ace-ndx.json', JSON.stringify(ACE.exportJSON(), null, 2), 'application/json');
        return;
      }

      // Export CSV
      if (e.target.id === 'btn-export-csv') {
        exportCSV();
        return;
      }
    });

    // Speed selector
    document.addEventListener('change', function (e) {
      if (e.target.id === 'sel-speed') {
        simSpeed = parseFloat(e.target.value);
        if (simPlaying) {
          clearInterval(simInterval);
          simInterval = setInterval(simTick, 1000 / simSpeed);
        }
      }

      // Scrubber
      if (e.target.id === 'scrubber') {
        simMonth = parseInt(e.target.value);
        render();
      }

      // Filters
      if (e.target.id === 'filter-type') {
        filterType = e.target.value;
        renderContent();
      }
    });

    // Input events for scrubber (live update while dragging)
    document.addEventListener('input', function (e) {
      if (e.target.id === 'scrubber') {
        simMonth = parseInt(e.target.value);
        render();
      }
      if (e.target.id === 'filter-search') {
        filterText = e.target.value;
        renderContent();
      }
    });

    // Terminal input
    document.addEventListener('keydown', function (e) {
      if (e.target.id === 'term-input') {
        if (e.key === 'Enter') {
          var val = e.target.value.trim();
          if (val) execCommand(val);
          e.target.value = '';
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          e.target.value = tabComplete(e.target.value);
        }
      }
    });

    // Window resize
    window.addEventListener('resize', function () {
      if (activeTab === 'dashboard') {
        requestAnimationFrame(drawGantt);
      }
    });

    // Responsive sidebar toggle
    document.addEventListener('click', function (e) {
      if (e.target.id === 'btn-menu') {
        document.getElementById('sidebar').classList.toggle('sidebar-open');
      }
    });
  }

  // ── Export Helpers ──────────────────────────────────────────

  /** Export atoms as CSV and trigger download */
  function exportCSV() {
    var atoms = ACE.all();
    var csv = 'id,name,type,kind,complete,tags,requires,contains\n';
    atoms.forEach(function (a) {
      csv += '"' + a.id + '","' + a.name.replace(/"/g, '""') + '","' + a.type + '","' + a.kind + '",' +
        a._complete + ',"' + a.tags.join(';') + '","' + a.requires.join(';') + '","' + a.contains.join(';') + '"\n';
    });
    downloadFile('ace-ndx.csv', csv, 'text/csv');
  }

  /** Trigger a file download */
  function downloadFile(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Utility ────────────────────────────────────────────────

  /** Get a CSS custom property value */
  function getCSS(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  /** HTML-escape a string */
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init: init, render: render, openOverlay: openOverlay, closeOverlay: closeOverlay };
})();
