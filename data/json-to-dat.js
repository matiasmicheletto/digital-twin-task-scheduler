#!/usr/bin/env node

/**
 * Convert JSON models of tasks and network to DAT format
 * 
 * Usage:
 *  node json-to-dat.js -t schedule.json -n network.json -o output.dat
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
    if (args[i] === '-t' && i + 1 < args.length) {
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

if(!scheduleFile) {
    console.error('Error: Schedule JSON file not specified. Use -s <schedule.json>');
    process.exit(1);
}

if(!networkFile) {
    console.error('Error: Network JSON file not specified. Use -n <network.json>');
    process.exit(1);
}

if(!outputFile) {
    console.error('Error: Output DAT file not specified. Use -o <output.dat>');
    process.exit(1);
}

if(!fs.existsSync(path.resolve(__dirname, scheduleFile))) {
    console.error(`Error: Schedule file "${scheduleFile}" does not exist.`);
    process.exit(1);
}

if(!fs.existsSync(path.resolve(__dirname, networkFile))) {
    console.error(`Error: Network file "${networkFile}" does not exist.`);
    process.exit(1);
}

const outputDir = path.dirname(path.resolve(__dirname, outputFile));
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
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