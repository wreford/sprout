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
  var view = 'model';
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
  var ganttTooltipEl = null;

  // -- Pill color mapping --
  var PILL_CLASSES = {
    'risk': 'pill-risk',
    'constraint': 'pill-constraint',
    'phase': 'pill-phase',
    'iwp': 'pill-iwp',
    'awp': 'pill-awp',
    'milestone': 'pill-milestone',
    'nuclear': 'pill-nuclear',
    'opportunity': 'pill-opportunity',
    'long-lead': 'pill-long-lead'
  };

  function pillClass(tag) {
    // Match known tag prefixes
    var t = tag.toLowerCase();
    if (PILL_CLASSES[t]) return PILL_CLASSES[t];
    // Check if tag starts with a known prefix
    for (var key in PILL_CLASSES) {
      if (t.indexOf(key) === 0) return PILL_CLASSES[key];
    }
    return ''; // default pill styling
  }

  // -- Init --

  // -- Simulation state --
  var simMonth = 0, simPlaying = false, simSpeed = 1;
  var lastFrame = performance.now();
  var lastRenderTime = 0;
  var simCpmCache = null;

  function maxMonth() { return ACE_Data.PLANT.baselineMonths || 120; }

  function init() {
    ACE_Data.load();
    simCpmCache = ACE_Schedule.cpm();
    runMC(mcIterations);
    showSplash(function () {
      render();
      document.addEventListener('keydown', onGlobalKey);
      window.addEventListener('resize', function () { renderContent(); });
      requestAnimationFrame(simLoop);
    });
  }

  function showSplash(onDone) {
    var s = ACE.summary();
    var style = document.createElement('style');
    style.textContent = '@keyframes si{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes pulse-glow{0%,100%{opacity:.6}50%{opacity:1}}';
    document.head.appendChild(style);

    var html = '<div id="ace-splash" style="position:fixed;inset:0;z-index:200;cursor:pointer">' +
      '<canvas id="splash-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>' +
      '<div style="position:absolute;inset:0;background:rgba(26,29,33,.65);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)"></div>' +
      '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px">' +
        '<div style="background:rgba(242,236,223,.06);border:1px solid rgba(242,236,223,.1);border-radius:20px;padding:48px 56px;max-width:520px;text-align:center;backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px)">' +
          '<div style="font-family:Fraunces,serif;font-size:clamp(48px,10vw,72px);font-weight:700;color:#f2ecdf;letter-spacing:.12em;opacity:0;animation:si .8s ease forwards;line-height:1">ACE</div>' +
          '<div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,#a8401f,transparent);margin:12px auto;opacity:0;animation:si .6s ease .3s forwards"></div>' +
          '<div style="font-family:Newsreader,serif;font-size:clamp(14px,3vw,18px);color:rgba(242,236,223,.7);opacity:0;animation:si .8s ease .4s forwards">Atomic Constraint Engine</div>' +
          '<div style="font-family:IBM Plex Mono,monospace;font-size:clamp(10px,2vw,12px);color:#a8401f;margin-top:16px;opacity:0;animation:si .8s ease .7s forwards">' +
            ACE_Data.PLANT.name + '</div>' +
          '<div style="font-family:IBM Plex Mono,monospace;font-size:clamp(9px,1.8vw,11px);color:rgba(154,144,119,.7);margin-top:4px;opacity:0;animation:si .8s ease .9s forwards">' +
            s.atoms + ' atoms &middot; ' + ACE_Data.PLANT.units + '×' + ACE_Data.PLANT.mwe + ' MWe &middot; $' + Math.round(ACE_Data.PLANT.budget / 1e9) + 'B &middot; ' + ACE_Data.PLANT.baselineMonths + ' months</div>' +
          '<div style="margin-top:28px;opacity:0;animation:si .8s ease 1.2s forwards">' +
            '<div style="font-family:IBM Plex Mono,monospace;font-size:10px;color:rgba(154,144,119,.5);animation:pulse-glow 2s ease infinite">click anywhere to enter</div>' +
          '</div>' +
        '</div>' +
      '</div></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    // Animated constraint graph background
    var cv = document.getElementById('splash-cv');
    if (cv) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cw = cv.clientWidth, ch = cv.clientHeight;
      cv.width = cw * dpr; cv.height = ch * dpr;
      var ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);

      var nodes = [];
      for (var i = 0; i < 40; i++) {
        nodes.push({
          x: Math.random() * cw, y: Math.random() * ch,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          r: 2 + Math.random() * 3,
          complete: Math.random() > 0.6
        });
      }

      var splashAnim = true;
      function drawSplash() {
        if (!splashAnim) return;
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = '#14161a';
        ctx.fillRect(0, 0, cw, ch);

        // Edges
        for (var a = 0; a < nodes.length; a++) {
          for (var b = a + 1; b < nodes.length; b++) {
            var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.strokeStyle = 'rgba(168,64,31,' + (0.15 * (1 - dist / 120)) + ')';
              ctx.lineWidth = 0.5;
              ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
            }
          }
        }

        // Nodes
        nodes.forEach(function (n) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > cw) n.vx *= -1;
          if (n.y < 0 || n.y > ch) n.vy *= -1;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = n.complete ? 'rgba(47,125,79,.6)' : 'rgba(168,64,31,.4)';
          ctx.fill();
        });

        requestAnimationFrame(drawSplash);
      }
      drawSplash();
    }

    function dismiss() {
      var splash = document.getElementById('ace-splash');
      if (splash) {
        splash.style.transition = 'opacity 0.5s ease';
        splash.style.opacity = '0';
        setTimeout(function () { splash.remove(); if (typeof splashAnim !== 'undefined') splashAnim = false; onDone(); }, 500);
      }
    }
    document.getElementById('ace-splash').addEventListener('click', dismiss);
    document.addEventListener('keydown', function handler(e) {
      document.removeEventListener('keydown', handler);
      dismiss();
    });
  }

  function simLoop(now) {
    var dt = (now - lastFrame) / 1000;
    lastFrame = now;
    if (simPlaying) {
      simMonth = Math.min(maxMonth(), simMonth + dt * simSpeed * 0.5);
      if (!simCpmCache) simCpmCache = ACE_Schedule.cpm();
      var cpm = simCpmCache;
      var changed = false;
      var skipTypes = { risk: 1, opportunity: 1 };
      ACE.all().forEach(function (a) {
        if (a._complete || a.kind !== 'manual') return;
        if (skipTypes[a.type]) return;
        var finish = cpm.finishes[a.id];
        if (a.type === 'material') {
          var leadTag = a.tags.find(function (t) { return t.indexOf('lead:') === 0; });
          var leadMo = leadTag ? parseFloat(leadTag.replace('lead:', '')) : 0;
          if (simMonth >= leadMo) {
            ACE.complete(a.id, 'M' + Math.round(simMonth));
            changed = true;
          }
          return;
        }
        if (finish !== undefined && simMonth >= finish) {
          var allReqsDone = a.requires.every(function (rid) {
            var r = ACE.get(rid); return r && r._complete;
          });
          if (allReqsDone) {
            ACE.complete(a.id, 'M' + Math.round(simMonth));
            changed = true;
          }
        }
      });
      if (changed) {
        ACE.settle();
        simCpmCache = ACE_Schedule.cpm();
      }
      // Check triages — pause sim on triage event
      if (typeof ACE_Triage !== 'undefined') {
        var triggered = ACE_Triage.check(simMonth);
        if (triggered && triggered.length) {
          simPlaying = false;
          var pb0 = document.getElementById('btn-play');
          if (pb0) pb0.textContent = 'Play';
          ACE_Triage.show(triggered[0].id);
        }
      }
      if (typeof ACE_Extras !== 'undefined') ACE_Extras._currentMonth = simMonth;
      if (typeof ACE_SimEvents !== 'undefined') ACE_SimEvents.check(simMonth);
      var moEl = document.getElementById('sim-month');
      if (moEl) moEl.textContent = 'M' + Math.round(simMonth) + '/' + maxMonth();
      var scrub = document.getElementById('sim-scrub');
      if (scrub) scrub.value = simMonth;
      if (now - lastRenderTime > 400) {
        lastRenderTime = now;
        renderContent();
        // Update sidebar stats without full re-render (preserves extras tab state)
        var s2 = ACE.summary();
        var statEls = document.querySelectorAll('.sidebar-stat .stat-val');
        if (statEls.length >= 4) {
          statEls[0].textContent = s2.atoms;
          statEls[1].textContent = s2.complete;
          statEls[2].textContent = s2.workable;
          statEls[3].textContent = s2.percent + '%';
        }
        var pctEl = document.querySelector('.topbar-pct');
        if (pctEl) pctEl.textContent = s2.percent + '%';
      }
      if (simMonth >= maxMonth()) {
        simPlaying = false;
        var pb = document.getElementById('btn-play');
        if (pb) pb.textContent = 'Play';
        runMC(mcIterations);
        renderContent();
        renderSidebar();
      }
    }
    requestAnimationFrame(simLoop);
  }

  // -- Mutation helper: settle + MC after changes --

  function afterMutation() {
    ACE.settle();
    simCpmCache = null;
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
        '<div class="topbar-group">' +
          '<button class="btn-ctrl" id="btn-play">' + (simPlaying ? 'Pause' : 'Play') + '</button>' +
          '<button class="btn-ctrl" id="btn-speed">' + simSpeed + 'x</button>' +
          '<button class="btn-ctrl" id="btn-reset-sim" title="Reset simulation">Reset</button>' +
        '</div>' +
        '<div class="topbar-group" style="flex:1;max-width:250px">' +
          '<input type="range" id="sim-scrub" min="0" max="' + maxMonth() + '" value="' + simMonth + '" step="0.1" style="width:100%;accent-color:var(--oxide)">' +
        '</div>' +
        '<span id="sim-month" style="font:600 11px var(--mono);min-width:65px">M' + Math.round(simMonth) + '/' + maxMonth() + '</span>' +
        '<div class="topbar-group">' +
          '<button class="btn-ctrl" id="btn-new-atom">+ Atom</button>' +
        '</div>' +
        '<div class="topbar-group">' +
          '<button class="btn-ctrl" id="btn-save">Save</button>' +
          '<button class="btn-ctrl" id="btn-export-json">JSON</button>' +
          '<button class="btn-ctrl" id="btn-export-csv">CSV</button>' +
        '</div>' +
        '<span class="topbar-pct">' + s.percent + '%</span>' +
      '</div>';

    document.getElementById('btn-menu').addEventListener('click', function () {
      var sb = document.getElementById('sidebar');
      sb.classList.toggle('sidebar-open');
      var bd = document.getElementById('sidebar-backdrop');
      if (sb.classList.contains('sidebar-open')) {
        if (!bd) {
          bd = document.createElement('div');
          bd.id = 'sidebar-backdrop';
          bd.style.cssText = 'position:fixed;inset:0;z-index:49;background:rgba(34,28,16,.4);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)';
          bd.addEventListener('click', function () {
            sb.classList.remove('sidebar-open');
            bd.remove();
          });
          document.body.appendChild(bd);
        }
      } else if (bd) { bd.remove(); }
    });
    document.getElementById('btn-play').addEventListener('click', function () {
      if (!simPlaying && simMonth >= maxMonth()) {
        simMonth = 0;
        ACE_Data.load();
        simCpmCache = ACE_Schedule.cpm();
        if (typeof ACE_Triage !== 'undefined') ACE_Triage.resetFired();
        if (typeof ACE_Narrative !== 'undefined') ACE_Narrative.clear();
        runMC(mcIterations);
        renderSidebar();
      }
      simPlaying = !simPlaying;
      this.textContent = simPlaying ? 'Pause' : 'Play';
    });
    document.getElementById('btn-speed').addEventListener('click', function () {
      simSpeed = simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : simSpeed === 5 ? 10 : 1;
      this.textContent = simSpeed + 'x';
    });
    document.getElementById('sim-scrub').addEventListener('input', function () {
      simMonth = parseFloat(this.value);
      simPlaying = false;
      simCpmCache = null;
      document.getElementById('btn-play').textContent = 'Play';
      renderContent();
    });
    document.getElementById('btn-reset-sim').addEventListener('click', function () {
      simMonth = 0;
      simPlaying = false;
      simCpmCache = null;
      ACE_Data.load();
      simCpmCache = ACE_Schedule.cpm();
      if (typeof ACE_Triage !== 'undefined') ACE_Triage.resetFired();
      if (typeof ACE_Narrative !== 'undefined') ACE_Narrative.clear();
      runMC(mcIterations);
      render();
    });
    document.getElementById('btn-new-atom').addEventListener('click', function () {
      creatingAtom = true;
      editingAtom = false;
      selectedAtom = null;
      renderContent();
    });
    document.getElementById('btn-save').addEventListener('click', doSave);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  }

  // -- Save / Load --

  function doSave() {
    if (typeof ACE_Storage !== 'undefined') {
      ACE_Storage.save();
      return;
    }
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
      { id: 'model', label: 'Model' },
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
        // Auto-close sidebar on mobile
        var sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('sidebar-open');
        var bd = document.getElementById('sidebar-backdrop');
        if (bd) bd.remove();
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
    if (view !== 'model' && typeof ACE_3D !== 'undefined') ACE_3D.stop();
    switch (view) {
      case 'plan': renderPlan(el); break;
      case 'forecast': renderForecast(el); break;
      case 'constraints': renderConstraints(el); break;
      case 'explore': renderExplore(el); break;
      case 'model': if (typeof ACE_3D !== 'undefined') renderModel(el); break;
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

    // S-Curve (Earned Value) chart
    html += '<div style="height:180px;margin:8px 0" id="scurve-wrap"><canvas id="scurve-cv"></canvas></div>';

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
    html += '<input type="text" id="wbs-search" class="filter-input" placeholder="Filter WBS..." value="' + escAttr(wbsFilter) + '" style="margin-bottom:8px;flex:none;width:100%">';
    html += '<div class="wbs-tree" id="wbs-tree">' + renderWBSTree('NDX', 0) + '</div>';
    html += '</div>';

    el.innerHTML = html;

    // Draw Gantt
    setTimeout(function () { drawPlanGantt(); }, 20);

    // Draw S-Curve
    setTimeout(function () { drawSCurve(); }, 30);

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

    var indent = depth * 20;
    var toggleIcon = hasChildren ? (collapsed ? '+' : '−') : '·';
    var barColor = pct >= 100 ? 'var(--green)' : pct > 0 ? 'var(--blue)' : 'var(--border)';

    var html = '<div class="tree-node" data-wbs="' + id + '" style="padding-left:' + indent + 'px">' +
      (depth > 0 ? '<span class="tree-indent-line" style="height:20px;display:inline-block;width:1px;margin-right:4px"></span>' : '') +
      '<span class="tree-icon" data-wbs-toggle="' + id + '">' + toggleIcon + '</span>' +
      '<span class="tree-id">' + id + '</span>' +
      '<span class="tree-name">' + a.name + '</span>' +
      '<span class="tree-bar-wrap"><span class="tree-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></span></span>' +
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
    var labelW = 140, padR = 16, padT = 28, padB = 28;
    var chartW = cw - labelW - padR;
    var rowH = Math.min(28, (ch - padT - padB) / phases.length);

    // Month grid
    c.strokeStyle = '#ede7d6';
    c.lineWidth = 0.5;
    c.font = '10px IBM Plex Mono, monospace';
    c.textAlign = 'center';
    c.fillStyle = '#9a9077';
    for (var m = 0; m <= maxFinish; m += 12) {
      var gx = labelW + (m / maxFinish) * chartW;
      c.beginPath();
      c.moveTo(gx, padT);
      c.lineTo(gx, padT + phases.length * rowH);
      c.stroke();
      c.fillText('M' + m, gx, padT + phases.length * rowH + 16);
      if (m > 0 && m % 12 === 0) {
        c.fillStyle = 'rgba(154,144,119,0.5)';
        c.font = '9px IBM Plex Mono, monospace';
        c.fillText('Y' + (m / 12), gx, padT - 4);
        c.fillStyle = '#9a9077';
        c.font = '10px IBM Plex Mono, monospace';
      }
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
      var barWidth = Math.max(x1 - x0, 2);

      var onCrit = cpm.criticalPath.indexOf(p.id) >= 0;
      var pct = ACE.percentComplete(p.id) / 100;
      var isComplete = pct >= 1.0;

      // Bar background with gradient fill
      if (onCrit) {
        var grad = c.createLinearGradient(x0, by, x0, by + bh);
        grad.addColorStop(0, 'rgba(168,64,31,0.25)');
        grad.addColorStop(1, 'rgba(168,64,31,0.12)');
        c.fillStyle = grad;
      } else {
        var grad2 = c.createLinearGradient(x0, by, x0, by + bh);
        grad2.addColorStop(0, 'rgba(44,93,120,0.2)');
        grad2.addColorStop(1, 'rgba(44,93,120,0.08)');
        c.fillStyle = grad2;
      }
      // Rounded rect for bar background
      roundRect(c, x0, by, barWidth, bh, 5);
      c.fill();

      // Progress fill with gradient
      if (pct > 0) {
        var progressW = barWidth * pct;
        if (onCrit) {
          var pGrad = c.createLinearGradient(x0, by, x0, by + bh);
          pGrad.addColorStop(0, '#c04e25');
          pGrad.addColorStop(1, '#a8401f');
          c.fillStyle = pGrad;
        } else {
          var pGrad2 = c.createLinearGradient(x0, by, x0, by + bh);
          pGrad2.addColorStop(0, '#3878a0');
          pGrad2.addColorStop(1, '#2c5d78');
          c.fillStyle = pGrad2;
        }
        // Clip to rounded rect
        c.save();
        roundRect(c, x0, by, barWidth, bh, 5);
        c.clip();
        c.fillRect(x0, by, progressW, bh);
        c.restore();
      }

      // Hatching pattern on completed bars
      if (isComplete) {
        c.save();
        roundRect(c, x0, by, barWidth, bh, 5);
        c.clip();
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 0.5;
        for (var hx = x0 - bh; hx < x0 + barWidth; hx += 6) {
          c.beginPath();
          c.moveTo(hx, by + bh);
          c.lineTo(hx + bh, by);
          c.stroke();
        }
        c.restore();
      }

      // Critical border
      if (onCrit) {
        c.strokeStyle = '#a8401f';
        c.lineWidth = 1.5;
        roundRect(c, x0, by, barWidth, bh, 5);
        c.stroke();
      }

      // Selected highlight
      if (selectedAtom === p.id) {
        c.strokeStyle = '#221c10';
        c.lineWidth = 2;
        roundRect(c, x0 - 1, by - 1, barWidth + 2, bh + 2, 4);
        c.stroke();
      }

      // Phase label INSIDE bar (white text) or outside (dark text)
      var label = p.name.length > 20 ? p.name.slice(0, 19) + '…' : p.name;
      c.font = '10px IBM Plex Mono, monospace';
      var labelMetrics = c.measureText(label);
      var labelFitsInBar = labelMetrics.width + 12 < barWidth && barWidth > 40;

      if (labelFitsInBar) {
        // Inside bar
        c.fillStyle = pct > 0.5 ? '#ffffff' : (onCrit ? '#5a2010' : '#1a3a52');
        c.textAlign = 'left';
        c.fillText(label, x0 + 6, by + bh * 0.72);
      } else {
        // Outside bar (to the left)
        c.fillStyle = (selectedAtom === p.id) ? '#a8401f' : '#544c3a';
        c.font = '11px IBM Plex Mono, monospace';
        c.textAlign = 'right';
        var shortLabel = p.name.length > 18 ? p.name.slice(0, 17) + '.' : p.name;
        c.fillText(shortLabel, labelW - 8, by + bh * 0.75);
        // Subtle connecting line from label to bar
        c.strokeStyle = 'rgba(154,144,119,0.3)';
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(labelW - 4, by + bh / 2);
        c.lineTo(x0, by + bh / 2);
        c.stroke();
      }

      // Checkmark on completed phases
      if (isComplete) {
        c.fillStyle = '#ffffff';
        c.font = 'bold 12px IBM Plex Mono, monospace';
        c.textAlign = 'right';
        c.fillText('✓', x1 - 6, by + bh * 0.75);
      }
    });

    // Milestones as diamonds
    milestones.forEach(function (ms) {
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
      c.fillText('Now (M' + currentMonth + ')', cmx, padT - 10);
      // Pulse glow on now line
      var pulseAlpha = 0.3 + 0.3 * Math.sin(performance.now() / 500);
      c.strokeStyle = 'rgba(177,61,44,' + pulseAlpha + ')';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(cmx, padT);
      c.lineTo(cmx, padT + phases.length * rowH);
      c.stroke();
    }

    // Sim month indicator line
    if (simMonth > 0 && simMonth <= maxFinish) {
      var smx = labelW + (simMonth / maxFinish) * chartW;
      c.strokeStyle = '#2f7d4f';
      c.lineWidth = 2.5;
      c.setLineDash([]);
      c.beginPath();
      c.moveTo(smx, padT - 6);
      c.lineTo(smx, padT + phases.length * rowH + 6);
      c.stroke();
      // Triangle marker at top
      c.fillStyle = '#2f7d4f';
      c.beginPath();
      c.moveTo(smx - 5, padT - 8);
      c.lineTo(smx + 5, padT - 8);
      c.lineTo(smx, padT - 2);
      c.closePath();
      c.fill();
      c.font = 'bold 10px IBM Plex Mono, monospace';
      c.textAlign = 'center';
      c.fillText('Sim M' + Math.round(simMonth), smx, padT - 12);
      var simPulse = 0.2 + 0.2 * Math.sin(performance.now() / 400);
      c.strokeStyle = 'rgba(47,125,79,' + simPulse + ')';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(smx, padT);
      c.lineTo(smx, padT + phases.length * rowH);
      c.stroke();
    }

    // Click handler
    cv.onclick = function (e) {
      var rect = cv.getBoundingClientRect();
      var mx2 = (e.clientX - rect.left);
      var my2 = (e.clientY - rect.top);
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

    // Hover tooltip
    cv.onmousemove = function (e) {
      var rect = cv.getBoundingClientRect();
      var mx3 = (e.clientX - rect.left);
      var my3 = (e.clientY - rect.top);
      var found = null;
      phases.forEach(function (p, i) {
        var start3 = cpm.starts[p.id] || 0;
        var finish3 = cpm.finishes[p.id] || 0;
        var y3 = padT + i * rowH;
        var x03 = labelW + (start3 / maxFinish) * chartW;
        var x13 = labelW + (finish3 / maxFinish) * chartW;
        if (mx3 >= x03 && mx3 <= x13 && my3 >= y3 && my3 <= y3 + rowH) {
          found = p;
        }
      });
      if (found) {
        showGanttTooltip(e.clientX, e.clientY, found, cpm);
        cv.style.cursor = 'pointer';
      } else {
        hideGanttTooltip();
        cv.style.cursor = 'default';
      }
    };
    cv.onmouseleave = function () { hideGanttTooltip(); };
  }

  // -- S-Curve (Earned Value Management) chart --

  function drawSCurve() {
    var cv = document.getElementById('scurve-cv');
    if (!cv) return;
    var wrap = document.getElementById('scurve-wrap');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = wrap ? wrap.clientWidth : cv.clientWidth;
    var ch = wrap ? wrap.clientHeight : cv.clientHeight;
    if (cw < 10 || ch < 10) return;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    cv.style.width = cw + 'px';
    cv.style.height = ch + 'px';
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);

    // Background
    c.fillStyle = '#faf7ee';
    c.fillRect(0, 0, cw, ch);

    var totalMonths = ACE_Data.PLANT.baselineMonths || 108;
    var pad = { l: 44, r: 60, t: 18, b: 28 };
    var pw = cw - pad.l - pad.r;
    var ph = ch - pad.t - pad.b;

    // Axes
    c.strokeStyle = '#9a9077';
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(pad.l, pad.t);
    c.lineTo(pad.l, pad.t + ph);
    c.lineTo(pad.l + pw, pad.t + ph);
    c.stroke();

    // X axis labels (months)
    c.font = '9px IBM Plex Mono, monospace';
    c.fillStyle = '#9a9077';
    c.textAlign = 'center';
    var step = totalMonths <= 60 ? 6 : 12;
    for (var m = 0; m <= totalMonths; m += step) {
      var gx = pad.l + (m / totalMonths) * pw;
      c.strokeStyle = '#ede7d6';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(gx, pad.t);
      c.lineTo(gx, pad.t + ph);
      c.stroke();
      c.fillStyle = '#9a9077';
      c.fillText('M' + m, gx, pad.t + ph + 14);
    }

    // Y axis labels (percent)
    c.textAlign = 'right';
    for (var p2 = 0; p2 <= 100; p2 += 25) {
      var gy = pad.t + ph - (p2 / 100) * ph;
      c.strokeStyle = '#ede7d6';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(pad.l, gy);
      c.lineTo(pad.l + pw, gy);
      c.stroke();
      c.fillStyle = '#9a9077';
      c.fillText(p2 + '%', pad.l - 6, gy + 3);
    }

    // -- BUDGET line (linear 0 to 100%) --
    c.strokeStyle = '#2c5d78';
    c.lineWidth = 1.5;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(pad.l, pad.t + ph);
    c.lineTo(pad.l + pw, pad.t);
    c.stroke();

    // -- PLANNED VALUE line (S-curve: 3t^2 - 2t^3, dashed gray) --
    c.strokeStyle = '#9a9077';
    c.lineWidth = 1.5;
    c.setLineDash([6, 4]);
    c.beginPath();
    var pvFirst = true;
    for (var mi = 0; mi <= totalMonths; mi++) {
      var t = mi / totalMonths;
      var pvPct = 100 * (3 * t * t - 2 * t * t * t);
      var px = pad.l + (mi / totalMonths) * pw;
      var py = pad.t + ph - (pvPct / 100) * ph;
      if (pvFirst) { c.moveTo(px, py); pvFirst = false; } else { c.lineTo(px, py); }
    }
    c.stroke();
    c.setLineDash([]);

    // -- EARNED VALUE line (solid green up to simMonth) --
    var summary = ACE.summary();
    var currentSim = Math.max(0, simMonth);
    if (currentSim > 0) {
      c.strokeStyle = '#2f7d4f';
      c.lineWidth = 2;
      c.setLineDash([]);
      c.beginPath();
      c.moveTo(pad.l, pad.t + ph);
      // Draw EV as a line from 0 to current earned value at simMonth
      // Use proportional progress: at simMonth, we have summary.percent earned
      var evPct = summary.percent;
      var evSteps = Math.max(1, Math.round(currentSim));
      for (var si = 0; si <= evSteps; si++) {
        var sFrac = si / evSteps;
        // Interpolate EV using an S-curve shape scaled to current progress
        var evVal = evPct * (3 * sFrac * sFrac - 2 * sFrac * sFrac * sFrac);
        var ex = pad.l + ((si / evSteps) * currentSim / totalMonths) * pw;
        var ey = pad.t + ph - (evVal / 100) * ph;
        if (si === 0) { c.moveTo(ex, ey); } else { c.lineTo(ex, ey); }
      }
      c.stroke();

      // Current simMonth vertical marker
      var smx = pad.l + (currentSim / totalMonths) * pw;
      c.strokeStyle = '#2f7d4f';
      c.lineWidth = 1.5;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(smx, pad.t);
      c.lineTo(smx, pad.t + ph);
      c.stroke();
      c.setLineDash([]);
    }

    // -- Line labels --
    c.font = '9px IBM Plex Mono, monospace';
    // Budget label (top-right end of line)
    c.fillStyle = '#2c5d78';
    c.textAlign = 'left';
    c.fillText('Budget', pad.l + pw + 4, pad.t + 4);
    // PV label (near end of S-curve)
    var pvEndT = 0.85;
    var pvEndPct = 100 * (3 * pvEndT * pvEndT - 2 * pvEndT * pvEndT * pvEndT);
    var pvLabelY = pad.t + ph - (pvEndPct / 100) * ph;
    c.fillStyle = '#9a9077';
    c.fillText('PV', pad.l + pw + 4, pvLabelY);
    // EV label
    if (currentSim > 0) {
      var evEndX = pad.l + (currentSim / totalMonths) * pw;
      var evEndY = pad.t + ph - (summary.percent / 100) * ph;
      c.fillStyle = '#2f7d4f';
      c.fillText('EV', evEndX + 4, evEndY - 4);
    }

    // -- SPI and CPI in top-right corner --
    var es = ACE_Schedule.earnedSchedule(Math.max(1, Math.round(currentSim)));
    var spiVal = isFinite(es.spi_t) ? es.spi_t : 1.0;
    var budgetPct = currentSim > 0 ? (currentSim / totalMonths) * 100 : 0;
    var cpiVal = budgetPct > 0 ? summary.percent / budgetPct : 1.0;

    c.font = 'bold 10px IBM Plex Mono, monospace';
    c.textAlign = 'right';
    var metricsX = pad.l + pw;
    var metricsY = pad.t + 14;

    c.fillStyle = currentSim < 1 ? '#9a9077' : spiVal >= 0.95 ? '#2f7d4f' : spiVal < 0.85 ? '#b13d2c' : '#9a9077';
    c.fillText('SPI: ' + (currentSim < 1 ? '--' : spiVal.toFixed(2)), metricsX, metricsY);

    c.fillStyle = cpiVal >= 0.95 ? '#2f7d4f' : cpiVal < 0.85 ? '#b13d2c' : '#9a9077';
    c.fillText('CPI: ' + cpiVal.toFixed(2), metricsX, metricsY + 14);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function showGanttTooltip(cx, cy, phase, cpmData) {
    if (!ganttTooltipEl) {
      ganttTooltipEl = document.createElement('div');
      ganttTooltipEl.className = 'gantt-tooltip';
      document.body.appendChild(ganttTooltipEl);
    }
    var pct = ACE.percentComplete(phase.id);
    var dur = ACE_Schedule.durations[phase.id];
    var onCrit = cpmData.criticalPath.indexOf(phase.id) >= 0;
    var tip = phase.name + '\n' +
      'M' + Math.round(cpmData.starts[phase.id] || 0) + ' - M' + Math.round(cpmData.finishes[phase.id] || 0);
    if (dur) tip += ' (' + dur.likely + ' mo)';
    tip += '\n' + pct + '% complete';
    if (onCrit) tip += ' [CRITICAL]';
    ganttTooltipEl.textContent = tip;
    ganttTooltipEl.style.display = 'block';
    ganttTooltipEl.style.left = (cx + 12) + 'px';
    ganttTooltipEl.style.top = (cy - 10) + 'px';
    ganttTooltipEl.style.whiteSpace = 'pre';
  }

  function hideGanttTooltip() {
    if (ganttTooltipEl) {
      ganttTooltipEl.style.display = 'none';
    }
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

    // EVM KPIs
    var esData = ACE_Schedule.earnedSchedule(Math.max(1, Math.round(simMonth)));
    var spiKpi = isFinite(esData.spi_t) ? esData.spi_t : 1.0;
    var spiCls = simMonth < 1 ? '' : spiKpi >= 0.95 ? 'kpi-good' : spiKpi < 0.85 ? 'kpi-bad' : '';
    html += kpiBox(simMonth < 1 ? '--' : spiKpi.toFixed(2), 'SPI', spiCls);

    var budgetVal = ACE_Data.PLANT.budget || 58e9;
    var budgetStr = '$' + Math.round(budgetVal / 1e9) + 'B';
    html += kpiBox(budgetStr, 'Budget', '');

    var eacVal = spiKpi > 0 ? budgetVal / spiKpi : budgetVal;
    var eacStr = '$' + Math.round(eacVal / 1e9) + 'B';
    html += kpiBox(eacStr, 'EAC', eacVal > budgetVal * 1.05 ? 'kpi-bad' : '');
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
      html += '<div class="empty-state">No workable atoms at this time.<div class="empty-state-hint">Clear constraints or complete prerequisites to unlock work.</div></div>';
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
    if (!a) return '<div class="empty-state">Atom not found: ' + escHtml(id) + '</div>';

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

    // Tags with colored pills
    if (a.tags.length) {
      html += '<div class="card-tags">';
      a.tags.forEach(function (t) { html += '<span class="pill ' + pillClass(t) + '">' + escHtml(t) + '</span>'; });
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
          '<span class="' + (r && r._complete ? 'atom-done' : 'atom-open') + '">' + (r && r._complete ? '✓' : '○') + '</span> ' +
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
          '<span class="' + (ch && ch._complete ? 'atom-done' : 'atom-open') + '">' + (ch && ch._complete ? '✓' : '○') + '</span> ' +
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
      html += '<button class="btn-card" id="btn-edit-atom">Edit</button>';
    }
    html += '<button class="btn-card" id="btn-add-req">+ Requires</button>';
    html += '<button class="btn-card" id="btn-add-child">+ Child</button>';
    if (a.kind === 'manual' && !a._complete) {
      html += '<button class="btn-card btn-apply" id="btn-clear-atom">Clear</button>';
    }
    html += '<button class="btn-card" id="btn-delete-atom" style="color:var(--red);border-color:var(--red)">Delete</button>';
    html += '</div>';

    return html;
  }

  function renderEditForm(a, dur) {
    var html = '<div class="card-edit">';
    html += '<div class="section-lbl" style="margin-bottom:8px">Edit Atom</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group" style="flex:1"><label class="field-lbl">Name</label><input type="text" class="filter-input" id="edit-name" value="' + escAttr(a.name) + '" style="width:100%"></div>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="field-lbl">Type</label><input type="text" class="filter-input" id="edit-type" value="' + escAttr(a.type) + '" style="width:90px"></div>';
    html += '<div class="form-group"><label class="field-lbl">Kind</label><select class="filter-select" id="edit-kind"><option value="manual"' + (a.kind === 'manual' ? ' selected' : '') + '>manual</option><option value="derived"' + (a.kind === 'derived' ? ' selected' : '') + '>derived</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label class="field-lbl">Tags</label><input type="text" class="filter-input" id="edit-tags" value="' + escAttr(a.tags.join(', ')) + '" style="width:100%"></div>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="field-lbl">Min (mo)</label><input type="number" class="filter-input" id="edit-dur-min" value="' + (dur ? dur.min : '') + '" style="width:70px" step="0.5" min="0"></div>';
    html += '<div class="form-group"><label class="field-lbl">Likely (mo)</label><input type="number" class="filter-input" id="edit-dur-likely" value="' + (dur ? dur.likely : '') + '" style="width:70px" step="0.5" min="0"></div>';
    html += '<div class="form-group"><label class="field-lbl">Max (mo)</label><input type="number" class="filter-input" id="edit-dur-max" value="' + (dur ? dur.max : '') + '" style="width:70px" step="0.5" min="0"></div>';
    html += '</div>';
    html += '<div class="form-actions">';
    html += '<button class="btn-card btn-apply" id="btn-save-edit">Save</button>';
    html += '<button class="btn-card" id="btn-cancel-edit">Cancel</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // -- Atom creation form --

  function renderCreateForm() {
    var html = '<div style="margin-bottom:8px"><span class="card-title">New Atom</span></div>';
    html += '<div class="card-edit">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="field-lbl">ID (required)</label><input type="text" class="filter-input" id="new-id" placeholder="e.g. PH-NEW" style="width:160px"></div>';
    html += '<div class="form-group" style="flex:1"><label class="field-lbl">Name</label><input type="text" class="filter-input" id="new-name" placeholder="Phase name" style="width:100%"></div>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="field-lbl">Type</label><input type="text" class="filter-input" id="new-type" value="phase" style="width:90px"></div>';
    html += '<div class="form-group"><label class="field-lbl">Kind</label><select class="filter-select" id="new-kind"><option value="derived">derived</option><option value="manual">manual</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label class="field-lbl">Tags</label><input type="text" class="filter-input" id="new-tags" placeholder="tag1, tag2" style="width:100%"></div>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="field-lbl">Min (mo)</label><input type="number" class="filter-input" id="new-dur-min" step="0.5" min="0" style="width:80px"></div>';
    html += '<div class="form-group"><label class="field-lbl">Likely (mo)</label><input type="number" class="filter-input" id="new-dur-likely" step="0.5" min="0" style="width:80px"></div>';
    html += '<div class="form-group"><label class="field-lbl">Max (mo)</label><input type="number" class="filter-input" id="new-dur-max" step="0.5" min="0" style="width:80px"></div>';
    html += '</div>';
    html += '<div id="create-validation" class="form-validation" style="display:none"></div>';
    html += '<div class="form-actions">';
    html += '<button class="btn-card btn-apply" id="btn-create-atom">Create</button>';
    html += '<button class="btn-card" id="btn-cancel-create">Cancel</button>';
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

    // Create atom with validation
    var createBtn = document.getElementById('btn-create-atom');
    if (createBtn) createBtn.addEventListener('click', function () {
      var id = (document.getElementById('new-id').value || '').trim();
      var name = (document.getElementById('new-name').value || '').trim() || id;
      var type = (document.getElementById('new-type').value || '').trim() || 'atom';
      var kind = document.getElementById('new-kind').value || 'derived';
      var tags = (document.getElementById('new-tags').value || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var valEl = document.getElementById('create-validation');

      // Validation
      if (!id) {
        if (valEl) { valEl.textContent = 'ID is required.'; valEl.style.display = 'block'; }
        return;
      }
      if (ACE.get(id)) {
        if (valEl) { valEl.textContent = 'Atom "' + id + '" already exists.'; valEl.style.display = 'block'; }
        return;
      }
      var dMin = parseFloat(document.getElementById('new-dur-min').value);
      var dLikely = parseFloat(document.getElementById('new-dur-likely').value);
      var dMax = parseFloat(document.getElementById('new-dur-max').value);
      var hasDur = !isNaN(dMin) || !isNaN(dLikely) || !isNaN(dMax);
      if (hasDur && (isNaN(dMin) || isNaN(dLikely) || isNaN(dMax))) {
        if (valEl) { valEl.textContent = 'Fill all three duration fields or leave all empty.'; valEl.style.display = 'block'; }
        return;
      }
      if (hasDur && (dMin > dLikely || dLikely > dMax)) {
        if (valEl) { valEl.textContent = 'Duration must satisfy min <= likely <= max.'; valEl.style.display = 'block'; }
        return;
      }

      try {
        ACE.create({ id: id, name: name, type: type, kind: kind, tags: tags });
        if (hasDur) {
          ACE_Schedule.setDuration(id, dMin, dLikely, dMax);
        }
        creatingAtom = false;
        selectedAtom = id;
        afterMutation();
      } catch (e) {
        if (valEl) { valEl.textContent = 'Error: ' + e.message; valEl.style.display = 'block'; }
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
      '<button class="btn-card btn-apply" id="btn-do-clear">Clear Atom</button>' +
      '<button class="btn-card" id="btn-cancel-clear">Cancel</button>' +
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
      '<div class="card-toolbar"><button class="btn-card" id="btn-cancel-link">Cancel</button></div>' +
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
          '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '✓' : '○') + '</span>' +
          '<span class="atom-id">' + a.id + '</span>' +
          '<span class="atom-name">' + escHtml(a.name) + '</span>' +
          '</div>';
      }).join('');
      if (results.length === 0) {
        rEl.innerHTML = '<div class="empty-state">No matching atoms found.</div>';
      }
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
    if (!mcResults) {
      el.innerHTML = '<div class="empty-state">No atoms loaded.<div class="empty-state-hint">Load a dataset to run Monte Carlo analysis.</div></div>';
      return;
    }

    var p = mcResults;
    var spread = p.p90.finish - p.p10.finish;
    var html = '';

    // Hero histogram
    html += '<div style="display:flex;gap:16px;flex-wrap:wrap">';
    html += '<div style="flex:2;min-width:300px">';
    html += '<div class="mc-header">Schedule Distribution</div>';
    html += '<div class="mc-canvas-wrap" style="height:220px"><canvas id="fc-hist-sched"></canvas></div>';

    // Legend
    html += '<div class="mc-legend">';
    html += '<div class="mc-legend-item"><span class="mc-legend-swatch" style="background:#2f7d4f"></span>Below P50</div>';
    html += '<div class="mc-legend-item"><span class="mc-legend-swatch" style="background:#a87718"></span>P50-P80</div>';
    html += '<div class="mc-legend-item"><span class="mc-legend-swatch" style="background:#b13d2c"></span>P80-P90</div>';
    html += '<div class="mc-legend-item"><span class="mc-legend-swatch" style="background:#6c3020"></span>Above P90</div>';
    html += '</div>';

    // Confidence summary
    html += '<div class="mc-stats" style="margin-top:4px;flex-wrap:wrap;gap:16px">';
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
    html += '<div style="display:flex;gap:6px;margin-top:12px;align-items:center;flex-wrap:wrap">';
    html += '<span class="field-lbl">Iterations:</span>';
    [100, 500, 1000, 5000].forEach(function (n) {
      html += '<button class="btn-card' + (mcIterations === n ? ' btn-apply' : '') + '" data-mc-n="' + n + '">' + n + '</button>';
    });
    html += '<button class="btn-card btn-apply" id="btn-run-mc">Run</button>';
    html += '</div>';

    // What-if buttons
    html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
    html += '<button class="btn-card" id="btn-whatif-delay">+3mo delay</button>';
    html += '<button class="btn-card" id="btn-whatif-addrisk">+risk</button>';
    html += '<button class="btn-card" id="btn-whatif-remrisk">−risk</button>';
    html += '<button class="btn-card" id="btn-whatif-reset">Reset</button>';
    html += '</div>';

    html += '</div>';

    // Right side: risk register
    html += '<div style="flex:1;min-width:220px">';
    html += '<div class="risk-header">Risk Register</div>';
    html += '<div class="risk-list">';
    var risks = ACE.query({ type: 'risk' }).sort(function (a, b) {
      return riskEV(b) - riskEV(a);
    });
    if (risks.length === 0) {
      html += '<div class="empty-state">No risks defined.</div>';
    }
    var maxEV = risks.length > 0 ? riskEV(risks[0]) : 1;
    risks.forEach(function (r) {
      var prob = riskProb(r);
      var impact = riskImpact(r);
      var ev = riskEV(r);
      var severity = ev > 2 ? 'risk-high' : ev > 1 ? 'risk-med' : 'risk-low';
      var fired = r.tags.indexOf('fired') >= 0;
      var barPct = maxEV > 0 ? Math.round(ev / maxEV * 100) : 0;
      var barColor = ev > 2 ? 'var(--red)' : ev > 1 ? 'var(--oxide)' : 'var(--green)';
      html += '<div class="risk-row ' + severity + '" data-select="' + r.id + '"' + (fired ? ' style="background:rgba(177,61,44,0.1)"' : '') + '>' +
        '<span class="risk-id">' + r.id + '</span>' +
        '<span class="risk-name">' + escHtml(r.name) + (fired ? ' [FIRED]' : '') + '</span>' +
        '<span class="risk-bar-wrap"><span class="risk-bar-fill" style="width:' + barPct + '%;background:' + barColor + '"></span></span>' +
        '<span class="risk-prob">' + Math.round(prob * 100) + '%</span>' +
        '<span class="risk-impact">+' + impact + 'mo</span>' +
        '<span class="risk-ev">EV=' + ev.toFixed(1) + '</span>' +
        '</div>';
    });
    html += '</div>';

    // Sensitivity table with bar chart
    html += '<div class="section-lbl" style="margin-top:8px">Risk Sensitivity (top by EV)</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px">';
    risks.slice(0, 6).forEach(function (r) {
      var evN = riskEV(r);
      var barPct2 = maxEV > 0 ? Math.round(evN / maxEV * 100) : 0;
      var barColor2 = evN > 2 ? 'var(--red)' : evN > 1 ? 'var(--oxide)' : 'var(--green)';
      html += '<div style="display:flex;gap:6px;padding:3px 0;align-items:center">' +
        '<span style="min-width:100px;color:var(--faint);font-size:10px">' + r.id + '</span>' +
        '<span style="flex:1;height:6px;background:var(--paper);border-radius:3px;overflow:hidden">' +
          '<span style="display:block;height:100%;width:' + barPct2 + '%;background:' + barColor2 + ';border-radius:3px"></span>' +
        '</span>' +
        '<span style="color:var(--faint);min-width:30px;text-align:right">' + evN.toFixed(1) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="section-lbl" style="margin-top:12px">Risk Matrix</div>';
    html += '<div style="height:200px"><canvas id="risk-heatmap"></canvas></div>';

    html += '</div>';
    html += '</div>';

    el.innerHTML = html;

    // Draw histogram
    setTimeout(function () { drawForecastHistogram('fc-hist-sched'); }, 20);
    setTimeout(function(){ drawRiskHeatmap(); }, 30);

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
    // Use 30-40 bins for smoother distribution
    var bins = Math.min(40, Math.max(30, Math.round(range * 1.2)));
    var counts = new Array(bins).fill(0);
    var maxCount = 0;

    results.forEach(function (r) {
      var idx = Math.min(bins - 1, Math.floor((r.finish - minF) / range * bins));
      counts[idx]++;
      if (counts[idx] > maxCount) maxCount = counts[idx];
    });

    var pad = { l: 44, r: 16, t: 18, b: 34 };
    var pw = cw - pad.l - pad.r;
    var ph = ch - pad.t - pad.b;

    // Background
    c.fillStyle = '#1a1a18';
    c.fillRect(0, 0, cw, ch);

    // Y axis line
    c.strokeStyle = '#333';
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(pad.l, pad.t);
    c.lineTo(pad.l, pad.t + ph);
    c.lineTo(pad.l + pw, pad.t + ph);
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

      if (h > 0) {
        // Rounded top corners on bars
        var barX = x + 1;
        var barW = bw - 2;
        var barY = pad.t + ph - h;
        var barR = Math.min(2, barW / 2);
        c.beginPath();
        c.moveTo(barX, pad.t + ph);
        c.lineTo(barX, barY + barR);
        c.arcTo(barX, barY, barX + barR, barY, barR);
        c.lineTo(barX + barW - barR, barY);
        c.arcTo(barX + barW, barY, barX + barW, barY + barR, barR);
        c.lineTo(barX + barW, pad.t + ph);
        c.closePath();
        c.fill();
      }
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
      c.fillText('' + yv, pad.l - 6, yy + 3);
      // Grid line
      if (yi > 0) {
        c.strokeStyle = 'rgba(100,100,80,0.15)';
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(pad.l, yy);
        c.lineTo(pad.l + pw, yy);
        c.stroke();
      }
    }

    // X axis title
    c.fillStyle = '#555';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'center';
    c.fillText('Project Duration (months)', pad.l + pw / 2, ch - 2);

    // Month labels along bottom
    c.fillStyle = '#555';
    c.textAlign = 'center';
    for (var m = Math.ceil(minF / 12) * 12; m <= maxF; m += 12) {
      var mx = pad.l + ((m - minF) / range) * pw;
      c.fillText('M' + m, mx, pad.t + ph + 28);
    }
  }

  function drawRiskHeatmap() {
    var cv = document.getElementById('risk-heatmap');
    if (!cv) return;
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

    var pad = { l: 44, r: 16, t: 16, b: 30 };
    var pw = cw - pad.l - pad.r;
    var ph = ch - pad.t - pad.b;
    var cols = 5;
    var rows = 5;
    var cellW = pw / cols;
    var cellH = ph / rows;

    // Background
    c.fillStyle = '#1a1a18';
    c.fillRect(0, 0, cw, ch);

    // Draw grid cells with risk-level colors
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        // row 0 = top = highest probability (5), col 0 = left = lowest impact (1)
        var pLevel = rows - row;   // 5 at top, 1 at bottom
        var iLevel = col + 1;     // 1 at left, 5 at right
        var score = pLevel * iLevel;
        var color;
        if (score >= 15) color = '#b13d2c';
        else if (score >= 8) color = '#a87718';
        else color = '#2f7d4f';

        var cx = pad.l + col * cellW;
        var cy = pad.t + row * cellH;
        c.fillStyle = color;
        c.globalAlpha = 0.35;
        c.fillRect(cx, cy, cellW, cellH);
        c.globalAlpha = 1.0;

        // Cell border
        c.strokeStyle = '#333';
        c.lineWidth = 0.5;
        c.strokeRect(cx, cy, cellW, cellH);
      }
    }

    // Y axis labels (probability)
    c.fillStyle = '#6a6050';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'right';
    var probLabels = ['20%', '40%', '60%', '80%', '100%'];
    for (var yi = 0; yi < rows; yi++) {
      var yCenter = pad.t + yi * cellH + cellH / 2;
      c.fillText(probLabels[rows - 1 - yi], pad.l - 4, yCenter + 3);
    }

    // X axis labels (impact)
    c.textAlign = 'center';
    var impactLabels = ['2', '4', '6', '8', '10'];
    for (var xi = 0; xi < cols; xi++) {
      var xCenter = pad.l + xi * cellW + cellW / 2;
      c.fillText(impactLabels[xi], xCenter, pad.t + ph + 14);
    }

    // Axis titles
    c.fillStyle = '#555';
    c.font = '9px IBM Plex Mono, monospace';
    c.textAlign = 'center';
    c.fillText('Impact →', pad.l + pw / 2, ch - 2);

    c.save();
    c.translate(10, pad.t + ph / 2);
    c.rotate(-Math.PI / 2);
    c.fillText('Probability →', 0, 0);
    c.restore();

    // Plot risk atoms
    var risks = ACE.query({ type: 'risk' });
    risks.forEach(function (r) {
      var prob = riskProb(r);
      var impact = riskImpact(r);
      if (prob <= 0 && impact <= 0) return;

      // Map impact (0-10) to column (0-4)
      var colIdx = Math.min(4, Math.max(0, Math.floor(impact / 2 - 0.001)));
      if (impact <= 0) colIdx = 0;
      // Map probability (0-1) to row; row 0 = top = high prob
      var rowIdx = Math.min(4, Math.max(0, Math.floor(prob * 5 - 0.001)));
      if (prob <= 0) rowIdx = 0;
      var drawRow = rows - 1 - rowIdx; // invert so high prob is at top

      var dotX = pad.l + colIdx * cellW + cellW / 2;
      var dotY = pad.t + drawRow * cellH + cellH / 2;

      // Determine dot color by score
      var pLevel = rowIdx + 1;
      var iLevel = colIdx + 1;
      var score = pLevel * iLevel;
      var dotColor;
      if (score >= 15) dotColor = '#b13d2c';
      else if (score >= 8) dotColor = '#a87718';
      else dotColor = '#2f7d4f';

      // Draw dot with bright ring
      c.beginPath();
      c.arc(dotX, dotY, 5, 0, Math.PI * 2);
      c.fillStyle = dotColor;
      c.globalAlpha = 0.9;
      c.fill();
      c.globalAlpha = 1.0;
      c.strokeStyle = '#e8dcc8';
      c.lineWidth = 1.2;
      c.stroke();
    });
  }

  // ================================================================
  // VIEW 3: CONSTRAINTS -- AWP workface management
  // ================================================================

  function renderConstraints(el) {
    var html = '';

    // Filter bar
    html += '<div class="filter-bar">';
    html += '<button class="btn-card' + (constraintFilter === 'all' ? ' btn-apply' : '') + '" data-cf="all">All</button>';
    html += '<button class="btn-card' + (constraintFilter === 'workable' ? ' btn-apply' : '') + '" data-cf="workable">Workable</button>';
    html += '<button class="btn-card' + (constraintFilter === 'blocked' ? ' btn-apply' : '') + '" data-cf="blocked">Blocked</button>';
    html += '</div>';

    html += '<div style="display:flex;gap:16px;flex-wrap:wrap">';

    // Main: IWP readiness dashboard
    html += '<div style="flex:2;min-width:300px">';
    html += '<div class="risk-header">IWP Readiness</div>';

    // Group IWPs by parent CWP
    var cwps = ACE.query({ type: 'cwp' });
    var anyIwps = false;
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
      anyIwps = true;

      var cwpPct = ACE.percentComplete(cwp.id);
      html += '<div style="margin-bottom:12px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:6px">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer" data-select="' + cwp.id + '">' +
        '<span style="font-family:Fraunces,serif;font-size:13px;font-weight:600">' + cwp.id + ' -- ' + escHtml(cwp.name) + '</span>' +
        '<span class="tree-bar-wrap" style="width:60px"><span class="tree-bar-fill" style="width:' + cwpPct + '%;background:' + (cwpPct >= 100 ? 'var(--green)' : 'var(--blue)') + '"></span></span>' +
        '<span style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint)">' + cwpPct + '%</span>' +
        '</div>';

      iwps.forEach(function (iwp) {
        var workable2 = isWorkable(iwp);
        var blockers = getBlockers(iwp);

        html += '<div class="atom-row" data-select="' + iwp.id + '">';
        if (iwp._complete) {
          html += '<span class="badge-done">✓ DONE</span>';
        } else if (workable2) {
          html += '<span class="badge-workable">WORKABLE</span>';
        } else {
          html += '<span class="badge-blocked">BLOCKED</span>';
        }
        html += '<span class="atom-id">' + iwp.id + '</span>';
        html += '<span class="atom-name">' + escHtml(iwp.name) + '</span>';
        if (blockers.length && !iwp._complete) {
          html += '<span style="font-size:10px;color:var(--faint)">blocked by </span>';
          blockers.forEach(function (bid, idx) {
            html += '<span class="blocker-link" data-select="' + bid + '">' + bid + '</span>';
            if (idx < blockers.length - 1) html += '<span style="color:var(--faint);font-size:10px">, </span>';
          });
        }
        html += '</div>';
      });
      html += '</div>';
    });

    if (!anyIwps) {
      html += '<div class="empty-state">No IWPs match the current filter.<div class="empty-state-hint">Try changing the filter above.</div></div>';
    }

    html += '</div>';

    // Right side: constraint atoms
    html += '<div style="flex:1;min-width:200px">';
    html += '<div class="risk-header">Constraints</div>';
    var constraints = ACE.query({ type: 'constraint' });
    if (constraints.length === 0) {
      html += '<div class="empty-state">No constraints defined.</div>';
    }
    html += '<div class="atom-list">';
    constraints.forEach(function (con) {
      html += '<div class="atom-row" data-select="' + con.id + '">' +
        '<span class="atom-status ' + (con._complete ? 'atom-done' : 'atom-open') + '">' + (con._complete ? '✓' : '○') + '</span>' +
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
      el2.addEventListener('click', function (e) {
        e.stopPropagation();
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
        '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '✓' : '○') + '</span>' +
        '<span class="atom-id">' + a.id + '</span>' +
        '<span class="atom-name">' + escHtml(a.name) + '</span>' +
        '<span class="atom-type">' + a.type + '</span>' +
        '</div>';
    });
    if (results.length === 0) {
      html += '<div class="empty-state">No results.<div class="empty-state-hint">Try a different search term or select a type filter.</div></div>';
    }
    html += '</div>';

    // Terminal
    html += '<div style="margin-top:16px">';
    html += '<div class="section-lbl" style="margin-bottom:4px">Terminal</div>';
    html += '<div class="terminal" id="term-out">' + renderTermLines() + '<span class="term-blink"></span></div>';
    html += '<div class="term-prompt"><span class="term-caret">ace ></span><input class="term-field" id="term-in" placeholder="type a command..." autofocus></div>';
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

  function renderTermLines() {
    return escHtml(termLines.join('\n'));
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
        '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '✓' : '○') + '</span>' +
        '<span class="atom-id">' + a.id + '</span>' +
        '<span class="atom-name">' + escHtml(a.name) + '</span>' +
        '<span class="atom-type">' + a.type + '</span>' +
        '</div>';
    }).join('');
    if (results.length === 0) {
      container.innerHTML = '<div class="empty-state">No results.<div class="empty-state-hint">Try a different search term or select a type filter.</div></div>';
    }
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
      // Re-render with blinking cursor
      out.innerHTML = renderTermLines() + '<span class="term-blink"></span>';
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
      termPrint('  blocked, critical, weather, flex, tour,');
      termPrint('  export json|csv, clear, help');
    }
    else if (verb === 'clear') {
      termLines.length = 0;
      var out = document.getElementById('term-out');
      if (out) out.innerHTML = '<span class="term-blink"></span>';
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
    else if (verb === 'blocked') {
      var blocked = ACE.all().filter(function(a) {
        if (a._complete || a.kind === 'derived') return false;
        return a.requires.some(function(rid) { var r = ACE.get(rid); return r && !r._complete; });
      });
      termPrint(blocked.length + ' blocked atoms:');
      blocked.slice(0, 20).forEach(function(a) {
        var blockers = a.requires.filter(function(rid) { var r = ACE.get(rid); return r && !r._complete; });
        termPrint('  ' + a.id + '  blocked by: ' + blockers.join(', '));
      });
      if (blocked.length > 20) termPrint('  ... +' + (blocked.length - 20) + ' more');
    }
    else if (verb === 'critical') {
      var cp = ACE_Schedule.cpm();
      termPrint('Critical path (' + cp.criticalPath.length + ' items):');
      cp.criticalPath.forEach(function(id) {
        var a = ACE.get(id);
        termPrint('  ' + id + '  M' + Math.round(cp.starts[id]) + '-M' + Math.round(cp.finishes[id]) + '  ' + (a ? a.name : ''));
      });
      termPrint('Project finish: M' + Math.round(cp.projectFinish));
    }
    else if (verb === 'weather') {
      if (typeof ACE_Weather !== 'undefined') {
        var w = ACE_Weather.getData();
        if (w) termPrint('Tiverton ON: ' + Math.round(w.temperature) + '°C, wind ' + Math.round(w.windspeed) + 'km/h');
        else termPrint('Weather data unavailable');
      } else termPrint('Weather module not loaded');
    }
    else if (verb === 'flex') {
      if (typeof ACE_FLEX !== 'undefined') {
        var pkgs = ACE_FLEX.getPackages();
        termPrint('FLEX packages:');
        pkgs.forEach(function(p) { termPrint('  ' + p.id + '  ' + p.name + '  [' + p.status.toUpperCase() + ']  crew:' + p.crew + '  est:' + p.est); });
      } else termPrint('FLEX module not loaded');
    }
    else if (verb === 'tour') {
      if (typeof ACE_Tour !== 'undefined') { ACE_Tour.start(); termPrint('Tour started'); }
      else termPrint('Tour not available');
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

    // Tags with colored pills
    if (a.tags.length) {
      html += '<div class="card-tags">';
      a.tags.forEach(function (t) { html += '<span class="pill ' + pillClass(t) + '">' + escHtml(t) + '</span>'; });
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
          '<span class="' + (r && r._complete ? 'atom-done' : 'atom-open') + '">' + (r && r._complete ? '✓' : '○') + '</span> ' +
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
          '<span class="' + (ch && ch._complete ? 'atom-done' : 'atom-open') + '">' + (ch && ch._complete ? '✓' : '○') + '</span> ' +
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
    html += '<div class="card-section" style="margin-top:8px"><button class="btn-card" id="btn-ov-source">Source</button></div>';
    var src = JSON.stringify({ id: a.id, name: a.name, type: a.type, kind: a.kind, tags: a.tags, requires: a.requires, contains: a.contains, complete: a._complete }, null, 2);
    html += '<pre class="card-source" id="ov-source" style="display:none">' + escHtml(src) + '</pre>';

    // Actions
    html += '<div class="card-toolbar">';
    if (a.kind === 'manual' && !a._complete) {
      html += '<button class="btn-card btn-apply" id="btn-ov-clear">Clear</button>';
    }
    html += '<button class="btn-card" id="btn-ov-goto-plan">View in Plan</button>';
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
    var html = '<div class="overlay" id="search-overlay"><div class="card" style="max-width:440px">' +
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
      if (results.length === 0 && searchQuery.trim()) {
        rEl.innerHTML = '<div class="empty-state">No matching atoms.</div>';
      } else if (results.length === 0) {
        rEl.innerHTML = '<div class="empty-state" style="padding:16px">Type to search atoms by ID or name.</div>';
      } else {
        rEl.innerHTML = results.map(function (a) {
          return '<div class="atom-row" data-search-go="' + a.id + '">' +
            '<span class="atom-status ' + (a._complete ? 'atom-done' : 'atom-open') + '">' + (a._complete ? '✓' : '○') + '</span>' +
            '<span class="atom-id">' + a.id + '</span>' +
            '<span class="atom-name">' + escHtml(a.name) + '</span>' +
            '<span class="atom-type">' + a.type + '</span>' +
            '</div>';
        }).join('');
      }
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
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') {
        e.target.blur();
        closeSearch();
        dismissOverlays();
      }
      return;
    }

    if (e.key === 'Escape') {
      closeSearch();
      if (!dismissOverlays() && selectedAtom) {
        selectedAtom = null;
        editingAtom = false;
        renderContent();
      }
      return;
    }

    if (e.key === '/') { e.preventDefault(); searchOpen = true; renderSearchOverlay(); }
    if (e.key === '?') { e.preventDefault(); showShortcuts(); }
    // Presentation arrow keys override sim controls
    if (typeof ACE_3D !== 'undefined' && ACE_3D.isPresenting() && view === 'model') {
      if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); ACE_3D.nextSlide(); showSlide(); return; }
      if (e.code === 'ArrowLeft') { e.preventDefault(); ACE_3D.prevSlide(); showSlide(); return; }
      if (e.key === 'Escape') { e.preventDefault(); ACE_3D.togglePresent(); document.getElementById('present-overlay').style.display='none'; document.getElementById('btn-present').textContent='Present'; return; }
    }
    if (e.code === 'Space') {
      e.preventDefault();
      simPlaying = !simPlaying;
      var pb = document.getElementById('btn-play');
      if (pb) pb.textContent = simPlaying ? 'Pause' : 'Play';
    }
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      simMonth = Math.max(0, simMonth - (e.shiftKey ? 6 : 1));
      simPlaying = false;
      var pb2 = document.getElementById('btn-play');
      if (pb2) pb2.textContent = 'Play';
      renderContent();
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      simMonth = Math.min(maxMonth(), simMonth + (e.shiftKey ? 6 : 1));
      simPlaying = false;
      var pb3 = document.getElementById('btn-play');
      if (pb3) pb3.textContent = 'Play';
      renderContent();
    }
    if (e.key === '0') { view = 'model'; render(); }
    if (e.key === '1') { view = 'plan'; render(); }
    if (e.key === '2') { view = 'forecast'; render(); }
    if (e.key === '3') { view = 'constraints'; render(); }
    if (e.key === '4') { view = 'explore'; render(); }
    if (e.key === 'p' && !e.ctrlKey && !e.metaKey && view === 'model' && typeof ACE_3D !== 'undefined') {
      var on = ACE_3D.togglePresent();
      var overlay = document.getElementById('present-overlay');
      if (overlay) { overlay.style.display = on ? 'block' : 'none'; }
      var pb4 = document.getElementById('btn-present');
      if (pb4) pb4.textContent = on ? 'Exit' : 'Present';
      if (on) showSlide();
    }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      simMonth = 0; simPlaying = false; simCpmCache = null;
      ACE_Data.load(); simCpmCache = ACE_Schedule.cpm();
      if (typeof ACE_Triage !== 'undefined') ACE_Triage.resetFired();
      if (typeof ACE_Narrative !== 'undefined') ACE_Narrative.clear();
      runMC(mcIterations); render();
    }
  }

  function dismissOverlays() {
    var ids = ['atom-overlay', 'clear-overlay', 'link-overlay', 'shortcuts-overlay'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) { el.remove(); return true; }
    }
    return false;
  }

  function showShortcuts() {
    if (document.getElementById('shortcuts-overlay')) return;
    var shortcuts = [
      ['Space', 'Play / Pause simulation'],
      ['Arrow Left', 'Step back 1 month (Shift: 6)'],
      ['Arrow Right', 'Step forward 1 month (Shift: 6)'],
      ['/', 'Search atoms'],
      ['?', 'Show this help'],
      ['1-4', 'Switch views (Plan / Forecast / Constraints / Explore)'],
      ['R', 'Reset simulation'],
      ['Escape', 'Close overlay / deselect']
    ];
    var html = '<div class="overlay" id="shortcuts-overlay"><div class="card" style="max-width:420px">' +
      '<div class="card-header"><div class="card-title">Keyboard Shortcuts</div>' +
      '<button class="card-close" onclick="document.getElementById(\'shortcuts-overlay\').remove()">[x]</button></div>' +
      '<table style="width:100%;font-size:13px">';
    shortcuts.forEach(function (s) {
      html += '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:8px 12px;font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--oxide);font-weight:500;width:120px">' + s[0] + '</td>' +
        '<td style="padding:8px 12px">' + s[1] + '</td></tr>';
    });
    html += '</table></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
    document.getElementById('shortcuts-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'shortcuts-overlay') e.target.remove();
    });
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

  // ================================================================
  // VIEW 5: MODEL -- 3D Construction + Presentation
  // ================================================================

  function renderModel(el) {
    var html = '<div id="model-wrap" style="position:relative;width:100%;height:calc(100vh - 120px);min-height:400px;background:#1a1d21;border-radius:6px;overflow:hidden">';
    html += '<canvas id="model-cv" style="width:100%;height:100%;display:block"></canvas>';

    // Camera toolbar
    html += '<div id="model-toolbar" style="position:absolute;top:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap;z-index:10">';
    var cams = ACE_3D.CAMS;
    for (var k in cams) {
      html += '<button class="btn-ctrl model-cam-btn" data-cam="' + k + '">' + cams[k].label + '</button>';
    }
    html += '<span style="border-left:1px solid rgba(154,144,119,.5);margin:0 2px"></span>';
    html += '<button class="btn-ctrl" id="btn-present">Present</button>';
    html += '</div>';

    // Stats overlay
    html += '<div id="model-stats" style="position:absolute;bottom:12px;left:12px;font-family:IBM Plex Mono,monospace;font-size:11px;color:rgba(242,236,223,.7);z-index:10;pointer-events:none">';
    var s = ACE.summary();
    html += ACE_Data.PLANT.name + '<br>';
    html += s.percent + '% complete &middot; M' + Math.round(simMonth) + '/' + maxMonth() + '<br>';
    html += s.atoms + ' atoms &middot; ' + s.workable + ' workable';
    html += '</div>';

    // Present overlay (hidden by default)
    html += '<div id="present-overlay" style="display:none;position:absolute;inset:0;z-index:20;pointer-events:none">';
    html += '<div id="present-card" style="position:absolute;bottom:24px;left:24px;right:24px;max-width:560px;background:rgba(34,28,16,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(213,206,188,.2);border-radius:12px;padding:24px 28px;pointer-events:auto;color:#f2ecdf">';
    html += '<div id="present-title" style="font-family:Fraunces,serif;font-size:28px;font-weight:700;margin-bottom:4px;color:#f2ecdf"></div>';
    html += '<div id="present-sub" style="font-family:IBM Plex Mono,monospace;font-size:12px;color:#a8401f;margin-bottom:12px"></div>';
    html += '<div id="present-body" style="font-size:14px;line-height:1.7;color:rgba(242,236,223,.85);white-space:pre-wrap"></div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(213,206,188,.15)">';
    html += '<span id="present-count" style="font-family:IBM Plex Mono,monospace;font-size:10px;color:rgba(154,144,119,.7)"></span>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn-ctrl" id="btn-prev-slide" style="color:#f2ecdf;border-color:rgba(213,206,188,.3)">Prev</button>';
    html += '<button class="btn-ctrl" id="btn-next-slide" style="background:#a8401f;color:#f2ecdf;border-color:#a8401f">Next</button>';
    html += '</div></div></div></div>';

    html += '</div>';
    el.innerHTML = html;

    // Start 3D
    var cvs = document.getElementById('model-cv');
    ACE_3D.stop();
    setTimeout(function () { ACE_3D.start(cvs); }, 50);

    // Camera buttons
    el.querySelectorAll('[data-cam]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ACE_3D.setCamera(btn.dataset.cam);
        el.querySelectorAll('.model-cam-btn').forEach(function (b) { b.style.background = ''; b.style.color = ''; });
        btn.style.background = 'rgba(242,236,223,.15)';
      });
    });

    // Present button
    document.getElementById('btn-present').addEventListener('click', function () {
      var on = ACE_3D.togglePresent();
      var overlay = document.getElementById('present-overlay');
      overlay.style.display = on ? 'block' : 'none';
      this.textContent = on ? 'Exit' : 'Present';
      if (on) showSlide();
    });

    // Slide navigation
    document.getElementById('btn-next-slide').addEventListener('click', function () {
      ACE_3D.nextSlide();
      showSlide();
    });
    document.getElementById('btn-prev-slide').addEventListener('click', function () {
      ACE_3D.prevSlide();
      showSlide();
    });
  }

  function showSlide() {
    var slide = ACE_3D.getSlide();
    if (!slide) return;
    document.getElementById('present-title').textContent = slide.title;
    document.getElementById('present-sub').textContent = slide.sub;
    document.getElementById('present-body').textContent = slide.body;
    document.getElementById('present-count').textContent = (ACE_3D.getSlideIdx() + 1) + ' / ' + ACE_3D.getSlideCount();

    // Animate camera based on slide
    var camMap = ['orbit', 'orbit', 'reactor', 'aerial', 'orbit', 'ground', 'crane', 'turbine', 'orbit'];
    if (camMap[ACE_3D.getSlideIdx()]) ACE_3D.setCamera(camMap[ACE_3D.getSlideIdx()]);
  }

  // -- Public API --
  function getSimMonth() { return simMonth; }
  return { init: init, getSimMonth: getSimMonth };

})();

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACE_UI;
}
