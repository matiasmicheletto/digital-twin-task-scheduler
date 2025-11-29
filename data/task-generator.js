#!/usr/bin/env node

/**
 * Task Graph Generator CLI
 * Usage: node task-generator.js [options]
 * 
 * Example:
 *  # Generate all presets
 *   node task-generator.js presets
 * # Generate test suite
 *   node task-generator.js test-suite
 * # Generate custom instance
 *   node task-generator.js custom --config my-config.json --file my-instance.json
 * 
 * Options:
 *  --output-dir DIR     Output directory (default: ./instances/tasks)
 *  --layout ALGORITHM   Layout algorithm: hierarchical, force, circular, grid
 *  --no-layout          Don't apply automatic layout
 *  --config FILE        JSON config file for custom generation
 *  --name NAME          Instance name for custom generation
 *  --file FILENAME      Output filename for custom generation
 *  --presets FILE       Load presets from JSON file (default: ./presets.json)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TaskGenerator, { loadPresets } from '../shared/taskGenerator.js';
import GraphLayout from '../shared/graphLayout.js';


/* =============================
   Setup
============================== */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let PRESETS = loadPresets();


/* =============================
   Configuration
============================== */

const CONFIG = {
    outputDir: './instances/tasks',
    applyLayout: false,
    layoutAlgorithm: 'hierarchical',
    layoutConfig: {
        width: 1200,
        height: 800,
        horizontalSpacing: 150,
        verticalSpacing: 100,
        marginX: 100,
        marginY: 80
    }
};


/* =============================
   Entry
============================== */

main();

function main() {
    const { mode, options } = parseArgs();
    ensureDir(CONFIG.outputDir);

    if (options['output-dir']) CONFIG.outputDir = options['output-dir'];
    if (options['layout']) CONFIG.layoutAlgorithm = options['layout'];
    if (options['no-layout']) CONFIG.applyLayout = false;

    // Override presets via file
    if (options['presets']) {
        PRESETS = loadFromFile(options['presets']);
    }

    switch (mode) {
        case 'presets':
            generatePresets();
            break;

        case 'custom':
            generateCustom(options);
            break;

        case 'batch':
            generateBatchFromFile(options);
            break;

        case 'list':
            listPresets();
            break;

        case 'help':
        default:
            help();
    }
}


/* =============================
   Mode handlers
============================== */

function generatePresets() {
    PRESETS.forEach(p => {
        const { id, name, ...config } = p;
        save(id, generate(config, name));
    });
}

function generateCustom(opts) {
    if (!opts.config) die("custom mode requires --config");

    const cfg = JSON.parse(fs.readFileSync(opts.config, 'utf8'));
    const filename = opts.file || 'custom.json';
    save(filename, generate(cfg, opts.name || 'custom'));
}

function generateBatchFromFile(opts) {
    if (!opts.batch) die("batch mode requires --batch FILE");

    const batch = JSON.parse(fs.readFileSync(opts.batch, 'utf8'));
    if (!Array.isArray(batch)) die("Batch file must contain an array");

    batch.forEach(j => {
        const { name, file, ...cfg } = j;
        save(file || safe(name), generate(cfg, name));
    });
}

function listPresets() {
    PRESETS.forEach(p =>
        console.log(`${p.id.padEnd(16)}  ${p.name}`)
    );
}


/* =============================
   Core calls
============================== */

function generate(config, name) {
    console.log(`Generating: ${name}`);

    const gen = new TaskGenerator(config);
    const schedule = gen.generate();

    if (CONFIG.applyLayout) {
        const layout = new GraphLayout(CONFIG.layoutConfig);
        layout.applyLayout(schedule.toGraph(), CONFIG.layoutAlgorithm);
    }

    return {
        metadata: {
            name,
            generatedAt: new Date().toISOString(),
            config
        },
        tasks: schedule.getTasks(),
        precedences: schedule.getPrecedences()
    };
}

function save(name, obj) {
    const file = path.join(CONFIG.outputDir, safe(name) + '.json');
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    console.log(`✔ ${file}`);
}


/* =============================
   Utilities
============================== */

function loadFromFile(file) {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(arr)) die("Presets file must be an array");

    validatePresets(arr);
    return arr;
}

function validatePresets(presets) {
    presets.forEach((p, i) => {
        if (!p.id || !p.graphType || !p.numTasks) {
            die(`Preset ${i} missing id, graphType or numTasks`);
        }
    });
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function safe(name = 'output') {
    return name.replace(/[^\w\d-_]/g, '_');
}

function die(msg) {
    console.error("Error:", msg);
    process.exit(1);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'help';
    const opts = {};

    for (let i = 1; i < args.length; i++) {
        if (!args[i].startsWith('--')) continue;
        const key = args[i].slice(2);
        const val = args[i + 1];
        opts[key] = val && !val.startsWith('--') ? val : true;
        if (opts[key] !== true) i++;
    }

    return { mode, options: opts };
}


/* =============================
   Help
============================== */

function help() {
    console.log(`
Task Generator CLI (JSON Presets)

Usage:
  task-generator <mode> [options]

Modes:

  presets
      Generate all presets

  list
      List available presets

  custom --config FILE [--file NAME]
      Generate one instance

  batch --batch FILE.json
      Batch generation from file

Options:

  --output-dir DIR
  --layout ALGO        hierarchical | force | grid | circular
  --no-layout
  --presets FILE      Override presets

Examples:

  task-generator presets
  task-generator list
  task-generator custom --config demo.json
  task-generator batch --batch suite.json
`);
}


/* =============================
   Exports
============================== */

export { CONFIG, generate, save };
