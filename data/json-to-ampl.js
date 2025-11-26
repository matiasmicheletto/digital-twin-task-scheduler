#!/usr/bin/env node
import fs from 'fs';

if (process.argv.length < 5) {
  console.error("Usage: node json-to-ampl.js tasks.json network.json output.dat");
  process.exit(1);
}

const [,, tasksFile, networkFile, outputFile] = process.argv;

const taskData = JSON.parse(fs.readFileSync(tasksFile, "utf8"));
const netData  = JSON.parse(fs.readFileSync(networkFile, "utf8"));

// -------------------------------------------------------------
// Build task index mapping
// -------------------------------------------------------------
const tasks = taskData.tasks;
const tid2idx = new Map();
tasks.forEach((t, i) => tid2idx.set(t.id, i + 1));
const N = tasks.length;

// -------------------------------------------------------------
// Build server list
// -------------------------------------------------------------
const servers = netData.nodes.filter(n =>
  n.type === "MIST" || n.type === "EDGE" || n.type === "CLOUD"
);

const sid2name = new Map();
servers.forEach((s, i) => sid2name.set(s.id, `s${i+1}`));

// -------------------------------------------------------------
// Precedences: (h,i) pairs with integer indices
// -------------------------------------------------------------
const precedences = taskData.precedences.map(p => {
  const from = tid2idx.get(p.from);
  const to   = tid2idx.get(p.to);
  return `(${from},${to})`;
});

// -------------------------------------------------------------
// Task parameters: C, T, D, Mreq, util
// -------------------------------------------------------------
const C = [];
const T = [];
const D = [];
const Mreq = [];
const util = [];

tasks.forEach((t, idx) => {
  const i = idx + 1;
  C.push(`${i} ${t.C}`);
  T.push(`${i} ${t.T}`);
  D.push(`${i} ${t.D}`);
  Mreq.push(`${i} ${t.M}`);
  util.push(`${i} ${t.a}`);     // or t.util if your tasks carry another field
});

// -------------------------------------------------------------
// Server parameters: U, MEM
// -------------------------------------------------------------
const U = [];
const MEM = [];

servers.forEach(s => {
  const name = sid2name.get(s.id);
  U.push(`${name} ${s.u}`);
  MEM.push(`${name} ${s.memory}`);
});

// -------------------------------------------------------------
// Communication delays (Delta matrix)
// -------------------------------------------------------------
const S = servers.length;
const Delta = Array.from({ length: S }, () => Array(S).fill(0));

netData.connections.forEach(c => {
  const a = sid2name.get(c.from);
  const b = sid2name.get(c.to);
  if (!a || !b) return;

  const i = parseInt(a.slice(1)) - 1;
  const j = parseInt(b.slice(1)) - 1;
  Delta[i][j] = c.delay;

  if (c.bidirectional) {
    Delta[j][i] = c.delay;
  }
});

// -------------------------------------------------------------
// Build AMPL format
// -------------------------------------------------------------
let out = "";

out += "data;\n\n";

out += "set TASKS := " + tasks.map((_,i)=>i+1).join(" ") + ";\n";
out += "set SERVERS := " + servers.map(s=>sid2name.get(s.id)).join(" ") + ";\n\n";

out += "# Precedences\n";
out += "set PRE := " + precedences.join(" ") + ";\n\n";

out += "param: C :=\n" + C.join("\n") + "\n;\n\n";
out += "param: T :=\n" + T.join("\n") + "\n;\n\n";
out += "param: D :=\n" + D.join("\n") + "\n;\n\n";
out += "param: Mreq :=\n" + Mreq.join("\n") + "\n;\n\n";
out += "param: util :=\n" + util.join("\n") + "\n;\n\n";

out += "param: U :=\n" + U.join("\n") + "\n;\n\n";
out += "param: MEM :=\n" + MEM.join("\n") + "\n;\n\n";

out += "param Delta:\n";
out += "      " + servers.map(s=>sid2name.get(s.id)).join("   ") + " :=\n";

servers.forEach((s,i) => {
  const rowName = sid2name.get(s.id);
  const row = Delta[i].map(d => (d===undefined?0:d));
  out += rowName + "   " + row.join("   ") + "\n";
});

out += ";\n\n";

out += "param BigM := 100;\n\n";
out += "end;\n";

fs.writeFileSync(outputFile, out, "utf8");
console.log(`AMPL data file written to ${outputFile}`);