#!/usr/bin/env node

/**
 * Task Graph Generator CLI
 * 
 * Usage: node task-generator.js [options]
 * 
 * Examples:
 *  # Generate all presets
 * node task-generator.js presets
 * # Generate test suite
 * node task-generator.js test-suite
 * # Generate custom instance
 * node task-generator.js custom --config my-config.json --file my-instance.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TaskGenerator, { PRESETS } from '../shared/taskGenerator.js';
import GraphLayout from '../shared/graphLayout.js';

// For ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load presets from JSON file if it exists
const PRESETS_FILE = './presets.json';
let PRES = PRESETS; // Mutable copy of default presets


if (fs.existsSync(PRESETS_FILE)) {
    try {
        const presetsData = fs.readFileSync(PRESETS_FILE, 'utf8');
        PRES = JSON.parse(presetsData);
        console.log(`Loaded presets from ${PRESETS_FILE}`);
    } catch (error) {
        console.warn(`Warning: Could not load ${PRESETS_FILE}, using default presets`);
        console.warn(`Error: ${error.message}`);
    }
}

/**
 * Configuration
 */
const CONFIG = {
    outputDir: './instances/tasks',
    applyLayout: false,
    layoutAlgorithm: 'hierarchical', // 'hierarchical', 'force', 'circular', 'grid'
    layoutConfig: {
        width: 1200,
        height: 800,
        horizontalSpacing: 150,
        verticalSpacing: 100,
        marginX: 100,
        marginY: 80
    }
};

/**
 * Generate a single task graph instance
 */
function generateInstance(config, name = 'instance') {
    console.log(`Generating ${name}...`);
    
    // Create generator
    const generator = new TaskGenerator(config);
    
    // Generate schedule
    const schedule = generator.generate();
    
    // Apply layout if requested
    if (CONFIG.applyLayout) {
        const layout = new GraphLayout(CONFIG.layoutConfig);
        layout.applyLayout(schedule.toGraph(), CONFIG.layoutAlgorithm);
        console.log(`  Applied ${CONFIG.layoutAlgorithm} layout`);
    }
    
    // Get graph representation
    const graph = schedule.toGraph();
    
    console.log(`  Generated ${graph.vertices.length} tasks, ${graph.edges.length} precedences`);
    
    return {
        metadata: {
            name: name,
            generatedAt: new Date().toISOString(),
            config: config,
            stats: {
                numTasks: graph.vertices.length,
                numPrecedences: graph.edges.length,
                graphType: config.graphType || 'unknown'
            }
        },
        tasks: graph.vertices,
        precedences: graph.edges
    };
}

/**
 * Save instance to JSON file
 */
function saveInstance(instance, filename) {
    const outputPath = path.join(CONFIG.outputDir, filename);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(
        outputPath,
        JSON.stringify(instance, null, 2),
        'utf8'
    );
    
    console.log(`  Saved to ${outputPath}`);
    console.log(`  File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

/**
 * Generate multiple instances
 */
function generateBatch(configs) {
    //console.log('='.repeat(60));
    console.log('Task Graph Generator - Batch Generation');
    //console.log('='.repeat(60));
    console.log();
    
    configs.forEach(({ config, name, filename }) => {
        try {
            const instance = generateInstance(config, name);
            saveInstance(instance, filename);
            console.log();
        } catch (error) {
            console.error(`Error generating ${name}:`, error.message);
            console.log();
        }
    });
    
    //console.log('='.repeat(60));
    console.log('Batch generation complete!');
    console.log(`Output directory: ${path.resolve(CONFIG.outputDir)}`);
    //console.log('='.repeat(60));
}

/**
 * Generate all preset configurations
 */
function generateAllPresets() {
    const configs = Object.keys(PRES).map(presetName => ({
        config: PRES[presetName],
        name: `Preset: ${presetName}`,
        filename: `${presetName}.json`
    }));
    
    generateBatch(configs);
}

/**
 * Generate custom test suite
 */
function generateTestSuite() {
    const configs = [
        // Varying sizes
        {
            config: { numTasks: 10, graphType: 'random', density: 0.3 },
            name: 'Small Random (10 tasks)',
            filename: 'test-small-random.json'
        },
        {
            config: { numTasks: 50, graphType: 'random', density: 0.3 },
            name: 'Medium Random (50 tasks)',
            filename: 'test-medium-random.json'
        },
        {
            config: { numTasks: 100, graphType: 'random', density: 0.2 },
            name: 'Large Random (100 tasks)',
            filename: 'test-large-random.json'
        },
        
        // Different topologies
        {
            config: { numTasks: 20, graphType: 'chain' },
            name: 'Chain Topology',
            filename: 'test-chain.json'
        },
        {
            config: { numTasks: 30, graphType: 'tree', branchingFactor: 3 },
            name: 'Tree Topology',
            filename: 'test-tree.json'
        },
        {
            config: { numTasks: 25, graphType: 'fork-join', forkJoinGroups: 4 },
            name: 'Fork-Join Topology',
            filename: 'test-fork-join.json'
        },
        {
            config: { numTasks: 40, graphType: 'layered', layers: 5 },
            name: 'Layered Topology',
            filename: 'test-layered.json'
        },
        
        // Different densities
        {
            config: { numTasks: 30, graphType: 'random', density: 0.1 },
            name: 'Sparse Graph (10% density)',
            filename: 'test-sparse.json'
        },
        {
            config: { numTasks: 30, graphType: 'random', density: 0.5 },
            name: 'Dense Graph (50% density)',
            filename: 'test-dense.json'
        },
        
        // Different utilizations
        {
            config: { 
                numTasks: 20, 
                graphType: 'layered',
                targetUtilization: 0.5 
            },
            name: 'Medium Utilization (50%)',
            filename: 'test-util-50.json'
        },
        {
            config: { 
                numTasks: 20, 
                graphType: 'layered',
                targetUtilization: 0.8 
            },
            name: 'High Utilization (80%)',
            filename: 'test-util-80.json'
        },
        
        // Bimodal execution times
        {
            config: {
                numTasks: 30,
                graphType: 'random',
                density: 0.3,
                C: {
                    strategy: 'bimodal',
                    modes: [
                        { weight: 0.7, min: 1, max: 3 },
                        { weight: 0.3, min: 10, max: 20 }
                    ]
                }
            },
            name: 'Bimodal Execution Times',
            filename: 'test-bimodal.json'
        }
    ];
    
    generateBatch(configs);
}

/**
 * Generate a single custom instance
 */
function generateCustom(customConfig, outputFilename) {
    //console.log('='.repeat(60));
    console.log('Task Graph Generator - Custom Instance');
    //console.log('='.repeat(60));
    console.log();
    
    const instance = generateInstance(customConfig, 'Custom Instance');
    saveInstance(instance, outputFilename);
    
    console.log();
    //console.log('='.repeat(60));
    console.log('Generation complete!');
    console.log(`Output file: ${path.resolve(CONFIG.outputDir, outputFilename)}`);
    //console.log('='.repeat(60));
}

/** 
 * Validate preset format provided in JSON file
 */
function validatePresetFormat(presets) {
    if (typeof presets !== 'object' || presets === null || Array.isArray(presets)) {
        throw new Error('Presets must be a JSON object with preset names as keys.');
    }

    const keys = Object.keys(presets);
    if (keys.length === 0) {
        throw new Error('Presets object is empty.');
    }

    keys.forEach(presetName => {
        const config = presets[presetName];
        if (typeof config !== 'object' || config === null || Array.isArray(config)) {
            throw new Error(
                `Preset "${presetName}" is invalid. Each preset must be an object of configuration options.`
            );
        }

        // Optional: check for required fields
        const requiredFields = ['numTasks', 'graphType'];
        requiredFields.forEach(field => {
            if (!(field in config)) {
                throw new Error(
                    `Preset "${presetName}" is missing required field "${field}".`
                );
            }
        });
    });

    return true; // passed validation
}


/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        return { mode: 'help' };
    }
    
    const mode = args[0];
    const options = {};
    
    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            options[key] = value;
            i++;
        }
    }
    
    return { mode, options };
}

/**
 * Display help
 */
function showHelp() {
    console.log(`
Task Graph Generator CLI

Usage:
  node task-generator.js [mode] [options]

Modes:
  presets              Generate all preset configurations
  test-suite           Generate comprehensive test suite
  custom               Generate custom instance (requires --config)
  help                 Show this help message

Options:
  --output DIR     Output directory (default: ./instances/tasks)
  --layout ALGORITHM   Layout algorithm: hierarchical, force, circular, grid
  --no-layout          Don't apply automatic layout
  --config FILE        JSON config file for custom generation
  --name NAME          Instance name for custom generation
  --file FILENAME      Output filename for custom generation
  --presets FILE       Load presets from JSON file (default: ./presets.json)

Examples:
  # Generate all presets
  node task-generator.js presets

  # Generate presets from custom file
  node task-generator.js presets --presets ./my-presets.json

  # Generate test suite with custom output directory
  node task-generator.js test-suite --output ./my-tests

  # Generate custom instance from config file
  node task-generator.js custom --config my-config.json --file my-instance.json

  # Generate with force-directed layout
  node task-generator.js presets --layout force

Preset Configurations:
  - small: 5 tasks, chain topology
  - medium: 20 tasks, layered topology
  - largeSparse: 100 tasks, 10% density
  - largeDense: 50 tasks, 40% density
  - pipeline: 30 tasks, fork-join pattern
  - highUtilization: 25 tasks, 90% utilization
`);
}

/**
 * Main execution
 */
function main() {
    const { mode, options } = parseArgs();

    // Validate arguments
    if( !options ){
        console.error('Error: Invalid arguments');
        showHelp();
        process.exit(1);
    }
    
    // Apply options
    if (options['output']) {
        CONFIG.outputDir = options['output'];
    }
    
    if (options['layout']) {
        CONFIG.layoutAlgorithm = options['layout'];
    }
    
    if (options['no-layout'] !== undefined) {
        CONFIG.applyLayout = false;
    }
    
    // Load custom presets file if specified
    if (options['presets']) {
        try {
            const presetsPath = path.resolve(options['presets']);
            const presetsData = fs.readFileSync(presetsPath, 'utf8');
            PRES = JSON.parse(presetsData);
            validatePresetFormat(PRES);
            console.log(`Loaded presets from ${presetsPath}\n`);
        } catch (error) {
            console.error(`Error loading presets file: ${error.message}`);
            process.exit(1);
        }
    }
    
    // Execute based on mode
    switch (mode) {
        case 'presets':
            generateAllPresets();
            break;
            
        case 'test-suite':
            generateTestSuite();
            break;
            
        case 'custom':
            if (!options['config']) {
                console.error('Error: --config option required for custom mode');
                console.log('Use: node task-generator.js help');
                process.exit(1);
            }
            
            try {
                const configPath = path.resolve(options['config']);
                const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const outputFile = options['file'] || 'custom-instance.json';
                
                generateCustom(customConfig, outputFile);
            } catch (error) {
                console.error('Error loading config file:', error.message);
                process.exit(1);
            }
            break;
            
        case 'help':
        default:
            showHelp();
            break;
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export for use as module
export { generateInstance, saveInstance, generateBatch, CONFIG };