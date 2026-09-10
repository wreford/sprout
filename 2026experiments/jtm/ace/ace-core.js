/**
 * ACE Core — Atomic Constraint Engine
 *
 * One primitive: the atom.
 * Two completion kinds: manual, derived.
 * Three link types: contains, requires, tag.
 *
 * Completion is computed by settling the graph (least fixed point).
 * Progress never reverses. Loops can't cheat.
 */

const ACE = (function () {
  'use strict';

  // ── Atom Store ──────────────────────────────────────────────

  const atoms = {};      // id → atom
  const children = {};   // id → Set of child ids (reverse of parent)
  const dependents = {}; // id → Set of ids that require this atom

  /**
   * Create an atom. Returns the atom.
   *
   * kind: 'manual' | 'derived'
   *   manual  — a person clears it with evidence
   *   derived — done when all requires AND all contains are done
   */
  function create(spec) {
    if (!spec.id) throw new Error('Atom requires an id');
    if (atoms[spec.id]) throw new Error('Atom ' + spec.id + ' already exists');

    const atom = {
      id:       spec.id,
      name:     spec.name || spec.id,
      type:     spec.type || 'atom',
      kind:     spec.kind || 'derived',
      tags:     Array.isArray(spec.tags) ? spec.tags.slice() : [],
      requires: [],
      contains: [],

      // State (not part of the spec — internal)
      _complete: false,
      _evidence: null,
      _narrative: null,
      _parent: null
    };

    atoms[atom.id] = atom;
    children[atom.id] = new Set();
    dependents[atom.id] = new Set();

    // Wire up relationships from spec
    if (Array.isArray(spec.requires)) {
      spec.requires.forEach(function (rid) { link(atom.id, 'requires', rid); });
    }
    if (Array.isArray(spec.contains)) {
      spec.contains.forEach(function (cid) { link(atom.id, 'contains', cid); });
    }

    return atom;
  }

  /** Get an atom by id. Returns undefined if not found. */
  function get(id) {
    return atoms[id];
  }

  /** Remove an atom and all its links. */
  function remove(id) {
    var a = atoms[id];
    if (!a) return;

    // Remove from parent's children set
    if (a._parent && children[a._parent]) {
      children[a._parent].delete(id);
    }

    // Remove from dependents of everything it requires
    a.requires.forEach(function (rid) {
      if (dependents[rid]) dependents[rid].delete(id);
    });

    // Remove children's parent pointers
    a.contains.forEach(function (cid) {
      var child = atoms[cid];
      if (child) child._parent = null;
    });

    delete atoms[id];
    delete children[id];
    delete dependents[id];
  }

  // ── Links ───────────────────────────────────────────────────

  /**
   * Add a link between two atoms.
   *
   * rel: 'requires' | 'contains'
   *
   * contains enforces one parent — adding a second parent throws.
   * requires checks for cycles — adding a cycle throws.
   */
  function link(fromId, rel, toId) {
    var from = atoms[fromId];
    var to = atoms[toId];
    if (!from) throw new Error('Unknown atom: ' + fromId);
    if (!to) throw new Error('Unknown atom: ' + toId);

    if (rel === 'contains') {
      // One parent rule
      if (to._parent && to._parent !== fromId) {
        throw new Error(toId + ' already has parent ' + to._parent + '; cannot add second parent ' + fromId);
      }
      if (from.contains.indexOf(toId) === -1) {
        from.contains.push(toId);
        children[fromId].add(toId);
        to._parent = fromId;
      }
    } else if (rel === 'requires') {
      // Cycle check
      if (wouldCycle(fromId, toId)) {
        throw new Error('Adding ' + fromId + ' requires ' + toId + ' would create a cycle');
      }
      if (from.requires.indexOf(toId) === -1) {
        from.requires.push(toId);
        dependents[toId].add(fromId);
      }
    } else {
      throw new Error('Unknown link type: ' + rel + '. Use requires or contains.');
    }
  }

  /** Remove a link. */
  function unlink(fromId, rel, toId) {
    var from = atoms[fromId];
    if (!from) return;

    if (rel === 'contains') {
      var idx = from.contains.indexOf(toId);
      if (idx >= 0) {
        from.contains.splice(idx, 1);
        if (children[fromId]) children[fromId].delete(toId);
        var to = atoms[toId];
        if (to && to._parent === fromId) to._parent = null;
      }
    } else if (rel === 'requires') {
      var idx2 = from.requires.indexOf(toId);
      if (idx2 >= 0) {
        from.requires.splice(idx2, 1);
        if (dependents[toId]) dependents[toId].delete(fromId);
      }
    }
  }

  /** Would adding fromId requires toId create a cycle? */
  function wouldCycle(fromId, toId) {
    // If toId can reach fromId via requires, it's a cycle
    var visited = {};
    var stack = [fromId];
    while (stack.length) {
      var current = stack.pop();
      if (current === toId) return true; // toId reaches fromId — cycle
      if (visited[current]) continue;
      visited[current] = true;
      var a = atoms[current];
      if (a) {
        // Walk upstream: who requires current?
        if (dependents[current]) {
          dependents[current].forEach(function (dep) { stack.push(dep); });
        }
      }
    }
    return false;
  }

  // ── Completion Engine ───────────────────────────────────────

  /**
   * Settle the graph. Compute completion for all derived atoms.
   * Returns the count of atoms that changed state.
   *
   * This is the least fixed point from ACT Section 3.
   * Manual atoms are only complete if explicitly cleared.
   * Derived atoms are complete when all requires AND contains are complete.
   */
  function settle() {
    var changed = true;
    var totalChanged = 0;

    while (changed) {
      changed = false;
      for (var id in atoms) {
        var a = atoms[id];
        if (a.kind !== 'derived') continue;

        var was = a._complete;
        var allReqs = a.requires.length === 0 || a.requires.every(function (rid) {
          var r = atoms[rid];
          return r && r._complete;
        });
        var allChildren = a.contains.length === 0 || a.contains.every(function (cid) {
          var c = atoms[cid];
          return c && c._complete;
        });

        // Derived atom needs at least one input to be meaningful
        var hasInputs = a.requires.length > 0 || a.contains.length > 0;
        a._complete = hasInputs && allReqs && allChildren;

        if (a._complete !== was) {
          changed = true;
          totalChanged++;
        }
      }
    }

    return totalChanged;
  }

  /**
   * Clear a manual atom with evidence.
   * Returns true if the atom was cleared, false if already complete or not manual.
   */
  function complete(id, evidence, narrative) {
    var a = atoms[id];
    if (!a) return false;
    if (a.kind !== 'manual') return false;
    if (a._complete) return false;

    a._complete = true;
    a._evidence = evidence || null;
    a._narrative = narrative || null;

    return true;
  }

  /** Is this atom complete? */
  function isComplete(id) {
    var a = atoms[id];
    return a ? a._complete : false;
  }

  // ── Query ───────────────────────────────────────────────────

  /** Return all atoms as an array. */
  function all() {
    var result = [];
    for (var id in atoms) result.push(atoms[id]);
    return result;
  }

  /**
   * Query atoms by filter.
   * filter: { type, tag, complete, search }
   */
  function query(filter) {
    var result = all();
    if (filter.type) {
      result = result.filter(function (a) { return a.type === filter.type; });
    }
    if (filter.tag) {
      result = result.filter(function (a) { return a.tags.indexOf(filter.tag) >= 0; });
    }
    if (filter.complete !== undefined) {
      result = result.filter(function (a) { return a._complete === filter.complete; });
    }
    if (filter.search) {
      var s = filter.search.toLowerCase();
      result = result.filter(function (a) {
        return a.id.toLowerCase().indexOf(s) >= 0 || a.name.toLowerCase().indexOf(s) >= 0;
      });
    }
    return result;
  }

  /**
   * The workable set: atoms not complete whose entire requires list is complete.
   * These are the atoms a crew can pick up right now.
   */
  function workable() {
    return all().filter(function (a) {
      if (a._complete) return false;
      if (a.kind === 'derived') return false; // derived atoms aren't "worked"
      return a.requires.every(function (rid) {
        var r = atoms[rid];
        return r && r._complete;
      });
    });
  }

  // ── Rollup ──────────────────────────────────────────────────

  /**
   * Percent complete for an atom.
   * Counts completed descendants / total descendants in the contains tree.
   * Weight defaults to 1 per atom.
   */
  function percentComplete(id) {
    var a = atoms[id];
    if (!a) return 0;

    var leaves = descendants(id);
    if (leaves.length === 0) return a._complete ? 100 : 0;

    var done = 0;
    leaves.forEach(function (lid) {
      if (atoms[lid] && atoms[lid]._complete) done++;
    });
    return Math.round(done / leaves.length * 100);
  }

  /** All descendant ids (recursive contains). */
  function descendants(id) {
    var result = [];
    var a = atoms[id];
    if (!a) return result;

    a.contains.forEach(function (cid) {
      result.push(cid);
      result = result.concat(descendants(cid));
    });
    return result;
  }

  /** Parent chain (breadcrumb). */
  function ancestors(id) {
    var chain = [];
    var a = atoms[id];
    while (a && a._parent) {
      chain.unshift(a._parent);
      a = atoms[a._parent];
    }
    return chain;
  }

  // ── Export ───────────────────────────────────────────────────

  /** Export all atoms as a clean JSON array (no internal state). */
  function exportJSON() {
    return all().map(function (a) {
      var obj = { id: a.id, name: a.name, type: a.type, kind: a.kind };
      if (a.tags.length) obj.tags = a.tags;
      if (a.requires.length) obj.requires = a.requires;
      if (a.contains.length) obj.contains = a.contains;
      if (a._complete) obj.complete = true;
      if (a._evidence) obj.evidence = a._evidence;
      if (a._narrative) obj.narrative = a._narrative;
      return obj;
    });
  }

  /** Import atoms from a JSON array. Clears existing store. */
  function importJSON(arr) {
    reset();
    // Two passes: create all atoms first, then wire links
    arr.forEach(function (spec) {
      var s = { id: spec.id, name: spec.name, type: spec.type, kind: spec.kind || 'derived', tags: spec.tags || [] };
      create(s);
      if (spec.complete) atoms[spec.id]._complete = true;
      if (spec.evidence) atoms[spec.id]._evidence = spec.evidence;
      if (spec.narrative) atoms[spec.id]._narrative = spec.narrative;
    });
    arr.forEach(function (spec) {
      (spec.requires || []).forEach(function (rid) { if (atoms[rid]) link(spec.id, 'requires', rid); });
      (spec.contains || []).forEach(function (cid) { if (atoms[cid]) link(spec.id, 'contains', cid); });
    });
    settle();
  }

  /** Clear everything. */
  function reset() {
    for (var id in atoms) delete atoms[id];
    for (var id2 in children) delete children[id2];
    for (var id3 in dependents) delete dependents[id3];
  }

  /** Summary for LLM context. */
  function summary() {
    var total = all().length;
    var done = query({ complete: true }).length;
    var types = {};
    all().forEach(function (a) { types[a.type] = (types[a.type] || 0) + 1; });
    return {
      atoms: total,
      complete: done,
      percent: total > 0 ? Math.round(done / total * 100) : 0,
      types: types,
      workable: workable().length
    };
  }

  // ── Public API ──────────────────────────────────────────────

  return {
    create:          create,
    get:             get,
    remove:          remove,
    link:            link,
    unlink:          unlink,
    settle:          settle,
    complete:        complete,
    isComplete:      isComplete,
    all:             all,
    query:           query,
    workable:        workable,
    percentComplete: percentComplete,
    descendants:     descendants,
    ancestors:       ancestors,
    exportJSON:      exportJSON,
    importJSON:      importJSON,
    reset:           reset,
    summary:         summary
  };

})();

// Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACE;
}
