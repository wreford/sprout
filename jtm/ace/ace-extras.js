/**
 * ACE Extras — Missing ACE 1 features for ACE 2
 *
 * FieldIQ, Weather, Triage, FLEX, Narrative, Export, GIS Map, Storage
 *
 * Depends on ACE (ace-core.js), ACE_Schedule (ace-schedule.js),
 * ACE_Data (ace-data.js), ACE_UI (ace-ui.js).
 */

// ================================================================
// 1. FieldIQ — Camera capture to atoms
// ================================================================

const ACE_FieldIQ = (function () {
  'use strict';

  var captures = [];
  var stream = null;
  var videoEl = null;
  var canvasEl = null;
  var gpsPos = null;

  function start(videoElement, canvasElement) {
    videoEl = videoElement;
    canvasEl = canvasElement;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('Camera not available'));
    }
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(function (s) {
      stream = s;
      if (videoEl) {
        videoEl.srcObject = s;
        videoEl.play();
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
          gpsPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }, function () { gpsPos = null; });
      }
      return s;
    });
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
  }

  function capture() {
    if (!videoEl || !canvasEl) return null;
    canvasEl.width = videoEl.videoWidth || 640;
    canvasEl.height = videoEl.videoHeight || 480;
    var ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0);
    var dataUrl = canvasEl.toDataURL('image/jpeg', 0.7);
    var cap = {
      id: 'FIQ-' + Date.now(),
      timestamp: new Date().toISOString(),
      image: dataUrl,
      gps: gpsPos ? { lat: gpsPos.lat, lng: gpsPos.lng } : null,
      title: '',
      type: 'field-capture'
    };
    captures.push(cap);
    return cap;
  }

  function save(captureObj, type, title) {
    captureObj.title = title || 'Field Capture';
    captureObj.type = type || 'field-capture';
    var atomId = captureObj.id;
    try {
      ACE.create({
        id: atomId,
        name: captureObj.title,
        type: 'field-capture',
        kind: 'manual',
        tags: ['fieldiq', type || 'observation']
      });
      ACE.link('NDX', 'contains', atomId);
      ACE.complete(atomId, 'Photo captured: ' + captureObj.timestamp);
      ACE.settle();
      ACE_Narrative.record(atomId, 'fieldiq-capture', 'Photo captured at ' + (captureObj.gps ? captureObj.gps.lat.toFixed(4) + ', ' + captureObj.gps.lng.toFixed(4) : 'unknown location'), false);
    } catch (e) { /* atom may already exist */ }
    return captureObj;
  }

  function getCaptures() { return captures.slice(); }

  return {
    captures: captures,
    start: start,
    stop: stop,
    capture: capture,
    save: save,
    getCaptures: getCaptures
  };
})();


// ================================================================
// 2. Live Weather
// ================================================================

const ACE_Weather = (function () {
  'use strict';

  var data = null;
  var interval = null;
  var TIVERTON_LAT = 44.32;
  var TIVERTON_LNG = -81.56;

  function fetch() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + TIVERTON_LAT +
      '&longitude=' + TIVERTON_LNG + '&current_weather=true';
    return window.fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        data = json.current_weather || null;
        updateDisplay();
        return data;
      })
      .catch(function () { data = null; });
  }

  function updateDisplay() {
    var el = document.getElementById('weather-display');
    if (!el) return;
    if (!data) {
      el.textContent = 'Weather: --';
      return;
    }
    var wmoDesc = wmoCode(data.weathercode);
    el.textContent = Math.round(data.temperature) + '°C ' + wmoDesc + ' ' + Math.round(data.windspeed) + 'km/h';
  }

  function wmoCode(code) {
    var map = {
      0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Light Snow', 73: 'Snow',
      75: 'Heavy Snow', 77: 'Snow Grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
      85: 'Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorm', 96: 'Thunderstorm+Hail', 99: 'Thunderstorm+Hail'
    };
    return map[code] || ('WMO ' + code);
  }

  function startPolling(intervalMs) {
    stopPolling();
    fetch();
    interval = setInterval(fetch, intervalMs || 600000);
  }

  function stopPolling() {
    if (interval) { clearInterval(interval); interval = null; }
  }

  function getData() { return data; }

  return {
    data: data,
    fetch: fetch,
    getData: getData,
    startPolling: startPolling,
    stopPolling: stopPolling,
    updateDisplay: updateDisplay
  };
})();


// ================================================================
// 3. Triage System
// ================================================================

const ACE_Triage = (function () {
  'use strict';

  var events = [
    {
      id: 'TR-001', month: 30, title: 'Piping/Cable Interference',
      location: 'RB Elev +12m', description: 'Piping run conflicts with cable tray at elevation +12m in reactor building.',
      optA: { label: 'Reroute piping (+2wk, $120K)', cost: '$120K', schedule: '+2 weeks', safety: 'Low' },
      optB: { label: 'Escalate to engineering (+1wk)', cost: '$50K', schedule: '+1 week', safety: 'Low' }
    },
    {
      id: 'TR-002', month: 18, title: 'Concrete Batch Plant Failure',
      location: 'Site Batch Plant', description: 'Primary batch plant has mixer bearing failure. Backup plant is 45km away.',
      optA: { label: 'Repair on-site (+3d, $80K)', cost: '$80K', schedule: '+3 days', safety: 'Low' },
      optB: { label: 'Use backup plant (+1wk, $200K)', cost: '$200K', schedule: '+1 week', safety: 'Low' }
    },
    {
      id: 'TR-003', month: 42, title: 'Weld Inspection NDE Failure',
      location: 'PHT Loop 2', description: 'Radiographic inspection reveals 3 of 12 Class 1 welds require rework.',
      optA: { label: 'Full re-weld and re-inspect (+4wk, $350K)', cost: '$350K', schedule: '+4 weeks', safety: 'Medium' },
      optB: { label: 'Engineering disposition (+2wk, $150K)', cost: '$150K', schedule: '+2 weeks', safety: 'Low' }
    },
    {
      id: 'TR-004', month: 55, title: 'DCS Software Anomaly',
      location: 'Main Control Room', description: 'Safety shutdown system logic test reveals timing discrepancy in shutdown sequence.',
      optA: { label: 'Vendor patch + full retest (+3wk, $250K)', cost: '$250K', schedule: '+3 weeks', safety: 'High' },
      optB: { label: 'Analog backup workaround (+1wk, $90K)', cost: '$90K', schedule: '+1 week', safety: 'Medium' }
    },
    {
      id: 'TR-005', month: 36, title: 'Heavy Lift Crane Wind Delay',
      location: 'Turbine Building', description: 'Sustained winds >40km/h forecast for 5 days during planned generator set.',
      optA: { label: 'Wait for weather window (+1wk, $60K)', cost: '$60K', schedule: '+1 week', safety: 'Low' },
      optB: { label: 'Night lifts during calm periods (+3d, $180K)', cost: '$180K', schedule: '+3 days', safety: 'Medium' }
    },
    {
      id: 'TR-006', month: 25, title: 'Excavation Bedrock Encounter',
      location: 'CT Foundation', description: 'Unexpected granite formation at -8m, 2m above expected depth.',
      optA: { label: 'Controlled blasting (+2wk, $400K)', cost: '$400K', schedule: '+2 weeks', safety: 'Medium' },
      optB: { label: 'Redesign foundation (+4wk, $200K)', cost: '$200K', schedule: '+4 weeks', safety: 'Low' }
    },
    {
      id: 'TR-007', month: 48, title: 'Steam Generator Delivery Delay',
      location: 'Port of Hamilton', description: 'Vessel carrying SG-3 and SG-4 delayed by 3 weeks due to canal blockage.',
      optA: { label: 'Accept delay, resequence (+3wk, $0)', cost: '$0', schedule: '+3 weeks', safety: 'Low' },
      optB: { label: 'Air freight critical components (+1wk, $800K)', cost: '$800K', schedule: '+1 week', safety: 'Low' }
    },
    {
      id: 'TR-008', month: 65, title: 'Hydrostatic Test Leak',
      location: 'RB PHT System', description: 'Small leak detected at feedwater connection during hydrostatic test at 1.5x design pressure.',
      optA: { label: 'Cut and re-weld joint (+2wk, $180K)', cost: '$180K', schedule: '+2 weeks', safety: 'High' },
      optB: { label: 'Torque and re-test gasket (+3d, $20K)', cost: '$20K', schedule: '+3 days', safety: 'Medium' }
    }
  ];

  var fired = {};
  var resolved = {};

  function check(month) {
    var triggered = [];
    events.forEach(function (ev) {
      if (ev.month <= month && !fired[ev.id]) {
        fired[ev.id] = true;
        triggered.push(ev);
      }
    });
    return triggered;
  }

  function show(id) {
    var ev = events.find(function (e) { return e.id === id; });
    if (!ev) return;

    var html = '<div class="overlay" id="triage-overlay"><div class="card" style="max-width:600px">' +
      '<div class="card-header"><div class="card-title">TRIAGE: ' + escH(ev.title) + '</div>' +
      '<button class="card-close" id="btn-close-triage">[x]</button></div>' +
      '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:8px">' +
      ev.id + ' | Month ' + ev.month + ' | ' + escH(ev.location) + '</div>' +
      '<div class="card-evidence" style="margin-bottom:12px">' + escH(ev.description) + '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px">' +
      '<tr style="border-bottom:1px solid var(--border)">' +
      '<th style="text-align:left;padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint)"></th>' +
      '<th style="text-align:left;padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--blue)">Option A</th>' +
      '<th style="text-align:left;padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--oxide)">Option B</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px;font-weight:500">Action</td>' +
      '<td style="padding:6px">' + escH(ev.optA.label) + '</td><td style="padding:6px">' + escH(ev.optB.label) + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px;font-weight:500">Cost</td>' +
      '<td style="padding:6px">' + ev.optA.cost + '</td><td style="padding:6px">' + ev.optB.cost + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px;font-weight:500">Schedule</td>' +
      '<td style="padding:6px">' + ev.optA.schedule + '</td><td style="padding:6px">' + ev.optB.schedule + '</td></tr>' +
      '<tr><td style="padding:6px;font-weight:500">Safety Risk</td>' +
      '<td style="padding:6px">' + ev.optA.safety + '</td><td style="padding:6px">' + ev.optB.safety + '</td></tr>' +
      '</table>' +
      '<div class="card-section"><span class="section-lbl">Decision Narrative (required)</span>' +
      '<textarea class="edit-textarea" id="triage-narrative" placeholder="Explain your reasoning..." style="height:70px"></textarea></div>' +
      '<div class="card-toolbar">' +
      '<button class="btn-card btn-apply" id="btn-triage-a">Choose A</button>' +
      '<button class="btn-card" id="btn-triage-b" style="border-color:var(--oxide);color:var(--oxide)">Choose B</button>' +
      '</div></div></div>';

    var existing = document.getElementById('triage-overlay');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);

    document.getElementById('btn-close-triage').addEventListener('click', function () {
      document.getElementById('triage-overlay').remove();
    });
    document.getElementById('triage-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'triage-overlay') document.getElementById('triage-overlay').remove();
    });
    document.getElementById('btn-triage-a').addEventListener('click', function () {
      var narr = document.getElementById('triage-narrative').value;
      if (!narr.trim()) { alert('Narrative is required for triage decisions.'); return; }
      resolve(ev.id, 'A', narr);
      document.getElementById('triage-overlay').remove();
    });
    document.getElementById('btn-triage-b').addEventListener('click', function () {
      var narr = document.getElementById('triage-narrative').value;
      if (!narr.trim()) { alert('Narrative is required for triage decisions.'); return; }
      resolve(ev.id, 'B', narr);
      document.getElementById('triage-overlay').remove();
    });
  }

  function resolve(id, choice, narrative) {
    var ev = events.find(function (e) { return e.id === id; });
    if (!ev) return;
    resolved[id] = { choice: choice, narrative: narrative, timestamp: new Date().toISOString() };
    ACE_Narrative.record(id, 'triage-decision', 'Triage ' + id + ': chose Option ' + choice + '. ' + narrative, true);

    // Re-run Monte Carlo after triage decision
    try {
      ACE.settle();
      if (typeof ACE_Schedule.monteCarlo === 'function') {
        ACE_Schedule.monteCarlo(1000);
      }
    } catch (e) { /* best effort */ }
  }

  function getEvents() { return events.slice(); }
  function getResolved() { return Object.assign({}, resolved); }
  function getFired() { return Object.assign({}, fired); }

  function resetFired() {
    for (var k in fired) delete fired[k];
    for (var k2 in resolved) delete resolved[k2];
  }

  return {
    events: events,
    fired: fired,
    resolved: resolved,
    check: check,
    show: show,
    resolve: resolve,
    getEvents: getEvents,
    getResolved: getResolved,
    getFired: getFired,
    resetFired: resetFired
  };
})();


// ================================================================
// 4. FLEX Packages
// ================================================================

const ACE_FLEX = (function () {
  'use strict';

  var packages = [
    { id: 'FLEX-001', name: 'Cable tray labelling', est: '5d', crew: 2, value: 8, tags: ['electrical'], status: 'available' },
    { id: 'FLEX-002', name: 'Pipe support painting', est: '3d', crew: 3, value: 6, tags: ['mechanical'], status: 'available' },
    { id: 'FLEX-003', name: 'Floor drain installation', est: '4d', crew: 2, value: 7, tags: ['civil'], status: 'available' },
    { id: 'FLEX-004', name: 'Signage and wayfinding', est: '2d', crew: 1, value: 4, tags: ['general'], status: 'available' },
    { id: 'FLEX-005', name: 'Cable pulling - non-safety', est: '6d', crew: 4, value: 9, tags: ['electrical'], status: 'available' },
    { id: 'FLEX-006', name: 'Insulation prep work', est: '4d', crew: 3, value: 7, tags: ['mechanical'], status: 'available' },
    { id: 'FLEX-007', name: 'Embedded plate grouting', est: '3d', crew: 2, value: 6, tags: ['civil'], status: 'available' },
    { id: 'FLEX-008', name: 'Equipment grounding jumpers', est: '2d', crew: 2, value: 5, tags: ['electrical'], status: 'available' },
    { id: 'FLEX-009', name: 'Area cleanup and housekeeping', est: '1d', crew: 4, value: 3, tags: ['general'], status: 'available' },
    { id: 'FLEX-010', name: 'Temporary lighting upgrade', est: '2d', crew: 2, value: 5, tags: ['electrical'], status: 'available' },
    { id: 'FLEX-011', name: 'Hanger installation - Phase 2', est: '5d', crew: 3, value: 8, tags: ['mechanical'], status: 'available' }
  ];

  function getAvailable() {
    return packages.filter(function (p) { return p.status === 'available'; });
  }

  function assign(id) {
    var pkg = packages.find(function (p) { return p.id === id; });
    if (pkg) {
      pkg.status = 'assigned';
      ACE_Narrative.record(id, 'flex-assigned', 'FLEX package "' + pkg.name + '" assigned to crew', false);
    }
    return pkg;
  }

  function complete(id) {
    var pkg = packages.find(function (p) { return p.id === id; });
    if (pkg) {
      pkg.status = 'complete';
      ACE_Narrative.record(id, 'flex-complete', 'FLEX package "' + pkg.name + '" completed', false);
    }
    return pkg;
  }

  function getPackages() { return packages.slice(); }

  return {
    packages: packages,
    getAvailable: getAvailable,
    assign: assign,
    complete: complete,
    getPackages: getPackages
  };
})();


// ================================================================
// 5. Narrative System
// ================================================================

const ACE_Narrative = (function () {
  'use strict';

  var log = [];

  function record(atomId, action, text, required) {
    log.push({
      timestamp: new Date().toISOString(),
      month: ACE_Extras._currentMonth || 0,
      atom: atomId,
      action: action,
      text: text,
      required: !!required
    });
  }

  function getForAtom(id) {
    return log.filter(function (e) { return e.atom === id; });
  }

  function getAll() { return log.slice(); }

  function clear() { log.length = 0; }

  return {
    log: log,
    record: record,
    getForAtom: getForAtom,
    getAll: getAll,
    clear: clear
  };
})();


// ================================================================
// 6. Exports (PDF + P6 + CSV + JSON)
// ================================================================

const ACE_Export = (function () {
  'use strict';

  function csv() {
    var csvStr = 'id,name,type,kind,complete,requires,contains,tags\n';
    ACE.all().forEach(function (a) {
      csvStr += a.id + ',"' + a.name.replace(/"/g, '""') + '",' + a.type + ',' + a.kind + ',' +
        (a._complete ? 'Y' : 'N') + ',"' + a.requires.join(';') + '","' + a.contains.join(';') + '","' + a.tags.join(';') + '"\n';
    });
    download(csvStr, 'ace-export.csv', 'text/csv');
  }

  function json() {
    var data = {
      project: ACE_Data.PLANT,
      atoms: ACE.exportJSON(),
      narrative: ACE_Narrative.getAll(),
      triage: ACE_Triage.getResolved(),
      timestamp: new Date().toISOString()
    };
    download(JSON.stringify(data, null, 2), 'ace-export.json', 'application/json');
  }

  function pdf() {
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      alert('jsPDF not loaded. PDF export unavailable.');
      return;
    }
    var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    var doc = new jsPDF();
    var s = ACE.summary();
    var cpmData = ACE_Schedule.cpm();
    var y = 20;

    doc.setFontSize(18);
    doc.text('ACE Project Report', 14, y); y += 10;
    doc.setFontSize(10);
    doc.text(ACE_Data.PLANT.name, 14, y); y += 6;
    doc.text('Generated: ' + new Date().toISOString().slice(0, 10), 14, y); y += 10;

    doc.setFontSize(12);
    doc.text('Summary', 14, y); y += 7;
    doc.setFontSize(10);
    doc.text('Total Atoms: ' + s.atoms, 14, y); y += 5;
    doc.text('Complete: ' + s.complete + ' (' + s.percent + '%)', 14, y); y += 5;
    doc.text('Workable: ' + s.workable, 14, y); y += 5;
    doc.text('CPM Finish: M' + Math.round(cpmData.projectFinish), 14, y); y += 5;
    doc.text('Critical Path Items: ' + cpmData.criticalPath.length, 14, y); y += 10;

    doc.setFontSize(12);
    doc.text('Phases', 14, y); y += 7;
    doc.setFontSize(9);
    ACE.query({ type: 'phase' }).forEach(function (p) {
      if (y > 270) { doc.addPage(); y = 20; }
      var pct = ACE.percentComplete(p.id);
      doc.text(p.id + ' - ' + p.name + ' (' + pct + '%)', 14, y);
      y += 5;
    });

    y += 5;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text('Narrative Log', 14, y); y += 7;
    doc.setFontSize(9);
    ACE_Narrative.getAll().forEach(function (entry) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text('[' + entry.timestamp.slice(0, 16) + '] ' + entry.action + ': ' + entry.text.slice(0, 80), 14, y);
      y += 4;
    });

    doc.save('ace-report.pdf');
  }

  function p6() {
    // Generate a simplified XER format for Primavera P6 import
    var lines = [];
    var cpmData = ACE_Schedule.cpm();
    var startDate = new Date(ACE_Data.PLANT.startDate);

    lines.push('ERMHDR\t12.0');
    lines.push('%T\tTASK');
    lines.push('%F\ttask_id\ttask_code\ttask_name\torig_dur\trem_dur\tearly_start_date\tearly_end_date');

    ACE.query({ type: 'phase' }).forEach(function (p) {
      var es = cpmData.starts[p.id] || 0;
      var ef = cpmData.finishes[p.id] || 0;
      var dur = ACE_Schedule.getDuration(p.id);
      var earlyStart = new Date(startDate);
      earlyStart.setMonth(earlyStart.getMonth() + Math.round(es));
      var earlyEnd = new Date(startDate);
      earlyEnd.setMonth(earlyEnd.getMonth() + Math.round(ef));
      var pct = ACE.percentComplete(p.id) / 100;
      var remDur = Math.round(dur * (1 - pct));
      lines.push('%R\t' + p.id + '\t' + p.id + '\t' + p.name + '\t' +
        Math.round(dur * 22) + '\t' + (remDur * 22) + '\t' +
        formatXerDate(earlyStart) + '\t' + formatXerDate(earlyEnd));
    });

    lines.push('%T\tTASKPRED');
    lines.push('%F\ttask_id\tpred_task_id\tpred_type');
    ACE.query({ type: 'phase' }).forEach(function (p) {
      p.requires.forEach(function (rid) {
        var r = ACE.get(rid);
        if (r && r.type === 'phase') {
          lines.push('%R\t' + p.id + '\t' + rid + '\tPR_FS');
        }
      });
    });

    lines.push('%E');
    download(lines.join('\n'), 'ace-schedule.xer', 'text/plain');
  }

  function formatXerDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function download(content, filename, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return {
    csv: csv,
    json: json,
    pdf: pdf,
    p6: p6
  };
})();


// ================================================================
// 7. GIS Map
// ================================================================

const ACE_Map = (function () {
  'use strict';

  var map = null;
  var markers = [];

  // NDX site buildings (Tiverton ON area)
  var buildings = [
    { id: 'RB', name: 'Reactor Building', lat: 44.3265, lng: -81.5983, color: '#a8401f' },
    { id: 'TB', name: 'Turbine Building', lat: 44.3260, lng: -81.5970, color: '#2c5d78' },
    { id: 'CT-1', name: 'Cooling Tower 1', lat: 44.3275, lng: -81.5960, color: '#6b4c9a' },
    { id: 'CT-2', name: 'Cooling Tower 2', lat: 44.3275, lng: -81.5945, color: '#6b4c9a' },
    { id: 'AB', name: 'Auxiliary Building', lat: 44.3258, lng: -81.5990, color: '#b8860b' },
    { id: 'SB', name: 'Service Building', lat: 44.3250, lng: -81.5975, color: '#2f7d4f' },
    { id: 'WH', name: 'Warehouse', lat: 44.3245, lng: -81.5960, color: '#9a9077' },
    { id: 'MCR', name: 'Main Control Room', lat: 44.3262, lng: -81.5985, color: '#b13d2c' }
  ];

  function init(el) {
    if (!window.L) {
      el.innerHTML = '<div class="empty-state" style="padding:40px">Leaflet not loaded. Map unavailable.</div>';
      return null;
    }
    map = L.map(el).setView([44.3260, -81.5970], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OSM',
      maxZoom: 19
    }).addTo(map);
    addBuildings();
    return map;
  }

  function addBuildings() {
    if (!map) return;
    buildings.forEach(function (b) {
      var marker = L.circleMarker([b.lat, b.lng], {
        radius: 10, fillColor: b.color, color: '#221c10', weight: 2,
        fillOpacity: 0.8
      }).addTo(map);
      marker.bindPopup('<b>' + b.id + '</b><br>' + b.name);
      markers.push(marker);
    });
  }

  function addCaptures() {
    if (!map) return;
    ACE_FieldIQ.getCaptures().forEach(function (cap) {
      if (cap.gps) {
        var marker = L.circleMarker([cap.gps.lat, cap.gps.lng], {
          radius: 6, fillColor: '#4ade80', color: '#221c10', weight: 1,
          fillOpacity: 0.9
        }).addTo(map);
        marker.bindPopup('<b>' + escH(cap.title || cap.id) + '</b><br>' + cap.timestamp);
        markers.push(marker);
      }
    });
  }

  function refresh() {
    if (map) {
      map.invalidateSize();
      addCaptures();
    }
  }

  function destroy() {
    if (map) { map.remove(); map = null; }
    markers = [];
  }

  return {
    init: init,
    addBuildings: addBuildings,
    addCaptures: addCaptures,
    refresh: refresh,
    destroy: destroy,
    buildings: buildings
  };
})();


// ================================================================
// 8. Save/Load (localStorage) - Enhanced
// ================================================================

const ACE_Storage = (function () {
  'use strict';

  var SAVE_KEY = 'ace-full-save';

  function save() {
    var data = {
      atoms: ACE.exportJSON(),
      durations: {},
      narrative: ACE_Narrative.getAll(),
      triage: { fired: ACE_Triage.getFired(), resolved: ACE_Triage.getResolved() },
      flex: ACE_FLEX.getPackages(),
      fieldiq: ACE_FieldIQ.getCaptures().map(function (c) {
        return { id: c.id, timestamp: c.timestamp, gps: c.gps, title: c.title, type: c.type };
      }),
      timestamp: new Date().toISOString()
    };
    ACE.all().forEach(function (a) {
      var d = ACE_Schedule.durations[a.id];
      if (d) data.durations[a.id] = d;
    });
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      alert('Save failed: ' + e.message);
      return false;
    }
  }

  function load() {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      ACE.importJSON(data.atoms || []);
      if (data.durations) {
        for (var id in data.durations) {
          var d = data.durations[id];
          ACE_Schedule.setDuration(id, d.min, d.likely, d.max);
        }
      }
      ACE.settle();
      return true;
    } catch (e) {
      alert('Load failed: ' + e.message);
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('ace-save');
    localStorage.removeItem('ace-atoms');
    localStorage.removeItem('ace-durations');
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  return {
    save: save,
    load: load,
    clear: clear,
    hasSave: hasSave
  };
})();


// ================================================================
// ACE_Extras — Orchestrator + View Renderers
// ================================================================

const ACE_Extras = (function () {
  'use strict';

  var _currentMonth = 0;

  function init() {
    ACE_Weather.startPolling(600000);
    _patchTopbar();
    _patchSidebar();
  }

  // Inject weather display and export buttons into topbar
  function _patchTopbar() {
    var topbar = document.getElementById('topbar');
    if (!topbar) return;

    // Weather display
    var weatherEl = document.createElement('span');
    weatherEl.id = 'weather-display';
    weatherEl.style.cssText = 'font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint);margin-left:8px';
    weatherEl.textContent = 'Weather: loading...';
    var topLeft = topbar.querySelector('.topbar-left');
    if (topLeft) topLeft.appendChild(weatherEl);

    // Export buttons
    var controls = topbar.querySelector('.topbar-controls');
    if (controls) {
      var exportGroup = document.createElement('div');
      exportGroup.className = 'topbar-group';
      exportGroup.innerHTML =
        '<button class="btn-ctrl" id="btn-pdf-export">PDF</button>' +
        '<button class="btn-ctrl" id="btn-p6-export">P6</button>';
      // Insert before the percentage display
      var pctEl = controls.querySelector('.topbar-pct');
      if (pctEl) {
        controls.insertBefore(exportGroup, pctEl);
      } else {
        controls.appendChild(exportGroup);
      }

      document.getElementById('btn-pdf-export').addEventListener('click', function () { ACE_Export.pdf(); });
      document.getElementById('btn-p6-export').addEventListener('click', function () { ACE_Export.p6(); });
    }
  }

  // Add new views to sidebar
  function _patchSidebar() {
    // Override renderSidebar to include new tabs
    // We do this by observing DOM mutations on the sidebar
    var observer = new MutationObserver(function () {
      var sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      var tabs = sidebar.querySelector('.sidebar-tabs');
      if (!tabs) return;
      // Check if extras tabs already added
      if (tabs.querySelector('[data-view="triage"]')) return;

      var extraTabs = [
        { id: 'triage', label: 'Triage' },
        { id: 'flex', label: 'FLEX' },
        { id: 'narrative', label: 'Narrative' },
        { id: 'fieldiq', label: 'FieldIQ' },
        { id: 'map', label: 'Map' }
      ];

      extraTabs.forEach(function (t) {
        var btn = document.createElement('button');
        btn.className = 'sidebar-tab';
        btn.dataset.view = t.id;
        btn.textContent = t.label;
        btn.addEventListener('click', function () {
          // Deactivate all tabs
          tabs.querySelectorAll('.sidebar-tab').forEach(function (tb) { tb.classList.remove('active'); });
          btn.classList.add('active');
          ACE_Extras.renderView(t.id);
        });
        tabs.appendChild(btn);
      });
    });
    observer.observe(document.getElementById('sidebar') || document.body, { childList: true, subtree: true });
  }

  // Render an extras view into #content
  function renderView(viewId) {
    var el = document.getElementById('content');
    if (!el) return;
    switch (viewId) {
      case 'triage': renderTriageView(el); break;
      case 'flex': renderFLEXView(el); break;
      case 'narrative': renderNarrativeView(el); break;
      case 'fieldiq': renderFieldIQView(el); break;
      case 'map': renderMapView(el); break;
    }
  }

  // ── Triage View ──
  function renderTriageView(el) {
    var html = '<div class="risk-header">Triage Events</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:12px">' +
      'Construction decision points that require superintendent judgment.</div>';

    var events = ACE_Triage.getEvents();
    var resolved = ACE_Triage.getResolved();

    events.forEach(function (ev) {
      var isResolved = !!resolved[ev.id];
      var cls = isResolved ? 'risk-low' : 'risk-high';
      html += '<div class="risk-row ' + cls + '" data-triage="' + ev.id + '" style="cursor:pointer">';
      html += '<span class="risk-id">' + ev.id + '</span>';
      html += '<span class="risk-name">' + escH(ev.title) + '</span>';
      html += '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">M' + ev.month + '</span>';
      html += '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">' + escH(ev.location) + '</span>';
      if (isResolved) {
        html += '<span class="badge-done">Option ' + resolved[ev.id].choice + '</span>';
      } else {
        html += '<span class="badge-blocked">PENDING</span>';
      }
      html += '</div>';
    });

    el.innerHTML = html;

    el.querySelectorAll('[data-triage]').forEach(function (row) {
      row.addEventListener('click', function () {
        ACE_Triage.show(row.dataset.triage);
      });
    });
  }

  // ── FLEX View ──
  function renderFLEXView(el) {
    var html = '<div class="risk-header">FLEX Packages</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:12px">' +
      'Available work for idle crews when critical IWPs are blocked.</div>';

    var packages = ACE_FLEX.getPackages();

    html += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="border-bottom:2px solid var(--border)">' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">ID</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Name</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Est</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Crew</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Value</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Tags</th>' +
      '<th style="text-align:left;padding:8px;font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">Status</th>' +
      '<th style="padding:8px"></th></tr>';

    packages.forEach(function (pkg) {
      var statusColor = pkg.status === 'complete' ? 'var(--green)' : pkg.status === 'assigned' ? 'var(--blue)' : 'var(--faint)';
      html += '<tr style="border-bottom:1px solid var(--border)">';
      html += '<td style="padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--blue)">' + pkg.id + '</td>';
      html += '<td style="padding:6px">' + escH(pkg.name) + '</td>';
      html += '<td style="padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px">' + pkg.est + '</td>';
      html += '<td style="padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px">' + pkg.crew + '</td>';
      html += '<td style="padding:6px;font-family:IBM Plex Mono,monospace;font-size:11px">';
      for (var v = 0; v < 10; v++) {
        html += '<span style="color:' + (v < pkg.value ? 'var(--oxide)' : 'var(--border)') + '">|</span>';
      }
      html += '</td>';
      html += '<td style="padding:6px">';
      pkg.tags.forEach(function (t) { html += '<span class="pill" style="font-size:9px">' + t + '</span> '; });
      html += '</td>';
      html += '<td style="padding:6px;font-family:IBM Plex Mono,monospace;font-size:10px;color:' + statusColor + '">' + pkg.status.toUpperCase() + '</td>';
      html += '<td style="padding:6px">';
      if (pkg.status === 'available') {
        html += '<button class="btn-card" data-flex-assign="' + pkg.id + '" style="font-size:10px;padding:3px 8px">Assign</button>';
      } else if (pkg.status === 'assigned') {
        html += '<button class="btn-card btn-apply" data-flex-complete="' + pkg.id + '" style="font-size:10px;padding:3px 8px">Done</button>';
      }
      html += '</td>';
      html += '</tr>';
    });
    html += '</table>';

    el.innerHTML = html;

    el.querySelectorAll('[data-flex-assign]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ACE_FLEX.assign(btn.dataset.flexAssign);
        renderFLEXView(el);
      });
    });
    el.querySelectorAll('[data-flex-complete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ACE_FLEX.complete(btn.dataset.flexComplete);
        renderFLEXView(el);
      });
    });
  }

  // ── Narrative View ──
  function renderNarrativeView(el) {
    var html = '<div class="risk-header">Decision Audit Trail</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:12px">' +
      'All recorded decisions, triage resolutions, and observations.</div>';

    var entries = ACE_Narrative.getAll().slice().reverse();

    if (entries.length === 0) {
      html += '<div class="empty-state">No narrative entries yet.<div class="empty-state-hint">Entries are created when triage decisions are made, FLEX packages are assigned, or FieldIQ captures are saved.</div></div>';
    } else {
      html += '<div class="atom-list">';
      entries.forEach(function (entry) {
        var actionColor = entry.action.indexOf('triage') >= 0 ? 'var(--red)' :
          entry.action.indexOf('flex') >= 0 ? 'var(--blue)' :
          entry.action.indexOf('fieldiq') >= 0 ? 'var(--green)' : 'var(--faint)';
        html += '<div style="padding:8px;border-bottom:1px solid var(--border)">';
        html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">';
        html += '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">' + entry.timestamp.slice(0, 16) + '</span>';
        html += '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:' + actionColor + '">' + entry.action + '</span>';
        html += '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--blue)">' + entry.atom + '</span>';
        if (entry.required) html += '<span class="pill pill-risk" style="font-size:9px">required</span>';
        html += '</div>';
        html += '<div style="font-size:13px">' + escH(entry.text) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;
  }

  // ── FieldIQ View ──
  function renderFieldIQView(el) {
    var html = '<div class="risk-header">FieldIQ -- Camera Capture</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:12px">' +
      'Capture site photos and create atoms from field observations.</div>';

    html += '<div style="display:flex;gap:16px;flex-wrap:wrap">';

    // Camera panel
    html += '<div style="flex:1;min-width:280px">';
    html += '<div style="background:var(--term-bg);border-radius:8px;overflow:hidden;margin-bottom:12px">';
    html += '<video id="fiq-video" style="width:100%;display:block;max-height:300px;background:#000" autoplay playsinline></video>';
    html += '<canvas id="fiq-canvas" style="display:none"></canvas>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
    html += '<button class="btn-card" id="btn-fiq-start">Start Camera</button>';
    html += '<button class="btn-card btn-apply" id="btn-fiq-capture">Capture</button>';
    html += '<button class="btn-card" id="btn-fiq-stop">Stop</button>';
    html += '</div>';
    html += '<div style="margin-bottom:12px">';
    html += '<div class="form-row">';
    html += '<div class="form-group" style="flex:1"><label class="field-lbl">Title</label><input type="text" class="filter-input" id="fiq-title" placeholder="Capture title" style="width:100%"></div>';
    html += '<div class="form-group"><label class="field-lbl">Type</label><select class="filter-select" id="fiq-type">' +
      '<option value="observation">Observation</option>' +
      '<option value="deficiency">Deficiency</option>' +
      '<option value="progress">Progress</option>' +
      '<option value="safety">Safety</option></select></div>';
    html += '</div>';
    html += '<button class="btn-card btn-apply" id="btn-fiq-save" style="margin-top:6px">Save as Atom</button>';
    html += '</div>';
    html += '</div>';

    // Captures list
    html += '<div style="flex:1;min-width:240px">';
    html += '<div class="section-lbl" style="margin-bottom:8px">Captures (' + ACE_FieldIQ.getCaptures().length + ')</div>';
    var caps = ACE_FieldIQ.getCaptures().slice().reverse();
    if (caps.length === 0) {
      html += '<div class="empty-state">No captures yet.<div class="empty-state-hint">Start the camera and capture site conditions.</div></div>';
    } else {
      caps.forEach(function (cap) {
        html += '<div style="display:flex;gap:8px;padding:8px;border-bottom:1px solid var(--border);align-items:center">';
        if (cap.image) {
          html += '<img src="' + cap.image + '" style="width:60px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0">';
        }
        html += '<div style="flex:1">';
        html += '<div style="font-size:12px;font-weight:500">' + escH(cap.title || cap.id) + '</div>';
        html += '<div style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--faint)">' + cap.timestamp.slice(0, 16) + '</div>';
        if (cap.gps) {
          html += '<div style="font-family:IBM Plex Mono,monospace;font-size:10px;color:var(--green)">' + cap.gps.lat.toFixed(4) + ', ' + cap.gps.lng.toFixed(4) + '</div>';
        }
        html += '</div></div>';
      });
    }
    html += '</div>';

    html += '</div>';

    el.innerHTML = html;

    // Wire buttons
    var lastCapture = null;
    document.getElementById('btn-fiq-start').addEventListener('click', function () {
      var video = document.getElementById('fiq-video');
      var canvas = document.getElementById('fiq-canvas');
      ACE_FieldIQ.start(video, canvas).catch(function (err) {
        alert('Camera access denied or unavailable: ' + err.message);
      });
    });
    document.getElementById('btn-fiq-capture').addEventListener('click', function () {
      lastCapture = ACE_FieldIQ.capture();
      if (lastCapture) {
        renderFieldIQView(el);
      }
    });
    document.getElementById('btn-fiq-stop').addEventListener('click', function () {
      ACE_FieldIQ.stop();
    });
    document.getElementById('btn-fiq-save').addEventListener('click', function () {
      var caps2 = ACE_FieldIQ.getCaptures();
      var toSave = lastCapture || (caps2.length > 0 ? caps2[caps2.length - 1] : null);
      if (!toSave) { alert('Capture a photo first.'); return; }
      var title = document.getElementById('fiq-title').value || 'Field Capture';
      var type = document.getElementById('fiq-type').value;
      ACE_FieldIQ.save(toSave, type, title);
      renderFieldIQView(el);
    });
  }

  // ── Map View ──
  function renderMapView(el) {
    var html = '<div class="risk-header">GIS Site Map</div>';
    html += '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint);margin-bottom:12px">' +
      'NDX Nuclear Generating Station -- Tiverton, Ontario</div>';
    html += '<div id="ace-map" style="width:100%;height:calc(100vh - 160px);min-height:400px;border-radius:8px;border:1px solid var(--border)"></div>';

    // Legend
    html += '<div style="display:flex;gap:12px;padding:8px 0;flex-wrap:wrap;font-family:IBM Plex Mono,monospace;font-size:10px">';
    ACE_Map.buildings.forEach(function (b) {
      html += '<div style="display:flex;align-items:center;gap:4px">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + b.color + ';display:inline-block"></span>' +
        b.id + ' ' + b.name + '</div>';
    });
    html += '</div>';

    el.innerHTML = html;

    setTimeout(function () {
      ACE_Map.destroy();
      ACE_Map.init(document.getElementById('ace-map'));
    }, 50);
  }

  // HTML escape helper (local to extras)
  function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    _currentMonth: _currentMonth,
    init: init,
    renderView: renderView
  };
})();

// Shorthand for use in triage overlay
function escH(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
