import Schedule, { Task } from '../shared/schedule.js';
import small from './presets/small.json' with { type: "json" };
import constantPeriod from './presets/constant-period.json' with { type: "json" };
import medium from './presets/medium.json' with { type: "json" };
import largeSparse from './presets/large-sparse.json' with { type: "json" };
import largeDense from './presets/large-dense.json' with { type: "json" };
import pipeline from './presets/pipeline.json' with { type: "json" };
import highUtilization from './presets/high-utilization.json' with { type: "json" };

/**
 * Tasks Generator for Real-Time Task Scheduling
 * Creates task graphs with configurable parameters and topologies
 */
export default class TaskGenerator {
    constructor(config = {}) {
        this.config = {
            // Graph structure
            numTasks: 10,
            graphType: 'random', // 'chain', 'tree', 'fork-join', 'random', 'layered', 'independent'
            density: 0.3, // For random graphs (0-1, proportion of possible edges)
            layers: 3, // For layered topology
            branchingFactor: 3, // For tree topology
            forkJoinGroups: 2, // Number of parallel groups in fork-join
            
            // MIST tasks (fixed allocation)
            mistTaskRatio: 0.2, // Percentage of tasks with fixed allocation (0-1)
            
            // Parameter ranges and strategies
            C: { 
                strategy: 'uniform', // 'uniform', 'exponential', 'bimodal'
                min: 1, 
                max: 10,
                // For bimodal: lightweight and heavyweight tasks
                modes: [{ weight: 0.7, min: 1, max: 5 }, { weight: 0.3, min: 8, max: 15 }]
            },
            T: { 
                strategy: 'harmonic', // 'harmonic', 'uniform', 'logarithmic'
                values: [10, 20, 40, 80, 160], // Predefined harmonic values
                min: 10,
                max: 100
            },
            D: { 
                strategy: 'implicit', // 'implicit' (D=T), 'constrained' (D=T*ratio), 'arbitrary'
                ratio: 1.0, // For constrained deadlines
                min: 0.5, // Minimum ratio D/T
                max: 1.0  // Maximum ratio D/T
            },
            a: { 
                strategy: 'zero', // 'zero', 'uniform', 'staggered'
                min: 0, 
                max: 0,
                staggerInterval: 5 // For staggered activation
            },
            M: { 
                strategy: 'uniform', // 'uniform', 'proportional' (to C)
                min: 1, 
                max: 5,
                proportionFactor: 0.5 // M = C * factor (for proportional)
            },
            
            // Utilization control (optional)
            targetUtilization: null, // If set, adjusts C values to meet target (0-1)
            
            // Seed for reproducibility (not implemented, but can be added)
            seed: null
        };
        
        // Override defaults with provided config
        Object.assign(this.config, config);
    }
    
    /**
     * Generate a complete schedule with tasks and precedences
     */
    generate() {
        const schedule = new Schedule();
        const tasks = this.generateTasks();
        
        // Add tasks to schedule
        tasks.forEach(task => schedule.addTask(task));
        
        // Create topology based on graph type
        this.createTopology(schedule, tasks);
        
        return schedule;
    }
    
    /**
     * Generate tasks with specified parameters
     */
    generateTasks() {
        const tasks = [];
        const { numTasks, mistTaskRatio } = this.config;
        
        // Determine which tasks are MIST tasks
        const numMistTasks = Math.floor(numTasks * mistTaskRatio);
        const mistIndices = new Set();
        while (mistIndices.size < numMistTasks) {
            mistIndices.add(Math.floor(Math.random() * numTasks));
        }
        
        // Generate periods first (needed for utilization-based generation)
        const periods = [];
        for (let i = 0; i < numTasks; i++) {
            periods.push(this.generatePeriod());
        }
        
        // Calculate target execution times if utilization is specified
        let executionTimes = [];
        if (this.config.targetUtilization !== null) {
            executionTimes = this.generateExecutionTimesForUtilization(periods);
        }
        
        // Generate each task
        for (let i = 0; i < numTasks; i++) {
            const label = `Task ${i}`;
            const mist = mistIndices.has(i);
            
            const T = periods[i];
            const C = executionTimes.length > 0 
                ? executionTimes[i] 
                : this.generateExecutionTime(T);
            const D = this.generateDeadline(T);
            const a = this.generateActivationTime(i);
            const M = this.generateMemory(C);
            
            tasks.push(new Task(label, mist, C, T, D, a, M, null, null));
        }
        
        return tasks;
    }
    
    /**
     * Parameter generation methods
     */
    
    generateExecutionTime(period) {
        const { C } = this.config;
        
        switch (C.strategy) {
            case 'uniform':
                return this.randomInRange(C.min, Math.min(C.max, period - 1));
            
            case 'exponential':
                // Exponentially distributed (more small values)
                const lambda = 2 / (C.min + C.max);
                const value = -Math.log(1 - Math.random()) / lambda;
                return Math.max(C.min, Math.min(C.max, Math.floor(value)));
            
            case 'bimodal':
                // Two modes: lightweight and heavyweight tasks
                const rand = Math.random();
                let cumulative = 0;
                for (let mode of C.modes) {
                    cumulative += mode.weight;
                    if (rand < cumulative) {
                        return this.randomInRange(mode.min, Math.min(mode.max, period - 1));
                    }
                }
                return this.randomInRange(C.min, Math.min(C.max, period - 1));
            
            default:
                return this.randomInRange(C.min, Math.min(C.max, period - 1));
        }
    }
    
    generateExecutionTimesForUtilization(periods) {
        const { targetUtilization, numTasks } = this.config;
        const executionTimes = [];
        
        // UUnifest algorithm: generate utilizations that sum to target
        const utilizations = this.generateUUnifest(numTasks, targetUtilization);
        
        for (let i = 0; i < numTasks; i++) {
            const C = Math.max(1, Math.floor(periods[i] * utilizations[i]));
            executionTimes.push(Math.min(C, periods[i] - 1));
        }
        
        return executionTimes;
    }
    
    generateUUnifest(n, targetU) {
        // UUnifest algorithm for generating task utilizations
        const utilizations = [];
        let sumU = targetU;
        
        for (let i = 1; i < n; i++) {
            const nextSumU = sumU * Math.pow(Math.random(), 1 / (n - i));
            utilizations.push(sumU - nextSumU);
            sumU = nextSumU;
        }
        utilizations.push(sumU);
        
        // Shuffle to avoid bias
        for (let i = utilizations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [utilizations[i], utilizations[j]] = [utilizations[j], utilizations[i]];
        }
        
        return utilizations;
    }
    
    generatePeriod() {
        const { T } = this.config;
        
        switch (T.strategy) {
            case 'harmonic':
                return T.values[Math.floor(Math.random() * T.values.length)];
            
            case 'uniform':
                return this.randomInRange(T.min, T.max);
            
            case 'logarithmic':
                // Logarithmically distributed periods
                const logMin = Math.log(T.min);
                const logMax = Math.log(T.max);
                const logValue = logMin + Math.random() * (logMax - logMin);
                return Math.floor(Math.exp(logValue));
            
            default:
                return this.randomInRange(T.min, T.max);
        }
    }
    
    generateDeadline(period) {
        const { D } = this.config;
        
        switch (D.strategy) {
            case 'implicit':
                return period;
            
            case 'constrained':
                const ratio = D.min + Math.random() * (D.max - D.min);
                return Math.floor(period * ratio);
            
            case 'arbitrary':
                return this.randomInRange(Math.floor(period * D.min), Math.floor(period * D.max));
            
            default:
                return period;
        }
    }
    
    generateActivationTime(taskIndex) {
        const { a } = this.config;
        
        switch (a.strategy) {
            case 'zero':
                return 0;
            
            case 'uniform':
                return this.randomInRange(a.min, a.max);
            
            case 'staggered':
                return taskIndex * a.staggerInterval;
            
            default:
                return 0;
        }
    }
    
    generateMemory(executionTime) {
        const { M } = this.config;
        
        switch (M.strategy) {
            case 'uniform':
                return this.randomInRange(M.min, M.max);
            
            case 'proportional':
                return Math.max(M.min, Math.floor(executionTime * M.proportionFactor));
            
            default:
                return this.randomInRange(M.min, M.max);
        }
    }
    
    /**
     * Topology generation methods
     */
    
    createTopology(schedule, tasks) {
        const { graphType } = this.config;
        
        switch (graphType) {
            case 'chain':
                this.createChain(schedule, tasks);
                break;
            
            case 'tree':
                this.createTree(schedule, tasks);
                break;
            
            case 'fork-join':
                this.createForkJoin(schedule, tasks);
                break;
            
            case 'random':
                this.createRandomDAG(schedule, tasks);
                break;
            
            case 'layered':
                this.createLayered(schedule, tasks);
                break;
            
            case 'independent':
                // No connections
                break;
            
            default:
                this.createRandomDAG(schedule, tasks);
        }
    }
    
    createChain(schedule, tasks) {
        for (let i = 0; i < tasks.length - 1; i++) {
            try {
                schedule.connectTasks(tasks[i].id, tasks[i + 1].id);
            } catch (e) {
                console.warn(`Could not connect ${tasks[i].id} to ${tasks[i + 1].id}`);
            }
        }
    }
    
    createTree(schedule, tasks) {
        const { branchingFactor } = this.config;
        
        if (tasks.length === 0) return;
        
        // BFS-based tree construction
        let currentLevel = [tasks[0]];
        let nextLevelStart = 1;
        
        while (nextLevelStart < tasks.length) {
            const nextLevel = [];
            
            for (let parent of currentLevel) {
                const numChildren = Math.min(
                    branchingFactor,
                    tasks.length - nextLevelStart
                );
                
                for (let i = 0; i < numChildren; i++) {
                    const child = tasks[nextLevelStart++];
                    try {
                        schedule.connectTasks(parent.id, child.id);
                        nextLevel.push(child);
                    } catch (e) {
                        console.warn(`Could not connect ${parent.id} to ${child.id}`);
                    }
                    
                    if (nextLevelStart >= tasks.length) break;
                }
                
                if (nextLevelStart >= tasks.length) break;
            }
            
            currentLevel = nextLevel;
        }
    }
    
    createForkJoin(schedule, tasks) {
        const { forkJoinGroups } = this.config;
        
        if (tasks.length < 3) {
            this.createChain(schedule, tasks);
            return;
        }
        
        // Create fork-join pattern: source -> parallel groups -> sink
        const source = tasks[0];
        const sink = tasks[tasks.length - 1];
        const parallelTasks = tasks.slice(1, -1);
        
        const tasksPerGroup = Math.ceil(parallelTasks.length / forkJoinGroups);
        
        // Fork: source connects to first task of each group
        for (let g = 0; g < forkJoinGroups; g++) {
            const groupStart = g * tasksPerGroup;
            if (groupStart < parallelTasks.length) {
                try {
                    schedule.connectTasks(source.id, parallelTasks[groupStart].id);
                } catch (e) {}
            }
        }
        
        // Within each group, create chains
        for (let g = 0; g < forkJoinGroups; g++) {
            const groupStart = g * tasksPerGroup;
            const groupEnd = Math.min(groupStart + tasksPerGroup, parallelTasks.length);
            
            for (let i = groupStart; i < groupEnd - 1; i++) {
                try {
                    schedule.connectTasks(parallelTasks[i].id, parallelTasks[i + 1].id);
                } catch (e) {}
            }
        }
        
        // Join: last task of each group connects to sink
        for (let g = 0; g < forkJoinGroups; g++) {
            const groupStart = g * tasksPerGroup;
            const groupEnd = Math.min(groupStart + tasksPerGroup, parallelTasks.length);
            if (groupEnd > 0) {
                try {
                    schedule.connectTasks(parallelTasks[groupEnd - 1].id, sink.id);
                } catch (e) {}
            }
        }
    }
    
    createRandomDAG(schedule, tasks) {
        const { density } = this.config;
        const n = tasks.length;
        
        if (n < 2) return;
        
        // Calculate maximum possible edges in a DAG
        const maxEdges = (n * (n - 1)) / 2;
        const targetEdges = Math.floor(maxEdges * density);
        
        let edgesAdded = 0;
        const attempts = targetEdges * 3; // Limit attempts to avoid infinite loops
        
        for (let attempt = 0; attempt < attempts && edgesAdded < targetEdges; attempt++) {
            const i = Math.floor(Math.random() * n);
            const j = Math.floor(Math.random() * n);
            
            if (i !== j) {
                try {
                    schedule.connectTasks(tasks[i].id, tasks[j].id);
                    edgesAdded++;
                } catch (e) {
                    // Skip if circular dependency or already exists
                }
            }
        }
    }
    
    createLayered(schedule, tasks) {
        const { layers } = this.config;
        
        if (tasks.length === 0) return;
        
        const tasksPerLayer = Math.ceil(tasks.length / layers);
        
        for (let layer = 0; layer < layers - 1; layer++) {
            const currentLayerStart = layer * tasksPerLayer;
            const currentLayerEnd = Math.min(currentLayerStart + tasksPerLayer, tasks.length);
            const nextLayerStart = currentLayerEnd;
            const nextLayerEnd = Math.min(nextLayerStart + tasksPerLayer, tasks.length);
            
            if (nextLayerStart >= tasks.length) break;
            
            const currentLayer = tasks.slice(currentLayerStart, currentLayerEnd);
            const nextLayer = tasks.slice(nextLayerStart, nextLayerEnd);
            
            // Each task in current layer connects to 1-3 tasks in next layer
            currentLayer.forEach(fromTask => {
                const numConnections = Math.min(
                    Math.floor(Math.random() * 3) + 1,
                    nextLayer.length
                );
                
                const selectedIndices = new Set();
                while (selectedIndices.size < numConnections) {
                    selectedIndices.add(Math.floor(Math.random() * nextLayer.length));
                }
                
                selectedIndices.forEach(idx => {
                    try {
                        schedule.connectTasks(fromTask.id, nextLayer[idx].id);
                    } catch (e) {
                        console.warn(`Could not connect ${fromTask.id} to ${nextLayer[idx].id}`);
                    }
                });
            });
        }
    }
    
    /**
     * Utility methods
     */
    
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

/**
 * Preset configurations for common test scenarios
 */
export const PRESETS = {
    small: small,
    constantPeriod: constantPeriod,
    medium: medium,
    largeSparse: largeSparse,
    largeDense: largeDense,
    pipeline: pipeline,
    highUtilization: highUtilization
};

/**
 * Example usage:
 * 
 * // Use a preset
 * const generator = new TaskGenerator(PRESETS.medium);
 * const schedule = generator.generate();
 * 
 * // Custom configuration
 * const customGenerator = new TaskGenerator({
 *     numTasks: 50,
 *     graphType: 'random',
 *     density: 0.3,
 *     targetUtilization: 0.75,
 *     C: { strategy: 'bimodal', modes: [
 *         { weight: 0.7, min: 1, max: 5 },
 *         { weight: 0.3, min: 8, max: 15 }
 *     ]},
 *     T: { strategy: 'harmonic', values: [10, 20, 40, 80, 160] }
 * });
 * const customSchedule = customGenerator.generate();
 * 
 * // Get graph representation
 * const { tasks, precedences } = schedule.toGraph();
 */