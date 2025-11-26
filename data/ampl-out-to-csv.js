#!/usr/bin/env node
// resultados/ampl-out-to-csv.js
// Usage:
//   node resultados/ampl-out-to-csv.js ampl_output.out resultados/json/task_xxx.json resultados/json/network_yyy.json output.csv

import fs from 'fs';

if (process.argv.length !== 6) {
  console.error('Usage: node instancias/ampl-out-to-csv.js <ampl_out> <tasks.json> <network.json> <out.csv>');
  process.exit(2);
}

const [ , , amplOutPath, tasksJsonPath, networkJsonPath, outCsvPath ] = process.argv;

const amplText = fs.readFileSync(amplOutPath, 'utf8');
const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
const netJson = JSON.parse(fs.readFileSync(networkJsonPath, 'utf8'));

// Tasks
const tasks = tasksJson.tasks || tasksJson.tasksList || [];
if (!Array.isArray(tasks) || tasks.length === 0) {
  console.error('Cannot find tasks array in', tasksJsonPath);
  process.exit(3);
}
const taskLabels = tasks.map((t, idx) => (t.label !== undefined ? t.label : `Task ${idx}`));

// Servers (preserve order used by json-to-dat)
const serverNodes = (netJson.nodes || []).filter(n =>
  n.type === 'MIST' || n.type === 'EDGE' || n.type === 'CLOUD'
);
if (serverNodes.length === 0) {
  console.error('Cannot find server nodes in', networkJsonPath);
  process.exit(4);
}
const serverLabels = serverNodes.map(n => (n.label || n.id));

// Parse combined s f block (e.g. ":    s    f     :=")
let start = {}; // start[i] = starttime
let finish = {}; // finish[i] = finishtime

const sfMatch = amplText.match(/^\s*:?\s*s\s+f\s*:=[\s\S]*?^\s*;/m);
if (sfMatch) {
  // Extract numbers between ":= " and terminating ';'
  const block = sfMatch[0].replace(/^[\s\S]*?:=\s*/,'').replace(/\n\s*;[\s\S]*$/,'').trim();
  block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length>0).forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      const idx = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      const f = parseInt(parts[2], 10);
      if (!isNaN(idx)) { start[idx] = s; finish[idx] = f; }
    }
  });
} else {
  // fallback: separate s[...] and f[...] blocks
  const sMatch = amplText.match(/^\s*s\[[^\]]*\]\s*:=\s*([\s\S]*?)^\s*;/m);
  const fMatch = amplText.match(/^\s*f\[[^\]]*\]\s*:=\s*([\s\S]*?)^\s*;/m);
  if (sMatch) {
    sMatch[1].trim().split(/\r?\n/).forEach(l => {
      const p = l.trim().split(/\s+/);
      if (p.length>=2) { const idx=parseInt(p[0],10); if(!isNaN(idx)) start[idx]=parseInt(p[1],10); }
    });
  }
  if (fMatch) {
    fMatch[1].trim().split(/\r?\n/).forEach(l => {
      const p = l.trim().split(/\s+/);
      if (p.length>=2) { const idx=parseInt(p[0],10); if(!isNaN(idx)) finish[idx]=parseInt(p[1],10); }
    });
  }
}

// Parse L matrix block: "L [*,*]" or "L [*,*] (tr)"
const Lregex = /L\s*\[\*,\*\][\s\S]*?:\s*([^\n\r]+)\n([\s\S]*?)^\s*;/m;
const Lmatch = amplText.match(Lregex);
let Lmatrix = null; // Lmatrix[serverIdx][taskIdx] = value
if (Lmatch) {
  const header = Lmatch[1].trim().split(/\s+/).filter(x => x.length>0);
  const rowsBlock = Lmatch[2].trim().split(/\r?\n/).map(r => r.trim()).filter(r => r.length>0);
  Lmatrix = [];
  for (const row of rowsBlock) {
    const parts = row.split(/\s+/);
    if (parts.length < 2) continue;
    const vals = parts.slice(1).map(v => {
      const n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    });
    Lmatrix.push(vals);
  }
} else {
  console.error('Cannot parse L matrix from AMPL output. Ensure "display L" printed matrix in the .out');
  process.exit(5);
}

// Validate sizes
const numTasks = taskLabels.length;
const numServers = serverLabels.length;

// Align Lmatrix rows to serverLabels count
if (Lmatrix.length !== numServers) {
  if (Lmatrix.length > numServers) {
    Lmatrix = Lmatrix.slice(0, numServers);
  } else {
    while (Lmatrix.length < numServers) Lmatrix.push(new Array(numTasks).fill(0));
  }
}

// Ensure each L row has numTasks columns
Lmatrix = Lmatrix.map(row => {
  if (row.length > numTasks) return row.slice(0,numTasks);
  if (row.length < numTasks) return row.concat(new Array(numTasks - row.length).fill(0));
  return row;
});

// Build CSV rows: iterate tasks 1..numTasks, find server index where Lmatrix[sv][task-1] == 1
const outLines = ['task,server,start,finish'];
for (let t = 1; t <= numTasks; t++) {
  const colIdx = t - 1;
  let assignedServerIdx = -1;
  for (let s = 0; s < Lmatrix.length; s++) {
    if (Lmatrix[s][colIdx] === 1) { assignedServerIdx = s; break; }
  }
  const taskLabel = taskLabels[colIdx] !== undefined ? taskLabels[colIdx] : `Task ${t}`;
  let serverLabel = 'UNASSIGNED';
  let sTime = 0;
  let fTime = 0;

  if (assignedServerIdx >= 0 && serverLabels[assignedServerIdx]) {
    serverLabel = serverLabels[assignedServerIdx];
    if (start[t] !== undefined) sTime = start[t];
    if (finish[t] !== undefined) fTime = finish[t];
  }

  outLines.push(`${taskLabel},${serverLabel},${sTime},${fTime}`);
}

fs.writeFileSync(outCsvPath, outLines.join('\n'), 'utf8');
console.log('Wrote', outCsvPath);
