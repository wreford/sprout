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
  var layers = {};
  var userPins = JSON.parse(localStorage.getItem('ace-map-pins') || '[]');
  var measuring = false;
  var measurePoints = [];
  var measureLine = null;

  var buildings = [
    { id: 'RB', name: 'Reactor Building', lat: 44.3265, lng: -81.5983, color: '#a8401f', phase: 'PH-REACT', radius: 18, type: 'nuclear' },
    { id: 'TB', name: 'Turbine Building', lat: 44.3260, lng: -81.5970, color: '#2c5d78', phase: 'PH-MECH', radius: 16, type: 'mechanical' },
    { id: 'CT-1', name: 'Cooling Tower 1', lat: 44.3275, lng: -81.5960, color: '#6b4c9a', phase: 'PH-AUX', radius: 14, type: 'cooling' },
    { id: 'CT-2', name: 'Cooling Tower 2', lat: 44.3275, lng: -81.5945, color: '#6b4c9a', phase: 'PH-AUX', radius: 14, type: 'cooling' },
    { id: 'AB', name: 'Auxiliary Building', lat: 44.3258, lng: -81.5990, color: '#b8860b', phase: 'PH-AUX', radius: 10, type: 'auxiliary' },
    { id: 'SB', name: 'Service Building', lat: 44.3250, lng: -81.5975, color: '#2f7d4f', phase: 'PH-SITE', radius: 8, type: 'service' },
    { id: 'WH', name: 'Warehouse', lat: 44.3245, lng: -81.5960, color: '#9a9077', phase: 'PH-SITE', radius: 8, type: 'logistics' },
    { id: 'MCR', name: 'Main Control Room', lat: 44.3262, lng: -81.5985, color: '#b13d2c', phase: 'PH-INST', radius: 10, type: 'controls' },
    { id: 'PIPE', name: 'Pipe Fabrication Shop', lat: 44.3248, lng: -81.5948, color: '#2c5d78', phase: 'PH-PIPE', radius: 8, type: 'mechanical' },
    { id: 'ELEC', name: 'Electrical Substation', lat: 44.3270, lng: -81.5935, color: '#b8860b', phase: 'PH-ELEC', radius: 10, type: 'electrical' },
    { id: 'BATCH', name: 'Concrete Batch Plant', lat: 44.3240, lng: -81.5940, color: '#9a9077', phase: 'PH-CIVIL', radius: 8, type: 'civil' },
    { id: 'LAY', name: 'Laydown Area', lat: 44.3235, lng: -81.5970, color: '#544c3a', phase: 'PH-SITE', radius: 12, type: 'logistics' }
  ];

  var sitePerimeter = [
    [44.3280, -81.6005], [44.3280, -81.5920], [44.3230, -81.5920], [44.3230, -81.6005]
  ];

  var constructionZones = [
    { name: 'Nuclear Island', bounds: [[44.3270, -81.5995], [44.3255, -81.5965]], color: '#a8401f', cwas: ['CWA-01'] },
    { name: 'Turbine Island', bounds: [[44.3268, -81.5980], [44.3252, -81.5955]], color: '#2c5d78', cwas: ['CWA-02'] },
    { name: 'Cooling Water', bounds: [[44.3280, -81.5965], [44.3268, -81.5935]], color: '#6b4c9a', cwas: [] },
    { name: 'Support Area', bounds: [[44.3255, -81.5995], [44.3230, -81.5935]], color: '#9a9077', cwas: ['CWA-03'] }
  ];

  function init(el) {
    if (!window.L) {
      el.innerHTML = '<div class="empty-state" style="padding:40px">Leaflet not loaded.</div>';
      return null;
    }
    map = L.map(el, { zoomControl: false }).setView([44.3258, -81.5965], 16);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OSM', maxZoom: 19
    }).addTo(map);

    addPerimeter();
    addZones();
    addBuildings();
    addConstraintPins();
    addUserPins();
    addCaptures();

    map.on('click', onMapClick);
    return map;
  }

  function addPerimeter() {
    if (!map) return;
    layers.perimeter = L.polygon(sitePerimeter, {
      color: '#a8401f', weight: 2, dashArray: '8,4', fillColor: '#a8401f', fillOpacity: 0.03
    }).addTo(map);
    layers.perimeter.bindPopup('<b>NDX Site Boundary</b><br>~500m × 800m exclusion zone');
  }

  function addZones() {
    if (!map) return;
    layers.zones = L.layerGroup().addTo(map);
    constructionZones.forEach(function (z) {
      var rect = L.rectangle(z.bounds, {
        color: z.color, weight: 1.5, dashArray: '4,4', fillColor: z.color, fillOpacity: 0.06
      });
      var pctText = '';
      if (z.cwas.length && typeof ACE !== 'undefined') {
        z.cwas.forEach(function (cid) {
          var pct = ACE.percentComplete(cid);
          pctText += '<br>' + cid + ': ' + pct + '%';
        });
      }
      rect.bindPopup('<b>' + z.name + '</b>' + pctText);
      layers.zones.addLayer(rect);
    });
  }

  function buildingPopup(b) {
    var pct = 0;
    if (typeof ACE !== 'undefined' && b.phase) pct = ACE.percentComplete(b.phase);
    var phaseAtom = typeof ACE !== 'undefined' ? ACE.get(b.phase) : null;
    var html = '<div style="min-width:180px">';
    html += '<div style="font-weight:700;font-size:14px;margin-bottom:4px">' + b.id + ' — ' + b.name + '</div>';
    html += '<div style="font-size:11px;color:#666;margin-bottom:6px">' + (b.type || '') + '</div>';
    if (phaseAtom) {
      html += '<div style="font-size:12px;margin-bottom:4px">Phase: ' + phaseAtom.name + '</div>';
      html += '<div style="background:#eee;height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">';
      html += '<div style="width:' + pct + '%;height:100%;background:' + b.color + ';border-radius:4px"></div></div>';
      html += '<div style="font-size:11px;font-weight:600;color:' + b.color + '">' + pct + '% complete</div>';
    }
    html += '</div>';
    return html;
  }

  function addBuildings() {
    if (!map) return;
    layers.buildings = L.layerGroup().addTo(map);
    buildings.forEach(function (b) {
      var pct = 0;
      if (typeof ACE !== 'undefined' && b.phase) pct = ACE.percentComplete(b.phase);
      var marker = L.circleMarker([b.lat, b.lng], {
        radius: b.radius || 10,
        fillColor: b.color,
        color: pct >= 100 ? '#2f7d4f' : '#221c10',
        weight: pct >= 100 ? 3 : 2,
        fillOpacity: 0.15 + 0.65 * (pct / 100)
      }).addTo(layers.buildings);
      marker.bindPopup(buildingPopup(b));
      marker._bldg = b;
    });
  }

  function addConstraintPins() {
    if (!map || typeof ACE === 'undefined') return;
    layers.constraints = L.layerGroup().addTo(map);
    var constraints = ACE.query({ type: 'constraint' });
    var constraintLocs = {
      'CON-REBAR':   [44.3253, -81.5985],
      'CON-CRANE':   [44.3272, -81.5978],
      'CON-WELDCERT':[44.3262, -81.5975],
      'CON-CNSCHOLD':[44.3268, -81.5990],
      'CON-COOLANT': [44.3260, -81.5988],
      'CON-FORMWORK':[44.3255, -81.5978]
    };
    constraints.forEach(function (con) {
      var loc = constraintLocs[con.id] || [44.3255 + Math.random() * 0.002, -81.5980 + Math.random() * 0.002];
      var icon = con._complete ? '✓' : '⚠';
      var color = con._complete ? '#2f7d4f' : '#b13d2c';
      var marker = L.circleMarker(loc, {
        radius: 6, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9
      }).addTo(layers.constraints);
      marker.bindPopup('<b>' + icon + ' ' + con.id + '</b><br>' + con.name + '<br><span style="color:' + color + '">' + (con._complete ? 'CLEARED' : 'OPEN') + '</span>');
    });
  }

  function addUserPins() {
    if (!map) return;
    layers.userPins = L.layerGroup().addTo(map);
    userPins.forEach(function (pin, idx) {
      var marker = L.marker([pin.lat, pin.lng]).addTo(layers.userPins);
      marker.bindPopup('<b>' + escH(pin.label) + '</b><br><span style="font-size:11px;color:#666">' + escH(pin.note || '') + '</span>' +
        '<br><button onclick="ACE_Map.removePin(' + idx + ')" style="margin-top:6px;padding:3px 8px;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:10px;background:#fff">Remove</button>');
    });
  }

  function addCaptures() {
    if (!map) return;
    layers.captures = L.layerGroup().addTo(map);
    ACE_FieldIQ.getCaptures().forEach(function (cap) {
      if (cap.gps) {
        var marker = L.circleMarker([cap.gps.lat, cap.gps.lng], {
          radius: 5, fillColor: '#4ade80', color: '#221c10', weight: 1, fillOpacity: 0.9
        }).addTo(layers.captures);
        marker.bindPopup('<b>' + escH(cap.title || cap.id) + '</b><br>' + cap.timestamp);
      }
    });
  }

  function onMapClick(e) {
    if (measuring) {
      measurePoints.push(e.latlng);
      if (measurePoints.length >= 2) {
        if (measureLine) map.removeLayer(measureLine);
        measureLine = L.polyline(measurePoints, { color: '#a8401f', weight: 2, dashArray: '6,4' }).addTo(map);
        var totalDist = 0;
        for (var i = 1; i < measurePoints.length; i++) {
          totalDist += measurePoints[i - 1].distanceTo(measurePoints[i]);
        }
        measureLine.bindPopup(Math.round(totalDist) + ' m').openPopup();
      }
      return;
    }
  }

  function addPin(lat, lng, label, note) {
    var pin = { lat: lat, lng: lng, label: label || 'Pin', note: note || '' };
    userPins.push(pin);
    localStorage.setItem('ace-map-pins', JSON.stringify(userPins));
    if (layers.userPins) {
      var marker = L.marker([lat, lng]).addTo(layers.userPins);
      marker.bindPopup('<b>' + escH(label) + '</b><br>' + escH(note));
    }
  }

  function removePin(idx) {
    userPins.splice(idx, 1);
    localStorage.setItem('ace-map-pins', JSON.stringify(userPins));
    if (layers.userPins) { layers.userPins.clearLayers(); addUserPins(); }
  }

  function toggleMeasure() {
    measuring = !measuring;
    if (!measuring) {
      measurePoints = [];
      if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
    }
    return measuring;
  }

  function toggleLayer(name) {
    if (!map || !layers[name]) return;
    if (map.hasLayer(layers[name])) map.removeLayer(layers[name]);
    else map.addLayer(layers[name]);
  }

  var modelOverlay = null;
  var modelVisible = false;

  function toggleModel() {
    modelVisible = !modelVisible;
    if (!map) return modelVisible;
    if (modelVisible) {
      if (!modelOverlay) {
        modelOverlay = L.canvasOverlay(drawModelOverlay).addTo(map);
      } else {
        map.addLayer(modelOverlay);
      }
    } else {
      if (modelOverlay) map.removeLayer(modelOverlay);
    }
    return modelVisible;
  }

  function drawModelOverlay(info) {
    var ctx = info.canvas.getContext('2d');
    var size = info.size;
    var zoom = info.zoom || map.getZoom();

    ctx.clearRect(0, 0, size.x, size.y);
    if (!modelVisible) return;

    var simM = (typeof ACE_UI !== 'undefined' && ACE_UI.getSimMonth) ? ACE_UI.getSimMonth() : 0;
    var t = simM / (ACE_Data.PLANT.baselineMonths || 108);

    function toP(lat, lng) {
      var pt = map.latLngToContainerPoint([lat, lng]);
      return [pt.x, pt.y];
    }

    var progress = {};
    var phaseMap = { reactor: 'PH-REACT', containment: 'PH-CONTAIN', turbine: 'PH-MECH', cooling: 'PH-AUX', aux: 'PH-AUX', pipe: 'PH-PIPE', elec: 'PH-ELEC', civil: 'PH-CIVIL' };
    for (var k in phaseMap) {
      progress[k] = typeof ACE !== 'undefined' ? ACE.percentComplete(phaseMap[k]) / 100 : Math.min(1, Math.max(0, (t - 0.2) * 2.5));
    }

    var sc = Math.pow(2, zoom - 16);
    var depth = 6 * sc;

    function iso3dBox(lat, lng, w, d, h, prog, color, label) {
      var base = toP(lat, lng);
      var bx = base[0], by = base[1];
      var pw = w * sc, pd = d * sc * 0.5, ph = h * sc;
      var fillH = ph * Math.max(0.02, prog);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.beginPath();
      ctx.moveTo(bx - pw/2 + 4, by + 4);
      ctx.lineTo(bx + pw/2 + 4, by + 4);
      ctx.lineTo(bx + pw/2 + pd + 4, by - pd + 4);
      ctx.lineTo(bx - pw/2 + pd + 4, by - pd + 4);
      ctx.closePath(); ctx.fill();

      // Ghost outline
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      // Front
      ctx.strokeRect(bx - pw/2, by - ph, pw, ph);
      // Right side
      ctx.beginPath();
      ctx.moveTo(bx + pw/2, by); ctx.lineTo(bx + pw/2 + pd, by - pd);
      ctx.lineTo(bx + pw/2 + pd, by - pd - ph); ctx.lineTo(bx + pw/2, by - ph);
      ctx.stroke();
      // Top
      ctx.beginPath();
      ctx.moveTo(bx - pw/2, by - ph); ctx.lineTo(bx - pw/2 + pd, by - ph - pd);
      ctx.lineTo(bx + pw/2 + pd, by - ph - pd); ctx.lineTo(bx + pw/2, by - ph);
      ctx.stroke();
      ctx.setLineDash([]);

      if (prog > 0.01) {
        // Front face
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(bx - pw/2, by - fillH, pw, fillH);
        // Right face (darker)
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(bx + pw/2, by); ctx.lineTo(bx + pw/2 + pd, by - pd);
        ctx.lineTo(bx + pw/2 + pd, by - pd - fillH); ctx.lineTo(bx + pw/2, by - fillH);
        ctx.closePath(); ctx.fill();
        // Top face (lighter)
        if (prog > 0.95) {
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.moveTo(bx - pw/2, by - fillH); ctx.lineTo(bx - pw/2 + pd, by - fillH - pd);
          ctx.lineTo(bx + pw/2 + pd, by - fillH - pd); ctx.lineTo(bx + pw/2, by - fillH);
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Edges
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.8;
        ctx.strokeRect(bx - pw/2, by - fillH, pw, fillH);
      }

      // Label
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5a5448';
      ctx.font = 'bold ' + Math.max(8, 9 * sc) + 'px IBM Plex Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, bx, by + 10 * sc);
      if (prog > 0) {
        ctx.fillStyle = color;
        ctx.font = Math.max(7, 8 * sc) + 'px IBM Plex Mono, monospace';
        ctx.fillText(Math.round(prog * 100) + '%', bx, by + 18 * sc);
      }
    }

    function isoCylinder(lat, lng, r, h, prog, color, label) {
      var base = toP(lat, lng);
      var bx = base[0], by = base[1];
      var pr = r * sc, ph = h * sc;
      var fillH = ph * Math.max(0.02, prog);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,.06)';
      ctx.beginPath(); ctx.ellipse(bx + 3, by + 3, pr, pr * 0.4, 0, 0, Math.PI * 2); ctx.fill();

      // Ghost
      ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 1; ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.ellipse(bx, by, pr, pr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - pr, by); ctx.lineTo(bx - pr, by - ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + pr, by); ctx.lineTo(bx + pr, by - ph); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by - ph, pr, pr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      if (prog > 0.01) {
        // Body
        ctx.fillStyle = color; ctx.globalAlpha = 0.7;
        ctx.fillRect(bx - pr, by - fillH, pr * 2, fillH);
        // Bottom ellipse
        ctx.beginPath(); ctx.ellipse(bx, by, pr, pr * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        // Top ellipse
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.ellipse(bx, by - fillH, pr, pr * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#5a5448';
      ctx.font = 'bold ' + Math.max(8, 9 * sc) + 'px IBM Plex Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, bx, by + 10 * sc);
    }

    // Draw buildings back-to-front (north first)
    // Cooling towers (far back)
    isoCylinder(44.3278, -81.5955, 12, 50, progress.cooling, '#6b4c9a', 'CT-1');
    isoCylinder(44.3278, -81.5940, 12, 50, progress.cooling, '#6b4c9a', 'CT-2');
    // Electrical substation
    iso3dBox(44.3272, -81.5935, 20, 15, 15, progress.elec, '#b8860b', 'ELEC');
    // Turbine building (large, right of center)
    iso3dBox(44.3262, -81.5962, 40, 25, 30, progress.turbine, '#2c5d78', 'TB');
    // Reactor building (tall cylinder, left of center)
    isoCylinder(44.3266, -81.5982, 16, 55, progress.reactor, '#a8401f', 'RB');
    // Containment dome
    if (progress.containment > 0.05) {
      var rp2 = toP(44.3266, -81.5982);
      var dR = 18 * sc * progress.containment;
      ctx.fillStyle = 'rgba(168,64,31,.3)';
      ctx.beginPath(); ctx.arc(rp2[0], rp2[1] - 55 * sc * progress.reactor, dR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a8401f'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rp2[0], rp2[1] - 55 * sc * progress.reactor, dR, 0, Math.PI * 2); ctx.stroke();
    }
    // MCR
    iso3dBox(44.3264, -81.5988, 15, 12, 12, progress.reactor, '#b13d2c', 'MCR');
    // Auxiliary building
    iso3dBox(44.3258, -81.5992, 22, 16, 18, progress.aux, '#b8860b', 'AUX');
    // Service building
    iso3dBox(44.3252, -81.5978, 18, 14, 12, progress.civil, '#2f7d4f', 'SB');
    // Pipe shop
    iso3dBox(44.3250, -81.5950, 25, 12, 10, progress.pipe, '#2c5d78', 'PIPE');
    // Warehouse
    iso3dBox(44.3246, -81.5962, 30, 18, 10, Math.min(1, t * 4), '#8a8578', 'WH');
    // Batch plant
    iso3dBox(44.3242, -81.5942, 18, 12, 14, progress.civil, '#8a8578', 'BATCH');

    // Crane
    var crP = toP(44.3264, -81.5975);
    var crH2 = 65 * sc * (t < 0.85 ? Math.min(1, t * 3) : Math.max(0, (1 - t) * 6));
    if (crH2 > 2) {
      ctx.strokeStyle = '#a8401f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(crP[0], crP[1]); ctx.lineTo(crP[0], crP[1] - crH2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crP[0] - 30 * sc, crP[1] - crH2); ctx.lineTo(crP[0] + 30 * sc, crP[1] - crH2); ctx.stroke();
      ctx.strokeStyle = 'rgba(168,64,31,.3)'; ctx.lineWidth = 1;
      var sw = Math.sin(performance.now() / 700) * 4 * sc;
      ctx.beginPath(); ctx.moveTo(crP[0] + 15 * sc + sw, crP[1] - crH2); ctx.lineTo(crP[0] + 15 * sc + sw * 1.3, crP[1] - crH2 * 0.4); ctx.stroke();
    }

    // Pipes connecting RB to TB
    if (progress.pipe > 0.1) {
      var pA = toP(44.3266, -81.5982), pB = toP(44.3262, -81.5962);
      ctx.strokeStyle = 'rgba(44,93,120,.5)'; ctx.lineWidth = 2 * sc;
      ctx.beginPath(); ctx.moveTo(pA[0] + 16 * sc, pA[1]); ctx.lineTo(pB[0] - 20 * sc, pB[1]); ctx.stroke();
    }

    if (modelVisible) requestAnimationFrame(function() {
      if (modelOverlay && map && modelVisible) modelOverlay._redraw();
    });
  }

  // L.canvasOverlay plugin (lightweight)
  if (typeof L !== 'undefined') {
    L.canvasOverlay = function(drawFn) {
      var layer = L.Layer.extend({
        onAdd: function(m) {
          this._map = m;
          var canvas = L.DomUtil.create('canvas', 'leaflet-canvas-overlay');
          var pane = m.getPane('overlayPane');
          pane.appendChild(canvas);
          this._canvas = canvas;
          this._drawFn = drawFn;
          m.on('moveend zoomend resize', this._redraw, this);
          this._redraw();
        },
        onRemove: function(m) {
          L.DomUtil.remove(this._canvas);
          m.off('moveend zoomend resize', this._redraw, this);
        },
        _redraw: function() {
          var m = this._map;
          if (!m) return;
          var size = m.getSize();
          this._canvas.width = size.x;
          this._canvas.height = size.y;
          this._canvas.style.width = size.x + 'px';
          this._canvas.style.height = size.y + 'px';
          var topLeft = m.containerPointToLayerPoint([0, 0]);
          L.DomUtil.setPosition(this._canvas, topLeft);
          this._drawFn({ canvas: this._canvas, bounds: m.getBounds(), size: size, zoom: m.getZoom() });
        }
      });
      return new layer();
    };
  }

  function refresh() {
    if (map) map.invalidateSize();
  }

  function destroy() {
    if (map) { map.remove(); map = null; }
    markers = []; layers = {}; modelOverlay = null; modelVisible = false;
  }

  return {
    init: init, destroy: destroy, refresh: refresh,
    addPin: addPin, removePin: removePin,
    toggleMeasure: toggleMeasure, toggleLayer: toggleLayer,
    toggleModel: toggleModel,
    buildings: buildings, constructionZones: constructionZones
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
// ACE_Tour — Guided walkthrough of the interface
// ================================================================

var ACE_Tour = (function () {
  'use strict';
  var step = -1;
  var steps = [
    { target: '#gantt-wrap', title: 'Gantt Schedule', text: 'Your project timeline. 14 phases from Site Prep to Commercial Operation. Red bars are on the critical path. Click any bar for details.', tab: 'plan' },
    { target: '.dash-kpis', title: 'Key Metrics', text: '8 KPIs at a glance. Track atoms, progress, workable items, critical path length, and Monte Carlo forecasts.', tab: 'plan' },
    { target: '#btn-play', title: 'Simulation', text: 'Press Play to simulate construction. Atoms auto-complete based on the CPM schedule. Speed up to 10x. Triage events will pause for your decision.', tab: 'plan' },
    { target: '[data-view="forecast"]', title: 'Monte Carlo Forecast', text: 'Click Forecast to see probability distributions. 1000 iterations sample risk impacts. P50/P80/P90 show confidence levels.', tab: null },
    { target: '[data-view="constraints"]', title: 'IWP Readiness', text: 'Track Install Work Package readiness. See which IWPs are workable, blocked, or complete. Manage constraints.', tab: null },
    { target: '[data-view="triage"]', title: 'Triage Decisions', text: '8 construction decision points. When the sim hits a triage month, you choose Option A or B with cost/schedule trade-offs.', tab: null },
    { target: '.terminal', title: 'Terminal', text: 'Power user interface. Type "help" for commands. Query atoms, run Monte Carlo, check risks, export data.', tab: 'explore' }
  ];

  function start() { step = -1; next(); }
  function next() {
    dismiss();
    step++;
    if (step >= steps.length) { step = -1; return; }
    var s = steps[step];
    if (s.tab) {
      var tabBtn = document.querySelector('[data-view="' + s.tab + '"]');
      if (tabBtn) tabBtn.click();
      setTimeout(function () { showStep(s); }, 300);
    } else { showStep(s); }
  }
  function showStep(s) {
    var target = document.querySelector(s.target);
    var rect = target ? target.getBoundingClientRect() : { top: 200, left: 200, width: 100, height: 40 };
    // Highlight box
    var hl = document.createElement('div');
    hl.id = 'tour-highlight';
    hl.style.cssText = 'position:fixed;z-index:299;border:3px solid #a8401f;border-radius:8px;pointer-events:none;box-shadow:0 0 0 9999px rgba(34,28,16,0.55);transition:all .3s ease';
    hl.style.top = (rect.top - 6) + 'px';
    hl.style.left = (rect.left - 6) + 'px';
    hl.style.width = (rect.width + 12) + 'px';
    hl.style.height = (rect.height + 12) + 'px';
    document.body.appendChild(hl);
    // Card
    var card = document.createElement('div');
    card.id = 'tour-card';
    var cardTop = rect.bottom + 16;
    var cardLeft = Math.min(rect.left, window.innerWidth - 360);
    if (cardTop + 160 > window.innerHeight) cardTop = rect.top - 170;
    if (cardLeft < 10) cardLeft = 10;
    card.style.cssText = 'position:fixed;z-index:300;background:#faf6ed;border:1px solid #d5cebc;border-radius:10px;padding:16px 20px;width:340px;box-shadow:0 12px 48px rgba(34,28,16,0.3);animation:card-in .2s ease';
    card.style.top = cardTop + 'px';
    card.style.left = cardLeft + 'px';
    card.innerHTML = '<div style="font-family:Fraunces,serif;font-size:15px;font-weight:600;margin-bottom:6px">' + s.title + '</div>' +
      '<div style="font-size:13px;line-height:1.6;color:#544c3a;margin-bottom:12px">' + s.text + '</div>' +
      '<div style="display:flex;gap:8px;justify-content:space-between;align-items:center">' +
      '<span style="font-family:IBM Plex Mono,monospace;font-size:10px;color:#9a9077">' + (step + 1) + '/' + steps.length + '</span>' +
      '<div style="display:flex;gap:6px">' +
      '<button id="tour-skip" style="background:none;border:1px solid #d5cebc;padding:6px 12px;border-radius:6px;font-size:11px;cursor:pointer;font-family:IBM Plex Mono,monospace">Skip</button>' +
      '<button id="tour-next" style="background:#a8401f;color:#faf6ed;border:none;padding:6px 14px;border-radius:6px;font-size:11px;cursor:pointer;font-family:IBM Plex Mono,monospace;font-weight:500">' + (step < steps.length - 1 ? 'Next' : 'Finish') + '</button>' +
      '</div></div>';
    document.body.appendChild(card);
    document.getElementById('tour-next').addEventListener('click', next);
    document.getElementById('tour-skip').addEventListener('click', function () { step = steps.length; dismiss(); });
  }
  function dismiss() {
    var hl = document.getElementById('tour-highlight');
    var card = document.getElementById('tour-card');
    if (hl) hl.remove();
    if (card) card.remove();
  }
  return { start: start, next: next, dismiss: dismiss };
})();


// ================================================================
// ACE_SimEvents — Background construction narrative events
// ================================================================

var ACE_SimEvents = (function () {
  'use strict';

  var events = [
    // Phase 1: Site Prep (months 1-8)
    { minMonth: 1, maxMonth: 8, text: 'Topsoil strip complete in reactor building footprint — 2400 m³ stockpiled' },
    { minMonth: 1, maxMonth: 8, text: 'Dewatering wells DW-01 through DW-06 operational — water table lowered 3.2m' },
    { minMonth: 1, maxMonth: 8, text: 'Batch plant BP-1 commissioned — first trial batch 35 MPa passed slump and air tests' },
    { minMonth: 1, maxMonth: 8, text: 'Survey control network established — 14 monuments set, geodetic tie confirmed' },
    { minMonth: 1, maxMonth: 8, text: 'Temporary construction power energized — 13.8 kV feeder from switchyard' },
    // Phase 2: Excavation & Foundation (months 6-14)
    { minMonth: 6, maxMonth: 14, text: 'Excavation to elevation 76.5m complete — rock quality confirmed Class I' },
    { minMonth: 6, maxMonth: 14, text: 'Concrete batch 47 placed in RB basemat — 28°C, slump test passed' },
    { minMonth: 6, maxMonth: 14, text: 'Rebar cage RB-RC-08 tied and inspected — 42 tonnes Grade 60' },
    { minMonth: 6, maxMonth: 14, text: 'Formwork stripped from containment wall section CW-14' },
    { minMonth: 6, maxMonth: 14, text: 'Mudmat pour complete in turbine building — 380 m³ placed continuously' },
    // Phase 3: Containment (months 12-24)
    { minMonth: 12, maxMonth: 24, text: 'Containment wall lift CW-22 poured — 62 m³, vibration monitoring nominal' },
    { minMonth: 12, maxMonth: 24, text: 'Post-tensioning tendon T-14 stressed to 80% GUTS — elongation within 5%' },
    { minMonth: 12, maxMonth: 24, text: 'Containment liner plate LP-07 welded — NDE MT inspection acceptable' },
    { minMonth: 12, maxMonth: 24, text: 'Dome ring beam rebar placed — 780 bars tied, QC hold point cleared' },
    { minMonth: 12, maxMonth: 24, text: 'Containment penetration CP-34 sleeve installed and seal-welded' },
    // Phase 4: Reactor Building internals (months 20-32)
    { minMonth: 20, maxMonth: 32, text: 'Calandria tube CT-380 rolled and expanded — torque within spec' },
    { minMonth: 20, maxMonth: 32, text: 'Moderator piping spool MP-12 fit-up complete — weld prep inspected' },
    { minMonth: 20, maxMonth: 32, text: 'Reactor vault steel liner section RVL-05 set — plumb and level verified' },
    { minMonth: 20, maxMonth: 32, text: 'Fuelling machine bridge rail alignment checked — within 0.5mm tolerance' },
    { minMonth: 20, maxMonth: 32, text: 'End shield ES-2 lower section positioned — optical survey confirmed' },
    // Phase 5: Primary Heat Transport (months 28-40)
    { minMonth: 28, maxMonth: 40, text: 'NDE radiography on weld PHT-W-034 — acceptable per N285.0' },
    { minMonth: 28, maxMonth: 40, text: 'Heavy lift: Steam Generator SG-2 set on supports — 315 tonnes' },
    { minMonth: 28, maxMonth: 40, text: 'PHT header H-4 positioned in reactor vault — rigging plan executed' },
    { minMonth: 28, maxMonth: 40, text: 'Hydrostatic test on moderator loop 3 — held at 1.5x design pressure' },
    { minMonth: 28, maxMonth: 40, text: 'Feeder pipe FP-227 bent and installed — wall thickness verified by UT' },
    // Phase 6: Turbine & BOP (months 24-42)
    { minMonth: 24, maxMonth: 42, text: 'Turbine pedestal concrete placement complete — 1200 m³ mass pour' },
    { minMonth: 24, maxMonth: 42, text: 'Condenser tube bundle CB-2 rolled in — 4800 titanium tubes' },
    { minMonth: 24, maxMonth: 42, text: 'Cable tray CT-12A installed in turbine hall — 340m routed' },
    { minMonth: 24, maxMonth: 42, text: 'Generator stator lowered into position — 280 tonnes, 0.1mm alignment' },
    { minMonth: 24, maxMonth: 42, text: 'Main transformer T1 oil fill complete — 68,000 litres, DGA baseline taken' },
    // Phase 7: Electrical & I&C (months 32-48)
    { minMonth: 32, maxMonth: 48, text: 'Class III bus 3A energized — protection relay settings verified' },
    { minMonth: 32, maxMonth: 48, text: 'DCS cabinet row R-14 powered on — 240 I/O points loop-checked' },
    { minMonth: 32, maxMonth: 48, text: 'Neutron flux detector NFD-7 installed in ion chamber — cabling terminated' },
    { minMonth: 32, maxMonth: 48, text: 'Emergency power generator EPG-2 first start — reached rated speed in 8s' },
    { minMonth: 32, maxMonth: 48, text: 'Fire detection zone FZ-22 commissioned — 36 detectors, panel alarm test passed' },
    // Phase 8: Commissioning (months 44-60)
    { minMonth: 44, maxMonth: 60, text: 'Hot conditioning of PHT system started — 260°C, chemistry sampling normal' },
    { minMonth: 44, maxMonth: 60, text: 'Containment integrated leak rate test — 0.08% volume/day, within acceptance' },
    { minMonth: 44, maxMonth: 60, text: 'Safety system functional test SST-04 complete — shutdown system 1 trip verified' },
    { minMonth: 44, maxMonth: 60, text: 'First fuel bundle loaded into channel R-12 — fuelling machine operation nominal' },
    { minMonth: 44, maxMonth: 60, text: 'Approach to critical — sustained fission achieved, flux doubling time stable' },
  ];

  function check(month) {
    if (Math.random() > 0.20) return null;
    var applicable = [];
    for (var i = 0; i < events.length; i++) {
      if (month >= events[i].minMonth && month <= events[i].maxMonth) {
        applicable.push(events[i]);
      }
    }
    if (applicable.length === 0) return null;
    var picked = applicable[Math.floor(Math.random() * applicable.length)];
    var narrative = 'M' + month + ' — ' + picked.text;
    ACE_Narrative.record('SIM', 'sim-event', narrative, false);
    return narrative;
  }

  return { check: check };
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
    if (!topbar.querySelector('.topbar-pct')) {
      setTimeout(_patchTopbar, 500);
      return;
    }

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
      // Tour button
      var tourBtn = document.createElement('button');
      tourBtn.className = 'btn-ctrl';
      tourBtn.textContent = 'Tour';
      tourBtn.addEventListener('click', function () { ACE_Tour.start(); });

      var exportGroup = document.createElement('div');
      exportGroup.className = 'topbar-group';
      exportGroup.innerHTML =
        '<button class="btn-ctrl" id="btn-pdf-export">PDF</button>' +
        '<button class="btn-ctrl" id="btn-p6-export">P6</button>';
      // Insert before the percentage display
      var pctEl = controls.querySelector('.topbar-pct');
      if (pctEl) {
        controls.insertBefore(tourBtn, pctEl);
        controls.insertBefore(exportGroup, pctEl);
      } else {
        controls.appendChild(tourBtn);
        controls.appendChild(exportGroup);
      }

      document.getElementById('btn-pdf-export').addEventListener('click', function () { ACE_Export.pdf(); });
      document.getElementById('btn-p6-export').addEventListener('click', function () { ACE_Export.p6(); });
    }
  }

  var EXTRA_TABS = [
    { id: 'triage', label: 'Triage' },
    { id: 'flex', label: 'FLEX' },
    { id: 'narrative', label: 'Narrative' },
    { id: 'fieldiq', label: 'FieldIQ' },
    { id: 'map', label: 'Map' }
  ];

  function _injectExtraTabs() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    var tabs = sidebar.querySelector('.sidebar-tabs');
    if (!tabs) return;
    if (tabs.querySelector('[data-view="triage"]')) return;

    EXTRA_TABS.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'sidebar-tab';
      btn.dataset.view = t.id;
      btn.textContent = t.label;
      btn.addEventListener('click', function () {
        tabs.querySelectorAll('.sidebar-tab').forEach(function (tb) { tb.classList.remove('active'); });
        btn.classList.add('active');
        ACE_Extras.renderView(t.id);
      });
      tabs.appendChild(btn);
    });
  }

  function _patchSidebar() {
    _injectExtraTabs();
    var observer = new MutationObserver(function () { _injectExtraTabs(); });
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
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
    html += '<div><div class="risk-header" style="margin-bottom:2px">GIS Site Map</div>' +
      '<div style="font-family:IBM Plex Mono,monospace;font-size:11px;color:var(--faint)">NDX Nuclear Generating Station — Tiverton, Ontario</div></div>';

    // Toolbar
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    html += '<button class="btn-card" id="map-btn-model" style="font-weight:600">3D Model</button>';
    html += '<button class="btn-card" id="map-btn-measure">Measure</button>';
    html += '<button class="btn-card" id="map-btn-pin">Drop Pin</button>';
    html += '<button class="btn-card btn-sm" id="map-lyr-zones" data-layer="zones">Zones</button>';
    html += '<button class="btn-card btn-sm" id="map-lyr-constraints" data-layer="constraints">Constraints</button>';
    html += '<button class="btn-card btn-sm" id="map-lyr-captures" data-layer="captures">Captures</button>';
    html += '</div></div>';

    html += '<div id="ace-map" style="width:100%;height:calc(100vh - 180px);min-height:350px;border-radius:8px;border:1px solid var(--border)"></div>';

    // Legend
    html += '<div style="display:flex;gap:8px;padding:6px 0;flex-wrap:wrap;font-family:IBM Plex Mono,monospace;font-size:10px;align-items:center">';
    ACE_Map.buildings.forEach(function (b) {
      var pct = (typeof ACE !== 'undefined' && b.phase) ? ACE.percentComplete(b.phase) : 0;
      html += '<div style="display:flex;align-items:center;gap:3px;opacity:' + (pct > 0 ? '1' : '.5') + '">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + b.color + ';display:inline-block"></span>' +
        '<span>' + b.id + '</span>' +
        (pct > 0 ? '<span style="color:' + (pct >= 100 ? 'var(--green)' : 'var(--oxide)') + '">' + pct + '%</span>' : '') +
        '</div>';
    });
    html += '</div>';

    el.innerHTML = html;

    setTimeout(function () {
      ACE_Map.destroy();
      ACE_Map.init(document.getElementById('ace-map'));
    }, 50);

    // 3D Model overlay
    document.getElementById('map-btn-model').addEventListener('click', function () {
      var on = ACE_Map.toggleModel();
      this.classList.toggle('btn-apply', on);
      this.textContent = on ? '3D On' : '3D Model';
    });

    // Measure button
    document.getElementById('map-btn-measure').addEventListener('click', function () {
      var on = ACE_Map.toggleMeasure();
      this.textContent = on ? 'Stop Measure' : 'Measure';
      this.style.color = on ? 'var(--oxide)' : '';
      this.style.borderColor = on ? 'var(--oxide)' : '';
    });

    // Drop pin
    document.getElementById('map-btn-pin').addEventListener('click', function () {
      var label = prompt('Pin label:');
      if (!label) return;
      var note = prompt('Note (optional):') || '';
      ACE_Map.addPin(44.3258 + (Math.random() - 0.5) * 0.003, -81.5965 + (Math.random() - 0.5) * 0.003, label, note);
    });

    // Layer toggles
    el.querySelectorAll('[data-layer]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ACE_Map.toggleLayer(btn.dataset.layer);
        btn.classList.toggle('btn-apply');
      });
    });
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
