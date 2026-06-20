/**
 * ACE Schedule — CPM + Monte Carlo for the Atomic Constraint Engine
 *
 * Depends on ACE from ace-core.js being loaded first.
 * All durations in months. All math is pure functions over ACE atoms.
 */

const ACE_Schedule = (function () {
  'use strict';

  /** Duration storage: atom id -> {min, likely, max} in months */
  const durations = {};

  /** Planned value curve: month -> cumulative planned % */
  const plannedValue = {};

  /** Set a three-point duration estimate for an atom */
  function setDuration(id, min, likely, max) {
    if (min > likely || likely > max) {
      throw new Error('Duration requires min <= likely <= max');
    }
    durations[id] = { min: min, likely: likely, max: max };
  }

  /** Get the likely duration for an atom, defaulting to 0 */
  function getDuration(id) {
    var d = durations[id];
    return d ? d.likely : 0;
  }

  /** Topological sort of atoms by requires (Kahn's algorithm) */
  function topoSort() {
    var allAtoms = ACE.all();
    var inDegree = {};
    var adj = {};
    var ids = [];

    allAtoms.forEach(function (a) {
      ids.push(a.id);
      inDegree[a.id] = 0;
      adj[a.id] = [];
    });

    allAtoms.forEach(function (a) {
      a.requires.forEach(function (rid) {
        if (adj[rid]) {
          adj[rid].push(a.id);
          inDegree[a.id]++;
        }
      });
    });

    var queue = ids.filter(function (id) { return inDegree[id] === 0; });
    var sorted = [];

    while (queue.length) {
      var current = queue.shift();
      sorted.push(current);
      adj[current].forEach(function (nid) {
        inDegree[nid]--;
        if (inDegree[nid] === 0) queue.push(nid);
      });
    }

    return sorted;
  }

  /** Critical Path Method using likely durations */
  function cpm() {
    var order = topoSort();
    var earlyFinish = {};
    var earlyStart = {};

    // Forward pass
    order.forEach(function (id) {
      var a = ACE.get(id);
      if (!a) return;
      var dur = getDuration(id);
      var maxPredFinish = 0;
      a.requires.forEach(function (rid) {
        if (earlyFinish[rid] !== undefined && earlyFinish[rid] > maxPredFinish) {
          maxPredFinish = earlyFinish[rid];
        }
      });
      earlyStart[id] = maxPredFinish;
      earlyFinish[id] = maxPredFinish + dur;
    });

    // Find project finish
    var projectFinish = 0;
    for (var id in earlyFinish) {
      if (earlyFinish[id] > projectFinish) projectFinish = earlyFinish[id];
    }

    // Backward pass
    var lateFinish = {};
    var lateStart = {};
    var reverseOrder = order.slice().reverse();

    reverseOrder.forEach(function (id) {
      var dur = getDuration(id);
      var a = ACE.get(id);
      if (!a) return;

      // Find successors (atoms that require this one)
      var minSuccStart = projectFinish;
      ACE.all().forEach(function (s) {
        if (s.requires.indexOf(id) >= 0 && lateStart[s.id] !== undefined) {
          if (lateStart[s.id] < minSuccStart) minSuccStart = lateStart[s.id];
        }
      });

      lateFinish[id] = minSuccStart;
      lateStart[id] = minSuccStart - dur;
    });

    // Float and critical path
    var floatMap = {};
    var criticalPath = [];
    order.forEach(function (id) {
      floatMap[id] = (lateFinish[id] || 0) - (earlyFinish[id] || 0);
      if (Math.abs(floatMap[id]) < 0.001 && getDuration(id) > 0) {
        criticalPath.push(id);
      }
    });

    return {
      finishes: earlyFinish,
      starts: earlyStart,
      lateFinishes: lateFinish,
      lateStarts: lateStart,
      floats: floatMap,
      criticalPath: criticalPath,
      projectFinish: projectFinish
    };
  }

  /** Sample from a triangular distribution */
  function sampleTriangular(min, likely, max) {
    var u = Math.random();
    var fc = (likely - min) / (max - min);
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (likely - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
    }
  }

  /** Monte Carlo simulation: sample N iterations, return percentiles */
  function monteCarlo(iterations) {
    var order = topoSort();
    var results = [];
    var risks = ACE.query({ type: 'risk' });

    for (var i = 0; i < iterations; i++) {
      var earlyFinish = {};

      // Roll risk impacts once per run
      var riskHits = {};
      risks.forEach(function (r) {
        var prob = parseFloat(r.tags.find(function (t) { return t.startsWith('p:'); })?.replace('p:', '') || '0');
        var impact = parseFloat(r.tags.find(function (t) { return t.startsWith('impact:'); })?.replace('impact:', '') || '0');
        riskHits[r.id] = Math.random() < prob ? impact : 0;
      });

      // Forward pass with sampled durations
      order.forEach(function (id) {
        var a = ACE.get(id);
        if (!a) return;
        var dur = 0;
        var d = durations[id];
        if (d) {
          dur = sampleTriangular(d.min, d.likely, d.max);
        }
        // Add risk impact if this atom has risk dependencies
        a.requires.forEach(function (rid) {
          if (riskHits[rid]) dur += riskHits[rid];
        });

        var maxPredFinish = 0;
        a.requires.forEach(function (rid) {
          if (earlyFinish[rid] !== undefined && earlyFinish[rid] > maxPredFinish) {
            maxPredFinish = earlyFinish[rid];
          }
        });
        earlyFinish[id] = maxPredFinish + dur;
      });

      var projectFinish = 0;
      for (var id2 in earlyFinish) {
        if (earlyFinish[id2] > projectFinish) projectFinish = earlyFinish[id2];
      }
      results.push({ finish: projectFinish, iteration: i });
    }

    results.sort(function (a, b) { return a.finish - b.finish; });

    return {
      p10: results[Math.floor(iterations * 0.1)],
      p50: results[Math.floor(iterations * 0.5)],
      p80: results[Math.floor(iterations * 0.8)],
      p90: results[Math.floor(iterations * 0.9)],
      results: results
    };
  }

  /** Set the planned value curve (month -> cumulative %) */
  function setPlannedValue(curve) {
    for (var m in curve) plannedValue[m] = curve[m];
  }

  /** Earned Schedule: find the month where PV equals current EV */
  function earnedSchedule(currentMonth) {
    var summary = ACE.summary();
    var ev = summary.percent;
    var months = Object.keys(plannedValue).map(Number).sort(function (a, b) { return a - b; });

    if (months.length === 0) return { es: currentMonth, spi_t: 1.0 };

    // Find the month where PV crosses EV
    var es = months[0];
    for (var i = 0; i < months.length - 1; i++) {
      if (plannedValue[months[i]] <= ev && plannedValue[months[i + 1]] >= ev) {
        // Interpolate
        var fraction = (ev - plannedValue[months[i]]) /
                       (plannedValue[months[i + 1]] - plannedValue[months[i]]);
        es = months[i] + fraction * (months[i + 1] - months[i]);
        break;
      }
      if (plannedValue[months[i]] >= ev) {
        es = months[i];
        break;
      }
    }

    var spi_t = currentMonth > 0 ? es / currentMonth : 1.0;

    return { es: es, spi_t: spi_t };
  }

  return {
    setDuration: setDuration,
    getDuration: getDuration,
    durations: durations,
    cpm: cpm,
    monteCarlo: monteCarlo,
    topoSort: topoSort,
    sampleTriangular: sampleTriangular,
    setPlannedValue: setPlannedValue,
    earnedSchedule: earnedSchedule
  };

})();

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACE_Schedule;
}
