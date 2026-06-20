/**
 * ACE Data — NDX Nuclear Plant Dataset
 *
 * NDX 5x1000 MWe CANDU Station
 * Budget: $58B | Baseline: 108 months
 * Depends on ACE (ace-core.js) and ACE_Schedule (ace-schedule.js).
 */

const ACE_Data = (function () {
  'use strict';

  /** Plant constants */
  const PLANT = {
    name: 'NDX Nuclear Generating Station',
    units: 5,
    mwe: 1000,
    totalMWe: 5000,
    budget: 58e9,
    baselineMonths: 108,
    startDate: '2025-01-01',
    owner: 'NDX Energy Corp',
    reactor: 'CANDU 1000'
  };

  /** Build the full dataset in ACE */
  function load() {
    ACE.reset();

    // ── Project root ──────────────────────────────────────────
    ACE.create({ id: 'NDX', name: PLANT.name, type: 'project', kind: 'derived', tags: ['nuclear'] });

    // ── Phases (14) ───────────────────────────────────────────
    var phases = [
      { id: 'PH-SITE',    name: 'Site Preparation',           dur: [4, 6, 9] },
      { id: 'PH-EXCAV',   name: 'Excavation & Foundation',    dur: [5, 8, 12] },
      { id: 'PH-CIVIL',   name: 'Civil Structures',           dur: [10, 14, 20] },
      { id: 'PH-CONTAIN', name: 'Containment Building',       dur: [8, 12, 16] },
      { id: 'PH-MECH',    name: 'Mechanical Installation',    dur: [8, 10, 14] },
      { id: 'PH-PIPE',    name: 'Piping Systems',             dur: [6, 9, 13] },
      { id: 'PH-ELEC',    name: 'Electrical Systems',         dur: [6, 8, 11] },
      { id: 'PH-INST',    name: 'Instrumentation & Control',  dur: [5, 7, 10] },
      { id: 'PH-REACT',   name: 'Reactor Assembly',           dur: [6, 8, 12] },
      { id: 'PH-AUX',     name: 'Auxiliary Systems',          dur: [4, 6, 8] },
      { id: 'PH-COMM',    name: 'Commissioning',              dur: [6, 9, 14] },
      { id: 'PH-FUEL',    name: 'Fuel Load',                  dur: [1, 2, 3] },
      { id: 'PH-START',   name: 'Startup Testing',            dur: [3, 4, 6] },
      { id: 'PH-OPER',    name: 'Commercial Operation',       dur: [1, 1, 2] }
    ];

    phases.forEach(function (p) {
      ACE.create({ id: p.id, name: p.name, type: 'phase', kind: 'derived', tags: ['phase'] });
      ACE.link('NDX', 'contains', p.id);
      ACE_Schedule.setDuration(p.id, p.dur[0], p.dur[1], p.dur[2]);
    });

    // Phase dependencies (sequential with some overlap via sub-activities)
    var phaseSeq = [
      ['PH-EXCAV', 'PH-SITE'],
      ['PH-CIVIL', 'PH-EXCAV'],
      ['PH-CONTAIN', 'PH-CIVIL'],
      ['PH-MECH', 'PH-CIVIL'],
      ['PH-PIPE', 'PH-MECH'],
      ['PH-ELEC', 'PH-CIVIL'],
      ['PH-INST', 'PH-ELEC'],
      ['PH-REACT', 'PH-CONTAIN'],
      ['PH-AUX', 'PH-MECH'],
      ['PH-COMM', 'PH-PIPE'],
      ['PH-COMM', 'PH-INST'],
      ['PH-COMM', 'PH-REACT'],
      ['PH-COMM', 'PH-AUX'],
      ['PH-FUEL', 'PH-COMM'],
      ['PH-START', 'PH-FUEL'],
      ['PH-OPER', 'PH-START']
    ];
    phaseSeq.forEach(function (d) { ACE.link(d[0], 'requires', d[1]); });

    // ── Milestones (35) ───────────────────────────────────────
    var milestones = [
      { id: 'MS-NTP',      name: 'Notice to Proceed',             month: 0,   phase: 'PH-SITE' },
      { id: 'MS-SITEPREP', name: 'Site Preparation Complete',     month: 6,   phase: 'PH-SITE' },
      { id: 'MS-EXCAV',    name: 'Excavation Complete',           month: 10,  phase: 'PH-EXCAV' },
      { id: 'MS-FNDPOUR',  name: 'Foundation Pour Complete',      month: 14,  phase: 'PH-EXCAV' },
      { id: 'MS-BASEMAT',  name: 'Basemat Concrete Complete',     month: 18,  phase: 'PH-CIVIL' },
      { id: 'MS-REBAR',    name: 'Containment Rebar Complete',    month: 22,  phase: 'PH-CIVIL' },
      { id: 'MS-CWALL',    name: 'Containment Wall Complete',     month: 30,  phase: 'PH-CONTAIN' },
      { id: 'MS-CDOME',    name: 'Containment Dome Set',         month: 34,  phase: 'PH-CONTAIN' },
      { id: 'MS-CLINER',   name: 'Containment Liner Complete',    month: 38,  phase: 'PH-CONTAIN' },
      { id: 'MS-CPRESS',   name: 'Containment Pressure Test',    month: 40,  phase: 'PH-CONTAIN' },
      { id: 'MS-TURBPED',  name: 'Turbine Pedestal Complete',     month: 26,  phase: 'PH-CIVIL' },
      { id: 'MS-CALANDR',  name: 'Calandria Installed',           month: 44,  phase: 'PH-REACT' },
      { id: 'MS-STEAMG',   name: 'Steam Generators Set',         month: 46,  phase: 'PH-REACT' },
      { id: 'MS-PRHT',     name: 'Primary Heat Transport Closed', month: 52,  phase: 'PH-PIPE' },
      { id: 'MS-TURBSET',  name: 'Turbine Generator Set',        month: 48,  phase: 'PH-MECH' },
      { id: 'MS-MSWITCH',  name: 'Main Switchgear Energized',    month: 54,  phase: 'PH-ELEC' },
      { id: 'MS-DCS',      name: 'DCS Online',                    month: 60,  phase: 'PH-INST' },
      { id: 'MS-AUXCOMP',  name: 'Auxiliary Systems Complete',    month: 58,  phase: 'PH-AUX' },
      { id: 'MS-HYDRO',    name: 'Hydrostatic Test Complete',     month: 64,  phase: 'PH-COMM' },
      { id: 'MS-HOTFUN',   name: 'Hot Functional Testing',       month: 72,  phase: 'PH-COMM' },
      { id: 'MS-CNSC1',    name: 'CNSC Pre-Operational Approval', month: 75,  phase: 'PH-COMM' },
      { id: 'MS-FUELLD',   name: 'First Fuel Load',              month: 80,  phase: 'PH-FUEL' },
      { id: 'MS-FIRSTCRIT', name: 'First Criticality',           month: 82,  phase: 'PH-START' },
      { id: 'MS-GRID',     name: 'Grid Synchronization',         month: 84,  phase: 'PH-START' },
      { id: 'MS-POWER25',  name: '25% Power Plateau',            month: 86,  phase: 'PH-START' },
      { id: 'MS-POWER50',  name: '50% Power Plateau',            month: 88,  phase: 'PH-START' },
      { id: 'MS-POWER75',  name: '75% Power Plateau',            month: 90,  phase: 'PH-START' },
      { id: 'MS-POWER100', name: '100% Power Achieved',          month: 94,  phase: 'PH-START' },
      { id: 'MS-CNSC2',    name: 'CNSC Operating Licence',       month: 96,  phase: 'PH-START' },
      { id: 'MS-COD',      name: 'Commercial Operation Date',    month: 108, phase: 'PH-OPER' },
      { id: 'MS-SEISQUAL', name: 'Seismic Qualification Test',   month: 32,  phase: 'PH-CIVIL' },
      { id: 'MS-PIPEWELD', name: 'Class 1 Piping Welds Complete', month: 50, phase: 'PH-PIPE' },
      { id: 'MS-EMGRDY',   name: 'Emergency Systems Ready',      month: 68,  phase: 'PH-COMM' },
      { id: 'MS-SIMVAL',   name: 'Simulator Validation',         month: 66,  phase: 'PH-INST' },
      { id: 'MS-ENVPERM',  name: 'Environmental Permits Final',  month: 3,   phase: 'PH-SITE' }
    ];

    milestones.forEach(function (m) {
      ACE.create({ id: m.id, name: m.name, type: 'milestone', kind: 'manual', tags: ['milestone'] });
      ACE.link(m.phase, 'contains', m.id);
    });

    // Key milestone dependencies
    var msSeq = [
      ['MS-SITEPREP', 'MS-NTP'], ['MS-EXCAV', 'MS-SITEPREP'],
      ['MS-FNDPOUR', 'MS-EXCAV'], ['MS-BASEMAT', 'MS-FNDPOUR'],
      ['MS-REBAR', 'MS-BASEMAT'], ['MS-CWALL', 'MS-REBAR'],
      ['MS-CDOME', 'MS-CWALL'], ['MS-CLINER', 'MS-CDOME'],
      ['MS-CPRESS', 'MS-CLINER'], ['MS-CALANDR', 'MS-CPRESS'],
      ['MS-STEAMG', 'MS-CALANDR'], ['MS-PRHT', 'MS-STEAMG'],
      ['MS-HYDRO', 'MS-PRHT'], ['MS-HOTFUN', 'MS-HYDRO'],
      ['MS-CNSC1', 'MS-HOTFUN'], ['MS-FUELLD', 'MS-CNSC1'],
      ['MS-FIRSTCRIT', 'MS-FUELLD'], ['MS-GRID', 'MS-FIRSTCRIT'],
      ['MS-POWER25', 'MS-GRID'], ['MS-POWER50', 'MS-POWER25'],
      ['MS-POWER75', 'MS-POWER50'], ['MS-POWER100', 'MS-POWER75'],
      ['MS-CNSC2', 'MS-POWER100'], ['MS-COD', 'MS-CNSC2']
    ];
    msSeq.forEach(function (d) { ACE.link(d[0], 'requires', d[1]); });

    // ── Risks (16) ────────────────────────────────────────────
    var risks = [
      { id: 'RSK-GEOTECH',  name: 'Unexpected Geotechnical Conditions',  prob: 0.25, impact: 4 },
      { id: 'RSK-LABOUR',   name: 'Skilled Labour Shortage',             prob: 0.40, impact: 6 },
      { id: 'RSK-SUPPLY',   name: 'Supply Chain Disruption',             prob: 0.35, impact: 5 },
      { id: 'RSK-REGDELAY', name: 'Regulatory Review Delay',             prob: 0.30, impact: 8 },
      { id: 'RSK-WELD',     name: 'Class 1 Welding Rework',              prob: 0.45, impact: 3 },
      { id: 'RSK-WEATHER',  name: 'Severe Weather Event',                prob: 0.20, impact: 2 },
      { id: 'RSK-DESIGN',   name: 'Design Change Order',                 prob: 0.30, impact: 4 },
      { id: 'RSK-QUALITY',  name: 'Quality Non-Conformance',             prob: 0.35, impact: 3 },
      { id: 'RSK-CONCRETE', name: 'Concrete Supply Quality Issue',       prob: 0.15, impact: 5 },
      { id: 'RSK-SEISMIC',  name: 'Seismic Requalification Required',    prob: 0.10, impact: 10 },
      { id: 'RSK-ENVIRO',   name: 'Environmental Compliance Issue',      prob: 0.20, impact: 4 },
      { id: 'RSK-CYBER',    name: 'Cybersecurity Incident on DCS',       prob: 0.10, impact: 6 },
      { id: 'RSK-CRANE',    name: 'Heavy Lift Crane Failure',            prob: 0.08, impact: 5 },
      { id: 'RSK-FUEL',     name: 'Fuel Fabrication Delay',              prob: 0.15, impact: 4 },
      { id: 'RSK-COMMFAIL', name: 'Commissioning Test Failure',          prob: 0.30, impact: 3 },
      { id: 'RSK-PROTEST',  name: 'Public Opposition / Legal Challenge', prob: 0.20, impact: 6 }
    ];

    risks.forEach(function (r) {
      ACE.create({
        id: r.id, name: r.name, type: 'risk', kind: 'manual',
        tags: ['risk', 'p:' + r.prob, 'impact:' + r.impact]
      });
      ACE.link('NDX', 'contains', r.id);
    });

    // Wire key risks to affected phases
    ACE.link('PH-EXCAV', 'requires', 'RSK-GEOTECH');
    ACE.link('PH-MECH', 'requires', 'RSK-LABOUR');
    ACE.link('PH-PIPE', 'requires', 'RSK-SUPPLY');
    ACE.link('PH-COMM', 'requires', 'RSK-REGDELAY');
    ACE.link('PH-PIPE', 'requires', 'RSK-WELD');
    ACE.link('PH-FUEL', 'requires', 'RSK-FUEL');

    // ── Opportunities (4) ─────────────────────────────────────
    var opps = [
      { id: 'OPP-MODULAR',  name: 'Modular Construction Acceleration',  saving: 4 },
      { id: 'OPP-AIINSP',   name: 'AI-Assisted Weld Inspection',        saving: 2 },
      { id: 'OPP-PREFAB',   name: 'Off-Site Prefabrication',            saving: 3 },
      { id: 'OPP-PARALLEL', name: 'Parallel Commissioning Tracks',      saving: 2 }
    ];

    opps.forEach(function (o) {
      ACE.create({
        id: o.id, name: o.name, type: 'opportunity', kind: 'manual',
        tags: ['opportunity', 'saving:' + o.saving]
      });
      ACE.link('NDX', 'contains', o.id);
    });

    // ── CWA / CWP / IWP Hierarchy (~50 atoms) ────────────────

    // CWA-01: Reactor Building
    ACE.create({ id: 'CWA-01', name: 'Reactor Building', type: 'cwa', kind: 'derived', tags: ['awp'] });
    ACE.link('NDX', 'contains', 'CWA-01');

    var cwp01 = [
      { id: 'CWP-0101', name: 'Basemat Concrete', iwps: ['IWP-010101', 'IWP-010102', 'IWP-010103'] },
      { id: 'CWP-0102', name: 'Containment Walls', iwps: ['IWP-010201', 'IWP-010202'] },
      { id: 'CWP-0103', name: 'Dome Structure', iwps: ['IWP-010301', 'IWP-010302'] },
      { id: 'CWP-0104', name: 'Interior Structures', iwps: ['IWP-010401', 'IWP-010402'] }
    ];

    cwp01.forEach(function (cwp) {
      ACE.create({ id: cwp.id, name: cwp.name, type: 'cwp', kind: 'derived', tags: ['awp'] });
      ACE.link('CWA-01', 'contains', cwp.id);
      cwp.iwps.forEach(function (iwpId, idx) {
        ACE.create({
          id: iwpId, name: cwp.name + ' - Package ' + (idx + 1),
          type: 'iwp', kind: 'manual', tags: ['awp', 'concrete']
        });
        ACE.link(cwp.id, 'contains', iwpId);
      });
    });

    // CWA-02: Turbine Building
    ACE.create({ id: 'CWA-02', name: 'Turbine Building', type: 'cwa', kind: 'derived', tags: ['awp'] });
    ACE.link('NDX', 'contains', 'CWA-02');

    var cwp02 = [
      { id: 'CWP-0201', name: 'Turbine Foundation', iwps: ['IWP-020101', 'IWP-020102'] },
      { id: 'CWP-0202', name: 'Turbine Hall Structure', iwps: ['IWP-020201', 'IWP-020202'] },
      { id: 'CWP-0203', name: 'Generator Pedestal', iwps: ['IWP-020301'] }
    ];

    cwp02.forEach(function (cwp) {
      ACE.create({ id: cwp.id, name: cwp.name, type: 'cwp', kind: 'derived', tags: ['awp'] });
      ACE.link('CWA-02', 'contains', cwp.id);
      cwp.iwps.forEach(function (iwpId, idx) {
        ACE.create({
          id: iwpId, name: cwp.name + ' - Package ' + (idx + 1),
          type: 'iwp', kind: 'manual', tags: ['awp']
        });
        ACE.link(cwp.id, 'contains', iwpId);
      });
    });

    // CWA-03: Mechanical Systems
    ACE.create({ id: 'CWA-03', name: 'Mechanical Systems', type: 'cwa', kind: 'derived', tags: ['awp'] });
    ACE.link('NDX', 'contains', 'CWA-03');

    var cwp03 = [
      { id: 'CWP-0301', name: 'Primary Heat Transport', iwps: ['IWP-030101', 'IWP-030102', 'IWP-030103'] },
      { id: 'CWP-0302', name: 'Moderator System', iwps: ['IWP-030201', 'IWP-030202'] },
      { id: 'CWP-0303', name: 'Emergency Core Cooling', iwps: ['IWP-030301', 'IWP-030302'] }
    ];

    cwp03.forEach(function (cwp) {
      ACE.create({ id: cwp.id, name: cwp.name, type: 'cwp', kind: 'derived', tags: ['awp', 'nuclear'] });
      ACE.link('CWA-03', 'contains', cwp.id);
      cwp.iwps.forEach(function (iwpId, idx) {
        ACE.create({
          id: iwpId, name: cwp.name + ' - Package ' + (idx + 1),
          type: 'iwp', kind: 'manual', tags: ['awp', 'nuclear']
        });
        ACE.link(cwp.id, 'contains', iwpId);
      });
    });

    // IWP sequential dependencies within CWPs
    ACE.link('IWP-010102', 'requires', 'IWP-010101');
    ACE.link('IWP-010103', 'requires', 'IWP-010102');
    ACE.link('IWP-010202', 'requires', 'IWP-010201');
    ACE.link('IWP-010302', 'requires', 'IWP-010301');
    ACE.link('IWP-010402', 'requires', 'IWP-010401');
    ACE.link('IWP-030102', 'requires', 'IWP-030101');
    ACE.link('IWP-030103', 'requires', 'IWP-030102');

    // Cross-CWP dependencies
    ACE.link('CWP-0102', 'requires', 'CWP-0101');
    ACE.link('CWP-0103', 'requires', 'CWP-0102');
    ACE.link('CWP-0104', 'requires', 'CWP-0101');
    ACE.link('CWP-0201', 'requires', 'CWP-0101');

    // ── Constraints (6) ───────────────────────────────────────
    var constraints = [
      { id: 'CON-REBAR',   name: 'Rebar Supply Available',          affects: ['IWP-010101'] },
      { id: 'CON-CRANE',   name: 'Heavy Lift Crane On Site',        affects: ['IWP-010301', 'IWP-020201'] },
      { id: 'CON-WELDCERT', name: 'Class 1 Welders Certified',     affects: ['IWP-030101'] },
      { id: 'CON-CNSCHOLD', name: 'CNSC Hold Point Released',       affects: ['MS-FUELLD'] },
      { id: 'CON-COOLANT',  name: 'Heavy Water Delivered',          affects: ['IWP-030201'] },
      { id: 'CON-FORMWORK', name: 'Formwork Available',             affects: ['IWP-010201'] }
    ];

    constraints.forEach(function (c) {
      ACE.create({ id: c.id, name: c.name, type: 'constraint', kind: 'manual', tags: ['constraint'] });
      ACE.link('NDX', 'contains', c.id);
      c.affects.forEach(function (aid) { ACE.link(aid, 'requires', c.id); });
    });

    // ── Long-Lead Items ───────────────────────────────────────
    var longLead = [
      { id: 'LL-CALANDR',  name: 'Calandria Vessel',        leadMonths: 36 },
      { id: 'LL-STEAMGEN', name: 'Steam Generators (4)',     leadMonths: 30 },
      { id: 'LL-TURBINE',  name: 'Turbine Generator Set',   leadMonths: 24 },
      { id: 'LL-FUELASM',  name: 'Fuel Assemblies',         leadMonths: 18 },
      { id: 'LL-PRESSTUBES', name: 'Pressure Tubes',        leadMonths: 24 },
      { id: 'LL-DCS',      name: 'Digital Control System',  leadMonths: 20 }
    ];

    longLead.forEach(function (ll) {
      ACE.create({
        id: ll.id, name: ll.name, type: 'material', kind: 'manual',
        tags: ['long-lead', 'lead:' + ll.leadMonths]
      });
      ACE.link('NDX', 'contains', ll.id);
    });

    // Long-lead items required by milestones
    ACE.link('MS-CALANDR', 'requires', 'LL-CALANDR');
    ACE.link('MS-STEAMG', 'requires', 'LL-STEAMGEN');
    ACE.link('MS-TURBSET', 'requires', 'LL-TURBINE');
    ACE.link('MS-FUELLD', 'requires', 'LL-FUELASM');

    // ── IWP durations ─────────────────────────────────────────
    ACE.all().forEach(function (a) {
      if (a.type === 'iwp') {
        ACE_Schedule.setDuration(a.id, 0.5, 1, 2);
      }
    });

    // ── Planned value curve (S-curve) ─────────────────────────
    var pvCurve = {};
    for (var m = 0; m <= PLANT.baselineMonths; m++) {
      var t = m / PLANT.baselineMonths;
      pvCurve[m] = Math.round(100 * (3 * t * t - 2 * t * t * t));
    }
    ACE_Schedule.setPlannedValue(pvCurve);

    // ── Settle the graph ──────────────────────────────────────
    ACE.settle();

    return ACE.summary();
  }

  return {
    PLANT: PLANT,
    load: load
  };

})();

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACE_Data;
}
