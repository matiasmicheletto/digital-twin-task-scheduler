import Schedule from "./schedule";

/**
 * Graph Layout Algorithms for Task Visualization
 * Provides automatic positioning for task graphs
 */

export default class GraphLayout {
    constructor(config = {}) {
        this.config = {
            width: 1200,
            height: 800,
            nodeRadius: 40, // For circular nodes (if using rectangles, add nodeWidth/nodeHeight)
            horizontalSpacing: 150,
            verticalSpacing: 100,
            marginX: 100,
            marginY: 80,
            ...config
        };
    }

    /**
     * Apply layout to a schedule
     * @param {Schedule} schedule - The schedule to layout
     * @param {string} algorithm - 'hierarchical', 'force', 'circular', 'grid'
     */
    applyLayout(schedule, algorithm = 'hierarchical') {
        const { tasks, precedences } = schedule.toGraph();
        
        let positions;
        switch (algorithm) {
            case 'hierarchical':
                positions = this.hierarchicalLayout(tasks, precedences);
                break;
            case 'force':
                positions = this.forceDirectedLayout(tasks, precedences);
                break;
            case 'circular':
                positions = this.circularLayout(tasks, precedences);
                break;
            case 'grid':
                positions = this.gridLayout(tasks);
                break;
            default:
                positions = this.hierarchicalLayout(tasks, precedences);
        }
        
        // Apply positions to tasks
        tasks.forEach(task => {
            const pos = positions.get(task.id);
            if (pos) {
                task.position = pos;
            }
        });
        
        return positions;
    }

    /**
     * Hierarchical (Layered) Layout - Best for DAGs
     * Places tasks in layers based on their topological order
     */
    hierarchicalLayout(tasks, precedences) {
        const positions = new Map();
        
        // Build adjacency lists
        const successors = new Map();
        const predecessors = new Map();
        
        tasks.forEach(task => {
            successors.set(task.id, []);
            predecessors.set(task.id, []);
        });
        
        precedences.forEach(edge => {
            successors.get(edge.from).push(edge.to);
            predecessors.get(edge.to).push(edge.from);
        });
        
        // Assign layers using longest path algorithm
        const layers = this.assignLayers(tasks, successors, predecessors);
        
        // Position tasks within layers
        const { width, height, horizontalSpacing, verticalSpacing, marginX, marginY } = this.config;
        
        const numLayers = Math.max(...layers.values()) + 1;
        const layerHeight = (height - 2 * marginY) / Math.max(numLayers - 1, 1);
        
        // Group tasks by layer
        const tasksByLayer = new Map();
        for (let i = 0; i < numLayers; i++) {
            tasksByLayer.set(i, []);
        }
        
        tasks.forEach(task => {
            const layer = layers.get(task.id);
            tasksByLayer.get(layer).push(task);
        });
        
        // Apply barycenter heuristic for crossing reduction
        this.reduceCrossings(tasksByLayer, successors, predecessors, numLayers);
        
        // Position nodes
        tasksByLayer.forEach((layerTasks, layerIndex) => {
            const numInLayer = layerTasks.length;
            const layerWidth = (width - 2 * marginX) / Math.max(numInLayer - 1, 1);
            
            layerTasks.forEach((task, indexInLayer) => {
                const x = numInLayer === 1 
                    ? width / 2 
                    : marginX + indexInLayer * layerWidth;
                const y = marginY + layerIndex * layerHeight;
                
                positions.set(task.id, { x, y });
            });
        });
        
        return positions;
    }

    /**
     * Assign tasks to layers based on longest path from sources
     */
    assignLayers(tasks, successors, predecessors) {
        const layers = new Map();
        const visited = new Set();
        
        // Initialize all tasks to layer 0
        tasks.forEach(task => layers.set(task.id, 0));
        
        // Find source nodes (no predecessors)
        const sources = tasks.filter(task => 
            predecessors.get(task.id).length === 0
        );
        
        // BFS to assign layers
        const queue = [...sources.map(t => t.id)];
        visited.clear();
        
        while (queue.length > 0) {
            const taskId = queue.shift();
            if (visited.has(taskId)) continue;
            visited.add(taskId);
            
            const currentLayer = layers.get(taskId);
            
            successors.get(taskId).forEach(succId => {
                const newLayer = currentLayer + 1;
                if (newLayer > layers.get(succId)) {
                    layers.set(succId, newLayer);
                }
                queue.push(succId);
            });
        }
        
        return layers;
    }

    /**
     * Reduce edge crossings using barycenter heuristic
     */
    reduceCrossings(tasksByLayer, successors, predecessors, numLayers) {
        const iterations = 3;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Forward pass (top to bottom)
            for (let layer = 1; layer < numLayers; layer++) {
                const layerTasks = tasksByLayer.get(layer);
                
                layerTasks.forEach(task => {
                    const preds = predecessors.get(task.id);
                    if (preds.length > 0) {
                        const prevLayer = tasksByLayer.get(layer - 1);
                        const positions = preds.map(predId => 
                            prevLayer.findIndex(t => t.id === predId)
                        );
                        task._barycenter = positions.reduce((a, b) => a + b, 0) / positions.length;
                    } else {
                        task._barycenter = layerTasks.indexOf(task);
                    }
                });
                
                layerTasks.sort((a, b) => (a._barycenter || 0) - (b._barycenter || 0));
            }
            
            // Backward pass (bottom to top)
            for (let layer = numLayers - 2; layer >= 0; layer--) {
                const layerTasks = tasksByLayer.get(layer);
                
                layerTasks.forEach(task => {
                    const succs = successors.get(task.id);
                    if (succs.length > 0) {
                        const nextLayer = tasksByLayer.get(layer + 1);
                        const positions = succs.map(succId => 
                            nextLayer.findIndex(t => t.id === succId)
                        );
                        task._barycenter = positions.reduce((a, b) => a + b, 0) / positions.length;
                    } else {
                        task._barycenter = layerTasks.indexOf(task);
                    }
                });
                
                layerTasks.sort((a, b) => (a._barycenter || 0) - (b._barycenter || 0));
            }
        }
    }

    /**
     * Force-Directed Layout - Good for general graphs
     * Uses a physics simulation to position nodes
     */
    forceDirectedLayout(tasks, precedences, iterations = 100) {
        const positions = new Map();
        const velocities = new Map();
        
        const { width, height } = this.config;
        
        // Initialize random positions
        tasks.forEach(task => {
            positions.set(task.id, {
                x: width / 2 + (Math.random() - 0.5) * width * 0.5,
                y: height / 2 + (Math.random() - 0.5) * height * 0.5
            });
            velocities.set(task.id, { x: 0, y: 0 });
        });
        
        // Build edge map
        const edges = new Set();
        precedences.forEach(edge => {
            edges.add(`${edge.from}-${edge.to}`);
        });
        
        // Simulation parameters
        const k = Math.sqrt((width * height) / tasks.length); // Optimal distance
        const repulsionStrength = k * k;
        const attractionStrength = 0.1;
        const damping = 0.9;
        
        // Run simulation
        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map();
            tasks.forEach(task => forces.set(task.id, { x: 0, y: 0 }));
            
            // Repulsive forces between all pairs
            for (let i = 0; i < tasks.length; i++) {
                for (let j = i + 1; j < tasks.length; j++) {
                    const task1 = tasks[i];
                    const task2 = tasks[j];
                    
                    const pos1 = positions.get(task1.id);
                    const pos2 = positions.get(task2.id);
                    
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const force = repulsionStrength / (distance * distance);
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    const f1 = forces.get(task1.id);
                    const f2 = forces.get(task2.id);
                    
                    f1.x -= fx;
                    f1.y -= fy;
                    f2.x += fx;
                    f2.y += fy;
                }
            }
            
            // Attractive forces for edges
            precedences.forEach(edge => {
                const pos1 = positions.get(edge.from);
                const pos2 = positions.get(edge.to);
                
                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                
                const force = attractionStrength * (distance - k);
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                const f1 = forces.get(edge.from);
                const f2 = forces.get(edge.to);
                
                f1.x += fx;
                f1.y += fy;
                f2.x -= fx;
                f2.y -= fy;
            });
            
            // Update positions
            const temperature = 1 - (iter / iterations);
            tasks.forEach(task => {
                const pos = positions.get(task.id);
                const vel = velocities.get(task.id);
                const force = forces.get(task.id);
                
                vel.x = (vel.x + force.x) * damping;
                vel.y = (vel.y + force.y) * damping;
                
                pos.x += vel.x * temperature;
                pos.y += vel.y * temperature;
                
                // Keep within bounds
                pos.x = Math.max(50, Math.min(width - 50, pos.x));
                pos.y = Math.max(50, Math.min(height - 50, pos.y));
            });
        }
        
        return positions;
    }

    /**
     * Circular Layout - Places nodes in a circle
     */
    circularLayout(tasks, precedences) {
        const positions = new Map();
        const { width, height } = this.config;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        tasks.forEach((task, index) => {
            const angle = (2 * Math.PI * index) / tasks.length - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            positions.set(task.id, { x, y });
        });
        
        return positions;
    }

    /**
     * Grid Layout - Simple grid arrangement
     */
    gridLayout(tasks) {
        const positions = new Map();
        const { width, height, marginX, marginY } = this.config;
        
        const cols = Math.ceil(Math.sqrt(tasks.length));
        const rows = Math.ceil(tasks.length / cols);
        
        const cellWidth = (width - 2 * marginX) / cols;
        const cellHeight = (height - 2 * marginY) / rows;
        
        tasks.forEach((task, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = marginX + col * cellWidth + cellWidth / 2;
            const y = marginY + row * cellHeight + cellHeight / 2;
            
            positions.set(task.id, { x, y });
        });
        
        return positions;
    }
}

/**
 * Example usage:
 * 
 * // Create layout engine
 * const layout = new GraphLayout({
 *     width: 1200,
 *     height: 800,
 *     horizontalSpacing: 150,
 *     verticalSpacing: 100
 * });
 * 
 * // Apply hierarchical layout (best for DAGs)
 * layout.applyLayout(schedule, 'hierarchical');
 * 
 * // Or try other layouts
 * layout.applyLayout(schedule, 'force');
 * layout.applyLayout(schedule, 'circular');
 * layout.applyLayout(schedule, 'grid');
 * 
 * // The task positions are now automatically set
 * const { tasks } = schedule.toGraph();
 * tasks.forEach(task => {
 *     console.log(`${task.id}: (${task.position.x}, ${task.position.y})`);
 * });
 */