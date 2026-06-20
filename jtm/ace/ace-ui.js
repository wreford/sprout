/**
 * ACE UI 3.0 -- Estimating & Planning Interface
 *
 * Four views: PLAN (Gantt + atom management), FORECAST (Monte Carlo),
 * CONSTRAINTS (AWP/IWP readiness), EXPLORE (search + terminal).
 *
 * All state lives in ACE core. UI is a pure render layer.
 * settle() and MC auto-run after every mutation.
 *
 * Depends on ACE (ace-core.js), ACE_Schedule (ace-schedule.js), ACE_Data (ace-data.js).
 */

const ACE_UI = (function () {
  'use strict';

  // -- State --
  var view = 'plan';
  var selectedAtom = null;
  var editingAtom = false;
  var creatingAtom = false;
  var wbsCollapsed = {};
  var wbsFilter = '';
  var mcResults = null;
  var mcPrev = null;
  var mcIterations = 1000;
  var constraintFilter = 'all';
  var exploreSearch = '';
  var exploreType = '';
  var termLines = ['ACE 3.0 -- Atomic Constraint Engine', 'Type "help" for commands.', ''];
  var termHistory = [];
  var termHistIdx = -1;
  var ganttScrollX = 0;
  var searchOpen = false;
  var searchQuery = '';

  // -- Init --

  function init() {
    ACE_Data.load();
    runMC(mcIterations);
    render();
    document.addEventListener('keydown', onGlobalKey);
    window.addEventListener('resize', function () { renderContent(); });
  }

  // -- Mutation helper: settle + MC after changes --

  function afterMutation() {
    ACE.settle();
    runMC(mcIterations);
    renderContent();
    renderSidebar();
  }

  // -- Monte Carlo --

  function runMC(n) {
    if (ACE.all().length === 0) return;
    mcPrev = mcResults;
    mcResults = ACE_Schedule.monteCarlo(n || 1000);
  }

  // -- Full render --

  function render() {
    renderTopbar();
    renderSidebar();
    renderContent();
  }

  // -- Topbar --

  function renderTopbar() {
    var el = document.getElementById('topbar');
    var s = ACE.summary();
    el.innerHTML =
      '<button id="btn-menu">[=]</button>' +
      '<div class="topbar-left">' +
        '<span class="topbar-title">ACE</span>' +
        '<span class="topbar-subtitle">' + ACE_Data.PLANT.name + '</span>' +
      '</div>' +
      '<div class="topbar-controls">' +
        '<button class="btn-ctrl" id="btn-new-atom">[+ Atom]</button>' +
        '<button class="btn-ctrl" id="btn-save">[Save]</button>' +
        '<button class="btn-ctrl" id="btn-load">[Load]</button>' +
        '<button class="btn-ctrl" id="btn-clear-data">[Clear]</button>' +
        '<button class="btn-ctrl" id="btn-export-json">[JSON]</button>' +
        '<button class="btn-ctrl" id="btn-export-csv">[CSV]</button>' +
        '<span class="topbar-pct">' + s.percent + '%</span>' +
      '</div>';

    document.getElementById('btn-menu').addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('sidebar-open');
    });
    document.getElementById('btn-new-atom').addEventListener('click', function () {
      creatingAtom = true;
      editingAtom = false;
      selectedAtom = null;
      renderContent();
    });
    document.getElementById('btn-save').addEventListener('click', doSave);
    document.getElementById('btn-load').addEventListener('click', doLoad);
    document.getElementById('btn-clear-data').addEventListener('click', function () {
      if (confirm('Clear all saved data from localStorage?')) {
        localStorage.removeItem('ace-atoms');
        localStorage.removeItem('ace-durations');
      }
    });
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  }

  // -- Save / Load --

  function doSave() {
    var data = {
      atoms: ACE.exportJSON(),
      durations: {}
    };
    ACE.all().forEach(function (a) {
      var d = ACE_Schedule.durations[a.id];
      if (d) data.durations[a.id] = d;
    });
    localStorage.setItem('ace-save', JSON.stringify(data));
  }

  function doLoad() {
    var raw = localStorage.getItem('ace-save');
    if (!raw) { alert('No saved data found.'); return; }
    try {
      var data = JSON.parse(raw);
      ACE.importJSON(data.atoms || []);
      if (data.durations) {
        for (var id in data.durations) {
          var d = data.durations[id];
          ACE_Schedule.setDuration(id, d.min, d.likely, d.max);
        }
      }
      afterMutation();
      render();
    } catch (e) {
      alert('Load failed: ' + e.message);
    }
  }

  // -- Export --

  function exportJSON() {
    var blob = new Blob([JSON.stringify(ACE.exportJSON(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ace-atoms.json';
    a.click();
  }

  function exportCSV() {
    var csv = 'id,name,type,kind,complete,requires,contains\n';
    ACE.all().forEach(function (a) {
      csv += a.id + ',"' + a.name.replace(/"/g, '""') + '",' + a.type + ',' + a.kind + ',' +
        (a._complete ? 'Y' : 'N') + ',"' + a.requires.join(';') + '","' + a.contains.join(';') + '"\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ace-atoms.csv';
    a.click();
  }

  // -- Sidebar --

  function renderSidebar() {
    var el = document.getElementById('sidebar');
    var s = ACE.summary();
    var tabs = [
      { id: 'plan', label: 'Plan' },
      { id: 'forecast', label: 'Forecast' },
      { id: 'constraints', label: 'Constraints' },
      { id: 'explore', label: 'Explore' }
    ];

    var html = '<div class="sidebar-tabs">';
    tabs.forEach(function (t) {
      html += '<button class="sidebar-tab' + (view === t.id ? ' active' : '') + '" data-view="' + t.id + '">' + t.label + '</button>';
    });
    html += '</div>';

    html += '<div class="sidebar-summary">';
    html += sidebarStat(s.atoms, 'atoms');
    html += sidebarStat(s.complete, 'done');
    html += sidebarStat(s.workable, 'workable');
    html += sidebarStat(s.percent + '%', 'progress');
    html += sidebarStat(ACE.query({ type: 'risk' }).length, 'risks');
    var cpmData = ACE_Schedule.cpm();
    html += sidebarStat(cpmData.criticalPath.length, 'critical');
    html += '</div>';

    html += '<div class="sidebar-export">';
    if (mcResults) {
      html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:4px">P50: M' +
        Math.round(mcResults.p50.finish) + ' / P80: M' + Math.round(mcResults.p80.finish) + '</div>';
    }
    html += '</div>';

    el.innerHTML = html;

    el.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        view = btn.dataset.view;
        selectedAtom = null;
        creatingAtom = false;
        editingAtom = false;
        render();
      });
    });
  }

  function sidebarStat(val, label) {
    return '<div class="sidebar-stat"><span class="stat-val">' + val + '</span><span class="stat-lbl">' + label + '</span></div>';
  }

  // -- Content routing --

  function renderContent() {
    var el = document.getElementById('content');
    if (!el) return;
    switch (view) {
      case 'plan': renderPlan(el); break;
      case 'forecast': renderForecast(el); break;
      case 'constraints': renderConstraints(el); break;
      case 'explore': renderExplore(el); break;
    }
    if (searchOpen) renderSearchOverlay();
  }

  // ================================================================
  // VIEW 1: PLAN -- Gantt + atom management
  // ================================================================

  function renderPlan(el) {
    var html = '';

    // Top half: Gantt canvas
    html += '<div class="dash-gantt" id="gantt-wrap"><canvas id="gantt-cv"></canvas></div>';

    // Bottom half: selected atom detail or creation form or summary
    html += '<div id="plan-detail">';
    if (creatingAtom) {
      html += renderCreateForm();
    } else if (selectedAtom) {
      html += renderAtomCard(selectedAtom);
    } else {
      html += renderProjectSummary();
    }
    html += '</div>';

    // Right side: WBS tree (rendered as inline panel on wide screens)
    html += '<div id="wbs-panel" style="margin-top:16px">';
    html += '<div style="font-family:Fraunces,serif;font-size:14px;font-weight:600;margin-bottom:8px">Work Breakdown</div>';
    html += '<input type="text" id="wbs-search" class="filter-input" placeholder="Filter WBS..." value="' + escAttr(wbsFilter) + '" style="margin-bottom:8px">';
    html += '<div class="wbs-tree" id="wbs-tree">' + renderWBSTree('NDX', 0) + '</div>';
    html += '</div>';

    el.innerHTML = html;

    // Draw Gantt
    setTimeout(function () { drawPlanGantt(); }, 20);

    // Wire WBS filter
    var wbsSearch = document.getElementById('wbs-search');
    if (wbsSearch) {
      wbsSearch.addEventListener('input', function () {
        wbsFilter = this.value;
        var tree = document.getElementById('wbs-tree');
        if (tree) tree.innerHTML = renderWBSTree('NDX', 0);
        wireWBSClicks();
      });
    }

    wireWBSClicks();
    wirePlanDetail();
  }

  function renderWBSTree(id, depth) {
    var a = ACE.get(id);
    if (!a) return '';
    var pct = ACE.percentComplete(id);
    var hasChildren = a.contains.length > 0;
    var collapsed = wbsCollapsed[id];
    var matchesFilter = !wbsFilter || a.id.toLowerCase().indexOf(wbsFilter.toLowerCase()) >= 0 ||
      a.name.toLowerCase().indexOf(wbsFilter.toLowerCase()) >= 0;

    // If filtering, check descendants too
    if (wbsFilter && !matchesFilter) {
      var childrenMatch = a.contains.some(function (cid) { return wbsSubtreeMatches(cid, wbsFilter); });
      if (!childrenMatch) return '';
    }

    var indent = depth * 16;
    var icon = hasChildren ? (collapsed ? '[+]' : '[-]') : ' . ';
    var html = '<div class="tree-node" data-wbs="' + id + '" style="padding-left:' + indent + 'px">' +
      '<span class="tree-icon" data-wbs-toggle="' + id + '">' + icon + '</span>' +
      '<span class="tree-id">' + id + '</span>' +
      '<span class="tree-name">' + a.name + '</span>' +
      '<span class="tree-pct">' + pct + '%</span>' +
      '</div>';

    if (hasChildren && !collapsed) {
      a.contains.forEach(function (cid) {
        html += renderWBSTree(cid, depth + 1);
      });
    }
    return html;
  }

  function wbsSubtreeMatches(id, filter) {
    var a = ACE.get(id);
    if (!a) return false;
    var f = filter.toLowerCase();
    if (a.id.toLowerCase().indexOf(f) >= 0 || a.name.toLowerCase().indexOf(f) >= 0) return true;
    return a.contains.some(function (cid) { return wbsSubtreeMatches(cid, f); });
  }

  function wireWBSClicks() {
    document.querySelectorAll('[data-wbs-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = el.dataset.wbsToggle;
        wbsCollapsed[id] = !wbsCollapsed[id];
        var tree = document.getElementById('wbs-tree');
        if (tree) tree.innerHTML = renderWBSTree('NDX', 0);
        wireWBSClicks();
      });
    });
    document.querySelectorAll('[data-wbs]').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedAtom = el.dataset.wbs;
        creatingAtom = false;
        editingAtom = false;
        renderContent();
      });
    });
  }

  // -- Plan Gantt (Canvas 2D) --

  function drawPlanGantt() {
    var cv = document.getElementById('gantt-cv');
    if (!cv) return;
    var cpm = ACE_Schedule.cpm();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var wrap = document.getElementById('gantt-wrap');
    var cw = wrap ? wrap.clientWidth : cv.clientWidth;
    var ch = wrap ? wrap.clientHeight : cv.clientHeight;
    if (cw < 10 || ch < 10) return;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    cv.style.width = cw + 'px';
    cv.style.height = ch + 'px';
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    c.fillStyle = '#faf7ee';
    c.fillRect(0, 0, cw, ch);

    var phases = ACE.query({ type: 'phase' });
    var milestones = ACE.query({ type: 'milestone' });
    if (!phases.length) {
      c.fillStyle = '#9a9077';
      c.font = '12px IBM Plex Mono, monospace';
      c.fillText('No phase atoms. Create some to see the schedule.', 20, 30);
      return;
    }

    var maxFinish = Math.max(cpm.projectFinish, ACE_Data.PLANT.baselineMonths) || 120;
    var labelW = 140, padR = 16, padT = 24, padB = 24;
    var chartW = cw - labelW - padR;
    var rowH = Math.min(26, (ch - padT - padB) / phases.length);

    // Month grid
    c.strokeStyle = '#ede7d6';
    c.lineWidth = 0.5;
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'center';
    c.fillStyle = '#9a9077';
    for (var m = 0; m <= maxFinish; m += 12) {
      var gx = labelW + (m / maxFinish) * chartW;
      c.beginPath();
      c.moveTo(gx, padT);
      c.lineTo(gx, padT + phases.length * rowH);
      c.stroke();
      c.fillText('M' + m, gx, padT + phases.length * rowH + 14);
    }

    // Phase bars
    phases.forEach(function (p, i) {
      var dur = ACE_Schedule.durations[p.id];
      var start = cpm.starts[p.id] || 0;
      var finish = cpm.finishes[p.id] || 0;
      var y = padT + i * rowH;
      var x0 = labelW + (start / maxFinish) * chartW;
      var x1 = labelW + (finish / maxFinish) * chartW;
      var bh = rowH * 0.6;
      var by = y + (rowH - bh) / 2;

      // Label
      c.fillStyle = (selectedAtom === p.id) ? '#a8401f' : '#544c3a';
      c.font = '11px IBM Plex Mono, monospace';
      c.textAlign = 'right';
      var label = p.name.length > 18 ? p.name.slice(0, 17) + '.' : p.name;
      c.fillText(label, labelW - 8, by + bh * 0.75);

      // Bar background
      var onCrit = cpm.criticalPath.indexOf(p.id) >= 0;
      c.fillStyle = onCrit ? 'rgba(168,64,31,0.2)' : 'rgba(44,93,120,0.15)';
      c.fillRect(x0, by, Math.max(x1 - x0, 2), bh);

      // Progress fill
      var pct = ACE.percentComplete(p.id) / 100;
      c.fillStyle = onCrit ? '#a8401f' : '#2c5d78';
      c.fillRect(x0, by, (x1 - x0) * pct, bh);

      // Critical border
      if (onCrit) {
        c.strokeStyle = '#a8401f';
        c.lineWidth = 1.5;
        c.strokeRect(x0, by, x1 - x0, bh);
      }

      // Selected highlight
      if (selectedAtom === p.id) {
        c.strokeStyle = '#221c10';
        c.lineWidth = 2;
        c.strokeRect(x0 - 1, by - 1, x1 - x0 + 2, bh + 2);
      }
    });

    // Milestones as diamonds
    milestones.forEach(function (ms) {
      var monthTag = ms.tags.find(function (t) { return t === 'milestone'; });
      var msStart = cpm.starts[ms.id];
      if (msStart === undefined) return;
      var mx = labelW + (msStart / maxFinish) * chartW;
      var my = padT + phases.length * rowH - 4;
      var sz = 4;
      c.fillStyle = ms._complete ? '#2f7d4f' : '#a8401f';
      c.beginPath();
      c.moveTo(mx, my - sz);
      c.lineTo(mx + sz, my);
      c.lineTo(mx, my + sz);
      c.lineTo(mx - sz, my);
      c.closePath();
      c.fill();
    });

    // Current month line (use project start date + months)
    var now = new Date();
    var start = new Date(ACE_Data.PLANT.startDate);
    var currentMonth = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (currentMonth >= 0 && currentMonth <= maxFinish) {
      var cmx = labelW + (currentMonth / maxFinish) * chartW;
      c.strokeStyle = '#b13d2c';
      c.lineWidth = 2;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.moveTo(cmx, padT - 4);
      c.lineTo(cmx, padT + phases.length * rowH + 4);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#b13d2c';
      c.font = 'bold 10px IBM Plex Mono, monospace';
      c.textAlign = 'center';
      c.fillText('Now (M' + currentMonth + ')', cmx, padT - 8);
    }

    // Click handler
    cv.onclick = function (e) {
      var rect = cv.getBoundingClientRect();
      var mx2 = (e.clientX - rect.left);
      var my2 = (e.clientY - rect.top);
      // Hit test phases
      phases.forEach(function (p, i) {
        var start2 = cpm.starts[p.id] || 0;
        var finish2 = cpm.finishes[p.id] || 0;
        var y2 = padT + i * rowH;
        var x02 = labelW + (start2 / maxFinish) * chartW;
        var x12 = labelW + (finish2 / maxFinish) * chartW;
        if (mx2 >= x02 && mx2 <= x12 && my2 >= y2 && my2 <= y2 + rowH) {
          selectedAtom = p.id;
          creatingAtom = false;
          editingAtom = false;
          renderContent();
        }
      });
    };
  }

  // -- Project summary (when nothing selected) --

  function renderProjectSummary() {
    var s = ACE.summary();
    var cpmData = ACE_Schedule.cpm();
    var html = '<div class="dash-kpis">';
    html += kpiBox(s.atoms, 'Total Atoms', '');
    html += kpiBox(s.complete + '/' + s.atoms, 'Complete', s.percent > 50 ? 'kpi-good' : '');
    html += kpiBox(s.percent + '%', 'Progress', s.percent >= 80 ? 'kpi-good' : s.percent < 20 ? 'kpi-bad' : '');
    html += kpiBox(s.workable, 'Workable', s.workable > 0 ? 'kpi-good' : '');
    html += kpiBox(cpmData.criticalPath.length, 'Critical Path', 'kpi-bad');
    html += kpiBox('M' + Math.round(cpmData.projectFinish), 'CPM Finish', '');
    if (mcResults) {
      html += kpiBox('M' + Math.round(mcResults.p50.finish), 'MC P50', '');
      html += kpiBox('M' + Math.round(mcResults.p80.finish), 'MC P80', '');
    }
    html += '</div>';

    // Type breakdown
    html += '<div class="dash-feed"><div class="feed-title">Atom Types</div>';
    var types = s.types;
    for (var t in types) {
      html += '<div class="feed-item"><span class="feed-type">' + t + '</span> -- ' + types[t] + ' atoms</div>';
    }
    html += '</div>';

    // Workable feed
    var work = ACE.workable().slice(0, 10);
    html += '<div class="dash-feed"><div class="feed-title">Workable Now (' + ACE.workable().length + ')</div>';
    if (work.length === 0) {
      html += '<div class="feed-empty">No workable atoms.</div>';
    }
    work.forEach(function (a) {
      html += '<div class="feed-item"><span class="feed-name" data-select="' + a.id + '">' + a.id + '</span> -- ' + a.name + '</div>';
    });
    html += '</div>';

    return html;
  }

  // -- Atom detail card --

  function renderAtomCard(id) {
    var a = ACE.get(id);
    if (!a) return '<div class="feed-empty">Atom not found: ' + escHtml(id) + '</div>';

    var pct = ACE.percentComplete(id);
    var dur = ACE_Schedule.durations[id];
    var cpmData = ACE_Schedule.cpm();

    // Breadcrumb
    var anc = ACE.ancestors(id);
    var html = '';
    if (anc.length) {
      html += '<div class="card-breadcrumb">';
      anc.forEach(function (aid) {
        var p = ACE.get(aid);
        html += '<span class="crumb" data-select="' + aid + '">' + (p ? p.name : aid) + '</span> &gt; ';
      });
      html += '<b>' + a.name + '</b></div>';
    }

    html += '<div class="card-header"><div class="card-title">' + escHtml(a.id) + ' -- ' + escHtml(a.name) + '</div>' +
      '<button class="card-close" id="btn-close-card">[x]</button></div>';

    // Tags
    if (a.tags.length) {
      html += '<div class="card-tags">';
      a.tags.forEach(function (t) { html += '<span class="pill">' + escHtml(t) + '</span>'; });
      html += '</div>';
    }

    // Fields
    html += '<div class="card-fields">';
    html += cardField('Type', a.type);
    html += cardField('Kind', a.kind);
    html += cardField('Status', a._complete ? '<span class="val-done">COMPLETE</span>' : '<span class="val-open">OPEN</span>');
    html += cardField('Progress', pct + '%');
    if (dur) {
      html += cardField('Duration', dur.min + ' / ' + dur.likely + ' / ' + dur.max + ' mo');
    }
    if (cpmData.starts[id] !== undefined) {
      html += cardField('Early Start', 'M' + Math.round(cpmData.starts[id]));
      html += cardField('Early Finish', 'M' + Math.round(cpmData.finishes[id]));
      html += cardField('Float', Math.round(cpmData.floats[id]) + ' mo');
    }
    if (a._evidence) html += cardField('Evidence', escHtml(a._evidence));
    if (a._narrative) html += cardField('Narrative', escHtml(a._narrative));
    html += '</div>';

    // Edit duration
    if (editingAtom) {
      html += renderEditForm(a, dur);
    }

    // Requires
    if (a.requires.length) {
      html += '<div class="card-section"><span class="section-lbl">Requires (' + a.requires.length + ')</span>';
      a.requires.forEach(function (rid) {
        var r = ACE.get(rid);
        html += '<div class="card-link" data-select="' + rid + '">' +
          '<span class="' + (r && r._complete ? 'atom-done' : 'atom-open') + '">' + (r && r._complete ? '[x]' : '[ ]') + '</span> ' +
          rid + (r ? ' -- ' + escHtml(r.name) : '') + '</div>';
      });
      html += '</div>';
    }

    // Contains
    if (a.contains.length) {
      html += '<div class="card-section"><span class="section-lbl">Contains (' + a.contains.length + ')</span>';
      a.contains.forEach(function (cid) {
        var ch = ACE.get(cid);
        html += '<div class="card-link" data-select="' + cid + '">' +
          '<span class="' + (ch && ch._complete ? 'atom-done' : 'atom-open') + '">' + (ch && ch._complete ? '[x]' : '[ ]') + '</span> ' +
          cid + (ch ? ' -- ' + escHtml(ch.name) : '') + '</div>';
      });
      html += '</div>';
    }

    // Required by
    var depBy = ACE.all().filter(function (x) { return x.requires.indexOf(id) >= 0; });
    if (depBy.length) {
      html += '<div class="card-section"><span class="section-lbl">Required By (' + depBy.length + ')</span>';
      depBy.forEach(function (d) {
        html += '<div class="card-link" data-select="' + d.id + '">' + d.id + ' -- ' + escHtml(d.name) + '</div>';
      });
      html += '</div>';
    }

    // Toolbar
    html += '<div class="card-toolbar">';
    if (!editingAtom) {
      html += '<button class="btn-card" id="btn-edit-atom">[Edit]</button>';
    }
    html += '<button class="btn-card" id="btn-add-req">[Add requires]</button>';
    html += '<button class="btn-card" id="btn-add-child">[Add child]</button>';
    if (a.kind === 'manual' && !a._complete) {
      html += '<button class="btn-card btn-apply" id="btn-clear-atom">[Clear]</button>';
    }
    html += '<button class="btn-card" id="btn-delete-atom" style="color:var(--red);border-color:var(--red)">[Delete]</button>';
    html += '</div>';

    return html;
  }

  function renderEditForm(a, dur) {
    var html = '<div class="card-edit">';
    html += '<div class="section-lbl" style="margin-bottom:6px">Edit Atom</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">Name</label><input type="text" class="filter-input" id="edit-name" value="' + escAttr(a.name) + '" style="width:100%"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">Type</label><input type="text" class="filter-input" id="edit-type" value="' + escAttr(a.type) + '" style="width:80px"></div>';
    html += '<div><label class="field-lbl">Kind</label><select class="filter-select" id="edit-kind"><option value="manual"' + (a.kind === 'manual' ? ' selected' : '') + '>manual</option><option value="derived"' + (a.kind === 'derived' ? ' selected' : '') + '>derived</option></select></div>';
    html += '<div><label class="field-lbl">Tags</label><input type="text" class="filter-input" id="edit-tags" value="' + escAttr(a.tags.join(', ')) + '" style="width:140px"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">Dur Min</label><input type="number" class="filter-input" id="edit-dur-min" value="' + (dur ? dur.min : '') + '" style="width:70px" step="0.5"></div>';
    html += '<div><label class="field-lbl">Dur Likely</label><input type="number" class="filter-input" id="edit-dur-likely" value="' + (dur ? dur.likely : '') + '" style="width:70px" step="0.5"></div>';
    html += '<div><label class="field-lbl">Dur Max</label><input type="number" class="filter-input" id="edit-dur-max" value="' + (dur ? dur.max : '') + '" style="width:70px" step="0.5"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button class="btn-card btn-apply" id="btn-save-edit">[Save]</button>';
    html += '<button class="btn-card" id="btn-cancel-edit">[Cancel]</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // -- Atom creation form --

  function renderCreateForm() {
    var html = '<div style="margin-bottom:8px"><span class="card-title">New Atom</span></div>';
    html += '<div class="card-edit">';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">ID (required)</label><input type="text" class="filter-input" id="new-id" placeholder="e.g. PH-NEW" style="width:140px"></div>';
    html += '<div style="flex:1"><label class="field-lbl">Name</label><input type="text" class="filter-input" id="new-name" placeholder="Phase name" style="width:100%"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">Type</label><input type="text" class="filter-input" id="new-type" value="phase" style="width:80px"></div>';
    html += '<div><label class="field-lbl">Kind</label><select class="filter-select" id="new-kind"><option value="derived">derived</option><option value="manual">manual</option></select></div>';
    html += '<div><label class="field-lbl">Tags</label><input type="text" class="filter-input" id="new-tags" placeholder="tag1, tag2" style="width:140px"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    html += '<div><label class="field-lbl">Dur Min (mo)</label><input type="number" class="filter-input" id="new-dur-min" step="0.5" style="width:80px"></div>';
    html += '<div><label class="field-lbl">Dur Likely</label><input type="number" class="filter-input" id="new-dur-likely" step="0.5" style="width:80px"></div>';
    html += '<div><label class="field-lbl">Dur Max</label><input type="number" class="filter-input" id="new-dur-max" step="0.5" style="width:80px"></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px">';
    html += '<button class="btn-card btn-apply" id="btn-create-atom">[Create]</button>';
    html += '<button class="btn-card" id="btn-cancel-create">[Cancel]</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // -- Wire plan detail events --

  function wirePlanDetail() {
    // Select links
    document.querySelectorAll('[data-select]').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedAtom = el.dataset.select;
        creatingAtom = false;
        editingAtom = false;
        renderContent();
      });
    });

    // Close card
    var closeBtn = document.getElementById('btn-close-card');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      selectedAtom = null;
      editingAtom = false;
      renderContent();
    });

    // Edit button
    var editBtn = document.getElementById('btn-edit-atom');
    if (editBtn) editBtn.addEventListener('click', function () {
      editingAtom = true;
      renderContent();
    });

    // Save edit
    var saveEditBtn = document.getElementById('btn-save-edit');
    if (saveEditBtn) saveEditBtn.addEventListener('click', function () {
      var a = ACE.get(selectedAtom);
      if (!a) return;
      var nameEl = document.getElementById('edit-name');
      var typeEl = document.getElementById('edit-type');
      var kindEl = document.getElementById('edit-kind');
      var tagsEl = document.getElementById('edit-tags');
      if (nameEl) a.name = nameEl.value;
      if (typeEl) a.type = typeEl.value;
      if (kindEl) a.kind = kindEl.value;
      if (tagsEl) a.tags = tagsEl.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var dMin = parseFloat(document.getElementById('edit-dur-min').value);
      var dLikely = parseFloat(document.getElementById('edit-dur-likely').value);
      var dMax = parseFloat(document.getElementById('edit-dur-max').value);
      if (!isNaN(dMin) && !isNaN(dLikely) && !isNaN(dMax) && dMin <= dLikely && dLikely <= dMax) {
        ACE_Schedule.setDuration(a.id, dMin, dLikely, dMax);
      }
      editingAtom = false;
      afterMutation();
    });

    // Cancel edit
    var cancelEditBtn = document.getElementById('btn-cancel-edit');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', function () {
      editingAtom = false;
      renderContent();
    });

    // Clear atom
    var clearBtn = document.getElementById('btn-clear-atom');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      showClearModal(selectedAtom);
    });

    // Delete atom
    var deleteBtn = document.getElementById('btn-delete-atom');
    if (deleteBtn) deleteBtn.addEventListener('click', function () {
      if (confirm('Delete atom ' + selectedAtom + '? This cannot be undone.')) {
        ACE.remove(selectedAtom);
        selectedAtom = null;
        afterMutation();
      }
    });

    // Add requires
    var addReqBtn = document.getElementById('btn-add-req');
    if (addReqBtn) addReqBtn.addEventListener('click', function () {
      showLinkPicker(selectedAtom, 'requires');
    });

    // Add child
    var addChildBtn = document.getElementById('btn-add-child');
    if (addChildBtn) addChildBtn.addEventListener('click', function () {
      showLinkPicker(selectedAtom, 'contains');
    });

    // Create atom
    var createBtn = document.getElementById('btn-create-atom');
    if (createBtn) createBtn.addEventListener('click', function () {
      var id = (document.getElementById('new-id').value || '').trim();
      var name = (document.getElementById('new-name').value || '').trim() || id;
      var type = (document.getElementById('new-type').value || '').trim() || 'atom';
      var kind = document.getElementById('new-kind').value || 'derived';
      var tags = (document.getElementById('new-tags').value || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      if (!id) { alert('ID is required.'); return; }
      if (ACE.get(id)) { alert('Atom ' + id + ' already exists.'); return; }
      try {
        ACE.create({ id: id, name: name, type: type, kind: kind, tags: tags });
        var dMin = parseFloat(document.getElementById('new-dur-min').value);
        var dLikely = parseFloat(document.getElementById('new-dur-likely').value);
        var dMax = parseFloat(document.getElementById('new-dur-max').value);
        if (!isNaN(dMin) && !isNaN(dLikely) && !isNaN(dMax) && dMin <= dLikely && dLikely <= dMax) {
          ACE_Schedule.setDuration(id, dMin, dLikely, dMax);
        }
        creatingAtom = false;
        selectedAtom = id;
        afterMutation();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    });

    // Cancel create
    var cancelCreateBtn = document.getElementById('btn-cancel-create');
    if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', function () {
      creatingAtom = false;
      renderContent();
    });
  }

  // -- Clear modal with narrative --

  function showClearModal(id) {
    var a = ACE.get(id);
    if (!a) return;
    var html = '<div class="overlay" id="clear-overlay"><div class="card">' +
      '<div class="card-title">Clear: ' + escHtml(a.name) + '</div>' +
      '<div class="card-section"><span class="section-lbl">Evidence</span>' +
      '<input type="text" class="filter-input" id="clear-evidence" placeholder="What proves this is done?" style="width:100%;margin-bottom:8px"></div>' +
      '<div class="card-section"><span class="section-lbl">Narrative (optional)</span>' +
      '<textarea class="edit-textarea" id="clear-narrative" placeholder="Notes, context, lessons learned..." style="height:80px"></textarea></div>' +
      '<div class="card-toolbar">' +
      '<button class="btn-card btn-apply" id="btn-do-clear">[Clear atom]</button>' +
      '<button class="btn-card" id="btn-cancel-clear">[Cancel]</button>' +
      '</div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    document.getElementById('btn-do-clear').addEventListener('click', function () {
      var ev = document.getElementById('clear-evidence').value || 'Cleared';
      var narr = document.getElementById('clear-narrative').value || null;
      ACE.complete(id, ev, narr);
      document.getElementById('clear-overlay').remove();
      afterMutation();
    });
    document.getElementById('btn-cancel-clear').addEventListener('click', function () {
      document.getElementById('clear-overlay').remove();
    });
    document.getElementById('clear-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'clear-overlay') document.getElementById('clear-overlay').remove();
    });
  }

  // -- Link picker overlay --

  function showLinkPicker(fromId, rel) {
    var html = '<div class="overlay" id="link-overlay"><div class="card">' +
      '<div class="card-title">Add ' + rel + ' to ' + escHtml(fromId) + '</div>' +
      '<input type="text" class="filter-input" id="link-search" placeholder="Search atoms..." style="width:100%;margin-bottom:8px" autofocus>' +
      '<div id="link-results" class="atom-list" style="max-height:300px;overflow-y:auto"></div>' +
      '<div class="card-toolbar"><button class="btn-card" id="btn-cancel-link">[Cancel]</button></div>' +
      '</div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    function updateResults() {
      var q = document.getElementById('link-search').value.trim();
      var results = q ? ACE.query({ search: q }).slice(0, 30) : ACE.all().slice(0, 30);
      var rEl = document.getElementById('link-results');
      rEl.innerHTML = results.map(function (a) {
        return '<div class="atom-row" data-link-target="' + a.id + '">' +
          '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '[x]' : '[ ]') + '</span>' +
          '<span class="atom-id">' + a.id + '</span>' +
          '<span class="atom-name">' + escHtml(a.name) + '</span>' +
          '</div>';
      }).join('');
      rEl.querySelectorAll('[data-link-target]').forEach(function (row) {
        row.addEventListener('click', function () {
          try {
            ACE.link(fromId, rel, row.dataset.linkTarget);
            document.getElementById('link-overlay').remove();
            afterMutation();
          } catch (e) {
            alert('Error: ' + e.message);
          }
        });
      });
    }

    document.getElementById('link-search').addEventListener('input', updateResults);
    updateResults();

    document.getElementById('btn-cancel-link').addEventListener('click', function () {
      document.getElementById('link-overlay').remove();
    });
    document.getElementById('link-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'link-overlay') document.getElementById('link-overlay').remove();
    });
  }

  // ================================================================
  // VIEW 2: FORECAST -- Monte Carlo probability engine
  // ================================================================

  function renderForecast(el) {
    if (!mcResults) { runMC(mcIterations); }
    if (!mcResults) { el.innerHTML = '<p>No atoms loaded.</p>'; return; }

    var p = mcResults;
    var spread = p.p90.finish - p.p10.finish;
    var html = '';

    // Hero histograms
    html += '<div style="display:flex;gap:16px;flex-wrap:wrap">';
    html += '<div style="flex:2;min-width:300px">';
    html += '<div class="mc-header">Schedule Distribution</div>';
    html += '<div class="mc-canvas" style="height:220px"><canvas id="fc-hist-sched"></canvas></div>';

    // Confidence summary
    html += '<div class="mc-stats" style="margin-top:8px;flex-wrap:wrap;gap:16px">';
    html += fcStat('P10', 'M' + Math.round(p.p10.finish), 'var(--green)');
    html += fcStat('P50', 'M' + Math.round(p.p50.finish), 'var(--ink)');
    html += fcStat('P80', 'M' + Math.round(p.p80.finish), 'var(--oxide)');
    html += fcStat('P90', 'M' + Math.round(p.p90.finish), 'var(--red)');
    html += fcStat('Spread', Math.round(spread) + ' mo', spread > 20 ? 'var(--red)' : 'var(--green)');
    html += '</div>';

    // Shift detection
    if (mcPrev) {
      var shift = Math.round(p.p50.finish) - Math.round(mcPrev.p50.finish);
      if (shift !== 0) {
        html += '<div style="font-family:IBM Plex Mono,monospace;font-size:12px;margin-top:6px;color:' +
          (shift > 0 ? 'var(--red)' : 'var(--green)') + '">P50 shifted ' + (shift > 0 ? '+' : '') + shift + ' months vs. prior run</div>';
      }
    }

    // Iteration controls
    html += '<div style="display:flex;gap:6px;margin-top:12px;align-items:center">';
    html += '<span class="field-lbl">Iterations:</span>';
    [100, 500, 1000, 5000].forEach(function (n) {
      html += '<button class="btn-card' + (mcIterations === n ? ' btn-apply' : '') + '" data-mc-n="' + n + '">' + n + '</button>';
    });
    html += '<button class="btn-card btn-apply" id="btn-run-mc">[Run]</button>';
    html += '</div>';

    // What-if buttons
    html += '<div style="display:flex;gap:6px;margin-top:8px">';
    html += '<button class="btn-card" id="btn-whatif-delay">[+3mo delay]</button>';
    html += '<button class="btn-card" id="btn-whatif-addrisk">[+risk]</button>';
    html += '<button class="btn-card" id="btn-whatif-remrisk">[-risk]</button>';
    html += '<button class="btn-card" id="btn-whatif-reset">[reset]</button>';
    html += '</div>';

    html += '</div>';

    // Right side: risk register
    html += '<div style="flex:1;min-width:220px">';
    html += '<div class="risk-header">Risk Register</div>';
    html += '<div class="risk-list">';
    var risks = ACE.query({ type: 'risk' }).sort(function (a, b) {
      return riskEV(b) - riskEV(a);
    });
    risks.forEach(function (r) {
      var prob = riskProb(r);
      var impact = riskImpact(r);
      var ev = riskEV(r);
      var severity = ev > 2 ? 'risk-high' : ev > 1 ? 'risk-med' : 'risk-low';
      var fired = r.tags.indexOf('fired') >= 0;
      html += '<div class="risk-row ' + severity + '" data-select="' + r.id + '"' + (fired ? ' style="background:rgba(177,61,44,0.1)"' : '') + '>' +
        '<span class="risk-id">' + r.id + '</span>' +
        '<span class="risk-name">' + escHtml(r.name) + (fired ? ' [FIRED]' : '') + '</span>' +
        '<span class="risk-prob">' + Math.round(prob * 100) + '%</span>' +
        '<span class="risk-impact">+' + impact + 'mo</span>' +
        '<span class="risk-score">EV=' + ev.toFixed(1) + '</span>' +
        '</div>';
    });
    html += '</div>';

    // Sensitivity table
    html += '<div class="section-lbl" style="margin-top:8px">Risk Sensitivity (top by EV)</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px">';
    risks.slice(0, 6).forEach(function (r) {
      var bar = '';
      var evN = riskEV(r);
      for (var i = 0; i < Math.min(20, Math.round(evN * 4)); i++) bar += '|';
      html += '<div style="display:flex;gap:4px;padding:2px 0"><span style="min-width:100px;color:var(--faint)">' +
        r.id + '</span><span style="color:var(--oxide)">' + bar + '</span><span style="color:var(--faint)">' + evN.toFixed(1) + '</span></div>';
    });
    html += '</div>';

    html += '</div>';
    html += '</div>';

    el.innerHTML = html;

    // Draw histogram
    setTimeout(function () { drawForecastHistogram('fc-hist-sched'); }, 20);

    // Wire
    document.querySelectorAll('[data-mc-n]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mcIterations = parseInt(btn.dataset.mcN);
        renderContent();
      });
    });

    var runBtn = document.getElementById('btn-run-mc');
    if (runBtn) runBtn.addEventListener('click', function () {
      runMC(mcIterations);
      renderContent();
    });

    // What-if handlers
    var delayBtn = document.getElementById('btn-whatif-delay');
    if (delayBtn) delayBtn.addEventListener('click', function () {
      // Add 3 months to all phase likely durations
      ACE.query({ type: 'phase' }).forEach(function (p) {
        var d = ACE_Schedule.durations[p.id];
        if (d) ACE_Schedule.setDuration(p.id, d.min, d.likely + 3, d.max + 3);
      });
      afterMutation();
    });

    var addRiskBtn = document.getElementById('btn-whatif-addrisk');
    if (addRiskBtn) addRiskBtn.addEventListener('click', function () {
      var rid = 'RSK-WHATIF-' + Date.now();
      try {
        ACE.create({ id: rid, name: 'What-if Risk', type: 'risk', kind: 'manual', tags: ['risk', 'p:0.5', 'impact:4'] });
        ACE.link('NDX', 'contains', rid);
        afterMutation();
      } catch (e) { /* ignore */ }
    });

    var remRiskBtn = document.getElementById('btn-whatif-remrisk');
    if (remRiskBtn) remRiskBtn.addEventListener('click', function () {
      var whatifs = ACE.query({ type: 'risk' }).filter(function (r) { return r.id.indexOf('RSK-WHATIF') === 0; });
      if (whatifs.length) {
        ACE.remove(whatifs[whatifs.length - 1].id);
        afterMutation();
      }
    });

    var resetBtn = document.getElementById('btn-whatif-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      ACE_Data.load();
      afterMutation();
      render();
    });

    // Select clicks
    document.querySelectorAll('[data-select]').forEach(function (el2) {
      el2.addEventListener('click', function () {
        showAtomOverlay(el2.dataset.select);
      });
    });
  }

  function fcStat(label, value, color) {
    return '<div><span style="color:' + color + ';font-weight:500">' + value + '</span> <span style="color:var(--faint)">' + label + '</span></div>';
  }

  function riskProb(r) {
    var tag = r.tags.find(function (t) { return t.indexOf('p:') === 0; });
    return tag ? parseFloat(tag.replace('p:', '')) : 0;
  }

  function riskImpact(r) {
    var tag = r.tags.find(function (t) { return t.indexOf('impact:') === 0; });
    return tag ? parseFloat(tag.replace('impact:', '')) : 0;
  }

  function riskEV(r) {
    return riskProb(r) * riskImpact(r);
  }

  function drawForecastHistogram(canvasId) {
    var cv = document.getElementById(canvasId);
    if (!cv || !mcResults) return;
    var parent = cv.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = parent.clientWidth;
    var ch = parent.clientHeight;
    if (cw < 10 || ch < 10) return;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    cv.style.width = cw + 'px';
    cv.style.height = ch + 'px';
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    var results = mcResults.results;
    var minF = results[0].finish;
    var maxF = results[results.length - 1].finish;
    var range = maxF - minF || 1;
    var bins = Math.min(50, Math.max(15, Math.round(range * 1.5)));
    var counts = new Array(bins).fill(0);
    var maxCount = 0;

    results.forEach(function (r) {
      var idx = Math.min(bins - 1, Math.floor((r.finish - minF) / range * bins));
      counts[idx]++;
      if (counts[idx] > maxCount) maxCount = counts[idx];
    });

    var pad = { l: 40, r: 16, t: 14, b: 30 };
    var pw = cw - pad.l - pad.r;
    var ph = ch - pad.t - pad.b;

    // Background
    c.fillStyle = '#1a1a18';
    c.fillRect(0, 0, cw, ch);

    // Y axis
    c.strokeStyle = '#333';
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(pad.l, pad.t);
    c.lineTo(pad.l, pad.t + ph);
    c.stroke();

    // Bars with color bands
    var bw = pw / bins;
    for (var i = 0; i < bins; i++) {
      var x = pad.l + i * bw;
      var h = maxCount > 0 ? (counts[i] / maxCount) * ph : 0;
      var mo = minF + (i + 0.5) / bins * range;

      if (mo <= mcResults.p50.finish) c.fillStyle = '#2f7d4f';
      else if (mo <= mcResults.p80.finish) c.fillStyle = '#a87718';
      else if (mo <= mcResults.p90.finish) c.fillStyle = '#b13d2c';
      else c.fillStyle = '#6c3020';

      c.fillRect(x + 1, pad.t + ph - h, bw - 2, h);
    }

    // Percentile lines
    var pLines = [
      { v: mcResults.p10, label: 'P10', color: '#2f7d4f' },
      { v: mcResults.p50, label: 'P50', color: '#e8dcc8' },
      { v: mcResults.p80, label: 'P80', color: '#a87718' },
      { v: mcResults.p90, label: 'P90', color: '#b13d2c' }
    ];
    pLines.forEach(function (pl) {
      var px = pad.l + ((pl.v.finish - minF) / range) * pw;
      c.strokeStyle = pl.color;
      c.lineWidth = 1.5;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.moveTo(px, pad.t);
      c.lineTo(px, pad.t + ph);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = pl.color;
      c.font = '10px IBM Plex Mono, monospace';
      c.textAlign = 'center';
      c.fillText(pl.label + ' M' + Math.round(pl.v.finish), px, pad.t + ph + 16);
    });

    // Y axis labels
    c.fillStyle = '#6a6050';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'right';
    for (var yi = 0; yi <= 4; yi++) {
      var yv = Math.round(maxCount * yi / 4);
      var yy = pad.t + ph - (yi / 4) * ph;
      c.fillText('' + yv, pad.l - 4, yy + 3);
    }

    // Month labels along bottom
    c.fillStyle = '#555';
    c.textAlign = 'center';
    for (var m = Math.ceil(minF / 12) * 12; m <= maxF; m += 12) {
      var mx = pad.l + ((m - minF) / range) * pw;
      c.fillText('M' + m, mx, pad.t + ph + 26);
    }
  }

  // ================================================================
  // VIEW 3: CONSTRAINTS -- AWP workface management
  // ================================================================

  function renderConstraints(el) {
    var html = '';

    // Filter bar
    html += '<div class="filter-bar">';
    html += '<button class="btn-card' + (constraintFilter === 'all' ? ' btn-apply' : '') + '" data-cf="all">[All]</button>';
    html += '<button class="btn-card' + (constraintFilter === 'workable' ? ' btn-apply' : '') + '" data-cf="workable">[Workable]</button>';
    html += '<button class="btn-card' + (constraintFilter === 'blocked' ? ' btn-apply' : '') + '" data-cf="blocked">[Blocked]</button>';
    html += '</div>';

    html += '<div style="display:flex;gap:16px;flex-wrap:wrap">';

    // Main: IWP readiness dashboard
    html += '<div style="flex:2;min-width:300px">';
    html += '<div class="risk-header">IWP Readiness</div>';

    // Group IWPs by parent CWP
    var cwps = ACE.query({ type: 'cwp' });
    cwps.forEach(function (cwp) {
      var iwps = cwp.contains.map(function (cid) { return ACE.get(cid); }).filter(function (a) { return a && a.type === 'iwp'; });
      if (!iwps.length) return;

      // Filter
      if (constraintFilter === 'workable') {
        iwps = iwps.filter(function (iwp) { return !iwp._complete && isWorkable(iwp); });
      } else if (constraintFilter === 'blocked') {
        iwps = iwps.filter(function (iwp) { return !iwp._complete && !isWorkable(iwp); });
      }
      if (!iwps.length) return;

      html += '<div style="margin-bottom:12px">';
      html += '<div style="font-family:Fraunces,serif;font-size:13px;font-weight:600;margin-bottom:4px;cursor:pointer" data-select="' + cwp.id + '">' +
        cwp.id + ' -- ' + escHtml(cwp.name) + ' (' + ACE.percentComplete(cwp.id) + '%)</div>';

      iwps.forEach(function (iwp) {
        var workable2 = isWorkable(iwp);
        var blockers = getBlockers(iwp);
        var statusClass = iwp._complete ? 'atom-done' : (workable2 ? 'atom-done' : 'atom-open');
        var statusLabel = iwp._complete ? 'DONE' : (workable2 ? 'WORKABLE' : 'BLOCKED');

        html += '<div class="atom-row" data-select="' + iwp.id + '">';
        html += '<span class="atom-status ' + statusClass + '">' + statusLabel + '</span>';
        html += '<span class="atom-id">' + iwp.id + '</span>';
        html += '<span class="atom-name">' + escHtml(iwp.name) + '</span>';
        if (blockers.length && !iwp._complete) {
          html += '<span class="atom-tag">blocked by: ' + blockers.join(', ') + '</span>';
        }
        html += '</div>';
      });
      html += '</div>';
    });

    html += '</div>';

    // Right side: constraint atoms
    html += '<div style="flex:1;min-width:200px">';
    html += '<div class="risk-header">Constraints</div>';
    var constraints = ACE.query({ type: 'constraint' });
    html += '<div class="atom-list">';
    constraints.forEach(function (con) {
      html += '<div class="atom-row" data-select="' + con.id + '">' +
        '<span class="atom-status ' + (con._complete ? 'atom-done' : 'atom-open') + '">' + (con._complete ? '[x]' : '[ ]') + '</span>' +
        '<span class="atom-id">' + con.id + '</span>' +
        '<span class="atom-name">' + escHtml(con.name) + '</span>' +
        '</div>';
    });
    html += '</div>';

    // FLEX packages section
    var flexAtoms = ACE.workable().filter(function (a) {
      return a.tags.indexOf('flex') >= 0 || a.tags.indexOf('low-priority') >= 0;
    });
    if (flexAtoms.length) {
      html += '<div style="margin-top:16px"><div class="section-lbl">FLEX Packages (idle crew work)</div>';
      flexAtoms.forEach(function (f) {
        html += '<div class="atom-row" data-select="' + f.id + '"><span class="atom-id">' + f.id + '</span><span class="atom-name">' + escHtml(f.name) + '</span></div>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    el.innerHTML = html;

    // Wire filter buttons
    document.querySelectorAll('[data-cf]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        constraintFilter = btn.dataset.cf;
        renderContent();
      });
    });

    // Wire select clicks
    document.querySelectorAll('[data-select]').forEach(function (el2) {
      el2.addEventListener('click', function () {
        showAtomOverlay(el2.dataset.select);
      });
    });
  }

  function isWorkable(a) {
    if (a._complete) return false;
    return a.requires.every(function (rid) {
      var r = ACE.get(rid);
      return r && r._complete;
    });
  }

  function getBlockers(a) {
    return a.requires.filter(function (rid) {
      var r = ACE.get(rid);
      return r && !r._complete;
    });
  }

  // ================================================================
  // VIEW 4: EXPLORE -- Search + Terminal
  // ================================================================

  function renderExplore(el) {
    var html = '';

    // Search section
    html += '<div class="filter-bar">';
    html += '<input type="text" class="filter-input" id="explore-search" placeholder="Search by id or name..." value="' + escAttr(exploreSearch) + '">';
    html += '<select class="filter-select" id="explore-type"><option value="">All types</option>';
    var types = {};
    ACE.all().forEach(function (a) { types[a.type] = (types[a.type] || 0) + 1; });
    Object.keys(types).sort().forEach(function (t) {
      html += '<option value="' + t + '"' + (exploreType === t ? ' selected' : '') + '>' + t + ' (' + types[t] + ')</option>';
    });
    html += '</select></div>';

    // Search results
    html += '<div class="atom-list" id="explore-results">';
    var filter = {};
    if (exploreSearch) filter.search = exploreSearch;
    if (exploreType) filter.type = exploreType;
    var results = ACE.query(filter).slice(0, 60);
    results.forEach(function (a) {
      html += '<div class="atom-row" data-select="' + a.id + '">' +
        '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '[x]' : '[ ]') + '</span>' +
        '<span class="atom-id">' + a.id + '</span>' +
        '<span class="atom-name">' + escHtml(a.name) + '</span>' +
        '<span class="atom-type">' + a.type + '</span>' +
        '</div>';
    });
    if (results.length === 0) html += '<div class="feed-empty">No results.</div>';
    html += '</div>';

    // Terminal
    html += '<div style="margin-top:16px">';
    html += '<div class="section-lbl" style="margin-bottom:4px">Terminal</div>';
    html += '<div class="terminal" id="term-out">' + escHtml(termLines.join('\n')) + '</div>';
    html += '<div class="term-prompt"><span class="term-caret">C:\\NDX&gt;</span><input class="term-field" id="term-in" autofocus></div>';
    html += '</div>';

    el.innerHTML = html;

    // Scroll terminal to bottom
    var termOut = document.getElementById('term-out');
    if (termOut) termOut.scrollTop = termOut.scrollHeight;

    // Wire search
    var searchInput = document.getElementById('explore-search');
    var typeSelect = document.getElementById('explore-type');
    if (searchInput) searchInput.addEventListener('input', function () {
      exploreSearch = this.value;
      updateExploreResults();
    });
    if (typeSelect) typeSelect.addEventListener('change', function () {
      exploreType = this.value;
      updateExploreResults();
    });

    // Wire terminal
    var termIn = document.getElementById('term-in');
    if (termIn) {
      termIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var cmd = termIn.value.trim();
          if (cmd) { termHistory.push(cmd); termHistIdx = termHistory.length; }
          execTermCmd(cmd);
          termIn.value = '';
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (termHistIdx > 0) { termHistIdx--; termIn.value = termHistory[termHistIdx]; }
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (termHistIdx < termHistory.length - 1) { termHistIdx++; termIn.value = termHistory[termHistIdx]; }
          else { termHistIdx = termHistory.length; termIn.value = ''; }
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          var cmds = ['query', 'atom', 'risks', 'mc', 'forecast', 'status', 'workable', 'settle', 'complete', 'export', 'help', 'clear'];
          var v = termIn.value.trim().toLowerCase();
          var matches = cmds.filter(function (c2) { return c2.indexOf(v) === 0; });
          if (matches.length === 1) termIn.value = matches[0] + ' ';
          else if (matches.length > 1) termPrint(matches.join('  '));
        }
      });
    }

    // Wire result clicks
    document.querySelectorAll('[data-select]').forEach(function (el2) {
      el2.addEventListener('click', function () {
        showAtomOverlay(el2.dataset.select);
      });
    });
  }

  function updateExploreResults() {
    var container = document.getElementById('explore-results');
    if (!container) return;
    var filter = {};
    if (exploreSearch) filter.search = exploreSearch;
    if (exploreType) filter.type = exploreType;
    var results = ACE.query(filter).slice(0, 60);
    container.innerHTML = results.map(function (a) {
      return '<div class="atom-row" data-select="' + a.id + '">' +
        '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '[x]' : '[ ]') + '</span>' +
        '<span class="atom-id">' + a.id + '</span>' +
        '<span class="atom-name">' + escHtml(a.name) + '</span>' +
        '<span class="atom-type">' + a.type + '</span>' +
        '</div>';
    }).join('');
    if (results.length === 0) container.innerHTML = '<div class="feed-empty">No results.</div>';
    container.querySelectorAll('[data-select]').forEach(function (el2) {
      el2.addEventListener('click', function () {
        showAtomOverlay(el2.dataset.select);
      });
    });
  }

  function termPrint(text) {
    termLines.push(text);
    var out = document.getElementById('term-out');
    if (out) {
      out.textContent = termLines.join('\n');
      out.scrollTop = out.scrollHeight;
    }
  }

  function execTermCmd(cmd) {
    termPrint('> ' + cmd);
    var parts = cmd.split(/\s+/);
    var verb = (parts[0] || '').toLowerCase();

    if (verb === 'help') {
      termPrint('Commands: query <type>, atom <id>, risks, mc [n], forecast,');
      termPrint('  status, workable, settle, complete <id> [evidence],');
      termPrint('  export json|csv, clear, help');
    }
    else if (verb === 'clear') {
      termLines.length = 0;
      var out = document.getElementById('term-out');
      if (out) out.textContent = '';
    }
    else if (verb === 'status') {
      var s = ACE.summary();
      termPrint('Atoms: ' + s.atoms + '  Complete: ' + s.complete + '  Progress: ' + s.percent + '%  Workable: ' + s.workable);
      if (mcResults) {
        termPrint('MC P50: M' + Math.round(mcResults.p50.finish) + '  P80: M' + Math.round(mcResults.p80.finish) + '  P90: M' + Math.round(mcResults.p90.finish));
      }
    }
    else if (verb === 'risks') {
      ACE.query({ type: 'risk' }).forEach(function (r) {
        termPrint(r.id + '  ' + r.name + '  P=' + Math.round(riskProb(r) * 100) + '%  +' + riskImpact(r) + 'mo  EV=' + riskEV(r).toFixed(1) +
          (r.tags.indexOf('fired') >= 0 ? '  [FIRED]' : ''));
      });
    }
    else if (verb === 'forecast' || verb === 'mc') {
      var n = parseInt(parts[1]) || 1000;
      runMC(n);
      termPrint('Monte Carlo (' + n + ' runs):');
      termPrint('  P10=M' + Math.round(mcResults.p10.finish) + '  P50=M' + Math.round(mcResults.p50.finish) +
        '  P80=M' + Math.round(mcResults.p80.finish) + '  P90=M' + Math.round(mcResults.p90.finish));
    }
    else if (verb === 'workable') {
      var w = ACE.workable();
      termPrint(w.length + ' workable atoms:');
      w.slice(0, 20).forEach(function (a) { termPrint('  ' + a.id + '  ' + a.name); });
      if (w.length > 20) termPrint('  ... +' + (w.length - 20) + ' more');
    }
    else if (verb === 'settle') {
      var changed = ACE.settle();
      termPrint('Settled: ' + changed + ' atoms changed');
    }
    else if (verb === 'complete' && parts[1]) {
      var evidence = parts.slice(2).join(' ') || 'terminal';
      var ok = ACE.complete(parts[1], evidence);
      ACE.settle();
      termPrint(ok ? parts[1] + ' cleared' : 'Cannot clear ' + parts[1] + ' (not manual or already done)');
      if (ok) { runMC(mcIterations); renderSidebar(); }
    }
    else if (verb === 'atom' && parts[1]) {
      var a = ACE.get(parts[1]);
      if (!a) { termPrint('Not found: ' + parts[1]); return; }
      termPrint(JSON.stringify({
        id: a.id, name: a.name, type: a.type, kind: a.kind,
        tags: a.tags, complete: a._complete,
        requires: a.requires, contains: a.contains
      }, null, 2));
    }
    else if (verb === 'query') {
      var f = {};
      if (parts[1]) f.type = parts[1];
      var r2 = ACE.query(f);
      termPrint(r2.length + ' results');
      r2.slice(0, 20).forEach(function (a2) {
        termPrint('  ' + a2.id + '  ' + a2.name + '  [' + a2.type + '] ' + (a2._complete ? 'DONE' : 'OPEN'));
      });
      if (r2.length > 20) termPrint('  ... +' + (r2.length - 20) + ' more');
    }
    else if (verb === 'export') {
      if (parts[1] === 'json') { exportJSON(); termPrint('Exported JSON'); }
      else if (parts[1] === 'csv') { exportCSV(); termPrint('Exported CSV'); }
      else termPrint('Usage: export json | export csv');
    }
    else if (cmd.trim()) {
      termPrint('Unknown: ' + verb + '. Type "help".');
    }
  }

  // ================================================================
  // Atom overlay (used from Forecast/Constraints/Explore views)
  // ================================================================

  function showAtomOverlay(id) {
    var a = ACE.get(id);
    if (!a) return;

    var pct = ACE.percentComplete(id);
    var dur = ACE_Schedule.durations[id];
    var cpmData = ACE_Schedule.cpm();

    var html = '<div class="overlay" id="atom-overlay"><div class="card">';

    // Breadcrumb
    var anc = ACE.ancestors(id);
    if (anc.length) {
      html += '<div class="card-breadcrumb">';
      anc.forEach(function (aid) {
        var p = ACE.get(aid);
        html += '<span class="crumb" data-ov-goto="' + aid + '">' + (p ? p.name : aid) + '</span> &gt; ';
      });
      html += '<b>' + a.name + '</b></div>';
    }

    html += '<div class="card-header"><div class="card-title">' + escHtml(a.id) + ' -- ' + escHtml(a.name) + '</div>' +
      '<button class="card-close" id="btn-close-overlay">[x]</button></div>';

    // Tags
    if (a.tags.length) {
      html += '<div class="card-tags">';
      a.tags.forEach(function (t) { html += '<span class="pill">' + escHtml(t) + '</span>'; });
      html += '</div>';
    }

    // Fields
    html += '<div class="card-fields">';
    html += cardField('Type', a.type);
    html += cardField('Kind', a.kind);
    html += cardField('Status', a._complete ? '<span class="val-done">COMPLETE</span>' : '<span class="val-open">OPEN</span>');
    html += cardField('Progress', pct + '%');
    if (dur) html += cardField('Duration', dur.min + ' / ' + dur.likely + ' / ' + dur.max + ' mo');
    if (cpmData.starts[id] !== undefined) {
      html += cardField('Early Start', 'M' + Math.round(cpmData.starts[id]));
      html += cardField('Early Finish', 'M' + Math.round(cpmData.finishes[id]));
      html += cardField('Float', Math.round(cpmData.floats[id]) + ' mo');
    }
    if (a._evidence) html += cardField('Evidence', escHtml(a._evidence));
    if (a._narrative) html += cardField('Narrative', escHtml(a._narrative));
    html += '</div>';

    // Requires
    if (a.requires.length) {
      html += '<div class="card-section"><span class="section-lbl">Requires (' + a.requires.length + ')</span>';
      a.requires.forEach(function (rid) {
        var r = ACE.get(rid);
        html += '<div class="card-link" data-ov-goto="' + rid + '">' +
          '<span class="' + (r && r._complete ? 'atom-done' : 'atom-open') + '">' + (r && r._complete ? '[x]' : '[ ]') + '</span> ' +
          rid + (r ? ' -- ' + escHtml(r.name) : '') + '</div>';
      });
      html += '</div>';
    }

    // Contains
    if (a.contains.length) {
      html += '<div class="card-section"><span class="section-lbl">Contains (' + a.contains.length + ')</span>';
      a.contains.forEach(function (cid) {
        var ch = ACE.get(cid);
        html += '<div class="card-link" data-ov-goto="' + cid + '">' +
          '<span class="' + (ch && ch._complete ? 'atom-done' : 'atom-open') + '">' + (ch && ch._complete ? '[x]' : '[ ]') + '</span> ' +
          cid + (ch ? ' -- ' + escHtml(ch.name) : '') + '</div>';
      });
      html += '</div>';
    }

    // Required by
    var depBy = ACE.all().filter(function (x) { return x.requires.indexOf(id) >= 0; });
    if (depBy.length) {
      html += '<div class="card-section"><span class="section-lbl">Required By (' + depBy.length + ')</span>';
      depBy.forEach(function (d) {
        html += '<div class="card-link" data-ov-goto="' + d.id + '">' + d.id + ' -- ' + escHtml(d.name) + '</div>';
      });
      html += '</div>';
    }

    // Source
    html += '<div class="card-section" style="margin-top:8px"><button class="btn-card" id="btn-ov-source">[Source]</button></div>';
    var src = JSON.stringify({ id: a.id, name: a.name, type: a.type, kind: a.kind, tags: a.tags, requires: a.requires, contains: a.contains, complete: a._complete }, null, 2);
    html += '<pre class="card-source" id="ov-source" style="display:none">' + escHtml(src) + '</pre>';

    // Actions
    html += '<div class="card-toolbar">';
    if (a.kind === 'manual' && !a._complete) {
      html += '<button class="btn-card btn-apply" id="btn-ov-clear">[Clear]</button>';
    }
    html += '<button class="btn-card" id="btn-ov-goto-plan">[View in Plan]</button>';
    html += '</div>';

    html += '</div></div>';

    // Remove existing overlay if any
    var existing = document.getElementById('atom-overlay');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    // Wire overlay events
    document.getElementById('atom-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'atom-overlay') document.getElementById('atom-overlay').remove();
    });
    document.getElementById('btn-close-overlay').addEventListener('click', function () {
      document.getElementById('atom-overlay').remove();
    });

    // Navigate within overlay
    document.querySelectorAll('[data-ov-goto]').forEach(function (link) {
      link.addEventListener('click', function () {
        document.getElementById('atom-overlay').remove();
        showAtomOverlay(link.dataset.ovGoto);
      });
    });

    // Source toggle
    var srcBtn = document.getElementById('btn-ov-source');
    if (srcBtn) srcBtn.addEventListener('click', function () {
      var srcEl = document.getElementById('ov-source');
      srcEl.style.display = srcEl.style.display === 'none' ? 'block' : 'none';
    });

    // Clear
    var clearBtn = document.getElementById('btn-ov-clear');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      document.getElementById('atom-overlay').remove();
      showClearModal(id);
    });

    // Go to plan view
    var planBtn = document.getElementById('btn-ov-goto-plan');
    if (planBtn) planBtn.addEventListener('click', function () {
      document.getElementById('atom-overlay').remove();
      view = 'plan';
      selectedAtom = id;
      creatingAtom = false;
      editingAtom = false;
      render();
    });
  }

  // ================================================================
  // Search overlay (/ key)
  // ================================================================

  function renderSearchOverlay() {
    if (document.getElementById('search-overlay')) return;
    var html = '<div class="overlay" id="search-overlay"><div class="card" style="width:440px">' +
      '<input type="text" class="filter-input" id="search-input" placeholder="Search atoms..." value="' + escAttr(searchQuery) + '" style="width:100%;margin-bottom:8px;font-size:14px" autofocus>' +
      '<div id="search-results" class="atom-list" style="max-height:400px;overflow-y:auto"></div>' +
      '</div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    var input = document.getElementById('search-input');
    input.focus();

    function update() {
      searchQuery = input.value;
      var results = searchQuery.trim() ? ACE.query({ search: searchQuery.trim() }).slice(0, 30) : [];
      var rEl = document.getElementById('search-results');
      rEl.innerHTML = results.map(function (a) {
        return '<div class="atom-row" data-search-go="' + a.id + '">' +
          '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '[x]' : '[ ]') + '</span>' +
          '<span class="atom-id">' + a.id + '</span>' +
          '<span class="atom-name">' + escHtml(a.name) + '</span>' +
          '<span class="atom-type">' + a.type + '</span>' +
          '</div>';
      }).join('');
      rEl.querySelectorAll('[data-search-go]').forEach(function (row) {
        row.addEventListener('click', function () {
          closeSearch();
          view = 'plan';
          selectedAtom = row.dataset.searchGo;
          creatingAtom = false;
          editingAtom = false;
          render();
        });
      });
    }

    input.addEventListener('input', update);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });
    document.getElementById('search-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'search-overlay') closeSearch();
    });

    update();
  }

  function closeSearch() {
    searchOpen = false;
    searchQuery = '';
    var ov = document.getElementById('search-overlay');
    if (ov) ov.remove();
  }

  // ================================================================
  // Keyboard shortcuts
  // ================================================================

  function onGlobalKey(e) {
    // Don't intercept when typing in inputs
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') {
        e.target.blur();
        closeSearch();
        var ov = document.getElementById('atom-overlay');
        if (ov) ov.remove();
        var co = document.getElementById('clear-overlay');
        if (co) co.remove();
        var lo = document.getElementById('link-overlay');
        if (lo) lo.remove();
      }
      return;
    }

    if (e.key === 'Escape') {
      closeSearch();
      var ov2 = document.getElementById('atom-overlay');
      if (ov2) { ov2.remove(); return; }
      var co2 = document.getElementById('clear-overlay');
      if (co2) { co2.remove(); return; }
      var lo2 = document.getElementById('link-overlay');
      if (lo2) { lo2.remove(); return; }
      if (selectedAtom) {
        selectedAtom = null;
        editingAtom = false;
        renderContent();
        return;
      }
    }

    if (e.key === '/') {
      e.preventDefault();
      searchOpen = true;
      renderSearchOverlay();
    }
  }

  // ================================================================
  // Helpers
  // ================================================================

  function kpiBox(value, label, cls) {
    return '<div class="kpi"><span class="kpi-val ' + cls + '">' + value + '</span><span class="kpi-lbl">' + label + '</span></div>';
  }

  function cardField(label, value) {
    return '<div class="card-field"><span class="field-lbl">' + label + '</span><span class="field-val">' + value + '</span></div>';
  }

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escAttr(s) {
    return escHtml(s);
  }

  // -- Public API --
  return { init: init };

})();

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACE_UI;
}
