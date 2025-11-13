#!/usr/bin/env node

/**
 * Convert JSON models of tasks and network to DAT format
 * 
 * Usage:
 *  node json-to-dat.js -s schedule.json -n network.json -o output.dat
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { modelToDat } from '../shared/datConversions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
let scheduleFile = null;
let networkFile = null;
let outputFile = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-s' && i + 1 < args.length) {
        scheduleFile = args[i + 1];
        i++;
    } else if (args[i] === '-n' && i + 1 < args.length) {
        networkFile = args[i + 1];
        i++;
    } else if (args[i] === '-o' && i + 1 < args.length) {
        outputFile = args[i + 1];
        i++;
    }
}

if (!scheduleFile || !networkFile || !outputFile) {
    console.error('Usage: node json-to-dat.js -s schedule.json -n network.json -o output.dat');
    process.exit(1);
}


function main() {
    const scheduleData = fs.readFileSync(path.resolve(__dirname, scheduleFile), 'utf-8');
    const networkData = fs.readFileSync(path.resolve(__dirname, networkFile), 'utf-8');

    const scheduleJson = JSON.parse(scheduleData);
    const networkJson = JSON.parse(networkData);

    // Combine schedule and network data into a single model
    const model = {
        nodes: networkJson.nodes,
        connections: networkJson.connections,
        tasks: scheduleJson.tasks,
        precedences: scheduleJson.precedences
    };

    const datText = modelToDat(model);

    fs.writeFileSync(path.resolve(__dirname, outputFile), datText, 'utf-8');
    console.log(`DAT file written to ${outputFile}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}