#!/usr/bin/env node

/**
 * Convert DAT models of tasks and network to JSON format
 * 
 * Usage:
 *  node dat-to-json.js -d input.dat -n network.json -t schedule.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { datToModel } from '../shared/datConversions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
let datFile = null;
let outputNetworkFile = null;
let outputScheduleFile = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-d' && i + 1 < args.length) {
        datFile = args[i + 1];
        i++;
    } else if (args[i] === '-n' && i + 1 < args.length) {
        outputNetworkFile = args[i + 1];
        i++;
    } else if (args[i] === '-t' && i + 1 < args.length) {
        outputScheduleFile = args[i + 1];
        i++;
    }
}

if(!datFile) {
    console.error('Error: Input DAT file not specified. Use -d <input.dat>');
    process.exit(1);
}

if(!outputNetworkFile && !outputScheduleFile) {
    console.error('Error: At least one output file must be specified. Use -n <network.json> and/or -t <schedule.json>');
    process.exit(1);
}

if(!fs.existsSync(path.resolve(__dirname, datFile))) { 
    console.error(`Error: DAT file "${datFile}" does not exist.`);
    process.exit(1);
}

if(outputNetworkFile && outputScheduleFile && outputNetworkFile === outputScheduleFile) {
    console.error('Error: Output network and schedule files must be different.');
    process.exit(1);
}

function main() {
    const datString = fs.readFileSync(path.resolve(__dirname, datFile), 'utf-8');
    const model = datToModel(datString);

    if(outputNetworkFile) {
        const networkData = {
            nodes: model.nodes,
            connections: model.connections
        };
        fs.writeFileSync(path.resolve(__dirname, outputNetworkFile), JSON.stringify(networkData, null, 2), 'utf-8');
        console.log(`Network JSON written to "${outputNetworkFile}"`);
    }

    if(outputScheduleFile) {
        const scheduleData = {
            tasks: model.tasks,
            precedences: model.precedences
        };
        fs.writeFileSync(path.resolve(__dirname, outputScheduleFile), JSON.stringify(scheduleData, null, 2), 'utf-8');
        console.log(`Schedule JSON written to "${outputScheduleFile}"`);
    }
}


// Run main if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}