#!/usr/bin/env node

/**
 * Convert CPLEX XML solution to CSV
 * Columns: server,start,finish
 *
 * Usage:
 *   node cplex-out-to-csv.js solution.xml output/schedule.csv
 */

import fs from 'fs';
import path from 'path';

if (process.argv.length < 4) {
  console.error('Usage: node cplex-to-csv.js <solution.xml> <output.csv>');
  process.exit(1);
}

const [ , , inputFile, outputFile ] = process.argv;

// --- Read XML ---------------------------------------------------------------

const xml = fs.readFileSync(inputFile, 'utf8');

// --- Parse variables ---------------------------------------------------------

const varRegex = /<variable\s+name="([^"]+)"[^>]*value="([^"]+)"/g;

const start = {};    // s#i
const finish = {};   // f#i
const server = {};   // psi#i#*#*#server

let match;
while ((match = varRegex.exec(xml)) !== null) {
  const name = match[1];
  const value = Number(match[2]);

  // Start time
  if (name.startsWith('s#')) {
    const t = Number(name.split('#')[1]);
    start[t] = value;
    continue;
  }

  // Finish time
  if (name.startsWith('f#')) {
    const t = Number(name.split('#')[1]);
    finish[t] = value;
    continue;
  }

  // Server allocation (binary)
  if (value === 1 && name.startsWith('psi#')) {
    const parts = name.split('#');
    const task = Number(parts[1]);
    const srv  = Number(parts[4]);

    server[task] = srv;
  }
}

// --- Build ordered task list -------------------------------------------------

const tasks = Object.keys(finish)
  .map(Number)
  .sort((a, b) => a - b);

// --- Prepare output directory ------------------------------------------------

const outDir = path.dirname(outputFile);
if (outDir && outDir !== '.') {
  fs.mkdirSync(outDir, { recursive: true });
}

// --- Write CSV ---------------------------------------------------------------

let csv = 'server,start,finish\n';

for (const t of tasks) {
  const s = start[t] ?? 0;
  const f = finish[t];
  const srv = server[t];

  if (srv === undefined) {
    console.warn(`Warning: task ${t} has no server assignment`);
  }

  csv += `${srv},${s},${f}\n`;
}

fs.writeFileSync(outputFile, csv, 'utf8');

console.log(`CSV written to ${outputFile}`);
