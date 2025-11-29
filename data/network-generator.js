#!/usr/bin/env node

/**
 * Network Generator CLI
 * Usage: node network-generator.js [options]
 * 
 * Example:
 *  # Generate all presets
 *   node network-generator.js presets
 * # Generate custom instance
 *   node network-generator.js custom --topology star --mistCount 5 --edgeCount 2 --name my-network
 * # Generate batch from JSON file
 *   node network-generator.js batch batch-config.json
 * 
 * Options:
 *  --topology TYPE          Topology type: star, random, hierarchical, cluster
 *  --mistCount N           Number of mist nodes
 *  --edgeCount N           Number of edge nodes
 *  --clusterCount N        Number of clusters (for cluster topology)
 *  --includeCloud true|false Include cloud node
 *  --connectionDensity D   Connection density (0..1) for random topology
 *  --name NAME             Instance name for custom generation
 */

import fs from 'fs';
import path from 'path';
import NetworkGenerator, { loadPresets } from '../shared/networkGenerator.js';

/* =============================
   Presets
============================== */

const PRESETS = loadPresets();


/* =============================
   Configuration
============================== */

const CONFIG = {
    outputDir: './instances/networks',
    defaultFormat: 'json'
};


/* =============================
   Entry point
============================== */

main();


function main() {
    const args = process.argv.slice(2);
    const mode = args[0];

    ensureDir(CONFIG.outputDir);

    switch (mode) {
        case 'presets':
            generatePresets();
            break;

        case 'custom':
            generateCustom(args.slice(1));
            break;

        case 'batch':
            generateBatch(args.slice(1));
            break;

        case 'help':
        case undefined:
            help();
            break;

        case 'list':
            PRESETS.forEach(p => console.log(`- ${p.id}: ${p.name}`));
            break;

        default:
            console.error(`Unknown mode: ${mode}`);
            help();
    }
}


/* =============================
   Modes
============================== */

function generatePresets() {
    console.log("Generating all network presets...\n");

    PRESETS.forEach(p => {
        const { id, name, ...config } = p;
        const generator = new NetworkGenerator(config);
        saveInstance(id, generator.generate());
    });
}


function generateCustom(args) {
    const config = parseKeyArgs(args);

    if (!config.topology)
        throw new Error("custom mode requires --topology");

    const generator = new NetworkGenerator(config);
    saveInstance(config.name || 'custom', generator.generate());
}


function generateBatch(args) {
    const batchConfig = parseJSONArg(args[0]);
    validateBatch(batchConfig);

    batchConfig.forEach(cfg => {
        const { name, ...genCfg } = cfg;
        const generator = new NetworkGenerator(genCfg);
        saveInstance(name || 'batch', generator.generate());
    });
}


/* =============================
   Helpers
============================== */

function saveInstance(name, data) {
    const file = path.join(CONFIG.outputDir, `${safe(name)}.${CONFIG.defaultFormat}`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`✔ Saved: ${file}`);
}


function parseKeyArgs(args) {
    const config = {};
    for (let i = 0; i < args.length; i++) {
        if (!args[i].startsWith('--')) continue;

        const key = args[i].slice(2);
        const value = args[i + 1];

        if (value && !value.startsWith('--')) {
            config[key] = cast(value);
            i++;
        } else {
            config[key] = true;
        }
    }
    return config;
}


function parseJSONArg(p) {
    if (!p) throw new Error("Missing JSON batch file");

    const content = fs.readFileSync(p, 'utf8');
    return JSON.parse(content);
}


function validateBatch(batch) {
    if (!Array.isArray(batch))
        throw new Error("Batch file must contain array of configs");

    batch.forEach((cfg, i) => {
        if (!cfg.topology)
            throw new Error(`Batch item ${i} missing topology`);
    });
}


function cast(val) {
    if (!isNaN(val)) return Number(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
}


function safe(str) {
    return str.replace(/[^\w\-]/g, '_');
}


function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}


/* =============================
   Help
============================== */

function help() {
    console.log(`
Network Generator CLI

Usage:
  network-generator <mode> [options]

Modes:

  presets
      Generate all built-in network presets.

  custom --topology TYPE [options]
      Generate one custom network.

      Options:
        --name NAME
        --topology star|random|hierarchical|cluster
        --mistCount N
        --edgeCount N
        --clusterCount N
        --includeCloud true|false
        --connectionDensity 0..1

      Example:
        network-generator custom --topology random --mistCount 10 --edgeCount 5 --connectionDensity 0.8


  batch <config.json>
      Generate multiple networks from a JSON list.

      Example batch.json:
      [
        { "name": "net-1", "topology": "star", "mistCount": 5, "edgeCount": 2 },
        { "name": "net-2", "topology": "cluster", "mistCount": 12, "edgeCount": 6, "clusterCount": 3 }
      ]


  help
      Show this screen.
`);
}
