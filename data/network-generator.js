#!/usr/bin/env node

/**
 * Network Generator CLI
 * Generates network topology instances and saves them to JSON files
 * 
 * Usage:
 *   node network-generator.js --preset small
 *   node network-generator.js --topology star --mist 5 --edge 3 --density 0.7
 *   node network-generator.js --batch presets
 *   node network-generator.js --batch random --count 10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '../shared/networkGenerator.js';
const { PRESETS, GENERATORS } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        preset: null,
        topology: null,
        mistCount: null,
        edgeCount: null,
        includeCloud: true,
        connectionDensity: 0.5,
        clusterCount: 2,
        outputDir: './instances/networks',
        outputName: null,
        batch: null,
        count: 1,
        viewportWidth: 800,
        viewportHeight: 600
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--preset':
            case '-p':
                options.preset = args[++i];
                break;
            case '--topology':
            case '-t':
                options.topology = args[++i].toUpperCase();
                break;
            case '--mist':
            case '-m':
                options.mistCount = parseInt(args[++i]);
                break;
            case '--edge':
            case '-e':
                options.edgeCount = parseInt(args[++i]);
                break;
            case '--cloud':
            case '-c':
                options.includeCloud = args[++i].toLowerCase() === 'true';
                break;
            case '--density':
            case '-d':
                options.connectionDensity = parseFloat(args[++i]);
                break;
            case '--clusters':
                options.clusterCount = parseInt(args[++i]);
                break;
            case '--output':
            case '-o':
                options.outputDir = args[++i];
                break;
            case '--name':
            case '-n':
                options.outputName = args[++i];
                break;
            case '--batch':
            case '-b':
                options.batch = args[++i];
                break;
            case '--count':
                options.count = parseInt(args[++i]);
                break;
            case '--viewport':
                const dims = args[++i].split('x');
                options.viewportWidth = parseInt(dims[0]);
                options.viewportHeight = parseInt(dims[1]);
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }

    return options;
}

/**
 * Print help information
 */
function printHelp() {
    console.log(`
Network Generator CLI

Usage:
  node network-generator.js [options]

Options:
  -p, --preset <name>           Use a preset configuration
                                Available: ${Object.keys(PRESETS).join(', ')}
  
  -t, --topology <type>         Network topology type
                                Available: STAR, RANDOM, HIERARCHICAL, CLUSTER
  
  -m, --mist <count>           Number of Mist nodes
  -e, --edge <count>           Number of Edge nodes
  -c, --cloud <true|false>     Include Cloud node (default: true)
  -d, --density <value>        Connection density 0-1 (default: 0.5)
  --clusters <count>           Number of clusters (for CLUSTER topology)
  
  -o, --output <dir>           Output directory (default: ./instances/networks)
  -n, --name <name>            Output filename (without extension)
  
  -b, --batch <mode>           Batch generation mode
                                'presets' - Generate all presets
                                'random' - Generate random configurations
  --count <n>                  Number of instances for batch mode (default: 1)
  
  --viewport <WxH>             Viewport dimensions (default: 800x600)
  -h, --help                   Show this help

Examples:
  # Generate using a preset
  node network-generator.js --preset small

  # Generate custom network
  node network-generator.js --topology RANDOM --mist 5 --edge 3 --density 0.7

  # Generate all presets
  node network-generator.js --batch presets

  # Generate 10 random networks
  node network-generator.js --batch random --count 10

  # Custom topology with specific name
  node network-generator.js -t STAR -m 4 -e 2 -n my-star-network
    `);
}

/**
 * Generate a single network instance
 */
function generateNetwork(config) {
    const generatorClass = GENERATORS[config.generator || config.topology];
    
    if (!generatorClass) {
        throw new Error(`Unknown generator type: ${config.generator || config.topology}`);
    }

    const generator = new generatorClass(config);
    return generator.generate();
}

/**
 * Save network to JSON file
 */
function saveNetwork(networkData, filename, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(networkData, null, 2));
    
    console.log(`✓ Generated: ${filepath}`);
    console.log(`  Nodes: ${networkData.nodes.length} (${networkData.nodes.filter(n => n.type === 'MIST').length} Mist, ${networkData.nodes.filter(n => n.type === 'EDGE').length} Edge, ${networkData.nodes.filter(n => n.type === 'CLOUD').length} Cloud)`);
    console.log(`  Connections: ${networkData.connections.length}`);
}

/**
 * Generate network from preset
 */
function generateFromPreset(presetName, options) {
    const preset = PRESETS[presetName];
    
    if (!preset) {
        throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(PRESETS).join(', ')}`);
    }

    const config = {
        ...preset,
        viewportWidth: options.viewportWidth,
        viewportHeight: options.viewportHeight
    };

    const networkData = generateNetwork(config);
    const filename = options.outputName || `${presetName}.json`;
    
    saveNetwork(networkData, filename, options.outputDir);
}

/**
 * Generate network from custom configuration
 */
function generateFromConfig(options) {
    if (!options.topology) {
        throw new Error('Topology type is required. Use --topology or -t');
    }
    
    if (options.mistCount === null || options.edgeCount === null) {
        throw new Error('Mist and Edge counts are required. Use --mist and --edge');
    }

    const config = {
        generator: options.topology,
        mistCount: options.mistCount,
        edgeCount: options.edgeCount,
        includeCloud: options.includeCloud,
        connectionDensity: options.connectionDensity,
        clusterCount: options.clusterCount,
        viewportWidth: options.viewportWidth,
        viewportHeight: options.viewportHeight
    };

    const networkData = generateNetwork(config);
    
    const filename = options.outputName || 
        `${options.topology.toLowerCase()}_m${options.mistCount}_e${options.edgeCount}_d${options.connectionDensity}.json`;
    
    saveNetwork(networkData, filename, options.outputDir);
}

/**
 * Generate all preset configurations
 */
function generateAllPresets(options) {
    console.log('Generating all preset configurations...\n');
    
    for (const [presetName, preset] of Object.entries(PRESETS)) {
        try {
            generateFromPreset(presetName, options);
        } catch (error) {
            console.error(`✗ Failed to generate ${presetName}: ${error.message}`);
        }
    }
    
    console.log('\nBatch generation complete!');
}

/**
 * Generate random network configurations
 */
function generateRandomBatch(options) {
    console.log(`Generating ${options.count} random network configurations...\n`);
    
    const topologies = ['STAR', 'RANDOM', 'HIERARCHICAL', 'CLUSTER'];
    
    for (let i = 0; i < options.count; i++) {
        try {
            const topology = topologies[Math.floor(Math.random() * topologies.length)];
            const mistCount = Math.floor(Math.random() * 15) + 2; // 2-16
            const edgeCount = Math.floor(Math.random() * 8) + 1;  // 1-8
            const density = Math.random() * 0.8 + 0.2; // 0.2-1.0
            const includeCloud = Math.random() > 0.2; // 80% chance
            
            const config = {
                generator: topology,
                mistCount,
                edgeCount,
                includeCloud,
                connectionDensity: parseFloat(density.toFixed(2)),
                clusterCount: Math.floor(Math.random() * 3) + 2, // 2-4
                viewportWidth: options.viewportWidth,
                viewportHeight: options.viewportHeight
            };

            const networkData = generateNetwork(config);
            const filename = `random_${i + 1}_${topology.toLowerCase()}_m${mistCount}_e${edgeCount}.json`;
            
            saveNetwork(networkData, filename, options.outputDir);
        } catch (error) {
            console.error(`✗ Failed to generate random network ${i + 1}: ${error.message}`);
        }
    }
    
    console.log('\nBatch generation complete!');
}

/**
 * Main function
 */
function main() {
    try {
        const options = parseArgs();

        console.log('Network Instance Generator\n');

        // Batch mode
        if (options.batch === 'presets') {
            generateAllPresets(options);
        } else if (options.batch === 'random') {
            generateRandomBatch(options);
        }
        // Preset mode
        else if (options.preset) {
            generateFromPreset(options.preset, options);
        }
        // Custom configuration mode
        else if (options.topology) {
            generateFromConfig(options);
        }
        // No valid mode specified
        else {
            console.error('Error: No generation mode specified.');
            console.log('Use --preset, --topology, or --batch. See --help for details.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error(`\nError: ${error.message}\n`);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}