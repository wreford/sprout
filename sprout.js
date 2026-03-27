#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const { compile }       = require('./src/compiler');
const { VM }            = require('./src/vm');
const { makeBuiltins, display } = require('./src/builtins');
const { EMPTY }         = require('./src/cell');

function makeVM() {
  return new VM(makeBuiltins());
}

function runSource(src, name = '<input>', vm = null) {
  vm = vm || makeVM();
  const chunk = compile(src, name);
  return vm.run(chunk);
}

function runFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const result = runSource(src, path.basename(file));
  return result;
}

function repl() {
  const vm = makeVM();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  console.log('Sprout 0.1.0  (ctrl+c to exit)');
  rl.prompt();

  rl.on('line', (line) => {
    const src = line.trim();
    if (!src) { rl.prompt(); return; }
    try {
      const chunk  = compile(src);
      const result = vm.run(chunk);
      if (result !== EMPTY) console.log('=> ' + display(result));
    } catch (e) {
      console.error('Error: ' + e.message);
    }
    rl.prompt();
  });

  rl.on('close', () => process.exit(0));
}

const args = process.argv.slice(2);
if (args.length === 0) {
  repl();
} else {
  try {
    const result = runFile(args[0]);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
